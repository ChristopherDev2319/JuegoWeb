/**
 * Módulo Jugador
 * Gestiona el estado y movimiento del jugador
 * 
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
  enSuelo: true
};

/**
 * Inicializa el estado del jugador
 * Debe llamarse después de que THREE esté disponible
 */
export function inicializarJugador() {
  jugador.posicion = new THREE.Vector3(0, CONFIG.jugador.alturaOjos, 0);
  jugador.velocidad = new THREE.Vector3();
  jugador.rotacion = new THREE.Euler(0, 0, 0, 'YXZ');
  jugador.enSuelo = true;
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
