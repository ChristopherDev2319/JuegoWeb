/**
 * RedisConnection - Gestiona conexión a Redis con resiliencia
 * 
 * Wrapper para ioredis que proporciona:
 * - Reconexión automática con backoff exponencial
 * - Timeout en operaciones (1 segundo por defecto)
 * - Manejo de eventos de conexión/desconexión
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import Redis from 'ioredis';
import { REDIS_CONFIG, getIORedisConfig } from './redisConfig.js';
import { getClusterLogger } from './clusterLogger.js';

const clusterLogger = getClusterLogger();

/**
 * Error personalizado para errores de conexión Redis
 */
export class RedisConnectionError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'RedisConnectionError';
    this.cause = cause;
  }
}

/**
 * Error personalizado para timeout en operaciones Redis
 */
export class RedisTimeoutError extends Error {
  constructor(operation, timeout) {
    super(`Redis operation '${operation}' timed out after ${timeout}ms`);
    this.name = 'RedisTimeoutError';
    this.operation = operation;
    this.timeout = timeout;
  }
}

/**
 * Clase que gestiona la conexión a Redis con resiliencia
 */
export class RedisConnection {
  /**
   * @param {Object} config - Configuración de Redis (opcional, usa REDIS_CONFIG por defecto)
   */
  constructor(config = null) {
    this._config = config || REDIS_CONFIG;
    this._client = null;
    this._connected = false;
    this._connecting = false;
    this._reconnectAttempts = 0;
    this._reconnectTimer = null;
    this._commandTimeout = this._config.commandTimeout || 1000;
  }

  /**
   * Conecta a Redis
   * @returns {Promise<void>}
   * @throws {RedisConnectionError} Si no puede conectar después de los reintentos
   */
  async connect() {
    if (this._connected) {
      return;
    }

    if (this._connecting) {
      // Esperar a que termine la conexión en curso
      return this._waitForConnection();
    }

    this._connecting = true;
    this._reconnectAttempts = 0;

    try {
      await this._attemptConnect();
    } finally {
      this._connecting = false;
    }
  }


  /**
   * Intenta conectar a Redis con reintentos
   * @private
   */
  async _attemptConnect() {
    const ioredisConfig = getIORedisConfig();
    
    while (this._reconnectAttempts < this._config.maxRetries) {
      try {
        this._client = new Redis(ioredisConfig);
        this._setupEventHandlers();
        
        await this._client.connect();
        this._connected = true;
        this._reconnectAttempts = 0;
        
        clusterLogger.info('Redis', `Conectado a Redis en ${this._config.host}:${this._config.port}`);
        return;
        
      } catch (error) {
        this._reconnectAttempts++;
        const delay = this._calculateBackoff(this._reconnectAttempts);
        
        clusterLogger.warn('Redis', 
          `Intento ${this._reconnectAttempts}/${this._config.maxRetries} fallido: ${error.message}. ` +
          `Reintentando en ${delay}ms...`
        );
        
        if (this._client) {
          this._client.disconnect();
          this._client = null;
        }
        
        if (this._reconnectAttempts >= this._config.maxRetries) {
          throw new RedisConnectionError(
            `No se pudo conectar a Redis después de ${this._config.maxRetries} intentos`,
            error
          );
        }
        
        await this._sleep(delay);
      }
    }
  }

  /**
   * Configura los event handlers de ioredis
   * @private
   */
  _setupEventHandlers() {
    this._client.on('connect', () => {
      this._connected = true;
      this._reconnectAttempts = 0; // Reset en conexión exitosa
      clusterLogger.info('Redis', 'Conexión establecida');
    });

    this._client.on('ready', () => {
      clusterLogger.info('Redis', 'Cliente listo para recibir comandos');
    });

    this._client.on('error', (error) => {
      clusterLogger.error('Redis', `Error de conexión: ${error.message}`);
      // No programar reconexión aquí, ioredis lo maneja internamente
    });

    this._client.on('close', () => {
      const wasConnected = this._connected;
      this._connected = false;
      clusterLogger.warn('Redis', 'Conexión cerrada');
      
      // Si estábamos conectados y no estamos en proceso de desconexión manual,
      // programar reconexión automática
      if (wasConnected && this._client && !this._client.manuallyDisconnecting) {
        this._scheduleReconnect();
      }
    });

    this._client.on('reconnecting', (delay) => {
      clusterLogger.info('Redis', `ioredis reconectando en ${delay}ms...`);
    });

    this._client.on('end', () => {
      this._connected = false;
      clusterLogger.info('Redis', 'Conexión terminada');
    });
  }

  /**
   * Calcula el delay con backoff exponencial
   * @param {number} attempt - Número de intento
   * @returns {number} Delay en milisegundos
   * @private
   */
  _calculateBackoff(attempt) {
    const baseDelay = this._config.retryDelay || 5000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    // Agregar jitter para evitar thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Espera a que termine una conexión en curso
   * @private
   */
  async _waitForConnection() {
    const maxWait = this._config.connectTimeout || 5000;
    const startTime = Date.now();
    
    while (this._connecting && (Date.now() - startTime) < maxWait) {
      await this._sleep(100);
    }
    
    if (!this._connected) {
      throw new RedisConnectionError('Timeout esperando conexión en curso');
    }
  }

  /**
   * Helper para sleep
   * @param {number} ms - Milisegundos
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Desconecta de Redis
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }

    if (this._client) {
      // Marcar como desconexión manual para evitar reconexión automática
      this._client.manuallyDisconnecting = true;
      await this._client.quit();
      this._client = null;
    }
    
    this._connected = false;
    this._connecting = false;
    clusterLogger.info('Redis', 'Desconectado de Redis');
  }

  /**
   * Verifica si está conectado
   * @returns {boolean}
   */
  isConnected() {
    return this._connected && this._client !== null;
  }


  /**
   * Ejecuta una operación con timeout
   * @param {string} operation - Nombre de la operación
   * @param {Promise} promise - Promise de la operación
   * @returns {Promise<any>}
   * @throws {RedisTimeoutError} Si la operación excede el timeout
   * @private
   */
  async _withTimeout(operation, promise) {
    const timeout = this._commandTimeout;
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new RedisTimeoutError(operation, timeout));
      }, timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Verifica que el cliente esté conectado antes de operar
   * @private
   */
  _ensureConnected() {
    if (!this.isConnected()) {
      throw new RedisConnectionError('No hay conexión activa a Redis');
    }
  }

  // ==================== Operaciones básicas ====================

  /**
   * Obtiene un valor de Redis
   * @param {string} key - Clave
   * @returns {Promise<string|null>}
   */
  async get(key) {
    this._ensureConnected();
    return this._withTimeout('get', this._client.get(key));
  }

  /**
   * Establece un valor en Redis
   * @param {string} key - Clave
   * @param {string} value - Valor
   * @param {Object} options - Opciones (EX, PX, NX, XX)
   * @returns {Promise<string|null>}
   */
  async set(key, value, options = {}) {
    this._ensureConnected();
    
    const args = [key, value];
    
    if (options.EX) {
      args.push('EX', options.EX);
    } else if (options.PX) {
      args.push('PX', options.PX);
    }
    
    if (options.NX) {
      args.push('NX');
    } else if (options.XX) {
      args.push('XX');
    }
    
    return this._withTimeout('set', this._client.set(...args));
  }

  /**
   * Elimina una clave de Redis
   * @param {string} key - Clave
   * @returns {Promise<number>} Número de claves eliminadas
   */
  async del(key) {
    this._ensureConnected();
    return this._withTimeout('del', this._client.del(key));
  }

  /**
   * Verifica si una clave existe
   * @param {string} key - Clave
   * @returns {Promise<number>} 1 si existe, 0 si no
   */
  async exists(key) {
    this._ensureConnected();
    return this._withTimeout('exists', this._client.exists(key));
  }

  /**
   * Establece TTL en una clave
   * @param {string} key - Clave
   * @param {number} seconds - Segundos de TTL
   * @returns {Promise<number>} 1 si se estableció, 0 si la clave no existe
   */
  async expire(key, seconds) {
    this._ensureConnected();
    return this._withTimeout('expire', this._client.expire(key, seconds));
  }

  /**
   * Incrementa un valor numérico
   * @param {string} key - Clave
   * @returns {Promise<number>} Nuevo valor
   */
  async incr(key) {
    this._ensureConnected();
    return this._withTimeout('incr', this._client.incr(key));
  }

  /**
   * Decrementa un valor numérico
   * @param {string} key - Clave
   * @returns {Promise<number>} Nuevo valor
   */
  async decr(key) {
    this._ensureConnected();
    return this._withTimeout('decr', this._client.decr(key));
  }

  /**
   * Incrementa un campo de hash
   * @param {string} key - Clave del hash
   * @param {string} field - Campo
   * @param {number} increment - Incremento
   * @returns {Promise<number>} Nuevo valor
   */
  async hincrby(key, field, increment) {
    this._ensureConnected();
    return this._withTimeout('hincrby', this._client.hincrby(key, field, increment));
  }

  /**
   * Obtiene todos los campos de un hash
   * @param {string} key - Clave del hash
   * @returns {Promise<Object>}
   */
  async hgetall(key) {
    this._ensureConnected();
    return this._withTimeout('hgetall', this._client.hgetall(key));
  }

  /**
   * Establece múltiples campos en un hash
   * @param {string} key - Clave del hash
   * @param {Object} fields - Campos y valores
   * @returns {Promise<string>}
   */
  async hset(key, fields) {
    this._ensureConnected();
    return this._withTimeout('hset', this._client.hset(key, fields));
  }


  // ==================== Operaciones de Sorted Set ====================

  /**
   * Agrega miembro a sorted set
   * @param {string} key - Clave del set
   * @param {number} score - Score
   * @param {string} member - Miembro
   * @returns {Promise<number>}
   */
  async zadd(key, score, member) {
    this._ensureConnected();
    return this._withTimeout('zadd', this._client.zadd(key, score, member));
  }

  /**
   * Elimina miembro de sorted set
   * @param {string} key - Clave del set
   * @param {string} member - Miembro
   * @returns {Promise<number>}
   */
  async zrem(key, member) {
    this._ensureConnected();
    return this._withTimeout('zrem', this._client.zrem(key, member));
  }

  /**
   * Obtiene miembros de sorted set por rango de score (descendente)
   * @param {string} key - Clave del set
   * @param {number} start - Índice inicio
   * @param {number} stop - Índice fin
   * @returns {Promise<string[]>}
   */
  async zrevrange(key, start, stop) {
    this._ensureConnected();
    return this._withTimeout('zrevrange', this._client.zrevrange(key, start, stop));
  }

  /**
   * Obtiene miembros de sorted set por rango (ascendente)
   * @param {string} key - Clave del set
   * @param {number} start - Índice inicio
   * @param {number} stop - Índice fin
   * @returns {Promise<string[]>}
   */
  async zrange(key, start, stop) {
    this._ensureConnected();
    return this._withTimeout('zrange', this._client.zrange(key, start, stop));
  }

  /**
   * Obtiene miembros con scores de sorted set (descendente)
   * @param {string} key - Clave del set
   * @param {number} start - Índice inicio
   * @param {number} stop - Índice fin
   * @returns {Promise<string[]>} Array alternando [member, score, member, score, ...]
   */
  async zrevrangeWithScores(key, start, stop) {
    this._ensureConnected();
    return this._withTimeout('zrevrange', this._client.zrevrange(key, start, stop, 'WITHSCORES'));
  }

  // ==================== Operaciones atómicas ====================

  /**
   * Ejecuta un script Lua
   * @param {string} script - Script Lua
   * @param {number} numKeys - Número de keys
   * @param {...any} args - Keys y argumentos
   * @returns {Promise<any>}
   */
  async eval(script, numKeys, ...args) {
    this._ensureConnected();
    return this._withTimeout('eval', this._client.eval(script, numKeys, ...args));
  }

  /**
   * Inicia una transacción multi
   * @returns {Object} Pipeline de ioredis
   */
  multi() {
    this._ensureConnected();
    return this._client.multi();
  }

  /**
   * Obtiene el cliente raw de ioredis (para operaciones avanzadas)
   * @returns {Redis}
   */
  getClient() {
    return this._client;
  }

  // ==================== Reconexión automática ====================

  /**
   * Intenta reconectar a Redis
   * @returns {Promise<void>}
   */
  async reconnect() {
    clusterLogger.info('Redis', 'Iniciando reconexión manual...');
    
    if (this._client) {
      try {
        await this._client.quit();
      } catch (e) {
        // Ignorar errores al cerrar
      }
      this._client = null;
    }
    
    this._connected = false;
    this._connecting = false;
    this._reconnectAttempts = 0;
    
    await this.connect();
  }

  /**
   * Programa una reconexión automática con backoff
   * @private
   */
  _scheduleReconnect() {
    if (this._reconnectTimer) {
      return; // Ya hay una reconexión programada
    }

    const delay = this._calculateBackoff(this._reconnectAttempts + 1);
    
    clusterLogger.info('Redis', `Programando reconexión en ${Math.round(delay)}ms...`);
    
    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer = null;
      this._reconnectAttempts++;
      
      if (this._reconnectAttempts > this._config.maxRetries) {
        clusterLogger.error('Redis', 'Máximo de reintentos alcanzado, abandonando reconexión');
        return;
      }
      
      try {
        await this.reconnect();
      } catch (error) {
        clusterLogger.error('Redis', `Reconexión fallida: ${error.message}`);
        this._scheduleReconnect();
      }
    }, delay);
  }
}

export default RedisConnection;
