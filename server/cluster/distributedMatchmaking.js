/**
 * DistributedMatchmaking - Matchmaking distribuido para el cluster
 * 
 * Este módulo implementa el matchmaking a nivel de cluster donde:
 * - El master consulta disponibilidad en todos los workers
 * - Selecciona la sala óptima considerando todos los workers
 * 
 * Requirement 3.3: Consultar disponibilidad en todos los workers antes de responder
 */

import cluster from 'cluster';
import { CLUSTER_CONFIG } from './config.js';
import { createIPCMessage, IPCMessageType } from './ipcHandler.js';

/**
 * DistributedMatchmaking - Gestiona el matchmaking a nivel de cluster
 */
class DistributedMatchmaking {
  /**
   * @param {Map<number, Object>} workersMap - Referencia al mapa de workers del ClusterManager
   */
  constructor(workersMap) {
    /** @type {Map<number, Object>} */
    this.workers = workersMap;
    
    /** @type {Map<string, Function>} Callbacks pendientes para respuestas */
    this.pendingRequests = new Map();
    
    /** @type {Map<string, Array>} Respuestas acumuladas por requestId */
    this.pendingResponses = new Map();
    
    /** @type {Map<string, number>} Conteo de respuestas esperadas por requestId */
    this.expectedResponses = new Map();
  }

  /**
   * Consulta todas las salas disponibles en todos los workers
   * Requirement 3.3: Consultar disponibilidad en todos los workers
   * 
   * @returns {Promise<Array>} Lista de todas las salas disponibles en el cluster
   */
  async queryAllAvailableRooms() {
    if (cluster.isWorker) {
      throw new Error('queryAllAvailableRooms can only be called from master');
    }

    const activeWorkerIds = this._getActiveWorkerIds();
    
    if (activeWorkerIds.length === 0) {
      console.log('[DISTRIBUTED_MATCHMAKING] No active workers available');
      return [];
    }

    const requestId = `rooms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._cleanupRequest(requestId);
        // Return whatever responses we got so far instead of rejecting
        const partialResponses = this.pendingResponses.get(requestId) || [];
        console.log(`[DISTRIBUTED_MATCHMAKING] Timeout reached, returning ${partialResponses.length} partial responses`);
        resolve(this._flattenRoomResponses(partialResponses));
      }, CLUSTER_CONFIG.ipcTimeout * 2); // Double timeout for multi-worker query

      // Initialize tracking for this request
      this.pendingResponses.set(requestId, []);
      this.expectedResponses.set(requestId, activeWorkerIds.length);
      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      // Send request to all active workers
      const message = createIPCMessage(IPCMessageType.ROOMS_REQUEST, { requestId }, 0);
      
      for (const workerId of activeWorkerIds) {
        const worker = cluster.workers[workerId];
        if (worker && !worker.isDead()) {
          try {
            worker.send(message);
          } catch (error) {
            console.error(`[DISTRIBUTED_MATCHMAKING] Error sending to worker ${workerId}:`, error.message);
            this._decrementExpected(requestId);
          }
        } else {
          this._decrementExpected(requestId);
        }
      }

      // Check if we have no workers to query
      if (this.expectedResponses.get(requestId) === 0) {
        this._cleanupRequest(requestId);
        resolve([]);
      }
    });
  }

  /**
   * Maneja respuesta de un worker con sus salas disponibles
   * @param {Object} message - Mensaje IPC con la respuesta
   */
  handleRoomsResponse(message) {
    const requestId = message.data?.requestId;
    if (!requestId || !this.pendingRequests.has(requestId)) {
      return;
    }

    const responses = this.pendingResponses.get(requestId);
    if (responses) {
      responses.push(message.data);
    }

    this._decrementExpected(requestId);
  }

  /**
   * Encuentra la mejor sala en todo el cluster
   * Requirement 3.3: Seleccionar sala óptima considerando todos los workers
   * 
   * @returns {Promise<Object|null>} Información de la mejor sala o null si no hay disponibles
   */
  async findBestRoom() {
    const allRooms = await this.queryAllAvailableRooms();
    
    console.log(`[DISTRIBUTED_MATCHMAKING] Total rooms across cluster: ${allRooms.length}`);
    
    if (allRooms.length === 0) {
      return null;
    }

    // Find room with most players (same logic as local matchmaking)
    let bestRoom = allRooms[0];
    let bestScore = bestRoom.jugadores;

    for (let i = 1; i < allRooms.length; i++) {
      const room = allRooms[i];
      if (room.jugadores > bestScore) {
        bestRoom = room;
        bestScore = room.jugadores;
      }
    }

    console.log(`[DISTRIBUTED_MATCHMAKING] Best room: ${bestRoom.codigo} on worker ${bestRoom.workerId} with ${bestRoom.jugadores} players`);
    return bestRoom;
  }

  /**
   * Obtiene el worker óptimo para crear una nueva sala
   * Selecciona el worker con menos salas activas
   * 
   * @returns {number|null} ID del worker óptimo o null si no hay disponibles
   */
  getOptimalWorkerForNewRoom() {
    let selectedWorkerId = null;
    let minRooms = Infinity;

    for (const [workerId, workerInfo] of this.workers) {
      if (workerInfo.status !== 'active') continue;
      if (workerInfo.rooms >= CLUSTER_CONFIG.maxRoomsPerWorker) continue;
      if (workerInfo.players >= CLUSTER_CONFIG.maxPlayersPerWorker) continue;

      if (workerInfo.rooms < minRooms) {
        minRooms = workerInfo.rooms;
        selectedWorkerId = workerId;
      }
    }

    return selectedWorkerId;
  }

  /**
   * Obtiene estadísticas de matchmaking del cluster
   * @returns {Object} Estadísticas del cluster
   */
  getClusterMatchmakingStats() {
    let totalRooms = 0;
    let totalPlayers = 0;
    let availableWorkers = 0;

    for (const [, workerInfo] of this.workers) {
      if (workerInfo.status === 'active') {
        totalRooms += workerInfo.rooms;
        totalPlayers += workerInfo.players;
        
        if (workerInfo.rooms < CLUSTER_CONFIG.maxRoomsPerWorker &&
            workerInfo.players < CLUSTER_CONFIG.maxPlayersPerWorker) {
          availableWorkers++;
        }
      }
    }

    return {
      totalRooms,
      totalPlayers,
      availableWorkers,
      totalWorkers: this.workers.size,
      maxRoomsPerWorker: CLUSTER_CONFIG.maxRoomsPerWorker,
      maxPlayersPerWorker: CLUSTER_CONFIG.maxPlayersPerWorker
    };
  }

  // ==================== Métodos Privados ====================

  /**
   * Obtiene IDs de workers activos
   * @private
   * @returns {number[]}
   */
  _getActiveWorkerIds() {
    const activeIds = [];
    for (const [workerId, workerInfo] of this.workers) {
      if (workerInfo.status === 'active') {
        activeIds.push(workerId);
      }
    }
    return activeIds;
  }

  /**
   * Decrementa el contador de respuestas esperadas y resuelve si está completo
   * @private
   * @param {string} requestId
   */
  _decrementExpected(requestId) {
    const expected = this.expectedResponses.get(requestId);
    if (expected === undefined) return;

    const newExpected = expected - 1;
    this.expectedResponses.set(requestId, newExpected);

    if (newExpected <= 0) {
      const request = this.pendingRequests.get(requestId);
      if (request) {
        clearTimeout(request.timeout);
        const responses = this.pendingResponses.get(requestId) || [];
        request.resolve(this._flattenRoomResponses(responses));
        this._cleanupRequest(requestId);
      }
    }
  }

  /**
   * Aplana las respuestas de múltiples workers en una lista de salas
   * @private
   * @param {Array} responses - Respuestas de workers
   * @returns {Array} Lista plana de salas
   */
  _flattenRoomResponses(responses) {
    const allRooms = [];
    for (const response of responses) {
      if (response.rooms && Array.isArray(response.rooms)) {
        allRooms.push(...response.rooms);
      }
    }
    return allRooms;
  }

  /**
   * Limpia los datos de una solicitud
   * @private
   * @param {string} requestId
   */
  _cleanupRequest(requestId) {
    this.pendingRequests.delete(requestId);
    this.pendingResponses.delete(requestId);
    this.expectedResponses.delete(requestId);
  }
}

export { DistributedMatchmaking };
export default DistributedMatchmaking;
