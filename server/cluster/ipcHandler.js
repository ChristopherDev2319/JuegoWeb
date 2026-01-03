/**
 * IPCHandler - Maneja la comunicación Inter-Proceso entre master y workers
 * 
 * Este módulo implementa:
 * - Envío de mensajes al master (Requirement 3.1)
 * - Envío de mensajes a workers específicos (Requirement 3.2)
 * - Serialización de mensajes en formato JSON (Requirement 3.4)
 * 
 * Requirements: 3.1, 3.2, 3.4
 */

import cluster from 'cluster';
import { CLUSTER_CONFIG } from './config.js';

/**
 * Tipos de mensajes IPC soportados
 */
export const IPCMessageType = {
  METRICS: 'metrics',
  ROOM_CREATED: 'roomCreated',
  ROOM_DELETED: 'roomDeleted',
  PLAYER_JOINED: 'playerJoined',
  PLAYER_LEFT: 'playerLeft',
  SHUTDOWN: 'shutdown',
  STATUS: 'status',
  STATUS_RESPONSE: 'statusResponse',
  // Distributed matchmaking messages (Requirement 3.3)
  ROOMS_REQUEST: 'roomsRequest',
  ROOMS_RESPONSE: 'roomsResponse'
};

/**
 * Crea un mensaje IPC con el formato requerido
 * Requirement 3.4: Usar formato JSON con campos requeridos
 * 
 * @param {string} type - Tipo de mensaje (de IPCMessageType)
 * @param {Object} data - Datos del mensaje
 * @param {number} [workerId] - ID del worker (opcional, se detecta automáticamente)
 * @returns {Object} Mensaje IPC formateado
 */
export function createIPCMessage(type, data = {}, workerId = null) {
  return {
    type,
    workerId: workerId ?? (cluster.isWorker ? cluster.worker.id : 0),
    data,
    timestamp: Date.now()
  };
}

/**
 * Valida que un mensaje IPC tenga el formato correcto
 * Requirement 3.4: Validar formato JSON
 * 
 * @param {Object} message - Mensaje a validar
 * @returns {Object} Resultado de validación { isValid, errors }
 */
export function validateIPCMessage(message) {
  const errors = [];
  
  if (!message || typeof message !== 'object') {
    return { isValid: false, errors: ['Message must be an object'] };
  }
  
  if (!message.type || typeof message.type !== 'string') {
    errors.push('Message must have a string "type" field');
  }
  
  if (message.workerId === undefined || message.workerId === null) {
    errors.push('Message must have a "workerId" field');
  }
  
  if (!message.hasOwnProperty('data')) {
    errors.push('Message must have a "data" field');
  }
  
  if (!message.timestamp || typeof message.timestamp !== 'number') {
    errors.push('Message must have a numeric "timestamp" field');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * IPCHandler - Gestiona la comunicación IPC
 */
class IPCHandler {
  constructor() {
    /** @type {Map<string, Function[]>} */
    this.listeners = new Map();
    
    /** @type {Map<string, Function>} */
    this.pendingRequests = new Map();
    
    /** @type {boolean} */
    this.isInitialized = false;
  }

  /**
   * Inicializa el handler de IPC
   * Configura los listeners según si es master o worker
   */
  initialize() {
    if (this.isInitialized) return;
    
    if (cluster.isWorker) {
      // Worker: escuchar mensajes del master
      process.on('message', (message) => {
        this._handleMessage(message);
      });
    } else if (cluster.isMaster || cluster.isPrimary) {
      // Master: los listeners se configuran por worker en ClusterManager
      // Este método se llama para marcar como inicializado
    }
    
    this.isInitialized = true;
  }

  /**
   * Envía un mensaje al proceso master (desde un worker)
   * Requirement 3.1: Workers envían mensajes al master
   * 
   * @param {Object} message - Mensaje IPC a enviar
   * @returns {boolean} true si se envió correctamente
   */
  sendToMaster(message) {
    if (!cluster.isWorker) {
      console.error('[IPC] sendToMaster can only be called from a worker');
      return false;
    }
    
    const validation = validateIPCMessage(message);
    if (!validation.isValid) {
      console.error('[IPC] Invalid message format:', validation.errors);
      return false;
    }
    
    try {
      process.send(message);
      return true;
    } catch (error) {
      console.error('[IPC] Error sending message to master:', error.message);
      return false;
    }
  }

  /**
   * Envía un mensaje a un worker específico (desde el master)
   * Requirement 3.2: Master envía mensajes a workers
   * 
   * @param {number} workerId - ID del worker destino
   * @param {Object} message - Mensaje IPC a enviar
   * @returns {boolean} true si se envió correctamente
   */
  sendToWorker(workerId, message) {
    if (cluster.isWorker) {
      console.error('[IPC] sendToWorker can only be called from master');
      return false;
    }
    
    const validation = validateIPCMessage(message);
    if (!validation.isValid) {
      console.error('[IPC] Invalid message format:', validation.errors);
      return false;
    }
    
    const worker = cluster.workers[workerId];
    if (!worker || worker.isDead()) {
      console.error(`[IPC] Worker ${workerId} not available`);
      return false;
    }
    
    try {
      worker.send(message);
      return true;
    } catch (error) {
      console.error(`[IPC] Error sending message to worker ${workerId}:`, error.message);
      return false;
    }
  }

  /**
   * Envía un mensaje a todos los workers (broadcast)
   * 
   * @param {Object} message - Mensaje IPC a enviar
   * @returns {number} Número de workers que recibieron el mensaje
   */
  broadcastToWorkers(message) {
    if (cluster.isWorker) {
      console.error('[IPC] broadcastToWorkers can only be called from master');
      return 0;
    }
    
    const validation = validateIPCMessage(message);
    if (!validation.isValid) {
      console.error('[IPC] Invalid message format:', validation.errors);
      return 0;
    }
    
    let sentCount = 0;
    for (const [id, worker] of Object.entries(cluster.workers || {})) {
      if (worker && !worker.isDead()) {
        try {
          worker.send(message);
          sentCount++;
        } catch (error) {
          console.error(`[IPC] Error broadcasting to worker ${id}:`, error.message);
        }
      }
    }
    
    return sentCount;
  }

  /**
   * Solicita estado a un worker con timeout
   * Requirement 3.2: Recibir respuesta en menos de 100ms
   * 
   * @param {number} workerId - ID del worker
   * @returns {Promise<Object>} Estado del worker
   */
  async requestWorkerStatus(workerId) {
    if (cluster.isWorker) {
      throw new Error('requestWorkerStatus can only be called from master');
    }
    
    const requestId = `status_${workerId}_${Date.now()}`;
    const message = createIPCMessage(IPCMessageType.STATUS, { requestId }, 0);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Worker ${workerId} IPC timeout (${CLUSTER_CONFIG.ipcTimeout}ms)`));
      }, CLUSTER_CONFIG.ipcTimeout);
      
      this.pendingRequests.set(requestId, (response) => {
        clearTimeout(timeout);
        this.pendingRequests.delete(requestId);
        resolve(response);
      });
      
      if (!this.sendToWorker(workerId, message)) {
        clearTimeout(timeout);
        this.pendingRequests.delete(requestId);
        reject(new Error(`Failed to send status request to worker ${workerId}`));
      }
    });
  }

  /**
   * Registra un listener para un tipo de mensaje
   * 
   * @param {string} messageType - Tipo de mensaje a escuchar
   * @param {Function} callback - Función a llamar cuando se recibe el mensaje
   */
  onMessage(messageType, callback) {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, []);
    }
    this.listeners.get(messageType).push(callback);
  }

  /**
   * Registra un listener para todos los mensajes
   * 
   * @param {Function} callback - Función a llamar con cada mensaje
   */
  onAnyMessage(callback) {
    this.onMessage('*', callback);
  }

  /**
   * Maneja un mensaje recibido
   * @private
   * @param {Object} message - Mensaje recibido
   */
  _handleMessage(message) {
    if (!message || !message.type) return;
    
    // Manejar respuestas a solicitudes pendientes
    if (message.type === IPCMessageType.STATUS_RESPONSE && message.data?.requestId) {
      const callback = this.pendingRequests.get(message.data.requestId);
      if (callback) {
        callback(message.data);
        return;
      }
    }
    
    // Notificar listeners específicos
    const typeListeners = this.listeners.get(message.type) || [];
    for (const listener of typeListeners) {
      try {
        listener(message);
      } catch (error) {
        console.error(`[IPC] Error in listener for ${message.type}:`, error.message);
      }
    }
    
    // Notificar listeners globales
    const globalListeners = this.listeners.get('*') || [];
    for (const listener of globalListeners) {
      try {
        listener(message);
      } catch (error) {
        console.error('[IPC] Error in global listener:', error.message);
      }
    }
  }

  /**
   * Elimina todos los listeners
   */
  removeAllListeners() {
    this.listeners.clear();
  }
}

// Singleton para uso global
let ipcHandlerInstance = null;

/**
 * Obtiene la instancia singleton del IPCHandler
 * @returns {IPCHandler}
 */
export function getIPCHandler() {
  if (!ipcHandlerInstance) {
    ipcHandlerInstance = new IPCHandler();
  }
  return ipcHandlerInstance;
}

export { IPCHandler };
export default IPCHandler;
