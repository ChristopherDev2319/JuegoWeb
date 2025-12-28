/**
 * Remote Player Manager Module
 * Manages all remote players in the multiplayer game
 * 
 * Requirements: 3.2, 2.5
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { RemotePlayer } from '../entidades/JugadorRemoto.js';

/**
 * RemotePlayerManager class
 * Handles creation, removal, and updates of remote players
 */
export class RemotePlayerManager {
  /**
   * Create a new remote player manager
   * @param {THREE.Scene} scene - The Three.js scene
   */
  constructor(scene) {
    this.scene = scene;
    this.players = new Map();
    this.localPlayerId = null;
  }

  /**
   * Set the local player ID to exclude from remote rendering
   * @param {string} id - Local player ID
   */
  setLocalPlayerId(id) {
    this.localPlayerId = id;
  }

  /**
   * Add a new remote player (Requirement 3.2)
   * @param {Object} state - Player state from server
   * @returns {RemotePlayer|null} - The created remote player or null if local
   */
  addPlayer(state) {
    // Don't add local player as remote
    if (state.id === this.localPlayerId) {
      return null;
    }

    // Don't add if already exists
    if (this.players.has(state.id)) {
      return this.players.get(state.id);
    }

    const remotePlayer = new RemotePlayer(this.scene, state);
    this.players.set(state.id, remotePlayer);
    
    console.log(`Remote player added: ${state.id}`);
    return remotePlayer;
  }

  /**
   * Remove a remote player (Requirement 2.5)
   * @param {string} id - Player ID to remove
   */
  removePlayer(id) {
    const player = this.players.get(id);
    if (player) {
      player.destroy();
      this.players.delete(id);
      console.log(`Remote player removed: ${id}`);
    }
  }

  /**
   * Update all remote players from game state (Requirement 3.2)
   * @param {Object} gameState - Game state from server containing players array
   */
  updatePlayers(gameState) {
    if (!gameState || !gameState.players) return;

    const serverPlayerIds = new Set();

    // Update existing players and add new ones
    for (const playerState of gameState.players) {
      // Skip local player
      if (playerState.id === this.localPlayerId) continue;

      serverPlayerIds.add(playerState.id);

      const existingPlayer = this.players.get(playerState.id);
      if (existingPlayer) {
        // Update existing player
        existingPlayer.updateFromState(playerState);
      } else {
        // Add new player
        this.addPlayer(playerState);
      }
    }

    // Remove players that are no longer in server state
    for (const [id] of this.players) {
      if (!serverPlayerIds.has(id)) {
        this.removePlayer(id);
      }
    }
  }

  /**
   * Interpolate all remote players for smooth rendering (Requirement 2.5)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  interpolate(deltaTime) {
    for (const player of this.players.values()) {
      player.interpolate(deltaTime);
    }
  }

  /**
   * Get a remote player by ID
   * @param {string} id - Player ID
   * @returns {RemotePlayer|undefined}
   */
  getPlayer(id) {
    return this.players.get(id);
  }

  /**
   * Get all remote players
   * @returns {Map<string, RemotePlayer>}
   */
  getAllPlayers() {
    return this.players;
  }

  /**
   * Get count of remote players
   * @returns {number}
   */
  getPlayerCount() {
    return this.players.size;
  }

  /**
   * Check if a player exists
   * @param {string} id - Player ID
   * @returns {boolean}
   */
  hasPlayer(id) {
    return this.players.has(id);
  }

  /**
   * Clear all remote players
   */
  clear() {
    for (const player of this.players.values()) {
      player.destroy();
    }
    this.players.clear();
    console.log('All remote players cleared');
  }

  /**
   * Get array of all alive remote players
   * @returns {RemotePlayer[]}
   */
  getAlivePlayers() {
    const alive = [];
    for (const player of this.players.values()) {
      if (player.isAlive()) {
        alive.push(player);
      }
    }
    return alive;
  }
}

// Singleton instance for easy access
let managerInstance = null;

/**
 * Initialize the remote player manager
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {RemotePlayerManager}
 */
export function initializeRemotePlayerManager(scene) {
  managerInstance = new RemotePlayerManager(scene);
  return managerInstance;
}

/**
 * Get the remote player manager instance
 * @returns {RemotePlayerManager|null}
 */
export function getRemotePlayerManager() {
  return managerInstance;
}
