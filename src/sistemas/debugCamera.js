/**
 * Sistema de Cámara Libre para Debug
 * Permite mover la cámara libremente con WASD sin afectar al jugador
 * Presionar J para alternar entre cámara normal y cámara libre
 */

import { camera, weaponContainer } from '../escena.js';

// Estado de la cámara debug
let modoDebugActivo = false;
let posicionDebug = null;
let rotacionDebug = null;

// Velocidad de movimiento de la cámara debug
const VELOCIDAD_CAMARA = 0.5;
const SENSIBILIDAD_MOUSE = 0.002;

// Elementos UI a ocultar en modo debug
const ELEMENTOS_UI_OCULTAR = [
  'crosshair',
  'aim-indicator',
  'weapon-info',
  'weapon-selector-local',
  'top-left-panel',
  'bottom-right-panel',
  'damage-indicator',
  'kill-feed',
  'player-status-panel',
  'fps-counter',
  'pause-menu',
  'scoreboard',
  'scoreboard-container',
  'scoreboard-panel',
  'training-stats-panel',
  'zone-indicator'
];

// Referencias a elementos ocultos
let elementosOcultados = [];

/**
 * Alterna entre modo cámara normal y cámara libre debug
 * @returns {boolean} - true si se activó el modo debug, false si se desactivó
 */
export function alternarCamaraDebug() {
  modoDebugActivo = !modoDebugActivo;
  
  if (modoDebugActivo) {
    activarModoDebug();
  } else {
    desactivarModoDebug();
  }
  
  return modoDebugActivo;
}

/**
 * Activa el modo de cámara libre debug
 */
function activarModoDebug() {
  console.log('🎥 Modo cámara debug ACTIVADO - WASD para mover, mouse para rotar');
  
  // Guardar posición y rotación actual de la cámara
  posicionDebug = camera.position.clone();
  rotacionDebug = camera.rotation.clone();
  
  // Ocultar el arma
  if (weaponContainer) {
    weaponContainer.visible = false;
  }
  
  // Ocultar elementos de UI
  ocultarUI();
}

/**
 * Desactiva el modo de cámara libre debug
 */
function desactivarModoDebug() {
  console.log('🎥 Modo cámara debug DESACTIVADO - Volviendo a cámara normal');
  
  // Mostrar el arma
  if (weaponContainer) {
    weaponContainer.visible = true;
  }
  
  // Restaurar elementos de UI
  restaurarUI();
  
  // Limpiar estado
  posicionDebug = null;
  rotacionDebug = null;
}

/**
 * Oculta los elementos de UI del juego
 */
function ocultarUI() {
  elementosOcultados = [];
  
  // Ocultar elementos por ID
  for (const id of ELEMENTOS_UI_OCULTAR) {
    const elemento = document.getElementById(id);
    if (elemento) {
      // Guardar el estado actual (puede ser '' si no tiene estilo inline)
      const displayActual = elemento.style.display;
      const visibilityActual = elemento.style.visibility;
      
      // Solo guardar si no está ya oculto
      if (displayActual !== 'none' && visibilityActual !== 'hidden') {
        elementosOcultados.push({
          elemento,
          displayOriginal: displayActual,
          visibilityOriginal: visibilityActual
        });
        elemento.style.display = 'none';
      }
    }
  }
}

/**
 * Restaura los elementos de UI del juego
 */
function restaurarUI() {
  for (const { elemento, displayOriginal } of elementosOcultados) {
    // Restaurar al estado original ('' significa que usará el CSS por defecto)
    elemento.style.display = displayOriginal;
  }
  elementosOcultados = [];
}

/**
 * Actualiza el movimiento de la cámara debug basado en las teclas presionadas
 * @param {Object} teclas - Estado de las teclas presionadas
 */
export function actualizarCamaraDebug(teclas) {
  if (!modoDebugActivo) return;
  
  // Calcular dirección de movimiento basada en la rotación de la cámara
  const forward = new THREE.Vector3(0, 0, -1);
  const right = new THREE.Vector3(1, 0, 0);
  const up = new THREE.Vector3(0, 1, 0);
  
  // Aplicar rotación de la cámara a los vectores de dirección
  forward.applyQuaternion(camera.quaternion);
  right.applyQuaternion(camera.quaternion);
  
  // Movimiento con WASD
  if (teclas['KeyW']) {
    camera.position.addScaledVector(forward, VELOCIDAD_CAMARA);
  }
  if (teclas['KeyS']) {
    camera.position.addScaledVector(forward, -VELOCIDAD_CAMARA);
  }
  if (teclas['KeyA']) {
    camera.position.addScaledVector(right, -VELOCIDAD_CAMARA);
  }
  if (teclas['KeyD']) {
    camera.position.addScaledVector(right, VELOCIDAD_CAMARA);
  }
  
  // Movimiento vertical con Space y Shift
  if (teclas['Space']) {
    camera.position.addScaledVector(up, VELOCIDAD_CAMARA);
  }
  if (teclas['ShiftLeft'] || teclas['ShiftRight']) {
    camera.position.addScaledVector(up, -VELOCIDAD_CAMARA);
  }
}

/**
 * Actualiza la rotación de la cámara debug basada en el movimiento del mouse
 * @param {number} movimientoX - Movimiento horizontal del mouse
 * @param {number} movimientoY - Movimiento vertical del mouse
 */
export function rotarCamaraDebug(movimientoX, movimientoY) {
  if (!modoDebugActivo) return;
  
  // Rotar la cámara
  camera.rotation.y -= movimientoX * SENSIBILIDAD_MOUSE;
  camera.rotation.x -= movimientoY * SENSIBILIDAD_MOUSE;
  
  // Limitar rotación vertical
  camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
}

/**
 * Verifica si el modo debug está activo
 * @returns {boolean}
 */
export function estaModoDebugActivo() {
  return modoDebugActivo;
}

/**
 * Obtiene la posición actual de la cámara debug
 * @returns {THREE.Vector3|null}
 */
export function obtenerPosicionDebug() {
  return modoDebugActivo ? camera.position.clone() : null;
}
