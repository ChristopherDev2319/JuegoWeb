/**
 * Input Sender Module
 * Handles sending player inputs to the server
 * 
 * Requirements: 3.3, 4.1, 5.1, 6.1, 7.1
 */

import { getConnection } from './connection.js';

/**
 * InputSender class handles sending player inputs to the server
 */
export class InputSender {
  constructor(connection = null) {
    this.connection = connection || getConnection();
  }

  /**
   * Send movement input to server (Requirement 4.1)
   * @param {Object} keys - Key states { w, a, s, d, space }
   * @param {Object} rotation - Player rotation { x, y }
   * @param {Object} position - Player position { x, y, z }
   * @param {boolean} isAiming - Whether player is aiming
   */
  sendMovement(keys, rotation, position = null, isAiming = false) {
    if (!this.connection.isConnected()) {
      return;
    }
    
    const data = {
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
    
    // Incluir posición si se proporciona
    if (position) {
      data.position = {
        x: position.x || 0,
        y: position.y || 0,
        z: position.z || 0
      };
    }
    
    this.connection.send('input', data);
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
