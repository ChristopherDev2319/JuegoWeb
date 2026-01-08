/**
 * Bullet System Module
 * Manages bullet creation, movement, and collision detection
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.2, 5.3
 */

import { BULLET_CONFIG, getWeaponConfig } from './config.js';
import { raycastContraMapa, estaActivo as mapCollisionsActivo } from './mapCollisions.js';

let bulletIdCounter = 0;

// Hitbox del personaje cartoon (rectangular) - más grande para mejor detección
// IMPORTANTE: La posición del jugador (player.position.y) es la altura de los OJOS (1.7 desde el suelo)
const CHARACTER_HITBOX = {
  width: 2.0,   // Ancho (X) - aumentado significativamente para mejor detección
  height: 2.2,  // Altura (Y) - altura total del personaje
  depth: 2.0,   // Profundidad (Z) - aumentado significativamente para mejor detección
  eyeHeight: 1.7 // Altura de los ojos desde los pies
};

/**
 * Bullet class representing a projectile
 */
export class Bullet {
  constructor(ownerId, position, direction, weaponType = 'M4A1', wallHitDistance = null) {
    this.id = `bullet_${++bulletIdCounter}`;
    this.ownerId = ownerId;
    this.position = { ...position };
    this.startPosition = { ...position }; // Guardar posición inicial
    this.direction = normalizeDirection(direction);
    this.weaponType = weaponType;
    
    // Distancia de colisión con pared reportada por el cliente
    // Si existe, la bala no debe hacer daño a jugadores más allá de esta distancia
    this.wallHitDistance = wallHitDistance;
    
    const weaponConfig = getWeaponConfig(weaponType);
    this.speed = weaponConfig.bulletSpeed;
    this.damage = weaponConfig.damage;
    this.headshotMultiplier = weaponConfig.headshotMultiplier || 2.0;
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
   * Check if bullet has traveled too far from its starting position
   */
  isTooFar() {
    const dx = this.position.x - this.startPosition.x;
    const dy = this.position.y - this.startPosition.y;
    const dz = this.position.z - this.startPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance > BULLET_CONFIG.maxDistance;
  }
  
  /**
   * Get current distance traveled from start position
   */
  getDistanceTraveled() {
    const dx = this.position.x - this.startPosition.x;
    const dy = this.position.y - this.startPosition.y;
    const dz = this.position.z - this.startPosition.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * Check if bullet has passed the wall hit distance (client-reported)
   */
  hasPassedWallHit() {
    if (this.wallHitDistance === null) return false;
    return this.getDistanceTraveled() >= this.wallHitDistance;
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
   * @param {string} weaponType - Type of weapon used
   * @param {number} wallHitDistance - Distance to wall collision from client (null if no wall)
   * @returns {Bullet} - The created bullet
   */
  createBullet(ownerId, position, direction, weaponType = 'M4A1', wallHitDistance = null) {
    const bullet = new Bullet(ownerId, position, direction, weaponType, wallHitDistance);
    this.bullets.push(bullet);
    return bullet;
  }

  /**
   * Update all bullets and check for collisions (Requirement 5.3)
   * IMPORTANTE: Usa wallHitDistance del cliente para evitar daño a través de paredes
   * @param {number} deltaTime - Time since last update in seconds
   * @param {Map<string, PlayerState>} players - Map of all players
   * @returns {Array} - Array of collision results
   */
  update(deltaTime, players) {
    const collisions = [];
    
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      
      // Guardar posición anterior para raycast
      const prevPosition = { ...bullet.position };
      
      // Update bullet position
      bullet.update(deltaTime);
      
      // Check for expiration
      if (bullet.isExpired() || bullet.isTooFar()) {
        bullet.deactivate();
        continue;
      }
      
      // Verificar si la bala ha pasado la distancia de colisión con pared (del cliente)
      // Esto es la verificación principal para evitar daño a través de paredes
      if (bullet.hasPassedWallHit()) {
        bullet.deactivate();
        continue;
      }
      
      // Check map collision del servidor (backup, solo paredes exteriores)
      if (this.checkMapCollision(prevPosition, bullet.position)) {
        bullet.deactivate();
        continue;
      }
      
      // Check for collisions with players
      for (const [playerId, player] of players) {
        // Skip bullet owner and dead players
        if (playerId === bullet.ownerId || !player.isAlive) continue;
        
        // Calcular distancia del shooter al jugador objetivo
        const dx = player.position.x - bullet.startPosition.x;
        const dy = player.position.y - bullet.startPosition.y;
        const dz = player.position.z - bullet.startPosition.z;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Si el cliente reportó una pared y el jugador está más lejos que la pared, no hacer daño
        if (bullet.wallHitDistance !== null && distanceToTarget > bullet.wallHitDistance) {
          continue; // El jugador está detrás de la pared
        }
        
        // Verificar colisión con posición actual
        const hitDirect = this.checkCollision(bullet, player);
        
        // Verificar colisión por raycast (para balas rápidas)
        const hitRay = this.checkRayCollision(prevPosition, bullet.position, player);
        
        if (hitDirect || hitRay) {
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
   * Check if there's a wall between two points
   * Used to prevent damage through walls
   * @param {Object} from - Starting position {x, y, z}
   * @param {Object} to - Target position {x, y, z}
   * @returns {boolean} - True if there's a wall between the points
   */
  checkWallBetween(from, to) {
    if (!mapCollisionsActivo()) {
      return false;
    }
    
    const hit = raycastContraMapa(from, to);
    return hit !== null && hit.hit;
  }

  /**
   * Check if bullet trajectory collides with map geometry
   * Requirements: 1.1, 1.2, 1.3
   * @param {Object} from - Previous bullet position {x, y, z}
   * @param {Object} to - Current bullet position {x, y, z}
   * @returns {boolean} - True if bullet hit map geometry
   */
  checkMapCollision(from, to) {
    // Skip if map collisions system is not active
    if (!mapCollisionsActivo()) {
      return false;
    }
    
    // Requirement 1.1: Perform raycast from bullet origin to current position
    // Requirement 1.2: Calculate exact impact point
    const hit = raycastContraMapa(from, to);
    
    // Requirement 1.3: Deactivate bullet if it collides with map
    return hit !== null && hit.hit;
  }

  /**
   * Check ray collision between previous and current bullet position
   * Prevents bullets from passing through players at high speeds
   * Uses rectangular hitbox for cartoon character
   * IMPORTANTE: player.position.y es la altura de los OJOS, no de los pies
   * @param {Object} from - Previous position
   * @param {Object} to - Current position
   * @param {PlayerState} player - Player to check against
   * @returns {boolean} - True if ray intersects player
   */
  checkRayCollision(from, to, player) {
    const halfWidth = CHARACTER_HITBOX.width / 2;
    const halfDepth = CHARACTER_HITBOX.depth / 2;
    const playerHeight = CHARACTER_HITBOX.height;
    const eyeHeight = CHARACTER_HITBOX.eyeHeight;
    
    // La posición del jugador es la de los ojos (eyeHeight desde el suelo)
    const playerFeetY = player.position.y - eyeHeight;
    
    // Usar AABB (Axis-Aligned Bounding Box) para el raycast
    const minX = player.position.x - halfWidth;
    const maxX = player.position.x + halfWidth;
    const minY = playerFeetY;  // Desde los pies
    const maxY = playerFeetY + playerHeight;  // Hasta la cabeza
    const minZ = player.position.z - halfDepth;
    const maxZ = player.position.z + halfDepth;
    
    // Dirección del rayo
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    
    // Calcular t para cada plano
    let tMin = 0;
    let tMax = 1;
    
    // X axis
    if (Math.abs(dx) > 0.0001) {
      const t1 = (minX - from.x) / dx;
      const t2 = (maxX - from.x) / dx;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    } else if (from.x < minX || from.x > maxX) {
      return false;
    }
    
    // Y axis
    if (Math.abs(dy) > 0.0001) {
      const t1 = (minY - from.y) / dy;
      const t2 = (maxY - from.y) / dy;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    } else if (from.y < minY || from.y > maxY) {
      return false;
    }
    
    // Z axis
    if (Math.abs(dz) > 0.0001) {
      const t1 = (minZ - from.z) / dz;
      const t2 = (maxZ - from.z) / dz;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    } else if (from.z < minZ || from.z > maxZ) {
      return false;
    }
    
    return tMin <= tMax;
  }

  /**
   * Check collision between bullet and player
   * Uses rectangular AABB hitbox for cartoon character
   * IMPORTANTE: player.position.y es la altura de los OJOS, no de los pies
   * @param {Bullet} bullet - The bullet to check
   * @param {PlayerState} player - The player to check against
   * @returns {boolean} - True if collision detected
   */
  checkCollision(bullet, player) {
    const halfWidth = CHARACTER_HITBOX.width / 2;
    const halfDepth = CHARACTER_HITBOX.depth / 2;
    const playerHeight = CHARACTER_HITBOX.height;
    const eyeHeight = CHARACTER_HITBOX.eyeHeight;
    
    // La posición del jugador es la de los ojos (eyeHeight desde el suelo)
    // Pies están en: player.position.y - eyeHeight
    // Centro del cuerpo: player.position.y - eyeHeight + playerHeight/2
    const playerFeetY = player.position.y - eyeHeight;
    const playerCenterY = playerFeetY + playerHeight / 2;
    
    // Calcular distancia desde la bala al centro del jugador (X y Z)
    const dx = Math.abs(bullet.position.x - player.position.x);
    const dz = Math.abs(bullet.position.z - player.position.z);
    
    // Calcular distancia vertical desde la bala al centro del cuerpo
    const dy = Math.abs(bullet.position.y - playerCenterY);
    
    // Colisión AABB (Axis-Aligned Bounding Box)
    const hit = dx < halfWidth && dy < playerHeight / 2 && dz < halfDepth;
    
    return hit;
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
