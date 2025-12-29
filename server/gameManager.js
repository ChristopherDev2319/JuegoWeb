/**
 * Game Manager Module
 * Central game state management and game loop logic
 * 
 * Requirements: 1.2, 1.3, 4.2, 5.2, 6.2, 7.2
 */

import { PlayerState, createPlayer } from './playerState.js';
import { BulletSystem } from './bulletSystem.js';
import { PLAYER_CONFIG, SERVER_CONFIG, getWeaponConfig } from './config.js';

let playerIdCounter = 0;

/**
 * Generate a unique player ID (Requirement 1.2)
 * @returns {string} - Unique player ID
 */
function generatePlayerId() {
  return `player_${++playerIdCounter}_${Date.now()}`;
}

/**
 * GameManager class - Central game state management
 */
export class GameManager {
  constructor() {
    /** @type {Map<string, PlayerState>} */
    this.players = new Map();
    
    /** @type {BulletSystem} */
    this.bulletSystem = new BulletSystem();
    
    /** @type {number} */
    this.lastUpdateTime = Date.now();
  }

  /**
   * Add a new player to the game (Requirement 1.2)
   * @param {string} [customId] - Optional custom ID for the player
   * @returns {PlayerState} - The created player state
   */
  addPlayer(customId = null) {
    const id = customId || generatePlayerId();
    const player = createPlayer(id);
    this.players.set(id, player);
    return player;
  }

  /**
   * Remove a player from the game (Requirement 1.3)
   * @param {string} playerId - ID of player to remove
   * @returns {boolean} - True if player was removed
   */
  removePlayer(playerId) {
    return this.players.delete(playerId);
  }

  /**
   * Get a player by ID
   * @param {string} playerId - Player ID
   * @returns {PlayerState|undefined} - Player state or undefined
   */
  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  /**
   * Check if a player exists
   * @param {string} playerId - Player ID
   * @returns {boolean} - True if player exists
   */
  hasPlayer(playerId) {
    return this.players.has(playerId);
  }


  /**
   * Process player input (Requirements: 4.2, 5.2, 6.2, 7.2)
   * @param {string} playerId - ID of the player sending input
   * @param {Object} input - Input data
   * @returns {Object|null} - Result of processing or null if invalid
   */
  processInput(playerId, input) {
    const player = this.players.get(playerId);
    if (!player) return null;

    if (!input || typeof input.type !== 'string') {
      return null;
    }

    switch (input.type) {
      case 'movement':
        return this.processMovementInput(player, input.data);
      case 'shoot':
        return this.processShootInput(player, input.data);
      case 'reload':
        return this.processReloadInput(player);
      case 'dash':
        return this.processDashInput(player, input.data);
      case 'jump':
        return this.processJumpInput(player);
      default:
        return null;
    }
  }

  /**
   * Process movement input (Requirement 4.2)
   * @param {PlayerState} player - Player state
   * @param {Object} data - Movement data
   * @returns {Object} - Result
   */
  processMovementInput(player, data) {
    if (!player.isAlive) return { success: false, reason: 'dead' };
    if (!data) return { success: false, reason: 'no_data' };

    // Update position if provided
    if (data.position) {
      player.updatePosition(
        data.position.x ?? player.position.x,
        data.position.y ?? player.position.y,
        data.position.z ?? player.position.z
      );
    }

    // Update rotation if provided
    if (data.rotation) {
      player.updateRotation(
        data.rotation.x ?? player.rotation.x,
        data.rotation.y ?? player.rotation.y,
        data.rotation.z ?? player.rotation.z
      );
    }

    // Update velocity if provided
    if (data.velocity) {
      player.velocity.x = data.velocity.x ?? player.velocity.x;
      player.velocity.y = data.velocity.y ?? player.velocity.y;
      player.velocity.z = data.velocity.z ?? player.velocity.z;
    }

    return { success: true };
  }

  /**
   * Process shoot input (Requirement 5.2)
   * @param {PlayerState} player - Player state
   * @param {Object} data - Shoot data with position and direction
   * @returns {Object} - Result with bullet(s) if created
   */
  processShootInput(player, data) {
    if (!player.canFire()) {
      console.log(`[SHOOT] Player ${player.id} cannot fire: alive=${player.isAlive}, reloading=${player.isReloading}, ammo=${player.ammo}, timeSinceLastFire=${Date.now() - player.lastFireTime}ms`);
      return { success: false, reason: player.isReloading ? 'reloading' : 'cannot_fire' };
    }

    if (!data || !data.position || !data.direction) {
      console.log(`[SHOOT] Player ${player.id} invalid data`);
      return { success: false, reason: 'invalid_data' };
    }

    // Consume ammo
    player.consumeAmmo();

    const weaponType = player.currentWeapon || 'M4A1';
    const weaponConfig = getWeaponConfig(weaponType);
    
    // Obtener número de proyectiles y dispersión
    const numProjectiles = weaponConfig.projectiles || 1;
    const spread = weaponConfig.spread || 0;
    
    const bullets = [];
    
    // Crear múltiples balas para escopetas
    for (let i = 0; i < numProjectiles; i++) {
      // Calcular dirección con dispersión
      let direction = { ...data.direction };
      
      if (spread > 0 && numProjectiles > 1) {
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.z += (Math.random() - 0.5) * spread * 0.5;
        
        // Normalizar dirección
        const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        if (length > 0) {
          direction.x /= length;
          direction.y /= length;
          direction.z /= length;
        }
      }
      
      const bullet = this.bulletSystem.createBullet(
        player.id,
        data.position,
        direction,
        weaponType
      );
      bullets.push(bullet);
    }

    console.log(`[SHOOT] Player ${player.id} fired ${weaponType} (${numProjectiles} projectiles, dmg: ${weaponConfig.damage} each), ammo left: ${player.ammo}`);
    return { success: true, bullets, bullet: bullets[0] }; // bullet para compatibilidad
  }

  /**
   * Process reload input (Requirement 6.2)
   * @param {PlayerState} player - Player state
   * @returns {Object} - Result
   */
  processReloadInput(player) {
    const started = player.startReload();
    return { 
      success: started, 
      reason: started ? null : 'cannot_reload' 
    };
  }

  /**
   * Process dash input (Requirement 7.2)
   * @param {PlayerState} player - Player state
   * @param {Object} data - Dash data with direction
   * @returns {Object} - Result
   */
  processDashInput(player, data) {
    if (!data || !data.direction) {
      return { success: false, reason: 'invalid_data' };
    }

    const executed = player.dash(data.direction);
    return { 
      success: executed, 
      reason: executed ? null : 'no_charges' 
    };
  }

  /**
   * Process jump input
   * @param {PlayerState} player - Player state
   * @returns {Object} - Result
   */
  processJumpInput(player) {
    const jumped = player.jump();
    return { 
      success: jumped, 
      reason: jumped ? null : 'cannot_jump' 
    };
  }


  /**
   * Update game state - main game loop logic
   * @param {number} [deltaTime] - Time since last update in seconds
   * @returns {Object} - Update results including collisions and events
   */
  update(deltaTime = null) {
    const now = Date.now();
    
    // Calculate delta time if not provided
    if (deltaTime === null) {
      deltaTime = (now - this.lastUpdateTime) / 1000;
    }
    this.lastUpdateTime = now;

    const events = {
      collisions: [],
      deaths: [],
      respawns: []
    };

    // Update all players
    for (const [playerId, player] of this.players) {
      // Apply gravity
      player.applyGravity();

      // Check reload completion
      if (player.isReloadComplete()) {
        player.completeReload();
      }

      // Recharge dash
      player.rechargeDash();

      // Check respawn
      if (!player.isAlive && player.canRespawn()) {
        player.respawn();
        events.respawns.push({ playerId });
      }
    }

    // Update bullets and check collisions
    const collisions = this.bulletSystem.update(deltaTime, this.players);

    // Process collisions - apply damage
    for (const collision of collisions) {
      const target = this.players.get(collision.targetId);
      if (target) {
        console.log(`[HIT] Bullet ${collision.bulletId} from ${collision.ownerId} hit ${collision.targetId} for ${collision.damage} damage`);
        const died = target.applyDamage(collision.damage);
        console.log(`[HIT] ${collision.targetId} health: ${target.health}/${target.maxHealth}`);
        events.collisions.push({
          ...collision,
          targetHealth: target.health
        });

        if (died) {
          console.log(`[DEATH] ${collision.targetId} killed by ${collision.ownerId}`);
          events.deaths.push({
            playerId: collision.targetId,
            killerId: collision.ownerId
          });
        }
      }
    }

    return events;
  }

  /**
   * Get current game state for broadcasting
   * @returns {Object} - Game state with players and bullets
   */
  getState() {
    const players = [];
    for (const [id, player] of this.players) {
      players.push(player.toJSON());
    }

    return {
      players,
      bullets: this.bulletSystem.toJSON()
    };
  }

  /**
   * Get player count
   * @returns {number} - Number of connected players
   */
  getPlayerCount() {
    return this.players.size;
  }

  /**
   * Get all player IDs
   * @returns {string[]} - Array of player IDs
   */
  getPlayerIds() {
    return Array.from(this.players.keys());
  }

  /**
   * Reset the game state
   */
  reset() {
    this.players.clear();
    this.bulletSystem.clear();
    this.lastUpdateTime = Date.now();
  }
}

/**
 * Create a new game manager instance
 * @returns {GameManager} - New game manager
 */
export function createGameManager() {
  return new GameManager();
}
