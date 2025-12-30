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

/**
 * Inicializa la escena de Three.js con todos sus componentes
 */
export function inicializarEscena() {
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

  // Cargar mapa
  cargarMapa();

  // Crear contenedor del arma y añadirlo a la cámara
  weaponContainer = new THREE.Group();
  camera.add(weaponContainer);
  scene.add(camera);

  // Manejar redimensionamiento de ventana
  window.addEventListener('resize', manejarRedimensionamiento);
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
 * Carga el mapa del juego
 */
function cargarMapa() {
  const gltfLoader = new THREE.GLTFLoader();
  
  gltfLoader.load('modelos/lowpoly__fps__tdm__game__map_by_resoforge.glb', (gltf) => {
    mapaModelo = gltf.scene;
    
    // Escalar el mapa (ajustar según necesidad)
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
    console.log('✅ Mapa cargado correctamente');
  }, (progress) => {
    const percent = Math.round((progress.loaded / progress.total) * 100);
    console.log(`📦 Cargando mapa: ${percent}%`);
  }, (error) => {
    console.error('❌ Error cargando mapa:', error);
    // Fallback: crear suelo simple si el mapa no carga
    crearSueloFallback();
  });
}

/**
 * Crea un suelo simple como fallback si el mapa no carga
 */
function crearSueloFallback() {
  const groundGeometry = new THREE.PlaneGeometry(
    CONFIG.escena.tamañoSuelo,
    CONFIG.escena.tamañoSuelo
  );
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x228b22
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = false;
  scene.add(ground);
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
