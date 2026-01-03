/**
 * WebSocket Server Entry Point
 * Main server for multiplayer FPS game
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.5, 8.3, 10.3
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

import { GameManager } from './gameManager.js';
import { SERVER_CONFIG } from './config.js';
import { serializeMessage, deserializeMessage, serializeGameState } from './serialization.js';
import { RoomManager } from './rooms/roomManager.js';
import { encontrarMejorSala } from './rooms/matchmaking.js';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Standardized error messages for lobby operations
 * Requirements: 6.1, 6.2, 6.3
 */
const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: 'Sala no encontrada',
  WRONG_PASSWORD: 'Contraseña incorrecta',
  ROOM_FULL: 'Partida llena',
  MATCHMAKING_FAILED: 'No se pudo encontrar partida',
  UNKNOWN_ACTION: 'Acción no reconocida'
};

// Create Express app for static file serving (Requirement 8.3)
const app = express();
const server = createServer(app);

// Serve static files from project root
app.use(express.static(path.join(__dirname, '..')));

// Create WebSocket server (Requirement 1.1)
const wss = new WebSocketServer({ server });

// Create game manager instance (for legacy/local mode)
const gameManager = new GameManager();

// Create room manager instance for lobby system (Requirement 10.1)
const roomManager = new RoomManager();

// Map to track WebSocket connections by player ID
const connections = new Map();

// Map to track which room each player is in
const playerRooms = new Map();

/**
 * Handle new WebSocket connection (Requirement 1.2)
 * @param {WebSocket} ws - WebSocket connection
 */
function handleConnection(ws) {
  // Generate a temporary player ID for the connection
  const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Store connection with temporary ID
  connections.set(playerId, ws);
  ws.playerId = playerId;
  ws.inLobby = true; // Player starts in lobby mode
  
  console.log(`Client connected: ${playerId}`);
  
  // Send connection acknowledgment (player will join a room via lobby)
  const connectMessage = serializeMessage('connected', {
    playerId: playerId
  });
  ws.send(connectMessage);
  
  // Set up message handler
  ws.on('message', (data) => handleMessage(ws, data));
  
  // Set up disconnection handler (Requirement 1.3)
  ws.on('close', () => handleDisconnection(ws));
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${playerId}:`, error.message);
  });
}

/**
 * Handle lobby-related messages
 * Requirements: 5.2, 5.3, 5.4, 5.5, 6.1, 6.5, 10.3
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} message - Parsed message object
 */
function handleLobbyMessage(ws, message) {
  const playerId = ws.playerId;
  const action = message.data.action;
  const data = message.data;
  
  console.log(`[LOBBY] Player ${playerId} action: ${action}`);
  
  switch (action) {
    case 'matchmaking': {
      // Requirement 6.1: Search for public rooms with available space
      const sala = encontrarMejorSala(roomManager);
      const playerName = data.playerName || `Jugador_${Math.floor(Math.random() * 10000)}`;
      
      // Get current players BEFORE adding the new player (Requirement 5.3)
      const jugadoresActuales = [];
      for (const [id, jugador] of sala.jugadores) {
        jugadoresActuales.push({
          id: jugador.id,
          nombre: jugador.nombre
        });
      }
      
      // Add player to room
      const added = sala.agregarJugador(playerId, playerName);
      
      if (added) {
        playerRooms.set(playerId, sala.id);
        ws.inLobby = false;
        ws.roomId = sala.id;
        
        console.log(`[LOBBY] Player ${playerId} joined room ${sala.codigo} via matchmaking`);
        
        // Send success response with player list (Requirement 5.3)
        ws.send(serializeMessage('lobbyResponse', {
          action: 'matchmaking',
          success: true,
          data: {
            roomId: sala.id,
            roomCode: sala.codigo,
            players: sala.getPlayerCount(),
            maxPlayers: sala.maxJugadores,
            playerList: jugadoresActuales
          }
        }));
        
        // Notify other players in the room (Requirement 5.1)
        broadcastToRoom(sala.id, serializeMessage('playerJoined', {
          player: { id: playerId, nombre: playerName }
        }), playerId);
        
        // Send current game state to the new player
        ws.send(serializeMessage('welcome', {
          playerId: playerId,
          gameState: sala.gameManager.getState()
        }));
      } else {
        // Requirement 6.1: Send descriptive error message for matchmaking failure
        ws.send(serializeMessage('lobbyResponse', {
          action: 'matchmaking',
          success: false,
          data: { error: ERROR_MESSAGES.ROOM_FULL }
        }));
      }
      break;
    }
    
    case 'createPrivate': {
      // Requirement 5.2, 5.3: Create private room with password
      const password = data.password || '';
      const playerName = data.playerName || `Jugador_${Math.floor(Math.random() * 10000)}`;
      
      // Create private room
      const sala = roomManager.crearSala({
        tipo: 'privada',
        password: password
      });
      
      // Add creator to room
      sala.agregarJugador(playerId, playerName);
      playerRooms.set(playerId, sala.id);
      ws.inLobby = false;
      ws.roomId = sala.id;
      
      console.log(`[LOBBY] Player ${playerId} created private room ${sala.codigo}`);
      
      // Send success response with room code
      ws.send(serializeMessage('lobbyResponse', {
        action: 'createPrivate',
        success: true,
        data: {
          roomId: sala.id,
          roomCode: sala.codigo,
          players: sala.getPlayerCount(),
          maxPlayers: sala.maxJugadores
        }
      }));
      
      // Send welcome message with game state
      ws.send(serializeMessage('welcome', {
        playerId: playerId,
        gameState: sala.gameManager.getState()
      }));
      break;
    }
    
    case 'joinPrivate': {
      // Requirement 5.4, 5.5: Join private room with code and password
      const roomCode = data.roomCode;
      const password = data.password || '';
      const playerName = data.playerName || `Jugador_${Math.floor(Math.random() * 10000)}`;
      
      // Find room by code
      const sala = roomManager.obtenerSalaPorCodigo(roomCode);
      
      if (!sala) {
        // Requirement 6.2: Room not found error
        ws.send(serializeMessage('lobbyResponse', {
          action: 'joinPrivate',
          success: false,
          data: { error: ERROR_MESSAGES.ROOM_NOT_FOUND }
        }));
        return;
      }
      
      // Verify password (Requirement 10.4)
      if (!sala.verificarPassword(password)) {
        // Requirement 6.3: Incorrect password error
        ws.send(serializeMessage('lobbyResponse', {
          action: 'joinPrivate',
          success: false,
          data: { error: ERROR_MESSAGES.WRONG_PASSWORD }
        }));
        return;
      }
      
      // Check if room has space (Requirement 10.5)
      if (!sala.tieneEspacio()) {
        // Requirement 6.1: Room is full error
        ws.send(serializeMessage('lobbyResponse', {
          action: 'joinPrivate',
          success: false,
          data: { error: ERROR_MESSAGES.ROOM_FULL }
        }));
        return;
      }
      
      // Get current players BEFORE adding the new player (Requirement 5.3)
      const jugadoresActuales = [];
      for (const [id, jugador] of sala.jugadores) {
        jugadoresActuales.push({
          id: jugador.id,
          nombre: jugador.nombre
        });
      }
      
      // Add player to room
      sala.agregarJugador(playerId, playerName);
      playerRooms.set(playerId, sala.id);
      ws.inLobby = false;
      ws.roomId = sala.id;
      
      console.log(`[LOBBY] Player ${playerId} joined private room ${sala.codigo}`);
      
      // Send success response with player list (Requirement 5.3)
      ws.send(serializeMessage('lobbyResponse', {
        action: 'joinPrivate',
        success: true,
        data: {
          roomId: sala.id,
          roomCode: sala.codigo,
          players: sala.getPlayerCount(),
          maxPlayers: sala.maxJugadores,
          playerList: jugadoresActuales
        }
      }));
      
      // Notify other players in the room (Requirement 5.1)
      broadcastToRoom(sala.id, serializeMessage('playerJoined', {
        player: { id: playerId, nombre: playerName }
      }), playerId);
      
      // Send welcome message with game state
      ws.send(serializeMessage('welcome', {
        playerId: playerId,
        gameState: sala.gameManager.getState()
      }));
      break;
    }
    
    case 'listRooms': {
      // List available public rooms
      const salasDisponibles = roomManager.obtenerSalasPublicasDisponibles();
      const roomList = salasDisponibles.map(sala => ({
        id: sala.id,
        codigo: sala.codigo,
        jugadores: sala.getPlayerCount(),
        maxJugadores: sala.maxJugadores
      }));
      
      ws.send(serializeMessage('lobbyResponse', {
        action: 'listRooms',
        success: true,
        data: { rooms: roomList }
      }));
      break;
    }
    
    default:
      console.warn(`[LOBBY] Unknown action: ${action}`);
      ws.send(serializeMessage('lobbyResponse', {
        action: action,
        success: false,
        data: { error: ERROR_MESSAGES.UNKNOWN_ACTION }
      }));
  }
}

/**
 * Handle incoming message from client
 * @param {WebSocket} ws - WebSocket connection
 * @param {Buffer|string} data - Raw message data
 */
function handleMessage(ws, data) {
  const playerId = ws.playerId;
  
  // Deserialize message (handles malformed data - Requirement 9.5)
  const message = deserializeMessage(data.toString());
  
  if (!message) {
    console.warn(`Malformed message from ${playerId}`);
    return;
  }
  
  // Route lobby messages to lobby handler
  if (message.type === 'lobby') {
    handleLobbyMessage(ws, message);
    return;
  }
  
  // For game messages, get the player's room
  const roomId = playerRooms.get(playerId);
  const sala = roomId ? roomManager.obtenerSala(roomId) : null;
  const currentGameManager = sala ? sala.gameManager : gameManager;
  
  // Mapear tipos de mensaje del cliente a tipos del servidor
  let inputType = message.type;
  let inputData = message.data;
  
  // El cliente envía 'input' para movimiento, mapearlo a 'movement'
  if (message.type === 'input') {
    inputType = 'movement';
    // Convertir formato de input a formato de movimiento
    inputData = {
      rotation: inputData.rotation,
      position: inputData.position,
      isAiming: inputData.isAiming
    };
  }
  
  // Manejar cambio de arma
  if (message.type === 'weaponChange') {
    const player = currentGameManager.getPlayer(playerId);
    if (player && inputData.weaponType) {
      player.changeWeapon(inputData.weaponType);
      console.log(`[WEAPON] Player ${playerId} changed to ${inputData.weaponType}`);
    }
    return;
  }
  
  // Manejar solicitud de respawn
  // Requirements: 4.1, 4.2 - Reaparecer con arma seleccionada
  if (message.type === 'respawn') {
    const player = currentGameManager.getPlayer(playerId);
    if (player) {
      const result = currentGameManager.processRespawnInput(player, inputData);
      
      if (result.success) {
        // Notificar a todos los jugadores en la sala del respawn
        const respawnData = { 
          playerId: playerId,
          weaponType: result.weaponType
        };
        
        if (roomId) {
          broadcastToRoom(roomId, serializeMessage('respawn', respawnData));
        } else {
          broadcast(serializeMessage('respawn', respawnData));
        }
      }
    }
    return;
  }
  
  // Para disparos, actualizar el arma del jugador antes de procesar
  if (message.type === 'shoot' && inputData.weaponType) {
    const player = currentGameManager.getPlayer(playerId);
    if (player && player.currentWeapon !== inputData.weaponType) {
      player.changeWeapon(inputData.weaponType);
    }
  }
  
  // Route message to game manager based on type
  const input = {
    type: inputType,
    data: inputData
  };
  
  const result = currentGameManager.processInput(playerId, input);
  
  // Handle specific message types that need immediate response
  if ((message.type === 'shoot' || inputType === 'shoot') && result && result.success) {
    // Broadcast bullet creation to all clients in the room
    if (roomId) {
      broadcastToRoom(roomId, serializeMessage('bulletCreated', {
        bullet: result.bullet
      }));
    } else {
      broadcast(serializeMessage('bulletCreated', {
        bullet: result.bullet
      }));
    }
  }
}

/**
 * Handle client disconnection (Requirement 1.3)
 * @param {WebSocket} ws - WebSocket connection
 */
function handleDisconnection(ws) {
  const playerId = ws.playerId;
  
  if (!playerId) return;
  
  console.log(`[DISCONNECT] Player ${playerId} disconnecting...`);
  console.log(`[DISCONNECT] Was in lobby: ${ws.inLobby}, Room ID: ${ws.roomId}`);
  
  // Get player's room
  const roomId = playerRooms.get(playerId);
  
  if (roomId) {
    // Remove player from room
    const sala = roomManager.obtenerSala(roomId);
    if (sala) {
      // Get player name before removing (Requirement 5.2)
      const jugador = sala.jugadores.get(playerId);
      const playerName = jugador ? jugador.nombre : 'Jugador';
      
      sala.removerJugador(playerId);
      console.log(`Player ${playerId} (${playerName}) removed from room ${sala.codigo} (Players: ${sala.getPlayerCount()})`);
      
      // Broadcast player left to remaining clients in the room (Requirement 5.2)
      broadcastToRoom(roomId, serializeMessage('playerLeft', {
        playerId: playerId,
        playerName: playerName
      }));
    }
    
    // Remove from player-room mapping
    playerRooms.delete(playerId);
  } else {
    // Legacy mode: remove from global game manager
    gameManager.removePlayer(playerId);
    
    // Broadcast player left to remaining clients
    broadcast(serializeMessage('playerLeft', {
      playerId: playerId
    }));
  }
  
  // Remove connection from map
  connections.delete(playerId);
  
  console.log(`Player disconnected: ${playerId}`);
}

/**
 * Broadcast message to all connected clients
 * @param {string} message - Serialized message
 */
function broadcast(message) {
  for (const [playerId, ws] of connections) {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }
}

/**
 * Broadcast message to all clients except one
 * @param {string} excludePlayerId - Player ID to exclude
 * @param {string} message - Serialized message
 */
function broadcastExcept(excludePlayerId, message) {
  for (const [playerId, ws] of connections) {
    if (playerId !== excludePlayerId && ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }
}

/**
 * Broadcast message to all clients in a specific room
 * @param {string} roomId - Room ID
 * @param {string} message - Serialized message
 * @param {string} [excludePlayerId] - Optional player ID to exclude
 */
function broadcastToRoom(roomId, message, excludePlayerId = null) {
  const sala = roomManager.obtenerSala(roomId);
  if (!sala) return;
  
  for (const [playerId, playerData] of sala.jugadores) {
    if (excludePlayerId && playerId === excludePlayerId) continue;
    
    const ws = connections.get(playerId);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }
}

/**
 * Game loop - runs at 60Hz (Requirement 1.4)
 * Updated to handle multiple rooms
 */
function gameLoop() {
  // Update all active rooms
  for (const [roomId, sala] of roomManager.salas) {
    if (sala.getPlayerCount() === 0) continue;
    
    // Update game state for this room
    const events = sala.gameManager.update();
    
    // Broadcast game state to all clients in the room (Requirement 1.5)
    const stateMessage = serializeMessage('state', sala.gameManager.getState());
    broadcastToRoom(roomId, stateMessage);
    
    // Broadcast specific events
    if (events.deaths.length > 0) {
      for (const death of events.deaths) {
        broadcastToRoom(roomId, serializeMessage('death', death));
      }
    }
    
    if (events.respawns.length > 0) {
      for (const respawn of events.respawns) {
        broadcastToRoom(roomId, serializeMessage('respawn', respawn));
      }
    }
    
    if (events.collisions.length > 0) {
      for (const collision of events.collisions) {
        // Send hit notification to target player
        const targetWs = connections.get(collision.targetId);
        if (targetWs && targetWs.readyState === targetWs.OPEN) {
          targetWs.send(serializeMessage('hit', {
            damage: collision.damage,
            health: collision.targetHealth
          }));
        }
        
        // Send damage dealt notification to shooter (for damage indicators)
        const shooterId = collision.ownerId;
        const shooterWs = connections.get(shooterId);
        if (shooterWs && shooterWs.readyState === shooterWs.OPEN && shooterId !== collision.targetId) {
          shooterWs.send(serializeMessage('damageDealt', {
            damage: collision.damage,
            targetId: collision.targetId,
            targetHealth: collision.targetHealth
          }));
        }
      }
    }
  }
  
  // Also update legacy game manager for players not in rooms
  const legacyEvents = gameManager.update();
  if (gameManager.getPlayerCount() > 0) {
    const stateMessage = serializeMessage('state', gameManager.getState());
    // Broadcast to players not in any room
    for (const [playerId, ws] of connections) {
      if (!playerRooms.has(playerId) && ws.readyState === ws.OPEN) {
        ws.send(stateMessage);
      }
    }
  }
}

// Set up WebSocket connection handler
wss.on('connection', handleConnection);

// Start game loop at configured tick rate (Requirement 1.4)
const tickInterval = setInterval(gameLoop, SERVER_CONFIG.tickInterval);

// Set up periodic cleanup of empty rooms (Requirement 10.3)
const cleanupInterval = setInterval(() => {
  const cleaned = roomManager.limpiarSalasVacias();
  if (cleaned > 0) {
    console.log(`[CLEANUP] Removed ${cleaned} empty room(s). Total rooms: ${roomManager.getTotalSalas()}`);
  }
}, 60 * 1000); // Every 60 seconds

// Get port from environment or config (Requirement 1.1)
const PORT = process.env.PORT || SERVER_CONFIG.port;

// Start server (bind to 0.0.0.0 for cloud deployment)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`Game loop running at ${SERVER_CONFIG.tickRate}Hz`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  clearInterval(tickInterval);
  clearInterval(cleanupInterval);
  
  // Close all connections
  for (const [playerId, ws] of connections) {
    ws.close();
  }
  
  wss.close(() => {
    server.close(() => {
      console.log('Server shut down gracefully');
      process.exit(0);
    });
  });
});

// Export for testing
export { app, wss, gameManager, roomManager, connections, playerRooms, broadcast, broadcastExcept, broadcastToRoom };
