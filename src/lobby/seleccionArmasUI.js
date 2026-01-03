/**
 * Módulo de UI para el menú de selección de armas
 * Requirements: 1.1, 1.2, 1.4, 3.1
 * 
 * Proporciona la interfaz visual para que los jugadores seleccionen
 * su arma antes de entrar a la partida o al reaparecer.
 */

import { obtenerArmasDisponibles, seleccionarArma, estadoSeleccion } from '../sistemas/seleccionArmas.js';

// Referencias a elementos del DOM
let elementos = {
  contenedor: null,
  gridArmas: null,
  botonJugar: null,
  titulo: null
};

// Callbacks para eventos
let callbacks = {
  onJugar: null,
  onSeleccionar: null
};

// Estado interno de la UI
let armaSeleccionadaUI = null;
let menuInicializado = false;

/**
 * Inicializa la UI de selección de armas
 * Crea los elementos del DOM si no existen
 * 
 * @param {Object} cbs - Callbacks para eventos
 * @param {Function} cbs.onJugar - Callback cuando se presiona "Jugar"
 * @param {Function} cbs.onSeleccionar - Callback cuando se selecciona un arma
 */
export function inicializarSeleccionArmasUI(cbs = {}) {
  callbacks = { ...callbacks, ...cbs };
  
  // Crear elementos del DOM si no existen
  if (!document.getElementById('menu-seleccion-armas')) {
    crearElementosDOM();
  }
  
  // Cachear referencias
  cachearElementos();
  
  // Configurar eventos
  configurarEventos();
  
  menuInicializado = true;
}

/**
 * Crea los elementos del DOM para el menú de selección
 * @private
 */
function crearElementosDOM() {
  const contenedor = document.createElement('div');
  contenedor.id = 'menu-seleccion-armas';
  contenedor.className = 'menu-seleccion-armas hidden';
  
  contenedor.innerHTML = `
    <div class="seleccion-armas-overlay"></div>
    <div class="seleccion-armas-contenido">
      <h2 class="seleccion-armas-titulo">Selecciona tu Arma</h2>
      <div class="seleccion-armas-grid" id="grid-armas"></div>
      <button class="seleccion-armas-btn-jugar" id="btn-jugar-arma" disabled>
        <span class="btn-jugar-icono">🎮</span>
        <span class="btn-jugar-texto">Jugar</span>
      </button>
    </div>
  `;
  
  document.body.appendChild(contenedor);
}

/**
 * Cachea referencias a elementos del DOM
 * @private
 */
function cachearElementos() {
  elementos = {
    contenedor: document.getElementById('menu-seleccion-armas'),
    gridArmas: document.getElementById('grid-armas'),
    botonJugar: document.getElementById('btn-jugar-arma'),
    titulo: document.querySelector('.seleccion-armas-titulo')
  };
}

/**
 * Configura los eventos de los elementos
 * @private
 */
function configurarEventos() {
  // Evento del botón Jugar
  if (elementos.botonJugar) {
    elementos.botonJugar.addEventListener('click', () => {
      if (armaSeleccionadaUI && callbacks.onJugar) {
        callbacks.onJugar(armaSeleccionadaUI);
      }
    });
  }
}

/**
 * Genera las tarjetas de armas en el grid
 * @private
 */
function generarTarjetasArmas() {
  if (!elementos.gridArmas) return;
  
  // Limpiar grid existente
  elementos.gridArmas.innerHTML = '';
  
  // Obtener armas disponibles
  const armas = obtenerArmasDisponibles();
  
  // Crear tarjeta para cada arma
  armas.forEach(arma => {
    const tarjeta = crearTarjetaArma(arma);
    elementos.gridArmas.appendChild(tarjeta);
  });
}

/**
 * Crea una tarjeta de arma
 * @private
 * @param {Object} arma - Datos del arma
 * @returns {HTMLElement} - Elemento de la tarjeta
 */
function crearTarjetaArma(arma) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'tarjeta-arma';
  tarjeta.dataset.tipo = arma.tipo;
  
  // Calcular barras de stats (normalizar a porcentaje)
  const dañoPct = Math.min(100, (arma.stats.daño / 120) * 100);
  const cadenciaPct = Math.min(100, (arma.stats.cadencia / 800) * 100);
  const precisionPct = arma.stats.precision * 100;
  
  tarjeta.innerHTML = `
    <div class="tarjeta-arma-icono">${arma.icono}</div>
    <div class="tarjeta-arma-info">
      <h3 class="tarjeta-arma-nombre">${arma.nombre}</h3>
      <span class="tarjeta-arma-tipo">${arma.tipo}</span>
      <p class="tarjeta-arma-desc">${arma.descripcion}</p>
    </div>
    <div class="tarjeta-arma-stats">
      <div class="stat-bar">
        <span class="stat-bar-label">Daño</span>
        <div class="stat-bar-track">
          <div class="stat-bar-fill daño" style="width: ${dañoPct}%"></div>
        </div>
      </div>
      <div class="stat-bar">
        <span class="stat-bar-label">Cadencia</span>
        <div class="stat-bar-track">
          <div class="stat-bar-fill cadencia" style="width: ${cadenciaPct}%"></div>
        </div>
      </div>
      <div class="stat-bar">
        <span class="stat-bar-label">Precisión</span>
        <div class="stat-bar-track">
          <div class="stat-bar-fill precision" style="width: ${precisionPct}%"></div>
        </div>
      </div>
    </div>
  `;
  
  // Evento de click para seleccionar
  tarjeta.addEventListener('click', () => {
    seleccionarArmaUI(arma.tipo);
  });
  
  return tarjeta;
}

/**
 * Maneja la selección de un arma en la UI
 * @private
 * @param {string} tipoArma - Tipo de arma seleccionada
 */
function seleccionarArmaUI(tipoArma) {
  // Actualizar estado interno
  armaSeleccionadaUI = tipoArma;
  
  // Actualizar estado del módulo de selección
  seleccionarArma(tipoArma);
  
  // Actualizar visual
  actualizarSeleccionVisual(tipoArma);
  
  // Habilitar botón Jugar
  if (elementos.botonJugar) {
    elementos.botonJugar.disabled = false;
  }
  
  // Callback
  if (callbacks.onSeleccionar) {
    callbacks.onSeleccionar(tipoArma);
  }
}

/**
 * Muestra el menú de selección de armas
 * Requirements: 1.1, 3.1
 * 
 * @param {Object} opciones - Opciones de visualización
 * @param {boolean} opciones.esMuerte - Si se muestra por muerte del jugador
 * @param {string} opciones.armaPrevia - Arma previamente equipada (para preseleccionar)
 * @param {string} opciones.textoBoton - Texto personalizado para el botón
 */
export function mostrarMenuArmas(opciones = {}) {
  const { esMuerte = false, armaPrevia = null, textoBoton = null } = opciones;
  
  // Inicializar si no está listo
  if (!menuInicializado) {
    inicializarSeleccionArmasUI();
  }
  
  // Generar tarjetas de armas
  generarTarjetasArmas();
  
  // Actualizar título según contexto
  if (elementos.titulo) {
    elementos.titulo.textContent = esMuerte 
      ? 'Elige tu próxima arma' 
      : 'Selecciona tu Arma';
  }
  
  // Actualizar texto del botón
  if (elementos.botonJugar && textoBoton) {
    const textoSpan = elementos.botonJugar.querySelector('.btn-jugar-texto');
    if (textoSpan) {
      textoSpan.textContent = textoBoton;
    }
  }
  
  // Preseleccionar arma previa si existe
  if (armaPrevia) {
    armaSeleccionadaUI = armaPrevia;
    actualizarSeleccionVisual(armaPrevia);
    if (elementos.botonJugar) {
      elementos.botonJugar.disabled = false;
    }
  } else {
    // Resetear selección
    armaSeleccionadaUI = null;
    if (elementos.botonJugar) {
      elementos.botonJugar.disabled = true;
    }
  }
  
  // Mostrar menú
  if (elementos.contenedor) {
    elementos.contenedor.classList.remove('hidden');
    // Pequeño delay para animación
    requestAnimationFrame(() => {
      elementos.contenedor.classList.add('visible');
    });
  }
  
  // Actualizar estado
  estadoSeleccion.menuVisible = true;
}

/**
 * Oculta el menú de selección de armas
 */
export function ocultarMenuArmas() {
  if (elementos.contenedor) {
    elementos.contenedor.classList.remove('visible');
    // Esperar animación antes de ocultar
    setTimeout(() => {
      elementos.contenedor.classList.add('hidden');
    }, 300);
  }
  
  // Actualizar estado
  estadoSeleccion.menuVisible = false;
}

/**
 * Actualiza la selección visual de una tarjeta de arma
 * Requirements: 1.4 - Marcar arma seleccionada visualmente
 * 
 * @param {string} tipoArma - Tipo de arma a marcar como seleccionada
 */
export function actualizarSeleccionVisual(tipoArma) {
  if (!elementos.gridArmas) return;
  
  // Quitar selección de todas las tarjetas
  const tarjetas = elementos.gridArmas.querySelectorAll('.tarjeta-arma');
  tarjetas.forEach(tarjeta => {
    tarjeta.classList.remove('seleccionada');
  });
  
  // Marcar la tarjeta seleccionada
  const tarjetaSeleccionada = elementos.gridArmas.querySelector(
    `.tarjeta-arma[data-tipo="${tipoArma}"]`
  );
  if (tarjetaSeleccionada) {
    tarjetaSeleccionada.classList.add('seleccionada');
  }
}

/**
 * Muestra/oculta el botón de reaparecer
 * @param {boolean} visible - Si el botón debe ser visible
 */
export function mostrarBotonReaparecer(visible) {
  if (elementos.botonJugar) {
    const textoSpan = elementos.botonJugar.querySelector('.btn-jugar-texto');
    if (textoSpan) {
      textoSpan.textContent = visible ? 'Reaparecer' : 'Jugar';
    }
    
    // Si hay arma seleccionada, habilitar el botón
    if (visible && armaSeleccionadaUI) {
      elementos.botonJugar.disabled = false;
    }
  }
}

/**
 * Obtiene el arma actualmente seleccionada en la UI
 * @returns {string|null} - Tipo de arma seleccionada
 */
export function obtenerArmaSeleccionadaUI() {
  return armaSeleccionadaUI;
}

/**
 * Verifica si el menú está visible
 * @returns {boolean}
 */
export function menuEstaVisible() {
  return elementos.contenedor && 
         !elementos.contenedor.classList.contains('hidden');
}

/**
 * Actualiza el callback de jugar
 * @param {Function} callback - Nuevo callback
 */
export function setOnJugar(callback) {
  callbacks.onJugar = callback;
}

/**
 * Actualiza el callback de selección
 * @param {Function} callback - Nuevo callback
 */
export function setOnSeleccionar(callback) {
  callbacks.onSeleccionar = callback;
}

// ============================================
// Funciones para pantalla de muerte
// Requirements: 3.1, 3.3, 4.2, 4.3
// ============================================

// Estado del menú de muerte
let menuMuerteInicializado = false;
let callbackSeleccionMuerte = null;

/**
 * Genera el grid de armas para la pantalla de muerte
 * Requirements: 3.1 - Mostrar menú de selección de armas en pantalla de muerte
 * 
 * @param {string} armaPrevia - Arma previamente equipada (para preseleccionar)
 * @param {Function} onSeleccionar - Callback cuando se selecciona un arma
 */
export function generarGridArmasMuerte(armaPrevia = null, onSeleccionar = null) {
  const contenedor = document.getElementById('death-weapon-selection');
  if (!contenedor) return;
  
  callbackSeleccionMuerte = onSeleccionar;
  
  // Obtener armas disponibles
  const armas = obtenerArmasDisponibles();
  
  // Crear HTML del grid
  contenedor.innerHTML = `
    <div class="death-weapon-title">Elige tu próxima arma</div>
    <div class="death-weapon-grid" id="death-weapon-grid"></div>
  `;
  
  const grid = document.getElementById('death-weapon-grid');
  if (!grid) return;
  
  // Crear tarjeta para cada arma
  armas.forEach(arma => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'death-weapon-card';
    tarjeta.dataset.tipo = arma.tipo;
    
    // Preseleccionar arma previa
    // Requirements: 4.3 - Mantener arma previa como selección por defecto
    if (armaPrevia && arma.tipo === armaPrevia) {
      tarjeta.classList.add('seleccionada');
      armaSeleccionadaUI = armaPrevia;
    }
    
    tarjeta.innerHTML = `
      <span class="weapon-icon">${arma.icono}</span>
      <span class="weapon-name">${arma.nombre}</span>
    `;
    
    // Evento de click para seleccionar
    // Requirements: 3.3 - Actualizar arma equipada para el próximo respawn
    tarjeta.addEventListener('click', () => {
      seleccionarArmaEnMuerte(arma.tipo);
    });
    
    grid.appendChild(tarjeta);
  });
  
  menuMuerteInicializado = true;
}

/**
 * Maneja la selección de un arma en la pantalla de muerte
 * Requirements: 3.3 - Actualizar arma equipada para el próximo respawn
 * @private
 * @param {string} tipoArma - Tipo de arma seleccionada
 */
function seleccionarArmaEnMuerte(tipoArma) {
  // Actualizar estado interno
  armaSeleccionadaUI = tipoArma;
  
  // Actualizar estado del módulo de selección
  seleccionarArma(tipoArma);
  
  // Actualizar visual en el grid de muerte
  actualizarSeleccionVisualMuerte(tipoArma);
  
  // Callback
  if (callbackSeleccionMuerte) {
    callbackSeleccionMuerte(tipoArma);
  }
  
  console.log(`🔫 Arma seleccionada para respawn: ${tipoArma}`);
}

/**
 * Actualiza la selección visual en el grid de muerte
 * @param {string} tipoArma - Tipo de arma a marcar como seleccionada
 */
export function actualizarSeleccionVisualMuerte(tipoArma) {
  const grid = document.getElementById('death-weapon-grid');
  if (!grid) return;
  
  // Quitar selección de todas las tarjetas
  const tarjetas = grid.querySelectorAll('.death-weapon-card');
  tarjetas.forEach(tarjeta => {
    tarjeta.classList.remove('seleccionada');
  });
  
  // Marcar la tarjeta seleccionada
  const tarjetaSeleccionada = grid.querySelector(
    `.death-weapon-card[data-tipo="${tipoArma}"]`
  );
  if (tarjetaSeleccionada) {
    tarjetaSeleccionada.classList.add('seleccionada');
  }
}

/**
 * Limpia el grid de armas de la pantalla de muerte
 */
export function limpiarGridArmasMuerte() {
  const contenedor = document.getElementById('death-weapon-selection');
  if (contenedor) {
    contenedor.innerHTML = '';
  }
  menuMuerteInicializado = false;
  callbackSeleccionMuerte = null;
}

/**
 * Verifica si el menú de muerte está inicializado
 * @returns {boolean}
 */
export function menuMuerteEstaInicializado() {
  return menuMuerteInicializado;
}
