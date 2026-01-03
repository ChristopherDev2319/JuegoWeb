/**
 * Configuración de Redis para Matchmaking Centralizado
 * 
 * Este módulo contiene la configuración para conectar con Redis,
 * que sirve como fuente única de verdad para el estado de salas
 * y matchmaking del cluster.
 * 
 * Todas las configuraciones pueden ser sobrescritas mediante variables de entorno.
 * 
 * Requirements: 5.1, 4.1
 */

/**
 * @typedef {Object} RedisConfig
 * @property {string} host - Host de Redis (default: localhost)
 * @property {number} port - Puerto de Redis (default: 6379)
 * @property {string} [password] - Contraseña opcional
 * @property {number} [db] - Base de datos (default: 0)
 * @property {number} connectTimeout - Timeout de conexión en ms (default: 5000)
 * @property {number} commandTimeout - Timeout de comandos en ms (default: 1000)
 * @property {number} maxRetries - Reintentos máximos de conexión (default: 10)
 * @property {number} retryDelay - Delay entre reintentos en ms (default: 5000)
 */

/**
 * Configuración principal de Redis
 */
export const REDIS_CONFIG = {
  // Conexión
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  
  // Timeouts
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 5000,
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT) || 1000,
  
  // Reconexión
  maxRetries: parseInt(process.env.REDIS_MAX_RETRIES) || 10,
  retryDelay: parseInt(process.env.REDIS_RETRY_DELAY) || 5000,
  
  // TTLs para datos en Redis (en segundos)
  roomTTL: parseInt(process.env.REDIS_ROOM_TTL) || 300,           // 5 minutos
  lockTTL: parseInt(process.env.REDIS_LOCK_TTL) || 5,             // 5 segundos
  heartbeatTTL: parseInt(process.env.REDIS_HEARTBEAT_TTL) || 60,  // 60 segundos
  
  // Intervalos (en milisegundos)
  heartbeatInterval: parseInt(process.env.REDIS_HEARTBEAT_INTERVAL) || 30000, // 30 segundos
  
  // Lock retry
  lockRetryAttempts: parseInt(process.env.REDIS_LOCK_RETRY_ATTEMPTS) || 3,
  lockRetryBaseDelay: parseInt(process.env.REDIS_LOCK_RETRY_BASE_DELAY) || 100 // 100ms base para backoff
};

/**
 * Prefijos de keys en Redis
 */
export const REDIS_KEYS = {
  room: 'room:',                    // room:{roomId} - Info de sala individual
  roomsPublic: 'rooms:public',      // ZSET de salas públicas ordenadas por jugadores
  lock: 'lock:room:',               // lock:room:{roomId} - Lock distribuido
  workerHeartbeat: 'worker:',       // worker:{workerId}:heartbeat
};

/**
 * Valida que la configuración de Redis sea correcta
 * @returns {Object} Objeto con isValid y errores encontrados
 */
export function validateRedisConfig() {
  const errors = [];
  
  if (!REDIS_CONFIG.host || REDIS_CONFIG.host.trim() === '') {
    errors.push('REDIS_HOST no puede estar vacío');
  }
  
  if (REDIS_CONFIG.port < 1 || REDIS_CONFIG.port > 65535) {
    errors.push('REDIS_PORT debe estar entre 1 y 65535');
  }
  
  if (REDIS_CONFIG.connectTimeout < 1000) {
    errors.push('REDIS_CONNECT_TIMEOUT debe ser al menos 1000ms');
  }
  
  if (REDIS_CONFIG.commandTimeout < 100) {
    errors.push('REDIS_COMMAND_TIMEOUT debe ser al menos 100ms');
  }
  
  if (REDIS_CONFIG.maxRetries < 1) {
    errors.push('REDIS_MAX_RETRIES debe ser al menos 1');
  }
  
  if (REDIS_CONFIG.retryDelay < 1000) {
    errors.push('REDIS_RETRY_DELAY debe ser al menos 1000ms');
  }
  
  if (REDIS_CONFIG.roomTTL < 60) {
    errors.push('REDIS_ROOM_TTL debe ser al menos 60 segundos');
  }
  
  if (REDIS_CONFIG.lockTTL < 1) {
    errors.push('REDIS_LOCK_TTL debe ser al menos 1 segundo');
  }
  
  if (REDIS_CONFIG.heartbeatTTL < 30) {
    errors.push('REDIS_HEARTBEAT_TTL debe ser al menos 30 segundos');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Obtiene la configuración de conexión para ioredis
 * @returns {Object} Configuración compatible con ioredis
 */
export function getIORedisConfig() {
  const config = {
    host: REDIS_CONFIG.host,
    port: REDIS_CONFIG.port,
    db: REDIS_CONFIG.db,
    connectTimeout: REDIS_CONFIG.connectTimeout,
    commandTimeout: REDIS_CONFIG.commandTimeout,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > REDIS_CONFIG.maxRetries) {
        return null; // Stop retrying
      }
      return Math.min(times * REDIS_CONFIG.retryDelay, 30000);
    },
    lazyConnect: true, // No conectar automáticamente
  };
  
  if (REDIS_CONFIG.password) {
    config.password = REDIS_CONFIG.password;
  }
  
  return config;
}

export default REDIS_CONFIG;
