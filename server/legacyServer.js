/**
 * Legacy Single-Process Server
 * Original server implementation for development and fallback mode
 * 
 * This module contains the original server code that runs without clustering.
 * Used when CLUSTER_ENABLED=false or NODE_ENV=development
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
import { serializeMessage, deserializeMessage } from './serialization.js';
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

// Server instances (initialized in startLegacyServer)
let app = null;
let server = null;
let wss = null;
let gameManager = null;
let roomManager = null;
let connections = null;
let playerRooms = null;
let tickInterval = null;
let cleanupInterval = null;

/**
 * Handle new WebSocket connection (Requirement 1.2)
 * @param {WebSocket} ws - WebSocket connection
 */
function handleConnection(ws) {
  const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  connections.set(playerId, ws);
  ws.playerId = playerId;
  ws.inLobby = true;
  
  console.log(`Client connected: ${playerId}`);
  
  const connectMessage = serializeMessage('connected', { playerId });
  ws.send(connectMessage);
  
  ws.on('message', (data) => handleMessage(ws, data));
  ws.on('close', () => handleDisconnection(ws));
  ws.on('error', (error) => {
    console.error(`WebSocket error for ${playerId}:`, error.message);
  });
}

/**
 * Handle lobby-related messages
 */
function handleLobbyMessage(ws, message) {
  const playerId = ws.playerId;
  const action = message.data.action;
  const data = message.data;
  
  console.log(`[LOBBY] Player ${playerId} action: ${action}`);
  
  switch (action) {
    case 'matchmaking': {
      const sala = encontrarMejorSala(roomManager);
      const playerName = data.playerName || `Jugador_${Math.floor(Math.random() * 10000)}`;
      const weaponType = data.weaponType || 'M4A1';
      
      const jugadoresActuales = [];
      for (const [, jugador] of sala.jugadores) {
        jugadoresActuales.push({ id: jugador.id, nombre: jugador.nombre });
      }
      
      const added = sala.agregarJugador(playerId, playerName, weaponType);
      
      if (added) {
        playerRooms.set(playerId, sala.id);
        ws.inLobby = false;
        ws.roomId = sala.id;
        
        console.log(`[LOBBY] Player ${playerId} joined room ${sala.codigo} via matchmaking`);
        
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
        
        broadcastToRoom(sala.id, serializeMessage('playerJoined', {
          player: { id: playerId, nombre: playerName }
        }), playerId);
        
        ws.send(serializeMessage('welcome', {
          playerId,
          gameState: sala.gameManager.getState()
        }));
      } else {
        ws.send(serializeMessage('lobbyResponse', {
          action: 'matchmaking',
          success: false,
          data: { error: ERROR_MESSAGES.ROOM_FULL }
        }));
      }
      break;
    }
    
    case 'createPrivate': {
      const password = data.password || '';
      const playerName = data.playerName || `Jugador_${Math.floor(Math.random() * 10000)}`;
      const weaponType = data.weaponType || 'M4A1';
      
      const sala = roomManager.crearSala({ tipo: 'privada', password });
      sala.agregarJugador(playerId, playerName, weaponType);
      playerRooms.set(playerId, sala.id);
      ws.inLobby = false;
      ws.roomId = sala.id;
      
      console.log(`[LOBBY] Player ${playerId} created private room ${sala.codigo}`);
      
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
      
      ws.send(serializeMessage('welcome', {
        playerId,
        gameState: sala.gameManager.getState()
      }));
      break;
    }
    
    case 'joinPrivate': {
      const roomCode = data.roomCode;
      const password = data.password || '';
      const playerName = data.playerName || `Jugador_${Math.floor(Math.random() * 10000)}`;
      
      const sala = roomManager.obtenerSalaPorCodigo(roomCode);
      
      if (!sala) {
        ws.send(serializeMessage('lobbyResponse', {
          action: 'joinPrivate',
          success: false,
          data: { error: ERROR_MESSAGES.ROOM_NOT_FOUND }
        }));
        return;
      }
      
      if (!sala.verificarPassword(password)) {
        ws.send(serializeMessage('lobbyResponse', {
          action: 'joinPrivate',
          success: false,
          data: { error: ERROR_MESSAGES.WRONG_PASSWORD }
        }));
        return;
      }
      
      if (!sala.tieneEspacio()) {
        ws.send(serializeMessage('lobbyResponse', {
          action: 'joinPrivate',
          success: false,
          data: { error: ERROR_MESSAGES.ROOM_FULL }
        }));
        return;
      }
      
      const jugadoresActuales = [];
      for (const [, jugador] of sala.jugadores) {
        jugadoresActuales.push({ id: jugador.id, nombre: jugador.nombre });
      }
      
      const weaponType = data.weaponType || 'M4A1';
      sala.agregarJugador(playerId, playerName, weaponType);
      playerRooms.set(playerId, sala.id);
      ws.inLobby = false;
      ws.roomId = sala.id;
      
      console.log(`[LOBBY] Player ${playerId} joined private room ${sala.codigo}`);
      
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
      
      broadcastToRoom(sala.id, serializeMessage('playerJoined', {
        player: { id: playerId, nombre: playerName }
      }), playerId);
      
      ws.send(serializeMessage('welcome', {
        playerId,
        gameState: sala.gameManager.getState()
      }));
      break;
    }
    
    case 'listRooms': {
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
        action,
        success: false,
        data: { error: ERROR_MESSAGES.UNKNOWN_ACTION }
      }));
  }
}

/**
 * Handle incoming message from client
 */
function handleMessage(ws, data) {
  const playerId = ws.playerId;
  const message = deserializeMessage(data.toString());
  
  if (!message) {
    console.warn(`Malformed message from ${playerId}`);
    return;
  }
  
  if (message.type === 'lobby') {
    handleLobbyMessage(ws, message);
    return;
  }
  
  const roomId = playerRooms.get(playerId);
  const sala = roomId ? roomManager.obtenerSala(roomId) : null;
  const currentGameManager = sala ? sala.gameManager : gameManager;
  
  let inputType = message.type;
  let inputData = message.data;
  
  if (message.type === 'input') {
    inputType = 'movement';
    inputData = {
      rotation: inputData.rotation,
      position: inputData.position,
      isAiming: inputData.isAiming
    };
  }
  
  if (message.type === 'weaponChange') {
    const player = currentGameManager.getPlayer(playerId);
    if (player && inputData.weaponType) {
      player.changeWeapon(inputData.weaponType);
      console.log(`[WEAPON] Player ${playerId} changed to ${inputData.weaponType}`);
    }
    return;
  }
  
  if (message.type === 'respawn') {
    const player = currentGameManager.getPlayer(playerId);
    if (player) {
      const result = currentGameManager.processRespawnInput(player, inputData);
      if (result.success) {
        const respawnData = { playerId, weaponType: result.weaponType };
        if (roomId) {
          broadcastToRoom(roomId, serializeMessage('respawn', respawnData));
        } else {
          broadcast(serializeMessage('respawn', respawnData));
        }
      }
    }
    return;
  }
  
  if (message.type === 'shoot' && inputData.weaponType) {
    const player = currentGameManager.getPlayer(playerId);
    if (player && player.currentWeapon !== inputData.weaponType) {
      player.changeWeapon(inputData.weaponType);
    }
  }
  
  // Handle melee attack - ensure player has KNIFE equipped
  if (message.type === 'meleeAttack') {
    const player = currentGameManager.getPlayer(playerId);
    if (player) {
      // Asegurar que el jugador tiene el cuchillo equipado en el servidor
      if (player.currentWeapon !== 'KNIFE') {
        player.changeWeapon('KNIFE');
        console.log(`[MELEE] Auto-equipped KNIFE for player ${playerId}`);
      }
    }
  }
  
  // Handle healing events - broadcast to other players for TPS animation
  // Requirements: 5.1 - Show JuiceBox and healing animation on remote players
  if (message.type === 'healStart') {
    const healingData = {
      playerId: playerId,
      healing: true
    };
    if (roomId) {
      broadcastToRoom(roomId, serializeMessage('playerHealing', healingData), playerId);
    } else {
      broadcast(serializeMessage('playerHealing', healingData));
    }
    console.log(`[HEAL] Player ${playerId} started healing`);
    return;
  }
  
  if (message.type === 'healCancel' || message.type === 'healComplete') {
    const healingData = {
      playerId: playerId,
      healing: false
    };
    if (roomId) {
      broadcastToRoom(roomId, serializeMessage('playerHealing', healingData), playerId);
    } else {
      broadcast(serializeMessage('playerHealing', healingData));
    }
    console.log(`[HEAL] Player ${playerId} ${message.type === 'healCancel' ? 'cancelled' : 'completed'} healing`);
    return;
  }
  
  const input = { type: inputType, data: inputData };
  const result = currentGameManager.processInput(playerId, input);
  
  if ((message.type === 'shoot' || inputType === 'shoot') && result && result.success) {
    if (roomId) {
      broadcastToRoom(roomId, serializeMessage('bulletCreated', { bullet: result.bullet }));
    } else {
      broadcast(serializeMessage('bulletCreated', { bullet: result.bullet }));
    }
  }

  // Broadcast melee attack to other players for TPS animation
  if ((message.type === 'meleeAttack' || inputType === 'meleeAttack') && result && result.success) {
    const meleeData = {
      attackerId: playerId,
      hits: result.hits || []
    };
    if (roomId) {
      broadcastToRoom(roomId, serializeMessage('meleeAttack', meleeData), playerId);
    } else {
      broadcast(serializeMessage('meleeAttack', meleeData));
    }
    
    // Requirements: 4.1, 4.2 - Send damageDealt notification to attacker for each hit
    // This enables the damage indicator to show for melee attacks in multiplayer
    if (result.hits && result.hits.length > 0) {
      const attackerWs = connections.get(playerId);
      if (attackerWs && attackerWs.readyState === attackerWs.OPEN) {
        for (const hit of result.hits) {
          const targetPlayer = currentGameManager.getPlayer(hit.targetId);
          attackerWs.send(serializeMessage('damageDealt', {
            damage: hit.damage,
            targetId: hit.targetId,
            targetHealth: targetPlayer ? targetPlayer.health : 0
          }));
        }
      }
      
      // Send death event for kills by knife
      // This ensures the victim sees the death screen and can respawn
      for (const hit of result.hits) {
        if (hit.killed) {
          const sala = roomId ? roomManager.obtenerSala(roomId) : null;
          if (sala) {
            sala.registrarKill(playerId);
          }
          
          const killer = sala?.jugadores.get(playerId);
          const victim = sala?.jugadores.get(hit.targetId);
          
          const deathData = {
            playerId: hit.targetId,
            killerId: playerId,
            killerName: killer?.nombre || playerId,
            victimName: victim?.nombre || hit.targetId,
            scoreboard: sala?.obtenerScoreboard() || []
          };
          
          if (roomId) {
            broadcastToRoom(roomId, serializeMessage('death', deathData));
          } else {
            broadcast(serializeMessage('death', deathData));
          }
          
          console.log(`[MELEE DEATH] Broadcast death event: ${hit.targetId} killed by ${playerId}`);
        }
      }
    }
  }
}

/**
 * Handle client disconnection
 */
function handleDisconnection(ws) {
  const playerId = ws.playerId;
  if (!playerId) return;
  
  console.log(`[DISCONNECT] Player ${playerId} disconnecting...`);
  
  const roomId = playerRooms.get(playerId);
  
  if (roomId) {
    const sala = roomManager.obtenerSala(roomId);
    if (sala) {
      const jugador = sala.jugadores.get(playerId);
      const playerName = jugador ? jugador.nombre : 'Jugador';
      
      sala.removerJugador(playerId);
      console.log(`Player ${playerId} (${playerName}) removed from room ${sala.codigo}`);
      
      broadcastToRoom(roomId, serializeMessage('playerLeft', { playerId, playerName }));
    }
    playerRooms.delete(playerId);
  } else {
    gameManager.removePlayer(playerId);
    broadcast(serializeMessage('playerLeft', { playerId }));
  }
  
  connections.delete(playerId);
  console.log(`Player disconnected: ${playerId}`);
}

/**
 * Broadcast message to all connected clients
 */
function broadcast(message) {
  for (const [, ws] of connections) {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }
}

/**
 * Broadcast message to all clients in a specific room
 */
function broadcastToRoom(roomId, message, excludePlayerId = null) {
  const sala = roomManager.obtenerSala(roomId);
  if (!sala) return;
  
  for (const [playerId] of sala.jugadores) {
    if (excludePlayerId && playerId === excludePlayerId) continue;
    
    const ws = connections.get(playerId);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }
}

/**
 * Game loop - runs at 60Hz
 */
function gameLoop() {
  for (const [roomId, sala] of roomManager.salas) {
    if (sala.getPlayerCount() === 0) continue;
    
    const events = sala.gameManager.update();
    
    const gameState = sala.gameManager.getState();
    gameState.scoreboard = sala.obtenerScoreboard();
    broadcastToRoom(roomId, serializeMessage('state', gameState));
    
    if (events.deaths.length > 0) {
      for (const death of events.deaths) {
        sala.registrarKill(death.killerId);
        const killer = sala.jugadores.get(death.killerId);
        const victim = sala.jugadores.get(death.playerId);
        
        broadcastToRoom(roomId, serializeMessage('death', {
          ...death,
          killerName: killer?.nombre || death.killerId,
          victimName: victim?.nombre || death.playerId,
          scoreboard: sala.obtenerScoreboard()
        }));
      }
    }
    
    if (events.respawns.length > 0) {
      for (const respawn of events.respawns) {
        broadcastToRoom(roomId, serializeMessage('respawn', respawn));
      }
    }
    
    if (events.collisions.length > 0) {
      for (const collision of events.collisions) {
        const targetWs = connections.get(collision.targetId);
        if (targetWs && targetWs.readyState === targetWs.OPEN) {
          targetWs.send(serializeMessage('hit', {
            damage: collision.damage,
            health: collision.targetHealth
          }));
        }
        
        const shooterWs = connections.get(collision.ownerId);
        if (shooterWs && shooterWs.readyState === shooterWs.OPEN && collision.ownerId !== collision.targetId) {
          shooterWs.send(serializeMessage('damageDealt', {
            damage: collision.damage,
            targetId: collision.targetId,
            targetHealth: collision.targetHealth
          }));
        }
      }
    }
  }
  
  // Update legacy game manager
  gameManager.update();
  if (gameManager.getPlayerCount() > 0) {
    const stateMessage = serializeMessage('state', gameManager.getState());
    for (const [playerId, ws] of connections) {
      if (!playerRooms.has(playerId) && ws.readyState === ws.OPEN) {
        ws.send(stateMessage);
      }
    }
  }
}

/**
 * Starts the legacy single-process server
 */
export function startLegacyServer() {
  console.log('[LEGACY] Starting single-process server...');
  
  // Initialize instances
  app = express();
  server = createServer(app);
  wss = new WebSocketServer({ server });
  gameManager = new GameManager();
  roomManager = new RoomManager();
  connections = new Map();
  playerRooms = new Map();
  
  // Serve static files
  app.use(express.static(path.join(__dirname, '..')));
  
  // Set up WebSocket handler
  wss.on('connection', handleConnection);
  
  // Start game loop
  tickInterval = setInterval(gameLoop, SERVER_CONFIG.tickInterval);
  
  // Set up room cleanup
  cleanupInterval = setInterval(() => {
    const cleaned = roomManager.limpiarSalasVacias();
    if (cleaned > 0) {
      console.log(`[CLEANUP] Removed ${cleaned} empty room(s)`);
    }
  }, 60 * 1000);
  
  // Get port
  const PORT = process.env.PORT || SERVER_CONFIG.port;
  
  // Start server
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[LEGACY] Server running on port ${PORT}`);
    console.log(`[LEGACY] WebSocket server ready`);
    console.log(`[LEGACY] Game loop running at ${SERVER_CONFIG.tickRate}Hz`);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[LEGACY] Shutting down server...');
    clearInterval(tickInterval);
    clearInterval(cleanupInterval);
    
    for (const [, ws] of connections) {
      ws.close();
    }
    
    wss.close(() => {
      server.close(() => {
        console.log('[LEGACY] Server shut down gracefully');
        process.exit(0);
      });
    });
  });
}

// Export for testing
export { app, wss, gameManager, roomManager, connections, playerRooms, broadcast, broadcastToRoom };
