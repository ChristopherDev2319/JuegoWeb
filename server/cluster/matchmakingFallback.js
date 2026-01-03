/**
 * MatchmakingFallback - Wrapper con fallback local para matchmaking
 * 
 * Este módulo proporciona un wrapper que detecta cuando Redis no está disponible
 * y usa el RoomManager local como fallback. Cuando Redis se recupera,
 * sincroniza las salas locales con Redis.
 * 
 * Requirements: 4.3, 4.4
 */

import { RedisMatchmaking } from './redisMatchmaking.js';
import { RedisConnection, RedisConnectionError, RedisTimeoutError } from './redisConnection.js';
import { RoomManager } from '../rooms/roomManager.js';
import { getClusterLogger } from './clusterLogger.js';

const clusterLogger = getClusterLogger();

/**
 * Estados del sistema de matchmaking
 */
export const MatchmakingMode = {
  REDIS: 'redis',
  LOCAL: 'local',
  DEGRADED: 'degraded' // Redis disponible pero con errores intermitentes
};

/**
 * Clase wrapper que proporciona fallback local cuando Redis no está disponible
 * 
 * Requirement 4.3: Usar fallback local cuando Redis no responde
 * Requirement 4.4: Re-sincronizar salas locales al reconectar
 */
export class MatchmakingFallback {
  /**
   * @param {Object} options - Opciones de configuración
   * @param {number} options.workerId - ID del worker actual
   * @param {RedisConnection} [options.redisConnection] - Conexión a Redis (opcional)
   * @param {RoomManager} [options.localRoomManager] - RoomManager local (opcional)
   */
  constructor(options = {}) {
    if (!options.workerId && options.workerId !== 0) {
      throw new Error('workerId is required');
    }
    
    this._workerId = options.workerId;
    this._redisConnection = options.redisConnection || null;
    this._redisMatchmaking = null;
    this._localRoomManager = options.localRoomManager || new RoomManager();
    
    this._mode = MatchmakingMode.LOCAL;
    this._lastRedisError = null;
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 10;
    this._reconnectTimer = null;
    this._syncInProgress = false;
    
    // Callback para notificar cambios de modo
    this._onModeChange = null;
  }

  /**
   * Establece callback para cambios de modo
   * @param {Function} callback - Función a llamar cuando cambia el modo
   */
  onModeChange(callback) {
    this._onModeChange = callback;
  }

  /**
   * Obtiene el modo actual de operación
   * @returns {string} Modo actual (redis, local, degraded)
   */
  getMode() {
    return this._mode;
  }

  /**
   * Verifica si Redis está disponible
   * @returns {boolean}
   */
  isRedisAvailable() {
    return this._redisConnection && this._redisConnection.isConnected();
  }

  /**
   * Cambia el modo de operación y notifica
   * @param {string} newMode - Nuevo modo
   * @private
   */
  _setMode(newMode) {
    if (this._mode !== newMode) {
      const oldMode = this._mode;
      this._mode = newMode;
      clusterLogger.info('MatchmakingFallback', `Modo cambiado: ${oldMode} -> ${newMode}`);
      
      if (this._onModeChange) {
        this._onModeChange(newMode, oldMode);
      }
    }
  }


  /**
   * Inicializa el sistema de matchmaking
   * Intenta conectar a Redis, si falla usa modo local
   * 
   * Requirement 4.1: Reintentar conexión cada 5 segundos hasta 10 intentos
   * 
   * @param {RedisConnection} [redisConnection] - Conexión a Redis opcional
   * @returns {Promise<void>}
   */
  async initialize(redisConnection = null) {
    if (redisConnection) {
      this._redisConnection = redisConnection;
    }
    
    if (!this._redisConnection) {
      clusterLogger.warn('MatchmakingFallback', 'No hay conexión Redis configurada, usando modo local');
      this._setMode(MatchmakingMode.LOCAL);
      return;
    }
    
    try {
      // Intentar conectar si no está conectado
      if (!this._redisConnection.isConnected()) {
        await this._redisConnection.connect();
      }
      
      // Crear instancia de RedisMatchmaking
      this._redisMatchmaking = new RedisMatchmaking(this._redisConnection);
      this._setMode(MatchmakingMode.REDIS);
      this._reconnectAttempts = 0;
      
      clusterLogger.info('MatchmakingFallback', 'Inicializado en modo Redis');
      
    } catch (error) {
      clusterLogger.error('MatchmakingFallback', `Error conectando a Redis: ${error.message}`);
      this._lastRedisError = error;
      this._setMode(MatchmakingMode.LOCAL);
      
      // Programar reconexión en background
      this._scheduleReconnect();
    }
  }

  /**
   * Programa un intento de reconexión a Redis
   * @private
   */
  _scheduleReconnect() {
    if (this._reconnectTimer) {
      return; // Ya hay reconexión programada
    }
    
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      clusterLogger.warn('MatchmakingFallback', 'Máximo de reintentos alcanzado, permaneciendo en modo local');
      return;
    }
    
    const delay = 5000; // 5 segundos entre intentos
    this._reconnectAttempts++;
    
    clusterLogger.info('MatchmakingFallback', 
      `Programando reconexión a Redis en ${delay}ms (intento ${this._reconnectAttempts}/${this._maxReconnectAttempts})`
    );
    
    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer = null;
      await this._attemptReconnect();
    }, delay);
  }

  /**
   * Intenta reconectar a Redis
   * @private
   */
  async _attemptReconnect() {
    try {
      if (!this._redisConnection) {
        return;
      }
      
      await this._redisConnection.reconnect();
      
      if (this._redisConnection.isConnected()) {
        this._redisMatchmaking = new RedisMatchmaking(this._redisConnection);
        
        // Sincronizar salas locales con Redis
        await this._syncLocalRoomsToRedis();
        
        this._setMode(MatchmakingMode.REDIS);
        this._reconnectAttempts = 0;
        this._lastRedisError = null;
        
        clusterLogger.info('MatchmakingFallback', 'Reconexión exitosa a Redis');
      }
    } catch (error) {
      clusterLogger.error('MatchmakingFallback', `Reconexión fallida: ${error.message}`);
      this._lastRedisError = error;
      this._scheduleReconnect();
    }
  }


  /**
   * Sincroniza las salas locales con Redis al reconectar
   * 
   * Requirement 4.4: Re-registrar salas locales en Redis al reconectar
   * 
   * @returns {Promise<number>} Número de salas sincronizadas
   * @private
   */
  async _syncLocalRoomsToRedis() {
    if (this._syncInProgress) {
      clusterLogger.warn('MatchmakingFallback', 'Sincronización ya en progreso');
      return 0;
    }
    
    this._syncInProgress = true;
    let syncedCount = 0;
    
    try {
      const localRooms = this._localRoomManager.obtenerTodasLasSalas();
      
      clusterLogger.info('MatchmakingFallback', `Sincronizando ${localRooms.length} salas locales a Redis`);
      
      for (const room of localRooms) {
        try {
          // Convertir GameRoom a RoomInfo para Redis
          const roomInfo = {
            id: room.id,
            codigo: room.codigo,
            tipo: room.tipo,
            workerId: this._workerId,
            jugadores: room.getPlayerCount(),
            maxJugadores: room.maxJugadores,
            createdAt: room.creadaEn.getTime(),
            lastHeartbeat: Date.now()
          };
          
          await this._redisMatchmaking.registerRoom(roomInfo);
          syncedCount++;
          
        } catch (roomError) {
          clusterLogger.error('MatchmakingFallback', 
            `Error sincronizando sala ${room.id}: ${roomError.message}`
          );
        }
      }
      
      clusterLogger.info('MatchmakingFallback', `Sincronización completada: ${syncedCount}/${localRooms.length} salas`);
      
    } finally {
      this._syncInProgress = false;
    }
    
    return syncedCount;
  }

  /**
   * Ejecuta una operación con fallback a local si Redis falla
   * 
   * Requirement 4.3: Usar fallback local cuando Redis no responde en 1 segundo
   * 
   * @param {Function} redisOperation - Operación a ejecutar en Redis
   * @param {Function} localFallback - Operación fallback local
   * @returns {Promise<any>} Resultado de la operación
   * @private
   */
  async _executeWithFallback(redisOperation, localFallback) {
    // Si estamos en modo local, usar directamente el fallback
    if (this._mode === MatchmakingMode.LOCAL || !this.isRedisAvailable()) {
      return localFallback();
    }
    
    try {
      const result = await redisOperation();
      
      // Si estábamos en modo degradado y funcionó, volver a Redis
      if (this._mode === MatchmakingMode.DEGRADED) {
        this._setMode(MatchmakingMode.REDIS);
      }
      
      return result;
      
    } catch (error) {
      // Registrar el error
      this._lastRedisError = error;
      clusterLogger.error('MatchmakingFallback', `Error en operación Redis: ${error.message}`);
      
      // Determinar si es un error de conexión o timeout
      if (error instanceof RedisConnectionError || error instanceof RedisTimeoutError) {
        // Cambiar a modo degradado o local
        if (this._mode === MatchmakingMode.REDIS) {
          this._setMode(MatchmakingMode.DEGRADED);
        }
        
        // Si hay múltiples errores consecutivos, cambiar a local
        if (this._mode === MatchmakingMode.DEGRADED) {
          this._setMode(MatchmakingMode.LOCAL);
          this._scheduleReconnect();
        }
      }
      
      // Usar fallback local
      clusterLogger.info('MatchmakingFallback', 'Usando fallback local');
      return localFallback();
    }
  }


  // ==================== Operaciones de Matchmaking ====================

  /**
   * Encuentra una sala disponible o crea una nueva
   * 
   * @param {number} [maxJugadores=8] - Máximo de jugadores para nueva sala
   * @returns {Promise<{room: Object, created: boolean, source: string}>}
   */
  async findOrCreateRoom(maxJugadores = 8) {
    return this._executeWithFallback(
      // Operación Redis
      async () => {
        const result = await this._redisMatchmaking.findOrCreateRoom(this._workerId, maxJugadores);
        return {
          room: result.room,
          created: result.created,
          source: 'redis'
        };
      },
      // Fallback local
      () => {
        // Buscar sala pública disponible
        const salasDisponibles = this._localRoomManager.obtenerSalasPublicasDisponibles();
        
        if (salasDisponibles.length > 0) {
          // Ordenar por número de jugadores (descendente) y tomar la mejor
          salasDisponibles.sort((a, b) => b.getPlayerCount() - a.getPlayerCount());
          const bestRoom = salasDisponibles[0];
          
          return {
            room: this._gameRoomToRoomInfo(bestRoom),
            created: false,
            source: 'local'
          };
        }
        
        // Crear nueva sala
        const newRoom = this._localRoomManager.crearSala({
          tipo: 'publica',
          maxJugadores: maxJugadores
        });
        
        return {
          room: this._gameRoomToRoomInfo(newRoom),
          created: true,
          source: 'local'
        };
      }
    );
  }

  /**
   * Registra una sala en el sistema
   * 
   * @param {Object} roomInfo - Información de la sala
   * @returns {Promise<boolean>}
   */
  async registerRoom(roomInfo) {
    return this._executeWithFallback(
      async () => {
        await this._redisMatchmaking.registerRoom(roomInfo);
        return true;
      },
      () => {
        // En modo local, la sala ya debería existir en el RoomManager
        // Solo verificamos que existe
        const exists = this._localRoomManager.obtenerSala(roomInfo.id) !== null;
        return exists;
      }
    );
  }

  /**
   * Elimina una sala del sistema
   * 
   * @param {string} roomId - ID de la sala
   * @returns {Promise<boolean>}
   */
  async unregisterRoom(roomId) {
    return this._executeWithFallback(
      async () => {
        await this._redisMatchmaking.unregisterRoom(roomId);
        return true;
      },
      () => {
        return this._localRoomManager.eliminarSala(roomId);
      }
    );
  }

  /**
   * Actualiza el contador de jugadores de una sala
   * 
   * @param {string} roomId - ID de la sala
   * @param {number} delta - Cambio en el contador (+1 o -1)
   * @returns {Promise<number>} Nuevo número de jugadores
   */
  async updateRoomPlayers(roomId, delta) {
    return this._executeWithFallback(
      async () => {
        return await this._redisMatchmaking.updateRoomPlayers(roomId, delta);
      },
      () => {
        const room = this._localRoomManager.obtenerSala(roomId);
        if (!room) {
          throw new Error(`Room ${roomId} not found`);
        }
        return room.getPlayerCount();
      }
    );
  }

  /**
   * Obtiene información de una sala
   * 
   * @param {string} roomId - ID de la sala
   * @returns {Promise<Object|null>}
   */
  async getRoomInfo(roomId) {
    return this._executeWithFallback(
      async () => {
        return await this._redisMatchmaking.getRoomInfo(roomId);
      },
      () => {
        const room = this._localRoomManager.obtenerSala(roomId);
        return room ? this._gameRoomToRoomInfo(room) : null;
      }
    );
  }


  /**
   * Encuentra todas las salas públicas disponibles
   * 
   * @returns {Promise<Object[]>}
   */
  async findAvailableRooms() {
    return this._executeWithFallback(
      async () => {
        return await this._redisMatchmaking.findAvailableRooms();
      },
      () => {
        const rooms = this._localRoomManager.obtenerSalasPublicasDisponibles();
        return rooms.map(room => this._gameRoomToRoomInfo(room));
      }
    );
  }

  /**
   * Encuentra la mejor sala disponible
   * 
   * @returns {Promise<Object|null>}
   */
  async findBestRoom() {
    return this._executeWithFallback(
      async () => {
        return await this._redisMatchmaking.findBestRoom();
      },
      () => {
        const rooms = this._localRoomManager.obtenerSalasPublicasDisponibles();
        if (rooms.length === 0) {
          return null;
        }
        
        // Ordenar por jugadores descendente
        rooms.sort((a, b) => b.getPlayerCount() - a.getPlayerCount());
        return this._gameRoomToRoomInfo(rooms[0]);
      }
    );
  }

  /**
   * Envía heartbeat para una sala
   * 
   * @param {string} roomId - ID de la sala
   * @returns {Promise<boolean>}
   */
  async sendHeartbeat(roomId) {
    // Heartbeat solo tiene sentido en modo Redis
    if (this._mode !== MatchmakingMode.REDIS || !this.isRedisAvailable()) {
      return true; // En modo local no necesitamos heartbeat
    }
    
    try {
      return await this._redisMatchmaking.sendHeartbeat(roomId);
    } catch (error) {
      clusterLogger.error('MatchmakingFallback', `Error enviando heartbeat: ${error.message}`);
      return false;
    }
  }

  /**
   * Asigna un jugador a una sala con locking
   * 
   * @param {string} roomId - ID de la sala
   * @returns {Promise<{success: boolean, newCount: number|null, error: string|null}>}
   */
  async assignPlayerWithLock(roomId) {
    return this._executeWithFallback(
      async () => {
        return await this._redisMatchmaking.assignPlayerWithLock(roomId);
      },
      () => {
        const room = this._localRoomManager.obtenerSala(roomId);
        
        if (!room) {
          return { success: false, newCount: null, error: 'Room not found' };
        }
        
        if (!room.tieneEspacio()) {
          return { success: false, newCount: null, error: 'Room is full' };
        }
        
        // En modo local, el jugador se agrega directamente en el RoomManager
        // Aquí solo verificamos que hay espacio
        return {
          success: true,
          newCount: room.getPlayerCount(),
          error: null
        };
      }
    );
  }

  // ==================== Utilidades ====================

  /**
   * Convierte un GameRoom a RoomInfo para compatibilidad
   * 
   * @param {import('../rooms/gameRoom.js').GameRoom} gameRoom - Sala de juego
   * @returns {Object} RoomInfo compatible con Redis
   * @private
   */
  _gameRoomToRoomInfo(gameRoom) {
    return {
      id: gameRoom.id,
      codigo: gameRoom.codigo,
      tipo: gameRoom.tipo,
      workerId: this._workerId,
      jugadores: gameRoom.getPlayerCount(),
      maxJugadores: gameRoom.maxJugadores,
      createdAt: gameRoom.creadaEn.getTime(),
      lastHeartbeat: Date.now()
    };
  }

  /**
   * Sincroniza manualmente las salas locales con Redis
   * Útil para forzar sincronización sin esperar reconexión
   * 
   * Requirement 4.4: Re-registrar salas locales en Redis al reconectar
   * 
   * @returns {Promise<{success: boolean, syncedCount: number, error: string|null}>}
   */
  async syncToRedis() {
    if (!this.isRedisAvailable()) {
      return {
        success: false,
        syncedCount: 0,
        error: 'Redis not available'
      };
    }
    
    try {
      const syncedCount = await this._syncLocalRoomsToRedis();
      return {
        success: true,
        syncedCount: syncedCount,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        syncedCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Obtiene el RoomManager local
   * @returns {RoomManager}
   */
  getLocalRoomManager() {
    return this._localRoomManager;
  }

  /**
   * Obtiene el RedisMatchmaking (puede ser null si no está disponible)
   * @returns {RedisMatchmaking|null}
   */
  getRedisMatchmaking() {
    return this._redisMatchmaking;
  }

  /**
   * Obtiene el último error de Redis
   * @returns {Error|null}
   */
  getLastError() {
    return this._lastRedisError;
  }

  /**
   * Obtiene estadísticas del sistema
   * @returns {Object}
   */
  getStats() {
    return {
      mode: this._mode,
      redisAvailable: this.isRedisAvailable(),
      reconnectAttempts: this._reconnectAttempts,
      lastError: this._lastRedisError ? this._lastRedisError.message : null,
      localRoomsCount: this._localRoomManager.getTotalSalas()
    };
  }

  /**
   * Limpia recursos y desconecta
   * @returns {Promise<void>}
   */
  async shutdown() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    
    if (this._redisConnection) {
      try {
        await this._redisConnection.disconnect();
      } catch (error) {
        clusterLogger.error('MatchmakingFallback', `Error desconectando Redis: ${error.message}`);
      }
    }
    
    this._setMode(MatchmakingMode.LOCAL);
    clusterLogger.info('MatchmakingFallback', 'Shutdown completado');
  }
}

export default MatchmakingFallback;
