/**
 * Game Server State - Shared module for accessing game server state
 * 
 * This module provides a centralized way to access the game server's
 * RoomManager and WebSocket connections from other parts of the application
 * (e.g., the backend API for admin room management).
 * 
 * Requirements: 1.1, 2.1 - Enable admin panel to access room data
 */

// Singleton state object
const gameServerState = {
  /** @type {import('./rooms/roomManager.js').RoomManager|null} */
  roomManager: null,
  
  /** @type {Map<string, WebSocket>|null} */
  connections: null,
  
  /** @type {Map<string, string>|null} - Map of playerId to roomId */
  playerRooms: null,
  
  /** @type {boolean} */
  initialized: false
};

/**
 * Initialize the game server state with references
 * Called by legacyServer when it starts
 * @param {Object} state
 * @param {import('./rooms/roomManager.js').RoomManager} state.roomManager
 * @param {Map<string, WebSocket>} state.connections
 * @param {Map<string, string>} state.playerRooms
 */
export function initializeGameServerState({ roomManager, connections, playerRooms }) {
  gameServerState.roomManager = roomManager;
  gameServerState.connections = connections;
  gameServerState.playerRooms = playerRooms;
  gameServerState.initialized = true;
  
  // Also set global for CommonJS bridge (backend API access)
  // This allows the Express backend to access game server state
  global.__gameServerState = gameServerState;
  
  console.log('[GameServerState] Initialized with roomManager and connections');
}

/**
 * Get the RoomManager instance
 * @returns {import('./rooms/roomManager.js').RoomManager|null}
 */
export function getRoomManager() {
  return gameServerState.roomManager;
}

/**
 * Get the WebSocket connections map
 * @returns {Map<string, WebSocket>|null}
 */
export function getConnections() {
  return gameServerState.connections;
}

/**
 * Get the player rooms map
 * @returns {Map<string, string>|null}
 */
export function getPlayerRooms() {
  return gameServerState.playerRooms;
}

/**
 * Check if the game server state is initialized
 * @returns {boolean}
 */
export function isInitialized() {
  return gameServerState.initialized;
}

/**
 * Get all state (for debugging/testing)
 * @returns {Object}
 */
export function getGameServerState() {
  return { ...gameServerState };
}

export default gameServerState;
