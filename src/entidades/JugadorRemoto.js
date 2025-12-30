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
  modelPath: 'modelos/animaciones/idle_tps.glb', // Modelo con armas integradas
  scale: 7.0,
  rotationOffset: Math.PI,
  heightOffset: 0,
  weaponPosition: {
    x: 0.5,
    y: 1.5,
    z: -0.3
  }
};

// Mapeo de tipos de arma a nombres en el modelo de animación
const WEAPON_MODEL_NAMES = {
  'M4A1': 'weapon_m4a6',
  'AK47': 'weapon_ak',
  'PISTOLA': 'weapon_1911',
  'SNIPER': 'weapon_awp',
  'ESCOPETA': 'weapon_pump',
  'MP5': 'weapon_mp5'
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
    this.weaponMeshes = {}; // Referencias a los meshes de armas en el modelo
    
    this.loadCharacterModel();
    
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
      
      // Guardar animaciones del modelo si las tiene
      this.animacionesDelModelo = gltf.animations || [];
      
      this.characterModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
        
        // Buscar y guardar referencias a las armas del modelo
        const weaponNames = Object.values(WEAPON_MODEL_NAMES);
        if (weaponNames.includes(child.name)) {
          this.weaponMeshes[child.name] = child;
          child.visible = false; // Ocultar todas inicialmente
        }
      });
      
      this.group.add(this.characterModel);
      await this.inicializarAnimaciones();
      
      // Mostrar el arma actual
      this.actualizarArmaVisible(this.currentWeapon);
      
      console.log(`Character model loaded for player ${this.id}`);
    }, undefined, (error) => {
      console.error(`Error loading character model for player ${this.id}:`, error);
      this.createFallbackMesh();
    });
  }

  /**
   * Actualiza qué arma es visible en el modelo
   * @param {string} weaponType - Tipo de arma (M4A1, AK47, etc.)
   */
  actualizarArmaVisible(weaponType) {
    const nombreArma = WEAPON_MODEL_NAMES[weaponType];
    
    // Ocultar todas las armas
    Object.values(this.weaponMeshes).forEach(mesh => {
      mesh.visible = false;
    });
    
    // Mostrar solo el arma seleccionada
    if (nombreArma && this.weaponMeshes[nombreArma]) {
      this.weaponMeshes[nombreArma].visible = true;
    }
  }

  /**
   * Cambia el arma del jugador remoto
   * @param {string} weaponType - Nuevo tipo de arma
   */
  changeWeapon(weaponType) {
    if (this.currentWeapon === weaponType) return;
    
    this.currentWeapon = weaponType;
    this.actualizarArmaVisible(weaponType);
    console.log(`Remote player ${this.id} changed weapon to ${weaponType}`);
  }

  async inicializarAnimaciones() {
    if (!this.characterModel) return;
    
    this.animador = new AnimadorPersonaje(this.characterModel);
    this.animador.inicializar();
    
    try {
      // Intentar cargar animaciones externas
      const [clipIdle, clipWalk] = await Promise.all([
        cargarAnimacion('idle'),
        cargarAnimacion('walk')
      ]);
      
      // Usar animación del modelo como fallback si no se cargó la externa
      let idleClip = clipIdle;
      if (!idleClip && this.animacionesDelModelo && this.animacionesDelModelo.length > 0) {
        idleClip = this.animacionesDelModelo[0];
        console.log(`Usando animación del modelo como idle para jugador ${this.id}`);
      }
      
      if (idleClip) {
        this.animador.agregarAnimacion('idle', idleClip);
      }
      if (clipWalk) {
        this.animador.agregarAnimacion('walk', clipWalk);
      }
      
      // Iniciar con animación idle inmediatamente
      if (idleClip) {
        this.animador.reproducir('idle', { transicion: 0, loop: true });
        this.animacionActual = 'idle';
        // Forzar actualización inmediata del mixer para aplicar la pose
        this.animador.actualizar(0.016);
      }
    } catch (error) {
      console.warn(`Error cargando animaciones para jugador ${this.id}:`, error);
      // Intentar usar animación del modelo como último recurso
      if (this.animacionesDelModelo && this.animacionesDelModelo.length > 0) {
        this.animador.agregarAnimacion('idle', this.animacionesDelModelo[0]);
        this.animador.reproducir('idle', { transicion: 0, loop: true });
        this.animacionActual = 'idle';
        this.animador.actualizar(0.016);
      }
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
    
    this.weaponMeshes = {};
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