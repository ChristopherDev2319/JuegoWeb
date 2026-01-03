/**
 * Configuración del Sistema de Clustering
 * 
 * Este módulo contiene todas las constantes configurables para el sistema
 * de clustering multi-núcleo del servidor de juego.
 * 
 * Todas las configuraciones pueden ser sobrescritas mediante variables de entorno.
 * 
 * Requirements: 6.3
 */

import os from 'os';

// Número de CPUs disponibles en el sistema
const numCPUs = os.cpus().length;

/**
 * Configuración principal del cluster
 */
export const CLUSTER_CONFIG = {
  // Número de workers (núcleos - 1 para el master)
  // Por defecto usa todos los núcleos menos 1, máximo 7 workers
  numWorkers: parseInt(process.env.CLUSTER_WORKERS) || Math.min(numCPUs - 1, 7),
  
  // Límites por worker
  maxRoomsPerWorker: parseInt(process.env.MAX_ROOMS_PER_WORKER) || 15,
  maxPlayersPerWorker: parseInt(process.env.MAX_PLAYERS_PER_WORKER) || 120,
  
  // Intervalos de tiempo (en milisegundos)
  metricsInterval: parseInt(process.env.METRICS_INTERVAL) || 30000,      // 30 segundos
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL) || 5000,   // 5 segundos
  workerRestartDelay: parseInt(process.env.WORKER_RESTART_DELAY) || 1000, // 1 segundo
  roomCleanupTimeout: parseInt(process.env.ROOM_CLEANUP_TIMEOUT) || 60000, // 60 segundos
  
  // Umbrales de alerta
  memoryWarningThreshold: parseFloat(process.env.MEMORY_WARNING_THRESHOLD) || 0.8, // 80% de memoria
  
  // Timeouts
  shutdownTimeout: parseInt(process.env.SHUTDOWN_TIMEOUT) || 10000,      // 10 segundos para shutdown graceful
  ipcTimeout: parseInt(process.env.IPC_TIMEOUT) || 100,                  // 100ms para respuestas IPC
  workerReplaceTimeout: parseInt(process.env.WORKER_REPLACE_TIMEOUT) || 5000 // 5 segundos máximo para reemplazar worker
};

/**
 * Valida que la configuración del cluster sea correcta
 * @returns {Object} Objeto con isValid y errores encontrados
 */
export function validateClusterConfig() {
  const errors = [];
  
  if (CLUSTER_CONFIG.numWorkers < 1) {
    errors.push('numWorkers debe ser al menos 1');
  }
  
  if (CLUSTER_CONFIG.numWorkers > numCPUs) {
    errors.push(`numWorkers (${CLUSTER_CONFIG.numWorkers}) no puede exceder el número de CPUs (${numCPUs})`);
  }
  
  if (CLUSTER_CONFIG.maxRoomsPerWorker < 1) {
    errors.push('maxRoomsPerWorker debe ser al menos 1');
  }
  
  if (CLUSTER_CONFIG.maxPlayersPerWorker < 1) {
    errors.push('maxPlayersPerWorker debe ser al menos 1');
  }
  
  if (CLUSTER_CONFIG.memoryWarningThreshold <= 0 || CLUSTER_CONFIG.memoryWarningThreshold > 1) {
    errors.push('memoryWarningThreshold debe estar entre 0 y 1');
  }
  
  if (CLUSTER_CONFIG.metricsInterval < 1000) {
    errors.push('metricsInterval debe ser al menos 1000ms');
  }
  
  if (CLUSTER_CONFIG.ipcTimeout < 10) {
    errors.push('ipcTimeout debe ser al menos 10ms');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Obtiene información del sistema para logging
 * @returns {Object} Información del sistema
 */
export function getSystemInfo() {
  return {
    totalCPUs: numCPUs,
    configuredWorkers: CLUSTER_CONFIG.numWorkers,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    platform: os.platform(),
    nodeVersion: process.version
  };
}

export default CLUSTER_CONFIG;
