/**
 * Sistema de Controles
 * Gestiona el manejo de teclado y mouse
 * 
 * @requires CONFIG - Configuración del juego
 */

import { CONFIG } from '../config.js';

/**
 * Estado de las teclas presionadas
 */
export const teclas = {};

/**
 * Estado del pointer lock
 */
let pointerLockActivo = false;

/**
 * Estado del botón del mouse
 */
let mousePresionado = false;

/**
 * Callbacks para eventos
 */
let callbacks = {
  onRecargar: null,
  onDash: null,
  onDisparar: null,
  onSaltar: null,
  onMovimientoMouse: null
};

/**
 * Inicializa el sistema de controles
 * @param {Object} eventCallbacks - Callbacks para los eventos
 * @param {Function} eventCallbacks.onRecargar - Callback para recargar (tecla R)
 * @param {Function} eventCallbacks.onDash - Callback para dash (tecla E)
 * @param {Function} eventCallbacks.onDisparar - Callback para disparar (clic izquierdo)
 * @param {Function} eventCallbacks.onSaltar - Callback para saltar (espacio)
 * @param {Function} eventCallbacks.onMovimientoMouse - Callback para movimiento del mouse
 */
export function inicializarControles(eventCallbacks = {}) {
  callbacks = { ...callbacks, ...eventCallbacks };

  // Eventos de teclado
  document.addEventListener('keydown', manejarTeclaPresionada);
  document.addEventListener('keyup', manejarTeclaSoltada);

  // Eventos de mouse
  document.body.addEventListener('click', manejarClickBody);
  document.addEventListener('pointerlockchange', manejarCambioPointerLock);
  document.addEventListener('mousemove', manejarMovimientoMouse);
  document.addEventListener('mousedown', manejarMouseDown);
  document.addEventListener('mouseup', manejarMouseUp);

  // Activar pointer lock automáticamente al iniciar
  document.body.requestPointerLock();
}

/**
 * Maneja el evento de tecla presionada
 * @param {KeyboardEvent} evento
 */
function manejarTeclaPresionada(evento) {
  // Evitar repetición de teclas
  if (teclas[evento.code]) return;

  teclas[evento.code] = true;

  // Acciones especiales
  if (evento.code === 'KeyR' && callbacks.onRecargar) {
    callbacks.onRecargar();
  }

  if (evento.code === 'KeyE' && callbacks.onDash) {
    callbacks.onDash();
  }

  if (evento.code === 'Space' && callbacks.onSaltar) {
    callbacks.onSaltar();
  }
}

/**
 * Maneja el evento de tecla soltada
 * @param {KeyboardEvent} evento
 */
function manejarTeclaSoltada(evento) {
  teclas[evento.code] = false;
}

/**
 * Maneja el clic en el body para pointer lock o disparo
 */
function manejarClickBody() {
  if (!pointerLockActivo) {
    document.body.requestPointerLock();
  } else if (callbacks.onDisparar) {
    callbacks.onDisparar();
  }
}

/**
 * Maneja el cambio de estado del pointer lock
 */
function manejarCambioPointerLock() {
  pointerLockActivo = document.pointerLockElement === document.body;
}

/**
 * Maneja el movimiento del mouse
 * @param {MouseEvent} evento
 */
function manejarMovimientoMouse(evento) {
  if (!pointerLockActivo) return;

  if (callbacks.onMovimientoMouse) {
    callbacks.onMovimientoMouse(evento.movementX, evento.movementY);
  }
}

/**
 * Maneja el evento de mouse presionado
 * @param {MouseEvent} evento
 */
function manejarMouseDown(evento) {
  if (pointerLockActivo && evento.button === 0) {
    mousePresionado = true;
    if (callbacks.onDisparar) {
      callbacks.onDisparar();
    }
  }
}

/**
 * Maneja el evento de mouse soltado
 * @param {MouseEvent} evento
 */
function manejarMouseUp(evento) {
  if (evento.button === 0) {
    mousePresionado = false;
  }
}

/**
 * Verifica si el pointer lock está activo
 * @returns {boolean}
 */
export function estaPointerLockActivo() {
  return pointerLockActivo;
}

/**
 * Verifica si el mouse está presionado
 * @returns {boolean}
 */
export function estaMousePresionado() {
  return mousePresionado;
}

/**
 * Obtiene el estado actual de las teclas
 * @returns {Object}
 */
export function obtenerTeclas() {
  return { ...teclas };
}

/**
 * Verifica si una tecla específica está presionada
 * @param {string} codigo - Código de la tecla (ej: 'KeyW', 'Space')
 * @returns {boolean}
 */
export function estaTeclaPresionada(codigo) {
  return !!teclas[codigo];
}

/**
 * Verifica si alguna tecla de movimiento está presionada
 * @returns {boolean}
 */
export function hayMovimiento() {
  return teclas['KeyW'] || teclas['KeyS'] || teclas['KeyA'] || teclas['KeyD'];
}

/**
 * Actualiza un callback específico
 * @param {string} nombre - Nombre del callback
 * @param {Function} funcion - Nueva función callback
 */
export function actualizarCallback(nombre, funcion) {
  if (callbacks.hasOwnProperty(nombre)) {
    callbacks[nombre] = funcion;
  }
}

/**
 * Limpia todos los event listeners
 */
export function destruirControles() {
  document.removeEventListener('keydown', manejarTeclaPresionada);
  document.removeEventListener('keyup', manejarTeclaSoltada);
  document.body.removeEventListener('click', manejarClickBody);
  document.removeEventListener('pointerlockchange', manejarCambioPointerLock);
  document.removeEventListener('mousemove', manejarMovimientoMouse);
  document.removeEventListener('mousedown', manejarMouseDown);
  document.removeEventListener('mouseup', manejarMouseUp);

  // Limpiar estado
  Object.keys(teclas).forEach(key => delete teclas[key]);
  mousePresionado = false;
  pointerLockActivo = false;
}

/**
 * Reinicia el estado de los controles
 */
export function reiniciarControles() {
  Object.keys(teclas).forEach(key => delete teclas[key]);
  mousePresionado = false;
}
