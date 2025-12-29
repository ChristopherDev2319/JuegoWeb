/**
 * Player State Module
 * Manages player state and operations
 * 
 * Requirements: 1.2, 5.3, 5.4, 5.5, 6.2, 6.4, 7.2, 7.3
 */

import { PLAYER_CONFIG, WEAPON_CONFIG, DASH_CONFIG, getWeaponConfig } from './config.js';

/**
 * PlayerState class representing a player's complete state
 */
export class PlayerState {
  constructor(id, spawnPoint = null) {
    this.id = id;
    
    // Position and movement
    const spawn = spawnPoint || getRandomSpawnPoint();
    this.position = { x: spawn.x, y: spawn.y, z: spawn.z };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    
    // Health (Requirement 5.3, 5.4, 5.5)
    this.health = PLAYER_CONFIG.maxHealth;
    this.maxHealth = PLAYER_CONFIG.maxHealth;
    this.isAlive = true;
    this.deathTime = null;
    
    // Weapon state (Requirement 6.2, 6.4)
    this.currentWeapon = 'M4A1'; // Arma por defecto
    const weaponConfig = getWeaponConfig(this.currentWeapon);
    this.ammo = weaponConfig.magazineSize;
    this.maxAmmo = weaponConfig.magazineSize;
    this.totalAmmo = weaponConfig.totalAmmo;
    this.isReloading = false;
    this.reloadStartTime = null;
    this.lastFireTime = 0;
    
    // Dash state (Requirement 7.2, 7.3)
    this.dashCharges = DASH_CONFIG.maxCharges;
    this.maxDashCharges = DASH_CONFIG.maxCharges;
    this.lastDashRechargeTime = Date.now();
  }

  /**
   * Obtiene la configuración del arma actual
   */
  getWeaponConfig() {
    return getWeaponConfig(this.currentWeapon);
  }

  /**
   * Cambia el arma actual
   * @param {string} weaponType - Tipo de arma
   */
  changeWeapon(weaponType) {
    if (!WEAPON_CONFIG[weaponType]) return false;
    
    this.currentWeapon = weaponType;
    const config = this.getWeaponConfig();
    this.ammo = config.magazineSize;
    this.maxAmmo = config.magazineSize;
    this.totalAmmo = config.totalAmmo;
    this.isReloading = false;
    this.reloadStartTime = null;
    this.lastFireTime = 0;
    return true;
  }

  /**
   * Update player position with bounds checking
   */
  updatePosition(x, y, z) {
    this.position.x = clamp(x, PLAYER_CONFIG.bounds.min, PLAYER_CONFIG.bounds.max);
    this.position.y = y;
    this.position.z = clamp(z, PLAYER_CONFIG.bounds.min, PLAYER_CONFIG.bounds.max);
  }

  /**
   * Update player rotation
   */
  updateRotation(x, y, z) {
    this.rotation.x = x;
    this.rotation.y = y;
    this.rotation.z = z;
  }

  /**
   * Apply damage to player (Requirement 5.3, 5.4)
   * @param {number} damage - Amount of damage to apply
   * @returns {boolean} - True if player died from this damage
   */
  applyDamage(damage) {
    if (!this.isAlive) return false;
    
    this.health = Math.max(0, this.health - damage);
    
    if (this.health <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  /**
   * Mark player as dead (Requirement 5.4)
   */
  die() {
    this.isAlive = false;
    this.deathTime = Date.now();
  }

  /**
   * Respawn player with full health (Requirement 5.5)
   */
  respawn() {
    const spawn = getRandomSpawnPoint();
    this.position = { x: spawn.x, y: spawn.y, z: spawn.z };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.health = PLAYER_CONFIG.maxHealth;
    this.isAlive = true;
    this.deathTime = null;
    this.isReloading = false;
    this.reloadStartTime = null;
    const config = this.getWeaponConfig();
    this.ammo = config.magazineSize;
  }

  /**
   * Check if player can respawn
   */
  canRespawn() {
    if (this.isAlive || this.deathTime === null) return false;
    return Date.now() - this.deathTime >= PLAYER_CONFIG.respawnTime;
  }

  /**
   * Start reload process (Requirement 6.2)
   * @returns {boolean} - True if reload started successfully
   */
  startReload() {
    if (this.isReloading || !this.isAlive) return false;
    if (this.ammo === this.maxAmmo) return false;
    if (this.totalAmmo <= 0) return false;
    
    this.isReloading = true;
    this.reloadStartTime = Date.now();
    return true;
  }

  /**
   * Complete reload and restore ammo (Requirement 6.4)
   */
  completeReload() {
    if (!this.isReloading) return;
    
    const ammoNeeded = this.maxAmmo - this.ammo;
    const ammoToAdd = Math.min(ammoNeeded, this.totalAmmo);
    
    this.ammo = this.ammo + ammoToAdd;
    this.totalAmmo = this.totalAmmo - ammoToAdd;
    this.isReloading = false;
    this.reloadStartTime = null;
  }

  /**
   * Check if reload is complete
   */
  isReloadComplete() {
    if (!this.isReloading || this.reloadStartTime === null) return false;
    const config = this.getWeaponConfig();
    return Date.now() - this.reloadStartTime >= config.reloadTime;
  }

  /**
   * Check if player can fire
   */
  canFire() {
    if (!this.isAlive) return false;
    if (this.isReloading) return false;
    if (this.ammo <= 0) return false;
    const config = this.getWeaponConfig();
    if (Date.now() - this.lastFireTime < config.fireRate) return false;
    return true;
  }

  /**
   * Consume ammo when firing
   */
  consumeAmmo() {
    if (this.ammo > 0) {
      this.ammo--;
      this.lastFireTime = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Execute dash in direction (Requirement 7.2, 7.3)
   * @param {Object} direction - Direction vector {x, y, z}
   * @returns {boolean} - True if dash executed successfully
   */
  dash(direction) {
    if (!this.isAlive) return false;
    if (this.dashCharges <= 0) return false;
    
    // Normalize direction
    const length = Math.sqrt(
      direction.x * direction.x + 
      direction.y * direction.y + 
      direction.z * direction.z
    );
    
    if (length === 0) return false;
    
    const normalizedDir = {
      x: direction.x / length,
      y: direction.y / length,
      z: direction.z / length
    };
    
    // Apply dash movement
    this.position.x += normalizedDir.x * DASH_CONFIG.power;
    this.position.y += normalizedDir.y * DASH_CONFIG.power;
    this.position.z += normalizedDir.z * DASH_CONFIG.power;
    
    // Clamp to bounds
    this.position.x = clamp(this.position.x, PLAYER_CONFIG.bounds.min, PLAYER_CONFIG.bounds.max);
    this.position.z = clamp(this.position.z, PLAYER_CONFIG.bounds.min, PLAYER_CONFIG.bounds.max);
    
    // Consume charge
    this.dashCharges--;
    
    return true;
  }

  /**
   * Regenerate dash charges over time (Requirement 7.4)
   */
  rechargeDash() {
    if (this.dashCharges >= this.maxDashCharges) {
      this.lastDashRechargeTime = Date.now();
      return;
    }
    
    const now = Date.now();
    if (now - this.lastDashRechargeTime >= DASH_CONFIG.rechargeTime) {
      this.dashCharges++;
      this.lastDashRechargeTime = now;
    }
  }

  /**
   * Apply gravity to player
   */
  applyGravity() {
    if (!this.isAlive) return;
    
    // Apply gravity to velocity
    this.velocity.y -= PLAYER_CONFIG.gravity;
    
    // Update position
    this.position.y += this.velocity.y;
    
    // Ground collision
    if (this.position.y <= PLAYER_CONFIG.eyeHeight) {
      this.position.y = PLAYER_CONFIG.eyeHeight;
      this.velocity.y = 0;
    }
  }

  /**
   * Check if player is on ground
   */
  isOnGround() {
    return this.position.y <= PLAYER_CONFIG.eyeHeight;
  }

  /**
   * Make player jump
   */
  jump() {
    if (!this.isAlive) return false;
    if (!this.isOnGround()) return false;
    
    this.velocity.y = PLAYER_CONFIG.jumpPower;
    return true;
  }

  /**
   * Serialize player state for network transmission
   */
  toJSON() {
    return {
      id: this.id,
      position: { ...this.position },
      rotation: { ...this.rotation },
      velocity: { ...this.velocity },
      health: this.health,
      maxHealth: this.maxHealth,
      isAlive: this.isAlive,
      currentWeapon: this.currentWeapon,
      ammo: this.ammo,
      maxAmmo: this.maxAmmo,
      totalAmmo: this.totalAmmo,
      isReloading: this.isReloading,
      dashCharges: this.dashCharges,
      maxDashCharges: this.maxDashCharges
    };
  }
}

/**
 * Create a new player with default values (Requirement 1.2)
 * @param {string} id - Unique player ID
 * @returns {PlayerState} - New player state
 */
export function createPlayer(id) {
  return new PlayerState(id);
}

/**
 * Get a random spawn point
 */
function getRandomSpawnPoint() {
  const spawnPoints = PLAYER_CONFIG.spawnPoints;
  const index = Math.floor(Math.random() * spawnPoints.length);
  return { ...spawnPoints[index] };
}

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
