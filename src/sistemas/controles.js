/**
 * Sistema de Controles
 * Gestiona el manejo de teclado y mouse
 */

import { estadoSeleccion, cambioArmaPermitido } from './seleccionArmas.js';

// Referencia al estado del menú (se establece después de inicializar)
let verificarMenuActivo = null;

// Flag temporal para ignorar cambios de pointer lock después de cerrar el menú
let ignorarCambioPointerLock = false;

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
  onApuntar: null,
  onPausar: null,
  onAlternarCuchillo: null,  // Callback para tecla Q
  onAlternarJuiceBox: null,  // Callback para tecla C - Sistema de curación
  onAlternarCamaraDebug: null // Callback para tecla J - Cámara libre debug
};

/**
 * Inicializa el sistema de controles
 * @param {Object} eventCallbacks - Callbacks para los eventos
 * @param {Function} eventCallbacks.onRecargar - Callback para recargar (tecla R)
 * @param {Function} eventCallbacks.onDash - Callback para dash (tecla E)
 * @param {Function} eventCallbacks.onDisparar - Callback para disparar (clic izquierdo)
 * @param {Function} eventCallbacks.onSaltar - Callback para saltar (espacio)
 * @param {Function} eventCallbacks.onMovimientoMouse - Callback para movimiento del mouse
 * @param {Function} eventCallbacks.onSiguienteArma - Callback para siguiente arma (rueda del mouse hacia arriba)
 * @param {Function} eventCallbacks.onArmaAnterior - Callback para arma anterior (rueda del mouse hacia abajo)
 * @param {Function} eventCallbacks.onSeleccionarArma - Callback para seleccionar arma por número (teclas 1-5)
 * @param {Function} eventCallbacks.onApuntar - Callback para apuntar (clic derecho)
 * @param {Function} eventCallbacks.onPausar - Callback para pausar el juego (ESC)
 * @param {Function} eventCallbacks.onAlternarCuchillo - Callback para alternar cuchillo (tecla Q)
 * @param {Function} eventCallbacks.onAlternarJuiceBox - Callback para alternar JuiceBox (tecla C) - Sistema de curación
 * @param {Function} eventCallbacks.onAlternarCamaraDebug - Callback para alternar cámara debug (tecla J)
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

  // Cambio de armas con Q - Alternar cuchillo
  // Requirements: 2.1, 2.2 - Intercambio rápido con tecla Q
  // NOTA: El cuchillo siempre está disponible durante la partida, no usa cambioArmaPermitido()
  // porque esa función bloquea cambios de arma del menú de selección, no el intercambio rápido
  if (evento.code === 'KeyQ' && callbacks.onAlternarCuchillo) {
    callbacks.onAlternarCuchillo();
  }

  // Alternar JuiceBox con C - Sistema de curación
  // Requirements: 1.1 - Equipar JuiceBox presionando tecla C
  if (evento.code === 'KeyC' && callbacks.onAlternarJuiceBox) {
    callbacks.onAlternarJuiceBox();
  }

  // Alternar cámara debug con J
  // Solo para debugging - cámara libre sin afectar al jugador
  if (evento.code === 'KeyJ' && callbacks.onAlternarCamaraDebug) {
    callbacks.onAlternarCamaraDebug();
  }

  // Selección directa de armas con números 1-8
  // Requirements: 2.3 - Verificar si el cambio de arma está permitido
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

    if (numeroArma !== undefined && cambioArmaPermitido()) {
      callbacks.onSeleccionarArma(numeroArma);
    }
  }
  
  // ESC - No hacer nada aquí, el menú se abre cuando se pierde el pointer lock
  // El navegador automáticamente libera el pointer lock con ESC
  // y manejarCambioPointerLock se encarga de abrir el menú
}

/**
 * Maneja el evento de tecla soltada
 * @param {KeyboardEvent} evento
 */
function manejarTeclaSoltada(evento) {
  teclas[evento.code] = false;
}

/**
 * Maneja el clic en el body para activar pointer lock
 */
function manejarClickBody(evento) {
  // No activar pointer lock si el menú de pausa está activo
  if (verificarMenuActivo && verificarMenuActivo()) {
    return;
  }
  
  // No activar pointer lock si el menú de selección de armas está visible
  // Requirements: 1.3, 5.1, 5.2 - Mantener pointer lock desactivado durante menús
  if (estadoSeleccion.menuVisible) {
    return;
  }
  
  // No activar pointer lock si estamos en pantalla de muerte
  // Requirements: 3.2 - Mantener pointer lock desactivado en pantalla de muerte
  if (estadoSeleccion.enPantallaMuerte) {
    return;
  }
  
  // No activar pointer lock si la pantalla de muerte está visible
  const deathScreen = document.getElementById('death-screen');
  if (deathScreen && !deathScreen.classList.contains('hidden')) {
    return;
  }
  
  // No activar pointer lock si el click fue dentro del menú de selección de armas
  const menuSeleccion = document.getElementById('menu-seleccion-armas');
  if (menuSeleccion && menuSeleccion.contains(evento.target)) {
    return;
  }
  
  // No activar pointer lock si el click fue dentro de la pantalla de muerte
  if (deathScreen && deathScreen.contains(evento.target)) {
    return;
  }
  
  if (!pointerLockActivo) {
    document.body.requestPointerLock();
  }
  // El disparo se maneja en manejarMouseDown, no aquí
}

/**
 * Maneja el cambio de estado del pointer lock
 */
function manejarCambioPointerLock() {
  const anteriorEstado = pointerLockActivo;
  pointerLockActivo = document.pointerLockElement === document.body;
  
  // Si estamos ignorando cambios temporalmente, no hacer nada
  if (ignorarCambioPointerLock) {
    return;
  }
  
  // Si se perdió el pointer lock (por ESC u otra razón), abrir menú de pausa
  if (anteriorEstado && !pointerLockActivo) {
    // No abrir menú si ya está activo
    if (verificarMenuActivo && verificarMenuActivo()) {
      return;
    }
    
    // No abrir menú de pausa si el menú de selección de armas está visible
    // Requirements: 1.3, 5.1, 5.2 - El menú de selección maneja su propio estado
    if (estadoSeleccion.menuVisible) {
      return;
    }
    
    // No abrir menú de pausa si estamos en pantalla de muerte
    // Requirements: 3.2 - La pantalla de muerte maneja su propio estado
    if (estadoSeleccion.enPantallaMuerte) {
      return;
    }
    
    // No abrir menú de pausa si la pantalla de muerte está visible
    const deathScreen = document.getElementById('death-screen');
    if (deathScreen && !deathScreen.classList.contains('hidden')) {
      return;
    }
    
    if (callbacks.onPausar) {
      callbacks.onPausar();
    }
  }
}

/**
 * Establece la función para verificar si el menú está activo
 * @param {Function} fn - Función que retorna true si el menú está activo
 */
export function establecerVerificadorMenu(fn) {
  verificarMenuActivo = fn;
}

/**
 * Ignora temporalmente los cambios de pointer lock
 * @param {number} duracion - Duración en ms para ignorar cambios
 */
export function ignorarCambiosPointerLock(duracion = 500) {
  ignorarCambioPointerLock = true;
  setTimeout(() => {
    ignorarCambioPointerLock = false;
  }, duracion);
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

  // Requirements: 2.3 - Verificar si el cambio de arma está permitido
  if (!cambioArmaPermitido()) {
    return;
  }

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
