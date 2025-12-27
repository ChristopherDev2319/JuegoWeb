/**
 * Punto de entrada principal del juego FPS Three.js
 * Importa todos los módulos y crea el bucle principal del juego
 * 
 * Requisitos: 2.5, 1.1
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
import { Enemigo } from './entidades/Enemigo.js';
import { 
  jugador, 
  inicializarJugador, 
  actualizarMovimiento, 
  aplicarGravedad, 
  saltar, 
  actualizarRotacion, 
  sincronizarCamara 
} from './entidades/Jugador.js';
import { 
  arma, 
  disparar, 
  recargar, 
  establecerModeloArma 
} from './sistemas/armas.js';
import { 
  sistemaDash, 
  ejecutarDash, 
  actualizarRecargaDash 
} from './sistemas/dash.js';
import { 
  teclas, 
  inicializarControles, 
  estaPointerLockActivo, 
  estaMousePresionado 
} from './sistemas/controles.js';
import { crearEfectoDash } from './utils/efectos.js';
import { mostrarIndicadorDaño } from './utils/ui.js';

// Arrays globales del juego
const enemigos = [];
const balas = [];

// Modelo del arma
let modeloArma = null;

// Control de tiempo
let ultimoTiempo = performance.now();

/**
 * Inicializa el juego
 */
function inicializar() {
  // Inicializar escena de Three.js
  inicializarEscena();

  // Inicializar jugador
  inicializarJugador();

  // Crear enemigos
  crearEnemigos();

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

  // Iniciar bucle del juego
  bucleJuego();
}

/**
 * Crea los enemigos del juego
 */
function crearEnemigos() {
  const colores = [0xff0000, 0xff3300, 0xff6600, 0xff9900];
  const posicionesX = [-6, -2, 2, 6];

  for (let i = 0; i < 4; i++) {
    const enemigo = new Enemigo(scene, posicionesX[i], -10, colores[i]);
    enemigos.push(enemigo);
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
 */
function manejarRecarga() {
  recargar(() => {
    actualizarDisplayMunicion();
    console.log('Recarga completa!');
  });
  actualizarDisplayMunicion();
  console.log('Recargando...');
}

/**
 * Maneja el evento de dash
 */
function manejarDash() {
  ejecutarDash(jugador, teclas, (direccion) => {
    crearEfectoDash(jugador.posicion, scene);
  });
  actualizarDisplayDash();
}

/**
 * Maneja el evento de disparo
 */
function manejarDisparo() {
  const disparo = disparar(camera, enemigos, balas, scene, (enemigo, daño) => {
    mostrarIndicadorDaño(daño);
  });
  
  if (disparo) {
    actualizarDisplayMunicion();
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

  // Actualizar sistema de dash
  actualizarRecargaDash();
  actualizarDisplayDash();

  // Actualizar enemigos (para respawn)
  for (let enemigo of enemigos) {
    enemigo.actualizar();
  }

  // Disparo automático si el mouse está presionado
  if (estaMousePresionado() && estaPointerLockActivo()) {
    manejarDisparo();
  }

  // Actualizar balas
  for (let i = balas.length - 1; i >= 0; i--) {
    // Verificar colisiones
    balas[i].verificarColision(enemigos);
    
    // Actualizar posición
    if (!balas[i].actualizar(deltaTime)) {
      balas[i].destruir();
      balas.splice(i, 1);
    }
  }

  // Actualizar movimiento del jugador
  actualizarMovimiento(teclas);

  // Aplicar gravedad
  aplicarGravedad();

  // Sincronizar cámara con jugador
  sincronizarCamara(camera);

  // Renderizar escena
  renderizar();
}

// Iniciar el juego cuando el DOM esté listo
inicializar();
