/**
 * Player State Module
 * Manages player state and operations
 * 
 * Requirements: 1.2, 5.3, 5.4, 5.5, 6.2, 6.4, 7.2, 7.3
 */

import { PLAYER_CONFIG, WEAPON_CONFIG, DASH_CONFIG, MAP_LIMITS, getWeaponConfig } from './config.js';

/**
 * PlayerState class representing a player's complete state
 */
export class PlayerState {
  constructor(id, spawnPoint = null, weaponType = null) {
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
    // Usar arma seleccionada o M4A1 por defecto
    this.currentWeapon = (weaponType && WEAPON_CONFIG[weaponType]) ? weaponType : 'M4A1';
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
    
    // Aiming state
    this.isAiming = false;
    
    // Stats
    this.kills = 0;
    this.deaths = 0;
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
   * NOTA: Confía en el cliente para la altura Y ya que tiene las colisiones del mapa
   */
  updatePosition(x, y, z) {
    this.position.x = clamp(x, PLAYER_CONFIG.bounds.min, PLAYER_CONFIG.bounds.max);
    // Aceptar la altura Y del cliente, solo limitar a valores razonables
    this.position.y = clamp(y, 0, 100);
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
   * Apply healing to player
   * Requirements: 3.2, 3.5 - Curación restaura vida
   * @param {number} amount - Amount of health to restore (default 50)
   * @returns {number} - Actual amount healed
   */
  heal(amount = 50) {
    if (!this.isAlive) return 0;
    
    const previousHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    const actualHealed = this.health - previousHealth;
    
    return actualHealed;
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
   * Respawn player with a specific weapon
   * Requirements: 4.1, 4.2 - Reaparecer con arma seleccionada
   * @param {string} weaponType - Type of weapon to spawn with
   */
  respawnWithWeapon(weaponType) {
    const spawn = getRandomSpawnPoint();
    this.position = { x: spawn.x, y: spawn.y, z: spawn.z };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.health = PLAYER_CONFIG.maxHealth;
    this.isAlive = true;
    this.deathTime = null;
    this.isReloading = false;
    this.reloadStartTime = null;
    
    // Cambiar al arma seleccionada
    if (weaponType && WEAPON_CONFIG[weaponType]) {
      this.currentWeapon = weaponType;
    }
    
    // Recargar munición del arma actual
    const config = this.getWeaponConfig();
    this.ammo = config.magazineSize;
    this.maxAmmo = config.magazineSize;
    this.totalAmmo = config.totalAmmo;
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
   * Mejorado para aceptar posición del cliente y validar distancia
   * Requirements: 1.3, 5.2, 5.3, 5.4
   * 
   * @param {Object} direction - Direction vector {x, y, z}
   * @param {Object|null} clientPosition - Optional client-calculated end position {x, y, z}
   * @returns {Object} - Result object with success status and final position
   */
  dash(direction, clientPosition = null) {
    if (!this.isAlive) return { success: false, reason: 'player_dead' };
    if (this.dashCharges <= 0) return { success: false, reason: 'no_charges' };
    
    // Normalize direction
    const length = Math.sqrt(
      direction.x * direction.x + 
      direction.y * direction.y + 
      direction.z * direction.z
    );
    
    if (length === 0) return { success: false, reason: 'invalid_direction' };
    
    const normalizedDir = {
      x: direction.x / length,
      y: direction.y / length,
      z: direction.z / length
    };
    
    // Calculate server's expected end position
    const serverEndPosition = {
      x: this.position.x + normalizedDir.x * DASH_CONFIG.power,
      y: this.position.y + normalizedDir.y * DASH_CONFIG.power,
      z: this.position.z + normalizedDir.z * DASH_CONFIG.power
    };
    
    // Apply map limits to server position
    serverEndPosition.x = clamp(serverEndPosition.x, MAP_LIMITS.minX, MAP_LIMITS.maxX);
    serverEndPosition.z = clamp(serverEndPosition.z, MAP_LIMITS.minZ, MAP_LIMITS.maxZ);
    
    let finalPosition = serverEndPosition;
    let usedClientPosition = false;
    
    // If client provided a position, validate and potentially use it
    if (clientPosition) {
      // Validate client position is within map limits (Requirement 5.3)
      const clientWithinLimits = 
        clientPosition.x >= MAP_LIMITS.minX && clientPosition.x <= MAP_LIMITS.maxX &&
        clientPosition.z >= MAP_LIMITS.minZ && clientPosition.z <= MAP_LIMITS.maxZ;
      
      if (clientWithinLimits) {
        // Calculate distance of client's dash (Requirement 5.2)
        const clientDashDistance = Math.sqrt(
          Math.pow(clientPosition.x - this.position.x, 2) +
          Math.pow(clientPosition.z - this.position.z, 2)
        );
        
        // Validate dash distance doesn't exceed maximum (5 + 10% margin = 5.5)
        if (clientDashDistance <= DASH_CONFIG.maxDistance) {
          // Calculate discrepancy between client and server positions
          const discrepancy = Math.sqrt(
            Math.pow(clientPosition.x - serverEndPosition.x, 2) +
            Math.pow(clientPosition.z - serverEndPosition.z, 2)
          );
          
          // Requirement 5.4: Accept client position if discrepancy < 1 unit
          // This allows for client-side collision handling (dash fantasma)
          if (discrepancy < 1) {
            finalPosition = {
              x: clientPosition.x,
              y: clientPosition.y !== undefined ? clientPosition.y : serverEndPosition.y,
              z: clientPosition.z
            };
            usedClientPosition = true;
          }
          // If discrepancy >= 1 unit, use server position (corrección)
        }
        // If distance exceeds max, use server position (anti-cheat)
      }
      // If outside limits, use server position
    }
    
    // Apply final position
    this.position.x = finalPosition.x;
    this.position.y = finalPosition.y;
    this.position.z = finalPosition.z;
    
    // Ensure within bounds (final safety check)
    this.position.x = clamp(this.position.x, PLAYER_CONFIG.bounds.min, PLAYER_CONFIG.bounds.max);
    this.position.z = clamp(this.position.z, PLAYER_CONFIG.bounds.min, PLAYER_CONFIG.bounds.max);
    
    // Consume charge
    this.dashCharges--;
    
    return { 
      success: true, 
      position: { ...this.position },
      usedClientPosition,
      serverCalculatedPosition: serverEndPosition
    };
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
   * NOTA: El servidor confía en el cliente para la altura Y
   * ya que el cliente tiene el sistema de colisiones del mapa completo
   */
  applyGravity() {
    if (!this.isAlive) return;
    
    // Solo aplicar gravedad si el jugador está muy alto (cayendo al vacío)
    // o si está por debajo del suelo base
    const alturaMinima = 0; // Suelo base del mapa
    const alturaMaxima = 100; // Límite superior razonable
    
    // Si el jugador está por debajo del suelo base, corregir
    if (this.position.y < alturaMinima + PLAYER_CONFIG.eyeHeight) {
      this.position.y = PLAYER_CONFIG.eyeHeight;
      this.velocity.y = 0;
    }
    
    // Si el jugador está demasiado alto (bug o hack), limitar
    if (this.position.y > alturaMaxima) {
      this.position.y = alturaMaxima;
      this.velocity.y = 0;
    }
    
    // No forzar la altura - confiar en el cliente que tiene las colisiones del mapa
  }

  /**
   * Check if player is on ground
   * NOTA: El servidor no puede saber exactamente si el jugador está en el suelo
   * porque no tiene la geometría completa del mapa
   */
  isOnGround() {
    // Considerar que está en el suelo si está cerca del suelo base
    // o si su velocidad Y es 0 (el cliente lo puso en el suelo)
    return this.position.y <= PLAYER_CONFIG.eyeHeight + 0.5 || this.velocity.y === 0;
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
   * Add a kill to player stats
   */
  addKill() {
    this.kills = (this.kills || 0) + 1;
  }

  /**
   * Add a death to player stats
   */
  addDeath() {
    this.deaths = (this.deaths || 0) + 1;
  }

  /**
   * Add ammo to reserve (from ammo pickup)
   * @param {number} amount - Amount of ammo to add
   * @returns {number} - Actual amount added (may be less if at max)
   */
  addAmmo(amount) {
    if (!this.isAlive || amount <= 0) return 0;
    
    const config = this.getWeaponConfig();
    const maxTotal = config.totalAmmo;
    const currentTotal = this.totalAmmo;
    
    // Calculate how much we can actually add
    const spaceAvailable = maxTotal - currentTotal;
    const actualAmount = Math.min(amount, spaceAvailable);
    
    this.totalAmmo += actualAmount;
    
    return actualAmount;
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
      maxDashCharges: this.maxDashCharges,
      isAiming: this.isAiming,
      kills: this.kills,
      deaths: this.deaths
    };
  }
}

/**
 * Create a new player with default values (Requirement 1.2)
 * @param {string} id - Unique player ID
 * @param {string} [weaponType] - Optional weapon type
 * @returns {PlayerState} - New player state
 */
export function createPlayer(id, weaponType = null) {
  return new PlayerState(id, null, weaponType);
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
