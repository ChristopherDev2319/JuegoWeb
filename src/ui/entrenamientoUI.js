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

/**
 * Inicializa el UI de estadísticas de entrenamiento
 * Requirement 6.1: Mostrar contador de bots eliminados
 */
export function inicializarEntrenamientoUI() {
  crearPanelEstadisticas();
  crearIndicadorZona();
  console.log('✅ UI de entrenamiento inicializado');
}

/**
 * Crea el panel de estadísticas de entrenamiento
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
  panelEstadisticas.className = 'training-stats-panel';
  panelEstadisticas.innerHTML = `
    <div class="training-stats-header">
      <span class="training-stats-icon">🎯</span>
      <span class="training-stats-title">Entrenamiento</span>
    </div>
    <div class="training-stats-content">
      <div class="training-stat-row">
        <span class="stat-label">🔴 Estáticos</span>
        <span class="stat-value" id="stat-estaticos">0</span>
      </div>
      <div class="training-stat-row">
        <span class="stat-label">🔵 Móviles</span>
        <span class="stat-value" id="stat-moviles">0</span>
      </div>
      <div class="training-stat-row">
        <span class="stat-label">🟠 Tiradores</span>
        <span class="stat-value" id="stat-tiradores">0</span>
      </div>
      <div class="training-stat-divider"></div>
      <div class="training-stat-row total">
        <span class="stat-label">Total</span>
        <span class="stat-value" id="stat-total">0</span>
      </div>
      <div class="training-stat-row precision">
        <span class="stat-label">Precisión</span>
        <span class="stat-value" id="stat-precision">0%</span>
      </div>
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
 * 
 * @param {Object} estadisticas - Objeto con las estadísticas de entrenamiento
 */
export function actualizarEstadisticasUI(estadisticas) {
  if (!panelEstadisticas) return;

  const { eliminaciones, totalEliminaciones, precision } = estadisticas;

  // Actualizar contadores por tipo
  const statEstaticos = document.getElementById('stat-estaticos');
  const statMoviles = document.getElementById('stat-moviles');
  const statTiradores = document.getElementById('stat-tiradores');
  const statTotal = document.getElementById('stat-total');
  const statPrecision = document.getElementById('stat-precision');

  if (statEstaticos) {
    actualizarConAnimacion(statEstaticos, eliminaciones.estaticos);
  }
  if (statMoviles) {
    actualizarConAnimacion(statMoviles, eliminaciones.moviles);
  }
  if (statTiradores) {
    actualizarConAnimacion(statTiradores, eliminaciones.tiradores);
  }
  if (statTotal) {
    actualizarConAnimacion(statTotal, totalEliminaciones);
  }
  if (statPrecision) {
    statPrecision.textContent = `${precision.toFixed(1)}%`;
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
    elemento.classList.add('stat-updated');
    
    setTimeout(() => {
      elemento.classList.remove('stat-updated');
    }, 300);
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
        zoneIconElement.textContent = '🎯';
        break;
      case 'movil':
        zoneIconElement.textContent = '🏃';
        break;
      case 'tirador':
        zoneIconElement.textContent = '⚔️';
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
    panelEstadisticas.classList.add('visible');
  }
}

/**
 * Oculta el panel de estadísticas
 */
export function ocultarPanelEstadisticas() {
  if (panelEstadisticas) {
    panelEstadisticas.classList.remove('visible');
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
}
