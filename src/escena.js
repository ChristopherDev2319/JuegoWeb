/**
 * Módulo de Escena Three.js
 * Configura y exporta la escena, cámara, renderer y elementos básicos
 * 
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from './config.js';

// Objetos principales de Three.js
export let scene = null;
export let camera = null;
export let renderer = null;

// Contenedor del arma
export let weaponContainer = null;

// Referencia al mapa cargado
let mapaModelo = null;

// Promesa de carga del mapa
let mapaPromise = null;

/**
 * Inicializa la escena de Three.js con todos sus componentes
 * @param {Function} onProgresoMapa - Callback para progreso de carga del mapa
 * @returns {Promise} - Promesa que resuelve cuando el mapa está cargado
 */
export function inicializarEscena(onProgresoMapa = null) {
  // Crear escena
  scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.escena.colorFondo);

  // Crear cámara
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // Crear renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false; // Sombras desactivadas
  document.body.appendChild(renderer.domElement);

  // Configurar iluminación
  configurarIluminacion();

  // Crear grid y ejes de coordenadas para debug
  crearGridYEjes();

  // Cargar mapa (ahora retorna promesa)
  mapaPromise = cargarMapa(onProgresoMapa);

  // Crear contenedor del arma y añadirlo a la cámara
  weaponContainer = new THREE.Group();
  camera.add(weaponContainer);
  scene.add(camera);

  // Manejar redimensionamiento de ventana
  window.addEventListener('resize', manejarRedimensionamiento);
  
  return mapaPromise;
}

/**
 * Obtiene la promesa de carga del mapa
 * @returns {Promise}
 */
export function obtenerPromesaMapa() {
  return mapaPromise;
}

/**
 * Configura las luces de la escena
 */
function configurarIluminacion() {
  // Luz ambiental más fuerte para el mapa
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  // Luz direccional principal
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = false;
  scene.add(directionalLight);

  // Luz de relleno desde el otro lado
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-50, 50, -50);
  scene.add(fillLight);
}

/**
 * Crea un grid helper y ejes de coordenadas para debug
 * Grid: cada cuadro = 5 unidades, total 100x100 unidades
 * Ejes: Rojo = +X (derecha), Verde = +Y (arriba), Azul = +Z (adelante)
 */
function crearGridYEjes() {
  // Grid en el suelo (100x100 unidades, divisiones de 5)
  const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
  gridHelper.position.y = 0.01; // Ligeramente sobre el suelo
  scene.add(gridHelper);
  
  // Ejes de coordenadas en el origen
  // Rojo = +X, Verde = +Y, Azul = +Z
  const axesHelper = new THREE.AxesHelper(20);
  axesHelper.position.y = 0.02;
  scene.add(axesHelper);
  
  // Etiquetas de ejes (usando sprites de texto)
  crearEtiquetaEje('+X', 22, 0.5, 0, 0xff0000);
  crearEtiquetaEje('+Z', 0, 0.5, 22, 0x0000ff);
  crearEtiquetaEje('-X', -22, 0.5, 0, 0xff0000);
  crearEtiquetaEje('-Z', 0, 0.5, -22, 0x0000ff);
  
  console.log('📐 Grid y ejes de coordenadas añadidos');
  console.log('   Rojo (+X) = Derecha, Azul (+Z) = Adelante');
  console.log('   Cada cuadro del grid = 5 unidades');
}

/**
 * Crea una etiqueta de texto para los ejes
 */
function crearEtiquetaEje(texto, x, y, z, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, 32, 16);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(x, y, z);
  sprite.scale.set(4, 2, 1);
  scene.add(sprite);
}

/**
 * Carga el mapa visual del juego
 * @param {Function} onProgreso - Callback para progreso de carga
 * @returns {Promise} - Promesa que resuelve cuando el mapa está cargado
 */
function cargarMapa(onProgreso = null) {
  return new Promise((resolve, reject) => {
    const gltfLoader = new THREE.GLTFLoader();
    
    // Cargar el nuevo mapa visual (map_visual.glb)
    gltfLoader.load('modelos/map_visual.glb', (gltf) => {
      mapaModelo = gltf.scene;
      
      // Escalar el mapa a 5x
      mapaModelo.scale.setScalar(5);
      
      // Posicionar el mapa
      mapaModelo.position.set(0, 0, 0);
      
      // Configurar materiales del mapa
      mapaModelo.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
      
      scene.add(mapaModelo);
      console.log('✅ Mapa visual cargado correctamente (map_visual.glb)');
      resolve(mapaModelo);
    }, (progress) => {
      if (progress.total > 0) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        console.log(`📦 Cargando mapa visual: ${percent}%`);
        if (onProgreso) onProgreso(percent);
      }
    }, (error) => {
      console.error('❌ Error cargando mapa visual:', error);
      // Fallback: crear suelo simple si el mapa no carga
      crearSueloFallback();
      resolve(null); // Resolver de todas formas para no bloquear
    });
  });
}

/**
 * Crea un suelo simple como fallback si el mapa no carga
 * Tamaño: 50x50 unidades para coincidir con el nuevo mapa
 */
function crearSueloFallback() {
  // Usar tamaño de 250x250 para coincidir con el mapa escalado a 5x
  const tamañoSuelo = 250;
  const groundGeometry = new THREE.PlaneGeometry(tamañoSuelo, tamañoSuelo);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x228b22
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = false;
  scene.add(ground);
  console.log('⚠️ Usando suelo fallback (250x250)');
}

/**
 * Maneja el redimensionamiento de la ventana
 */
function manejarRedimensionamiento() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Renderiza la escena
 */
export function renderizar() {
  renderer.render(scene, camera);
}

/**
 * Obtiene la escena
 * @returns {THREE.Scene}
 */
export function obtenerEscena() {
  return scene;
}

/**
 * Obtiene la cámara
 * @returns {THREE.PerspectiveCamera}
 */
export function obtenerCamara() {
  return camera;
}

/**
 * Obtiene el contenedor del arma
 * @returns {THREE.Group}
 */
export function obtenerContenedorArma() {
  return weaponContainer;
}
