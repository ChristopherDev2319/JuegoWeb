/**
 * Módulo de UI del Scoreboard
 * Muestra la lista de jugadores conectados con sus kills y corona para el líder
 * 
 * Requirements: 1.1, 1.4, 2.1, 3.1, 3.3
 */

/**
 * Estado del scoreboard
 * @type {{jugadores: Array<{id: string, nombre: string, kills: number}>, visible: boolean}}
 */
export const estadoScoreboard = {
  jugadores: [],
  visible: true
};

/**
 * Actualiza el estado del scoreboard con nuevos datos de jugadores
 * @param {Array<{id: string, nombre: string, kills: number}>} jugadores - Lista de jugadores ordenada
 */
export function actualizarScoreboard(jugadores) {
  if (!Array.isArray(jugadores)) {
    console.warn('actualizarScoreboard: jugadores debe ser un array');
    return;
  }
  estadoScoreboard.jugadores = jugadores;
  renderizarScoreboard();
}

/**
 * Obtiene el máximo de kills entre todos los jugadores
 * @returns {number} - El número máximo de kills, o 0 si no hay jugadores
 */
export function obtenerMaxKills() {
  if (estadoScoreboard.jugadores.length === 0) {
    return 0;
  }
  return Math.max(...estadoScoreboard.jugadores.map(j => j.kills));
}

/**
 * Verifica si un jugador con cierta cantidad de kills es líder (tiene corona)
 * Un jugador es líder si tiene el máximo de kills y ese máximo es mayor que 0
 * Requirements: 3.1, 3.3, 3.4
 * @param {number} kills - Kills del jugador a verificar
 * @returns {boolean} - true si el jugador debe mostrar corona
 */
export function esLider(kills) {
  const maxKills = obtenerMaxKills();
  // Solo mostrar corona si hay kills > 0 y el jugador tiene el máximo
  return maxKills > 0 && kills === maxKills;
}

/**
 * Renderiza el scoreboard en el DOM
 * Genera el HTML del panel con nombre, kills y corona para cada jugador
 * Requirements: 1.4, 2.1, 3.1
 */
export function renderizarScoreboard() {
  let panel = document.getElementById('scoreboard-panel');
  
  // Crear el panel si no existe
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'scoreboard-panel';
    panel.className = 'scoreboard-panel';
    document.body.appendChild(panel);
  }
  
  // Si no hay jugadores, mostrar mensaje
  if (estadoScoreboard.jugadores.length === 0) {
    panel.innerHTML = '<div class="scoreboard-empty">Sin jugadores</div>';
    return;
  }
  
  // Generar HTML para cada jugador
  const entriesHTML = estadoScoreboard.jugadores.map(jugador => {
    const corona = esLider(jugador.kills) ? '<span class="scoreboard-crown">👑</span>' : '';
    return `
      <div class="scoreboard-entry">
        ${corona}
        <span class="scoreboard-nombre">${jugador.nombre}</span>
        <span class="scoreboard-kills">${jugador.kills}</span>
      </div>
    `;
  }).join('');
  
  panel.innerHTML = `
    <div class="scoreboard-header">SCOREBOARD</div>
    ${entriesHTML}
  `;
}

/**
 * Muestra u oculta el scoreboard
 * @param {boolean} visible - true para mostrar, false para ocultar
 */
export function setVisibilidad(visible) {
  estadoScoreboard.visible = visible;
  const panel = document.getElementById('scoreboard-panel');
  if (panel) {
    panel.style.display = visible ? 'block' : 'none';
  }
}
