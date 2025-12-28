/**
 * Bullet System Module
 * Manages bullet creation, movement, and collision detection
 * 
 * Requirements: 5.2, 5.3
 */

import { WEAPON_CONFIG, BULLET_CONFIG } from './config.js';

let bulletIdCounter = 0;

/**
 * Bullet class representing a projectile
 */
export class Bullet {
  constructor(ownerId, position, direction) {
    this.id = `bullet_${++bulletIdCounter}`;
    this.ownerId = ownerId;
    this.position = { ...position };
    this.direction = normalizeDirection(direction);
    this.speed = WEAPON_CONFIG.bulletSpeed;
    this.damage = WEAPON_CONFIG.damage;
    this.createdAt = Date.now();
    this.active = true;
  }

  /**
   * Update bullet position based on direction and speed
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    if (!this.active) return;
    
    this.position.x += this.direction.x * this.speed * deltaTime;
    this.position.y += this.direction.y * this.speed * deltaTime;
    this.position.z += this.direction.z * this.speed * deltaTime;
  }

  /**
   * Check if bullet has exceeded its lifetime
   */
  isExpired() {
    return Date.now() - this.createdAt > BULLET_CONFIG.lifetime;
  }

  /**
   * Check if bullet has traveled too far
   */
  isTooFar() {
    const distance = Math.sqrt(
      this.position.x * this.position.x +
      this.position.y * this.position.y +
      this.position.z * this.position.z
    );
    return distance > BULLET_CONFIG.maxDistance;
  }

  /**
   * Deactivate bullet
   */
  deactivate() {
    this.active = false;
  }

  /**
   * Serialize bullet for network transmission
   */
  toJSON() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      position: { ...this.position },
      direction: { ...this.direction }
    };
  }
}

/**
 * BulletSystem class managing all bullets
 */
export class BulletSystem {
  constructor() {
    this.bullets = [];
  }

  /**
   * Create a new bullet (Requirement 5.2)
   * @param {string} ownerId - ID of the player who fired
   * @param {Object} position - Starting position {x, y, z}
   * @param {Object} direction - Direction vector {x, y, z}
   * @returns {Bullet} - The created bullet
   */
  createBullet(ownerId, position, direction) {
    const bullet = new Bullet(ownerId, position, direction);
    this.bullets.push(bullet);
    return bullet;
  }

  /**
   * Update all bullets and check for collisions (Requirement 5.3)
   * @param {number} deltaTime - Time since last update in seconds
   * @param {Map<string, PlayerState>} players - Map of all players
   * @returns {Array} - Array of collision results
   */
  update(deltaTime, players) {
    const collisions = [];
    
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      
      // Update bullet position
      bullet.update(deltaTime);
      
      // Check for expiration
      if (bullet.isExpired() || bullet.isTooFar()) {
        bullet.deactivate();
        continue;
      }
      
      // Check for collisions with players
      for (const [playerId, player] of players) {
        // Skip bullet owner and dead players
        if (playerId === bullet.ownerId || !player.isAlive) continue;
        
        if (this.checkCollision(bullet, player)) {
          collisions.push({
            bulletId: bullet.id,
            ownerId: bullet.ownerId,
            targetId: playerId,
            damage: bullet.damage,
            position: { ...bullet.position }
          });
          bullet.deactivate();
          break;
        }
      }
    }
    
    // Clean up inactive bullets
    this.cleanup();
    
    return collisions;
  }

  /**
   * Check collision between bullet and player
   * Uses simple sphere collision detection
   * @param {Bullet} bullet - The bullet to check
   * @param {PlayerState} player - The player to check against
   * @returns {boolean} - True if collision detected
   */
  checkCollision(bullet, player) {
    const playerRadius = 0.5; // Player hitbox radius
    const playerHeight = 1.7; // Player height
    
    // Calculate distance from bullet to player center
    const dx = bullet.position.x - player.position.x;
    const dy = bullet.position.y - (player.position.y - playerHeight / 2);
    const dz = bullet.position.z - player.position.z;
    
    // Simple cylinder collision (horizontal distance + height check)
    const horizontalDist = Math.sqrt(dx * dx + dz * dz);
    const verticalDist = Math.abs(dy);
    
    return horizontalDist < playerRadius && verticalDist < playerHeight / 2;
  }

  /**
   * Remove a specific bullet by ID
   * @param {string} bulletId - ID of bullet to remove
   */
  removeBullet(bulletId) {
    const index = this.bullets.findIndex(b => b.id === bulletId);
    if (index !== -1) {
      this.bullets.splice(index, 1);
    }
  }

  /**
   * Clean up inactive bullets
   */
  cleanup() {
    this.bullets = this.bullets.filter(b => b.active);
  }

  /**
   * Get all active bullets
   * @returns {Array<Bullet>} - Array of active bullets
   */
  getActiveBullets() {
    return this.bullets.filter(b => b.active);
  }

  /**
   * Serialize all bullets for network transmission
   */
  toJSON() {
    return this.bullets.filter(b => b.active).map(b => b.toJSON());
  }

  /**
   * Clear all bullets
   */
  clear() {
    this.bullets = [];
  }
}

/**
 * Normalize a direction vector
 * @param {Object} direction - Direction vector {x, y, z}
 * @returns {Object} - Normalized direction vector
 */
function normalizeDirection(direction) {
  const length = Math.sqrt(
    direction.x * direction.x +
    direction.y * direction.y +
    direction.z * direction.z
  );
  
  if (length === 0) {
    return { x: 0, y: 0, z: 1 }; // Default forward direction
  }
  
  return {
    x: direction.x / length,
    y: direction.y / length,
    z: direction.z / length
  };
}

/**
 * Create a new bullet system instance
 * @returns {BulletSystem} - New bullet system
 */
export function createBulletSystem() {
  return new BulletSystem();
}
