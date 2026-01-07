/**
 * Módulo de conexión del lobby
 * Maneja la comunicación con el servidor para operaciones del lobby
 * 
 * Requirements: 3.2, 4.2, 4.3, 5.2, 6.1, 6.4, 6.5
 */

import { getConnection } from '../network/connection.js';

// Estado de la conexión del lobby
let lobbyCallbacks = {
  onMatchmakingSuccess: null,
  onMatchmakingError: null,
  onCreateSuccess: null,
  onCreateError: null,
  onJoinSuccess: null,
  onJoinError: null,
  onRoomsListed: null,
  onRoomsError: null
};

// Timeout para operaciones del lobby (30 segundos)
const LOBBY_TIMEOUT = 30000;

// Timeouts activos
let activeTimeouts = {};

/**
 * Configura los callbacks para respuestas del lobby
 * @param {Object} callbacks - Callbacks para eventos del lobby
 */
export function configurarCallbacksLobby(callbacks) {
  lobbyCallbacks = { ...lobbyCallbacks, ...callbacks };
}

/**
 * Maneja las respuestas del servidor para operaciones del lobby
 * @param {Object} response - Respuesta del servidor
 */
export function manejarRespuestaLobby(response) {
  const { action, success, data } = response;
  
  // Limpiar timeout correspondiente
  if (activeTimeouts[action]) {
    clearTimeout(activeTimeouts[action]);
    delete activeTimeouts[action];
  }
  
  switch (action) {
    case 'matchmaking':
      if (success) {
        if (lobbyCallbacks.onMatchmakingSuccess) {
          lobbyCallbacks.onMatchmakingSuccess({
            roomId: data.roomId,
            roomCode: data.roomCode,
            players: data.players,
            maxPlayers: data.maxPlayers,
            playerList: data.playerList || []
          });
        }
      } else {
        if (lobbyCallbacks.onMatchmakingError) {
          lobbyCallbacks.onMatchmakingError(data.error || 'Error en matchmaking');
        }
      }
      break;
      
    case 'createPrivate':
      if (success) {
        if (lobbyCallbacks.onCreateSuccess) {
          lobbyCallbacks.onCreateSuccess({
            roomId: data.roomId,
            roomCode: data.roomCode,
            players: data.players,
            maxPlayers: data.maxPlayers
          });
        }
      } else {
        if (lobbyCallbacks.onCreateError) {
          lobbyCallbacks.onCreateError(data.error || 'Error al crear partida');
        }
      }
      break;
      
    case 'joinPrivate':
      if (success) {
        if (lobbyCallbacks.onJoinSuccess) {
          lobbyCallbacks.onJoinSuccess({
            roomId: data.roomId,
            roomCode: data.roomCode,
            players: data.players,
            maxPlayers: data.maxPlayers,
            playerList: data.playerList || []
          });
        }
      } else {
        if (lobbyCallbacks.onJoinError) {
          lobbyCallbacks.onJoinError(data.error || 'Error al unirse a partida');
        }
      }
      break;
      
    case 'listRooms':
      if (success) {
        if (lobbyCallbacks.onRoomsListed) {
          lobbyCallbacks.onRoomsListed(data.rooms || []);
        }
      } else {
        if (lobbyCallbacks.onRoomsError) {
          lobbyCallbacks.onRoomsError(data.error || 'Error al obtener salas');
        }
      }
      break;
      
    default:
      console.warn('[LOBBY] Respuesta desconocida:', action);
  }
}

/**
 * Espera a que la conexión esté completamente lista (con playerId asignado)
 * @param {number} maxWait - Tiempo máximo de espera en ms
 * @param {number} interval - Intervalo de verificación en ms
 * @returns {Promise<boolean>} - true si la conexión está lista
 */
async function esperarConexionLista(maxWait = 3000, interval = 50) {
  const connection = getConnection();
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    if (connection.isConnected() && connection.getPlayerId()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
}

/**
 * Envía un mensaje de lobby al servidor
 * @param {string} action - Acción a realizar
 * @param {Object} data - Datos adicionales
 * @returns {boolean} - true si se envió correctamente
 */
function enviarMensajeLobby(action, data = {}) {
  const connection = getConnection();
  
  if (!connection.isConnected()) {
    console.error('[LOBBY] No hay conexión con el servidor');
    return false;
  }
  
  connection.send('lobby', {
    action,
    ...data
  });
  
  return true;
}

/**
 * Configura un timeout para una operación del lobby
 * @param {string} action - Nombre de la acción
 * @param {Function} onTimeout - Callback cuando expira el timeout
 */
function configurarTimeout(action, onTimeout) {
  // Limpiar timeout anterior si existe
  if (activeTimeouts[action]) {
    clearTimeout(activeTimeouts[action]);
  }
  
  activeTimeouts[action] = setTimeout(() => {
    delete activeTimeouts[action];
    if (onTimeout) {
      onTimeout();
    }
  }, LOBBY_TIMEOUT);
}

/**
 * Solicita matchmaking para partida pública
 * Requirements: 6.1, 6.4, 6.5
 * @param {string} nombreJugador - Nombre del jugador
 * @param {string} weaponType - Tipo de arma seleccionada
 * @returns {Promise<{roomId: string, roomCode: string, players: number, maxPlayers: number}>}
 */
export function solicitarMatchmaking(nombreJugador, weaponType = 'M4A1') {
  return new Promise(async (resolve, reject) => {
    // Esperar a que la conexión esté completamente lista
    const conexionLista = await esperarConexionLista();
    if (!conexionLista) {
      reject(new Error('No hay conexión con el servidor'));
      return;
    }
    
    // Configurar callbacks temporales
    const originalSuccess = lobbyCallbacks.onMatchmakingSuccess;
    const originalError = lobbyCallbacks.onMatchmakingError;
    
    lobbyCallbacks.onMatchmakingSuccess = (data) => {
      // Restaurar callbacks originales
      lobbyCallbacks.onMatchmakingSuccess = originalSuccess;
      lobbyCallbacks.onMatchmakingError = originalError;
      
      // Llamar callback original si existe
      if (originalSuccess) originalSuccess(data);
      
      resolve(data);
    };
    
    lobbyCallbacks.onMatchmakingError = (error) => {
      // Restaurar callbacks originales
      lobbyCallbacks.onMatchmakingSuccess = originalSuccess;
      lobbyCallbacks.onMatchmakingError = originalError;
      
      // Llamar callback original si existe
      if (originalError) originalError(error);
      
      reject(new Error(error));
    };
    
    // Configurar timeout
    configurarTimeout('matchmaking', () => {
      lobbyCallbacks.onMatchmakingSuccess = originalSuccess;
      lobbyCallbacks.onMatchmakingError = originalError;
      reject(new Error('Timeout: No se pudo encontrar partida'));
    });
    
    // Enviar solicitud con arma seleccionada
    const enviado = enviarMensajeLobby('matchmaking', {
      playerName: nombreJugador,
      weaponType: weaponType
    });
    
    if (!enviado) {
      lobbyCallbacks.onMatchmakingSuccess = originalSuccess;
      lobbyCallbacks.onMatchmakingError = originalError;
      if (activeTimeouts['matchmaking']) {
        clearTimeout(activeTimeouts['matchmaking']);
        delete activeTimeouts['matchmaking'];
      }
      reject(new Error('No hay conexión con el servidor'));
    }
  });
}

/**
 * Crea una partida privada
 * Requirements: 3.2, 4.2, 4.3
 * @param {string} nombreJugador - Nombre del jugador
 * @param {string} password - Contraseña de la sala
 * @param {string} weaponType - Tipo de arma seleccionada
 * @returns {Promise<{roomId: string, roomCode: string, players: number, maxPlayers: number}>}
 */
export function crearPartidaPrivada(nombreJugador, password, weaponType = 'M4A1') {
  return new Promise(async (resolve, reject) => {
    // Esperar a que la conexión esté completamente lista
    const conexionLista = await esperarConexionLista();
    if (!conexionLista) {
      reject(new Error('No hay conexión con el servidor'));
      return;
    }
    
    // Configurar callbacks temporales
    const originalSuccess = lobbyCallbacks.onCreateSuccess;
    const originalError = lobbyCallbacks.onCreateError;
    
    lobbyCallbacks.onCreateSuccess = (data) => {
      lobbyCallbacks.onCreateSuccess = originalSuccess;
      lobbyCallbacks.onCreateError = originalError;
      
      if (originalSuccess) originalSuccess(data);
      
      resolve(data);
    };
    
    lobbyCallbacks.onCreateError = (error) => {
      lobbyCallbacks.onCreateSuccess = originalSuccess;
      lobbyCallbacks.onCreateError = originalError;
      
      if (originalError) originalError(error);
      
      reject(new Error(error));
    };
    
    // Configurar timeout
    configurarTimeout('createPrivate', () => {
      lobbyCallbacks.onCreateSuccess = originalSuccess;
      lobbyCallbacks.onCreateError = originalError;
      reject(new Error('Timeout: No se pudo crear la partida'));
    });
    
    // Enviar solicitud con arma seleccionada
    const enviado = enviarMensajeLobby('createPrivate', {
      playerName: nombreJugador,
      password: password,
      weaponType: weaponType
    });
    
    if (!enviado) {
      lobbyCallbacks.onCreateSuccess = originalSuccess;
      lobbyCallbacks.onCreateError = originalError;
      if (activeTimeouts['createPrivate']) {
        clearTimeout(activeTimeouts['createPrivate']);
        delete activeTimeouts['createPrivate'];
      }
      reject(new Error('No hay conexión con el servidor'));
    }
  });
}

/**
 * Se une a una partida privada
 * Requirements: 5.2
 * @param {string} nombreJugador - Nombre del jugador
 * @param {string} codigo - Código de la sala
 * @param {string} password - Contraseña de la sala
 * @param {string} weaponType - Tipo de arma seleccionada
 * @returns {Promise<{roomId: string, roomCode: string, players: number, maxPlayers: number}>}
 */
export function unirsePartidaPrivada(nombreJugador, codigo, password, weaponType = 'M4A1') {
  return new Promise(async (resolve, reject) => {
    // Esperar a que la conexión esté completamente lista
    const conexionLista = await esperarConexionLista();
    if (!conexionLista) {
      reject(new Error('No hay conexión con el servidor'));
      return;
    }
    
    // Configurar callbacks temporales
    const originalSuccess = lobbyCallbacks.onJoinSuccess;
    const originalError = lobbyCallbacks.onJoinError;
    
    lobbyCallbacks.onJoinSuccess = (data) => {
      lobbyCallbacks.onJoinSuccess = originalSuccess;
      lobbyCallbacks.onJoinError = originalError;
      
      if (originalSuccess) originalSuccess(data);
      
      resolve(data);
    };
    
    lobbyCallbacks.onJoinError = (error) => {
      lobbyCallbacks.onJoinSuccess = originalSuccess;
      lobbyCallbacks.onJoinError = originalError;
      
      if (originalError) originalError(error);
      
      reject(new Error(error));
    };
    
    // Configurar timeout
    configurarTimeout('joinPrivate', () => {
      lobbyCallbacks.onJoinSuccess = originalSuccess;
      lobbyCallbacks.onJoinError = originalError;
      reject(new Error('Timeout: No se pudo unir a la partida'));
    });
    
    // Enviar solicitud con arma seleccionada
    const enviado = enviarMensajeLobby('joinPrivate', {
      playerName: nombreJugador,
      roomCode: codigo,
      password: password,
      weaponType: weaponType
    });
    
    if (!enviado) {
      lobbyCallbacks.onJoinSuccess = originalSuccess;
      lobbyCallbacks.onJoinError = originalError;
      if (activeTimeouts['joinPrivate']) {
        clearTimeout(activeTimeouts['joinPrivate']);
        delete activeTimeouts['joinPrivate'];
      }
      reject(new Error('No hay conexión con el servidor'));
    }
  });
}

/**
 * Obtiene lista de salas públicas disponibles
 * @returns {Promise<Array<{id: string, codigo: string, jugadores: number, maxJugadores: number}>>}
 */
export function obtenerSalasPublicas() {
  return new Promise(async (resolve, reject) => {
    // Esperar a que la conexión esté completamente lista
    const conexionLista = await esperarConexionLista();
    if (!conexionLista) {
      reject(new Error('No hay conexión con el servidor'));
      return;
    }
    
    // Configurar callbacks temporales
    const originalListed = lobbyCallbacks.onRoomsListed;
    const originalError = lobbyCallbacks.onRoomsError;
    
    lobbyCallbacks.onRoomsListed = (rooms) => {
      lobbyCallbacks.onRoomsListed = originalListed;
      lobbyCallbacks.onRoomsError = originalError;
      
      if (originalListed) originalListed(rooms);
      
      resolve(rooms);
    };
    
    lobbyCallbacks.onRoomsError = (error) => {
      lobbyCallbacks.onRoomsListed = originalListed;
      lobbyCallbacks.onRoomsError = originalError;
      
      if (originalError) originalError(error);
      
      reject(new Error(error));
    };
    
    // Configurar timeout
    configurarTimeout('listRooms', () => {
      lobbyCallbacks.onRoomsListed = originalListed;
      lobbyCallbacks.onRoomsError = originalError;
      reject(new Error('Timeout: No se pudo obtener lista de salas'));
    });
    
    // Enviar solicitud
    const enviado = enviarMensajeLobby('listRooms', {});
    
    if (!enviado) {
      lobbyCallbacks.onRoomsListed = originalListed;
      lobbyCallbacks.onRoomsError = originalError;
      if (activeTimeouts['listRooms']) {
        clearTimeout(activeTimeouts['listRooms']);
        delete activeTimeouts['listRooms'];
      }
      reject(new Error('No hay conexión con el servidor'));
    }
  });
}

/**
 * Cancela todas las operaciones pendientes del lobby
 */
export function cancelarOperacionesPendientes() {
  // Limpiar todos los timeouts activos
  Object.keys(activeTimeouts).forEach(key => {
    clearTimeout(activeTimeouts[key]);
    delete activeTimeouts[key];
  });
}

/**
 * Verifica si hay una conexión activa con el servidor
 * @returns {boolean}
 */
export function estaConectado() {
  const connection = getConnection();
  return connection.isConnected();
}

/**
 * Obtiene el ID del jugador actual
 * @returns {string|null}
 */
export function obtenerPlayerId() {
  const connection = getConnection();
  return connection.getPlayerId();
}
