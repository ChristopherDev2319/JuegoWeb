/**
 * WebSocket Server Entry Point
 * Main server for multiplayer FPS game
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 8.3
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

import { GameManager } from './gameManager.js';
import { SERVER_CONFIG } from './config.js';
import { serializeMessage, deserializeMessage, serializeGameState } from './serialization.js';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app for static file serving (Requirement 8.3)
const app = express();
const server = createServer(app);

// Serve static files from project root
app.use(express.static(path.join(__dirname, '..')));

// Create WebSocket server (Requirement 1.1)
const wss = new WebSocketServer({ server });

// Create game manager instance
const gameManager = new GameManager();

// Map to track WebSocket connections by player ID
const connections = new Map();

/**
 * Handle new WebSocket connection (Requirement 1.2)
 * @param {WebSocket} ws - WebSocket connection
 */
function handleConnection(ws) {
  // Add player to game and get assigned ID
  const player = gameManager.addPlayer();
  const playerId = player.id;
  
  // Store connection
  connections.set(playerId, ws);
  ws.playerId = playerId;
  
  console.log(`Player connected: ${playerId} (Total: ${gameManager.getPlayerCount()})`);
  
  // Send welcome message with player ID and initial game state (Requirement 1.2)
  const welcomeMessage = serializeMessage('welcome', {
    playerId: playerId,
    gameState: gameManager.getState()
  });
  ws.send(welcomeMessage);
  
  // Broadcast player joined to other clients
  broadcastExcept(playerId, serializeMessage('playerJoined', {
    player: player.toJSON()
  }));
  
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
  
  // Mapear tipos de mensaje del cliente a tipos del servidor
  let inputType = message.type;
  let inputData = message.data;
  
  // El cliente envía 'input' para movimiento, mapearlo a 'movement'
  if (message.type === 'input') {
    inputType = 'movement';
    // Convertir formato de input a formato de movimiento
    inputData = {
      rotation: inputData.rotation,
      position: inputData.position
    };
  }
  
  // Manejar cambio de arma
  if (message.type === 'weaponChange') {
    const player = gameManager.getPlayer(playerId);
    if (player && inputData.weaponType) {
      player.changeWeapon(inputData.weaponType);
      console.log(`[WEAPON] Player ${playerId} changed to ${inputData.weaponType}`);
    }
    return;
  }
  
  // Para disparos, actualizar el arma del jugador antes de procesar
  if (message.type === 'shoot' && inputData.weaponType) {
    const player = gameManager.getPlayer(playerId);
    if (player && player.currentWeapon !== inputData.weaponType) {
      player.changeWeapon(inputData.weaponType);
    }
  }
  
  // Route message to game manager based on type
  const input = {
    type: inputType,
    data: inputData
  };
  
  const result = gameManager.processInput(playerId, input);
  
  // Handle specific message types that need immediate response
  if ((message.type === 'shoot' || inputType === 'shoot') && result && result.success) {
    // Broadcast bullet creation to all clients
    broadcast(serializeMessage('bulletCreated', {
      bullet: result.bullet
    }));
  }
}

/**
 * Handle client disconnection (Requirement 1.3)
 * @param {WebSocket} ws - WebSocket connection
 */
function handleDisconnection(ws) {
  const playerId = ws.playerId;
  
  if (!playerId) return;
  
  // Remove player from game
  gameManager.removePlayer(playerId);
  
  // Remove connection from map
  connections.delete(playerId);
  
  console.log(`Player disconnected: ${playerId} (Total: ${gameManager.getPlayerCount()})`);
  
  // Broadcast player left to remaining clients
  broadcast(serializeMessage('playerLeft', {
    playerId: playerId
  }));
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
 * Game loop - runs at 60Hz (Requirement 1.4)
 */
function gameLoop() {
  // Update game state
  const events = gameManager.update();
  
  // Broadcast game state to all clients (Requirement 1.5)
  const stateMessage = serializeMessage('state', gameManager.getState());
  broadcast(stateMessage);
  
  // Broadcast specific events
  if (events.deaths.length > 0) {
    for (const death of events.deaths) {
      broadcast(serializeMessage('death', death));
    }
  }
  
  if (events.respawns.length > 0) {
    for (const respawn of events.respawns) {
      broadcast(serializeMessage('respawn', respawn));
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

// Set up WebSocket connection handler
wss.on('connection', handleConnection);

// Start game loop at configured tick rate (Requirement 1.4)
const tickInterval = setInterval(gameLoop, SERVER_CONFIG.tickInterval);

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
export { app, wss, gameManager, connections, broadcast, broadcastExcept };
