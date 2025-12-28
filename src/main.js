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
  aplicarEstadoServidor
} from './entidades/Jugador.js';

import { 
  arma, 
  disparar,
  recargar, 
  establecerModeloArma,
  animarRetroceso,
  actualizarDesdeServidor as actualizarArmaDesdeServidor
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
import { mostrarIndicadorDaño, mostrarMensajeConexion, ocultarMensajeConexion, mostrarPantallaMuerte, ocultarPantallaMuerte, agregarEntradaKillFeed, actualizarBarraVida, mostrarEfectoDaño, mostrarDañoCausado } from './utils/ui.js';

// Network imports
import { getConnection } from './network/connection.js';
import { getInputSender } from './network/inputSender.js';
import { initializeRemotePlayerManager } from './network/remotePlayers.js';

// Arrays globales del juego
const balas = [];

// Modelo del arma
let modeloArma = null;

// Control de tiempo
let ultimoTiempo = performance.now();

// Network state
let connection = null;
let inputSender = null;
let remotePlayerManager = null;
let isMultiplayerConnected = false;
let localPlayerId = null;

// Input sending rate control (20Hz to match server tick rate)
const INPUT_SEND_RATE = 1000 / 20; // 50ms
let lastInputSendTime = 0;

/**
 * Inicializa el juego
 */
async function inicializar() {
  // Inicializar escena de Three.js
  inicializarEscena();

  // Inicializar jugador
  inicializarJugador();

  // Cargar modelo del arma
  cargarModeloArma();

  // Inicializar controles
  inicializarControles({
    onRecargar: manejarRecarga,
    onDash: manejarDash,
    onDisparar: manejarDisparo,
    onSaltar: manejarSalto,
    onMovimientoMouse: manejarMovimientoMouse
  });

  // Inicializar displays de UI
  actualizarDisplayMunicion();
  actualizarDisplayDash();

  // Initialize network connection (Requirement 2.1)
  await inicializarRed();

  // Iniciar bucle del juego
  bucleJuego();
}

/**
 * Initialize network connection and set up callbacks
 * Requirements: 2.1, 2.2
 */
async function inicializarRed() {
  mostrarMensajeConexion('Conectando al servidor...');
  
  connection = getConnection();
  inputSender = getInputSender();
  
  // Initialize remote player manager
  remotePlayerManager = initializeRemotePlayerManager(scene);
  
  // Set up event callbacks before connecting
  configurarCallbacksRed();
  
  // Get server URL (default to localhost:3000)
  const serverUrl = obtenerUrlServidor();
  
  try {
    await connection.connect(serverUrl);
    console.log('Connected to server successfully');
  } catch (error) {
    console.error('Failed to connect to server:', error);
    mostrarMensajeConexion('Error de conexión. Click para reintentar.', true);
    
    // Set up retry on click
    document.body.addEventListener('click', async function retryConnection() {
      document.body.removeEventListener('click', retryConnection);
      await inicializarRed();
    }, { once: true });
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
  
  // In production (Render), don't include port as it uses standard 443/80
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
    // Solo mostrar efecto visual de daño, sin el indicador de texto
    mostrarEfectoDaño();
    actualizarBarraVida(data.health, 200);
    console.log(`Hit! Damage: ${data.damage}, Health: ${data.health}`);
  });
  
  // Death notification (Requirement 3.5, 5.4)
  connection.onDeath((data) => {
    console.log('Player died:', data);
    
    // Check if local player died
    if (data.playerId === localPlayerId) {
      // Show death screen with killer info
      mostrarPantallaMuerte(data.killerId, 5000);
      actualizarBarraVida(0, 200);
    }
    
    // Add to kill feed (Requirement 5.3, 5.4)
    agregarEntradaKillFeed(data.killerId, data.playerId, localPlayerId);
  });
  
  // Respawn notification (Requirement 5.5)
  connection.onRespawn((data) => {
    console.log('Player respawned:', data);
    
    // Check if local player respawned
    if (data.playerId === localPlayerId) {
      // Hide death screen
      ocultarPantallaMuerte();
      // Reset health bar to full
      actualizarBarraVida(200, 200);
    }
  });
  
  // Damage dealt notification (when local player hits someone)
  // Requirement 5.3
  connection.onDamageDealt((data) => {
    console.log('Damage dealt:', data);
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
 * Carga el modelo 3D del arma
 */
function cargarModeloArma() {
  const fbxLoader = new THREE.FBXLoader();

  fbxLoader.load('modelos/FBX/Weapons/M4A1.fbx', (armaCaregada) => {
    modeloArma = armaCaregada;

    // Calcular escala
    const box = new THREE.Box3().setFromObject(armaCaregada);
    const size = new THREE.Vector3();
    box.getSize(size);

    const longitudDeseada = 0.8;
    const escala = longitudDeseada / size.z;
    armaCaregada.scale.setScalar(escala);

    // Posicionar el arma
    armaCaregada.position.set(0.3, -0.3, -0.5);
    armaCaregada.rotation.set(0, Math.PI, 0);

    // Configurar sombras
    armaCaregada.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Añadir al contenedor del arma
    weaponContainer.add(armaCaregada);

    // Establecer referencia para animaciones de retroceso
    establecerModeloArma(armaCaregada);
  });
}

/**
 * Maneja el evento de recarga
 * Requirement 6.1: Send reload input to server
 */
function manejarRecarga() {
  if (isMultiplayerConnected) {
    // Send reload input to server
    inputSender.sendReload();
  } else {
    // Fallback to local processing
    recargar(() => {
      actualizarDisplayMunicion();
      console.log('Recarga completa!');
    });
  }
  actualizarDisplayMunicion();
  console.log('Recargando...');
}

/**
 * Maneja el evento de dash
 * Requirement 7.1: Send dash input to server
 */
function manejarDash() {
  if (isMultiplayerConnected) {
    // Calculate dash direction
    const direccion = calcularDireccionDash();
    
    // Send dash input to server
    inputSender.sendDash(direccion);
    
    // Local visual effect (prediction)
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
  if (isMultiplayerConnected) {
    // Verificar si podemos disparar localmente (para responsividad)
    if (arma.estaRecargando || arma.municionActual <= 0) {
      return;
    }
    
    // Verificar cadencia de disparo
    const ahora = performance.now();
    const tiempoEntreDisparos = (60 / CONFIG.arma.cadenciaDisparo) * 1000;
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
    
    // Enviar input de disparo al servidor
    inputSender.sendShoot(
      { x: posicionBala.x, y: posicionBala.y, z: posicionBala.z },
      { x: direccion.x, y: direccion.y, z: direccion.z }
    );
    
    // Crear bala visual local (predicción del cliente)
    const bala = new Bala(scene, posicionBala, direccion, null);
    balas.push(bala);
    
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
  const ammoDiv = document.getElementById('ammo');
  if (!ammoDiv) return;

  if (arma.estaRecargando) {
    ammoDiv.textContent = 'RECARGANDO...';
    ammoDiv.style.color = '#ffaa00';
  } else {
    ammoDiv.textContent = `${arma.municionActual} / ${arma.municionTotal}`;
    ammoDiv.style.color = arma.municionActual <= 5 ? '#ff0000' : 'white';
  }
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

  // Disparo automático si el mouse está presionado
  if (estaMousePresionado() && estaPointerLockActivo()) {
    manejarDisparo();
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
