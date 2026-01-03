/**
 * LoadBalancer - Distribuye conexiones entre workers usando sticky sessions
 * 
 * Este módulo implementa:
 * - Función de hash para sticky sessions (Requirements 4.1, 4.4)
 * - Selección de worker con menos carga (Requirement 2.1)
 * - Verificación de límites de recursos (Requirements 2.2, 6.1, 6.2)
 * 
 * Requirements: 2.1, 2.2, 4.1, 4.4, 6.1, 6.2
 */

import { CLUSTER_CONFIG } from './config.js';

/**
 * LoadBalancer - Gestiona la distribución de carga entre workers
 */
class LoadBalancer {
  /**
   * @param {Map<number, WorkerInfo>} workersMap - Referencia al mapa de workers del ClusterManager
   */
  constructor(workersMap) {
    /** @type {Map<number, WorkerInfo>} */
    this.workers = workersMap;
    
    /** @type {number} */
    this.maxRoomsPerWorker = CLUSTER_CONFIG.maxRoomsPerWorker;
    
    /** @type {number} */
    this.maxPlayersPerWorker = CLUSTER_CONFIG.maxPlayersPerWorker;
  }

  /**
   * Calcula un hash numérico a partir de un string (connectionId)
   * Usa el algoritmo djb2 para generar un hash consistente
   * 
   * Requirement 4.4: Usar hash del ID de conexión para determinar el worker
   * 
   * @param {string} str - String a hashear (connectionId)
   * @returns {number} Hash numérico positivo
   */
  hash(str) {
    if (!str || typeof str !== 'string') {
      return 0;
    }
    
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      // hash * 33 + char
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      // Mantener como entero de 32 bits
      hash = hash >>> 0;
    }
    return hash;
  }

  /**
   * Obtiene el worker asignado para una conexión usando sticky sessions
   * 
   * Requirement 4.1: Dirigir todas las solicitudes de un cliente al mismo worker
   * Requirement 4.4: Usar hash del ID de conexión
   * 
   * @param {string} connectionId - ID único de la conexión
   * @returns {number|null} ID del worker asignado, o null si no hay workers disponibles
   */
  getWorkerForConnection(connectionId) {
    const availableWorkers = this._getAvailableWorkerIds();
    
    if (availableWorkers.length === 0) {
      return null;
    }
    
    const hashValue = this.hash(connectionId);
    const index = hashValue % availableWorkers.length;
    
    return availableWorkers[index];
  }

  /**
   * Obtiene el worker con menos salas activas
   * 
   * Requirement 2.1: Asignar sala al worker con menos salas activas
   * 
   * @returns {number|null} ID del worker con menos carga, o null si no hay disponibles
   */
  getWorkerWithLeastRooms() {
    let selectedWorkerId = null;
    let minRooms = Infinity;
    
    for (const [workerId, workerInfo] of this.workers) {
      // Solo considerar workers disponibles
      if (!this.isWorkerAvailable(workerId)) {
        continue;
      }
      
      if (workerInfo.rooms < minRooms) {
        minRooms = workerInfo.rooms;
        selectedWorkerId = workerId;
      }
    }
    
    return selectedWorkerId;
  }

  /**
   * Verifica si un worker está disponible para recibir nuevas conexiones/salas
   * 
   * Requirement 2.2: Evitar asignar nuevas salas a worker con 15 salas
   * Requirement 6.1: Marcar worker como no disponible cuando alcanza 15 salas
   * Requirement 6.2: Rechazar nuevas conexiones cuando tiene 120 jugadores
   * 
   * @param {number} workerId - ID del worker a verificar
   * @returns {boolean} true si el worker puede recibir nuevas conexiones/salas
   */
  isWorkerAvailable(workerId) {
    const workerInfo = this.workers.get(workerId);
    
    if (!workerInfo) {
      return false;
    }
    
    // Worker debe estar activo
    if (workerInfo.status !== 'active') {
      return false;
    }
    
    // Verificar límite de salas (Requirement 6.1)
    if (workerInfo.rooms >= this.maxRoomsPerWorker) {
      return false;
    }
    
    // Verificar límite de jugadores (Requirement 6.2)
    if (workerInfo.players >= this.maxPlayersPerWorker) {
      return false;
    }
    
    return true;
  }

  /**
   * Verifica si un worker puede aceptar nuevas salas
   * 
   * Requirement 2.2: Evitar asignar nuevas salas a worker con 15 salas
   * 
   * @param {number} workerId - ID del worker
   * @returns {boolean} true si puede aceptar nuevas salas
   */
  canAcceptRooms(workerId) {
    const workerInfo = this.workers.get(workerId);
    
    if (!workerInfo || workerInfo.status !== 'active') {
      return false;
    }
    
    return workerInfo.rooms < this.maxRoomsPerWorker;
  }

  /**
   * Verifica si un worker puede aceptar nuevos jugadores
   * 
   * Requirement 6.2: Rechazar nuevas conexiones cuando tiene 120 jugadores
   * 
   * @param {number} workerId - ID del worker
   * @returns {boolean} true si puede aceptar nuevos jugadores
   */
  canAcceptPlayers(workerId) {
    const workerInfo = this.workers.get(workerId);
    
    if (!workerInfo || workerInfo.status !== 'active') {
      return false;
    }
    
    return workerInfo.players < this.maxPlayersPerWorker;
  }

  /**
   * Actualiza la carga de un worker
   * 
   * @param {number} workerId - ID del worker
   * @param {number} rooms - Número de salas activas
   * @param {number} players - Número de jugadores conectados
   */
  updateWorkerLoad(workerId, rooms, players) {
    const workerInfo = this.workers.get(workerId);
    
    if (workerInfo) {
      workerInfo.rooms = rooms;
      workerInfo.players = players;
    }
  }

  /**
   * Obtiene los IDs de workers disponibles ordenados por ID
   * 
   * @private
   * @returns {number[]} Array de IDs de workers disponibles
   */
  _getAvailableWorkerIds() {
    const available = [];
    
    for (const [workerId, workerInfo] of this.workers) {
      if (workerInfo.status === 'active' && 
          workerInfo.rooms < this.maxRoomsPerWorker &&
          workerInfo.players < this.maxPlayersPerWorker) {
        available.push(workerId);
      }
    }
    
    // Ordenar para consistencia en sticky sessions
    return available.sort((a, b) => a - b);
  }

  /**
   * Obtiene estadísticas del balanceador
   * 
   * @returns {Object} Estadísticas de carga
   */
  getLoadStats() {
    let totalRooms = 0;
    let totalPlayers = 0;
    let availableWorkers = 0;
    let unavailableWorkers = 0;
    
    for (const [workerId, workerInfo] of this.workers) {
      totalRooms += workerInfo.rooms;
      totalPlayers += workerInfo.players;
      
      if (this.isWorkerAvailable(workerId)) {
        availableWorkers++;
      } else {
        unavailableWorkers++;
      }
    }
    
    return {
      totalWorkers: this.workers.size,
      availableWorkers,
      unavailableWorkers,
      totalRooms,
      totalPlayers,
      maxRoomsPerWorker: this.maxRoomsPerWorker,
      maxPlayersPerWorker: this.maxPlayersPerWorker
    };
  }
}

export { LoadBalancer };
export default LoadBalancer;
