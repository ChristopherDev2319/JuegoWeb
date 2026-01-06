/**
 * Sistema de Animaciones
 * Gestiona la carga y reproducción de animaciones para personajes
 * 
 * @requires THREE - Three.js debe estar disponible globalmente
 */

// Rutas de las animaciones
const ANIMACIONES = {
  idle: 'modelos/animaciones/idle_tps.glb',
  walk: 'modelos/animaciones/walk_tps.glb',
  aim: 'modelos/animaciones/aim_position.glb',
  knife_attack: 'modelos/animaciones/knife_attack_tps.glb',
  healt: 'modelos/animaciones/healt_tps.glb'  // Animación de curación (Requirements: 6.1, 6.2)
};

// Cache de clips de animación cargados
const clipsCache = {};

// Estado de carga
let cargando = false;
const colaEspera = [];

/**
 * Carga un clip de animación desde un archivo GLB
 * @param {string} nombre - Nombre de la animación (ej: 'idle')
 * @returns {Promise<THREE.AnimationClip>} - Clip de animación
 */
export async function cargarAnimacion(nombre) {
  // Si ya está en cache, devolverlo
  if (clipsCache[nombre]) {
    return clipsCache[nombre];
  }

  const ruta = ANIMACIONES[nombre];
  if (!ruta) {
    console.warn(`Animación '${nombre}' no encontrada en la configuración`);
    return null;
  }

  return new Promise((resolve, reject) => {
    const gltfLoader = new THREE.GLTFLoader();
    
    gltfLoader.load(ruta, (gltf) => {
      if (gltf.animations && gltf.animations.length > 0) {
        const clip = gltf.animations[0];
        clipsCache[nombre] = clip;
        resolve(clip);
      } else {
        console.warn(`El archivo ${ruta} no contiene animaciones`);
        resolve(null);
      }
    }, undefined, (error) => {
      console.error(`Error cargando animación '${nombre}':`, error);
      reject(error);
    });
  });
}

/**
 * Precarga todas las animaciones disponibles
 * @returns {Promise<void>}
 */
export async function precargarAnimaciones() {
  const promesas = Object.keys(ANIMACIONES).map(nombre => cargarAnimacion(nombre));
  await Promise.all(promesas);
}

/**
 * Obtiene un clip de animación del cache
 * @param {string} nombre - Nombre de la animación
 * @returns {THREE.AnimationClip|null}
 */
export function obtenerClip(nombre) {
  return clipsCache[nombre] || null;
}

/**
 * Clase para gestionar animaciones de un personaje
 */
export class AnimadorPersonaje {
  /**
   * @param {THREE.Object3D} modelo - Modelo 3D del personaje
   */
  constructor(modelo) {
    this.modelo = modelo;
    this.mixer = null;
    this.acciones = {};
    this.accionActual = null;
    this.nombreAnimacionActual = null;
  }

  /**
   * Inicializa el mixer de animaciones
   * Debe llamarse después de que el modelo esté cargado
   */
  inicializar() {
    if (!this.modelo) return;
    this.mixer = new THREE.AnimationMixer(this.modelo);
  }

  /**
   * Añade una animación al personaje
   * @param {string} nombre - Nombre identificador de la animación
   * @param {THREE.AnimationClip} clip - Clip de animación
   */
  agregarAnimacion(nombre, clip) {
    if (!this.mixer || !clip) return;
    
    const accion = this.mixer.clipAction(clip);
    this.acciones[nombre] = accion;
  }

  /**
   * Reproduce una animación
   * @param {string} nombre - Nombre de la animación a reproducir
   * @param {Object} opciones - Opciones de reproducción
   * @param {number} opciones.transicion - Tiempo de transición en segundos (default: 0.3)
   * @param {boolean} opciones.loop - Si la animación debe repetirse (default: true)
   */
  reproducir(nombre, opciones = {}) {
    const { transicion = 0.3, loop = true } = opciones;
    
    const nuevaAccion = this.acciones[nombre];
    if (!nuevaAccion) {
      console.warn(`Animación '${nombre}' no encontrada en el personaje`);
      return;
    }

    // IMPORTANTE: Si ya está reproduciendo esta animación, NO hacer nada
    if (this.nombreAnimacionActual === nombre) return;

    // Configurar loop
    nuevaAccion.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    nuevaAccion.clampWhenFinished = !loop;
    
    if (this.accionActual) {
      // Fade out de la animación actual
      this.accionActual.fadeOut(transicion);
      
      // Fade in de la nueva animación
      nuevaAccion.reset();
      nuevaAccion.setEffectiveTimeScale(1);
      nuevaAccion.setEffectiveWeight(1);
      nuevaAccion.fadeIn(transicion);
      nuevaAccion.play();
    } else {
      // Primera animación, reproducir directamente
      nuevaAccion.reset();
      nuevaAccion.setEffectiveTimeScale(1);
      nuevaAccion.setEffectiveWeight(1);
      nuevaAccion.play();
    }

    this.accionActual = nuevaAccion;
    this.nombreAnimacionActual = nombre;
  }

  /**
   * Detiene la animación actual
   * @param {number} fadeOut - Tiempo de fade out en segundos
   */
  detener(fadeOut = 0.3) {
    if (this.accionActual) {
      this.accionActual.fadeOut(fadeOut);
      this.accionActual = null;
      this.nombreAnimacionActual = null;
    }
  }

  /**
   * Actualiza las animaciones (llamar cada frame)
   * @param {number} deltaTime - Tiempo desde el último frame en segundos
   */
  actualizar(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  /**
   * Obtiene el nombre de la animación actual
   * @returns {string|null}
   */
  obtenerAnimacionActual() {
    return this.nombreAnimacionActual;
  }

  /**
   * Limpia recursos
   */
  destruir() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    this.acciones = {};
    this.accionActual = null;
  }
}
