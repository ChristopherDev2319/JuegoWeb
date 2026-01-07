/**
 * Game Server Bridge - CommonJS wrapper for accessing game server state
 * 
 * This module provides a bridge between the Express backend (CommonJS)
 * and the game server state module (ES modules).
 * 
 * Requirements: 1.1, 2.1 - Enable admin panel to access room data
 */

// Since the game server uses ES modules and the backend uses CommonJS,
// we need to use dynamic import to access the game server state.
// The state is stored in a global variable that's set by the game server.

/**
 * Get the RoomManager instance from the game server
 * @returns {Object|null} - RoomManager instance or null if not available
 */
function getRoomManager() {
  // Access the global game server state set by legacyServer
  return global.__gameServerState?.roomManager || null;
}

/**
 * Get the WebSocket connections map from the game server
 * @returns {Map|null} - Connections map or null if not available
 */
function getConnections() {
  return global.__gameServerState?.connections || null;
}

/**
 * Get the player rooms map from the game server
 * @returns {Map|null} - Player rooms map or null if not available
 */
function getPlayerRooms() {
  return global.__gameServerState?.playerRooms || null;
}

/**
 * Check if the game server state is available
 * @returns {boolean}
 */
function isGameServerAvailable() {
  return global.__gameServerState?.initialized === true;
}

/**
 * Get all active rooms with their info
 * @returns {Array} - Array of room info objects
 */
function getAllRooms() {
  const roomManager = getRoomManager();
  if (!roomManager) {
    return [];
  }

  const rooms = [];
  for (const [id, sala] of roomManager.salas) {
    rooms.push({
      id: sala.id,
      codigo: sala.codigo,
      tipo: sala.tipo,
      estado: sala.estado,
      jugadores: sala.getPlayerCount(),
      maxJugadores: sala.maxJugadores,
      creadaEn: sala.creadaEn.toISOString()
    });
  }

  return rooms;
}

/**
 * Get detailed info for a specific room
 * @param {string} roomId - Room ID
 * @returns {Object|null} - Room detail object or null if not found
 */
function getRoomDetail(roomId) {
  const roomManager = getRoomManager();
  if (!roomManager) {
    return null;
  }

  const sala = roomManager.obtenerSala(roomId);
  if (!sala) {
    return null;
  }

  // Get player list
  const players = [];
  for (const [playerId, jugador] of sala.jugadores) {
    players.push({
      id: jugador.id,
      nombre: jugador.nombre,
      listo: jugador.listo
    });
  }

  return {
    room: {
      id: sala.id,
      codigo: sala.codigo,
      tipo: sala.tipo,
      estado: sala.estado,
      jugadores: sala.getPlayerCount(),
      maxJugadores: sala.maxJugadores,
      creadaEn: sala.creadaEn.toISOString()
    },
    players
  };
}

/**
 * Kick a player from a room
 * @param {string} roomId - Room ID
 * @param {string} playerId - Player ID to kick
 * @param {string} [reason] - Optional reason for kick
 * @returns {Object} - Result object with success and message
 */
function kickPlayer(roomId, playerId, reason = 'Expulsado por administrador') {
  const roomManager = getRoomManager();
  const connections = getConnections();
  const playerRooms = getPlayerRooms();

  if (!roomManager || !connections) {
    return {
      success: false,
      message: 'Servidor de juego no disponible'
    };
  }

  const sala = roomManager.obtenerSala(roomId);
  if (!sala) {
    return {
      success: false,
      message: 'Sala no encontrada'
    };
  }

  if (!sala.jugadores.has(playerId)) {
    return {
      success: false,
      message: 'Jugador no encontrado en la sala'
    };
  }

  // Get player's WebSocket connection
  const ws = connections.get(playerId);
  
  if (ws && ws.readyState === ws.OPEN) {
    // Send kicked message to player before closing connection
    // Requirements: 3.3 - Notify kicked player with disconnect message
    const kickMessage = JSON.stringify({
      type: 'kicked',
      data: {
        reason: reason,
        kickedBy: 'admin'
      },
      timestamp: Date.now()
    });
    
    ws.send(kickMessage);
    
    // Close WebSocket connection with appropriate code (4000 = kicked by admin)
    ws.close(4000, 'Kicked by admin');
  }

  // Remove player from room
  // Requirements: 3.2 - Remove player from room immediately
  sala.removerJugador(playerId);
  
  // Clean up player rooms mapping
  if (playerRooms) {
    playerRooms.delete(playerId);
  }
  
  // Clean up connections mapping
  connections.delete(playerId);

  return {
    success: true,
    message: 'Jugador expulsado exitosamente'
  };
}

module.exports = {
  getRoomManager,
  getConnections,
  getPlayerRooms,
  isGameServerAvailable,
  getAllRooms,
  getRoomDetail,
  kickPlayer
};
