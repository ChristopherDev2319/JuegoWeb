/**
 * UI de Estadísticas de Entrenamiento
 * Muestra contador de eliminaciones y zona actual durante el modo local
 * 
 * Requirements: 6.1, 6.2, 4.4
 */

// Estado interno del UI
let panelEstadisticas = null;
let indicadorZona = null;
let timeoutZona = null;

// Cache de elementos DOM para optimización
let cachedStatEstaticos = null;
let cachedStatMoviles = null;
let cachedStatTiradores = null;
let cachedStatTotal = null;

// Cache de valores anteriores para evitar actualizaciones innecesarias
let lastStats = { estaticos: -1, moviles: -1, tiradores: -1, total: -1 };

/**
 * Inicializa el UI de estadísticas de entrenamiento
 * Requirement 6.1: Mostrar contador de bots eliminados
 */
export function inicializarEntrenamientoUI() {
  crearPanelEstadisticas();
  crearIndicadorZona();
  // Cachear elementos después de crear el panel
  cachedStatEstaticos = document.getElementById('stat-estaticos');
  cachedStatMoviles = document.getElementById('stat-moviles');
  cachedStatTiradores = document.getElementById('stat-tiradores');
  cachedStatTotal = document.getElementById('stat-total');
  console.log('✅ UI de entrenamiento inicializado');
}

/**
 * Crea el panel de estadísticas de entrenamiento
 * Diseño minimalista y compacto en esquina superior izquierda
 * Requirements: 6.1, 6.2
 */
function crearPanelEstadisticas() {
  // Verificar si ya existe
  if (document.getElementById('training-stats-panel')) {
    panelEstadisticas = document.getElementById('training-stats-panel');
    return;
  }

  panelEstadisticas = document.createElement('div');
  panelEstadisticas.id = 'training-stats-panel';
  panelEstadisticas.className = 'training-stats-minimal';
  panelEstadisticas.innerHTML = `
    <div class="training-row">
      <span class="training-label">🔴</span>
      <span class="training-value" id="stat-estaticos">0</span>
    </div>
    <div class="training-row">
      <span class="training-label">🔵</span>
      <span class="training-value" id="stat-moviles">0</span>
    </div>
    <div class="training-row">
      <span class="training-label">🟠</span>
      <span class="training-value" id="stat-tiradores">0</span>
    </div>
    <div class="training-divider"></div>
    <div class="training-row total">
      <span class="training-label">⚔️</span>
      <span class="training-value" id="stat-total">0</span>
    </div>
  `;

  document.body.appendChild(panelEstadisticas);
}

/**
 * Crea el indicador de zona actual
 * Requirement 4.4: Mostrar nombre de zona cuando el jugador entra
 */
function crearIndicadorZona() {
  // Verificar si ya existe
  if (document.getElementById('zone-indicator')) {
    indicadorZona = document.getElementById('zone-indicator');
    return;
  }

  indicadorZona = document.createElement('div');
  indicadorZona.id = 'zone-indicator';
  indicadorZona.className = 'zone-indicator hidden';
  indicadorZona.innerHTML = `
    <span class="zone-icon">📍</span>
    <span class="zone-name" id="zone-name">Zona</span>
  `;

  document.body.appendChild(indicadorZona);
}

/**
 * Actualiza las estadísticas mostradas en el panel
 * Requirement 6.2: Incrementar contador cuando se elimina un bot
 * OPTIMIZADO: Usa cache de elementos DOM y solo actualiza si los valores cambiaron
 * 
 * @param {Object} estadisticas - Objeto con las estadísticas de entrenamiento
 */
export function actualizarEstadisticasUI(estadisticas) {
  if (!panelEstadisticas) return;

  const { eliminaciones, totalEliminaciones } = estadisticas;

  // Solo actualizar si los valores cambiaron
  if (eliminaciones.estaticos !== lastStats.estaticos) {
    if (cachedStatEstaticos) {
      actualizarConAnimacion(cachedStatEstaticos, eliminaciones.estaticos);
    }
    lastStats.estaticos = eliminaciones.estaticos;
  }
  
  if (eliminaciones.moviles !== lastStats.moviles) {
    if (cachedStatMoviles) {
      actualizarConAnimacion(cachedStatMoviles, eliminaciones.moviles);
    }
    lastStats.moviles = eliminaciones.moviles;
  }
  
  if (eliminaciones.tiradores !== lastStats.tiradores) {
    if (cachedStatTiradores) {
      actualizarConAnimacion(cachedStatTiradores, eliminaciones.tiradores);
    }
    lastStats.tiradores = eliminaciones.tiradores;
  }
  
  if (totalEliminaciones !== lastStats.total) {
    if (cachedStatTotal) {
      actualizarConAnimacion(cachedStatTotal, totalEliminaciones);
    }
    lastStats.total = totalEliminaciones;
  }
}

/**
 * Actualiza un elemento con animación si el valor cambió
 * @param {HTMLElement} elemento - Elemento a actualizar
 * @param {number} nuevoValor - Nuevo valor a mostrar
 */
function actualizarConAnimacion(elemento, nuevoValor) {
  const valorActual = parseInt(elemento.textContent) || 0;
  
  if (valorActual !== nuevoValor) {
    elemento.textContent = nuevoValor;
    // Animación de pulso
    elemento.style.transform = 'scale(1.3)';
    elemento.style.transition = 'transform 0.15s ease-out';
    
    setTimeout(() => {
      elemento.style.transform = 'scale(1)';
    }, 150);
  }
}

/**
 * Muestra el indicador de zona cuando el jugador entra
 * Requirement 4.4: Mostrar nombre de zona cuando el jugador entra
 * 
 * @param {string} nombreZona - Nombre de la zona
 * @param {string} tipoZona - Tipo de zona ('estatico', 'movil', 'tirador')
 */
export function mostrarIndicadorZona(nombreZona, tipoZona) {
  if (!indicadorZona) return;

  // Limpiar timeout anterior si existe
  if (timeoutZona) {
    clearTimeout(timeoutZona);
  }

  // Actualizar contenido
  const zoneNameElement = document.getElementById('zone-name');
  const zoneIconElement = indicadorZona.querySelector('.zone-icon');
  
  if (zoneNameElement) {
    zoneNameElement.textContent = nombreZona;
  }

  // Cambiar icono según tipo de zona
  if (zoneIconElement) {
    switch (tipoZona) {
      case 'estatico':
        zoneIconElement.innerHTML = '<i data-lucide="target"></i>';
        break;
      case 'movil':
        zoneIconElement.textContent = '🏃';
        break;
      case 'tirador':
        zoneIconElement.innerHTML = '<i data-lucide="swords"></i>';
        break;
      default:
        zoneIconElement.textContent = '📍';
    }
  }

  // Mostrar indicador
  indicadorZona.classList.remove('hidden');
  indicadorZona.classList.add('visible');

  // Ocultar después de 3 segundos
  timeoutZona = setTimeout(() => {
    ocultarIndicadorZona();
  }, 3000);
}

/**
 * Oculta el indicador de zona
 */
export function ocultarIndicadorZona() {
  if (!indicadorZona) return;
  
  indicadorZona.classList.remove('visible');
  indicadorZona.classList.add('hidden');
}

/**
 * Muestra el panel de estadísticas
 */
export function mostrarPanelEstadisticas() {
  if (panelEstadisticas) {
    panelEstadisticas.style.display = 'block';
  }
}

/**
 * Oculta el panel de estadísticas
 */
export function ocultarPanelEstadisticas() {
  if (panelEstadisticas) {
    panelEstadisticas.style.display = 'none';
  }
}

/**
 * Destruye el UI de entrenamiento
 */
export function destruirEntrenamientoUI() {
  if (panelEstadisticas && panelEstadisticas.parentNode) {
    panelEstadisticas.parentNode.removeChild(panelEstadisticas);
    panelEstadisticas = null;
  }
  
  if (indicadorZona && indicadorZona.parentNode) {
    indicadorZona.parentNode.removeChild(indicadorZona);
    indicadorZona = null;
  }
  
  if (timeoutZona) {
    clearTimeout(timeoutZona);
    timeoutZona = null;
  }
  
  // Limpiar cache
  cachedStatEstaticos = null;
  cachedStatMoviles = null;
  cachedStatTiradores = null;
  cachedStatTotal = null;
  lastStats = { estaticos: -1, moviles: -1, tiradores: -1, total: -1 };
}
