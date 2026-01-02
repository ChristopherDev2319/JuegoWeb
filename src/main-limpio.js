/**
 * Punto de entrada principal del juego FPS Three.js Multijugador
 * Importa todos los módulos y crea el bucle principal del juego
 * 
 * Requisitos: 2.1, 2.2, 3.3, 4.1
 */

// Importar módulos del juego
import { CONFIG } from './config.js';

import { 
  inicializarEscena, 
  scene, 
  camera, 
  weaponContainer, 
  renderizar,
  obtenerPromesaMapa
} from './escena.js';

import { 
  jugador, 
  inicializarJugador, 
  actualizarMovimiento, 
  aplicarGravedad, 
  saltar, 
  actualizarRotacion, 
  sincronizarCamara,
  aplicarEstadoServidor,
  marcarInicioDash
} from './entidades/Jugador.js';

import { 
  arma, 
  disparar,
  recargar, 
  cambiarModeloArma,
  cargarModeloArma,
  animarRetroceso,
  actualizarDesdeServidor as actualizarArmaDesdeServidor,
  cambiarArma,
  agregarArma,
  siguienteArma,
  armaAnterior,
  obtenerEstado,
  establecerCamara,
  alternarApuntado,
  estaApuntando,
  obtenerDispersionRetroceso,
  actualizarRetroceso
} from './sistemas/armas.js';

import { Bala } from './entidades/Bala.js';

import { 
  sistemaDash, 
  actualizarRecargaDash,
  actualizarDesdeServidor as actualizarDashDesdeServidor
} from './sistemas/dash.js';

import { 
  teclas, 
  inicializarControles, 
  estaPointerLockActivo, 
  estaMousePresionado 
} from './sistemas/controles.js';

import { crearEfectoDash } from './utils/efectos.js';
import { mostrarIndicadorDaño, mostrarMensajeConexion, ocultarMensajeConexion, mostrarPantallaMuerte, ocultarPantallaMuerte, agregarEntradaKillFeed, actualizarBarraVida, mostrarEfectoDaño, mostrarDañoCausado, actualizarInfoArma, mostrarCambioArma } from './utils/ui.js';

// Network imports
import { getConnection } from './network/connection.js';

// Animaciones
import { precargarAnimaciones } from './sistemas/animaciones.js';
import { getInputSender } from './network/inputSender.js';
import { initializeRemotePlayerManager } from './network/remotePlayers.js';

// Menú de pausa - SOLO UNA VEZ
import { 
  inicializarMenuPausa, 
  alternarMenuPausa, 
  estaMenuActivo, 
  registrarKill, 
  registrarDeath, 
  registrarDisparo, 
  registrarImpacto 
} from './sistemas/menuPausa.js';

// Sistema de crosshair dinámico
import {
  inicializarCrosshair,
  establecerTipoArma,
  establecerApuntando,
  establecerMovimiento,
  establecerRetroceso,
  animarDisparo,
  animarRetroceso,
  habilitarCrosshairDinamico
} from './sistemas/crosshair.js';

// Arrays globales del juego
const balas = [];

// Modelo del arma
let modeloArma = null;

// Control de tiempo
let ultimoTiempo = performance.now();

// RESTO DEL CÓDIGO SE MANTIENE IGUAL...
// (Copiando desde el archivo original)