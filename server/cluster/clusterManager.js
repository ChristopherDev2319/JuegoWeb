/**
 * ClusterManager - Gestiona el ciclo de vida de los workers del cluster
 * 
 * Este módulo implementa el proceso master que:
 * - Crea y gestiona workers
 * - Maneja eventos de exit de workers
 * - Implementa shutdown graceful
 * - Coordina la comunicación IPC
 * - Registra métricas periódicamente (Requirement 5.1)
 * - Registra advertencias de memoria alta (Requirement 5.2)
 * - Registra reinicios de workers (Requirement 5.3)
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3
 */

import cluster from 'cluster';
import { CLUSTER_CONFIG, validateClusterConfig, getSystemInfo } from './config.js';
import { validateIPCMessage, IPCMessageType } from './ipcHandler.js';
import { getClusterLogger } from './clusterLogger.js';
import { DistributedMatchmaking } from './distributedMatchmaking.js';
import { StatusEndpoint } from './statusEndpoint.js';

/**
 * Estados posibles de un worker
 */
const WorkerStatus = {
  ACTIVE: 'active',
  DRAINING: 'draining',
  DEAD: 'dead'
};

/**
 * ClusterManager - Gestiona el cluster de workers
 */
class ClusterManager {
  constructor() {
    /** @type {Map<number, WorkerInfo>} */
    this.workers = new Map();
    
    /** @type {boolean} */
    this.isShuttingDown = false;
    
    /** @type {number} */
    this.numWorkers = CLUSTER_CONFIG.numWorkers;
    
    /** @type {number} */
    this.maxRoomsPerWorker = CLUSTER_CONFIG.maxRoomsPerWorker;
    
    /** @type {number} */
    this.maxPlayersPerWorker = CLUSTER_CONFIG.maxPlayersPerWorker;
    
    /** @type {Function|null} */
    this.onWorkerMessage = null;
    
    /** @type {number|null} */
    this.metricsLogInterval = null;
    
    /** @type {ClusterLogger} */
    this.logger = getClusterLogger();
    
    /** @type {DistributedMatchmaking|null} */
    this.distributedMatchmaking = null;
    
    /** @type {StatusEndpoint|null} */
    this.statusEndpoint = null;
  }

  /**
   * Inicializa el cluster creando todos los workers
   * Requirement 1.1: Crear workers al iniciar
   */
  initialize() {
    // Validar configuración antes de iniciar
    const validation = validateClusterConfig();
    if (!validation.isValid) {
      this.logger.error('[CLUSTER] Invalid configuration', { errors: validation.errors });
      throw new Error(`Invalid cluster configuration: ${validation.errors.join(', ')}`);
    }

    const systemInfo = getSystemInfo();
    this.logger.logClusterStart(systemInfo);
    console.log('[CLUSTER] System info:', JSON.stringify(systemInfo, null, 2));
    console.log(`[CLUSTER] Initializing cluster with ${this.numWorkers} workers...`);

    // Configurar handlers de eventos del cluster
    this._setupClusterEvents();

    // Crear workers
    for (let i = 0; i < this.numWorkers; i++) {
      this.createWorker();
    }

    // Configurar handlers de señales para shutdown graceful
    this._setupSignalHandlers();
    
    // Iniciar logging periódico de métricas (Requirement 5.1)
    this._startMetricsLogging();
    
    // Inicializar matchmaking distribuido (Requirement 3.3)
    this.distributedMatchmaking = new DistributedMatchmaking(this.workers);
    
    // Iniciar endpoint de estado del cluster (Requirement 5.4)
    this.statusEndpoint = new StatusEndpoint(this);
    this.statusEndpoint.start();

    console.log(`[CLUSTER] Master process ${process.pid} started`);
  }


  /**
   * Crea un nuevo worker
   * Requirement 1.1: Crear procesos worker
   * @returns {cluster.Worker} El worker creado
   */
  createWorker() {
    const worker = cluster.fork();
    
    const workerInfo = {
      id: worker.id,
      pid: worker.process.pid,
      status: WorkerStatus.ACTIVE,
      rooms: 0,
      players: 0,
      lastHeartbeat: Date.now(),
      memoryUsage: 0,
      startTime: Date.now()
    };
    
    this.workers.set(worker.id, workerInfo);
    
    // Configurar handler de mensajes IPC para este worker
    worker.on('message', (message) => {
      this._handleWorkerMessage(worker.id, message);
    });
    
    // Log worker creation (Requirement 5.3)
    this.logger.logWorkerCreated(worker.id, worker.process.pid);
    console.log(`[CLUSTER] Worker ${worker.id} (PID: ${worker.process.pid}) created`);
    
    return worker;
  }

  /**
   * Configura los eventos del cluster
   * @private
   */
  _setupClusterEvents() {
    // Requirement 1.2: Manejar exit de workers
    cluster.on('exit', (worker, code, signal) => {
      this.handleWorkerExit(worker, code, signal);
    });

    cluster.on('online', (worker) => {
      this.logger.logWorkerOnline(worker.id);
      console.log(`[CLUSTER] Worker ${worker.id} is online`);
    });

    cluster.on('disconnect', (worker) => {
      console.log(`[CLUSTER] Worker ${worker.id} disconnected`);
    });
  }

  /**
   * Maneja el evento de exit de un worker
   * Requirement 1.2: Crear worker de reemplazo en menos de 5 segundos
   * Requirement 5.3: Registrar reinicios con timestamp y razón
   * @param {cluster.Worker} worker - Worker que terminó
   * @param {number} code - Código de salida
   * @param {string} signal - Señal que causó la terminación
   */
  handleWorkerExit(worker, code, signal) {
    const workerInfo = this.workers.get(worker.id);
    const reason = signal ? `signal ${signal}` : `code ${code}`;
    
    // Log worker exit (Requirement 5.3)
    this.logger.logWorkerExit(worker.id, code, signal);
    console.log(`[CLUSTER] Worker ${worker.id} died (${reason})`);
    
    // Actualizar estado del worker
    if (workerInfo) {
      workerInfo.status = WorkerStatus.DEAD;
    }
    
    // Eliminar worker del mapa
    const oldWorkerId = worker.id;
    this.workers.delete(worker.id);
    
    // Si no estamos en shutdown, crear worker de reemplazo
    if (!this.isShuttingDown) {
      console.log(`[CLUSTER] Creating replacement worker...`);
      
      // Crear worker de reemplazo después de un breve delay
      setTimeout(() => {
        if (!this.isShuttingDown) {
          const newWorker = this.createWorker();
          // Log worker restart (Requirement 5.3)
          this.logger.logWorkerRestart(oldWorkerId, newWorker.id, reason);
          console.log(`[CLUSTER] Replacement worker ${newWorker.id} created for worker ${oldWorkerId}`);
        }
      }, CLUSTER_CONFIG.workerRestartDelay);
    }
  }

  /**
   * Maneja mensajes IPC de los workers
   * @private
   * @param {number} workerId - ID del worker
   * @param {Object} message - Mensaje recibido
   */
  _handleWorkerMessage(workerId, message) {
    if (!message || !message.type) return;
    
    // Validar formato del mensaje (Requirement 3.4)
    const validation = validateIPCMessage(message);
    if (!validation.isValid) {
      console.warn(`[CLUSTER] Invalid IPC message from worker ${workerId}:`, validation.errors);
      return;
    }
    
    const workerInfo = this.workers.get(workerId);
    if (!workerInfo) return;
    
    switch (message.type) {
      case 'metrics':
        // Actualizar métricas del worker
        workerInfo.rooms = message.data.rooms || 0;
        workerInfo.players = message.data.players || 0;
        workerInfo.memoryUsage = message.data.memoryUsage || 0;
        workerInfo.lastHeartbeat = Date.now();
        
        // Requirement 5.2: Advertencia de memoria alta
        if (workerInfo.memoryUsage > CLUSTER_CONFIG.memoryWarningThreshold) {
          const memPercent = workerInfo.memoryUsage * 100;
          this.logger.logMemoryWarning(workerId, memPercent);
          console.warn(`[CLUSTER] WARNING: Worker ${workerId} memory usage at ${memPercent.toFixed(1)}%`);
        }
        break;
        
      case 'roomCreated':
        workerInfo.rooms++;
        this.logger.logRoomCreated(workerId, message.data.roomId, workerInfo.rooms);
        break;
        
      case 'roomDeleted':
        workerInfo.rooms = Math.max(0, workerInfo.rooms - 1);
        this.logger.logRoomDeleted(workerId, message.data.roomId, workerInfo.rooms);
        break;
        
      case 'playerJoined':
        workerInfo.players++;
        break;
        
      case 'playerLeft':
        workerInfo.players = Math.max(0, workerInfo.players - 1);
        break;
        
      case 'roomsResponse':
        // Requirement 3.3: Manejar respuesta de salas disponibles
        if (this.distributedMatchmaking) {
          this.distributedMatchmaking.handleRoomsResponse(message);
        }
        break;
    }
    
    // Llamar callback externo si está configurado
    if (this.onWorkerMessage) {
      this.onWorkerMessage(workerId, message);
    }
  }


  /**
   * Inicia el logging periódico de métricas
   * Requirement 5.1: Escribir métricas de cada worker al log cada 30 segundos
   * @private
   */
  _startMetricsLogging() {
    this.metricsLogInterval = setInterval(() => {
      this._logClusterMetrics();
    }, CLUSTER_CONFIG.metricsInterval);
    
    console.log(`[CLUSTER] Metrics logging started (interval: ${CLUSTER_CONFIG.metricsInterval}ms)`);
  }

  /**
   * Detiene el logging de métricas
   * @private
   */
  _stopMetricsLogging() {
    if (this.metricsLogInterval) {
      clearInterval(this.metricsLogInterval);
      this.metricsLogInterval = null;
    }
  }

  /**
   * Registra las métricas del cluster en el log
   * Requirement 5.1: Escribir métricas de cada worker
   * @private
   */
  _logClusterMetrics() {
    const stats = this.getClusterStats();
    
    // Log to file using logger (Requirement 5.1)
    this.logger.logMetrics(stats);
    
    // Also log to console for visibility
    console.log('[CLUSTER] === Cluster Metrics ===');
    console.log(`[CLUSTER] Total Workers: ${stats.totalWorkers} (Active: ${stats.activeWorkers})`);
    console.log(`[CLUSTER] Total Rooms: ${stats.totalRooms}`);
    console.log(`[CLUSTER] Total Players: ${stats.totalPlayers}`);
    
    for (const worker of stats.workersStats) {
      const memPercent = (worker.memoryUsage * 100).toFixed(1);
      console.log(`[CLUSTER] Worker ${worker.id}: ${worker.rooms} rooms, ${worker.players} players, ${memPercent}% memory`);
    }
    
    console.log('[CLUSTER] =========================');
  }

  /**
   * Configura handlers para señales de sistema
   * Requirement 1.3: Manejar SIGINT y SIGTERM
   * @private
   */
  _setupSignalHandlers() {
    process.on('SIGINT', () => {
      console.log('\n[CLUSTER] Received SIGINT');
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      console.log('[CLUSTER] Received SIGTERM');
      this.shutdown();
    });
  }

  /**
   * Realiza shutdown graceful del cluster
   * Requirements 1.3, 1.4: Shutdown graceful con timeout
   * @returns {Promise<void>}
   */
  async shutdown() {
    if (this.isShuttingDown) {
      console.log('[CLUSTER] Shutdown already in progress');
      return;
    }
    
    this.isShuttingDown = true;
    this.logger.logClusterShutdown('Signal received');
    console.log('[CLUSTER] Initiating graceful shutdown...');
    
    // Detener logging de métricas
    this._stopMetricsLogging();
    
    // Detener endpoint de estado (Requirement 5.4)
    if (this.statusEndpoint) {
      await this.statusEndpoint.stop();
    }
    
    // Enviar señal de cierre a todos los workers
    this.broadcastToWorkers({ type: 'shutdown', timestamp: Date.now() });
    
    // Marcar todos los workers como draining
    for (const workerInfo of this.workers.values()) {
      workerInfo.status = WorkerStatus.DRAINING;
    }
    
    // Esperar a que los workers terminen o timeout
    try {
      await Promise.race([
        this._waitForWorkersToExit(),
        this._shutdownTimeout()
      ]);
    } catch (error) {
      console.log(`[CLUSTER] Shutdown: ${error.message}`);
    }
    
    // Forzar cierre de workers que no terminaron
    this._forceKillRemainingWorkers();
    
    // Cerrar logger
    this.logger.close();
    
    console.log('[CLUSTER] Shutdown complete');
    process.exit(0);
  }

  /**
   * Espera a que todos los workers terminen
   * @private
   * @returns {Promise<void>}
   */
  _waitForWorkersToExit() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const activeWorkers = this.getActiveWorkerCount();
        if (activeWorkers === 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Timeout para el shutdown
   * @private
   * @returns {Promise<void>}
   */
  _shutdownTimeout() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Shutdown timeout reached'));
      }, CLUSTER_CONFIG.shutdownTimeout);
    });
  }

  /**
   * Fuerza el cierre de workers que no terminaron
   * @private
   */
  _forceKillRemainingWorkers() {
    for (const [workerId, worker] of Object.entries(cluster.workers || {})) {
      if (worker && !worker.isDead()) {
        console.log(`[CLUSTER] Force killing worker ${workerId}`);
        worker.kill('SIGKILL');
      }
    }
  }

  /**
   * Envía un mensaje a todos los workers
   * @param {Object} message - Mensaje a enviar
   */
  broadcastToWorkers(message) {
    for (const [workerId, worker] of Object.entries(cluster.workers || {})) {
      if (worker && !worker.isDead()) {
        worker.send(message);
      }
    }
  }

  /**
   * Envía un mensaje a un worker específico
   * @param {number} workerId - ID del worker
   * @param {Object} message - Mensaje a enviar
   * @returns {boolean} true si se envió correctamente
   */
  sendToWorker(workerId, message) {
    const worker = cluster.workers[workerId];
    if (worker && !worker.isDead()) {
      worker.send(message);
      return true;
    }
    return false;
  }

  /**
   * Obtiene estadísticas del cluster
   * @returns {ClusterStats}
   */
  getClusterStats() {
    const workersStats = [];
    let totalRooms = 0;
    let totalPlayers = 0;
    let activeWorkers = 0;
    
    for (const workerInfo of this.workers.values()) {
      workersStats.push({ ...workerInfo });
      // rooms y players pueden ser objetos con .total o números directos
      const roomCount = typeof workerInfo.rooms === 'object' ? (workerInfo.rooms.total || 0) : (workerInfo.rooms || 0);
      const playerCount = typeof workerInfo.players === 'object' ? (workerInfo.players.total || 0) : (workerInfo.players || 0);
      totalRooms += roomCount;
      totalPlayers += playerCount;
      if (workerInfo.status === WorkerStatus.ACTIVE) {
        activeWorkers++;
      }
    }
    
    return {
      totalWorkers: this.workers.size,
      activeWorkers,
      totalRooms,
      totalPlayers,
      workersStats
    };
  }

  /**
   * Obtiene el número de workers activos
   * @returns {number}
   */
  getActiveWorkerCount() {
    let count = 0;
    for (const [, workerInfo] of this.workers) {
      if (workerInfo.status === WorkerStatus.ACTIVE) {
        count++;
      }
    }
    return count;
  }

  /**
   * Obtiene información de un worker específico
   * @param {number} workerId - ID del worker
   * @returns {WorkerInfo|null}
   */
  getWorkerInfo(workerId) {
    return this.workers.get(workerId) || null;
  }

  /**
   * Actualiza las métricas de un worker
   * @param {number} workerId - ID del worker
   * @param {Object} metrics - Métricas a actualizar
   */
  updateWorkerMetrics(workerId, metrics) {
    const workerInfo = this.workers.get(workerId);
    if (workerInfo) {
      if (metrics.rooms !== undefined) workerInfo.rooms = metrics.rooms;
      if (metrics.players !== undefined) workerInfo.players = metrics.players;
      if (metrics.memoryUsage !== undefined) workerInfo.memoryUsage = metrics.memoryUsage;
      workerInfo.lastHeartbeat = Date.now();
    }
  }

  /**
   * Consulta todas las salas disponibles en el cluster
   * Requirement 3.3: Consultar disponibilidad en todos los workers
   * @returns {Promise<Array>} Lista de salas disponibles
   */
  async queryAllAvailableRooms() {
    if (!this.distributedMatchmaking) {
      return [];
    }
    return this.distributedMatchmaking.queryAllAvailableRooms();
  }

  /**
   * Encuentra la mejor sala en todo el cluster
   * Requirement 3.3: Seleccionar sala óptima considerando todos los workers
   * @returns {Promise<Object|null>} Información de la mejor sala
   */
  async findBestRoom() {
    if (!this.distributedMatchmaking) {
      return null;
    }
    return this.distributedMatchmaking.findBestRoom();
  }

  /**
   * Obtiene el worker óptimo para crear una nueva sala
   * @returns {number|null} ID del worker óptimo
   */
  getOptimalWorkerForNewRoom() {
    if (!this.distributedMatchmaking) {
      return null;
    }
    return this.distributedMatchmaking.getOptimalWorkerForNewRoom();
  }

  /**
   * Obtiene estadísticas de matchmaking del cluster
   * @returns {Object} Estadísticas del cluster
   */
  getMatchmakingStats() {
    if (!this.distributedMatchmaking) {
      return {
        totalRooms: 0,
        totalPlayers: 0,
        availableWorkers: 0,
        totalWorkers: 0
      };
    }
    return this.distributedMatchmaking.getClusterMatchmakingStats();
  }
}

// Exportar clase y constantes
export { ClusterManager, WorkerStatus };
export default ClusterManager;
