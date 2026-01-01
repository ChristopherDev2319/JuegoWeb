/**
 * Sistema de Dash
 * Gestiona las cargas de dash, ejecución y recarga
 * Usa Rapier3D shape casting para detectar colisiones durante el dash
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 7.5
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';
import * as Fisica from './fisica.js';

/**
 * Estado del sistema de dash
 */
export const sistemaDash = {
  cargasActuales: CONFIG.dash.cargasMaximas,
  estaEnDash: false,
  cargasRecargando: [false, false, false],
  inicioRecarga: [0, 0, 0]
};

/**
 * Ejecuta un dash si hay cargas disponibles
 * Usa shape cast de Rapier para detectar colisiones durante todo el trayecto
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * 
 * @param {Object} jugador - Estado del jugador con posicion y rotacion
 * @param {Object} teclas - Estado de las teclas presionadas
 * @param {Function} onDashEjecutado - Callback cuando se ejecuta el dash
 * @returns {boolean} - true si se ejecutó el dash
 */
export function ejecutarDash(jugador, teclas, onDashEjecutado = null) {
  if (sistemaDash.estaEnDash || sistemaDash.cargasActuales <= 0) {
    return false;
  }

  // Calcular dirección del dash
  const direccionDash = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

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

  // Determinar dirección según teclas presionadas
  if (teclas['KeyW']) direccionDash.add(forward);
  if (teclas['KeyS']) direccionDash.sub(forward);
  if (teclas['KeyA']) direccionDash.sub(right);
  if (teclas['KeyD']) direccionDash.add(right);

  // Si no hay dirección de movimiento, dash hacia adelante
  if (direccionDash.length() === 0) {
    direccionDash.copy(forward);
  }

  direccionDash.normalize();

  // Consumir carga
  sistemaDash.cargasActuales--;
  sistemaDash.estaEnDash = true;

  // Calcular posición final del dash usando shape cast de Rapier
  // Requirements: 4.1, 4.2, 4.3, 4.4
  const distanciaDash = CONFIG.dash.poder;
  let posicionFinal;
  let huboColision = false;
  
  if (Fisica.estaActivo()) {
    // Usar shape cast para detectar colisiones durante el dash completo
    // Requirement 4.1: Stop dash at wall surface
    // Requirement 4.2: Allow sliding along the wall
    // Requirement 4.3: Allow passage through gaps wider than player
    const resultadoDash = Fisica.shapeCastDash(
      jugador.posicion,
      direccionDash,
      distanciaDash
    );
    
    posicionFinal = resultadoDash.posicionFinal;
    huboColision = resultadoDash.colision;
    
    // Requirement 4.4: Find nearest valid position if inside geometry
    const validacion = Fisica.verificarPosicionValida(posicionFinal);
    if (!validacion.valida) {
      posicionFinal = validacion.posicionCorregida;
    }
  } else {
    // Fallback: dash sin colisiones si Rapier no está disponible
    posicionFinal = new THREE.Vector3(
      jugador.posicion.x + direccionDash.x * distanciaDash,
      jugador.posicion.y,
      jugador.posicion.z + direccionDash.z * distanciaDash
    );
  }
  
  // Aplicar posición final del dash
  jugador.posicion.x = posicionFinal.x;
  jugador.posicion.z = posicionFinal.z;

  // Ejecutar callback si existe
  if (onDashEjecutado) {
    onDashEjecutado(direccionDash, huboColision);
  }

  // Terminar dash después de la duración
  setTimeout(() => {
    sistemaDash.estaEnDash = false;
  }, CONFIG.dash.duracion);

  return true;
}

/**
 * Actualiza el sistema de recarga de cargas de dash
 */
export function actualizarRecargaDash() {
  const ahora = performance.now();

  // Verificar cargas que terminaron de recargar
  for (let i = 0; i < CONFIG.dash.cargasMaximas; i++) {
    if (sistemaDash.cargasRecargando[i]) {
      const tiempoTranscurrido = ahora - sistemaDash.inicioRecarga[i];

      if (tiempoTranscurrido >= CONFIG.dash.tiempoRecarga) {
        sistemaDash.cargasActuales++;
        sistemaDash.cargasRecargando[i] = false;
      }
    }
  }

  // Iniciar recarga de la siguiente carga si es necesario
  if (sistemaDash.cargasActuales < CONFIG.dash.cargasMaximas) {
    const indiceSiguienteCarga = sistemaDash.cargasActuales;
    if (!sistemaDash.cargasRecargando[indiceSiguienteCarga]) {
      sistemaDash.cargasRecargando[indiceSiguienteCarga] = true;
      sistemaDash.inicioRecarga[indiceSiguienteCarga] = ahora;
    }
  }
}

/**
 * Obtiene el estado actual del sistema de dash
 * @returns {Object} - Estado del sistema de dash
 */
export function obtenerEstado() {
  return {
    cargasActuales: sistemaDash.cargasActuales,
    cargasMaximas: CONFIG.dash.cargasMaximas,
    estaEnDash: sistemaDash.estaEnDash,
    cargasRecargando: [...sistemaDash.cargasRecargando]
  };
}

/**
 * Verifica si se puede ejecutar un dash
 * @returns {boolean}
 */
export function puedeDash() {
  return !sistemaDash.estaEnDash && sistemaDash.cargasActuales > 0;
}

/**
 * Obtiene el progreso de recarga de cada carga
 * @returns {Array<number>} - Array con el progreso (0-1) de cada carga
 */
export function obtenerProgresoRecarga() {
  const ahora = performance.now();
  const progreso = [];

  for (let i = 0; i < CONFIG.dash.cargasMaximas; i++) {
    if (i < sistemaDash.cargasActuales) {
      progreso.push(1); // Carga completa
    } else if (sistemaDash.cargasRecargando[i]) {
      const tiempoTranscurrido = ahora - sistemaDash.inicioRecarga[i];
      progreso.push(Math.min(tiempoTranscurrido / CONFIG.dash.tiempoRecarga, 1));
    } else {
      progreso.push(0); // Sin carga
    }
  }

  return progreso;
}

/**
 * Reinicia el sistema de dash a valores iniciales
 */
export function reiniciarDash() {
  sistemaDash.cargasActuales = CONFIG.dash.cargasMaximas;
  sistemaDash.estaEnDash = false;
  sistemaDash.cargasRecargando = [false, false, false];
  sistemaDash.inicioRecarga = [0, 0, 0];
}

/**
 * Update dash state from server (Requirement 7.5)
 * @param {Object} serverState - Player state from server containing dash info
 */
export function actualizarDesdeServidor(serverState) {
  if (!serverState) return;
  
  // Update dash charges from server (authoritative)
  if (typeof serverState.dashCharges === 'number') {
    sistemaDash.cargasActuales = serverState.dashCharges;
  }
  
  // Update max charges if provided
  if (typeof serverState.maxDashCharges === 'number') {
    // Max charges is typically constant, but sync if server provides it
    // CONFIG.dash.cargasMaximas = serverState.maxDashCharges;
  }
  
  // Reset recharging state based on server charges
  // If server says we have full charges, clear recharging state
  if (sistemaDash.cargasActuales >= CONFIG.dash.cargasMaximas) {
    sistemaDash.cargasRecargando = [false, false, false];
  }
}
