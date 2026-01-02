/**
 * Módulo de estado y persistencia del lobby
 * Requirements: 2.2, 7.3, 8.1, 8.2, 8.3
 */

import { validarNombre, generarNombreAleatorio } from './validaciones.js';

// Clave para localStorage
const STORAGE_KEY = 'lobbyConfig';

/**
 * Estado inicial del lobby
 */
const estadoInicial = {
  nombreJugador: '',
  modoJuego: null, // 'local' | 'online' | null
  tipoPartida: null, // 'publica' | 'privada' | null
  salaActual: null,
  configuracion: {
    sensibilidad: 0.003,
    volumen: 0.5,
    mostrarFPS: false,
    crosshairDinamico: true
  },
  estadisticas: {
    kills: 0,
    muertes: 0,
    partidasJugadas: 0,
    tiempoJugado: 0
  }
};

/**
 * Estado actual del lobby (copia del estado inicial)
 */
export const lobbyState = { ...estadoInicial };

/**
 * Reinicia el estado a los valores iniciales
 */
export function reiniciarEstado() {
  Object.assign(lobbyState, JSON.parse(JSON.stringify(estadoInicial)));
}

/**
 * Establece el nombre del jugador
 * @param {string} nombre - Nombre a establecer
 * @returns {boolean} - true si el nombre es válido
 */
export function establecerNombre(nombre) {
  const resultado = validarNombre(nombre);
  if (resultado.valido) {
    lobbyState.nombreJugador = nombre;
    return true;
  }
  return false;
}

/**
 * Obtiene el nombre del jugador, generando uno aleatorio si no existe
 * @returns {string}
 */
export function obtenerNombre() {
  if (!lobbyState.nombreJugador) {
    lobbyState.nombreJugador = generarNombreAleatorio();
  }
  return lobbyState.nombreJugador;
}

/**
 * Guarda la configuración actual en localStorage
 * Requirements: 2.2, 7.3
 */
export function guardarConfiguracion() {
  const datosGuardar = {
    nombreJugador: lobbyState.nombreJugador,
    configuracion: { ...lobbyState.configuracion },
    estadisticas: { ...lobbyState.estadisticas }
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datosGuardar));
    return true;
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    return false;
  }
}

/**
 * Carga la configuración desde localStorage
 * Requirements: 2.2, 7.3
 * @returns {boolean} - true si se cargó correctamente
 */
export function cargarConfiguracion() {
  try {
    const datos = localStorage.getItem(STORAGE_KEY);
    if (!datos) {
      return false;
    }
    
    const config = JSON.parse(datos);
    
    // Restaurar nombre si existe y es válido
    if (config.nombreJugador && validarNombre(config.nombreJugador).valido) {
      lobbyState.nombreJugador = config.nombreJugador;
    }
    
    // Restaurar configuración
    if (config.configuracion) {
      lobbyState.configuracion = {
        ...estadoInicial.configuracion,
        ...config.configuracion
      };
    }
    
    // Restaurar estadísticas
    if (config.estadisticas) {
      lobbyState.estadisticas = {
        ...estadoInicial.estadisticas,
        ...config.estadisticas
      };
    }
    
    return true;
  } catch (error) {
    console.error('Error al cargar configuración:', error);
    return false;
  }
}

/**
 * Actualiza las estadísticas del jugador
 * Requirements: 8.1, 8.2, 8.3
 * @param {number} kills - Número de kills a agregar
 * @param {number} muertes - Número de muertes a agregar
 */
export function actualizarEstadisticas(kills, muertes) {
  lobbyState.estadisticas.kills += kills;
  lobbyState.estadisticas.muertes += muertes;
  guardarConfiguracion();
}

/**
 * Incrementa el contador de partidas jugadas
 */
export function incrementarPartidasJugadas() {
  lobbyState.estadisticas.partidasJugadas += 1;
  guardarConfiguracion();
}

/**
 * Actualiza el tiempo jugado
 * @param {number} segundos - Segundos a agregar
 */
export function actualizarTiempoJugado(segundos) {
  lobbyState.estadisticas.tiempoJugado += segundos;
  guardarConfiguracion();
}

/**
 * Obtiene el ratio K/D del jugador
 * Requirements: 8.2
 * @returns {string} - Ratio formateado con 2 decimales
 */
export function obtenerKD() {
  const { kills, muertes } = lobbyState.estadisticas;
  if (muertes === 0) {
    return kills > 0 ? kills.toFixed(2) : '0.00';
  }
  return (kills / muertes).toFixed(2);
}

/**
 * Establece el modo de juego
 * @param {'local' | 'online'} modo
 */
export function establecerModoJuego(modo) {
  if (modo === 'local' || modo === 'online') {
    lobbyState.modoJuego = modo;
  }
}

/**
 * Establece el tipo de partida
 * @param {'publica' | 'privada'} tipo
 */
export function establecerTipoPartida(tipo) {
  if (tipo === 'publica' || tipo === 'privada') {
    lobbyState.tipoPartida = tipo;
  }
}

/**
 * Establece la sala actual
 * @param {string | null} salaId
 */
export function establecerSalaActual(salaId) {
  lobbyState.salaActual = salaId;
}

/**
 * Actualiza un valor de configuración
 * @param {string} clave - Clave de configuración
 * @param {any} valor - Nuevo valor
 */
export function actualizarConfiguracion(clave, valor) {
  if (clave in lobbyState.configuracion) {
    lobbyState.configuracion[clave] = valor;
    guardarConfiguracion();
  }
}

/**
 * Obtiene las estadísticas actuales
 * Requirements: 8.1, 8.2, 8.3
 * @returns {{kills: number, muertes: number, kd: string, partidasJugadas: number}}
 */
export function obtenerEstadisticas() {
  return {
    kills: lobbyState.estadisticas.kills,
    muertes: lobbyState.estadisticas.muertes,
    kd: obtenerKD(),
    partidasJugadas: lobbyState.estadisticas.partidasJugadas
  };
}
