/**
 * Sistema de Selección de Armas
 * Gestiona el estado de selección de armas antes de entrar a partida y al reaparecer
 * 
 * Requirements: 1.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3
 */

import { CONFIG } from '../config.js';

/**
 * Estado de selección de armas
 * @type {Object}
 */
export const estadoSeleccion = {
  armaSeleccionada: null,      // Tipo de arma seleccionada (string)
  menuVisible: false,          // Si el menú de selección está visible
  enPantallaMuerte: false,     // Si estamos en pantalla de muerte
  tiempoMuerte: 0,             // Timestamp de muerte para timer de respawn
  puedeReaparecer: false,      // Si el botón reaparecer está disponible
  enPartida: false,            // Si el jugador está actualmente en partida
  armaPrevia: null             // Arma equipada antes de morir (para mantener por defecto)
};

/**
 * Selecciona un arma
 * Actualiza el estado de selección con el tipo de arma especificado
 * 
 * @param {string} tipoArma - Tipo de arma a seleccionar (debe existir en CONFIG.armas)
 * @returns {boolean} - true si la selección fue exitosa, false si el arma no existe
 */
export function seleccionarArma(tipoArma) {
  // Verificar que el arma existe en la configuración
  if (!CONFIG.armas || !CONFIG.armas[tipoArma]) {
    console.warn(`⚠️ Arma no encontrada en configuración: ${tipoArma}`);
    return false;
  }
  
  estadoSeleccion.armaSeleccionada = tipoArma;
  console.log(`🔫 Arma seleccionada: ${CONFIG.armas[tipoArma].nombre}`);
  return true;
}

/**
 * Obtiene las armas disponibles para selección
 * Lee las armas configuradas en CONFIG.armas y las devuelve en formato para UI
 * 
 * @returns {Array<{tipo: string, nombre: string, descripcion: string, icono: string, stats: Object}>}
 */
export function obtenerArmasDisponibles() {
  if (!CONFIG.armas) {
    console.warn('⚠️ No hay armas configuradas en CONFIG');
    return [];
  }
  
  const armasDisponibles = [];
  
  for (const [tipo, config] of Object.entries(CONFIG.armas)) {
    armasDisponibles.push({
      tipo: tipo,
      nombre: config.nombre || tipo,
      descripcion: obtenerDescripcionArma(tipo, config),
      icono: obtenerIconoArma(config.tipo),
      stats: {
        daño: config.daño || 0,
        cadencia: config.cadenciaDisparo || 0,
        precision: calcularPrecision(config)
      }
    });
  }
  
  return armasDisponibles;
}

/**
 * Verifica si el cambio de arma está permitido
 * Retorna false cuando el jugador está en partida activa
 * 
 * Requirements: 2.3 - Deshabilitar cambio de arma durante partida
 * 
 * @returns {boolean} - true si se puede cambiar de arma, false si está en partida
 */
export function cambioArmaPermitido() {
  // No permitir cambio de arma si está en partida activa
  // Solo se puede cambiar en el menú de selección o pantalla de muerte
  return !estadoSeleccion.enPartida || estadoSeleccion.menuVisible || estadoSeleccion.enPantallaMuerte;
}

/**
 * Muestra el menú de selección de armas
 * 
 * @param {boolean} esMuerte - Si se muestra por muerte del jugador
 */
export function mostrarMenuSeleccion(esMuerte = false) {
  estadoSeleccion.menuVisible = true;
  estadoSeleccion.enPantallaMuerte = esMuerte;
  
  if (esMuerte) {
    estadoSeleccion.tiempoMuerte = Date.now();
    estadoSeleccion.puedeReaparecer = false;
    // Guardar el arma actual como previa para mantenerla por defecto
    // Requirements: 4.3 - Mantener arma previa como selección por defecto
    if (estadoSeleccion.armaSeleccionada) {
      estadoSeleccion.armaPrevia = estadoSeleccion.armaSeleccionada;
    }
  }
  
  console.log(`📋 Menú de selección mostrado (muerte: ${esMuerte})`);
}

/**
 * Oculta el menú de selección de armas
 */
export function ocultarMenuSeleccion() {
  estadoSeleccion.menuVisible = false;
  console.log('📋 Menú de selección ocultado');
}

/**
 * Marca que el jugador ha muerto y entra en pantalla de muerte
 * Requirements: 3.1, 3.2 - Mostrar pantalla de muerte con menú de selección
 * 
 * @param {string} armaActual - Arma que tenía equipada al morir
 */
export function marcarMuerte(armaActual = null) {
  estadoSeleccion.enPantallaMuerte = true;
  estadoSeleccion.tiempoMuerte = Date.now();
  estadoSeleccion.puedeReaparecer = false;
  estadoSeleccion.enPartida = false;
  
  // Guardar arma actual como previa
  // Requirements: 4.3 - Mantener arma previa como selección por defecto
  if (armaActual) {
    estadoSeleccion.armaPrevia = armaActual;
    estadoSeleccion.armaSeleccionada = armaActual;
  }
  
  console.log(`💀 Jugador muerto - Arma previa: ${armaActual}`);
}

/**
 * Habilita el botón de reaparecer después del timer
 * Requirements: 3.4 - Timer de 5 segundos para mostrar botón "Reaparecer"
 */
export function habilitarReaparecer() {
  estadoSeleccion.puedeReaparecer = true;
  console.log('✅ Botón reaparecer habilitado');
}

/**
 * Verifica si el jugador puede reaparecer
 * @returns {boolean}
 */
export function puedeReaparecer() {
  return estadoSeleccion.puedeReaparecer && estadoSeleccion.enPantallaMuerte;
}

/**
 * Obtiene el arma previa (para mantener por defecto)
 * Requirements: 4.3 - Mantener arma previa como selección por defecto
 * @returns {string|null}
 */
export function obtenerArmaPrevia() {
  return estadoSeleccion.armaPrevia;
}

/**
 * Procesa el reaparecer del jugador
 * Requirements: 4.1, 4.2 - Reaparecer con arma seleccionada
 * 
 * @param {Function} callbackEquiparArma - Función para equipar el arma
 * @param {Function} callbackActivarPointerLock - Función para activar pointer lock
 * @returns {string} - Tipo de arma con la que reaparece
 */
export function reaparecer(callbackEquiparArma = null, callbackActivarPointerLock = null) {
  // Obtener arma para respawn (la seleccionada o la previa)
  // Requirements: 4.3 - Mantener arma previa como selección por defecto
  const armaParaRespawn = estadoSeleccion.armaSeleccionada || estadoSeleccion.armaPrevia || 'M4A1';
  
  console.log(`🔄 Reapareciendo con arma: ${armaParaRespawn}`);
  
  // Ocultar menú de selección
  estadoSeleccion.menuVisible = false;
  estadoSeleccion.enPantallaMuerte = false;
  estadoSeleccion.puedeReaparecer = false;
  
  // Equipar arma si se proporciona callback
  if (callbackEquiparArma) {
    callbackEquiparArma(armaParaRespawn);
  }
  
  // Activar pointer lock si se proporciona callback
  // Requirements: 5.3 - Activar pointer lock al reaparecer
  if (callbackActivarPointerLock) {
    callbackActivarPointerLock();
  }
  
  // Marcar inicio de partida
  estadoSeleccion.enPartida = true;
  
  return armaParaRespawn;
}

/**
 * Verifica si el jugador está en pantalla de muerte
 * @returns {boolean}
 */
export function estaEnPantallaMuerte() {
  return estadoSeleccion.enPantallaMuerte;
}

/**
 * Marca el inicio de la partida
 * Establece el estado como "en partida" para deshabilitar cambio de armas
 */
export function iniciarPartida() {
  estadoSeleccion.enPartida = true;
  estadoSeleccion.menuVisible = false;
  estadoSeleccion.enPantallaMuerte = false;
  console.log('🎮 Partida iniciada - Cambio de arma deshabilitado');
}

/**
 * Marca el fin de la partida
 * Permite nuevamente el cambio de armas
 */
export function finalizarPartida() {
  estadoSeleccion.enPartida = false;
  console.log('🎮 Partida finalizada - Cambio de arma habilitado');
}

/**
 * Obtiene el arma actualmente seleccionada
 * 
 * @returns {string|null} - Tipo de arma seleccionada o null si no hay selección
 */
export function obtenerArmaSeleccionada() {
  return estadoSeleccion.armaSeleccionada;
}

/**
 * Verifica si hay un arma seleccionada
 * 
 * @returns {boolean}
 */
export function hayArmaSeleccionada() {
  return estadoSeleccion.armaSeleccionada !== null;
}

/**
 * Reinicia el estado de selección
 * Útil al volver al lobby o reiniciar el juego
 */
export function reiniciarEstadoSeleccion() {
  estadoSeleccion.armaSeleccionada = null;
  estadoSeleccion.menuVisible = false;
  estadoSeleccion.enPantallaMuerte = false;
  estadoSeleccion.tiempoMuerte = 0;
  estadoSeleccion.puedeReaparecer = false;
  estadoSeleccion.enPartida = false;
  console.log('🔄 Estado de selección reiniciado');
}

// ============================================
// Funciones auxiliares privadas
// ============================================

/**
 * Genera una descripción para el arma basada en su tipo
 * @private
 */
function obtenerDescripcionArma(tipo, config) {
  const descripciones = {
    'M4A1': 'Rifle versátil y equilibrado',
    'AK47': 'Alto daño, alto retroceso',
    'PISTOLA': 'Arma económica, alta precisión',
    'SNIPER': 'Un disparo, un kill',
    'ESCOPETA': 'Devastadora de cerca',
    'MP5': 'Alta cadencia, movilidad'
  };
  
  return descripciones[tipo] || `${config.tipo || 'Arma'} - ${config.nombre}`;
}

/**
 * Obtiene un icono emoji basado en el tipo de arma
 * @private
 */
function obtenerIconoArma(tipoArma) {
  const iconos = {
    'rifle': '🔫',
    'pistola': '🔫',
    'francotirador': '🎯',
    'escopeta': '💥',
    'subfusil': '⚡'
  };
  
  return iconos[tipoArma] || '🔫';
}

/**
 * Calcula un valor de precisión normalizado (0-1) basado en la dispersión
 * @private
 */
function calcularPrecision(config) {
  const dispersion = config.dispersion || 0.05;
  // Invertir: menor dispersión = mayor precisión
  // Normalizar a escala 0-1 donde 0.001 dispersión = ~1.0 precisión
  return Math.max(0, Math.min(1, 1 - (dispersion * 10)));
}
