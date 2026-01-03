/**
 * MetricsReporter - Reporta métricas del worker al master
 * 
 * Este módulo implementa:
 * - Envío periódico de métricas cada 30 segundos (Requirement 5.1)
 * - Reporte de salas, jugadores y uso de memoria (Requirement 2.3)
 * 
 * Requirements: 2.3, 5.1
 */

import cluster from 'cluster';
import { CLUSTER_CONFIG } from './config.js';
import { createIPCMessage, IPCMessageType, getIPCHandler } from './ipcHandler.js';

/**
 * Obtiene las métricas de memoria del proceso actual
 * @returns {Object} Métricas de memoria
 */
export function getMemoryMetrics() {
  const memUsage = process.memoryUsage();
  return {
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external,
    rss: memUsage.rss,
    // Porcentaje de heap usado
    heapUsagePercent: memUsage.heapUsed / memUsage.heapTotal
  };
}

/**
 * MetricsReporter - Gestiona el reporte de métricas desde workers
 */
class MetricsReporter {
  /**
   * @param {Object} options - Opciones de configuración
   * @param {Function} options.getRoomCount - Función que retorna el número de salas
   * @param {Function} options.getPlayerCount - Función que retorna el número de jugadores
   * @param {Function} [options.getRoomIds] - Función que retorna los IDs de las salas
   */
  constructor(options = {}) {
    /** @type {Function} */
    this.getRoomCount = options.getRoomCount || (() => 0);
    
    /** @type {Function} */
    this.getPlayerCount = options.getPlayerCount || (() => 0);
    
    /** @type {Function} */
    this.getRoomIds = options.getRoomIds || (() => []);
    
    /** @type {number|null} */
    this.intervalId = null;
    
    /** @type {number} */
    this.reportInterval = CLUSTER_CONFIG.metricsInterval;
    
    /** @type {boolean} */
    this.isRunning = false;
    
    /** @type {IPCHandler} */
    this.ipcHandler = getIPCHandler();
  }

  /**
   * Inicia el reporte periódico de métricas
   * Requirement 5.1: Escribir métricas cada 30 segundos
   */
  start() {
    if (this.isRunning) {
      console.log('[METRICS] Reporter already running');
      return;
    }
    
    if (!cluster.isWorker) {
      console.error('[METRICS] MetricsReporter should only run in workers');
      return;
    }
    
    this.ipcHandler.initialize();
    this.isRunning = true;
    
    // Enviar métricas inmediatamente al iniciar
    this.reportMetrics();
    
    // Configurar intervalo para reportes periódicos
    this.intervalId = setInterval(() => {
      this.reportMetrics();
    }, this.reportInterval);
    
    console.log(`[METRICS] Reporter started (interval: ${this.reportInterval}ms)`);
  }

  /**
   * Detiene el reporte de métricas
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[METRICS] Reporter stopped');
  }

  /**
   * Recopila y envía métricas al master
   * Requirements 2.3, 5.1: Reportar salas, jugadores y memoria
   */
  reportMetrics() {
    if (!cluster.isWorker) return;
    
    const metrics = this.collectMetrics();
    const message = createIPCMessage(IPCMessageType.METRICS, metrics);
    
    const sent = this.ipcHandler.sendToMaster(message);
    
    if (!sent) {
      console.error('[METRICS] Failed to send metrics to master');
    }
    
    return metrics;
  }

  /**
   * Recopila todas las métricas del worker
   * @returns {Object} Métricas recopiladas
   */
  collectMetrics() {
    const memory = getMemoryMetrics();
    const rooms = this.getRoomCount();
    const players = this.getPlayerCount();
    const roomIds = this.getRoomIds();
    
    return {
      rooms,
      players,
      roomIds,
      memory,
      memoryUsage: memory.heapUsagePercent,
      uptime: process.uptime(),
      timestamp: Date.now()
    };
  }

  /**
   * Notifica al master que se creó una sala
   * @param {string} roomId - ID de la sala creada
   */
  notifyRoomCreated(roomId) {
    if (!cluster.isWorker) return;
    
    const message = createIPCMessage(IPCMessageType.ROOM_CREATED, { roomId });
    this.ipcHandler.sendToMaster(message);
  }

  /**
   * Notifica al master que se eliminó una sala
   * @param {string} roomId - ID de la sala eliminada
   */
  notifyRoomDeleted(roomId) {
    if (!cluster.isWorker) return;
    
    const message = createIPCMessage(IPCMessageType.ROOM_DELETED, { roomId });
    this.ipcHandler.sendToMaster(message);
  }

  /**
   * Notifica al master que un jugador se unió
   * @param {string} playerId - ID del jugador
   * @param {string} roomId - ID de la sala
   */
  notifyPlayerJoined(playerId, roomId) {
    if (!cluster.isWorker) return;
    
    const message = createIPCMessage(IPCMessageType.PLAYER_JOINED, { playerId, roomId });
    this.ipcHandler.sendToMaster(message);
  }

  /**
   * Notifica al master que un jugador salió
   * @param {string} playerId - ID del jugador
   * @param {string} roomId - ID de la sala
   */
  notifyPlayerLeft(playerId, roomId) {
    if (!cluster.isWorker) return;
    
    const message = createIPCMessage(IPCMessageType.PLAYER_LEFT, { playerId, roomId });
    this.ipcHandler.sendToMaster(message);
  }

  /**
   * Actualiza las funciones de obtención de métricas
   * @param {Object} options - Nuevas funciones
   */
  updateMetricsFunctions(options) {
    if (options.getRoomCount) this.getRoomCount = options.getRoomCount;
    if (options.getPlayerCount) this.getPlayerCount = options.getPlayerCount;
    if (options.getRoomIds) this.getRoomIds = options.getRoomIds;
  }
}

// Singleton para uso global en workers
let metricsReporterInstance = null;

/**
 * Obtiene la instancia singleton del MetricsReporter
 * @param {Object} [options] - Opciones de configuración (solo para primera llamada)
 * @returns {MetricsReporter}
 */
export function getMetricsReporter(options) {
  if (!metricsReporterInstance) {
    metricsReporterInstance = new MetricsReporter(options);
  } else if (options) {
    metricsReporterInstance.updateMetricsFunctions(options);
  }
  return metricsReporterInstance;
}

export { MetricsReporter };
export default MetricsReporter;
