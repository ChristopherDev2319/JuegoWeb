/**
 * Módulo de utilidades de interfaz de usuario
 * Contiene funciones para actualizar elementos de la UI del juego
 */

/**
 * Actualiza el display de munición
 * @param {Object} arma - Estado del arma con currentAmmo, totalAmmo, isReloading
 */
export function actualizarMunicion(arma) {
  const ammoDiv = document.getElementById('ammo');
  if (!ammoDiv) return;

  if (arma.isReloading) {
    ammoDiv.textContent = 'RECARGANDO...';
    ammoDiv.style.color = '#ffaa00';
  } else {
    ammoDiv.textContent = `${arma.currentAmmo} / ${arma.totalAmmo}`;
    ammoDiv.style.color = arma.currentAmmo <= 5 ? '#ff0000' : 'white';
  }
}

/**
 * Actualiza el display de cargas de dash
 * @param {Object} sistemaDash - Estado del sistema dash
 */
export function actualizarCargasDash(sistemaDash) {
  const icons = document.querySelectorAll('.dash-icon');
  if (!icons.length) return;

  for (let i = 0; i < icons.length; i++) {
    if (i < sistemaDash.currentCharges) {
      icons[i].className = 'dash-icon';
    } else if (sistemaDash.rechargingCharges[i]) {
      icons[i].className = 'dash-icon recharging';
    } else {
      icons[i].className = 'dash-icon empty';
    }
  }
}

/**
 * Muestra indicador de daño causado
 * @param {number} cantidad - Cantidad de daño a mostrar
 */
export function mostrarIndicadorDaño(cantidad) {
  const indicator = document.getElementById('damage-indicator');
  if (!indicator) return;

  indicator.textContent = `-${cantidad}`;
  indicator.style.opacity = '1';

  setTimeout(() => {
    indicator.style.opacity = '0';
  }, 500);
}

/**
 * Show connection status message
 * @param {string} mensaje - Message to display
 * @param {boolean} esError - Whether this is an error message
 */
export function mostrarMensajeConexion(mensaje, esError = false) {
  let overlay = document.getElementById('connection-overlay');
  
  if (!overlay) {
    // Create overlay if it doesn't exist
    overlay = document.createElement('div');
    overlay.id = 'connection-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: Arial, sans-serif;
    `;
    
    const messageBox = document.createElement('div');
    messageBox.id = 'connection-message';
    messageBox.style.cssText = `
      color: white;
      font-size: 24px;
      text-align: center;
      padding: 20px;
    `;
    
    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
  }
  
  const messageBox = document.getElementById('connection-message');
  if (messageBox) {
    messageBox.textContent = mensaje;
    messageBox.style.color = esError ? '#ff4444' : 'white';
  }
  
  overlay.style.display = 'flex';
}

/**
 * Hide connection status message
 */
export function ocultarMensajeConexion() {
  const overlay = document.getElementById('connection-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// Death screen state
let respawnTimerInterval = null;

/**
 * Show death screen with killer info and respawn countdown
 * Requirements: 3.5, 5.4, 5.5
 * @param {string} killerId - ID of the player who killed the local player
 * @param {number} respawnTime - Time until respawn in milliseconds (default 5000)
 */
export function mostrarPantallaMuerte(killerId, respawnTime = 5000) {
  const deathScreen = document.getElementById('death-screen');
  const killerName = document.getElementById('killer-name');
  const respawnTimer = document.getElementById('respawn-timer');
  
  if (!deathScreen) return;
  
  // Set killer name
  if (killerName) {
    killerName.textContent = killerId || 'Desconocido';
  }
  
  // Show death screen
  deathScreen.classList.remove('hidden');
  
  // Start countdown
  let timeLeft = Math.ceil(respawnTime / 1000);
  if (respawnTimer) {
    respawnTimer.textContent = timeLeft;
  }
  
  // Clear any existing interval
  if (respawnTimerInterval) {
    clearInterval(respawnTimerInterval);
  }
  
  // Update countdown every second
  respawnTimerInterval = setInterval(() => {
    timeLeft--;
    if (respawnTimer) {
      respawnTimer.textContent = Math.max(0, timeLeft);
    }
    
    if (timeLeft <= 0) {
      clearInterval(respawnTimerInterval);
      respawnTimerInterval = null;
    }
  }, 1000);
}

/**
 * Hide death screen (on respawn)
 * Requirement: 5.5
 */
export function ocultarPantallaMuerte() {
  const deathScreen = document.getElementById('death-screen');
  
  if (deathScreen) {
    deathScreen.classList.add('hidden');
  }
  
  // Clear countdown interval
  if (respawnTimerInterval) {
    clearInterval(respawnTimerInterval);
    respawnTimerInterval = null;
  }
}

/**
 * Add entry to kill feed
 * Requirements: 5.3, 5.4
 * @param {string} killerId - ID of the killer
 * @param {string} victimId - ID of the victim
 * @param {string} localPlayerId - ID of the local player (to highlight)
 */
export function agregarEntradaKillFeed(killerId, victimId, localPlayerId = null) {
  const killFeed = document.getElementById('kill-feed');
  if (!killFeed) return;
  
  const entry = document.createElement('div');
  entry.className = 'kill-entry';
  
  // Format killer name
  const killerDisplay = killerId === localPlayerId ? 'Tú' : killerId;
  const victimDisplay = victimId === localPlayerId ? 'Tú' : victimId;
  
  // Highlight if local player is involved
  const killerClass = killerId === localPlayerId ? 'killer you' : 'killer';
  const victimClass = victimId === localPlayerId ? 'victim you' : 'victim';
  
  entry.innerHTML = `
    <span class="${killerClass}">${killerDisplay}</span>
    <span class="weapon-icon">🔫</span>
    <span class="${victimClass}">${victimDisplay}</span>
  `;
  
  // Add to top of kill feed
  killFeed.insertBefore(entry, killFeed.firstChild);
  
  // Remove entry after 5 seconds
  setTimeout(() => {
    if (entry.parentNode) {
      entry.remove();
    }
  }, 5000);
  
  // Limit kill feed to 5 entries
  while (killFeed.children.length > 5) {
    killFeed.removeChild(killFeed.lastChild);
  }
}

/**
 * Update health bar display
 * @param {number} currentHealth - Current health value
 * @param {number} maxHealth - Maximum health value (default 200)
 */
export function actualizarBarraVida(currentHealth, maxHealth = 200) {
  const healthBar = document.getElementById('health-bar');
  const healthText = document.getElementById('health-text');
  
  if (!healthBar) return;
  
  const healthPercent = Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
  
  // Update bar width
  healthBar.style.width = `${healthPercent}%`;
  
  // Update bar color based on health level
  healthBar.classList.remove('low', 'medium');
  if (healthPercent <= 25) {
    healthBar.classList.add('low');
  } else if (healthPercent <= 50) {
    healthBar.classList.add('medium');
  }
  
  // Update text
  if (healthText) {
    healthText.textContent = `${Math.round(currentHealth)} / ${maxHealth}`;
  }
}

/**
 * Show damage flash effect on screen
 */
export function mostrarEfectoDaño() {
  let flash = document.getElementById('damage-flash');
  
  // Create flash element if it doesn't exist
  if (!flash) {
    flash = document.createElement('div');
    flash.id = 'damage-flash';
    document.body.appendChild(flash);
  }
  
  // Trigger flash
  flash.classList.add('active');
  
  // Remove flash after short delay
  setTimeout(() => {
    flash.classList.remove('active');
  }, 150);
}


/**
 * Show floating damage number when hitting an enemy
 * Requirements: 5.3
 * @param {number} damage - Amount of damage dealt
 */
export function mostrarDañoCausado(damage) {
  const indicator = document.createElement('div');
  indicator.className = 'damage-dealt-indicator';
  indicator.textContent = `+${damage}`;
  
  // Random horizontal offset for variety
  const offsetX = (Math.random() - 0.5) * 100;
  indicator.style.cssText = `
    position: fixed;
    top: 40%;
    left: calc(50% + ${offsetX}px);
    transform: translateX(-50%);
    color: #ffff00;
    font-size: 28px;
    font-weight: bold;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    pointer-events: none;
    z-index: 850;
    animation: floatUp 1s ease-out forwards;
  `;
  
  document.body.appendChild(indicator);
  
  // Remove after animation
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.remove();
    }
  }, 1000);
}
