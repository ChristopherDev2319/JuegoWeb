/**
 * Remote Player Module
 * Renders and manages remote players in the multiplayer game
 * 
 * Requirements: 3.1, 3.2, 3.4
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';

/**
 * RemotePlayer class for rendering other players
 * Extends THREE.Group to contain player mesh, weapon, and health bar
 */
export class RemotePlayer {
  /**
   * Create a new remote player
   * @param {THREE.Scene} scene - The Three.js scene
   * @param {Object} state - Initial player state from server
   */
  constructor(scene, state) {
    this.scene = scene;
    this.id = state.id;
    
    // Create main group to hold all player components
    this.group = new THREE.Group();
    
    // Current state from server
    this.serverState = { ...state };
    
    // Previous state for interpolation
    this.previousState = { ...state };
    
    // Interpolation progress (0 to 1)
    this.interpolationAlpha = 1;
    
    // Create player mesh (cube)
    this.createPlayerMesh();
    
    // Create health bar
    this.createHealthBar();
    
    // Load weapon model
    this.weaponModel = null;
    this.loadWeaponModel();
    
    // Set initial position and rotation
    this.group.position.set(
      state.position.x,
      state.position.y - CONFIG.jugador.alturaOjos + 1, // Adjust for cube center
      state.position.z
    );
    this.group.rotation.y = state.rotation.y;
    
    // Add to scene
    this.scene.add(this.group);
  }

  /**
   * Create the player cube mesh (Requirement 3.1)
   */
  createPlayerMesh() {
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4488ff,
      roughness: 0.7,
      metalness: 0.3
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    this.group.add(this.mesh);
  }

  /**
   * Create health bar above player (Requirement 3.4)
   */
  createHealthBar() {
    // Health bar container
    this.healthBarGroup = new THREE.Group();
    this.healthBarGroup.position.y = 1.5; // Above the cube
    
    // Background bar (dark)
    const bgGeometry = new THREE.PlaneGeometry(1.2, 0.15);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x333333,
      side: THREE.DoubleSide
    });
    this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
    this.healthBarGroup.add(this.healthBarBg);
    
    // Health bar (green/red based on health)
    const healthGeometry = new THREE.PlaneGeometry(1.1, 0.1);
    const healthMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      side: THREE.DoubleSide
    });
    this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
    this.healthBar.position.z = 0.01; // Slightly in front of background
    this.healthBarGroup.add(this.healthBar);
    
    this.group.add(this.healthBarGroup);
  }


  /**
   * Load the M4A1 weapon model (Requirement 3.1)
   */
  loadWeaponModel() {
    const fbxLoader = new THREE.FBXLoader();
    
    // Crear un contenedor para el arma que rote con el jugador
    this.weaponContainer = new THREE.Group();
    this.weaponContainer.position.set(0, 0.3, 0); // A la altura del pecho
    this.group.add(this.weaponContainer);
    
    fbxLoader.load('modelos/FBX/Weapons/M4A1.fbx', (weapon) => {
      this.weaponModel = weapon;
      
      // Calcular escala - más grande para que se vea proporcional al cubo
      const box = new THREE.Box3().setFromObject(weapon);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      const longitudDeseada = 1.0; // Más grande
      const escala = longitudDeseada / size.z;
      weapon.scale.setScalar(escala);
      
      // Posicionar el arma al lado derecho del jugador
      // Rotación de 180 grados (Math.PI) para que apunte hacia adelante
      weapon.position.set(0.6, 0, 0); // Lado derecho
      weapon.rotation.set(0, Math.PI, 0); // Rotar 180 grados para que apunte hacia adelante
      
      // Configurar sombras
      weapon.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      this.weaponContainer.add(weapon);
    });
  }

  /**
   * Update player from server state (Requirement 3.2)
   * @param {Object} state - New state from server
   */
  updateFromState(state) {
    // Detectar si el jugador acaba de revivir
    const acabaDeRevivir = !this.serverState.isAlive && state.isAlive;
    
    // Detectar si es un dash (movimiento muy grande en poco tiempo)
    const distanciaMovimiento = Math.sqrt(
      Math.pow(state.position.x - this.serverState.position.x, 2) +
      Math.pow(state.position.z - this.serverState.position.z, 2)
    );
    const esDash = distanciaMovimiento > 3; // Si se movió más de 3 unidades, es dash
    
    // Store previous state for interpolation
    this.previousState = {
      position: { ...this.serverState.position },
      rotation: { ...this.serverState.rotation }
    };
    
    // Update server state
    this.serverState = { ...state };
    
    // Si acaba de revivir, sincronizar posición inmediatamente
    if (acabaDeRevivir) {
      this.group.position.set(
        state.position.x,
        state.position.y - CONFIG.jugador.alturaOjos + 1,
        state.position.z
      );
      this.previousState.position = { ...state.position };
      this.interpolationAlpha = 1;
    } else if (esDash) {
      // Para dash, usar interpolación más rápida pero no instantánea
      this.interpolationAlpha = 0;
      this.dashInterpolation = true;
    } else {
      // Reset interpolation para movimiento normal
      this.interpolationAlpha = 0;
      this.dashInterpolation = false;
    }
    
    // Update health bar
    this.updateHealthBar(state.health, state.maxHealth);
    
    // Handle visibility based on alive state
    this.group.visible = state.isAlive;
  }

  /**
   * Update health bar display (Requirement 3.4)
   * @param {number} health - Current health
   * @param {number} maxHealth - Maximum health
   */
  updateHealthBar(health, maxHealth) {
    const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
    
    // Scale health bar based on health percentage
    this.healthBar.scale.x = healthPercent;
    this.healthBar.position.x = (healthPercent - 1) * 0.55; // Offset to keep left-aligned
    
    // Change color based on health
    if (healthPercent > 0.5) {
      this.healthBar.material.color.setHex(0x00ff00); // Green
    } else if (healthPercent > 0.25) {
      this.healthBar.material.color.setHex(0xffff00); // Yellow
    } else {
      this.healthBar.material.color.setHex(0xff0000); // Red
    }
  }

  /**
   * Interpolate position and rotation for smooth movement (Requirement 3.2)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  interpolate(deltaTime) {
    // Velocidad de interpolación diferente para dash vs movimiento normal
    // Dash: más rápido (completar en ~150ms)
    // Normal: suave (completar en ~100ms)
    // Salto: usar interpolación continua para suavidad
    const interpolationSpeed = this.dashInterpolation ? 15 : 12;
    this.interpolationAlpha = Math.min(1, this.interpolationAlpha + deltaTime * interpolationSpeed);
    
    // Usar easing para movimiento más suave
    const easedAlpha = easeOutQuad(this.interpolationAlpha);
    
    // Lerp position
    const targetX = this.serverState.position.x;
    const targetY = this.serverState.position.y - CONFIG.jugador.alturaOjos + 1;
    const targetZ = this.serverState.position.z;
    
    const prevX = this.previousState.position.x;
    const prevY = this.previousState.position.y - CONFIG.jugador.alturaOjos + 1;
    const prevZ = this.previousState.position.z;
    
    // Usar easing para X y Z, pero interpolación más suave para Y (salto)
    this.group.position.x = lerp(prevX, targetX, easedAlpha);
    this.group.position.y = lerp(prevY, targetY, easedAlpha);
    this.group.position.z = lerp(prevZ, targetZ, easedAlpha);
    
    // Lerp rotation (Y axis for horizontal rotation)
    const targetRotY = this.serverState.rotation.y;
    const prevRotY = this.previousState.rotation.y;
    const currentRotY = lerpAngle(prevRotY, targetRotY, easedAlpha);
    
    // Aplicar rotación al grupo principal (el cubo rota)
    this.group.rotation.y = currentRotY;
    
    // Make health bar face camera (billboard effect)
    this.updateHealthBarOrientation();
  }

  /**
   * Make health bar always face the camera
   */
  updateHealthBarOrientation() {
    // Health bar should always face the camera
    // We'll rotate it opposite to the player's rotation
    this.healthBarGroup.rotation.y = -this.group.rotation.y;
  }

  /**
   * Get the player's current position
   * @returns {Object} Position {x, y, z}
   */
  getPosition() {
    return {
      x: this.group.position.x,
      y: this.group.position.y,
      z: this.group.position.z
    };
  }

  /**
   * Check if player is alive
   * @returns {boolean}
   */
  isAlive() {
    return this.serverState.isAlive;
  }

  /**
   * Remove player from scene and clean up resources
   */
  destroy() {
    // Remove from scene
    this.scene.remove(this.group);
    
    // Dispose geometries and materials
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    
    if (this.healthBar) {
      this.healthBar.geometry.dispose();
      this.healthBar.material.dispose();
    }
    
    if (this.healthBarBg) {
      this.healthBarBg.geometry.dispose();
      this.healthBarBg.material.dispose();
    }
    
    // Dispose weapon model
    if (this.weaponModel) {
      this.weaponModel.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
    
    // Limpiar contenedor del arma
    this.weaponContainer = null;
  }
}

/**
 * Linear interpolation helper
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number}
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Easing function for smoother movement
 * @param {number} t - Input value (0-1)
 * @returns {number} - Eased value
 */
function easeOutQuad(t) {
  return t * (2 - t);
}

/**
 * Angle interpolation helper (handles wraparound)
 * @param {number} a - Start angle in radians
 * @param {number} b - End angle in radians
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number}
 */
function lerpAngle(a, b, t) {
  // Normalize angles to -PI to PI range
  let diff = b - a;
  
  // Handle wraparound
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  
  return a + diff * t;
}
