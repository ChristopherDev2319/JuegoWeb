/**
 * Remote Player Module
 * Renders and manages remote players in the multiplayer game
 * 
 * Requirements: 3.1, 3.2, 3.4
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';
import { AnimadorPersonaje, cargarAnimacion } from '../sistemas/animaciones.js';

// Configuración del modelo del personaje
const CHARACTER_CONFIG = {
  modelPath: 'modelos/cubed_bear.glb',
  scale: 7.0,
  rotationOffset: Math.PI,
  heightOffset: 0,
  weaponPosition: {
    x: 0.5,
    y: 1.5,
    z: -0.3
  }
};

// Hitbox del servidor
const SERVER_HITBOX = {
  width: 0.8,
  height: 2.0,
  depth: 0.6,
  centerYOffset: -0.7
};

const DEBUG_HELPERS = false;

export class RemotePlayer {
  constructor(scene, state) {
    this.scene = scene;
    this.id = state.id;
    
    this.group = new THREE.Group();
    this.serverState = { ...state };
    this.previousState = { ...state };
    this.interpolationAlpha = 1;
    
    this.characterModel = null;
    this.animador = null;
    this.animacionActual = 'idle';
    this.estaMoviendose = false;
    
    // ✅ NUEVO: Variables para detectar movimiento REAL
    this.lastWorldPosition = new THREE.Vector3();
    this.worldVelocity = 0;
    this.moveCooldown = 0;
    
    this.currentWeapon = state.currentWeapon || 'M4A1';
    this.weaponModel = null;
    this.weaponModelsCache = {};
    
    this.loadCharacterModel();
    this.loadWeaponModel(this.currentWeapon);
    
    this.group.position.set(
      state.position.x,
      state.position.y - CONFIG.jugador.alturaOjos + CHARACTER_CONFIG.heightOffset,
      state.position.z
    );
    this.group.rotation.y = state.rotation.y;
    
    // Inicializar posición de referencia
    this.lastWorldPosition.copy(this.group.position);
    
    this.scene.add(this.group);
  }

  createHitbox() {
    const { width, height, depth, centerYOffset } = SERVER_HITBOX;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      wireframe: true,
      visible: DEBUG_HELPERS
    });
    
    this.hitbox = new THREE.Mesh(geometry, material);
    this.hitbox.position.y = CONFIG.jugador.alturaOjos + centerYOffset;
    this.group.add(this.hitbox);
    
    if (DEBUG_HELPERS) {
      this.axesHelper = new THREE.AxesHelper(2);
      this.group.add(this.axesHelper);
    }
  }

  loadCharacterModel() {
    const gltfLoader = new THREE.GLTFLoader();
    
    gltfLoader.load(CHARACTER_CONFIG.modelPath, async (gltf) => {
      this.characterModel = gltf.scene;
      this.characterModel.scale.setScalar(CHARACTER_CONFIG.scale);
      this.characterModel.position.y = 0;
      this.characterModel.rotation.y = CHARACTER_CONFIG.rotationOffset;
      
      this.characterModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
      
      this.group.add(this.characterModel);
      await this.inicializarAnimaciones();
      
      console.log(`Character model loaded for player ${this.id}`);
    }, undefined, (error) => {
      console.error(`Error loading character model for player ${this.id}:`, error);
      this.createFallbackMesh();
    });
  }

  async inicializarAnimaciones() {
    if (!this.characterModel) return;
    
    this.animador = new AnimadorPersonaje(this.characterModel);
    this.animador.inicializar();
    
    try {
      const [clipIdle, clipWalk] = await Promise.all([
        cargarAnimacion('idle'),
        cargarAnimacion('walk')
      ]);
      
      if (clipIdle) {
        this.animador.agregarAnimacion('idle', clipIdle);
      }
      if (clipWalk) {
        this.animador.agregarAnimacion('walk', clipWalk);
      }
    } catch (error) {
      console.warn(`Error cargando animaciones para jugador ${this.id}:`, error);
    }
  }

  createFallbackMesh() {
    const geometry = new THREE.BoxGeometry(0.8, 2, 0.6);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4488ff,
      roughness: 0.7,
      metalness: 0.3
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = 1;
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
    
    this.group.add(this.mesh);
  }

  createHealthBar() {
    this.healthBarGroup = new THREE.Group();
    const hitboxTop = CONFIG.jugador.alturaOjos + SERVER_HITBOX.centerYOffset + SERVER_HITBOX.height / 2;
    this.healthBarGroup.position.y = hitboxTop + 0.3;
    
    const bgGeometry = new THREE.PlaneGeometry(1.2, 0.15);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x333333,
      side: THREE.DoubleSide
    });
    this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
    this.healthBarGroup.add(this.healthBarBg);
    
    const healthGeometry = new THREE.PlaneGeometry(1.1, 0.1);
    const healthMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      side: THREE.DoubleSide
    });
    this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
    this.healthBar.position.z = 0.01;
    this.healthBarGroup.add(this.healthBar);
    
    this.group.add(this.healthBarGroup);
  }

  loadWeaponModel(weaponType = 'M4A1') {
    const fbxLoader = new THREE.FBXLoader();
    
    if (!this.weaponContainer) {
      this.weaponContainer = new THREE.Group();
      this.weaponContainer.position.set(
        CHARACTER_CONFIG.weaponPosition.x,
        CHARACTER_CONFIG.weaponPosition.y,
        CHARACTER_CONFIG.weaponPosition.z
      );
      this.group.add(this.weaponContainer);
    }
    
    const configArma = CONFIG.armas[weaponType];
    if (!configArma || !configArma.modelo) {
      console.warn(`No config found for weapon: ${weaponType}`);
      return;
    }
    
    if (this.weaponModelsCache[weaponType]) {
      this.setWeaponModel(this.weaponModelsCache[weaponType].clone(), configArma);
      return;
    }
    
    fbxLoader.load(configArma.modelo, (weapon) => {
      const box = new THREE.Box3().setFromObject(weapon);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      const longitudDeseada = 0.8;
      const escala = longitudDeseada / Math.max(size.x, size.y, size.z);
      weapon.scale.setScalar(escala);
      
      weapon.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
      
      this.weaponModelsCache[weaponType] = weapon.clone();
      this.setWeaponModel(weapon, configArma);
      
    }, undefined, (error) => {
      console.error(`Error loading weapon ${weaponType}:`, error);
    });
  }

  setWeaponModel(weapon, configArma) {
    if (this.weaponModel) {
      this.weaponContainer.remove(this.weaponModel);
    }
    
    this.weaponModel = weapon;
    weapon.position.set(0.2, 0, 0);
    
    const rotConfig = configArma.rotacion || { x: 0, y: Math.PI, z: 0 };
    weapon.rotation.set(rotConfig.x, rotConfig.y, rotConfig.z);
    
    this.weaponContainer.add(weapon);
  }

  changeWeapon(weaponType) {
    if (this.currentWeapon === weaponType) return;
    
    this.currentWeapon = weaponType;
    this.loadWeaponModel(weaponType);
    console.log(`Remote player ${this.id} changed weapon to ${weaponType}`);
  }

  updateFromState(state) {
    const acabaDeRevivir = !this.serverState.isAlive && state.isAlive;
    
    const distanciaMovimiento = Math.sqrt(
      Math.pow(state.position.x - this.serverState.position.x, 2) +
      Math.pow(state.position.z - this.serverState.position.z, 2)
    );
    const esDash = distanciaMovimiento > 3;
    
    if (state.currentWeapon && state.currentWeapon !== this.currentWeapon) {
      this.changeWeapon(state.currentWeapon);
    }
    
    this.previousState = {
      position: { ...this.serverState.position },
      rotation: { ...this.serverState.rotation }
    };
    
    this.serverState = { ...state };
    
    if (acabaDeRevivir) {
      this.group.position.set(
        state.position.x,
        state.position.y - CONFIG.jugador.alturaOjos + CHARACTER_CONFIG.heightOffset,
        state.position.z
      );
      this.previousState.position = { ...state.position };
      this.interpolationAlpha = 1;
      this.lastWorldPosition.copy(this.group.position);
    } else if (esDash) {
      this.interpolationAlpha = 0;
      this.dashInterpolation = true;
    } else {
      this.interpolationAlpha = 0;
      this.dashInterpolation = false;
    }
    
    this.group.visible = state.isAlive;
  }

  updateHealthBar(health, maxHealth) {
    const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
    
    this.healthBar.scale.x = healthPercent;
    this.healthBar.position.x = (healthPercent - 1) * 0.55;
    
    if (healthPercent > 0.5) {
      this.healthBar.material.color.setHex(0x00ff00);
    } else if (healthPercent > 0.25) {
      this.healthBar.material.color.setHex(0xffff00);
    } else {
      this.healthBar.material.color.setHex(0xff0000);
    }
  }

  /**
   * ✅ ARREGLADO: Interpolación con detección de movimiento REAL
   */
  interpolate(deltaTime) {
    const interpolationSpeed = this.dashInterpolation ? 15 : 12;
    this.interpolationAlpha = Math.min(1, this.interpolationAlpha + deltaTime * interpolationSpeed);
    
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
    
    // Lerp rotation
    const targetRotY = this.serverState.rotation.y;
    const prevRotY = this.previousState.rotation.y;
    const currentRotY = lerpAngle(prevRotY, targetRotY, easedAlpha);
    this.group.rotation.y = currentRotY;
    
    // ✅ NUEVO: Medir velocidad REAL en el mundo (no estado de red)
    const currentPos = this.group.position;
    const deltaX = currentPos.x - this.lastWorldPosition.x;
    const deltaZ = currentPos.z - this.lastWorldPosition.z;
    
    const distanciaFrame = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
    this.worldVelocity = distanciaFrame / Math.max(deltaTime, 0.0001);
    
    // Guardar posición actual para el siguiente frame
    this.lastWorldPosition.copy(currentPos);
    
    // ✅ Umbral de velocidad + histeresis (anti-parpadeo)
    const SPEED_THRESHOLD = 0.08; // Ajustado para movimiento normal
    
    if (this.worldVelocity > SPEED_THRESHOLD) {
      this.moveCooldown = 0.15; // 150ms de "inercia"
    } else {
      this.moveCooldown -= deltaTime;
    }
    
    const nuevoEstadoMovimiento = this.moveCooldown > 0;
    
    // ✅ Cambiar animación SOLO cuando cambia el estado
    if (nuevoEstadoMovimiento !== this.estaMoviendose) {
      this.estaMoviendose = nuevoEstadoMovimiento;
      this.cambiarAnimacion(this.estaMoviendose ? 'walk' : 'idle');
    }
    
    // Actualizar mixer de animaciones
    if (this.animador) {
      this.animador.actualizar(deltaTime);
    }
  }

  cambiarAnimacion(nombre) {
    if (this.animacionActual === nombre) return;
    if (!this.animador) return;
    
    this.animador.reproducir(nombre, { transicion: 0.2, loop: true });
    this.animacionActual = nombre;
  }

  getPosition() {
    return {
      x: this.group.position.x,
      y: this.group.position.y,
      z: this.group.position.z
    };
  }

  isAlive() {
    return this.serverState.isAlive;
  }

  destroy() {
    if (this.animador) {
      this.animador.destruir();
      this.animador = null;
    }
    
    this.scene.remove(this.group);
    
    if (this.hitbox) {
      this.hitbox.geometry.dispose();
      this.hitbox.material.dispose();
    }
    
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
    
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

export function getCharacterHitbox() {
  return { ...SERVER_HITBOX };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutQuad(t) {
  return t * (2 - t);
}

function lerpAngle(a, b, t) {
  let diff = b - a;
  
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  
  return a + diff * t;
}