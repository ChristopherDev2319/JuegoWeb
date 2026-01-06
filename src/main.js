/**
 * Punto de entrada principal del juego FPS Three.js Multijugador
 * Importa todos los módulos y crea el bucle principal del juego
 * 
 * Requisitos: 1.1, 2.1, 2.2, 2.3, 3.3, 4.1
 */

// Importar módulos del juego
import { CONFIG } from './config.js';
import { ChatSystem } from './ui/chatSystem.js';
import { getStorageJSON, setStorageJSON, getStorageInfo } from './utils/storage.js';

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
  actualizarRetroceso,
  establecerArmaUnica,
  alternarCuchillo,
  esCuchilloEquipado,
  obtenerArmaPrincipalPrevia,
  atacarConCuchillo,
  actualizarAnimacionesCuchillo,
  alternarJuiceBox,
  esJuiceBoxEquipado,
  iniciarCuracion,
  cancelarCuracion,
  estaCurando,
  actualizarCuracion,
  obtenerProgresoCuracion,
  inventarioArmas
} from './sistemas/armas.js';

import { Bala } from './entidades/Bala.js';

import { 
  sistemaDash, 
  actualizarRecargaDash,
  actualizarDesdeServidor as actualizarDashDesdeServidor,
  ejecutarDash,
  ejecutarDashInterpolado,
  actualizarDashInterpolacion,
  calcularPosicionFinalDash
} from './sistemas/dash.js';

import { 
  teclas, 
  inicializarControles, 
  estaPointerLockActivo, 
  estaMousePresionado,
  establecerVerificadorChat
} from './sistemas/controles.js';

import { crearEfectoDash } from './utils/efectos.js';
import { mostrarIndicadorDaño, mostrarMensajeConexion, ocultarMensajeConexion, mostrarPantallaMuerte, ocultarPantallaMuerte, agregarEntradaKillFeed, actualizarBarraVida, mostrarEfectoDaño, mostrarDañoCausado, actualizarInfoArma, mostrarCambioArma, actualizarBarraCuracion, ocultarBarraCuracion, actualizarHealBox, inicializarLucideIcons } from './utils/ui.js';

// Network imports
import { getConnection } from './network/connection.js';

// Animaciones
import { precargarAnimaciones } from './sistemas/animaciones.js';
import { getInputSender } from './network/inputSender.js';
import { initializeRemotePlayerManager } from './network/remotePlayers.js';

// Sistema de autenticación (NUEVO)
import { inicializarAuthUI } from './sistemas/authUI.js';
import { obtenerEstadoAuth, cerrarSesion } from './sistemas/auth.js';
import { 
  registrarKill as registrarKillProgreso,
  registrarDeath as registrarDeathProgreso,
  registrarDisparo as registrarDisparoProgreso,
  registrarImpacto as registrarImpactoProgreso,
  actualizarTiempoJugado,
  actualizarConfiguracion
} from './sistemas/progreso.js';

// Sistema de menú de usuario - COMENTADO TEMPORALMENTE
// import { inicializarMenuUsuario, mostrarMenuUsuario } from './sistemas/menuUsuario.js';

// Sistema de crosshair dinámico
import {
  inicializarCrosshair,
  establecerTipoArma,
  establecerApuntando,
  establecerMovimiento,
  establecerRetroceso,
  animarDisparo,
  animarRetroceso as animarRetrocesoCrosshair,
  habilitarCrosshairDinamico
} from './sistemas/crosshair.js';

// Sistema de selector de armas local
import {
  inicializarSelectorArmasLocal,
  mostrarSelectorArmasLocal,
  ocultarSelectorArmasLocal,
  actualizarSelectorArmaActiva,
  actualizarEstadoConexionSelector
} from './ui/weaponSelectorLocal.js';

// Sistema de menú de pausa
import { inicializarMenuPausa, alternarMenuPausa, estaMenuActivo, cerrarMenuForzado } from './sistemas/menuPausa.js';

// Sistema de sonidos
import { inicializarSonidos, reproducirSonidoDisparo } from './sistemas/sonidos.js';

// Sistema de colisiones
import { inicializarColisiones, toggleDebugVisual } from './sistemas/colisiones.js';

// Sistema de bots de entrenamiento
// Requirements: 1.1, 2.1, 3.1, 4.4
import { BotManager } from './sistemas/botManager.js';

// Sistema de spawns de munición
// Requirements: 5.1, 5.2, 5.3, 5.4
import { AmmoSpawn } from './entidades/AmmoSpawn.js';

// UI de estadísticas de entrenamiento
// Requirements: 6.1, 6.2
import {
  inicializarEntrenamientoUI,
  actualizarEstadisticasUI,
  destruirEntrenamientoUI
} from './ui/entrenamientoUI.js';

// Sistema de selección de armas
// Requirements: 1.1, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3
import { 
  estadoSeleccion,
  seleccionarArma as seleccionarArmaEstado,
  obtenerArmaSeleccionada,
  iniciarPartida as iniciarPartidaSeleccion,
  mostrarMenuSeleccion,
  ocultarMenuSeleccion,
  marcarMuerte,
  habilitarReaparecer,
  puedeReaparecer,
  obtenerArmaPrevia,
  reaparecer as reaparecerConArma,
  estaEnPantallaMuerte,
  cambioArmaPermitido
} from './sistemas/seleccionArmas.js';

import {
  inicializarSeleccionArmasUI,
  mostrarMenuArmas,
  ocultarMenuArmas,
  generarGridArmasMuerte,
  limpiarGridArmasMuerte,
  obtenerArmaSeleccionadaUI
} from './lobby/seleccionArmasUI.js';

// Sistema de scoreboard
// Requirements: 1.1, 2.1, 3.1, 5.2
import { actualizarScoreboard } from './ui/scoreboardUI.js';

// Importar módulos del lobby
// Requirements: 1.1, 2.1, 2.2, 2.3
import { 
  inicializarLobbyUI, 
  ocultarLobby, 
  mostrarLobby,
  mostrarPantalla,
  mostrarError,
  mostrarCargando,
  actualizarEstadoMatchmaking,
  mostrarSalaCreada,
  mostrarErrorCrear,
  mostrarErrorUnirse,
  actualizarListaJugadores
} from './lobby/lobbyUI.js';

import { 
  lobbyState,
  obtenerNombre,
  guardarConfiguracion,
  cargarConfiguracion as cargarConfiguracionLobby,
  actualizarEstadisticas as actualizarEstadisticasLobby,
  establecerModoJuego,
  establecerSalaActual
} from './lobby/lobbyState.js';

import {
  configurarCallbacksLobby,
  manejarRespuestaLobby,
  solicitarMatchmaking,
  crearPartidaPrivada,
  unirsePartidaPrivada,
  cancelarOperacionesPendientes
} from './lobby/lobbyConnection.js';

// Exponer función de debug en consola
window.toggleCollisionDebug = toggleDebugVisual;

// Arrays globales del juego
const balas = [];

// Modelo del arma
let modeloArma = null;

// Control de tiempo
let ultimoTiempo = performance.now();

// Control de tiempo de juego para progreso
let ultimoTiempoProgreso = performance.now();
let tiempoJuegoAcumulado = 0;

// Estado del menú (declarado ANTES del bucle de juego)
let menuActivo = false;

// Estado del lobby y modo de juego
// Requirements: 1.1, 2.1, 2.2, 2.3
let modoJuegoActual = null; // 'local' | 'online'
let salaActualId = null;
let nombreJugadorActual = '';
let juegoIniciado = false;

// Exponer modoJuegoActual globalmente
window.modoJuegoActual = modoJuegoActual;

/**
 * Lee la configuración guardada del juego
 * @deprecated Usar cargarConfiguracionLobby() del módulo lobbyState
 */
function leerConfiguracionGuardada() {
  try {
    console.log('💾 Storage Info:', getStorageInfo());
    const config = getStorageJSON('gameConfig', null);
    
    if (config) {
      CONFIG.red.habilitarMultijugador = config.multiplayerEnabled;
      
      console.log('📋 Configuración cargada:');
      console.log(`   Multijugador: ${config.multiplayerEnabled ? 'Habilitado' : 'Deshabilitado'}`);
      
      if (!config.multiplayerEnabled) {
        console.log('🎯 Modo local activado');
      }
    } else {
      console.log('ℹ️ No hay configuración guardada');
    }
  } catch (error) {
    console.warn('⚠️ No se pudo cargar la configuración guardada:', error);
  }
}

/**
 * Callback cuando el jugador inicia el juego desde el lobby
 * Requirements: 1.1, 2.1, 2.2, 2.3
 * @param {'local' | 'online'} modo - Modo de juego seleccionado
 * @param {string|null} salaId - ID de la sala (solo para modo online)
 * @param {string} nombreJugador - Nombre del jugador
 */
async function onIniciarJuego(modo, salaId = null, nombreJugador = '') {
  console.log(`🎮 Preparando juego en modo: ${modo}`);
  
  modoJuegoActual = modo;
  window.modoJuegoActual = modo; // Actualizar variable global
  salaActualId = salaId;
  nombreJugadorActual = nombreJugador || obtenerNombre();
  
  // Establecer modo en el estado del lobby
  establecerModoJuego(modo);
  if (salaId) {
    establecerSalaActual(salaId);
  }
  
  // Configurar multijugador según el modo
  if (modo === 'local') {
    CONFIG.red.habilitarMultijugador = false;
    console.log('🎯 Modo local: Multijugador deshabilitado');
  } else {
    CONFIG.red.habilitarMultijugador = true;
    console.log('🌐 Modo online: Multijugador habilitado');
  }
  
  // Ocultar lobby
  ocultarLobby();
  
  // En modo local: iniciar directamente con todas las armas
  // En modo online: mostrar menú de selección de armas
  if (modo === 'local') {
    console.log('🎮 Modo local: Iniciando con todas las armas disponibles');
    await inicializarJuegoCompleto();
  } else {
    // Mostrar menú de selección de armas en lugar de iniciar directamente
    // Requirements: 1.1 - Mostrar menú de selección de armas al entrar a partida
    mostrarMenuSeleccionArmas();
  }
}

/**
 * Muestra el menú de selección de armas antes de iniciar la partida
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
function mostrarMenuSeleccionArmas() {
  console.log('🔫 Mostrando menú de selección de armas...');
  
  // Inicializar UI de selección de armas con callback
  inicializarSeleccionArmasUI({
    onJugar: (tipoArma) => {
      console.log(`🎮 Arma seleccionada para jugar: ${tipoArma}`);
      iniciarJuegoConArma(tipoArma);
    },
    onSeleccionar: (tipoArma) => {
      console.log(`🔫 Arma preseleccionada: ${tipoArma}`);
    }
  });
  
  // Mostrar el menú
  mostrarMenuArmas({
    esMuerte: false,
    armaPrevia: null,
    textoBoton: 'Jugar'
  });
  
  // Actualizar estado
  mostrarMenuSeleccion(false);
}

/**
 * Muestra la pantalla de muerte con el menú de selección de armas integrado
 * Requirements: 3.1, 3.2, 3.4 - Pantalla de muerte con menú de selección de armas
 * @param {string} killerId - ID del jugador que eliminó al jugador local
 * @param {string} armaActual - Arma que tenía equipada al morir
 */
function mostrarPantallaMuerteConSeleccion(killerId, armaActual) {
  console.log(`💀 Mostrando pantalla de muerte - Arma previa: ${armaActual}`);
  
  // Mostrar pantalla de muerte con opciones
  mostrarPantallaMuerte(killerId, 5000, {
    armaActual: armaActual,
    onReaparecer: () => {
      // Obtener arma seleccionada (puede haber cambiado)
      const armaParaRespawn = obtenerArmaSeleccionadaUI() || armaActual;
      console.log(`🔄 Reapareciendo con arma: ${armaParaRespawn}`);
      
      // Actualizar arma seleccionada para el respawn
      armaSeleccionadaParaPartida = armaParaRespawn;
      
      // Limpiar grid de armas de muerte
      limpiarGridArmasMuerte();
      
      // Solicitar respawn al servidor
      if (isMultiplayerConnected && inputSender) {
        inputSender.sendRespawn(armaParaRespawn);
      }
      
      // Activar pointer lock
      document.body.requestPointerLock();
    },
    onSeleccionarArma: (tipoArma) => {
      console.log(`🔫 Arma seleccionada para respawn: ${tipoArma}`);
      armaSeleccionadaParaPartida = tipoArma;
    }
  });
  
  // Generar grid de armas en la pantalla de muerte
  // Requirements: 3.1 - Mostrar menú de selección de armas en pantalla de muerte
  // Requirements: 4.3 - Mantener arma previa como selección por defecto
  generarGridArmasMuerte(armaActual, (tipoArma) => {
    console.log(`🔫 Arma seleccionada en muerte: ${tipoArma}`);
    armaSeleccionadaParaPartida = tipoArma;
  });
  
  // Configurar el botón de reaparecer
  configurarBotonReaparecer(armaActual);
}

/**
 * Configura el botón de reaparecer en la pantalla de muerte
 * Requirements: 4.1, 4.2 - Reaparecer con arma seleccionada
 * @param {string} armaActual - Arma por defecto para reaparecer
 */
function configurarBotonReaparecer(armaActual) {
  // El botón se configura en mostrarPantallaMuerte de ui.js
  // Solo necesitamos agregar el listener para el click
  
  // Esperar un poco para que el DOM se actualice
  setTimeout(() => {
    const botonReaparecer = document.getElementById('btn-reaparecer');
    if (!botonReaparecer) return;
    
    // Remover listeners anteriores clonando el botón
    const nuevoBoton = botonReaparecer.cloneNode(true);
    
    // Mantener el estado disabled del botón original
    nuevoBoton.disabled = botonReaparecer.disabled;
    if (botonReaparecer.classList.contains('disabled')) {
      nuevoBoton.classList.add('disabled');
    }
    
    botonReaparecer.parentNode.replaceChild(nuevoBoton, botonReaparecer);
    
    // Agregar nuevo listener
    nuevoBoton.addEventListener('click', () => {
      if (nuevoBoton.disabled) return;
      
      // Obtener arma seleccionada (puede haber cambiado)
      const armaParaRespawn = obtenerArmaSeleccionadaUI() || armaActual;
      console.log(`🔄 Reapareciendo con arma: ${armaParaRespawn}`);
      
      // Actualizar arma seleccionada para el respawn
      armaSeleccionadaParaPartida = armaParaRespawn;
      
      // Ocultar pantalla de muerte
      ocultarPantallaMuerte();
      limpiarGridArmasMuerte();
      
      // Solicitar respawn al servidor
      // Requirements: 4.1, 4.2 - Reaparecer con arma seleccionada
      if (isMultiplayerConnected && inputSender) {
        inputSender.sendRespawn(armaParaRespawn);
      }
      
      // Activar pointer lock
      // Requirements: 5.3 - Activar pointer lock al reaparecer
      document.body.requestPointerLock();
      
      // Marcar inicio de partida nuevamente
      iniciarPartidaSeleccion();
    });
    
    // Configurar el timer para habilitar el botón después de 5 segundos
    // El timer ya está corriendo en mostrarPantallaMuerte, pero necesitamos
    // actualizar la referencia al nuevo botón
    const timerInterval = setInterval(() => {
      const timer = document.getElementById('respawn-timer');
      if (timer && parseInt(timer.textContent) <= 0) {
        nuevoBoton.disabled = false;
        nuevoBoton.classList.remove('disabled');
        clearInterval(timerInterval);
      }
    }, 500);
  }, 100);
}

/**
 * Inicia el juego con el arma seleccionada
 * Requirements: 2.1, 2.2
 * @param {string} tipoArma - Tipo de arma seleccionada
 */
async function iniciarJuegoConArma(tipoArma) {
  console.log(`🎮 Iniciando juego con arma: ${tipoArma}`);
  
  // Ocultar menú de selección
  ocultarMenuArmas();
  ocultarMenuSeleccion();
  
  // Guardar el arma seleccionada para usarla después de cargar
  armaSeleccionadaParaPartida = tipoArma;
  
  // Iniciar el juego completo
  await inicializarJuegoCompleto();
}

// Variable para almacenar el arma seleccionada antes de iniciar
let armaSeleccionadaParaPartida = 'M4A1';

/**
 * Muestra el indicador de modo local en la UI
 * Requirements: 2.3
 */
function mostrarIndicadorModoLocal() {
  // Verificar si ya existe el indicador
  let indicador = document.getElementById('modo-local-indicator');
  
  if (!indicador) {
    indicador = document.createElement('div');
    indicador.id = 'modo-local-indicator';
    indicador.className = 'modo-local-indicator';
    indicador.innerHTML = '<i data-lucide="gamepad-2"></i> Modo Local';
    document.body.appendChild(indicador);
    
    // Reinicializar iconos Lucide después de agregar el HTML
    if (typeof window.reinicializarIconos === 'function') {
      window.reinicializarIconos();
    }
  }
  
  indicador.style.display = 'block';
}

/**
 * Oculta el indicador de modo local
 */
function ocultarIndicadorModoLocal() {
  const indicador = document.getElementById('modo-local-indicator');
  if (indicador) {
    indicador.style.display = 'none';
  }
}

/**
 * Inicializa el sistema de bots de entrenamiento para modo local
 * Requirements: 1.1, 2.1, 3.1, 4.4, 6.1, 6.2
 */
function inicializarBotManager() {
  if (botManager) {
    console.warn('BotManager ya está inicializado');
    return;
  }

  console.log('🤖 Inicializando sistema de bots de entrenamiento...');

  // Inicializar UI de entrenamiento
  // Requirements: 6.1, 6.2
  inicializarEntrenamientoUI();

  // Crear instancia del BotManager con callbacks de UI
  // Requirements: 6.1, 6.2, 6.3 - Sin sistema de zonas
  botManager = new BotManager(scene, {
    onDisparoBot: (infoDisparo) => {
      // Callback cuando un bot tirador dispara al jugador
      console.log('🔫 Bot tirador disparó al jugador');
      
      // Aplicar daño al jugador en modo local
      if (jugador && jugador.health !== undefined) {
        const dañoAplicado = infoDisparo.daño || 10;
        jugador.health = Math.max(0, jugador.health - dañoAplicado);
        
        // Actualizar UI de vida
        actualizarBarraVida(jugador.health, jugador.maxHealth || 200);
        
        // Mostrar efecto de daño
        mostrarEfectoDaño();
        
        console.log(`💔 Jugador recibió ${dañoAplicado} de daño. Vida: ${jugador.health}/${jugador.maxHealth || 200}`);
        
        // Verificar si el jugador murió
        if (jugador.health <= 0) {
          console.log('💀 Jugador murió en modo local por bot');
          manejarMuerteLocalPorBot();
        }
      }
    },
    // Requirement 6.2: Actualizar UI cuando se elimina un bot
    onEliminacion: (tipoBot, estadisticas) => {
      console.log(`📊 Bot ${tipoBot} eliminado - Actualizando UI`);
      actualizarEstadisticasUI(estadisticas);
    },
    // Actualizar estadísticas en UI
    onEstadisticasActualizadas: (estadisticas) => {
      actualizarEstadisticasUI(estadisticas);
    }
  });

  // Inicializar el sistema de bots
  botManager.inicializar();

  // Mostrar estadísticas iniciales
  actualizarEstadisticasUI(botManager.obtenerEstadisticas());

  console.log('✅ Sistema de bots de entrenamiento inicializado');
}

/**
 * Inicializa el sistema de spawns de munición
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
async function inicializarAmmoSpawns() {
  if (ammoSpawns.length > 0) {
    console.warn('AmmoSpawns ya están inicializados');
    return;
  }

  console.log('📦 Inicializando sistema de spawns de munición...');

  const configSpawns = CONFIG.spawnsAmmo;
  if (!configSpawns || !configSpawns.posiciones) {
    console.warn('⚠️ No se encontró configuración de spawns de munición');
    return;
  }

  // Crear spawns en cada posición configurada
  for (const posicion of configSpawns.posiciones) {
    const spawn = new AmmoSpawn(scene, posicion, {
      porcentajeMunicion: configSpawns.porcentajeMunicion,
      tiempoRecarga: configSpawns.tiempoRecarga,
      radioRecoleccion: configSpawns.radioRecoleccion,
      escala: configSpawns.escala
    });

    // Cargar el modelo
    try {
      await spawn.cargarModelo(configSpawns.modelo);
    } catch (error) {
      console.warn(`⚠️ Error cargando modelo de spawn:`, error);
    }

    ammoSpawns.push(spawn);
  }

  console.log(`✅ Sistema de spawns de munición inicializado: ${ammoSpawns.length} spawns`);
}

/**
 * Actualiza los spawns de munición y verifica recolección
 * Requirements: 5.1, 5.2, 5.3
 * @param {number} deltaTime - Tiempo desde el último frame
 */
function actualizarAmmoSpawns(deltaTime) {
  if (ammoSpawns.length === 0) return;

  const estadoArma = obtenerEstado();
  
  for (const spawn of ammoSpawns) {
    // Actualizar timer de recarga
    spawn.actualizar(deltaTime);

    // Verificar si el jugador puede recoger munición
    if (spawn.estaActivo() && jugador.posicion) {
      // Verificar si la munición ya está llena
      const configArma = CONFIG.armas[estadoArma.tipoActual];
      if (configArma && configArma.municionTotal && arma.municionTotal >= configArma.municionTotal) {
        // Munición llena, no recoger
        continue;
      }
      
      const resultado = spawn.recoger(jugador, estadoArma);
      
      if (resultado.exito) {
        // En modo multijugador, enviar al servidor para que actualice la munición
        if (isMultiplayerConnected) {
          inputSender.sendAmmoPickup(resultado.municionOtorgada, spawn.id);
        } else {
          // Modo local: actualizar directamente
          const municionMaxima = configArma ? configArma.municionTotal : 100;
          arma.municionTotal = Math.min(arma.municionTotal + resultado.municionOtorgada, municionMaxima);
        }
        
        // Actualizar display de munición
        actualizarDisplayMunicion();
        
        // Mostrar feedback visual
        mostrarMensajeMunicion(resultado.municionOtorgada);
        
        console.log(`🎁 +${resultado.municionOtorgada} munición recogida`);
      }
    }
  }
}

/**
 * Muestra un mensaje temporal cuando se recoge munición
 * @param {number} cantidad - Cantidad de munición recogida
 */
function mostrarMensajeMunicion(cantidad) {
  // Crear elemento de mensaje
  const mensaje = document.createElement('div');
  mensaje.className = 'ammo-pickup-message';
  mensaje.innerHTML = `+${cantidad} <i data-lucide="crosshair"></i>`;
  mensaje.style.cssText = `
    position: fixed;
    bottom: 150px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 128, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 18px;
    font-weight: bold;
    z-index: 1000;
    animation: fadeInOut 2s ease-in-out;
    pointer-events: none;
  `;

  // Agregar animación CSS si no existe
  if (!document.getElementById('ammo-pickup-style')) {
    const style = document.createElement('style');
    style.id = 'ammo-pickup-style';
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0); }
        80% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(mensaje);
  
  // Reinicializar iconos Lucide después de agregar el HTML
  if (typeof window.reinicializarIconos === 'function') {
    window.reinicializarIconos();
  }

  // Remover después de la animación
  setTimeout(() => {
    mensaje.remove();
  }, 2000);
}

/**
 * Destruye todos los spawns de munición
 */
function destruirAmmoSpawns() {
  for (const spawn of ammoSpawns) {
    spawn.destruir();
  }
  ammoSpawns = [];
  console.log('🗑️ Spawns de munición destruidos');
}

// Network state
let connection = null;
let inputSender = null;
let remotePlayerManager = null;
let isMultiplayerConnected = false;
let localPlayerId = null;

// Bot Manager para modo local
// Requirements: 1.1, 2.1, 3.1, 4.4
let botManager = null;

// Sistema de spawns de munición
// Requirements: 5.1, 5.2, 5.3, 5.4
let ammoSpawns = [];

// Chat system
let chatSystem = null;

// Input sending rate control (20Hz to match server tick rate)
const INPUT_SEND_RATE = 1000 / 20; // 50ms
let lastInputSendTime = 0;

// Referencias a elementos de pantalla de carga
let loadingScreen = null;
let loadingBar = null;
let loadingText = null;

/**
 * Actualiza la pantalla de carga
 */
function actualizarCarga(progreso, texto) {
  if (loadingBar) loadingBar.style.width = `${progreso}%`;
  if (loadingText) loadingText.textContent = texto;
}

/**
 * Oculta la pantalla de carga
 */
function ocultarPantallaCarga() {
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }
}

/**
 * Inicializa el lobby y espera la selección del jugador
 * Requirements: 1.1 - Mostrar lobby en lugar de iniciar juego directamente
 */
async function inicializar() {
  console.log('🎮 Inicializando sistema de lobby...');
  
  // Cargar configuración del lobby
  cargarConfiguracionLobby();
  
  // Inicializar sistema de autenticación (opcional)
  try {
    inicializarAuthUI();
    console.log('✅ Sistema de autenticación inicializado');
  } catch (error) {
    console.warn('⚠️ Error inicializando autenticación:', error);
  }
  
  // Inicializar lobby normal (sin requerir autenticación)
  inicializarLobbyNormal();
}

/**
 * Inicializa el lobby normal
 */
function inicializarLobbyNormal() {
  // Inicializar UI del lobby con callbacks
  inicializarLobbyUI({
    onModoLocal: (nombre) => {
      console.log(`🎮 Modo local seleccionado por: ${nombre}`);
      onIniciarJuego('local', null, nombre);
    },
    onMatchmaking: async (nombre) => {
      console.log(`🔍 Iniciando matchmaking para: ${nombre}`);
      await manejarMatchmaking(nombre);
    },
    onCrearPartida: async (nombre, password) => {
      console.log(`➕ Creando partida privada para: ${nombre}`);
      await manejarCrearPartida(nombre, password);
    },
    onUnirsePartida: async (nombre, codigo, password) => {
      console.log(`🚪 Uniéndose a partida: ${codigo}`);
      await manejarUnirsePartida(nombre, codigo, password);
    },
    onCancelarMatchmaking: () => {
      console.log('❌ Matchmaking cancelado');
      cancelarOperacionesPendientes();
    },
    onSalirSala: () => {
      console.log('🚪 Saliendo de la sala');
      cancelarOperacionesPendientes();
      salaActualId = null;
    },
    onIniciarPartida: () => {
      console.log('▶️ Iniciando partida desde sala de espera');
      if (salaActualId) {
        onIniciarJuego('online', salaActualId, nombreJugadorActual);
      }
    }
  });
  
  console.log('✅ Lobby inicializado - Esperando selección del jugador');
}

/**
 * Maneja el proceso de matchmaking
 * Requirement 6.4: Show errors in the correct screen
 * @param {string} nombre - Nombre del jugador
 */
async function manejarMatchmaking(nombre) {
  try {
    // Primero conectar al servidor si no está conectado
    await conectarServidorParaLobby();
    
    actualizarEstadoMatchmaking('Buscando partida...');
    
    // Obtener arma seleccionada del sistema de selección de armas
    const armaSeleccionada = obtenerArmaSeleccionadaUI() || armaSeleccionadaParaPartida || 'M4A1';
    armaSeleccionadaParaPartida = armaSeleccionada; // Sincronizar
    const resultado = await solicitarMatchmaking(nombre, armaSeleccionada);
    
    console.log(`✅ Matchmaking exitoso con arma ${armaSeleccionada}:`, resultado);
    salaActualId = resultado.roomId;
    nombreJugadorActual = nombre;
    
    // Inicializar lista de jugadores con los jugadores existentes (Requirement 5.3, 5.4)
    jugadoresEnSala = (resultado.playerList || []).map((jugador, index) => ({
      id: jugador.id,
      nombre: jugador.nombre,
      esHost: index === 0 // El primer jugador es el host
    }));
    
    // Agregar al jugador actual a la lista
    jugadoresEnSala.push({
      id: connection.getPlayerId(),
      nombre: nombre,
      esHost: jugadoresEnSala.length === 0 // Es host si es el primero
    });
    
    // Iniciar juego directamente después del matchmaking
    onIniciarJuego('online', resultado.roomId, nombre);
    
  } catch (error) {
    console.error('❌ Error en matchmaking:', error);
    // Requirement 6.4: First change to online screen, then show error there
    mostrarPantalla('online');
    // Small delay to ensure screen transition completes before showing error
    setTimeout(() => {
      mostrarError(error.message || 'Error al buscar partida');
    }, 350);
  }
}

/**
 * Maneja la creación de una partida privada
 * @param {string} nombre - Nombre del jugador
 * @param {string} password - Contraseña de la sala
 */
async function manejarCrearPartida(nombre, password) {
  try {
    // Primero conectar al servidor si no está conectado
    await conectarServidorParaLobby();
    
    // Obtener arma seleccionada del sistema de selección de armas
    const armaSeleccionada = obtenerArmaSeleccionadaUI() || armaSeleccionadaParaPartida || 'M4A1';
    armaSeleccionadaParaPartida = armaSeleccionada; // Sincronizar
    const resultado = await crearPartidaPrivada(nombre, password, armaSeleccionada);
    
    console.log(`✅ Partida creada con arma ${armaSeleccionada}:`, resultado);
    salaActualId = resultado.roomId;
    nombreJugadorActual = nombre;
    
    // Inicializar lista de jugadores con el creador (Requirement 5.4)
    jugadoresEnSala = [{
      id: connection.getPlayerId(),
      nombre: nombre,
      esHost: true
    }];
    
    // Mostrar pantalla de sala creada con el código
    mostrarSalaCreada(resultado.roomCode);
    
    // Actualizar lista de jugadores en la UI
    actualizarListaJugadores(jugadoresEnSala);
    
  } catch (error) {
    console.error('❌ Error al crear partida:', error);
    mostrarErrorCrear(error.message || 'Error al crear partida');
  }
}

/**
 * Maneja unirse a una partida privada
 * @param {string} nombre - Nombre del jugador
 * @param {string} codigo - Código de la sala
 * @param {string} password - Contraseña de la sala
 */
async function manejarUnirsePartida(nombre, codigo, password) {
  try {
    // Primero conectar al servidor si no está conectado
    await conectarServidorParaLobby();
    
    // Obtener arma seleccionada del sistema de selección de armas
    const armaSeleccionada = obtenerArmaSeleccionadaUI() || armaSeleccionadaParaPartida || 'M4A1';
    armaSeleccionadaParaPartida = armaSeleccionada; // Sincronizar
    const resultado = await unirsePartidaPrivada(nombre, codigo, password, armaSeleccionada);
    
    console.log(`✅ Unido a partida con arma ${armaSeleccionada}:`, resultado);
    salaActualId = resultado.roomId;
    nombreJugadorActual = nombre;
    
    // Inicializar lista de jugadores con los jugadores existentes (Requirement 5.3, 5.4)
    jugadoresEnSala = (resultado.playerList || []).map((jugador, index) => ({
      id: jugador.id,
      nombre: jugador.nombre,
      esHost: index === 0 // El primer jugador es el host
    }));
    
    // Agregar al jugador actual a la lista
    jugadoresEnSala.push({
      id: connection.getPlayerId(),
      nombre: nombre,
      esHost: false
    });
    
    // Iniciar juego directamente después de unirse
    onIniciarJuego('online', resultado.roomId, nombre);
    
  } catch (error) {
    console.error('❌ Error al unirse a partida:', error);
    mostrarErrorUnirse(error.message || 'Error al unirse a partida');
  }
}

/**
 * Conecta al servidor para operaciones del lobby
 */
async function conectarServidorParaLobby() {
  if (connection && connection.isConnected()) {
    return; // Ya conectado
  }
  
  connection = getConnection();
  
  // Configurar callback para respuestas del lobby
  connection.onLobbyResponse((response) => {
    manejarRespuestaLobby(response);
  });
  
  // Configurar callbacks para eventos de jugadores en el lobby (Requirement 5.4)
  connection.onPlayerJoined((player) => {
    console.log(`[LOBBY] Jugador unido: ${player.nombre}`);
    // Actualizar lista de jugadores en la UI si estamos en la sala de espera
    manejarJugadorUnido(player);
  });
  
  connection.onPlayerLeft((playerId) => {
    console.log(`[LOBBY] Jugador salió: ${playerId}`);
    // Actualizar lista de jugadores en la UI si estamos en la sala de espera
    manejarJugadorSalio(playerId);
  });
  
  const serverUrl = obtenerUrlServidor();
  
  try {
    await connection.connect(serverUrl);
    console.log('✅ Conectado al servidor para lobby');
  } catch (error) {
    console.error('❌ Error conectando al servidor:', error);
    throw new Error('No se pudo conectar al servidor');
  }
}

// Lista de jugadores en la sala actual (para el lobby)
let jugadoresEnSala = [];

/**
 * Maneja cuando un jugador se une a la sala
 * Requirement 5.4: Actualizar UI con lista de jugadores
 * @param {Object} player - Datos del jugador
 */
function manejarJugadorUnido(player) {
  // Agregar jugador a la lista local
  if (!jugadoresEnSala.find(j => j.id === player.id)) {
    jugadoresEnSala.push({
      id: player.id,
      nombre: player.nombre,
      esHost: false
    });
  }
  
  // Actualizar UI
  actualizarListaJugadores(jugadoresEnSala);
}

/**
 * Maneja cuando un jugador sale de la sala
 * Requirement 5.4: Actualizar UI con lista de jugadores
 * @param {string} playerId - ID del jugador que salió
 */
function manejarJugadorSalio(playerId) {
  // Remover jugador de la lista local
  jugadoresEnSala = jugadoresEnSala.filter(j => j.id !== playerId);
  
  // Actualizar UI
  actualizarListaJugadores(jugadoresEnSala);
}

/**
 * Inicializa el juego completo después de la selección del lobby
 */
async function inicializarJuegoCompleto() {
  // Obtener referencias a elementos de carga
  loadingScreen = document.getElementById('loading-screen');
  loadingBar = document.getElementById('loading-bar');
  loadingText = document.getElementById('loading-text');
  
  // Mostrar pantalla de carga
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
    loadingScreen.classList.remove('hidden');
  }

  actualizarCarga(5, 'Iniciando...');

  actualizarCarga(10, 'Creando escena...');

  // Inicializar escena de Three.js (inicia carga del mapa)
  const mapaPromise = inicializarEscena((progresoMapa) => {
    // El mapa representa del 10% al 50% de la carga
    const progresoTotal = 10 + (progresoMapa * 0.4);
    actualizarCarga(progresoTotal, `Cargando mapa: ${progresoMapa}%`);
  });

  // Inicializar jugador
  inicializarJugador();

  actualizarCarga(15, 'Cargando mapa...');

  // Esperar a que el mapa cargue (ESENCIAL)
  await mapaPromise;
  
  actualizarCarga(45, 'Cargando colisiones...');
  
  // Inicializar sistema de colisiones después del mapa visual
  // Requirements: 2.1 - Cargar map_coll.glb como geometría de colisiones
  try {
    await inicializarColisiones(scene, (progresoColisiones) => {
      const progresoTotal = 45 + (progresoColisiones * 0.05);
      actualizarCarga(progresoTotal, `Cargando colisiones: ${progresoColisiones}%`);
    });
    console.log('✅ Sistema de colisiones inicializado');
  } catch (error) {
    console.warn('⚠️ Error inicializando colisiones, usando fallback:', error);
    // El sistema de colisiones maneja internamente el fallback
  }
  
  actualizarCarga(50, 'Cargando arma principal...');

  // Cargar SOLO el arma inicial - usar el arma seleccionada
  console.log(`🔫 armaSeleccionadaParaPartida antes de inicializarArmaInicial: ${armaSeleccionadaParaPartida}`);
  await inicializarArmaInicial();

  actualizarCarga(65, 'Cargando animaciones...');

  // Precargar animaciones para jugadores remotos (ESENCIAL para ver otros jugadores)
  try {
    await precargarAnimaciones();
  } catch (err) {
    console.warn('Error precargando animaciones:', err);
  }

  actualizarCarga(80, 'Configurando controles...');

  // Inicializar controles
  inicializarControles({
    onRecargar: manejarRecarga,
    onDash: manejarDash,
    onDisparar: manejarDisparo,
    onSaltar: manejarSalto,
    onMovimientoMouse: manejarMovimientoMouse,
    onSiguienteArma: manejarSiguienteArmaRueda,
    onArmaAnterior: manejarArmaAnterior,
    onSeleccionarArma: manejarSeleccionarArma,
    onApuntar: manejarApuntado,
    onPausar: manejarPausar,
    onAlternarCuchillo: manejarAlternarCuchillo,
    onAlternarJuiceBox: manejarAlternarJuiceBox
  });

  // Establecer referencia de cámara para el sistema de apuntado
  establecerCamara(camera);

  // Inicializar menú de pausa
  try {
    inicializarMenuPausa({
      onReanudar: () => {
        console.log('🎮 Juego reanudado desde menú');
      },
      onDesconectar: () => {
        console.log('🔌 Desconectando del servidor...');
        if (connection && isMultiplayerConnected) {
          connection.disconnect();
        }
      },
      onSalir: () => {
        console.log('🚪 Saliendo al lobby...');
        volverAlLobby();
      },
      onConfiguracionCambiada: (tipo, valor) => {
        console.log(`⚙️ Configuración cambiada: ${tipo} = ${valor}`);
        // Aplicar cambios de configuración en tiempo real
        if (tipo === 'fov' && camera) {
          camera.fov = valor;
          camera.updateProjectionMatrix();
        } else if (tipo === 'crosshairDinamico') {
          habilitarCrosshairDinamico(valor);
        }
      }
    });
    console.log('✅ Menú de pausa inicializado correctamente');
  } catch (error) {
    console.warn('⚠️ Error inicializando menú de pausa:', error);
    // Continuar sin menú de pausa si hay error
  }

  // Inicializar sistema de sonidos
  try {
    inicializarSonidos();
    console.log('✅ Sistema de sonidos inicializado');
  } catch (error) {
    console.warn('⚠️ Error inicializando sonidos:', error);
  }

  // Inicializar sistema de crosshair dinámico
  try {
    inicializarCrosshair();
    console.log('✅ Sistema de crosshair dinámico inicializado');
  } catch (error) {
    console.warn('⚠️ Error inicializando crosshair dinámico:', error);
    // Continuar sin crosshair dinámico si hay error
  }

  // Inicializar selector de armas local
  try {
    inicializarSelectorArmasLocal(weaponContainer, isMultiplayerConnected, inputSender);
    console.log('✅ Selector de armas local inicializado');
  } catch (error) {
    console.warn('⚠️ Error inicializando selector de armas local:', error);
  }

  // Inicializar sistema de chat
  try {
    chatSystem = new ChatSystem({
      isOnline: modoJuegoActual === 'online',
      playerName: nombreJugadorActual || 'Jugador',
      onChatStateChange: (activo) => {
        console.log(`Chat ${activo ? 'activado' : 'desactivado'} - Controles ${activo ? 'bloqueados' : 'desbloqueados'}`);
      }
    });
    
    // Configurar verificador de chat en el sistema de controles
    establecerVerificadorChat(() => chatSystem ? chatSystem.estaActivo() : false);
    
    console.log('✅ Sistema de chat inicializado');
  } catch (error) {
    console.warn('⚠️ Error inicializando chat:', error);
    // Continuar sin chat si hay error
  }

  // Inicializar sistema de autenticación
  try {
    inicializarAuthUI();
    console.log('✅ Sistema de autenticación inicializado');
  } catch (error) {
    console.warn('⚠️ Error inicializando autenticación:', error);
    // Continuar sin autenticación si hay error
  }

  // Inicializar sistema de menú de usuario - COMENTADO TEMPORALMENTE
  // try {
  //   inicializarMenuUsuario();
  //   console.log('✅ Sistema de menú de usuario inicializado');
  // } catch (error) {
  //   console.warn('⚠️ Error inicializando menú de usuario:', error);
  //   // Continuar sin menú de usuario si hay error
  // }

  // Inicializar displays de UI
  actualizarDisplayMunicion();
  actualizarRecargaDash();
  
  // Inicializar iconos de Lucide
  inicializarLucideIcons();

  // Initialize network connection (Requirement 2.1)
  // Solo conectar si es modo online
  console.log(`🔍 Modo de juego actual: ${modoJuegoActual}`);
  
  if (modoJuegoActual === 'online') {
    actualizarCarga(90, 'Conectando al servidor...');
    await inicializarRed();
  } else {
    actualizarCarga(90, 'Iniciando modo local...');
    
    // Modo local - mostrar indicador
    mostrarIndicadorModoLocal();
    console.log('🎮 Modo local iniciado - Sin conexión al servidor');
    
    // Reposicionar jugador para modo local (Z=5, mirando hacia +Z)
    jugador.posicion.set(0, CONFIG.jugador.alturaOjos, 5);
    jugador.rotacion.set(0, Math.PI, 0); // Mirando hacia +Z (180 grados)
    // La cámara se sincronizará automáticamente en el bucle del juego
    
    // Inicializar sistema de bots de entrenamiento
    // Requirements: 1.1, 2.1, 3.1, 4.4
    inicializarBotManager();
    
    // Mostrar selector de armas local
    mostrarSelectorArmasLocal();
  }

  // Inicializar sistema de spawns de munición (para ambos modos)
  // Requirements: 5.1, 5.2, 5.3, 5.4
  await inicializarAmmoSpawns();

  actualizarCarga(100, '¡Listo!');

  // Pequeña pausa para mostrar el 100%
  await new Promise(resolve => setTimeout(resolve, 300));

  // Marcar juego como iniciado
  juegoIniciado = true;

  // Iniciar bucle del juego ANTES de ocultar la pantalla
  // Esto asegura que el canvas ya esté renderizando cuando se quite la pantalla de carga
  bucleJuego();

  // Ocultar pantalla de carga
  ocultarPantallaCarga();
  
  // Cargar el resto de armas en background (LAZY LOADING)
  cargarArmasEnBackground();
}

/**
 * Vuelve al lobby desde el juego
 */
function volverAlLobby() {
  // Desconectar del servidor si está conectado
  if (connection && isMultiplayerConnected) {
    connection.disconnect();
  }
  
  // Resetear estado
  isMultiplayerConnected = false;
  localPlayerId = null;
  juegoIniciado = false;
  modoJuegoActual = null;
  salaActualId = null;
  
  // Ocultar indicador de modo local
  ocultarIndicadorModoLocal();
  
  // Ocultar selector de armas local
  ocultarSelectorArmasLocal();
  
  // Destruir sistema de bots si existe
  if (botManager) {
    botManager.destruir();
    botManager = null;
  }
  
  // Destruir sistema de spawns de munición
  // Requirements: 5.1, 5.2, 5.3, 5.4
  destruirAmmoSpawns();
  
  // Destruir UI de entrenamiento
  destruirEntrenamientoUI();
  
  // Limpiar jugadores remotos
  if (remotePlayerManager) {
    remotePlayerManager.clear();
  }
  
  // Cerrar sesión y volver al login
  cerrarSesion();
  
  // Recargar la página para reiniciar completamente
  window.location.reload();
}

/**
 * Registra un kill para las estadísticas
 * Requirements: 8.1, 8.2
 */
function registrarKill() {
  actualizarEstadisticasLobby(1, 0);
  
  // Registrar en sistema de progreso
  registrarKillProgreso();
  
  // Actualizar estadísticas locales para usuarios no autenticados
  actualizarStatsLocales('kills', 1);
  
  console.log('📊 Kill registrado');
}

/**
 * Registra una muerte para las estadísticas
 * Requirements: 8.1, 8.2
 */
function registrarDeath() {
  actualizarEstadisticasLobby(0, 1);
  
  // Registrar en sistema de progreso
  registrarDeathProgreso();
  
  // Actualizar estadísticas locales para usuarios no autenticados
  actualizarStatsLocales('deaths', 1);
  
  console.log('📊 Muerte registrada');
}

/**
 * Registra un impacto recibido (para estadísticas futuras)
 */
function registrarImpacto() {
  // Registrar en sistema de progreso
  registrarImpactoProgreso();
  
  // Por ahora solo log, se puede expandir para estadísticas de daño
  console.log('📊 Impacto recibido');
}

/**
 * Actualizar estadísticas locales para usuarios no autenticados
 */
function actualizarStatsLocales(stat, incremento = 1) {
  try {
    const authState = obtenerEstadoAuth();
    if (authState.isAuthenticated) return; // Solo para usuarios no autenticados
    
    const statsLocales = getStorageJSON('gameStats', {});
    statsLocales[stat] = (statsLocales[stat] || 0) + incremento;
    
    // Calcular experiencia basada en acciones
    if (stat === 'kills') {
      statsLocales.experience = (statsLocales.experience || 0) + 100; // 100 XP por kill
    } else if (stat === 'shotsFired') {
      statsLocales.experience = (statsLocales.experience || 0) + 1; // 1 XP por disparo
    } else if (stat === 'shotsHit') {
      statsLocales.experience = (statsLocales.experience || 0) + 5; // 5 XP por impacto
    }
    
    const guardado = setStorageJSON('gameStats', statsLocales);
    if (!guardado) {
      console.warn('⚠️ Estadísticas guardadas en memoria temporal');
    }
  } catch (error) {
    console.warn('⚠️ Error actualizando estadísticas locales:', error);
  }
}

/**
 * Initialize network connection and set up callbacks
 * Requirements: 2.1, 2.2
 */
async function inicializarRed() {
  // Verificar si el multijugador está habilitado
  if (!CONFIG.red.habilitarMultijugador) {
    console.log('🎮 Modo local: Multijugador deshabilitado');
    return;
  }

  mostrarMensajeConexion('Conectando al servidor...');
  
  // Reutilizar conexión existente si ya está conectada (del lobby)
  if (!connection) {
    connection = getConnection();
  }
  
  inputSender = getInputSender();
  
  // Initialize remote player manager
  remotePlayerManager = initializeRemotePlayerManager(scene);
  
  // Set up event callbacks before connecting
  configurarCallbacksRed();
  
  // Si ya está conectado (desde el lobby), solo configurar callbacks
  if (connection.isConnected()) {
    console.log('✅ Reutilizando conexión existente del lobby');
    
    // IMPORTANTE: Configurar el localPlayerId en el remotePlayerManager
    // ya que el callback onWelcome ya se ejecutó durante el matchmaking
    const existingPlayerId = connection.getPlayerId();
    if (existingPlayerId) {
      localPlayerId = existingPlayerId;
      remotePlayerManager.setLocalPlayerId(existingPlayerId);
      isMultiplayerConnected = true;
      console.log(`✅ LocalPlayerId configurado: ${existingPlayerId}`);
    }
    
    // Enviar nombre del jugador al servidor
    // Requirements: 1.1 - Pasar nombre del jugador al servidor al conectar
    connection.send('playerInfo', {
      playerName: nombreJugadorActual,
      roomId: salaActualId
    });
    
    ocultarMensajeConexion();
    return;
  }
  
  // Get server URL (default to localhost:3000)
  const serverUrl = obtenerUrlServidor();
  
  let intentos = 0;
  const maxIntentos = CONFIG.red.reintentos;
  
  while (intentos < maxIntentos) {
    try {
      console.log(`Intento de conexión ${intentos + 1}/${maxIntentos} a ${serverUrl}`);
      await connection.connect(serverUrl);
      console.log('✅ Conectado al servidor exitosamente');
      
      // Enviar nombre del jugador al servidor después de conectar
      // Requirements: 1.1 - Pasar nombre del jugador al servidor al conectar
      connection.send('playerInfo', {
        playerName: nombreJugadorActual,
        roomId: salaActualId
      });
      
      return;
    } catch (error) {
      intentos++;
      console.error(`❌ Fallo en intento ${intentos}:`, error.message);
      
      if (intentos >= maxIntentos) {
        console.log('🎮 Cambiando a modo local (sin multijugador)');
        mostrarMensajeConexion('Modo local - Sin conexión al servidor', false);
        
        // Mostrar indicador de modo local
        mostrarIndicadorModoLocal();
        modoJuegoActual = 'local';
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
          ocultarMensajeConexion();
        }, 3000);
        
        return;
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Get server URL from config or default
 */
function obtenerUrlServidor() {
  // Use current host for WebSocket connection
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname || 'localhost';
  
  // En producción (HTTPS) usar ruta /ws que nginx redirige al servidor de juego
  if (window.location.protocol === 'https:') {
    return `${protocol}//${host}/ws`;
  }
  
  // En desarrollo local, conectar directamente al puerto 3000
  return `${protocol}//${host}:3000`;
}

/**
 * Configure network event callbacks
 * Requirements: 2.2, 2.3
 */
function configurarCallbacksRed() {
  // Welcome message - receive player ID and initial state (Requirement 2.2)
  connection.onWelcome((data) => {
    localPlayerId = data.playerId;
    isMultiplayerConnected = true;
    
    console.log(`Assigned player ID: ${localPlayerId}`);
    
    // Set local player ID in remote player manager
    remotePlayerManager.setLocalPlayerId(localPlayerId);
    
    // Actualizar chat a modo online
    if (chatSystem) {
      chatSystem.setMode(true, nombreJugadorActual || `Jugador ${localPlayerId}`);
    }
    
    // Apply initial game state (pero NO sobrescribir el arma local)
    // La función actualizarArmaDesdeServidor ya verifica si el arma coincide
    if (data.gameState) {
      procesarEstadoJuego(data.gameState);
    }
    
    // Enviar weaponChange al servidor para asegurar sincronización
    const armaLocal = armaSeleccionadaParaPartida;
    if (armaLocal && inputSender) {
      console.log(`🔫 Sincronizando arma con servidor: ${armaLocal}`);
      inputSender.sendWeaponChange(armaLocal);
    }
    
    // Actualizar UI con el estado del arma LOCAL (no del servidor)
    actualizarDisplayMunicion();
    
    ocultarMensajeConexion();
  });
  
  // Game state updates
  connection.onGameState((gameState) => {
    procesarEstadoJuego(gameState);
  });
  
  // Player joined
  connection.onPlayerJoined((player) => {
    console.log(`Player joined: ${player.id}`);
    remotePlayerManager.addPlayer(player);
  });
  
  // Player left
  connection.onPlayerLeft((playerId) => {
    console.log(`Player left: ${playerId}`);
    remotePlayerManager.removePlayer(playerId);
  });
  
  // Hit notification
  connection.onHit((data) => {
    mostrarEfectoDaño();
    actualizarBarraVida(data.health, 200);
    // Registrar impacto para estadísticas
    registrarImpacto();
  });
  
  // Death notification (Requirement 3.5, 5.4)
  // Requirements: 3.1, 3.2, 3.4 - Mostrar pantalla de muerte con menú de selección de armas
  // Requirements: 4.1, 4.2, 4.3, 5.2 - Usar nombres de lobby y actualizar scoreboard
  connection.onDeath((data) => {
    // Extraer nombres de lobby y scoreboard del mensaje
    const killerName = data.killerName || data.killerId;
    const victimName = data.victimName || data.playerId;
    const scoreboard = data.scoreboard;
    
    // Actualizar scoreboard si viene en el mensaje
    if (scoreboard && Array.isArray(scoreboard)) {
      actualizarScoreboard(scoreboard);
    }
    
    if (data.playerId === localPlayerId) {
      // Cerrar menú de pausa si está activo para evitar superposición
      if (estaMenuActivo()) {
        cerrarMenuForzado();
      }
      
      // En modo local: respawn automático sin menú de selección
      // En modo online: mostrar pantalla de muerte con selección de armas
      if (modoJuegoActual === 'local') {
        console.log('💀 Modo local: Muerte detectada, respawn automático en 3 segundos');
        mostrarPantallaMuerte(killerName, 3000);
        
        // Auto-respawn después de 3 segundos con todas las armas
        setTimeout(() => {
          console.log('🔄 Modo local: Respawneando con todas las armas');
          ocultarPantallaMuerte();
          actualizarBarraVida(200, 200);
          
          // Reconfigurar munición infinita
          configurarMunicionInfinita();
          
          // Activar pointer lock
          document.body.requestPointerLock();
          
          // Marcar inicio de partida nuevamente
          iniciarPartidaSeleccion();
        }, 3000);
      } else {
        // Modo online: comportamiento original
        const estadoArma = obtenerEstado();
        const armaActual = estadoArma.tipoActual || armaSeleccionadaParaPartida;
        
        marcarMuerte(armaActual);
        mostrarPantallaMuerteConSeleccion(killerName, armaActual);
      }
      
      actualizarBarraVida(0, 200);
      registrarDeath();
    } else if (data.killerId === localPlayerId) {
      // El jugador local eliminó a alguien
      registrarKill();
    }
    
    // Usar nombres de lobby en el kill feed
    // Requirements: 4.1, 4.3 - Usar nombres de lobby en kill feed
    agregarEntradaKillFeed(killerName, victimName, nombreJugadorActual);
  });
  
  // Respawn notification (Requirement 5.5)
  // Requirements: 4.1, 4.2 - Reaparecer con arma seleccionada
  connection.onRespawn((data) => {
    if (data.playerId === localPlayerId) {
      ocultarPantallaMuerte();
      limpiarGridArmasMuerte();
      actualizarBarraVida(200, 200);
      
      // Actualizar el arma si el servidor envió el tipo de arma
      if (data.weaponType) {
        armaSeleccionadaParaPartida = data.weaponType;
        // Cambiar al arma seleccionada
        establecerArmaUnica(data.weaponType, weaponContainer);
        
        // Actualizar UI
        const estadoArma = obtenerEstado();
        actualizarInfoArma(estadoArma);
        
        // Actualizar crosshair según el tipo de arma
        establecerTipoArma(CONFIG.armas[data.weaponType].tipo);
        
        console.log(`🔫 Reaparecido con arma: ${data.weaponType}`);
      }
      
      // Marcar inicio de partida nuevamente
      iniciarPartidaSeleccion();
    }
  });
  
  // Bullet created by another player - trigger shoot animation
  // Requirements: 3.1 - Reproducir animación de ataque TPS para cuchillo
  connection.onBulletCreated((bullet) => {
    if (bullet && bullet.ownerId && bullet.ownerId !== localPlayerId) {
      const remotePlayer = remotePlayerManager.getPlayer(bullet.ownerId);
      if (remotePlayer) {
        // Si es un ataque de cuchillo, usar animación específica
        if (bullet.weaponType === 'KNIFE' && remotePlayer.procesarAtaqueCuchillo) {
          remotePlayer.procesarAtaqueCuchillo();
        } else if (remotePlayer.dispararAnimacion) {
          remotePlayer.dispararAnimacion(0.25);
        }
      }
    }
  });
  
  // Melee attack from another player - trigger knife attack animation TPS
  // Requirements: 3.1, 3.2, 3.4 - Reproducir animación de ataque de cuchillo TPS
  connection.onMeleeAttack((data) => {
    console.log(`🔪 [main.js] Evento meleeAttack recibido:`, data);
    
    if (!data || !data.attackerId) {
      console.warn(`⚠️ [main.js] Evento meleeAttack sin attackerId válido`);
      return;
    }
    
    if (data.attackerId === localPlayerId) {
      console.log(`🔪 [main.js] Ignorando evento meleeAttack propio`);
      return;
    }
    
    const remotePlayer = remotePlayerManager.getPlayer(data.attackerId);
    if (!remotePlayer) {
      console.warn(`⚠️ [main.js] No se encontró jugador remoto con ID: ${data.attackerId}`);
      return;
    }
    
    if (!remotePlayer.procesarAtaqueCuchillo) {
      console.warn(`⚠️ [main.js] Jugador remoto ${data.attackerId} no tiene método procesarAtaqueCuchillo`);
      return;
    }
    
    remotePlayer.procesarAtaqueCuchillo();
    console.log(`🔪 [main.js] Animación TPS de ataque de cuchillo iniciada para jugador ${data.attackerId}`);
  });
  
  // Damage dealt notification (when local player hits someone)
  connection.onDamageDealt((data) => {
    mostrarDañoCausado(data.damage);
  });
  
  // Player healing notification (when another player heals)
  // Requirements: 5.1, 5.2 - Show JuiceBox and healing animation on remote players
  connection.onPlayerHealing((data) => {
    console.log(`🧃 [main.js] Evento playerHealing recibido:`, data);
    
    if (!data || !data.playerId) {
      console.warn('🧃 [main.js] Datos de curación inválidos');
      return;
    }
    
    // No procesar si es el jugador local
    if (data.playerId === localPlayerId) {
      return;
    }
    
    // Buscar el jugador remoto
    const remotePlayer = remotePlayerManager.getPlayer(data.playerId);
    if (!remotePlayer) {
      console.warn(`🧃 [main.js] Jugador remoto no encontrado: ${data.playerId}`);
      return;
    }
    
    // Llamar a procesarCuracion en el jugador remoto
    // Requirements: 5.1, 5.2, 5.3 - Mostrar JuiceBox y animación healt
    remotePlayer.procesarCuracion(data.healing);
    console.log(`🧃 [main.js] Curación ${data.healing ? 'iniciada' : 'terminada'} para jugador ${data.playerId}`);
  });
  
  // Connection error (Requirement 2.3)
  connection.onError((error) => {
    console.error('Connection error:', error);
    mostrarMensajeConexion('Error de conexión', true);
  });
  
  // Disconnection
  connection.onDisconnect(() => {
    isMultiplayerConnected = false;
    localPlayerId = null;
    
    // Actualizar chat a modo local
    if (chatSystem) {
      chatSystem.setMode(false, nombreJugadorActual || 'Jugador');
    }
    
    // Liberar pointer lock para que el click funcione en el overlay
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    mostrarMensajeConexion('Desconectado del servidor. Click para reconectar.', true);
    
    // Clear remote players
    if (remotePlayerManager) {
      remotePlayerManager.clear();
    }
  });
}

/**
 * Process game state update from server
 * @param {Object} gameState - Game state from server
 */
function procesarEstadoJuego(gameState) {
  if (!gameState || !gameState.players) return;
  
  // Update remote players
  remotePlayerManager.updatePlayers(gameState);
  
  // Actualizar scoreboard si viene en el estado
  // Requirements: 5.1, 5.2 - Procesar scoreboard al recibir estado
  if (gameState.scoreboard && Array.isArray(gameState.scoreboard)) {
    actualizarScoreboard(gameState.scoreboard);
  }
  
  // Find and apply local player state
  const localPlayerState = gameState.players.find(p => p.id === localPlayerId);
  if (localPlayerState) {
    // Apply server state to local player (with reconciliation)
    aplicarEstadoServidor(localPlayerState);
    
    // Update weapon state from server
    actualizarArmaDesdeServidor(localPlayerState);
    
    // Update dash state from server
    actualizarDashDesdeServidor(localPlayerState);
    
    // Update health bar UI
    actualizarBarraVida(localPlayerState.health, localPlayerState.maxHealth || 200);
    
    // Update UI
    actualizarDisplayMunicion();
    actualizarRecargaDash();
  }
}

/**
 * Inicializa el sistema de armas según el modo de juego
 * Modo local: todas las armas con munición infinita
 * Modo online: solo el arma seleccionada
 */
async function inicializarArmaInicial() {
  if (modoJuegoActual === 'local') {
    console.log('🎮 Modo local: Inicializando todas las armas con munición infinita');
    await inicializarTodasLasArmasLocal();
  } else {
    // Modo online: comportamiento original
    const armaSeleccionada = armaSeleccionadaParaPartida || 'M4A1';
    console.log(`🔫 Modo online: Cargando arma seleccionada: ${armaSeleccionada}...`);
    
    try {
      establecerArmaUnica(armaSeleccionada, weaponContainer);
      console.log(`✅ Arma ${armaSeleccionada} equipada como única en inventario`);
      
      // Sincronizar con el servidor si estamos conectados
      if (isMultiplayerConnected && inputSender) {
        inputSender.sendWeaponChange(armaSeleccionada);
        console.log(`🔫 Arma sincronizada con servidor: ${armaSeleccionada}`);
      }
    } catch (error) {
      console.error('❌ Error equipando arma seleccionada:', error);
      establecerArmaUnica('M4A1', weaponContainer);
    }
  }
  
  // Marcar que la partida ha iniciado
  iniciarPartidaSeleccion();
  
  // Actualizar UI inicial
  const estadoInicial = obtenerEstado();
  actualizarInfoArma(estadoInicial);
  
  // Actualizar crosshair según el tipo de arma
  const tipoArma = estadoInicial.tipoActual || 'M4A1';
  establecerTipoArma(CONFIG.armas[tipoArma].tipo);
}

/**
 * Maneja la muerte del jugador en modo local por bots
 */
function manejarMuerteLocalPorBot() {
  console.log('💀 Manejando muerte en modo local por bot');
  
  // Mostrar pantalla de muerte simple
  mostrarPantallaMuerte('Bot Tirador', 3000);
  
  // Auto-respawn después de 3 segundos con todas las armas
  setTimeout(() => {
    console.log('🔄 Modo local: Respawneando con todas las armas');
    
    // Restaurar vida completa
    jugador.health = jugador.maxHealth || 200;
    
    // Ocultar pantalla de muerte
    ocultarPantallaMuerte();
    
    // Actualizar UI de vida
    actualizarBarraVida(jugador.health, jugador.maxHealth || 200);
    
    // Reconfigurar munición infinita
    configurarMunicionInfinita();
    
    // Activar pointer lock
    document.body.requestPointerLock();
    
    // Registrar muerte para estadísticas
    registrarDeath();
    
    console.log('✅ Jugador respawneado en modo local con todas las armas');
  }, 3000);
}

/**
 * Inicializa todas las armas para modo local con munición infinita
 */
async function inicializarTodasLasArmasLocal() {
  console.log('🔫 Inicializando todas las armas para modo local...');
  
  // Agregar todas las armas al inventario en el orden correcto (sin MA41)
  // M4A1 debe estar primero para que corresponda con la tecla 1
  if (!inventarioArmas.armasDisponibles.includes('M4A1')) {
    agregarArma('M4A1');
  }
  agregarArma('AK47');
  agregarArma('PISTOLA');
  agregarArma('SNIPER');
  agregarArma('ESCOPETA');
  agregarArma('MP5');
  // MA41 removida - solo 6 armas ahora
  
  // Cambiar al arma inicial (M4A1) usando cambiarArma para configurar munición correctamente
  try {
    const exito = cambiarArma('M4A1', weaponContainer);
    if (exito) {
      console.log('✅ M4A1 equipada como arma inicial con munición infinita');
    } else {
      // Fallback: cargar solo el modelo
      await cambiarModeloArma('M4A1', weaponContainer);
      console.log('✅ Modelo M4A1 cargado como fallback');
    }
  } catch (error) {
    console.error('❌ Error cargando arma inicial:', error);
  }
  
  // Configurar munición infinita para modo local
  configurarMunicionInfinita();
  
  // Mostrar el orden final de las armas
  const estadoFinal = obtenerEstado();
  console.log('✅ Todas las armas inicializadas para modo local');
  console.log('🔫 Orden de armas:', estadoFinal.armasDisponibles);
}

/**
 * Configura munición infinita para todas las armas en modo local
 */
function configurarMunicionInfinita() {
  // Modificar el sistema de armas para munición infinita
  const estadoArmas = obtenerEstado();
  
  // Establecer munición infinita (∞) para todas las armas
  if (typeof arma !== 'undefined' && arma) {
    arma.municionTotal = Infinity;
    console.log(`🔫 Munición infinita configurada: ${arma.municionActual}/∞`);
  }
}

/**
 * Carga las demás armas en background (lazy loading)
 * Nota: Con el nuevo sistema de arma única, esto solo cachea modelos para futuros respawns
 */
async function cargarArmasEnBackground() {
  console.log('🔄 Cargando armas adicionales en background...');
  
  const armasACargar = ['M4A1', 'PISTOLA', 'AK47', 'SNIPER', 'ESCOPETA', 'MP5', 'SCAR'];
  
  for (const tipoArma of armasACargar) {
    try {
      // Cargar modelo sin mostrarlo (solo cachear)
      await cargarModeloArma(tipoArma, weaponContainer);
      console.log(`✅ ${tipoArma} cargada en background`);
    } catch (error) {
      console.warn(`⚠️ Error cargando ${tipoArma}:`, error);
    }
    
    // Pequeña pausa entre cargas para no saturar
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('✅ Todas las armas cargadas');
}

/**
 * Inicializa el sistema de armas con armas adicionales
 * @deprecated Usar inicializarArmaInicial + cargarArmasEnBackground
 */
async function inicializarSistemaArmas() {
  console.log('🔫 Inicializando sistema de armas...');
  
  // Agregar armas al inventario (el jugador empieza con M4A1)
  agregarArma('PISTOLA');
  agregarArma('AK47');
  agregarArma('SNIPER');
  agregarArma('ESCOPETA');
  agregarArma('MP5');
  agregarArma('SCAR');
  
  // Cargar modelo inicial (M4A1) - usar cambiarModeloArma para que se agregue al contenedor
  try {
    await cambiarModeloArma('M4A1', weaponContainer);
    console.log('✅ Modelo inicial cargado');
  } catch (error) {
    console.error('❌ Error cargando modelo inicial:', error);
  }
  
  // Actualizar UI inicial
  const estadoInicial = obtenerEstado();
  actualizarInfoArma(estadoInicial);
  
  console.log('🎮 Armas disponibles:', estadoInicial.armasDisponibles);
  console.log('🔫 Arma actual:', estadoInicial.nombre);
}

/**
 * Maneja el intercambio de cuchillo con tecla Q
 * Requirements: 2.1, 2.2 - Intercambio rápido con tecla Q
 */
async function manejarAlternarCuchillo() {
  // No permitir cambio durante recarga
  if (arma.estaRecargando) {
    console.log('🔪 No se puede cambiar durante recarga');
    return;
  }

  // Check if healing was in progress before weapon change
  const wasHealing = estaCurando();

  // Usar alternarCuchillo para intercambiar entre cuchillo y arma principal
  const exito = await alternarCuchillo(weaponContainer);
  
  if (exito) {
    const estado = obtenerEstado();
    mostrarCambioArma(estado.nombre);
    actualizarInfoArma(estado);
    actualizarDisplayMunicion();
    
    // Actualizar crosshair dinámico
    const configArma = CONFIG.armas[estado.tipoActual];
    if (configArma) {
      establecerTipoArma(configArma.tipo);
    }
    
    // Notificar al servidor del cambio de arma
    if (isMultiplayerConnected) {
      // If healing was cancelled by weapon change, notify server
      // Requirements: 5.1 - Notify server when healing is cancelled
      if (wasHealing) {
        inputSender.sendHealCancel();
      }
      inputSender.sendWeaponChange(estado.tipoActual);
    }
    console.log(`🔄 Cambiado a: ${estado.nombre}`);
  }
}

/**
 * Maneja el equipamiento del JuiceBox con tecla C
 * Requirements: 1.1 - Equipar JuiceBox presionando tecla C
 */
async function manejarAlternarJuiceBox() {
  // No permitir cambio durante recarga
  if (arma.estaRecargando) {
    console.log('🧃 No se puede cambiar durante recarga');
    return;
  }

  // Check if healing was in progress before toggling JuiceBox
  const wasHealing = estaCurando();

  // Usar alternarJuiceBox para intercambiar entre JuiceBox y arma/cuchillo
  const exito = await alternarJuiceBox(weaponContainer);
  
  if (exito) {
    const estado = obtenerEstado();
    
    // Si el JuiceBox está equipado, mostrar mensaje especial
    if (esJuiceBoxEquipado()) {
      mostrarCambioArma('Botiquín');
      // Actualizar crosshair para JuiceBox (sin crosshair o crosshair especial)
      establecerTipoArma('melee'); // Usar tipo melee para ocultar crosshair de disparo
    } else {
      mostrarCambioArma(estado.nombre);
      // Actualizar crosshair dinámico
      const configArma = CONFIG.armas[estado.tipoActual];
      if (configArma) {
        establecerTipoArma(configArma.tipo);
      }
    }
    
    actualizarInfoArma(estado);
    actualizarDisplayMunicion();
    
    // Notificar al servidor del cambio de equipamiento
    if (isMultiplayerConnected) {
      // If healing was cancelled by toggling JuiceBox off, notify server
      // Requirements: 5.1 - Notify server when healing is cancelled
      if (wasHealing && !esJuiceBoxEquipado()) {
        inputSender.sendHealCancel();
      }
      inputSender.sendWeaponChange(esJuiceBoxEquipado() ? 'JUICEBOX' : estado.tipoActual);
    }
    console.log(`🔄 Cambiado a: ${esJuiceBoxEquipado() ? 'Botiquín' : estado.nombre}`);
  }
}

/**
 * Maneja el cambio a la siguiente arma con rueda del mouse
 */
function manejarSiguienteArmaRueda() {
  // Verificar si el cambio de arma está permitido
  if (!cambioArmaPermitido()) {
    console.log('🔫 Cambio de arma no permitido en modo online durante partida');
    return;
  }
  
  // Check if healing was in progress before weapon change
  const wasHealing = estaCurando();
  
  siguienteArma(weaponContainer);
  const estado = obtenerEstado();
  mostrarCambioArma(estado.nombre);
  actualizarInfoArma(estado);
  actualizarDisplayMunicion();
  
  // Actualizar selector de armas local
  actualizarSelectorArmaActiva();
  
  // Actualizar crosshair dinámico
  const configArma = CONFIG.armas[estado.tipoActual];
  if (configArma) {
    establecerTipoArma(configArma.tipo);
  }
  
  // Notificar al servidor del cambio de arma
  if (isMultiplayerConnected) {
    // If healing was cancelled by weapon change, notify server
    // Requirements: 5.1 - Notify server when healing is cancelled
    if (wasHealing) {
      inputSender.sendHealCancel();
    }
    inputSender.sendWeaponChange(estado.tipoActual);
  }
  console.log(`🔄 Cambiado a: ${estado.nombre}`);
}

/**
 * Maneja el cambio a la arma anterior
 */
function manejarArmaAnterior() {
  // Verificar si el cambio de arma está permitido
  if (!cambioArmaPermitido()) {
    console.log('🔫 Cambio de arma no permitido en modo online durante partida');
    return;
  }
  
  // Check if healing was in progress before weapon change
  const wasHealing = estaCurando();
  
  armaAnterior(weaponContainer);
  const estado = obtenerEstado();
  mostrarCambioArma(estado.nombre);
  actualizarInfoArma(estado);
  actualizarDisplayMunicion();
  
  // Actualizar selector de armas local
  actualizarSelectorArmaActiva();
  
  // Actualizar crosshair dinámico
  establecerTipoArma(CONFIG.armas[estado.tipoActual].tipo);
  
  // Notificar al servidor del cambio de arma
  if (isMultiplayerConnected) {
    // If healing was cancelled by weapon change, notify server
    // Requirements: 5.1 - Notify server when healing is cancelled
    if (wasHealing) {
      inputSender.sendHealCancel();
    }
    inputSender.sendWeaponChange(estado.tipoActual);
  }
  console.log(`🔄 Cambiado a: ${estado.nombre}`);
}

/**
 * Maneja la selección directa de arma por número
 * @param {number} indice - Índice del arma a seleccionar
 */
function manejarSeleccionarArma(indice) {
  // Verificar si el cambio de arma está permitido
  if (!cambioArmaPermitido()) {
    console.log('🔫 Cambio de arma no permitido en modo online durante partida');
    return;
  }
  
  // Check if healing was in progress before weapon change
  const wasHealing = estaCurando();
  
  const estado = obtenerEstado();
  if (indice < estado.armasDisponibles.length) {
    const tipoArma = estado.armasDisponibles[indice];
    if (cambiarArma(tipoArma, weaponContainer)) {
      const nuevoEstado = obtenerEstado();
      mostrarCambioArma(nuevoEstado.nombre);
      actualizarInfoArma(nuevoEstado);
      actualizarDisplayMunicion();
      
      // Actualizar selector de armas local
      actualizarSelectorArmaActiva();
      
      // Notificar al servidor del cambio de arma
      if (isMultiplayerConnected) {
        // If healing was cancelled by weapon change, notify server
        // Requirements: 5.1 - Notify server when healing is cancelled
        if (wasHealing) {
          inputSender.sendHealCancel();
        }
        inputSender.sendWeaponChange(nuevoEstado.tipoActual);
      }
      console.log(`🎯 Seleccionado: ${nuevoEstado.nombre}`);
    }
  }
}

/**
 * Maneja el apuntado del arma
 * @param {boolean} apuntar - true para apuntar, false para dejar de apuntar
 */
function manejarApuntado(apuntar) {
  alternarApuntado(apuntar);
  const estado = obtenerEstado();
  actualizarInfoArma(estado);
  
  if (apuntar) {
    console.log(`Apuntando con ${estado.nombre}`);
  } else {
    console.log(`Dejando de apuntar con ${estado.nombre}`);
  }
}

/**
 * Maneja la pausa del juego
 */
function manejarPausar() {
  // No pausar si hay overlay de conexión visible
  const connectionOverlay = document.getElementById('connection-overlay');
  if (connectionOverlay && connectionOverlay.style.display !== 'none') {
    return;
  }

  try {
    alternarMenuPausa();
  } catch (error) {
    console.warn('⚠️ Error al alternar menú de pausa:', error);
  }
}
/**
 * Maneja el evento de recarga
 * Requirement 6.1: Send reload input to server
 */
function manejarRecarga() {
  if (isMultiplayerConnected) {
    inputSender.sendReload();
  } else {
    recargar(() => {
      actualizarDisplayMunicion();
    });
  }
  actualizarDisplayMunicion();
}

/**
 * Maneja el evento de dash
 * Requirement 7.1: Send dash input to server
 * Requirements: 1.1, 1.4, 5.1 - Dash interpolado con envío de posición final
 */
function manejarDash() {
  if (isMultiplayerConnected) {
    // Verificar si hay cargas disponibles localmente antes de enviar al servidor
    if (sistemaDash.cargasActuales <= 0 || sistemaDash.dashEnProgreso) {
      return;
    }
    
    // Calculate dash direction
    const direccion = calcularDireccionDash();
    
    // Guardar posición inicial antes del dash
    const posicionInicial = {
      x: jugador.posicion.x,
      y: jugador.posicion.y,
      z: jugador.posicion.z
    };
    
    // Calcular posición final usando el sistema de dash interpolado
    // Requirements: 2.1, 2.2, 3.1 - Ignorar colisiones internas, respetar límites
    const distanciaDash = CONFIG.dash.poder;
    const posicionFinal = calcularPosicionFinalDash(
      jugador.posicion,
      { x: direccion.x, y: direccion.y, z: direccion.z },
      distanciaDash
    );
    
    // Ejecutar dash interpolado localmente para predicción suave
    // Requirements: 1.1, 1.4 - Interpolación suave del dash
    ejecutarDashInterpolado(jugador, teclas, (dir, posFin) => {
      crearEfectoDash(jugador.posicion, scene);
    });
    
    // Marcar inicio de dash para evitar reconciliación brusca
    marcarInicioDash();
    
    // Send dash input to server con posiciones
    // Requirements: 5.1 - Enviar posición final calculada al servidor
    inputSender.sendDash(direccion, posicionInicial, {
      x: posicionFinal.x,
      y: posicionFinal.y,
      z: posicionFinal.z
    });
  } else {
    // Modo local - usar dash interpolado
    // Requirements: 1.1, 1.4 - Interpolación suave del dash
    ejecutarDashInterpolado(jugador, teclas, (direccion, posFin) => {
      crearEfectoDash(jugador.posicion, scene);
    });
  }
  actualizarRecargaDash();
}

/**
 * Calculate dash direction based on current keys and rotation
 */
function calcularDireccionDash() {
  const direccion = new THREE.Vector3();
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

  if (teclas['KeyW']) direccion.add(forward);
  if (teclas['KeyS']) direccion.sub(forward);
  if (teclas['KeyA']) direccion.sub(right);
  if (teclas['KeyD']) direccion.add(right);

  if (direccion.length() === 0) {
    direccion.copy(forward);
  }

  direccion.normalize();
  
  return {
    x: direccion.x,
    y: direccion.y,
    z: direccion.z
  };
}

/**
 * Verifica si una bala impacta algún bot de entrenamiento
 * Requirement 1.4: Registrar impacto y actualizar barra de vida del bot
 * 
 * @param {Bala} bala - La bala a verificar
 * @param {Array<BotBase>} bots - Array de bots vivos
 * @returns {BotBase|null} - El bot impactado o null si no hubo impacto
 */
function verificarImpactoBots(bala, bots) {
  if (bala.haImpactado) return null;

  const posicionBala = bala.mesh.position;

  for (const bot of bots) {
    if (!bot.estaVivo()) continue;

    // Verificar colisión con la hitbox del bot
    const hitbox = bot.obtenerHitbox();
    if (!hitbox) continue;

    // Obtener posición mundial de la hitbox
    const hitboxWorldPos = new THREE.Vector3();
    hitbox.getWorldPosition(hitboxWorldPos);

    // Calcular distancia entre bala y centro de hitbox
    const distancia = posicionBala.distanceTo(hitboxWorldPos);

    // Radio de colisión aproximado (diagonal de la hitbox / 2)
    const radioColision = 1.5; // Aproximación basada en hitbox 1.4 x 2.0 x 1.2

    if (distancia < radioColision) {
      bala.haImpactado = true;
      
      // Aplicar daño al bot
      const daño = bala.dañoBala || 33; // Daño por defecto si no está definido
      bot.recibirDaño(daño);
      
      // Mostrar indicador de daño en pantalla (igual que modo online)
      mostrarDañoCausado(daño);
      
      console.log(`🎯 Bala impactó bot ${bot.tipo} - Daño: ${daño}`);
      
      // Crear efecto de impacto
      bala.crearEfectoImpacto(bala.mesh.position);
      
      return bot;
    }
  }

  return null;
}

/**
 * Obtiene el fireRate del servidor para un tipo de arma específico
 * Esto asegura que el modo local use exactamente los mismos valores que el modo online
 * 
 * Los valores están sincronizados con server/config.js WEAPON_CONFIG
 * @param {string} tipoArma - Tipo de arma (M4A1, AK47, PISTOLA, etc.)
 * @returns {number} - Tiempo entre disparos en milisegundos
 */
function obtenerFireRateServidor(tipoArma) {
  // Valores de fireRate del servidor (server/config.js WEAPON_CONFIG)
  // Estos valores son la ÚNICA fuente de verdad para la cadencia de disparo
  const fireRatesServidor = {
    'M4A1': 75,      // 800 RPM (60000/75)
    'AK47': 109,     // 550 RPM (60000/109)
    'PISTOLA': 150,  // 400 RPM (60000/150)
    'SNIPER': 1333,  // 45 RPM (60000/1333)
    'ESCOPETA': 857, // 70 RPM (60000/857)
    'MP5': 71,       // 850 RPM (60000/71)
    'KNIFE': 350,    // Cadencia de ataque melee
    'default': 75    // Fallback igual a M4A1
  };
  
  return fireRatesServidor[tipoArma] || fireRatesServidor['default'];
}

/**
 * Procesa un disparo en modo local
 * Usa la misma lógica que el modo online para garantizar comportamiento idéntico
 * 
 * @param {THREE.Camera} camera - Cámara del jugador
 * @param {Array} balas - Array de balas activas
 * @param {THREE.Scene} scene - Escena de Three.js
 * @param {Object} configArma - Configuración del arma actual
 * @returns {boolean} - true si se disparó exitosamente
 */
function dispararLocal(camera, balas, scene, configArma) {
  // Verificar munición
  if (arma.municionActual <= 0) {
    return false;
  }
  
  // Decrementar munición
  arma.municionActual--;
  
  // Calcular posición inicial de la bala
  const posicionBala = camera.position.clone();
  const offsetAdelante = new THREE.Vector3(0, 0, -1);
  offsetAdelante.applyQuaternion(camera.quaternion);
  posicionBala.add(offsetAdelante);
  
  // Obtener estado de apuntado
  const estadoArma = obtenerEstado();
  
  // Para escopetas, disparar múltiples proyectiles
  const numProyectiles = configArma.proyectiles || 1;
  let dispersionArma = configArma.dispersion || 0;
  
  // Aplicar dispersión sin mira para francotiradores (sniper)
  if (!estadoArma.estaApuntando && configArma.dispersionSinMira) {
    dispersionArma = configArma.dispersionSinMira;
  }
  // Si está apuntando y tiene reduccionDispersion, aplicarla
  else if (estadoArma.estaApuntando && configArma.apuntado && configArma.apuntado.reduccionDispersion) {
    dispersionArma *= configArma.apuntado.reduccionDispersion;
  }
  
  // Obtener dispersión por retroceso acumulado
  const dispersionRetroceso = obtenerDispersionRetroceso();
  
  for (let i = 0; i < numProyectiles; i++) {
    // Calcular dirección de la bala con dispersión
    const direccion = new THREE.Vector3(0, 0, -1);
    direccion.applyQuaternion(camera.quaternion);
    
    // Aplicar dispersión del arma + dispersión por retroceso
    const dispersionTotal = dispersionArma + dispersionRetroceso;
    if (dispersionTotal > 0) {
      direccion.x += (Math.random() - 0.5) * dispersionTotal;
      direccion.y += (Math.random() - 0.5) * dispersionTotal;
    }
    
    direccion.normalize();
    
    // Crear la bala con la configuración del arma actual
    const bala = new Bala(scene, posicionBala.clone(), direccion, null, {
      velocidad: configArma.velocidadBala,
      daño: configArma.daño
    });
    balas.push(bala);
  }
  
  // Animar retroceso del arma
  animarRetroceso();
  
  return true;
}

/**
 * Maneja el evento de disparo
 * Requirement 5.1: Send shoot input to server
 * Requirement 3.1: Si JuiceBox equipado, iniciar curación en lugar de disparar
 */
function manejarDisparo() {
  console.log('🔫 manejarDisparo llamado');
  
  // No disparar si hay overlay de conexión visible
  const connectionOverlay = document.getElementById('connection-overlay');
  if (connectionOverlay && connectionOverlay.style.display !== 'none') {
    return;
  }

  // Verificar si el JuiceBox está equipado - iniciar curación
  // Requirements: 3.1 - Iniciar curación al hacer clic con JuiceBox equipado
  if (esJuiceBoxEquipado()) {
    console.log('🧃 JuiceBox equipado - Iniciando curación');
    const curacionIniciada = iniciarCuracion();
    if (curacionIniciada) {
      console.log('🧃 Curación iniciada correctamente');
      // Notificar al servidor del inicio de curación
      if (isMultiplayerConnected && inputSender) {
        inputSender.sendHealStart();
      }
    }
    return;
  }

  // Verificar si el cuchillo está equipado - usar ataque melee
  const cuchilloEquipado = esCuchilloEquipado();
  console.log(`🔫 ¿Cuchillo equipado? ${cuchilloEquipado}`);
  
  if (cuchilloEquipado) {
    console.log('🔪 Redirigiendo a manejarAtaqueCuchillo');
    manejarAtaqueCuchillo();
    return;
  }

  if (isMultiplayerConnected) {
    // Verificar si podemos disparar localmente (para responsividad)
    if (arma.estaRecargando || arma.municionActual <= 0) {
      return;
    }
    
    // Obtener configuración del arma actual
    const estadoArma = obtenerEstado();
    const configArma = CONFIG.armas[estadoArma.tipoActual];
    
    // Verificar cadencia de disparo
    const ahora = performance.now();
    const tiempoEntreDisparos = (60 / configArma.cadenciaDisparo) * 1000;
    if (ahora - arma.ultimoDisparo < tiempoEntreDisparos) {
      return;
    }
    arma.ultimoDisparo = ahora;
    
    // Calcular posición y dirección de la bala
    const posicionBala = camera.position.clone();
    const offsetAdelante = new THREE.Vector3(0, 0, -1);
    offsetAdelante.applyQuaternion(camera.quaternion);
    posicionBala.add(offsetAdelante);

    const direccion = new THREE.Vector3(0, 0, -1);
    direccion.applyQuaternion(camera.quaternion);
    direccion.normalize();
    
    // Obtener dispersión por retroceso acumulado
    const dispersionRetroceso = obtenerDispersionRetroceso();
    
    // Enviar input de disparo al servidor con el tipo de arma y estado de apuntado
    inputSender.sendShoot(
      { x: posicionBala.x, y: posicionBala.y, z: posicionBala.z },
      { x: direccion.x, y: direccion.y, z: direccion.z },
      estadoArma.tipoActual,
      estadoArma.estaApuntando
    );
    
    // Registrar disparo para progreso
    registrarDisparoProgreso();
    
    // Actualizar estadísticas locales
    actualizarStatsLocales('shotsFired', 1);
    
    // Para escopetas, crear múltiples balas visuales
    const numProyectiles = configArma.proyectiles || 1;
    let dispersionArma = configArma.dispersion || 0;
    
    // Aplicar dispersión sin mira para francotiradores (sniper)
    // Si no está apuntando y tiene dispersionSinMira, usarla
    if (!estadoArma.estaApuntando && configArma.dispersionSinMira) {
      dispersionArma = configArma.dispersionSinMira;
    }
    // Si está apuntando y tiene reduccionDispersion, aplicarla
    else if (estadoArma.estaApuntando && configArma.apuntado && configArma.apuntado.reduccionDispersion) {
      dispersionArma *= configArma.apuntado.reduccionDispersion;
    }
    
    for (let i = 0; i < numProyectiles; i++) {
      const direccionBala = direccion.clone();
      
      // Aplicar dispersión del arma + dispersión por retroceso
      const dispersionTotal = dispersionArma + dispersionRetroceso;
      if (dispersionTotal > 0) {
        direccionBala.x += (Math.random() - 0.5) * dispersionTotal;
        direccionBala.y += (Math.random() - 0.5) * dispersionTotal;
        direccionBala.normalize();
      }
      
      // Crear bala visual local (predicción del cliente)
      const bala = new Bala(scene, posicionBala.clone(), direccionBala, null, {
        velocidad: configArma.velocidadBala,
        daño: configArma.daño
      });
      balas.push(bala);
    }
    
    // Animar retroceso del arma
    animarRetroceso();
    
    // Reproducir sonido de disparo usando el sistema de sonidos
    reproducirSonidoDisparo(estadoArma.tipoActual, configArma);
    
    // Actualizar UI de munición
    actualizarDisplayMunicion();
  } else {
    // Modo local - usar misma lógica de cadencia que modo online
    // para que el comportamiento sea idéntico
    if (arma.estaRecargando || arma.municionActual <= 0) {
      return;
    }
    
    const estadoArma = obtenerEstado();
    const configArma = CONFIG.armas[estadoArma.tipoActual];
    
    // Verificar cadencia de disparo usando fireRate del servidor (en ms)
    // Esto asegura que la cadencia sea idéntica al modo online
    const ahora = performance.now();
    // Usar los valores de fireRate del servidor directamente
    const fireRateMs = obtenerFireRateServidor(estadoArma.tipoActual);
    if (ahora - arma.ultimoDisparo < fireRateMs) {
      return;
    }
    arma.ultimoDisparo = ahora;
    
    // Procesar disparo local
    const disparo = dispararLocal(camera, balas, scene, configArma);
    
    if (disparo) {
      // Registrar disparo para progreso
      registrarDisparoProgreso();
      
      // Actualizar estadísticas locales
      actualizarStatsLocales('shotsFired', 1);
      
      reproducirSonidoDisparo(estadoArma.tipoActual, configArma);
      actualizarDisplayMunicion();
      
      // Registrar disparo para estadísticas de entrenamiento
      if (botManager) {
        botManager.registrarDisparo();
      }
    }
  }
}

/**
 * Maneja el ataque con cuchillo
 * Detecta enemigos en rango y aplica daño
 */
function manejarAtaqueCuchillo() {
  console.log('🔪 === INICIANDO ATAQUE CON CUCHILLO ===');
  
  // En modo multijugador, enviar ataque al servidor primero
  if (isMultiplayerConnected && inputSender) {
    console.log('🔪 Enviando ataque al servidor (multijugador)');
    inputSender.sendMeleeAttack({
      posicion: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      direccion: { 
        x: -Math.sin(jugador.rotacionY), 
        y: 0, 
        z: -Math.cos(jugador.rotacionY) 
      }
    });
  }

  // Obtener lista de enemigos (bots en modo local, jugadores remotos en multijugador)
  let enemigos = [];
  
  if (isMultiplayerConnected && remotePlayerManager) {
    // Modo multijugador: obtener jugadores remotos
    const playersMap = remotePlayerManager.getAllPlayers();
    if (playersMap && playersMap.size > 0) {
      enemigos = Array.from(playersMap.values());
    }
    console.log(`🔪 Modo multijugador - Jugadores remotos: ${enemigos.length}`);
  } else if (botManager) {
    // Modo local: obtener bots
    enemigos = botManager.obtenerBots ? botManager.obtenerBots() : [];
    console.log(`🔪 Modo local - Bots disponibles: ${enemigos.length}`);
  } else {
    console.log('🔪 No hay botManager ni remotePlayerManager');
  }
  
  // Ejecutar ataque con cuchillo (en modo local aplica daño, en multijugador es solo visual)
  const resultado = atacarConCuchillo(camera, enemigos, scene, (impacto) => {
    // Callback cuando el cuchillo impacta
    console.log(`🔪 ¡IMPACTO DE CUCHILLO!:`, impacto);
    
    // Mostrar indicador de daño causado
    if (impacto.daño) {
      mostrarDañoCausado(impacto.daño);
    }
    
    // Registrar impacto para estadísticas (solo modo local)
    if (!isMultiplayerConnected && botManager && impacto.enemigo) {
      botManager.registrarImpacto();
      
      // Si el bot murió, registrar eliminación
      if (impacto.enemigo.datos && impacto.enemigo.datos.vidaActual <= 0) {
        botManager.registrarEliminacion(impacto.enemigo);
      }
    }
  });
  
  console.log(`🔪 Resultado ataque - Impactos: ${resultado.enemigosGolpeados.length}`);
}

/**
 * Maneja el evento de salto
 */
function manejarSalto() {
  saltar();
}

/**
 * Maneja el movimiento del mouse
 * @param {number} movimientoX - Movimiento horizontal
 * @param {number} movimientoY - Movimiento vertical
 */
function manejarMovimientoMouse(movimientoX, movimientoY) {
  actualizarRotacion(movimientoX, movimientoY);
}

/**
 * Send movement input to server
 * Requirement 4.1: Send movement input to server
 */
function enviarInputMovimiento() {
  if (!isMultiplayerConnected) return;
  
  // No enviar movimiento si el jugador está muerto
  if (!jugador.isAlive) return;
  
  const ahora = performance.now();
  if (ahora - lastInputSendTime < INPUT_SEND_RATE) return;
  
  lastInputSendTime = ahora;
  
  // Convert teclas object to expected format
  const keys = {
    w: !!teclas['KeyW'],
    a: !!teclas['KeyA'],
    s: !!teclas['KeyS'],
    d: !!teclas['KeyD'],
    space: !!teclas['Space']
  };
  
  const rotation = {
    x: jugador.rotacion.x,
    y: jugador.rotacion.y
  };
  
  // Incluir posición del jugador para sincronización
  const position = {
    x: jugador.posicion.x,
    y: jugador.posicion.y,
    z: jugador.posicion.z
  };
  
  // Obtener estado de apuntado
  const estadoArma = obtenerEstado();
  const apuntando = estadoArma.estaApuntando || false;
  
  inputSender.sendMovement(keys, rotation, position, apuntando);
}

/**
 * Actualiza el display de munición en la UI
 */
function actualizarDisplayMunicion() {
  const estado = obtenerEstado();
  actualizarInfoArma(estado);
}

/**
 * OLD actualizarDisplayDash - DEPRECATED
 * Now using actualizarDashBox from dash.js which is called in actualizarRecargaDash
 * Keeping commented for reference
 */
/*
function actualizarDisplayDash() {
  // Buscar el contenedor de dash
  const dashContainer = document.getElementById('dash-charges');
  if (!dashContainer) return;
  
  // Buscar iconos dentro del contenedor de dash-icons (nuevo diseño)
  const iconsContainer = dashContainer.querySelector('.dash-icons-container');
  const icons = iconsContainer 
    ? iconsContainer.querySelectorAll('.dash-icon') 
    : dashContainer.querySelectorAll('.dash-icon');
  
  if (!icons.length) return;

  for (let i = 0; i < icons.length; i++) {
    const icon = icons[i];
    
    // Remover todas las clases de estado primero
    icon.classList.remove('recharging', 'empty');
    
    // Requirements: 2.8 - Indicador verde brillante cuando carga disponible
    if (i < sistemaDash.cargasActuales) {
      // Carga disponible - estado base (verde brillante)
      // No se necesita clase adicional, el estilo base es verde
    }
    // Requirements: 2.7 - Indicador de progreso cuando se está recargando
    else if (sistemaDash.cargasRecargando && sistemaDash.cargasRecargando[i]) {
      icon.classList.add('recharging');
    }
    // Requirements: 2.6 - Indicador vacío cuando no está disponible
    else {
      icon.classList.add('empty');
    }
  }
}
*/

/**
 * Bucle principal del juego
 */
function bucleJuego() {
  requestAnimationFrame(bucleJuego);

  // Calcular delta time
  const tiempoActual = performance.now();
  const deltaTime = (tiempoActual - ultimoTiempo) / 1000;
  ultimoTiempo = tiempoActual;

  // Actualizar tiempo de juego para progreso (solo cuando el juego está activo)
  if (juegoIniciado && !menuActivo) {
    tiempoJuegoAcumulado += deltaTime;
    
    // Actualizar progreso cada 10 segundos
    if (tiempoActual - ultimoTiempoProgreso > 10000) {
      const tiempoSegundos = Math.floor(tiempoJuegoAcumulado);
      actualizarTiempoJugado(tiempoSegundos);
      
      // Actualizar tiempo local para usuarios no autenticados
      actualizarStatsLocales('playtime', tiempoSegundos);
      
      tiempoJuegoAcumulado = 0;
      ultimoTiempoProgreso = tiempoActual;
    }
  }

  // No actualizar el juego si el menú de pausa está activo
  try {
    menuActivo = estaMenuActivo();
  } catch (error) {
    // Si hay error con el menú, continuar normalmente
    menuActivo = false;
  }
  
  if (!menuActivo) {
    // Update local systems (for prediction/responsiveness)
    if (!isMultiplayerConnected) {
      // Only update dash recharge locally when not connected
      // actualizarDashBox is now called inside actualizarRecargaDash
      actualizarRecargaDash();
    }
    // OLD: actualizarDisplayDash() - now using actualizarDashBox from dash.js
    
    // Actualizar interpolación del dash si está en progreso
    // Requirements: 1.2 - Actualizar posición del jugador en cada frame durante dash
    actualizarDashInterpolacion(jugador, deltaTime * 1000);
    
    // Actualizar retroceso acumulado (se reduce con el tiempo)
    actualizarRetroceso();

    // Actualizar sistema de curación
    // Requirements: 3.2 - Actualizar curación cada frame y aplicar cuando se complete
    if (estaCurando()) {
      const resultadoCuracion = actualizarCuracion(jugador);
      if (resultadoCuracion.completada) {
        // Actualizar barra de vida con la nueva vida (jugador usa health/maxHealth)
        actualizarBarraVida(jugador.health || jugador.vida || jugador.vidaActual, jugador.maxHealth || jugador.vidaMaxima || 200);
        
        // Emitir evento de curación completada al servidor si está conectado
        if (isMultiplayerConnected && inputSender) {
          inputSender.sendHealComplete(resultadoCuracion.vidaCurada);
        }
      }
      // Actualizar UI de progreso de curación
      actualizarBarraCuracion(obtenerProgresoCuracion());
      
      // Requirements: 5.4, 5.5, 5.6 - Actualizar Heal Box UI durante curación
      actualizarHealBox({
        puedeUsarse: false,
        enCooldown: true
      });
    } else {
      // Ocultar barra de curación si no está curando
      ocultarBarraCuracion();
      
      // Requirements: 5.4, 5.5 - Actualizar Heal Box UI cuando no está curando
      // Verificar si puede curarse (vida no llena)
      const vidaActual = jugador.health || jugador.vida || jugador.vidaActual || 0;
      const vidaMaxima = jugador.maxHealth || jugador.vidaMaxima || 200;
      const puedeUsarse = vidaActual < vidaMaxima;
      
      actualizarHealBox({
        puedeUsarse: puedeUsarse,
        enCooldown: false
      });
    }

    // Disparo automático si el mouse está presionado (solo para armas automáticas)
    if (estaMousePresionado() && estaPointerLockActivo()) {
      const estadoArma = obtenerEstado();
      const configArma = CONFIG.armas[estadoArma.tipoActual];
      
      // Solo disparar automáticamente si el arma NO es semiautomática
      if (!configArma.semiAutomatica) {
        manejarDisparo();
      }
    }

    // Update local movement (for prediction)
    actualizarMovimiento(teclas);

    // Apply gravity locally (for prediction)
    aplicarGravedad();

    // Send movement input to server (Requirement 4.1)
    enviarInputMovimiento();

    // Interpolate remote players (Requirement 2.5)
    if (remotePlayerManager) {
      remotePlayerManager.interpolate(deltaTime);
    }

    // Update local bullets (for visual feedback)
    for (let i = balas.length - 1; i >= 0; i--) {
      const bala = balas[i];
      
      // Verificar colisión con bots de entrenamiento (solo en modo local)
      // Requirement 1.4: Registrar impacto y actualizar barra de vida del bot
      if (botManager && modoJuegoActual === 'local' && !bala.haImpactado) {
        const botsVivos = botManager.obtenerBotsVivos();
        const botImpactado = verificarImpactoBots(bala, botsVivos);
        if (botImpactado) {
          // Registrar acierto
          botManager.registrarAcierto();
          
          // Verificar si el bot murió
          if (!botImpactado.estaVivo()) {
            botManager.registrarEliminacion(botImpactado.obtenerTipo());
          }
          
          bala.destruir();
          balas.splice(i, 1);
          continue;
        }
      }
      
      if (!bala.actualizar(deltaTime)) {
        bala.destruir();
        balas.splice(i, 1);
      }
    }

    // Actualizar sistema de bots de entrenamiento (solo en modo local)
    // Requirements: 1.1, 2.1, 3.1, 4.4
    if (botManager && modoJuegoActual === 'local') {
      botManager.actualizar(deltaTime * 1000, jugador.posicion);
    }

    // Actualizar sistema de spawns de munición
    // Requirements: 5.1, 5.2, 5.3
    actualizarAmmoSpawns(deltaTime);

    // Sincronizar cámara con jugador
    sincronizarCamara(camera);
  }

  // 🔥 OBLIGATORIO - Renderizar SIEMPRE (incluso cuando está pausado)
  renderizar();
}

// Iniciar el juego cuando el DOM esté listo
inicializar();

/**
 * Función global para mostrar el menú de usuario
 * Puede ser llamada desde cualquier parte del juego
 */
window.abrirMenuUsuario = function() {
  try {
    const authState = obtenerEstadoAuth();
    let datosUsuario = {};
    
    if (authState.isAuthenticated) {
      // Usuario autenticado - usar datos del servidor
      const progreso = obtenerProgreso();
      datosUsuario = {
        username: authState.user.username,
        level: progreso?.progress?.level || 1,
        stats: progreso?.stats || {}
      };
    } else {
      // Usuario no autenticado - usar datos locales del localStorage
      const statsLocales = getStorageJSON('gameStats', {});
      const configLocal = getStorageJSON('gameConfig', {});
      
      // Calcular nivel basado en experiencia local
      const experiencia = statsLocales.experience || 0;
      const nivel = Math.floor(experiencia / 1000) + 1; // 1000 XP por nivel
      
      datosUsuario = {
        username: configLocal.playerName || 'Jugador Local',
        level: nivel,
        stats: {
          kills: statsLocales.kills || 0,
          deaths: statsLocales.deaths || 0,
          shotsFired: statsLocales.shotsFired || 0,
          shotsHit: statsLocales.shotsHit || 0,
          playtime: statsLocales.playtime || 0,
          experience: experiencia
        }
      };
    }
    
    mostrarMenuUsuario(datosUsuario);
  } catch (error) {
    console.error('Error abriendo menú de usuario:', error);
    
    // Fallback con datos mínimos
    mostrarMenuUsuario({
      username: 'Jugador',
      level: 1,
      stats: {}
    });
  }
};
