/**
 * Módulo Jugador
 * Gestiona el estado y movimiento del jugador
 * 
 * Requirements: 3.2, 4.2
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';

/**
 * Estado del jugador
 */
export const jugador = {
  posicion: null,
  velocidad: null,
  rotacion: null,
  enSuelo: true,
  // Server state for reconciliation
  serverPosition: null,
  serverRotation: null,
  health: 200,
  maxHealth: 200,
  isAlive: true,
  // Dash state for reconciliation
  ultimoDash: 0,
  dashEnProgreso: false
};

// Reconciliation threshold - if local differs from server by more than this, snap to server
const RECONCILIATION_THRESHOLD = 2.0;
// Tiempo de gracia después de un dash para no reconciliar (ms)
const DASH_GRACE_PERIOD = 500;

/**
 * Inicializa el estado del jugador
 * Debe llamarse después de que THREE esté disponible
 */
export function inicializarJugador() {
  jugador.posicion = new THREE.Vector3(0, CONFIG.jugador.alturaOjos, 0);
  jugador.velocidad = new THREE.Vector3();
  jugador.rotacion = new THREE.Euler(0, 0, 0, 'YXZ');
  jugador.enSuelo = true;
  jugador.serverPosition = new THREE.Vector3(0, CONFIG.jugador.alturaOjos, 0);
  jugador.serverRotation = new THREE.Euler(0, 0, 0, 'YXZ');
  jugador.health = 200;
  jugador.maxHealth = 200;
  jugador.isAlive = true;
  jugador.ultimoDash = 0;
  jugador.dashEnProgreso = false;
}

/**
 * Marca que se inició un dash (para evitar reconciliación durante el dash)
 */
export function marcarInicioDash() {
  jugador.ultimoDash = performance.now();
  jugador.dashEnProgreso = true;
}

/**
 * Calcula la dirección de movimiento basada en las teclas presionadas
 * @param {Object} teclas - Estado de las teclas presionadas
 * @returns {{direccion: THREE.Vector3, forward: THREE.Vector3, right: THREE.Vector3}}
 */
export function calcularDireccionMovimiento(teclas) {
  const direccion = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  // Calcular vectores de dirección basados en la rotación del jugador
  forward.set(0, 0, -1).applyQuaternion(
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, jugador.rotacion.y, 0, 'YXZ')
    )
  );
  
  right.set(1, 0, 0).applyQuaternion(
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, jugador.rotacion.y, 0, 'YXZ')
    )
  );

  // Aplicar movimiento según teclas
  if (teclas['KeyW']) direccion.add(forward);
  if (teclas['KeyS']) direccion.sub(forward);
  if (teclas['KeyA']) direccion.sub(right);
  if (teclas['KeyD']) direccion.add(right);

  return { direccion, forward, right };
}


/**
 * Actualiza el movimiento horizontal del jugador
 * @param {Object} teclas - Estado de las teclas presionadas
 */
export function actualizarMovimiento(teclas) {
  // No mover si el jugador está muerto
  if (!jugador.isAlive) return;
  
  const { direccion } = calcularDireccionMovimiento(teclas);

  if (direccion.length() > 0) {
    direccion.normalize();
    jugador.posicion.x += direccion.x * CONFIG.jugador.velocidad;
    jugador.posicion.z += direccion.z * CONFIG.jugador.velocidad;
  }

  // Aplicar límites del mapa
  jugador.posicion.x = Math.max(
    CONFIG.jugador.limites.min,
    Math.min(CONFIG.jugador.limites.max, jugador.posicion.x)
  );
  jugador.posicion.z = Math.max(
    CONFIG.jugador.limites.min,
    Math.min(CONFIG.jugador.limites.max, jugador.posicion.z)
  );
}

/**
 * Aplica la gravedad al jugador
 */
export function aplicarGravedad() {
  jugador.velocidad.y -= CONFIG.jugador.gravedad;
  jugador.posicion.y += jugador.velocidad.y;

  // Verificar si está en el suelo
  if (jugador.posicion.y <= CONFIG.jugador.alturaOjos) {
    jugador.posicion.y = CONFIG.jugador.alturaOjos;
    jugador.velocidad.y = 0;
    jugador.enSuelo = true;
  }
}

/**
 * Ejecuta un salto si el jugador está en el suelo
 * @returns {boolean} - true si el salto se ejecutó
 */
export function saltar() {
  if (jugador.enSuelo) {
    jugador.velocidad.y = CONFIG.jugador.poderSalto;
    jugador.enSuelo = false;
    return true;
  }
  return false;
}

/**
 * Actualiza la rotación del jugador basada en el movimiento del mouse
 * @param {number} movimientoX - Movimiento horizontal del mouse
 * @param {number} movimientoY - Movimiento vertical del mouse
 */
export function actualizarRotacion(movimientoX, movimientoY) {
  const sensibilidad = CONFIG.controles.sensibilidadMouse;

  jugador.rotacion.y -= movimientoX * sensibilidad;
  jugador.rotacion.x -= movimientoY * sensibilidad;

  // Limitar rotación vertical
  jugador.rotacion.x = Math.max(
    -Math.PI / 2,
    Math.min(Math.PI / 2, jugador.rotacion.x)
  );
}

/**
 * Sincroniza la cámara con la posición y rotación del jugador
 * @param {THREE.Camera} camera - Cámara de Three.js
 */
export function sincronizarCamara(camera) {
  camera.position.copy(jugador.posicion);
  camera.rotation.copy(jugador.rotacion);
}

/**
 * Obtiene la posición actual del jugador
 * @returns {THREE.Vector3}
 */
export function obtenerPosicion() {
  return jugador.posicion.clone();
}

/**
 * Obtiene la rotación actual del jugador
 * @returns {THREE.Euler}
 */
export function obtenerRotacion() {
  return jugador.rotacion.clone();
}

/**
 * Verifica si el jugador está en el suelo
 * @returns {boolean}
 */
export function estaEnSuelo() {
  return jugador.enSuelo;
}

/**
 * Apply server state to local player with reconciliation (Requirement 3.2, 4.2)
 * Keeps local prediction for responsiveness while reconciling with server state
 * @param {Object} serverState - Player state from server
 */
export function aplicarEstadoServidor(serverState) {
  if (!serverState) return;
  
  // Detectar si el jugador acaba de revivir
  const acabaDeRevivir = !jugador.isAlive && serverState.isAlive;
  
  // Actualizar referencia de posición del servidor
  jugador.serverPosition.set(
    serverState.position.x,
    serverState.position.y,
    serverState.position.z
  );
  
  // Actualizar referencia de rotación del servidor
  if (serverState.rotation) {
    jugador.serverRotation.set(
      serverState.rotation.x || 0,
      serverState.rotation.y || 0,
      serverState.rotation.z || 0,
      'YXZ'
    );
  }
  
  // Si el jugador acaba de revivir, forzar sincronización completa
  if (acabaDeRevivir) {
    jugador.posicion.copy(jugador.serverPosition);
    jugador.velocidad.set(0, 0, 0);
    jugador.enSuelo = true;
    jugador.dashEnProgreso = false;
    console.log('Jugador revivido - posición sincronizada');
  } else {
    // Verificar si estamos en período de gracia del dash
    const tiempoDesdeUltimoDash = performance.now() - jugador.ultimoDash;
    const enGraciaDash = tiempoDesdeUltimoDash < DASH_GRACE_PERIOD;
    
    // Si el dash terminó, marcar como no en progreso
    if (jugador.dashEnProgreso && !enGraciaDash) {
      jugador.dashEnProgreso = false;
    }
    
    // Calcular distancia entre posición local y del servidor
    const distancia = jugador.posicion.distanceTo(jugador.serverPosition);
    
    // Si estamos en dash, usar interpolación suave hacia el servidor en lugar de snap
    if (enGraciaDash && distancia > 0.5) {
      // Interpolar suavemente hacia la posición del servidor
      const factor = 0.15; // Factor de interpolación suave
      jugador.posicion.x += (jugador.serverPosition.x - jugador.posicion.x) * factor;
      jugador.posicion.z += (jugador.serverPosition.z - jugador.posicion.z) * factor;
    } else if (!enGraciaDash && distancia > RECONCILIATION_THRESHOLD) {
      // Si no estamos en dash y la diferencia es grande, sincronizar
      jugador.posicion.copy(jugador.serverPosition);
      console.log('Posición reconciliada con servidor');
    }
  }
  
  // Actualizar vida y estado vivo desde el servidor (autoritativo)
  jugador.health = serverState.health;
  jugador.maxHealth = serverState.maxHealth || 200;
  jugador.isAlive = serverState.isAlive;
  
  // Actualizar estado de suelo desde el servidor
  if (serverState.position.y <= CONFIG.jugador.alturaOjos + 0.1) {
    jugador.enSuelo = true;
  }
}

/**
 * Get current health
 * @returns {number}
 */
export function obtenerVida() {
  return jugador.health;
}

/**
 * Check if player is alive
 * @returns {boolean}
 */
export function estaVivo() {
  return jugador.isAlive;
}
