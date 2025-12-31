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
