/**
 * RedisMatchmaking - Matchmaking centralizado con Redis
 * 
 * Módulo principal que maneja toda la interacción con Redis para matchmaking.
 * Implementa operaciones de sala, búsqueda, locking distribuido y heartbeat.
 * 
 * Requirements: 5.1, 2.1, 5.3, 5.5, 1.4, 5.4
 */

import { REDIS_CONFIG, REDIS_KEYS } from './redisConfig.js';
import { serializeRoom, deserializeRoom } from './serialization.js';
import { getClusterLogger } from './clusterLogger.js';

const clusterLogger = getClusterLogger();

/**
 * Clase principal de matchmaking centralizado con Redis
 */
export class RedisMatchmaking {
  /**
   * @param {import('./redisConnection.js').RedisConnection} redisConnection - Conexión a Redis
   */
  constructor(redisConnection) {
    if (!redisConnection) {
      throw new Error('RedisConnection is required');
    }
    
    this._redis = redisConnection;
    this._config = REDIS_CONFIG;
    
    // Keys de Redis
    this._keys = {
      room: REDIS_KEYS.room,           // room:{roomId}
      roomsPublic: REDIS_KEYS.roomsPublic, // rooms:public (ZSET)
      lock: REDIS_KEYS.lock,           // lock:room:{roomId}
      workerHeartbeat: REDIS_KEYS.workerHeartbeat // worker:{workerId}:heartbeat
    };
  }

  /**
   * Obtiene la key de Redis para una sala
   * @param {string} roomId - ID de la sala
   * @returns {string} Key de Redis
   */
  _getRoomKey(roomId) {
    return `${this._keys.room}${roomId}`;
  }

  /**
   * Obtiene la key de Redis para el lock de una sala
   * @param {string} roomId - ID de la sala
   * @returns {string} Key de Redis
   */
  _getLockKey(roomId) {
    return `${this._keys.lock}${roomId}`;
  }

  /**
   * Verifica si la conexión a Redis está activa
   * @returns {boolean}
   */
  isConnected() {
    return this._redis.isConnected();
  }

  // ==================== Operaciones de Sala ====================

  /**
   * Registra una sala en Redis
   * 
   * Requirement 2.1: Almacenar sala con TTL de 5 minutos
   * Requirement 5.3: Retornar confirmación de éxito
   * 
   * @param {import('./serialization.js').RoomInfo} roomInfo - Información de la sala
   * @returns {Promise<boolean>} True si se registró exitosamente
   */
  async registerRoom(roomInfo) {
    const roomKey = this._getRoomKey(roomInfo.id);
    const serialized = serializeRoom(roomInfo);
    
    try {
      // Almacenar sala con TTL de 5 minutos
      await this._redis.set(roomKey, serialized, { EX: this._config.roomTTL });
      
      // Si es pública, agregar al índice ordenado por jugadores
      if (roomInfo.tipo === 'publica') {
        await this._redis.zadd(this._keys.roomsPublic, roomInfo.jugadores, roomInfo.id);
      }
      
      clusterLogger.info(`[RedisMatchmaking] Sala ${roomInfo.id} registrada (${roomInfo.tipo})`);
      return true;
    } catch (error) {
      clusterLogger.error(`[RedisMatchmaking] Error registrando sala ${roomInfo.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina una sala de Redis
   * 
   * Requirement 5.5: Eliminar sala y retornar confirmación
   * 
   * @param {string} roomId - ID de la sala
   * @returns {Promise<boolean>} True si se eliminó exitosamente
   */
  async unregisterRoom(roomId) {
    const roomKey = this._getRoomKey(roomId);
    
    try {
      // Eliminar sala
      await this._redis.del(roomKey);
      
      // Remover del índice de salas públicas
      await this._redis.zrem(this._keys.roomsPublic, roomId);
      
      clusterLogger.info(`[RedisMatchmaking] Sala ${roomId} eliminada`);
      return true;
    } catch (error) {
      clusterLogger.error(`[RedisMatchmaking] Error eliminando sala ${roomId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualiza el contador de jugadores de una sala atómicamente
   * 
   * Requirement 1.4: Actualizar contador atómicamente
   * Requirement 5.4: Retornar nuevo valor
   * 
   * @param {string} roomId - ID de la sala
   * @param {number} delta - Cambio en el contador (+1 o -1)
   * @returns {Promise<number>} Nuevo número de jugadores
   */
  async updateRoomPlayers(roomId, delta) {
    const roomKey = this._getRoomKey(roomId);
    
    try {
      // Obtener sala actual
      const roomJson = await this._redis.get(roomKey);
      if (!roomJson) {
        throw new Error(`Room ${roomId} not found`);
      }
      
      const room = deserializeRoom(roomJson);
      const newCount = room.jugadores + delta;
      
      // Actualizar sala
      room.jugadores = newCount;
      room.lastHeartbeat = Date.now();
      
      await this._redis.set(roomKey, serializeRoom(room), { EX: this._config.roomTTL });
      
      // Actualizar score en índice de salas públicas
      if (room.tipo === 'publica') {
        await this._redis.zadd(this._keys.roomsPublic, newCount, roomId);
      }
      
      clusterLogger.debug(`[RedisMatchmaking] Sala ${roomId} actualizada: ${newCount} jugadores`);
      return newCount;
    } catch (error) {
      clusterLogger.error(`[RedisMatchmaking] Error actualizando jugadores de sala ${roomId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene información de una sala
   * 
   * @param {string} roomId - ID de la sala
   * @returns {Promise<import('./serialization.js').RoomInfo|null>} Info de la sala o null si no existe
   */
  async getRoomInfo(roomId) {
    const roomKey = this._getRoomKey(roomId);
    
    try {
      const roomJson = await this._redis.get(roomKey);
      if (!roomJson) {
        return null;
      }
      
      return deserializeRoom(roomJson);
    } catch (error) {
      clusterLogger.error(`[RedisMatchmaking] Error obteniendo sala ${roomId}: ${error.message}`);
      throw error;
    }
  }

  // ==================== Búsqueda y Matchmaking ====================

  /**
   * Encuentra todas las salas públicas disponibles con heartbeat válido
   * 
   * Requirement 1.1: Consultar Redis para obtener salas públicas disponibles
   * Requirement 2.4: Retornar solo salas con heartbeat válido (últimos 60s)
   * 
   * @returns {Promise<import('./serialization.js').RoomInfo[]>} Lista de salas disponibles ordenadas por jugadores (desc)
   */
  async findAvailableRooms() {
    try {
      // Obtener IDs de salas públicas ordenadas por jugadores (descendente)
      const roomIds = await this._redis.zrevrange(this._keys.roomsPublic, 0, -1);
      
      if (!roomIds || roomIds.length === 0) {
        return [];
      }
      
      const now = Date.now();
      const heartbeatThreshold = now - (this._config.heartbeatTTL * 1000); // 60 segundos
      const availableRooms = [];
      
      // Obtener info de cada sala y filtrar por heartbeat válido
      for (const roomId of roomIds) {
        const roomInfo = await this.getRoomInfo(roomId);
        
        if (roomInfo && roomInfo.lastHeartbeat >= heartbeatThreshold) {
          // Solo incluir salas con espacio disponible
          if (roomInfo.jugadores < roomInfo.maxJugadores) {
            availableRooms.push(roomInfo);
          }
        }
      }
      
      clusterLogger.debug(`[RedisMatchmaking] Encontradas ${availableRooms.length} salas disponibles`);
      return availableRooms;
    } catch (error) {
      clusterLogger.error(`[RedisMatchmaking] Error buscando salas disponibles: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encuentra la mejor sala disponible (la que tiene más jugadores)
   * 
   * Requirement 1.2: Seleccionar la sala con más jugadores activos
   * 
   * @returns {Promise<import('./serialization.js').RoomInfo|null>} Mejor sala o null si no hay disponibles
   */
  async findBestRoom() {
    try {
      const availableRooms = await this.findAvailableRooms();
      
      if (availableRooms.length === 0) {
        clusterLogger.debug(`[RedisMatchmaking] No hay salas disponibles`);
        return null;
      }
      
      // Las salas ya vienen ordenadas por jugadores (desc) desde findAvailableRooms
      // La primera es la que tiene más jugadores
      const bestRoom = availableRooms[0];
      
      clusterLogger.debug(`[RedisMatchmaking] Mejor sala: ${bestRoom.id} con ${bestRoom.jugadores} jugadores`);
      return bestRoom;
    } catch (error) {
      clusterLogger.error(`[RedisMatchmaking] Error buscando mejor sala: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera un código de sala aleatorio de 6 caracteres
   * @returns {string} Código de 6 caracteres alfanuméricos
   * @private
   */
  _generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Genera un ID único para una sala
   * @returns {string} ID único
   * @private
   */
  _generateRoomId() {
    return `room_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // ==================== Locking Distribuido ====================

  /**
   * Error personalizado para fallos de adquisición de lock
   */
  static LockAcquisitionError = class extends Error {
    constructor(roomId, attempts) {
      super(`Failed to acquire lock for room ${roomId} after ${attempts} attempts`);
      this.name = 'LockAcquisitionError';
      this.roomId = roomId;
      this.attempts = attempts;
    }
  };

  /**
   * Adquiere un lock distribuido para una sala
   * 
   * Requirement 3.1: Adquirir lock distribuido para asignar jugador
   * Requirement 3.2: Reintentar hasta 3 veces con backoff exponencial (100ms, 200ms, 400ms)
   * Requirement 3.4: Lock expira automáticamente después de 5 segundos
   * 
   * @param {string} roomId - ID de la sala
   * @returns {Promise<string>} ID único del lock adquirido
   * @throws {LockAcquisitionError} Si no se puede adquirir el lock después de los reintentos
   */
  async acquireLock(roomId) {
    const lockKey = this._getLockKey(roomId);
    const lockId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const lockTTL = this._config.lockTTL || 5; // 5 segundos por defecto
    const maxAttempts = 3;
    const baseDelay = 100; // 100ms base para backoff exponencial
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // SET NX EX: solo establece si no existe, con TTL
        const result = await this._redis.set(lockKey, lockId, { NX: true, EX: lockTTL });
        
        if (result === 'OK') {
          clusterLogger.debug(`[RedisMatchmaking] Lock adquirido para sala ${roomId} (intento ${attempt})`);
          return lockId;
        }
        
        // Lock no adquirido, esperar con backoff exponencial
        if (attempt < maxAttempts) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // 100ms, 200ms, 400ms
          clusterLogger.debug(`[RedisMatchmaking] Lock ocupado para sala ${roomId}, reintentando en ${delay}ms (intento ${attempt}/${maxAttempts})`);
          await this._sleep(delay);
        }
      } catch (error) {
        clusterLogger.error(`[RedisMatchmaking] Error adquiriendo lock para sala ${roomId}: ${error.message}`);
        throw error;
      }
    }
    
    // No se pudo adquirir el lock después de todos los intentos
    clusterLogger.warn(`[RedisMatchmaking] No se pudo adquirir lock para sala ${roomId} después de ${maxAttempts} intentos`);
    throw new RedisMatchmaking.LockAcquisitionError(roomId, maxAttempts);
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
   * Libera un lock distribuido
   * 
   * Requirement 3.3: Liberar lock inmediatamente después de completar operación
   * 
   * Usa script Lua para verificar ownership y eliminar atómicamente
   * 
   * @param {string} roomId - ID de la sala
   * @param {string} lockId - ID del lock a liberar
   * @returns {Promise<boolean>} True si se liberó exitosamente, false si no era owner
   */
  async releaseLock(roomId, lockId) {
    const lockKey = this._getLockKey(roomId);
    
    // Script Lua para verificar ownership y eliminar atómicamente
    // Esto evita race conditions donde otro proceso podría haber adquirido el lock
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    try {
      const result = await this._redis.eval(luaScript, 1, lockKey, lockId);
      
      if (result === 1) {
        clusterLogger.debug(`[RedisMatchmaking] Lock liberado para sala ${roomId}`);
        return true;
      } else {
        clusterLogger.warn(`[RedisMatchmaking] No se pudo liberar lock para sala ${roomId}: no era owner`);
        return false;
      }
    } catch (error) {
      clusterLogger.error(`[RedisMatchmaking] Error liberando lock para sala ${roomId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Asigna un jugador a una sala con locking distribuido
   * 
   * Requirement 3.1: Adquirir lock antes de asignar
   * Requirement 3.5: Verificar que la sala tiene espacio antes de asignar
   * 
   * @param {string} roomId - ID de la sala
   * @returns {Promise<{success: boolean, newCount: number|null, error: string|null}>} Resultado de la asignación
   */
  async assignPlayerWithLock(roomId) {
    let lockId = null;
    
    try {
      // Adquirir lock
      lockId = await this.acquireLock(roomId);
      
      // Verificar que la sala existe y tiene espacio
      const roomInfo = await this.getRoomInfo(roomId);
      
      if (!roomInfo) {
        return {
          success: false,
          newCount: null,
          error: 'Room not found'
        };
      }
      
      // Verificar espacio disponible
      if (roomInfo.jugadores >= roomInfo.maxJugadores) {
        clusterLogger.debug(`[RedisMatchmaking] Sala ${roomId} está llena (${roomInfo.jugadores}/${roomInfo.maxJugadores})`);
        return {
          success: false,
          newCount: null,
          error: 'Room is full'
        };
      }
      
      // Actualizar contador de jugadores
      const newCount = await this.updateRoomPlayers(roomId, 1);
      
      clusterLogger.info(`[RedisMatchmaking] Jugador asignado a sala ${roomId} (${newCount}/${roomInfo.maxJugadores})`);
      return {
        success: true,
        newCount: newCount,
        error: null
      };
    } catch (error) {
      if (error instanceof RedisMatchmaking.LockAcquisitionError) {
        return {
          success: false,
          newCount: null,
          error: 'Could not acquire lock'
        };
      }
      throw error;
    } finally {
      // Siempre liberar el lock si se adquirió
      if (lockId) {
        try {
          await this.releaseLock(roomId, lockId);
        } catch (releaseError) {
          clusterLogger.error(`[RedisMatchmaking] Error liberando lock en finally: ${releaseError.message}`);
        }
      }
    }
  }

  /**
   * Encuentra una sala disponible o crea una nueva
   * 
   * Requirement 1.1: Consultar Redis para salas disponibles
   * Requirement 1.2: Seleccionar sala con más jugadores
   * Requirement 1.3: Crear nueva sala si no hay disponibles
   * Requirement 5.2: Retornar info incluyendo workerId
   * 
   * @param {number} workerId - ID del worker que solicita el matchmaking
   * @param {number} [maxJugadores=8] - Máximo de jugadores para nueva sala
   * @returns {Promise<{room: import('./serialization.js').RoomInfo, created: boolean}>} Sala encontrada/creada y flag indicando si fue creada
   */
  async findOrCreateRoom(workerId, maxJugadores = 8) {
    try {
      // Primero buscar la mejor sala disponible
      const bestRoom = await this.findBestRoom();
      
      if (bestRoom) {
        clusterLogger.info(`[RedisMatchmaking] Matchmaking: jugador asignado a sala existente ${bestRoom.id}`);
        return {
          room: bestRoom,
          created: false
        };
      }
      
      // No hay salas disponibles, crear una nueva
      const newRoom = {
        id: this._generateRoomId(),
        codigo: this._generateRoomCode(),
        tipo: 'publica',
        workerId: workerId,
        jugadores: 0,
        maxJugadores: maxJugadores,
        createdAt: Date.now(),
        lastHeartbeat: Date.now()
      };
      
      // Registrar la nueva sala en Redis
      await this.registerRoom(newRoom);
      
      clusterLogger.info(`[RedisMatchmaking] Matchmaking: nueva sala creada ${newRoom.id} en worker ${workerId}`);
      return {
        room: newRoom,
        created: true
      };
    } catch (error) {
      clusterLogger.error(`[RedisMatchmaking] Error en findOrCreateRoom: ${error.message}`);
      throw error;
    }
  }

  // ==================== Heartbeat y Limpieza ====================

  /**
   * Envía heartbeat para una sala, actualizando lastHeartbeat y renovando TTL
   * 
   * Requirement 2.2: Renovar TTL de la sala cada 30 segundos mediante heartbeat
   * 
   * @param {string} roomId - ID de la sala
   * @returns {Promise<boolean>} True si se actualizó exitosamente
   */
  async sendHeartbeat(roomId) {
    const roomKey = this._getRoomKey(roomId);
    
    try {
      // Obtener sala actual
      const roomJson = await this._redis.get(roomKey);
      if (!roomJson) {
        clusterLogger.warn(`[RedisMatchmaking] Heartbeat fallido: sala ${roomId} no encontrada`);
        return false;
      }
      
      const room = deserializeRoom(roomJson);
      
      // Actualizar lastHeartbeat
      room.lastHeartbeat = Date.now();
      
      // Guardar sala con TTL renovado (5 minutos)
      await this._redis.set(roomKey, serializeRoom(room), { EX: this._config.roomTTL });
      
      clusterLogger.debug(`[RedisMatchmaking] Heartbeat enviado para sala ${roomId}`);
      return true;
    } catch (error) {
      clusterLogger.error(`[RedisMatchmaking] Error enviando heartbeat para sala ${roomId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina salas sin heartbeat válido (más de 60 segundos sin heartbeat)
   * 
   * Requirement 2.3: Eliminar salas vacías por más de 60 segundos
   * 
   * @returns {Promise<string[]>} Lista de IDs de salas eliminadas
   */
  async cleanupStaleRooms() {
    try {
      // Obtener todas las salas públicas del índice
      const roomIds = await this._redis.zrange(this._keys.roomsPublic, 0, -1);
      
      if (!roomIds || roomIds.length === 0) {
        clusterLogger.debug(`[RedisMatchmaking] No hay salas para limpiar`);
        return [];
      }
      
      const now = Date.now();
      const heartbeatThreshold = now - (this._config.heartbeatTTL * 1000); // 60 segundos
      const removedRooms = [];
      
      for (const roomId of roomIds) {
        const roomInfo = await this.getRoomInfo(roomId);
        
        // Si la sala no existe o tiene heartbeat inválido, eliminarla
        if (!roomInfo || roomInfo.lastHeartbeat < heartbeatThreshold) {
          await this.unregisterRoom(roomId);
          removedRooms.push(roomId);
          clusterLogger.info(`[RedisMatchmaking] Sala ${roomId} eliminada por heartbeat inválido`);
        }
      }
      
      if (removedRooms.length > 0) {
        clusterLogger.info(`[RedisMatchmaking] Limpieza completada: ${removedRooms.length} salas eliminadas`);
      }
      
      return removedRooms;
    } catch (error) {
      clusterLogger.error(`[RedisMatchmaking] Error en limpieza de salas: ${error.message}`);
      throw error;
    }
  }
}

export default RedisMatchmaking;
