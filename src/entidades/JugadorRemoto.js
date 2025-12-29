/**
 * Remote Player Module
 * Renders and manages remote players in the multiplayer game
 * 
 * Requirements: 3.1, 3.2, 3.4
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';

// Configuración del modelo del personaje
const CHARACTER_CONFIG = {
  modelPath: 'modelos/cubed_bear.glb',
  scale: 7.0,           // Escala del modelo (más grande)
  rotationOffset: Math.PI, // Rotar 180 grados para que mire hacia adelante
  heightOffset: 0,      // Ajuste de altura desde el suelo
  // Posición del arma relativa al modelo
  weaponPosition: {
    x: 0.5,
    y: 1.5,
    z: -0.3
  }
};

// Hitbox del servidor (DEBE coincidir con server/bulletSystem.js)
// Esta es la hitbox REAL usada para detección de daño
const SERVER_HITBOX = {
  width: 0.8,   // Ancho (X)
  height: 2.0,  // Altura (Y)
  depth: 0.6,   // Profundidad (Z)
  centerYOffset: -0.7 // Offset del centro Y desde player.position.y
};

// DEBUG: Activar helpers visuales (cambiar a false para producción)
const DEBUG_HELPERS = false;

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
    
    // Character model reference
    this.characterModel = null;
    
    // Current weapon type
    this.currentWeapon = state.currentWeapon || 'M4A1';
    
    // Create hitbox mesh (invisible, for collision detection)
   // this.createHitbox();
    
    // Load character model
    this.loadCharacterModel();
    
    // Load weapon model
    this.weaponModel = null;
    this.weaponModelsCache = {}; // Cache de modelos de armas
    this.loadWeaponModel(this.currentWeapon);
    
    // Set initial position and rotation
    this.group.position.set(
      state.position.x,
      state.position.y - CONFIG.jugador.alturaOjos + CHARACTER_CONFIG.heightOffset,
      state.position.z
    );
    this.group.rotation.y = state.rotation.y;
    
    // Add to scene
    this.scene.add(this.group);
  }

  /**
   * Create hitbox visualization matching server collision detection
   * This shows the EXACT hitbox used for damage calculation on the server
   */
  createHitbox() {
    const { width, height, depth, centerYOffset } = SERVER_HITBOX;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, // Verde para indicar hitbox de daño
      wireframe: true,
      visible: DEBUG_HELPERS
    });
    
    this.hitbox = new THREE.Mesh(geometry, material);
    
    // Posicionar la hitbox exactamente como el servidor la calcula
    // El servidor usa: playerCenterY = player.position.y - 0.7
    // Y el grupo está en: state.position.y - CONFIG.jugador.alturaOjos
    // Entonces el offset relativo al grupo es:
    // centerY_servidor = position.y + centerYOffset = position.y - 0.7
    // grupo.y = position.y - alturaOjos = position.y - 1.7
    // hitbox.y (relativo al grupo) = centerY_servidor - grupo.y = (position.y - 0.7) - (position.y - 1.7) = 1.0
    this.hitbox.position.y = CONFIG.jugador.alturaOjos + centerYOffset; // 1.7 - 0.7 = 1.0
    
    this.group.add(this.hitbox);
    
    // DEBUG: Añadir AxesHelper para ver la orientación del grupo principal
    if (DEBUG_HELPERS) {
      this.axesHelper = new THREE.AxesHelper(2);
      this.group.add(this.axesHelper);
    }
  }

  /**
   * Load the cartoon character GLB model (Requirement 3.1)
   */
  loadCharacterModel() {
    const gltfLoader = new THREE.GLTFLoader();
    
    gltfLoader.load(CHARACTER_CONFIG.modelPath, (gltf) => {
      this.characterModel = gltf.scene;
      
      // Aplicar escala
      this.characterModel.scale.setScalar(CHARACTER_CONFIG.scale);
      
      // Posicionar el modelo en el suelo
      this.characterModel.position.y = 0;
      
      // Rotar el modelo para que mire hacia adelante
      this.characterModel.rotation.y = CHARACTER_CONFIG.rotationOffset;
      
      // Sin sombras para mejor rendimiento
      this.characterModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
      
      this.group.add(this.characterModel);
      
      console.log(`Character model loaded for player ${this.id}`);
    }, undefined, (error) => {
      console.error(`Error loading character model for player ${this.id}:`, error);
      // Fallback: crear un cubo si el modelo no carga
      this.createFallbackMesh();
    });
  }

  /**
   * Create fallback cube mesh if GLB fails to load
   */
  createFallbackMesh() {
    const geometry = new THREE.BoxGeometry(0.8, 2, 0.6);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4488ff,
      roughness: 0.7,
      metalness: 0.3
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = 1; // Centrar verticalmente
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    
    this.group.add(this.mesh);
  }

  /**
   * Create health bar above player (Requirement 3.4)
   */
  createHealthBar() {
    // Health bar container
    this.healthBarGroup = new THREE.Group();
    // Posicionar encima de la hitbox del servidor
    const hitboxTop = CONFIG.jugador.alturaOjos + SERVER_HITBOX.centerYOffset + SERVER_HITBOX.height / 2;
    this.healthBarGroup.position.y = hitboxTop + 0.3;
    
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
   * Load weapon model for remote player
   * @param {string} weaponType - Type of weapon to load
   */
  loadWeaponModel(weaponType = 'M4A1') {
    const fbxLoader = new THREE.FBXLoader();
    
    // Crear un contenedor para el arma si no existe
    if (!this.weaponContainer) {
      this.weaponContainer = new THREE.Group();
      this.weaponContainer.position.set(
        CHARACTER_CONFIG.weaponPosition.x,
        CHARACTER_CONFIG.weaponPosition.y,
        CHARACTER_CONFIG.weaponPosition.z
      );
      this.group.add(this.weaponContainer);
    }
    
    // Obtener configuración del arma
    const configArma = CONFIG.armas[weaponType];
    if (!configArma || !configArma.modelo) {
      console.warn(`No config found for weapon: ${weaponType}`);
      return;
    }
    
    // Si ya está en cache, usarlo
    if (this.weaponModelsCache[weaponType]) {
      this.setWeaponModel(this.weaponModelsCache[weaponType].clone(), configArma);
      return;
    }
    
    fbxLoader.load(configArma.modelo, (weapon) => {
      // Calcular escala
      const box = new THREE.Box3().setFromObject(weapon);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      const longitudDeseada = 0.8;
      const escala = longitudDeseada / Math.max(size.x, size.y, size.z);
      weapon.scale.setScalar(escala);
      
      // Sin sombras
      weapon.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
      
      // Guardar en cache
      this.weaponModelsCache[weaponType] = weapon.clone();
      
      // Aplicar el modelo
      this.setWeaponModel(weapon, configArma);
      
    }, undefined, (error) => {
      console.error(`Error loading weapon ${weaponType}:`, error);
    });
  }

  /**
   * Set the weapon model in the container
   * @param {THREE.Object3D} weapon - Weapon model
   * @param {Object} configArma - Weapon configuration
   */
  setWeaponModel(weapon, configArma) {
    // Remover modelo anterior
    if (this.weaponModel) {
      this.weaponContainer.remove(this.weaponModel);
    }
    
    this.weaponModel = weapon;
    
    // Posicionar según configuración
    weapon.position.set(0.2, 0, 0);
    
    // Aplicar rotación del arma
    const rotConfig = configArma.rotacion || { x: 0, y: Math.PI, z: 0 };
    weapon.rotation.set(rotConfig.x, rotConfig.y, rotConfig.z);
    
    this.weaponContainer.add(weapon);
  }

  /**
   * Change weapon model
   * @param {string} weaponType - New weapon type
   */
  changeWeapon(weaponType) {
    if (this.currentWeapon === weaponType) return;
    
    this.currentWeapon = weaponType;
    this.loadWeaponModel(weaponType);
    console.log(`Remote player ${this.id} changed weapon to ${weaponType}`);
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
    
    // Detectar cambio de arma
    if (state.currentWeapon && state.currentWeapon !== this.currentWeapon) {
      this.changeWeapon(state.currentWeapon);
    }
    
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
        state.position.y - CONFIG.jugador.alturaOjos + CHARACTER_CONFIG.heightOffset,
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
    const interpolationSpeed = this.dashInterpolation ? 15 : 12;
    this.interpolationAlpha = Math.min(1, this.interpolationAlpha + deltaTime * interpolationSpeed);
    
    // Usar easing para movimiento más suave
    const easedAlpha = easeOutQuad(this.interpolationAlpha);
    
    // Lerp position
    const targetX = this.serverState.position.x;
    const targetY = this.serverState.position.y - CONFIG.jugador.alturaOjos + CHARACTER_CONFIG.heightOffset;
    const targetZ = this.serverState.position.z;
    
    const prevX = this.previousState.position.x;
    const prevY = this.previousState.position.y - CONFIG.jugador.alturaOjos + CHARACTER_CONFIG.heightOffset;
    const prevZ = this.previousState.position.z;
    
    this.group.position.x = lerp(prevX, targetX, easedAlpha);
    this.group.position.y = lerp(prevY, targetY, easedAlpha);
    this.group.position.z = lerp(prevZ, targetZ, easedAlpha);
    
    // Lerp rotation (Y axis for horizontal rotation)
    const targetRotY = this.serverState.rotation.y;
    const prevRotY = this.previousState.rotation.y;
    const currentRotY = lerpAngle(prevRotY, targetRotY, easedAlpha);
    
    // Aplicar rotación al grupo principal
    this.group.rotation.y = currentRotY;
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
    
    // Dispose hitbox
    if (this.hitbox) {
      this.hitbox.geometry.dispose();
      this.hitbox.material.dispose();
    }
    
    // Dispose fallback mesh if exists
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    
    // Dispose character model
    if (this.characterModel) {
      this.characterModel.traverse((child) => {
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
    
    this.weaponContainer = null;
  }
}

/**
 * Get character hitbox dimensions for collision detection
 * Returns the SERVER hitbox used for damage calculation
 * @returns {Object} Hitbox dimensions {width, height, depth, centerYOffset}
 */
export function getCharacterHitbox() {
  return { ...SERVER_HITBOX };
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
