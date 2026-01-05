/**
 * Game Manager Module
 * Central game state management and game loop logic
 * 
 * Requirements: 1.2, 1.3, 4.2, 5.2, 6.2, 7.2
 */

import { PlayerState, createPlayer } from './playerState.js';
import { BulletSystem } from './bulletSystem.js';
import { PLAYER_CONFIG, SERVER_CONFIG, WEAPON_CONFIG, getWeaponConfig } from './config.js';

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
   * @param {string} [weaponType] - Optional weapon type for the player
   * @returns {PlayerState} - The created player state
   */
  addPlayer(customId = null, weaponType = null) {
    const id = customId || generatePlayerId();
    const player = createPlayer(id, weaponType);
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
      case 'ammoPickup':
        return this.processAmmoPickupInput(player, input.data);
      case 'meleeAttack':
        return this.processMeleeAttackInput(player, input.data);
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

    // Update aiming state if provided
    if (typeof data.isAiming === 'boolean') {
      player.isAiming = data.isAiming;
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
      return { success: false, reason: player.isReloading ? 'reloading' : 'cannot_fire' };
    }

    if (!data || !data.position || !data.direction) {
      return { success: false, reason: 'invalid_data' };
    }

    // Consume ammo
    player.consumeAmmo();

    const weaponType = player.currentWeapon || 'M4A1';
    const weaponConfig = getWeaponConfig(weaponType);
    // Obtener número de proyectiles y dispersión
    const numProjectiles = weaponConfig.projectiles || 1;
    let spread = weaponConfig.spread || 0;
    
    // Aplicar dispersión sin mira para francotiradores (sniper)
    const isAiming = data.isAiming || false;
    if (!isAiming && weaponConfig.hipfireSpread) {
      spread = weaponConfig.hipfireSpread;
    } else if (isAiming && weaponConfig.aimSpreadReduction) {
      spread *= weaponConfig.aimSpreadReduction;
    }
    
    const bullets = [];
    
    // Crear múltiples balas para escopetas
    for (let i = 0; i < numProjectiles; i++) {
      // Calcular dirección con dispersión
      let direction = { ...data.direction };
      
      // Aplicar dispersión si hay (escopetas con múltiples proyectiles o sniper sin mira)
      if (spread > 0) {
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        if (numProjectiles > 1) {
          direction.z += (Math.random() - 0.5) * spread * 0.5;
        }
        
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

    console.log(`[SHOOT] ${player.id} fired ${weaponType}, ammo: ${player.ammo}`);
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
   * Requirements: 5.2, 5.3 - Validar distancia y límites del mapa
   * @param {PlayerState} player - Player state
   * @param {Object} data - Dash data with direction and optional positions
   * @returns {Object} - Result
   */
  processDashInput(player, data) {
    if (!data || !data.direction) {
      return { success: false, reason: 'invalid_data' };
    }

    // Extraer posición final del cliente si está disponible
    // Requirements: 5.2, 5.3 - Usar nueva validación de PlayerState
    const clientEndPosition = data.endPosition || null;
    
    const result = player.dash(data.direction, clientEndPosition);
    
    return { 
      success: result.success, 
      reason: result.success ? null : result.reason,
      position: result.position,
      usedClientPosition: result.usedClientPosition
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
   * Process ammo pickup input
   * @param {PlayerState} player - Player state
   * @param {Object} data - Ammo pickup data with amount
   * @returns {Object} - Result with actual amount added
   */
  processAmmoPickupInput(player, data) {
    if (!player.isAlive) {
      return { success: false, reason: 'dead', amountAdded: 0 };
    }
    
    if (!data || typeof data.amount !== 'number' || data.amount <= 0) {
      return { success: false, reason: 'invalid_amount', amountAdded: 0 };
    }
    
    const amountAdded = player.addAmmo(data.amount);
    
    console.log(`[AMMO] ${player.id} picked up ${amountAdded} ammo (requested: ${data.amount}), total: ${player.totalAmmo}`);
    
    return { 
      success: amountAdded > 0, 
      amountAdded: amountAdded,
      totalAmmo: player.totalAmmo
    };
  }

  /**
   * Process melee attack (knife) input from client
   * @param {PlayerState} player - Player state
   * @param {Object} data - Attack data with position and direction
   * @returns {Object} - Result with hits
   */
  processMeleeAttackInput(player, data) {
    console.log(`[MELEE] Processing attack from ${player.id}, weapon: ${player.currentWeapon}`);
    
    if (!player.isAlive) {
      console.log(`[MELEE] Player ${player.id} is dead, rejecting attack`);
      return { success: false, reason: 'dead', hits: [] };
    }

    // Verificar que el jugador tiene el cuchillo equipado
    if (player.currentWeapon !== 'KNIFE') {
      console.log(`[MELEE] Player ${player.id} has wrong weapon: ${player.currentWeapon}`);
      return { success: false, reason: 'wrong_weapon', hits: [] };
    }

    // Obtener configuración del cuchillo
    const knifeConfig = WEAPON_CONFIG['KNIFE'];
    if (!knifeConfig) {
      console.log(`[MELEE] No knife config found`);
      return { success: false, reason: 'no_config', hits: [] };
    }

    const attackRange = knifeConfig.attackRange || 3;
    const damage = knifeConfig.damage || 50;
    const attackerPos = player.position;
    
    console.log(`[MELEE] Attack range: ${attackRange}, damage: ${damage}, attacker pos: (${attackerPos.x.toFixed(2)}, ${attackerPos.y.toFixed(2)}, ${attackerPos.z.toFixed(2)})`);
    
    // Calcular dirección del ataque - usar rotación del jugador como fallback
    let attackDir;
    if (data && data.direction && typeof data.direction.x === 'number' && typeof data.direction.z === 'number') {
      attackDir = data.direction;
    } else {
      // Calcular desde la rotación del jugador
      attackDir = {
        x: -Math.sin(player.rotation.y || 0),
        y: 0,
        z: -Math.cos(player.rotation.y || 0)
      };
    }
    
    console.log(`[MELEE] Attack direction: (${attackDir.x.toFixed(2)}, ${attackDir.z.toFixed(2)})`);

    const hits = [];
    
    console.log(`[MELEE] Checking ${this.players.size} players for hits`);

    // Verificar colisión con otros jugadores
    for (const [targetId, targetPlayer] of this.players) {
      if (targetId === player.id) continue;
      if (!targetPlayer.isAlive) {
        console.log(`[MELEE] Target ${targetId} is dead, skipping`);
        continue;
      }

      // Calcular distancia al objetivo
      const dx = targetPlayer.position.x - attackerPos.x;
      const dy = targetPlayer.position.y - attackerPos.y;
      const dz = targetPlayer.position.z - attackerPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      console.log(`[MELEE] Target ${targetId} at distance ${distance.toFixed(2)} (range: ${attackRange})`);

      // Verificar si está en rango
      if (distance > attackRange) {
        console.log(`[MELEE] Target ${targetId} out of range`);
        continue;
      }

      // Verificar que el objetivo está aproximadamente frente al atacante
      const dirToTarget = {
        x: dx / distance,
        y: dy / distance,
        z: dz / distance
      };
      
      const dot = attackDir.x * dirToTarget.x + attackDir.z * dirToTarget.z;
      
      console.log(`[MELEE] Dot product with ${targetId}: ${dot.toFixed(3)} (attackDir: ${attackDir.x.toFixed(2)}, ${attackDir.z.toFixed(2)})`);
      
      // Aceptar objetivos en un cono muy amplio (dot > -0.5 = casi 180 grados)
      // Para el cuchillo queremos ser muy permisivos
      if (dot <= -0.5) {
        console.log(`[MELEE] Target ${targetId} behind attacker (dot: ${dot.toFixed(3)})`);
        continue;
      }

      // Aplicar daño
      console.log(`[MELEE] Applying ${damage} damage to ${targetId}`);
      const killed = targetPlayer.applyDamage(damage);
      
      // Registrar el atacante si murió
      if (killed) {
        targetPlayer.lastAttackerId = player.id;
      }
      
      hits.push({
        targetId: targetId,
        damage: damage,
        killed: killed,
        distance: distance
      });

      console.log(`[MELEE] ${player.id} hit ${targetId} for ${damage} damage (distance: ${distance.toFixed(2)})`);

      if (killed) {
        player.addKill();
        console.log(`[MELEE KILL] ${player.id} killed ${targetId} with knife`);
      }
    }

    return {
      success: true,
      hits: hits,
      attackerId: player.id
    };
  }

  /**
   * Process respawn request from client
   * Requirements: 4.1, 4.2 - Reaparecer con arma seleccionada
   * @param {PlayerState} player - Player state
   * @param {Object} data - Respawn data with weaponType
   * @returns {Object} - Result
   */
  processRespawnInput(player, data) {
    // Verificar que el jugador puede reaparecer (está muerto y pasó el tiempo)
    if (!player.canRespawn()) {
      return { 
        success: false, 
        reason: player.isAlive ? 'already_alive' : 'respawn_cooldown' 
      };
    }

    // Obtener el arma seleccionada (o usar la actual si no se especifica)
    const weaponType = data && data.weaponType ? data.weaponType : player.currentWeapon;

    // Hacer respawn con el arma seleccionada
    player.respawnWithWeapon(weaponType);

    console.log(`[RESPAWN] ${player.id} respawned with weapon: ${weaponType}`);

    return { 
      success: true, 
      weaponType: weaponType 
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

      // NOTA: El respawn ya NO es automático
      // El jugador debe presionar el botón "Reaparecer" en el cliente
      // que envía un mensaje 'respawn' al servidor
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
