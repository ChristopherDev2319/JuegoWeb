/**
 * ClusterLogger - Sistema de logging para el cluster
 * 
 * Este módulo implementa:
 * - Registro de métricas cada 30 segundos (Requirement 5.1)
 * - Registro de advertencias de memoria alta (Requirement 5.2)
 * - Registro de reinicios de workers (Requirement 5.3)
 * 
 * Requirements: 5.1, 5.2, 5.3
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CLUSTER_CONFIG } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Niveles de log
 */
export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

/**
 * Tipos de eventos del cluster
 */
export const ClusterEventType = {
  CLUSTER_START: 'CLUSTER_START',
  CLUSTER_SHUTDOWN: 'CLUSTER_SHUTDOWN',
  WORKER_CREATED: 'WORKER_CREATED',
  WORKER_ONLINE: 'WORKER_ONLINE',
  WORKER_EXIT: 'WORKER_EXIT',
  WORKER_RESTART: 'WORKER_RESTART',
  METRICS_REPORT: 'METRICS_REPORT',
  MEMORY_WARNING: 'MEMORY_WARNING',
  ROOM_CREATED: 'ROOM_CREATED',
  ROOM_DELETED: 'ROOM_DELETED',
  PLAYER_JOINED: 'PLAYER_JOINED',
  PLAYER_LEFT: 'PLAYER_LEFT'
};

/**
 * ClusterLogger - Sistema de logging centralizado para el cluster
 */
class ClusterLogger {
  constructor(options = {}) {
    /** @type {string} Directorio de logs */
    this.logDir = options.logDir || path.join(__dirname, '../../logs');
    
    /** @type {boolean} Escribir a archivo */
    this.writeToFile = options.writeToFile !== false;
    
    /** @type {boolean} Escribir a consola */
    this.writeToConsole = options.writeToConsole !== false;
    
    /** @type {string} Nivel mínimo de log */
    this.minLevel = options.minLevel || LogLevel.INFO;
    
    /** @type {WriteStream|null} Stream de archivo */
    this.fileStream = null;
    
    /** @type {string} Nombre del archivo actual */
    this.currentLogFile = null;
    
    // Inicializar directorio de logs
    this._ensureLogDirectory();
  }

  /**
   * Asegura que el directorio de logs existe
   * @private
   */
  _ensureLogDirectory() {
    if (this.writeToFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Obtiene el nombre del archivo de log para hoy
   * @private
   * @returns {string}
   */
  _getLogFileName() {
    const date = new Date().toISOString().split('T')[0];
    return `cluster-${date}.log`;
  }

  /**
   * Abre o rota el archivo de log si es necesario
   * @private
   */
  _ensureFileStream() {
    if (!this.writeToFile) return;
    
    const fileName = this._getLogFileName();
    
    // Rotar archivo si cambió el día
    if (this.currentLogFile !== fileName) {
      if (this.fileStream) {
        this.fileStream.end();
      }
      
      const filePath = path.join(this.logDir, fileName);
      this.fileStream = fs.createWriteStream(filePath, { flags: 'a' });
      this.currentLogFile = fileName;
    }
  }

  /**
   * Formatea un mensaje de log
   * @private
   * @param {string} level - Nivel de log
   * @param {string} message - Mensaje
   * @param {Object} [data] - Datos adicionales
   * @returns {string}
   */
  _formatMessage(level, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      pid: process.pid,
      component: 'cluster',
      message
    };
    
    if (data) {
      Object.assign(logEntry, data);
    }
    
    return JSON.stringify(logEntry);
  }

  /**
   * Formatea un mensaje para consola (más legible)
   * @private
   * @param {string} level - Nivel de log
   * @param {string} message - Mensaje
   * @param {Object} [data] - Datos adicionales
   * @returns {string}
   */
  _formatConsoleMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] [${level}] ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      // Solo mostrar datos relevantes en consola
      const relevantData = { ...data };
      delete relevantData.event; // No mostrar tipo de evento en consola
      if (Object.keys(relevantData).length > 0) {
        formatted += ` ${JSON.stringify(relevantData)}`;
      }
    }
    
    return formatted;
  }

  /**
   * Escribe un mensaje de log
   * @private
   * @param {string} level - Nivel de log
   * @param {string} message - Mensaje
   * @param {Object} [data] - Datos adicionales
   */
  _write(level, message, data = null) {
    // Escribir a consola (formato legible)
    if (this.writeToConsole) {
      const consoleFormatted = this._formatConsoleMessage(level, message, data);
      switch (level) {
        case LogLevel.ERROR:
          console.error(consoleFormatted);
          break;
        case LogLevel.WARN:
          console.warn(consoleFormatted);
          break;
        default:
          console.log(consoleFormatted);
      }
    }
    
    // Escribir a archivo (formato JSON)
    if (this.writeToFile) {
      const fileFormatted = this._formatMessage(level, message, data);
      this._ensureFileStream();
      if (this.fileStream) {
        this.fileStream.write(fileFormatted + '\n');
      }
    }
  }

  /**
   * Log de nivel DEBUG
   * @param {string} message
   * @param {Object} [data]
   */
  debug(message, data = null) {
    this._write(LogLevel.DEBUG, message, data);
  }

  /**
   * Log de nivel INFO
   * @param {string} message
   * @param {Object} [data]
   */
  info(message, data = null) {
    this._write(LogLevel.INFO, message, data);
  }

  /**
   * Log de nivel WARN
   * @param {string} message
   * @param {Object} [data]
   */
  warn(message, data = null) {
    this._write(LogLevel.WARN, message, data);
  }

  /**
   * Log de nivel ERROR
   * @param {string} message
   * @param {Object} [data]
   */
  error(message, data = null) {
    this._write(LogLevel.ERROR, message, data);
  }

  // ==================== Métodos específicos del cluster ====================

  /**
   * Registra el inicio del cluster
   * @param {Object} systemInfo - Información del sistema
   */
  logClusterStart(systemInfo) {
    this.info('[CLUSTER] Cluster started', {
      event: ClusterEventType.CLUSTER_START,
      ...systemInfo
    });
  }

  /**
   * Registra el shutdown del cluster
   * @param {string} reason - Razón del shutdown
   */
  logClusterShutdown(reason) {
    this.info('[CLUSTER] Cluster shutting down', {
      event: ClusterEventType.CLUSTER_SHUTDOWN,
      reason
    });
  }

  /**
   * Registra la creación de un worker
   * Requirement 5.3: Registrar eventos de workers
   * @param {number} workerId - ID del worker
   * @param {number} pid - PID del proceso
   */
  logWorkerCreated(workerId, pid) {
    this.info(`[CLUSTER] Worker ${workerId} created`, {
      event: ClusterEventType.WORKER_CREATED,
      workerId,
      pid
    });
  }

  /**
   * Registra cuando un worker está online
   * @param {number} workerId - ID del worker
   */
  logWorkerOnline(workerId) {
    this.info(`[CLUSTER] Worker ${workerId} is online`, {
      event: ClusterEventType.WORKER_ONLINE,
      workerId
    });
  }

  /**
   * Registra la salida de un worker
   * Requirement 5.3: Registrar reinicios con timestamp y razón
   * @param {number} workerId - ID del worker
   * @param {number} code - Código de salida
   * @param {string} signal - Señal que causó la salida
   */
  logWorkerExit(workerId, code, signal) {
    const reason = signal ? `signal ${signal}` : `exit code ${code}`;
    
    this.warn(`[CLUSTER] Worker ${workerId} exited`, {
      event: ClusterEventType.WORKER_EXIT,
      workerId,
      code,
      signal,
      reason
    });
  }

  /**
   * Registra el reinicio de un worker
   * Requirement 5.3: Registrar reinicios con timestamp y razón
   * @param {number} oldWorkerId - ID del worker que murió
   * @param {number} newWorkerId - ID del nuevo worker
   * @param {string} reason - Razón del reinicio
   */
  logWorkerRestart(oldWorkerId, newWorkerId, reason) {
    this.info(`[CLUSTER] Worker ${oldWorkerId} replaced by ${newWorkerId}`, {
      event: ClusterEventType.WORKER_RESTART,
      oldWorkerId,
      newWorkerId,
      reason
    });
  }

  /**
   * Registra métricas del cluster
   * Requirement 5.1: Escribir métricas cada 30 segundos
   * @param {Object} stats - Estadísticas del cluster
   */
  logMetrics(stats) {
    this.info('[CLUSTER] Metrics report', {
      event: ClusterEventType.METRICS_REPORT,
      totalWorkers: stats.totalWorkers,
      activeWorkers: stats.activeWorkers,
      totalRooms: stats.totalRooms,
      totalPlayers: stats.totalPlayers,
      workers: stats.workersStats.map(w => ({
        id: w.id,
        rooms: w.rooms,
        players: w.players,
        memoryPercent: (w.memoryUsage * 100).toFixed(1)
      }))
    });
  }

  /**
   * Registra advertencia de memoria alta
   * Requirement 5.2: Registrar advertencia cuando excede 80%
   * @param {number} workerId - ID del worker
   * @param {number} memoryPercent - Porcentaje de memoria usado
   */
  logMemoryWarning(workerId, memoryPercent) {
    this.warn(`[CLUSTER] Worker ${workerId} high memory usage: ${memoryPercent.toFixed(1)}%`, {
      event: ClusterEventType.MEMORY_WARNING,
      workerId,
      memoryPercent,
      threshold: CLUSTER_CONFIG.memoryWarningThreshold * 100
    });
  }

  /**
   * Registra creación de sala
   * @param {number} workerId - ID del worker
   * @param {string} roomId - ID de la sala
   * @param {number} totalRooms - Total de salas en el worker
   */
  logRoomCreated(workerId, roomId, totalRooms) {
    this.debug(`[CLUSTER] Room created on worker ${workerId}`, {
      event: ClusterEventType.ROOM_CREATED,
      workerId,
      roomId,
      totalRooms
    });
  }

  /**
   * Registra eliminación de sala
   * @param {number} workerId - ID del worker
   * @param {string} roomId - ID de la sala
   * @param {number} totalRooms - Total de salas restantes
   */
  logRoomDeleted(workerId, roomId, totalRooms) {
    this.debug(`[CLUSTER] Room deleted on worker ${workerId}`, {
      event: ClusterEventType.ROOM_DELETED,
      workerId,
      roomId,
      totalRooms
    });
  }

  /**
   * Cierra el logger
   */
  close() {
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = null;
    }
  }
}

// Singleton para uso global
let loggerInstance = null;

/**
 * Obtiene la instancia singleton del ClusterLogger
 * @param {Object} [options] - Opciones de configuración
 * @returns {ClusterLogger}
 */
export function getClusterLogger(options) {
  if (!loggerInstance) {
    loggerInstance = new ClusterLogger(options);
  }
  return loggerInstance;
}

export { ClusterLogger };
export default ClusterLogger;
