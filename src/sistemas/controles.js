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
  onMovimientoMouse: null,
  onSiguienteArma: null,
  onArmaAnterior: null,
  onSeleccionarArma: null,
  onApuntar: null
};

/**
 * Inicializa el sistema de controles
 * @param {Object} eventCallbacks - Callbacks para los eventos
 * @param {Function} eventCallbacks.onRecargar - Callback para recargar (tecla R)
 * @param {Function} eventCallbacks.onDash - Callback para dash (tecla E)
 * @param {Function} eventCallbacks.onDisparar - Callback para disparar (clic izquierdo)
 * @param {Function} eventCallbacks.onSaltar - Callback para saltar (espacio)
 * @param {Function} eventCallbacks.onMovimientoMouse - Callback para movimiento del mouse
 * @param {Function} eventCallbacks.onSiguienteArma - Callback para siguiente arma (rueda del mouse hacia arriba o Q)
 * @param {Function} eventCallbacks.onArmaAnterior - Callback para arma anterior (rueda del mouse hacia abajo)
 * @param {Function} eventCallbacks.onSeleccionarArma - Callback para seleccionar arma por número (teclas 1-5)
 * @param {Function} eventCallbacks.onApuntar - Callback para apuntar (clic derecho)
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
  document.addEventListener('wheel', manejarRuedaMouse);
  document.addEventListener('contextmenu', manejarMenuContextual);

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

  // Cambio de armas con Q
  if (evento.code === 'KeyQ' && callbacks.onSiguienteArma) {
    callbacks.onSiguienteArma();
  }

  // Selección directa de armas con números 1-8
  if (callbacks.onSeleccionarArma) {
    const numeroArma = {
      'Digit1': 0,
      'Digit2': 1,
      'Digit3': 2,
      'Digit4': 3,
      'Digit5': 4,
      'Digit6': 5,
      'Digit7': 6,
      'Digit8': 7
    }[evento.code];

    if (numeroArma !== undefined) {
      callbacks.onSeleccionarArma(numeroArma);
    }
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
  if (!pointerLockActivo) return;
  
  if (evento.button === 0) {
    // Clic izquierdo - disparar
    mousePresionado = true;
    if (callbacks.onDisparar) {
      callbacks.onDisparar();
    }
  } else if (evento.button === 2) {
    // Clic derecho - apuntar
    if (callbacks.onApuntar) {
      callbacks.onApuntar(true);
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
  } else if (evento.button === 2) {
    // Soltar clic derecho - dejar de apuntar
    if (callbacks.onApuntar) {
      callbacks.onApuntar(false);
    }
  }
}

/**
 * Maneja el evento de la rueda del mouse
 * @param {WheelEvent} evento
 */
function manejarRuedaMouse(evento) {
  if (!pointerLockActivo) return;

  evento.preventDefault();

  if (evento.deltaY < 0 && callbacks.onSiguienteArma) {
    // Rueda hacia arriba - siguiente arma
    callbacks.onSiguienteArma();
  } else if (evento.deltaY > 0 && callbacks.onArmaAnterior) {
    // Rueda hacia abajo - arma anterior
    callbacks.onArmaAnterior();
  }
}

/**
 * Previene el menú contextual del clic derecho
 * @param {Event} evento
 */
function manejarMenuContextual(evento) {
  if (pointerLockActivo) {
    evento.preventDefault();
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
  document.removeEventListener('wheel', manejarRuedaMouse);
  document.removeEventListener('contextmenu', manejarMenuContextual);

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
