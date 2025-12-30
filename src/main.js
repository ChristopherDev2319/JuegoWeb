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
  renderizar 
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

// Arrays globales del juego
const balas = [];

// Modelo del arma
let modeloArma = null;

// Control de tiempo
let ultimoTiempo = performance.now();

/**
 * Lee la configuración guardada del juego
 */
function leerConfiguracionGuardada() {
  try {
    const configGuardada = localStorage.getItem('gameConfig');
    if (configGuardada) {
      const config = JSON.parse(configGuardada);
      CONFIG.red.habilitarMultijugador = config.multiplayerEnabled;
      
      console.log('📋 Configuración cargada:');
      console.log(`   Multijugador: ${config.multiplayerEnabled ? 'Habilitado' : 'Deshabilitado'}`);
      
      if (!config.multiplayerEnabled) {
        console.log('🎯 Modo local activado');
      }
    }
  } catch (error) {
    console.warn('No se pudo cargar la configuración guardada:', error);
  }
}

// Network state
let connection = null;
let inputSender = null;
let remotePlayerManager = null;
let isMultiplayerConnected = false;
let localPlayerId = null;

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
 * Inicializa el juego
 */
async function inicializar() {
  // Obtener referencias a elementos de carga
  loadingScreen = document.getElementById('loading-screen');
  loadingBar = document.getElementById('loading-bar');
  loadingText = document.getElementById('loading-text');

  actualizarCarga(10, 'Iniciando...');

  // Leer configuración guardada
  leerConfiguracionGuardada();

  actualizarCarga(20, 'Creando escena...');

  // Inicializar escena de Three.js
  inicializarEscena();

  // Inicializar jugador
  inicializarJugador();

  actualizarCarga(40, 'Cargando animaciones...');

  // Precargar animaciones para jugadores remotos (no bloquea)
  const animacionesPromise = precargarAnimaciones().catch(err => {
    console.warn('Error precargando animaciones:', err);
  });

  actualizarCarga(50, 'Cargando armas...');

  // Inicializar sistema de armas (incluye carga de modelos)
  await inicializarSistemaArmas();

  actualizarCarga(70, 'Configurando controles...');

  // Inicializar controles
  inicializarControles({
    onRecargar: manejarRecarga,
    onDash: manejarDash,
    onDisparar: manejarDisparo,
    onSaltar: manejarSalto,
    onMovimientoMouse: manejarMovimientoMouse,
    onSiguienteArma: manejarSiguienteArma,
    onArmaAnterior: manejarArmaAnterior,
    onSeleccionarArma: manejarSeleccionarArma,
    onApuntar: manejarApuntado
  });

  // Establecer referencia de cámara para el sistema de apuntado
  establecerCamara(camera);

  // Inicializar displays de UI
  actualizarDisplayMunicion();
  actualizarDisplayDash();

  actualizarCarga(85, 'Conectando al servidor...');

  // Initialize network connection (Requirement 2.1)
  await inicializarRed();

  // Esperar a que las animaciones terminen de cargar (máximo 2 segundos)
  await Promise.race([
    animacionesPromise,
    new Promise(resolve => setTimeout(resolve, 2000))
  ]);

  actualizarCarga(100, '¡Listo!');

  // Pequeña pausa para mostrar el 100%
  await new Promise(resolve => setTimeout(resolve, 300));

  // Ocultar pantalla de carga
  ocultarPantallaCarga();

  // Iniciar bucle del juego
  bucleJuego();
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
  
  connection = getConnection();
  inputSender = getInputSender();
  
  // Initialize remote player manager
  remotePlayerManager = initializeRemotePlayerManager(scene);
  
  // Set up event callbacks before connecting
  configurarCallbacksRed();
  
  // Get server URL (default to localhost:3000)
  const serverUrl = obtenerUrlServidor();
  
  let intentos = 0;
  const maxIntentos = CONFIG.red.reintentos;
  
  while (intentos < maxIntentos) {
    try {
      console.log(`Intento de conexión ${intentos + 1}/${maxIntentos} a ${serverUrl}`);
      await connection.connect(serverUrl);
      console.log('✅ Conectado al servidor exitosamente');
      return;
    } catch (error) {
      intentos++;
      console.error(`❌ Fallo en intento ${intentos}:`, error.message);
      
      if (intentos >= maxIntentos) {
        console.log('🎮 Cambiando a modo local (sin multijugador)');
        mostrarMensajeConexion('Modo local - Sin conexión al servidor', false);
        
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
  const port = window.location.port;
  
  // En producción (Render, etc.) no incluir puerto - usa el estándar 443/80
  // Solo incluir puerto en desarrollo local
  if (port) {
    return `${protocol}//${host}:${port}`;
  }
  return `${protocol}//${host}`;
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
    
    // Apply initial game state
    if (data.gameState) {
      procesarEstadoJuego(data.gameState);
    }
    
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
  });
  
  // Death notification (Requirement 3.5, 5.4)
  connection.onDeath((data) => {
    if (data.playerId === localPlayerId) {
      mostrarPantallaMuerte(data.killerId, 5000);
      actualizarBarraVida(0, 200);
    }
    agregarEntradaKillFeed(data.killerId, data.playerId, localPlayerId);
  });
  
  // Respawn notification (Requirement 5.5)
  connection.onRespawn((data) => {
    if (data.playerId === localPlayerId) {
      ocultarPantallaMuerte();
      actualizarBarraVida(200, 200);
    }
  });
  
  // Damage dealt notification (when local player hits someone)
  connection.onDamageDealt((data) => {
    mostrarDañoCausado(data.damage);
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
    actualizarDisplayDash();
  }
}

/**
 * Inicializa el sistema de armas con armas adicionales
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
 * Maneja el cambio a la siguiente arma
 */
function manejarSiguienteArma() {
  siguienteArma(weaponContainer);
  const estado = obtenerEstado();
  mostrarCambioArma(estado.nombre);
  actualizarInfoArma(estado);
  actualizarDisplayMunicion();
  
  // Notificar al servidor del cambio de arma
  if (isMultiplayerConnected) {
    inputSender.sendWeaponChange(estado.tipoActual);
  }
  console.log(`🔄 Cambiado a: ${estado.nombre}`);
}

/**
 * Maneja el cambio a la arma anterior
 */
function manejarArmaAnterior() {
  armaAnterior(weaponContainer);
  const estado = obtenerEstado();
  mostrarCambioArma(estado.nombre);
  actualizarInfoArma(estado);
  actualizarDisplayMunicion();
  
  // Notificar al servidor del cambio de arma
  if (isMultiplayerConnected) {
    inputSender.sendWeaponChange(estado.tipoActual);
  }
  console.log(`🔄 Cambiado a: ${estado.nombre}`);
}

/**
 * Maneja la selección directa de arma por número
 * @param {number} indice - Índice del arma a seleccionar
 */
function manejarSeleccionarArma(indice) {
  const estado = obtenerEstado();
  if (indice < estado.armasDisponibles.length) {
    const tipoArma = estado.armasDisponibles[indice];
    if (cambiarArma(tipoArma, weaponContainer)) {
      const nuevoEstado = obtenerEstado();
      mostrarCambioArma(nuevoEstado.nombre);
      actualizarInfoArma(nuevoEstado);
      actualizarDisplayMunicion();
      
      // Notificar al servidor del cambio de arma
      if (isMultiplayerConnected) {
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
 */
function manejarDash() {
  if (isMultiplayerConnected) {
    // Calculate dash direction
    const direccion = calcularDireccionDash();
    
    // Marcar inicio de dash para evitar reconciliación brusca
    marcarInicioDash();
    
    // Aplicar dash localmente para predicción inmediata
    const dashPower = CONFIG.dash.poder;
    jugador.posicion.x += direccion.x * dashPower;
    jugador.posicion.z += direccion.z * dashPower;
    
    // Aplicar límites del mapa
    jugador.posicion.x = Math.max(
      CONFIG.jugador.limites.min,
      Math.min(CONFIG.jugador.limites.max, jugador.posicion.x)
    );
    jugador.posicion.z = Math.max(
      CONFIG.jugador.limites.min,
      Math.min(CONFIG.jugador.limites.max, jugador.posicion.z)
    );
    
    // Send dash input to server
    inputSender.sendDash(direccion);
    
    // Local visual effect
    crearEfectoDash(jugador.posicion, scene);
  } else {
    // Fallback to local processing
    ejecutarDash(jugador, teclas, (direccion) => {
      crearEfectoDash(jugador.posicion, scene);
    });
  }
  actualizarDisplayDash();
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
 * Maneja el evento de disparo
 * Requirement 5.1: Send shoot input to server
 */
function manejarDisparo() {
  // No disparar si hay overlay de conexión visible
  const connectionOverlay = document.getElementById('connection-overlay');
  if (connectionOverlay && connectionOverlay.style.display !== 'none') {
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
    
    // Actualizar UI de munición
    actualizarDisplayMunicion();
  } else {
    // Fallback a procesamiento local
    const disparo = disparar(camera, [], balas, scene, null);
    
    if (disparo) {
      actualizarDisplayMunicion();
    }
  }
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
  
  inputSender.sendMovement(keys, rotation, position);
}

/**
 * Actualiza el display de munición en la UI
 */
function actualizarDisplayMunicion() {
  const estado = obtenerEstado();
  actualizarInfoArma(estado);
}

/**
 * Actualiza el display de cargas de dash en la UI
 */
function actualizarDisplayDash() {
  const icons = document.querySelectorAll('.dash-icon');
  if (!icons.length) return;

  for (let i = 0; i < icons.length; i++) {
    if (i < sistemaDash.cargasActuales) {
      icons[i].className = 'dash-icon';
    } else if (sistemaDash.cargasRecargando[i]) {
      icons[i].className = 'dash-icon recharging';
    } else {
      icons[i].className = 'dash-icon empty';
    }
  }
}

/**
 * Bucle principal del juego
 */
function bucleJuego() {
  requestAnimationFrame(bucleJuego);

  // Calcular delta time
  const tiempoActual = performance.now();
  const deltaTime = (tiempoActual - ultimoTiempo) / 1000;
  ultimoTiempo = tiempoActual;

  // Update local systems (for prediction/responsiveness)
  if (!isMultiplayerConnected) {
    // Only update dash recharge locally when not connected
    actualizarRecargaDash();
  }
  actualizarDisplayDash();
  
  // Actualizar retroceso acumulado (se reduce con el tiempo)
  actualizarRetroceso();

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
    if (!balas[i].actualizar(deltaTime)) {
      balas[i].destruir();
      balas.splice(i, 1);
    }
  }

  // Sincronizar cámara con jugador
  sincronizarCamara(camera);

  // Renderizar escena
  renderizar();
}

// Iniciar el juego cuando el DOM esté listo
inicializar();
