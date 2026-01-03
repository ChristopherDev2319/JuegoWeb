// ============================================
// MENÚ DE USUARIO CON PERSONAJE 3D
// ============================================

import * as THREE from 'three';
import { CONFIG } from '../config.js';

/**
 * Sistema de menú de usuario con personaje 3D y selector de armas
 */

// Estado del menú
let menuUsuarioActivo = false;
let escenaMenu = null;
let camara = null;
let renderer = null;
let personaje = null;
let armaActual = null;
let armaSeleccionada = 'M4A1';

// Elementos DOM
let elementos = {};

// Animación
let animationId = null;

/**
 * Inicializar el menú de usuario
 */
export function inicializarMenuUsuario() {
    console.log('🎮 Inicializando menú de usuario...');
    
    // Obtener elementos DOM
    obtenerElementosDOM();
    
    // Configurar event listeners
    configurarEventListeners();
    
    console.log('✅ Menú de usuario inicializado');
}

/**
 * Obtener referencias a elementos DOM
 */
function obtenerElementosDOM() {
    elementos = {
        menuOverlay: document.getElementById('user-menu-overlay'),
        menuContainer: document.getElementById('user-menu-container'),
        canvasContainer: document.getElementById('user-menu-canvas'),
        armaInfo: document.getElementById('user-menu-weapon-info'),
        armaNombre: document.getElementById('user-menu-weapon-name'),
        armaDescripcion: document.getElementById('user-menu-weapon-desc'),
        armaSelector: document.getElementById('user-menu-weapon-selector'),
        cerrarBtn: document.getElementById('user-menu-close'),
        statsContainer: document.getElementById('user-menu-stats')
    };
}

/**
 * Configurar event listeners
 */
function configurarEventListeners() {
    // Cerrar menú
    elementos.cerrarBtn?.addEventListener('click', cerrarMenuUsuario);
    
    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' && menuUsuarioActivo) {
            cerrarMenuUsuario();
        }
    });
    
    // Cerrar al hacer clic fuera
    elementos.menuOverlay?.addEventListener('click', (e) => {
        if (e.target === elementos.menuOverlay) {
            cerrarMenuUsuario();
        }
    });
}

/**
 * Mostrar el menú de usuario
 */
export function mostrarMenuUsuario(datosUsuario = {}) {
    if (menuUsuarioActivo) return;
    
    console.log('🎮 Mostrando menú de usuario');
    menuUsuarioActivo = true;
    
    // Mostrar overlay
    elementos.menuOverlay?.classList.remove('hidden');
    
    // Inicializar escena 3D
    inicializarEscena3D();
    
    // Cargar personaje y arma
    cargarPersonajeYArma();
    
    // Actualizar información
    actualizarInformacionUsuario(datosUsuario);
    
    // Crear selector de armas
    crearSelectorArmas();
    
    // Iniciar animación
    iniciarAnimacion();
}

/**
 * Cerrar el menú de usuario
 */
export function cerrarMenuUsuario() {
    if (!menuUsuarioActivo) return;
    
    console.log('🎮 Cerrando menú de usuario');
    menuUsuarioActivo = false;
    
    // Ocultar overlay
    elementos.menuOverlay?.classList.add('hidden');
    
    // Detener animación
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Limpiar escena 3D
    limpiarEscena3D();
}

/**
 * Inicializar escena 3D para el menú
 */
function inicializarEscena3D() {
    if (!elementos.canvasContainer) return;
    
    // Crear escena
    escenaMenu = new THREE.Scene();
    escenaMenu.background = new THREE.Color(0x87CEEB); // Color azul cielo como la imagen
    
    // Crear cámara
    const aspect = elementos.canvasContainer.clientWidth / elementos.canvasContainer.clientHeight;
    camara = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camara.position.set(0, 1.6, 3);
    camara.lookAt(0, 1, 0);
    
    // Crear renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(elementos.canvasContainer.clientWidth, elementos.canvasContainer.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Agregar canvas al contenedor
    elementos.canvasContainer.appendChild(renderer.domElement);
    
    // Iluminación
    const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
    escenaMenu.add(luzAmbiente);
    
    const luzDireccional = new THREE.DirectionalLight(0xffffff, 0.8);
    luzDireccional.position.set(5, 10, 5);
    luzDireccional.castShadow = true;
    escenaMenu.add(luzDireccional);
    
    // Suelo circular (como en la imagen)
    const geometriaSuelo = new THREE.CircleGeometry(2, 32);
    const materialSuelo = new THREE.MeshLambertMaterial({ 
        color: 0x4FC3F7,
        transparent: true,
        opacity: 0.3
    });
    const suelo = new THREE.Mesh(geometriaSuelo, materialSuelo);
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.y = -0.1;
    escenaMenu.add(suelo);
}

/**
 * Cargar personaje y arma en la escena
 */
function cargarPersonajeYArma() {
    // Crear personaje simple (por ahora una cápsula)
    const geometriaPersonaje = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
    const materialPersonaje = new THREE.MeshLambertMaterial({ color: 0xD2691E }); // Color marrón como la imagen
    personaje = new THREE.Mesh(geometriaPersonaje, materialPersonaje);
    personaje.position.y = 0.6;
    personaje.castShadow = true;
    escenaMenu.add(personaje);
    
    // Crear "cara" simple
    const geometriaCara = new THREE.SphereGeometry(0.15, 16, 16);
    const materialCara = new THREE.MeshLambertMaterial({ color: 0xFFE4B5 });
    const cara = new THREE.Mesh(geometriaCara, materialCara);
    cara.position.set(0, 1.4, 0.25);
    escenaMenu.add(cara);
    
    // Crear "sombrero" como en la imagen
    const geometriaSombrero = new THREE.CylinderGeometry(0.2, 0.25, 0.15, 16);
    const materialSombrero = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
    const sombrero = new THREE.Mesh(geometriaSombrero, materialSombrero);
    sombrero.position.set(0, 1.65, 0);
    escenaMenu.add(sombrero);
    
    // Cargar arma actual
    cargarArmaMenu(armaSeleccionada);
}

/**
 * Cargar arma en el menú
 */
async function cargarArmaMenu(tipoArma) {
    // Remover arma anterior
    if (armaActual) {
        escenaMenu.remove(armaActual);
        armaActual = null;
    }
    
    try {
        // Por ahora crear arma simple (caja)
        const configArma = CONFIG.armas[tipoArma];
        if (!configArma) return;
        
        // Crear arma simple
        const geometriaArma = new THREE.BoxGeometry(0.1, 0.05, 0.4);
        const materialArma = new THREE.MeshLambertMaterial({ color: 0x333333 });
        armaActual = new THREE.Mesh(geometriaArma, materialArma);
        
        // Posicionar arma en la mano derecha
        armaActual.position.set(0.4, 1.0, 0.2);
        armaActual.rotation.y = Math.PI / 4;
        armaActual.rotation.z = -Math.PI / 6;
        
        escenaMenu.add(armaActual);
        
        // Actualizar información del arma
        actualizarInformacionArma(configArma);
        
    } catch (error) {
        console.warn('Error cargando arma en menú:', error);
    }
}

/**
 * Actualizar información del arma
 */
function actualizarInformacionArma(configArma) {
    if (elementos.armaNombre) {
        elementos.armaNombre.textContent = configArma.nombre || 'Arma';
    }
    
    if (elementos.armaDescripcion) {
        elementos.armaDescripcion.textContent = configArma.descripcion || 'Arma de combate estándar';
    }
}

/**
 * Crear selector de armas
 */
function crearSelectorArmas() {
    if (!elementos.armaSelector) return;
    
    elementos.armaSelector.innerHTML = '';
    
    // Obtener armas disponibles
    const armasDisponibles = Object.keys(CONFIG.armas);
    
    armasDisponibles.forEach(tipoArma => {
        const configArma = CONFIG.armas[tipoArma];
        
        const botonArma = document.createElement('button');
        botonArma.className = `weapon-selector-btn ${tipoArma === armaSeleccionada ? 'active' : ''}`;
        botonArma.innerHTML = `
            <div class="weapon-icon">🔫</div>
            <div class="weapon-name">${configArma.nombre}</div>
        `;
        
        botonArma.addEventListener('click', () => {
            seleccionarArma(tipoArma);
        });
        
        elementos.armaSelector.appendChild(botonArma);
    });
}

/**
 * Seleccionar arma
 */
function seleccionarArma(tipoArma) {
    if (armaSeleccionada === tipoArma) return;
    
    armaSeleccionada = tipoArma;
    
    // Actualizar botones
    const botones = elementos.armaSelector.querySelectorAll('.weapon-selector-btn');
    botones.forEach(btn => btn.classList.remove('active'));
    
    const botonActivo = Array.from(botones).find(btn => 
        btn.querySelector('.weapon-name').textContent === CONFIG.armas[tipoArma].nombre
    );
    botonActivo?.classList.add('active');
    
    // Efecto visual en el botón
    if (botonActivo) {
        botonActivo.style.transform = 'scale(1.1)';
        setTimeout(() => {
            botonActivo.style.transform = '';
        }, 200);
    }
    
    // Cargar nueva arma con animación
    cargarArmaMenu(tipoArma);
    
    // Reproducir sonido de cambio (si está disponible)
    try {
        const audio = new Audio('sonidos/weapon_switch.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignorar errores de audio
    } catch (error) {
        // Ignorar errores de audio
    }
}

/**
 * Actualizar información del usuario
 */
function actualizarInformacionUsuario(datosUsuario) {
    if (!elementos.statsContainer) return;
    
    const stats = datosUsuario.stats || {};
    const level = datosUsuario.level || 1;
    const username = datosUsuario.username || 'Jugador';
    
    // Calcular K/D ratio
    const kills = stats.kills || 0;
    const deaths = stats.deaths || 0;
    const kdRatio = deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
    
    // Calcular precisión
    const shotsFired = stats.shotsFired || 0;
    const shotsHit = stats.shotsHit || 0;
    const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;
    
    // Formatear tiempo de juego
    const playtime = stats.playtime || 0;
    const hours = Math.floor(playtime / 3600);
    const minutes = Math.floor((playtime % 3600) / 60);
    const playtimeFormatted = `${hours}h ${minutes}m`;
    
    // Calcular experiencia y progreso al siguiente nivel
    const experience = stats.experience || 0;
    const currentLevelXP = (level - 1) * 1000;
    const nextLevelXP = level * 1000;
    const progressXP = experience - currentLevelXP;
    const neededXP = nextLevelXP - experience;
    const progressPercent = Math.max(0, Math.min(100, (progressXP / 1000) * 100));
    
    elementos.statsContainer.innerHTML = `
        <div class="xp-progress-container">
            <div class="xp-progress-label">Progreso al Nivel ${level + 1}</div>
            <div class="xp-progress-bar">
                <div class="xp-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
        </div>
        <div class="user-stat">
            <div class="stat-label">Nivel</div>
            <div class="stat-value">${level}</div>
        </div>
        <div class="user-stat">
            <div class="stat-label">Experiencia</div>
            <div class="stat-value">${experience} XP</div>
        </div>
        <div class="user-stat">
            <div class="stat-label">Siguiente Nivel</div>
            <div class="stat-value">${neededXP > 0 ? neededXP : 'MAX'} XP</div>
        </div>
        <div class="user-stat">
            <div class="stat-label">Kills</div>
            <div class="stat-value">${kills}</div>
        </div>
        <div class="user-stat">
            <div class="stat-label">Deaths</div>
            <div class="stat-value">${deaths}</div>
        </div>
        <div class="user-stat">
            <div class="stat-label">K/D</div>
            <div class="stat-value">${kdRatio}</div>
        </div>
        <div class="user-stat">
            <div class="stat-label">Precisión</div>
            <div class="stat-value">${accuracy}%</div>
        </div>
        <div class="user-stat">
            <div class="stat-label">Disparos</div>
            <div class="stat-value">${shotsFired}</div>
        </div>
        <div class="user-stat">
            <div class="stat-label">Tiempo</div>
            <div class="stat-value">${playtimeFormatted}</div>
        </div>
    `;
}

/**
 * Iniciar animación del menú
 */
function iniciarAnimacion() {
    function animar() {
        if (!menuUsuarioActivo) return;
        
        animationId = requestAnimationFrame(animar);
        
        // Rotar personaje lentamente
        if (personaje) {
            personaje.rotation.y += 0.005;
        }
        
        // Renderizar escena
        if (renderer && escenaMenu && camara) {
            renderer.render(escenaMenu, camara);
        }
    }
    
    animar();
}

/**
 * Limpiar escena 3D
 */
function limpiarEscena3D() {
    if (renderer) {
        // Remover canvas
        if (renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        
        // Limpiar renderer
        renderer.dispose();
        renderer = null;
    }
    
    // Limpiar referencias
    escenaMenu = null;
    camara = null;
    personaje = null;
    armaActual = null;
}

/**
 * Verificar si el menú está activo
 */
export function estaMenuUsuarioActivo() {
    return menuUsuarioActivo;
}