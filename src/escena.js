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
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // Configurar iluminación
  configurarIluminacion();

  // Crear suelo
  crearSuelo();

  // Crear helper de ejes
  const axesHelper = new THREE.AxesHelper(50);
  scene.add(axesHelper);

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
  // Luz ambiental
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Luz direccional
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
}

/**
 * Crea el suelo de la escena
 */
function crearSuelo() {
  const groundGeometry = new THREE.PlaneGeometry(
    CONFIG.escena.tamañoSuelo,
    CONFIG.escena.tamañoSuelo
  );
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x228b22
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
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
