/**
 * Input Sender Module
 * Handles sending player inputs to the server
 * 
 * Requirements: 3.3, 4.1, 5.1, 6.1, 7.1
 * 
 * Mejoras implementadas:
 * - Sequence numbers (inputId) para ordenamiento y reconciliación
 * - Timestamps para lag compensation
 * - Cache de estado de arma para evitar llamadas costosas cada tick
 */

import { getConnection } from './connection.js';

/**
 * InputSender class handles sending player inputs to the server
 */
export class InputSender {
  constructor(connection = null) {
    this.connection = connection || getConnection();
    
    // Sequence number para ordenamiento de inputs
    this.inputSequence = 0;
    
    // Cache del último estado de arma para evitar llamadas costosas
    this._cachedWeaponState = null;
    this._weaponStateDirty = true;
  }

  /**
   * Marca el estado del arma como modificado (llamar cuando cambie)
   */
  markWeaponStateDirty() {
    this._weaponStateDirty = true;
  }

  /**
   * Obtiene el estado del arma cacheado
   * @param {Function} obtenerEstadoFn - Función para obtener estado si cache está dirty
   * @returns {Object} Estado del arma
   */
  getCachedWeaponState(obtenerEstadoFn) {
    if (this._weaponStateDirty && obtenerEstadoFn) {
      this._cachedWeaponState = obtenerEstadoFn();
      this._weaponStateDirty = false;
    }
    return this._cachedWeaponState;
  }

  /**
   * Send movement input to server (Requirement 4.1)
   * 
   * Mejoras:
   * - Incluye inputId y timestamp para reconciliación/lag compensation
   * - Keys incluidas para futura validación server-side
   * 
   * @param {Object} keys - Key states { w, a, s, d, space }
   * @param {Object} rotation - Player rotation { x, y }
   * @param {boolean} isAiming - Whether player is aiming
   * @param {Object} position - Player position
   */
  sendMovement(keys, rotation, isAiming = false, position = null) {
    if (!this.connection.isConnected()) {
      return;
    }
    
    // Incrementar sequence number
    const inputId = ++this.inputSequence;
    
    const data = {
      inputId: inputId,
      time: performance.now(),
      keys: {
        w: !!keys.w,
        a: !!keys.a,
        s: !!keys.s,
        d: !!keys.d,
        space: !!keys.space
      },
      rotation: {
        x: rotation.x || 0,
        y: rotation.y || 0
      },
      isAiming: isAiming
    };
    
    // Incluir posición siempre (el servidor la necesita actualmente)
    if (position) {
      data.position = {
        x: position.x || 0,
        y: position.y || 0,
        z: position.z || 0
      };
    }
    
    this.connection.send('input', data);
    
    return inputId; // Retornar para client-side prediction
  }

  /**
   * Send shoot input to server (Requirement 5.1)
   * @param {Object} position - Bullet start position { x, y, z }
   * @param {Object} direction - Bullet direction { x, y, z }
   * @param {string} weaponType - Type of weapon being fired
   * @param {boolean} isAiming - Whether player is aiming down sights
   */
  sendShoot(position, direction, weaponType = 'M4A1', isAiming = false) {
    if (!this.connection.isConnected()) {
      return;
    }
    
    this.connection.send('shoot', {
      position: {
        x: position.x || 0,
        y: position.y || 0,
        z: position.z || 0
      },
      direction: {
        x: direction.x || 0,
        y: direction.y || 0,
        z: direction.z || 0
      },
      weaponType: weaponType,
      isAiming: isAiming
    });
  }

  /**
   * Send weapon change to server
   * @param {string} weaponType - Type of weapon to switch to
   */
  sendWeaponChange(weaponType) {
    if (!this.connection.isConnected()) {
      return;
    }
    
    this.connection.send('weaponChange', {
      weaponType: weaponType
    });
  }

  /**
   * Send reload input to server (Requirement 6.1)
   */
  sendReload() {
    if (!this.connection.isConnected()) {
      return;
    }
    
    this.connection.send('reload', {});
  }

  /**
   * Send dash input to server (Requirement 7.1)
   * Requirements: 5.1 - Enviar posición final calculada al servidor
   * @param {Object} direction - Dash direction { x, y, z }
   * @param {Object} startPosition - Starting position { x, y, z }
   * @param {Object} endPosition - Client-calculated end position { x, y, z }
   */
  sendDash(direction, startPosition = null, endPosition = null) {
    if (!this.connection.isConnected()) {
      return;
    }
    
    const data = {
      direction: {
        x: direction.x || 0,
        y: direction.y || 0,
        z: direction.z || 0
      }
    };
    
    // Incluir posición inicial si se proporciona
    if (startPosition) {
      data.startPosition = {
        x: startPosition.x || 0,
        y: startPosition.y || 0,
        z: startPosition.z || 0
      };
    }
    
    // Incluir posición final calculada por el cliente
    // Requirements: 5.1 - El cliente envía la posición final calculada
    if (endPosition) {
      data.endPosition = {
        x: endPosition.x || 0,
        y: endPosition.y || 0,
        z: endPosition.z || 0
      };
    }
    
    this.connection.send('dash', data);
  }

  /**
   * Send respawn request to server
   * Requirements: 4.1, 4.2 - Reaparecer con arma seleccionada
   * @param {string} weaponType - Type of weapon to spawn with
   */
  sendRespawn(weaponType = 'M4A1') {
    if (!this.connection.isConnected()) {
      return;
    }
    
    this.connection.send('respawn', {
      weaponType: weaponType
    });
  }

  /**
   * Send ammo pickup notification to server
   * @param {number} amount - Amount of ammo picked up
   * @param {string} spawnId - ID of the ammo spawn (optional)
   */
  sendAmmoPickup(amount, spawnId = null) {
    if (!this.connection.isConnected()) {
      return;
    }
    
    const data = { amount: amount };
    if (spawnId) {
      data.spawnId = spawnId;
    }
    
    this.connection.send('ammoPickup', data);
  }

  /**
   * Send melee attack (knife) to server
   * @param {Object} attackData - Attack data { posicion, direccion }
   */
  sendMeleeAttack(attackData) {
    if (!this.connection.isConnected()) {
      return;
    }
    
    this.connection.send('meleeAttack', {
      position: attackData.posicion || attackData.position,
      direction: attackData.direccion || attackData.direction
    });
  }

  /**
   * Send heal start event to server
   * Requirements: 5.1 - Notify server when player starts healing
   */
  sendHealStart() {
    if (!this.connection.isConnected()) {
      return;
    }
    
    this.connection.send('healStart', {});
    console.log('🧃 [Network] Sent healStart to server');
  }

  /**
   * Send heal cancel event to server
   * Requirements: 5.1 - Notify server when player cancels healing
   */
  sendHealCancel() {
    if (!this.connection.isConnected()) {
      return;
    }
    
    this.connection.send('healCancel', {});
    console.log('🧃 [Network] Sent healCancel to server');
  }

  /**
   * Send heal complete event to server
   * Requirements: 5.1 - Notify server when player completes healing
   * @param {number} healedAmount - Amount of health restored
   */
  sendHealComplete(healedAmount = 50) {
    if (!this.connection.isConnected()) {
      return;
    }
    
    this.connection.send('healComplete', {
      healedAmount: healedAmount
    });
    console.log(`🧃 [Network] Sent healComplete to server - ${healedAmount} HP`);
  }

  /**
   * Send weapon hidden state to server (toggle with C key)
   * When weapon is hidden, the player shows empty hands (Straw mesh)
   * @param {boolean} hidden - true if weapon is hidden, false if visible
   */
  sendWeaponHidden(hidden) {
    if (!this.connection.isConnected()) {
      return;
    }
    
    this.connection.send('weaponHidden', {
      hidden: hidden
    });
    console.log(`🖐️ [Network] Sent weaponHidden to server - hidden: ${hidden}`);
  }
}

// Singleton instance for easy access
let inputSenderInstance = null;

/**
 * Get the input sender singleton
 * @returns {InputSender}
 */
export function getInputSender() {
  if (!inputSenderInstance) {
    inputSenderInstance = new InputSender();
  }
  return inputSenderInstance;
}

/**
 * Create a new input sender (for testing or custom connections)
 * @param {NetworkConnection} connection - Optional connection to use
 * @returns {InputSender}
 */
export function createInputSender(connection) {
  return new InputSender(connection);
}
