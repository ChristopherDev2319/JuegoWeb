/**
 * Sistema de Colisiones Optimizado
 * Utiliza geometría de colisiones separada (map_coll.glb) con BVH para optimización
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 5.1, 5.3
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';

// Estado del sistema de colisiones
let collisionMesh = null;
let collisionModel = null;
let raycaster = null;
let sistemaActivo = false;
let escenaRef = null;

// Función helper para obtener configuración de colisiones
function getColisionesConfig() {
  return CONFIG.colisiones || {
    radioJugador: 0.5,
    alturaJugador: 1.7,
    margenPared: 0.1,
    rayosHorizontales: 8,
    distanciaRayo: 0.6
  };
}

// Vectores reutilizables para evitar allocaciones
const _direccionRayo = new THREE.Vector3();
const _posicionRayo = new THREE.Vector3();
const _desplazamiento = new THREE.Vector3();

/**
 * Inicializa el sistema de colisiones cargando map_coll.glb
 * @param {THREE.Scene} scene - Escena de Three.js
 * @param {Function} onProgress - Callback de progreso
 * @returns {Promise<void>}
 */
export async function inicializarColisiones(scene, onProgress = null) {
  escenaRef = scene;
  
  return new Promise((resolve) => {
    const gltfLoader = new THREE.GLTFLoader();
    
    // Inicializar raycaster
    raycaster = new THREE.Raycaster();
    
    gltfLoader.load('modelos/map_coll.glb', (gltf) => {
      collisionModel = gltf.scene;

      // Escalar el modelo de colisiones a 5x (igual que el mapa visual)
      collisionModel.scale.setScalar(5);
      
      // Buscar el mesh de colisiones en el modelo
      collisionModel.traverse((child) => {
        if (child.isMesh && !collisionMesh) {
          collisionMesh = child;
        }
      });
      
      if (!collisionMesh) {
        console.error('❌ No se encontró mesh en map_coll.glb');
        sistemaActivo = false;
        resolve();
        return;
      }
      
      // Añadir el modelo a la escena (invisible) para que las matrices funcionen
      collisionModel.visible = false;
      if (escenaRef) {
        escenaRef.add(collisionModel);
      }
      
      // Actualizar matrices del mundo
      collisionModel.updateMatrixWorld(true);
      collisionMesh.updateMatrixWorld(true);
      
      sistemaActivo = true;
      console.log('✅ Sistema de colisiones inicializado (map_coll.glb)');
      console.log('💡 Usa window.toggleCollisionDebug(true) para ver las colisiones');
      resolve();
    }, (progress) => {
      if (progress.total > 0) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        console.log(`📦 Cargando geometría de colisiones: ${percent}%`);
        if (onProgress) onProgress(percent);
      }
    }, (error) => {
      console.error('❌ Error cargando geometría de colisiones:', error);
      sistemaActivo = false;
      resolve();
    });
  });
}

/**
 * Verifica colisión y retorna posición corregida
 * Requirements: 2.3, 2.4, 4.3, 5.1
 * 
 * @param {THREE.Vector3} posicionActual - Posición actual del jugador
 * @param {THREE.Vector3} posicionDeseada - Posición a la que quiere moverse
 * @param {number} radio - Radio del jugador para colisiones
 * @returns {THREE.Vector3} - Posición final después de resolver colisiones
 */
export function resolverColision(posicionActual, posicionDeseada, radio = null) {
  const config = getColisionesConfig();
  radio = radio || config.radioJugador;
  
  // Si el sistema no está activo, permitir movimiento libre
  if (!sistemaActivo || !collisionMesh) {
    return posicionDeseada.clone();
  }
  
  const margen = config.margenPared;
  
  // Calcular dirección del movimiento
  _desplazamiento.subVectors(posicionDeseada, posicionActual);
  const distanciaMovimiento = _desplazamiento.length();
  
  // Si no hay movimiento significativo, retornar posición actual
  if (distanciaMovimiento < 0.001) {
    return posicionActual.clone();
  }
  
  // Verificar si la posición actual ya está dentro de una pared (caso edge)
  const enColisionActual = hayColisionEnPosicion(posicionActual, radio, margen);
  
  // Si ya estamos en colisión, permitir movimiento que nos aleje de la pared
  if (enColisionActual) {
    // Intentar la posición deseada - si nos aleja de la pared, permitirla
    const enColisionDeseada = hayColisionEnPosicion(posicionDeseada, radio, margen);
    
    // Si la posición deseada nos saca de la colisión, permitirla
    if (!enColisionDeseada) {
      return posicionDeseada.clone();
    }
    
    // Si ambas posiciones están en colisión, quedarse quieto (NO empujar)
    return posicionActual.clone();
  }
  
  // Intentar movimiento completo primero
  if (!hayColisionEnPosicion(posicionDeseada, radio, margen)) {
    return posicionDeseada.clone();
  }
  
  // Hay colisión: intentar sliding en cada eje por separado
  
  // Intentar solo movimiento en X
  const posicionX = posicionActual.clone();
  posicionX.x = posicionDeseada.x;
  
  if (!hayColisionEnPosicion(posicionX, radio, margen)) {
    return posicionX;
  }
  
  // Intentar solo movimiento en Z
  const posicionZ = posicionActual.clone();
  posicionZ.z = posicionDeseada.z;
  
  if (!hayColisionEnPosicion(posicionZ, radio, margen)) {
    return posicionZ;
  }
  
  // No se puede mover en ninguna dirección, quedarse en posición actual
  return posicionActual.clone();
}


/**
 * Verifica si hay colisión en una posición específica
 * @param {THREE.Vector3} posicion - Posición a verificar
 * @param {number} radio - Radio del jugador
 * @param {number} margen - Margen de separación
 * @returns {boolean} - true si hay colisión
 */
function hayColisionEnPosicion(posicion, radio, margen) {
  const config = getColisionesConfig();
  const numRayos = config.rayosHorizontales;
  const distanciaDeteccion = radio + margen;
  
  // Probar múltiples alturas para mejor detección
  const alturas = [
    posicion.y - config.alturaJugador / 2 + 0.3,  // Parte baja
    posicion.y - config.alturaJugador / 2 + 0.85, // Parte media (centro de masa)
    posicion.y - config.alturaJugador / 2 + 1.4   // Parte alta
  ];
  
  for (const altura of alturas) {
    for (let i = 0; i < numRayos; i++) {
      const angulo = (i / numRayos) * Math.PI * 2;
      
      _direccionRayo.set(
        Math.cos(angulo),
        0,
        Math.sin(angulo)
      );
      
      // Posición del rayo a diferentes alturas
      _posicionRayo.copy(posicion);
      _posicionRayo.y = altura;
      
      raycaster.set(_posicionRayo, _direccionRayo);
      raycaster.far = distanciaDeteccion;
      
      // Usar collisionModel para que las transformaciones de escala se apliquen
      const intersecciones = raycaster.intersectObject(collisionModel, true);
      
      if (intersecciones.length > 0 && intersecciones[0].distance < distanciaDeteccion) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Verifica si una posición está en el suelo y retorna la altura
 * Requirements: 5.3
 * 
 * @param {THREE.Vector3} posicion - Posición a verificar
 * @returns {{enSuelo: boolean, altura: number}}
 */
export function verificarSuelo(posicion) {
  const config = getColisionesConfig();
  const resultado = {
    enSuelo: false,
    altura: 0
  };
  
  // Si el sistema no está activo, usar altura por defecto
  if (!sistemaActivo || !collisionMesh) {
    resultado.enSuelo = true;
    resultado.altura = 0;
    return resultado;
  }
  
  // Raycast hacia abajo desde la posición del jugador
  _posicionRayo.copy(posicion);
  _posicionRayo.y += 1;
  
  _direccionRayo.set(0, -1, 0);
  
  raycaster.set(_posicionRayo, _direccionRayo);
  raycaster.far = config.alturaJugador + 2;
  
  // Usar collisionModel para que las transformaciones de escala se apliquen
  const intersecciones = raycaster.intersectObject(collisionModel, true);
  
  if (intersecciones.length > 0) {
    const hit = intersecciones[0];
    resultado.altura = hit.point.y;
    
    const distanciaAlSuelo = posicion.y - config.alturaJugador - hit.point.y;
    resultado.enSuelo = distanciaAlSuelo < 0.2 && distanciaAlSuelo > -0.5;
  } else {
    resultado.altura = 0;
    resultado.enSuelo = posicion.y <= config.alturaJugador + 0.1;
  }
  
  return resultado;
}

/**
 * Verifica si el sistema de colisiones está activo
 * @returns {boolean}
 */
export function estaActivo() {
  return sistemaActivo;
}

/**
 * Calcula el componente de velocidad paralelo a una pared (sliding puro)
 * @param {THREE.Vector3} movimiento - Vector de movimiento deseado
 * @param {THREE.Vector3} normalPared - Normal de la superficie de la pared
 * @returns {THREE.Vector3} - Componente de movimiento paralelo a la pared
 */
export function calcularSlidingPared(movimiento, normalPared) {
  const normalHorizontal = new THREE.Vector3(normalPared.x, 0, normalPared.z);
  
  if (normalHorizontal.lengthSq() < 0.001) {
    return movimiento.clone();
  }
  
  normalHorizontal.normalize();
  
  const dotProduct = movimiento.dot(normalHorizontal);
  const componenteNormal = normalHorizontal.clone().multiplyScalar(dotProduct);
  const componenteParalelo = movimiento.clone().sub(componenteNormal);
  
  return componenteParalelo;
}

/**
 * Libera recursos del sistema de colisiones
 */
export function destruir() {
  if (collisionModel && escenaRef) {
    escenaRef.remove(collisionModel);
  }
  collisionMesh = null;
  collisionModel = null;
  raycaster = null;
  sistemaActivo = false;
  escenaRef = null;
}

/**
 * Hace visible el modelo de colisiones para debugging
 * @param {boolean} visible - true para mostrar, false para ocultar
 */
export function toggleDebugVisual(visible = true) {
  if (collisionModel) {
    collisionModel.visible = visible;
    if (visible && collisionMesh) {
      // Aplicar material wireframe para ver la geometría
      collisionMesh.material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      console.log('🔍 Colisiones visibles (wireframe verde)');
    } else {
      console.log('🔍 Colisiones ocultas');
    }
  }
}
