/**
 * Sistema de Menú de Pausa
 * Gestiona el menú de pausa con opciones funcionales
 */

import { CONFIG } from '../config.js';
import { establecerVerificadorMenu, ignorarCambiosPointerLock } from './controles.js';

// Estado del menú
let menuActivo = false;
let panelActual = 'main';
let estadisticasJuego = {
  kills: 0,
  deaths: 0,
  shotsFired: 0,
  shotsHit: 0,
  startTime: Date.now(),
  playtime: 0
};

// Referencias a elementos DOM
let elementos = {};

// Callbacks
let callbacks = {
  onReanudar: null,
  onDesconectar: null,
  onSalir: null,
  onConfiguracionCambiada: null
};

/**
 * Inicializa el sistema de menú de pausa
 * @param {Object} eventCallbacks - Callbacks para eventos del menú
 */
export function inicializarMenuPausa(eventCallbacks = {}) {
  callbacks = { ...callbacks, ...eventCallbacks };
  
  // Obtener referencias a elementos DOM
  const domReady = obtenerElementosDOM();
  if (!domReady) {
    console.warn('⚠️ No se pudo inicializar el menú de pausa - elementos DOM faltantes');
    return false;
  }
  
  // Configurar event listeners
  configurarEventListeners();
  
  // Inicializar configuración
  cargarConfiguracion();
  
  // Inicializar contador FPS
  inicializarContadorFPS();
  
  // Registrar verificador de menú en el sistema de controles
  establecerVerificadorMenu(estaMenuActivo);
  
  console.log('✅ Menú de pausa inicializado');
  return true;
}

/**
 * Obtiene referencias a todos los elementos DOM necesarios
 */
function obtenerElementosDOM() {
  elementos = {
    // Menú principal
    pauseMenu: document.getElementById('pause-menu'),
    
    // Botones principales
    resumeBtn: document.getElementById('resume-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    controlsBtn: document.getElementById('controls-btn'),
    statsBtn: document.getElementById('stats-btn'),
    disconnectBtn: document.getElementById('disconnect-btn'),
    exitBtn: document.getElementById('exit-btn'),
    
    // Paneles
    settingsPanel: document.getElementById('settings-panel'),
    controlsPanel: document.getElementById('controls-panel'),
    statsPanel: document.getElementById('stats-panel'),
    
    // Botones de regreso
    settingsBackBtn: document.getElementById('settings-back-btn'),
    controlsBackBtn: document.getElementById('controls-back-btn'),
    statsBackBtn: document.getElementById('stats-back-btn'),
    
    // Configuración
    mouseSensitivity: document.getElementById('mouse-sensitivity'),
    sensitivityValue: document.getElementById('sensitivity-value'),
    masterVolume: document.getElementById('master-volume'),
    volumeValue: document.getElementById('volume-value'),
    fovSlider: document.getElementById('fov-slider'),
    fovValue: document.getElementById('fov-value'),
    showFps: document.getElementById('show-fps'),
    dynamicCrosshair: document.getElementById('dynamic-crosshair'),
    
    // Estadísticas
    killsStat: document.getElementById('kills-stat'),
    deathsStat: document.getElementById('deaths-stat'),
    kdRatio: document.getElementById('kd-ratio'),
    shotsFired: document.getElementById('shots-fired'),
    accuracyStat: document.getElementById('accuracy-stat'),
    playtimeStat: document.getElementById('playtime-stat'),
    
    // FPS Counter
    fpsCounter: document.getElementById('fps-counter'),
    fpsValue: document.getElementById('fps-value')
  };

  // Verificar elementos críticos
  if (!elementos.pauseMenu) {
    console.warn('⚠️ Elemento pause-menu no encontrado');
    return false;
  }

  return true;
}

/**
 * Configura todos los event listeners
 */
function configurarEventListeners() {
  // Botón continuar - activa pointer lock directamente desde el click
  elementos.resumeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    reanudarConPointerLock();
  });
  
  elementos.settingsBtn?.addEventListener('click', () => mostrarPanel('settings'));
  elementos.controlsBtn?.addEventListener('click', () => mostrarPanel('controls'));
  elementos.statsBtn?.addEventListener('click', () => mostrarPanel('stats'));
  elementos.disconnectBtn?.addEventListener('click', desconectar);
  elementos.exitBtn?.addEventListener('click', salirDelJuego);
  
  // Botones de regreso
  elementos.settingsBackBtn?.addEventListener('click', () => mostrarPanel('main'));
  elementos.controlsBackBtn?.addEventListener('click', () => mostrarPanel('main'));
  elementos.statsBackBtn?.addEventListener('click', () => mostrarPanel('main'));
  
  // Configuración - Sensibilidad del mouse
  elementos.mouseSensitivity?.addEventListener('input', (e) => {
    const valor = parseFloat(e.target.value);
    elementos.sensitivityValue.textContent = valor.toFixed(3);
    CONFIG.controles.sensibilidadMouse = valor;
    if (callbacks.onConfiguracionCambiada) {
      callbacks.onConfiguracionCambiada('sensibilidad', valor);
    }
    guardarConfiguracion();
  });
  
  // Configuración - Volumen
  elementos.masterVolume?.addEventListener('input', (e) => {
    const valor = parseFloat(e.target.value);
    elementos.volumeValue.textContent = `${Math.round(valor * 100)}%`;
    if (callbacks.onConfiguracionCambiada) {
      callbacks.onConfiguracionCambiada('volumen', valor);
    }
    guardarConfiguracion();
  });
  
  // Configuración - FOV
  elementos.fovSlider?.addEventListener('input', (e) => {
    const valor = parseInt(e.target.value);
    elementos.fovValue.textContent = `${valor}°`;
    if (callbacks.onConfiguracionCambiada) {
      callbacks.onConfiguracionCambiada('fov', valor);
    }
    guardarConfiguracion();
  });
  
  // Configuración - Mostrar FPS
  elementos.showFps?.addEventListener('change', (e) => {
    const mostrar = e.target.checked;
    elementos.fpsCounter?.classList.toggle('hidden', !mostrar);
    guardarConfiguracion();
  });
  
  // Configuración - Crosshair dinámico
  elementos.dynamicCrosshair?.addEventListener('change', (e) => {
    const dinamico = e.target.checked;
    if (callbacks.onConfiguracionCambiada) {
      callbacks.onConfiguracionCambiada('crosshairDinamico', dinamico);
    }
    guardarConfiguracion();
  });
  
  // Teclas rápidas en el menú
  document.addEventListener('keydown', manejarTeclasMenu);
  
  // Clic en el overlay (fondo) para cerrar y activar pointer lock
  elementos.pauseMenu?.addEventListener('click', (e) => {
    if (e.target === elementos.pauseMenu || e.target.classList.contains('pause-overlay')) {
      reanudarConPointerLock();
    }
  });
}

/**
 * Maneja las teclas rápidas cuando el menú está abierto
 */
function manejarTeclasMenu(evento) {
  if (!menuActivo) return;
  
  // ESC solo vuelve al panel principal si estamos en un subpanel
  // NO cierra el menú - solo se cierra con click en Continuar o en el overlay
  if (evento.code === 'Escape') {
    evento.preventDefault();
    evento.stopPropagation();
    
    if (panelActual !== 'main') {
      mostrarPanel('main');
    }
    // Si ya estamos en main, no hacer nada
  }
}

/**
 * Muestra u oculta el menú de pausa
 */
export function alternarMenuPausa() {
  // Si el menú ya está activo, no hacer nada (se cierra con el botón de reanudar)
  if (menuActivo) {
    return;
  }
  pausarJuego();
}

/**
 * Pausa el juego y muestra el menú
 */
function pausarJuego() {
  menuActivo = true;
  panelActual = 'main';
  
  // Mostrar menú
  elementos.pauseMenu?.classList.remove('hidden');
  
  // Ocultar todos los paneles excepto el principal
  mostrarPanel('main');
  
  // Actualizar estadísticas
  actualizarEstadisticas();
  
  // Liberar pointer lock solo si está activo (puede que ya se haya liberado por ESC)
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
  
  console.log('⏸️ Juego pausado');
}

/**
 * Reanuda el juego CON pointer lock (desde click)
 */
function reanudarConPointerLock() {
  if (!menuActivo) return;
  
  menuActivo = false;
  elementos.pauseMenu?.classList.add('hidden');
  
  // Ignorar cambios de pointer lock temporalmente
  ignorarCambiosPointerLock(500);
  
  // Activar pointer lock - esto funciona porque viene de un click
  document.body.requestPointerLock();
  
  if (callbacks.onReanudar) {
    callbacks.onReanudar();
  }
  
  console.log('▶️ Juego reanudado (con pointer lock)');
}

/**
 * Reanuda el juego SIN pointer lock (desde ESC)
 * El pointer lock se activará con el siguiente click
 */
function reanudarSinPointerLock() {
  if (!menuActivo) return;
  
  menuActivo = false;
  elementos.pauseMenu?.classList.add('hidden');
  
  // Ignorar cambios de pointer lock temporalmente
  ignorarCambiosPointerLock(500);
  
  // NO intentar activar pointer lock aquí - el navegador lo rechazará
  // El siguiente click del usuario lo activará automáticamente
  
  if (callbacks.onReanudar) {
    callbacks.onReanudar();
  }
  
  console.log('▶️ Juego reanudado (click para activar controles)');
}

/**
 * Reanuda el juego y oculta el menú (legacy, usa reanudarConPointerLock)
 */
function reanudarJuego() {
  reanudarConPointerLock();
}

/**
 * Muestra un panel específico
 */
function mostrarPanel(panel) {
  panelActual = panel;
  
  // Ocultar todos los paneles
  elementos.settingsPanel?.classList.add('hidden');
  elementos.controlsPanel?.classList.add('hidden');
  elementos.statsPanel?.classList.add('hidden');
  
  // Mostrar el panel solicitado
  switch (panel) {
    case 'settings':
      elementos.settingsPanel?.classList.remove('hidden');
      break;
    case 'controls':
      elementos.controlsPanel?.classList.remove('hidden');
      break;
    case 'stats':
      elementos.statsPanel?.classList.remove('hidden');
      actualizarEstadisticas();
      break;
  }
}

/**
 * Desconecta del servidor
 */
function desconectar() {
  if (callbacks.onDesconectar) {
    callbacks.onDesconectar();
  }
  reanudarJuego();
}

/**
 * Sale del juego
 */
function salirDelJuego() {
  if (confirm('¿Estás seguro de que quieres salir del juego?')) {
    if (callbacks.onSalir) {
      callbacks.onSalir();
    } else {
      // Fallback: redirigir a la página de configuración
      window.location.href = 'configurar.html';
    }
  }
}

/**
 * Carga la configuración guardada
 */
function cargarConfiguracion() {
  try {
    const config = JSON.parse(localStorage.getItem('pauseMenuConfig') || '{}');
    
    // Aplicar configuración guardada
    if (elementos.mouseSensitivity && config.sensibilidad !== undefined) {
      elementos.mouseSensitivity.value = config.sensibilidad;
      elementos.sensitivityValue.textContent = config.sensibilidad.toFixed(3);
      CONFIG.controles.sensibilidadMouse = config.sensibilidad;
    }
    
    if (elementos.masterVolume && config.volumen !== undefined) {
      elementos.masterVolume.value = config.volumen;
      elementos.volumeValue.textContent = `${Math.round(config.volumen * 100)}%`;
    }
    
    if (elementos.fovSlider && config.fov !== undefined) {
      elementos.fovSlider.value = config.fov;
      elementos.fovValue.textContent = `${config.fov}°`;
    }
    
    if (elementos.showFps && config.mostrarFps !== undefined) {
      elementos.showFps.checked = config.mostrarFps;
      elementos.fpsCounter?.classList.toggle('hidden', !config.mostrarFps);
    }
    
    if (elementos.dynamicCrosshair && config.crosshairDinamico !== undefined) {
      elementos.dynamicCrosshair.checked = config.crosshairDinamico;
    }
    
  } catch (error) {
    console.warn('Error cargando configuración del menú:', error);
  }
}

/**
 * Guarda la configuración actual
 */
function guardarConfiguracion() {
  try {
    const config = {
      sensibilidad: parseFloat(elementos.mouseSensitivity?.value || 0.002),
      volumen: parseFloat(elementos.masterVolume?.value || 0.5),
      fov: parseInt(elementos.fovSlider?.value || 75),
      mostrarFps: elementos.showFps?.checked || false,
      crosshairDinamico: elementos.dynamicCrosshair?.checked || true
    };
    
    localStorage.setItem('pauseMenuConfig', JSON.stringify(config));
  } catch (error) {
    console.warn('Error guardando configuración del menú:', error);
  }
}

/**
 * Actualiza las estadísticas mostradas
 */
function actualizarEstadisticas() {
  // Calcular tiempo jugado
  estadisticasJuego.playtime = Date.now() - estadisticasJuego.startTime;
  
  // Actualizar elementos DOM
  if (elementos.killsStat) elementos.killsStat.textContent = estadisticasJuego.kills;
  if (elementos.deathsStat) elementos.deathsStat.textContent = estadisticasJuego.deaths;
  
  // K/D Ratio
  const kdRatio = estadisticasJuego.deaths > 0 ? 
    (estadisticasJuego.kills / estadisticasJuego.deaths).toFixed(2) : 
    estadisticasJuego.kills.toFixed(2);
  if (elementos.kdRatio) elementos.kdRatio.textContent = kdRatio;
  
  // Disparos
  if (elementos.shotsFired) elementos.shotsFired.textContent = estadisticasJuego.shotsFired;
  
  // Precisión
  const precision = estadisticasJuego.shotsFired > 0 ? 
    Math.round((estadisticasJuego.shotsHit / estadisticasJuego.shotsFired) * 100) : 0;
  if (elementos.accuracyStat) elementos.accuracyStat.textContent = `${precision}%`;
  
  // Tiempo jugado
  const minutos = Math.floor(estadisticasJuego.playtime / 60000);
  const segundos = Math.floor((estadisticasJuego.playtime % 60000) / 1000);
  if (elementos.playtimeStat) {
    elementos.playtimeStat.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }
}

/**
 * Registra una eliminación
 */
export function registrarKill() {
  estadisticasJuego.kills++;
}

/**
 * Registra una muerte
 */
export function registrarDeath() {
  estadisticasJuego.deaths++;
}

/**
 * Registra un disparo
 */
export function registrarDisparo() {
  estadisticasJuego.shotsFired++;
}

/**
 * Registra un impacto
 */
export function registrarImpacto() {
  estadisticasJuego.shotsHit++;
}

/**
 * Verifica si el menú está activo
 */
export function estaMenuActivo() {
  return menuActivo;
}

// Sistema de FPS Counter
let fpsHistory = [];
let lastFpsUpdate = 0;

/**
 * Inicializa el contador de FPS
 */
function inicializarContadorFPS() {
  actualizarFPS();
}

/**
 * Actualiza el contador de FPS
 */
function actualizarFPS() {
  const ahora = performance.now();
  
  // Calcular FPS basado en el tiempo entre frames
  if (lastFpsUpdate > 0) {
    const fps = 1000 / (ahora - lastFpsUpdate);
    fpsHistory.push(fps);
    
    // Mantener solo los últimos 60 valores (1 segundo a 60fps)
    if (fpsHistory.length > 60) {
      fpsHistory.shift();
    }
    
    // Calcular promedio
    const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
    
    // Actualizar display cada 10 frames
    if (fpsHistory.length % 10 === 0 && elementos.fpsValue) {
      elementos.fpsValue.textContent = Math.round(avgFps);
    }
  }
  
  lastFpsUpdate = ahora;
  requestAnimationFrame(actualizarFPS);
}

/**
 * Reinicia las estadísticas
 */
export function reiniciarEstadisticas() {
  estadisticasJuego = {
    kills: 0,
    deaths: 0,
    shotsFired: 0,
    shotsHit: 0,
    startTime: Date.now(),
    playtime: 0
  };
}