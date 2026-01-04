/**
 * Módulo de utilidades de interfaz de usuario
 * Contiene funciones para actualizar elementos de la UI del juego
 * 
 * NOTA: Los valores de munición y estado de arma se reciben del servidor.
 * El cliente NO calcula estos valores localmente - solo los muestra.
 * Requisitos: 2.4
 */

/**
 * Actualiza el display de munición con valores del servidor
 * NOTA: Los valores de munición son autoritativos del servidor
 * Requirements: 4.1, 4.2 - Ocultar contador cuando cuchillo está equipado
 * 
 * @param {Object} estadoMunicion - Estado de munición recibido del servidor
 * @param {number} estadoMunicion.currentAmmo - Munición actual en cargador (del servidor)
 * @param {number} estadoMunicion.totalAmmo - Munición total de reserva (del servidor)
 * @param {boolean} estadoMunicion.isReloading - Si está recargando (del servidor)
 * @param {number} [estadoMunicion.municionActual] - Alias en español para currentAmmo
 * @param {number} [estadoMunicion.municionTotal] - Alias en español para totalAmmo
 * @param {boolean} [estadoMunicion.estaRecargando] - Alias en español para isReloading
 * @param {boolean} [estadoMunicion.esCuchillo] - Si el arma actual es el cuchillo
 * @param {string} [estadoMunicion.tipoArma] - Tipo de arma actual
 */
export function actualizarMunicion(estadoMunicion) {
  const ammoDiv = document.getElementById('ammo');
  if (!ammoDiv) return;

  // Verificar si es cuchillo - ocultar munición
  // Requirements: 4.1, 4.2 - Ocultar contador de munición cuando cuchillo está equipado
  const esCuchillo = estadoMunicion.esCuchillo || estadoMunicion.tipoArma === 'KNIFE';
  if (esCuchillo) {
    ammoDiv.classList.add('hidden');
    return;
  } else {
    ammoDiv.classList.remove('hidden');
  }

  // Soportar tanto nombres en inglés (del servidor) como español (del cliente)
  const estaRecargando = estadoMunicion.isReloading || estadoMunicion.estaRecargando;
  
  if (estaRecargando) {
    ammoDiv.textContent = 'RECARGANDO...';
    ammoDiv.style.color = '#ffaa00';
  } else {
    // Valores del servidor tienen prioridad
    const municionActual = estadoMunicion.currentAmmo ?? estadoMunicion.municionActual ?? 0;
    const municionTotal = estadoMunicion.totalAmmo ?? estadoMunicion.municionTotal ?? 0;
    ammoDiv.textContent = `${municionActual} / ${municionTotal}`;
    ammoDiv.style.color = municionActual <= 5 ? '#ff0000' : 'white';
  }
}

/**
 * Actualiza el display del arma actual
 * NOTA: Los valores de munición vienen del servidor
 * Requirements: 4.3, 4.4, 4.5 - UI de munición con slots intercambiables
 * 
 * @param {Object} estadoArma - Estado completo del arma (combinación de visual local + munición del servidor)
 */
export function actualizarInfoArma(estadoArma) {
  // Verificar si es cuchillo
  const esCuchillo = estadoArma.tipoActual === 'KNIFE' || estadoArma.esCuchillo;
  
  // Actualizar nombre del arma (valor visual local)
  const weaponNameDiv = document.getElementById('weapon-name');
  if (weaponNameDiv && estadoArma.nombre) {
    let nombreTexto = estadoArma.nombre;
    if (estadoArma.estaApuntando) {
      nombreTexto += ' [APUNTANDO]';
    }
    weaponNameDiv.textContent = nombreTexto;
    
    // Cambiar color si está apuntando
    weaponNameDiv.style.color = estadoArma.estaApuntando ? '#00ff00' : '#ffaa00';
  }

  // Actualizar munición (valores del servidor) - incluir info de cuchillo
  actualizarMunicion({
    ...estadoArma,
    esCuchillo: esCuchillo,
    tipoArma: estadoArma.tipoActual
  });

  // Actualizar slots de arma
  // Requirements: 4.3, 4.4, 4.5 - Slots intercambiables
  const armaSecundaria = esCuchillo ? estadoArma.armaPrincipalPrevia : 'Cuchillo';
  actualizarSlotsArma(estadoArma.nombre, armaSecundaria, esCuchillo);

  // Actualizar crosshair
  actualizarCrosshair(estadoArma);
}

/**
 * Actualiza el crosshair basado en el estado de apuntado
 * @param {Object} estadoArma - Estado del arma
 */
export function actualizarCrosshair(estadoArma) {
  const crosshair = document.getElementById('crosshair');
  const aimIndicator = document.getElementById('aim-indicator');
  
  if (crosshair) {
    if (estadoArma.estaApuntando) {
      // Crosshair más pequeño y preciso al apuntar
      crosshair.style.transform = 'translate(-50%, -50%) scale(0.5)';
      crosshair.style.backgroundColor = '#00ff00';
      crosshair.style.boxShadow = '0 0 0 1px rgba(0, 255, 0, 0.8)';
      crosshair.classList.add('aiming');
    } else {
      // Crosshair normal
      crosshair.style.transform = 'translate(-50%, -50%) scale(1)';
      crosshair.style.backgroundColor = 'white';
      crosshair.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.5)';
      crosshair.classList.remove('aiming');
    }
  }
  
  if (aimIndicator) {
    if (estadoArma.estaApuntando) {
      aimIndicator.classList.add('active');
    } else {
      aimIndicator.classList.remove('active');
    }
  }
}



/**
 * Muestra notificación de cambio de arma
 * @param {string} nombreArma - Nombre del arma seleccionada
 */
export function mostrarCambioArma(nombreArma) {
  let notification = document.getElementById('weapon-change-notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'weapon-change-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-size: 18px;
      font-weight: bold;
      z-index: 900;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(notification);
  }

  notification.textContent = `Arma: ${nombreArma}`;
  notification.style.opacity = '1';

  // Ocultar después de 2 segundos
  setTimeout(() => {
    notification.style.opacity = '0';
  }, 2000);
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
      z-index: 10000;
      font-family: Arial, sans-serif;
      cursor: pointer;
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
    
    // Click para reconectar
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Recargar la página para reconectar
      window.location.reload();
    });
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
let puedeReaparecer = false;
let callbackReaparecer = null;
let callbackSeleccionarArma = null;

/**
 * Show death screen with killer info, weapon selection, and respawn countdown
 * Requirements: 3.1, 3.2, 3.4 - Mostrar pantalla de muerte con menú de selección de armas
 * Requirements: 4.2 - Mostrar nombre de lobby del asesino en pantalla de muerte
 * @param {string} killerName - Nombre de lobby del jugador que eliminó al jugador local
 * @param {number} respawnTime - Time until respawn in milliseconds (default 5000)
 * @param {Object} opciones - Opciones adicionales
 * @param {string} opciones.armaActual - Arma actualmente equipada (para preseleccionar)
 * @param {Function} opciones.onReaparecer - Callback cuando el jugador reaparece
 * @param {Function} opciones.onSeleccionarArma - Callback cuando se selecciona un arma
 */
export function mostrarPantallaMuerte(killerName, respawnTime = 5000, opciones = {}) {
  const { armaActual = null, onReaparecer = null, onSeleccionarArma = null } = opciones;
  
  // Guardar callbacks
  callbackReaparecer = onReaparecer;
  callbackSeleccionarArma = onSeleccionarArma;
  
  // Desactivar pointer lock al mostrar pantalla de muerte
  // Requirements: 3.2 - Desactivar pointer lock al mostrar pantalla de muerte
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
  
  const deathScreen = document.getElementById('death-screen');
  const killerNameElement = document.getElementById('killer-name');
  const respawnTimer = document.getElementById('respawn-timer');
  const botonReaparecer = document.getElementById('btn-reaparecer');
  
  if (!deathScreen) return;
  
  // Set killer name - usar nombre de lobby
  // Requirements: 4.2 - Mostrar nombre de lobby del asesino en pantalla de muerte
  if (killerNameElement) {
    killerNameElement.textContent = killerName || 'Desconocido';
  }
  
  // Reset respawn button state
  puedeReaparecer = false;
  if (botonReaparecer) {
    botonReaparecer.disabled = true;
    botonReaparecer.classList.add('disabled');
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
  // Requirements: 3.4 - Timer de 5 segundos para mostrar botón "Reaparecer"
  respawnTimerInterval = setInterval(() => {
    timeLeft--;
    if (respawnTimer) {
      respawnTimer.textContent = Math.max(0, timeLeft);
    }
    
    if (timeLeft <= 0) {
      clearInterval(respawnTimerInterval);
      respawnTimerInterval = null;
      
      // Habilitar botón de reaparecer después del timer
      puedeReaparecer = true;
      if (botonReaparecer) {
        botonReaparecer.disabled = false;
        botonReaparecer.classList.remove('disabled');
      }
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
  
  // Reset state
  puedeReaparecer = false;
  callbackReaparecer = null;
  callbackSeleccionarArma = null;
}

/**
 * Verifica si el jugador puede reaparecer
 * @returns {boolean}
 */
export function puedePulsarReaparecer() {
  return puedeReaparecer;
}

/**
 * Maneja el click en el botón de reaparecer
 * Requirements: 4.1 - Reaparecer al jugador con el arma actualmente equipada
 */
export function manejarClickReaparecer() {
  if (!puedeReaparecer) return;
  
  if (callbackReaparecer) {
    callbackReaparecer();
  }
  
  ocultarPantallaMuerte();
}

/**
 * Configura el callback de reaparecer
 * @param {Function} callback - Función a llamar cuando el jugador reaparece
 */
export function setCallbackReaparecer(callback) {
  callbackReaparecer = callback;
}

/**
 * Configura el callback de selección de arma en pantalla de muerte
 * @param {Function} callback - Función a llamar cuando se selecciona un arma
 */
export function setCallbackSeleccionarArma(callback) {
  callbackSeleccionarArma = callback;
}

/**
 * Add entry to kill feed
 * Requirements: 4.1, 4.3, 5.3, 5.4
 * @param {string} killerName - Nombre de lobby del asesino
 * @param {string} victimName - Nombre de lobby de la víctima
 * @param {string} localPlayerName - Nombre del jugador local (para resaltar)
 */
export function agregarEntradaKillFeed(killerName, victimName, localPlayerName = null) {
  const killFeed = document.getElementById('kill-feed');
  if (!killFeed) return;
  
  const entry = document.createElement('div');
  entry.className = 'kill-entry';
  
  // Usar nombres de lobby directamente
  // Requirements: 4.1, 4.3 - Usar nombres de lobby en kill feed
  const killerDisplay = killerName === localPlayerName ? 'Tú' : killerName;
  const victimDisplay = victimName === localPlayerName ? 'Tú' : victimName;
  
  // Highlight if local player is involved
  const killerClass = killerName === localPlayerName ? 'killer you' : 'killer';
  const victimClass = victimName === localPlayerName ? 'victim you' : 'victim';
  
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

// Estado de la barra de vida para interpolación suave
let targetHealth = 200;
let currentDisplayHealth = 200;
let healthAnimationFrame = null;
let cachedHealthBar = null;
let cachedHealthText = null;
let cachedMaxHealth = 200;

/**
 * Update health bar display with smooth interpolation
 * @param {number} currentHealth - Current health value
 * @param {number} maxHealth - Maximum health value (default 200)
 */
export function actualizarBarraVida(currentHealth, maxHealth = 200) {
  cachedHealthBar = document.getElementById('health-bar');
  cachedHealthText = document.getElementById('health-text');
  cachedMaxHealth = maxHealth;
  
  if (!cachedHealthBar) return;
  
  // Actualizar el objetivo
  targetHealth = currentHealth;
  
  // Iniciar animación si no está corriendo
  if (!healthAnimationFrame) {
    healthAnimationFrame = requestAnimationFrame(animarBarraVida);
  }
}

/**
 * Animate health bar smoothly towards target
 */
function animarBarraVida() {
  if (!cachedHealthBar) {
    healthAnimationFrame = null;
    return;
  }
  
  // Interpolar hacia el objetivo
  const diff = targetHealth - currentDisplayHealth;
  
  // Interpolar suavemente
  if (Math.abs(diff) > 0.5) {
    currentDisplayHealth += diff * 0.2;
  } else {
    currentDisplayHealth = targetHealth;
  }
  
  // Actualizar visual
  const healthPercent = Math.max(0, Math.min(100, (currentDisplayHealth / cachedMaxHealth) * 100));
  cachedHealthBar.style.width = `${healthPercent}%`;
  
  // Actualizar color basado en nivel de vida
  cachedHealthBar.classList.remove('low', 'medium');
  if (healthPercent <= 25) {
    cachedHealthBar.classList.add('low');
  } else if (healthPercent <= 50) {
    cachedHealthBar.classList.add('medium');
  }
  
  // Actualizar texto
  if (cachedHealthText) {
    cachedHealthText.textContent = `${Math.round(targetHealth)} / ${cachedMaxHealth}`;
  }
  
  // Continuar animación si no hemos llegado al objetivo
  if (Math.abs(targetHealth - currentDisplayHealth) > 0.5) {
    healthAnimationFrame = requestAnimationFrame(animarBarraVida);
  } else {
    healthAnimationFrame = null;
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

/**
 * Actualiza los slots de arma en la UI
 * Requirements: 4.3, 4.4, 4.5 - UI de munición con slots intercambiables
 * 
 * @param {string} armaEquipada - Nombre del arma actualmente equipada
 * @param {string} armaSecundaria - Nombre del arma secundaria (para mostrar con [Q])
 * @param {boolean} esCuchillo - Si el arma equipada es el cuchillo
 */
export function actualizarSlotsArma(armaEquipada, armaSecundaria, esCuchillo = false) {
  const slotSuperior = document.getElementById('weapon-slot-superior');
  const slotInferior = document.getElementById('weapon-slot-inferior');
  const weaponName = document.getElementById('weapon-name');
  const ammoDiv = document.getElementById('ammo');
  
  if (!slotSuperior || !slotInferior) return;
  
  // Actualizar slot superior (arma secundaria con [Q])
  const slotNombre = slotSuperior.querySelector('.slot-nombre');
  if (slotNombre) {
    slotNombre.textContent = armaSecundaria || 'Cuchillo';
  }
  
  // Mostrar/ocultar slot superior según si hay arma secundaria
  if (armaSecundaria) {
    slotSuperior.classList.remove('hidden');
  } else {
    slotSuperior.classList.add('hidden');
  }
  
  // Actualizar slot inferior (arma equipada)
  if (weaponName) {
    weaponName.textContent = armaEquipada || 'Sin arma';
  }
  
  // Ocultar munición si es cuchillo
  // Requirements: 4.1, 4.2 - Ocultar contador de munición cuando cuchillo está equipado
  if (ammoDiv) {
    if (esCuchillo) {
      ammoDiv.classList.add('hidden');
    } else {
      ammoDiv.classList.remove('hidden');
    }
  }
}

/**
 * Oculta el contador de munición
 * Requirements: 4.1 - Ocultar contador cuando cuchillo está equipado
 */
export function ocultarContadorMunicion() {
  const ammoDiv = document.getElementById('ammo');
  if (ammoDiv) {
    ammoDiv.classList.add('hidden');
  }
}

/**
 * Muestra el contador de munición
 * Requirements: 4.2 - Mostrar contador cuando arma principal está equipada
 */
export function mostrarContadorMunicion() {
  const ammoDiv = document.getElementById('ammo');
  if (ammoDiv) {
    ammoDiv.classList.remove('hidden');
  }
}


// Estado de la barra de curación
let barraCuracionVisible = false;

/**
 * Actualiza la barra de progreso de curación
 * Requirements: 3.1 - Mostrar barra de progreso o indicador visual durante curación
 * @param {number} progreso - Progreso de curación de 0 a 1
 */
export function actualizarBarraCuracion(progreso) {
  let container = document.getElementById('healing-bar-container');
  
  // Crear contenedor si no existe
  if (!container) {
    container = document.createElement('div');
    container.id = 'healing-bar-container';
    container.style.cssText = `
      position: fixed;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      width: 200px;
      height: 12px;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid rgba(0, 255, 100, 0.5);
      border-radius: 6px;
      overflow: hidden;
      z-index: 900;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;
    
    const barraProgreso = document.createElement('div');
    barraProgreso.id = 'healing-bar-progress';
    barraProgreso.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #00ff66 0%, #00cc55 50%, #00aa44 100%);
      border-radius: 4px;
      transition: width 0.1s ease;
      box-shadow: 0 0 10px rgba(0, 255, 100, 0.5);
    `;
    
    const textoProgreso = document.createElement('div');
    textoProgreso.id = 'healing-bar-text';
    textoProgreso.style.cssText = `
      position: absolute;
      top: -25px;
      left: 50%;
      transform: translateX(-50%);
      color: #00ff66;
      font-size: 14px;
      font-weight: bold;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
      white-space: nowrap;
    `;
    textoProgreso.textContent = '🧃 Curando...';
    
    container.appendChild(barraProgreso);
    container.appendChild(textoProgreso);
    document.body.appendChild(container);
  }
  
  // Mostrar contenedor
  if (!barraCuracionVisible) {
    container.style.opacity = '1';
    barraCuracionVisible = true;
  }
  
  // Actualizar progreso
  const barraProgreso = document.getElementById('healing-bar-progress');
  if (barraProgreso) {
    const porcentaje = Math.min(100, Math.max(0, progreso * 100));
    barraProgreso.style.width = `${porcentaje}%`;
  }
  
  // Actualizar texto con porcentaje
  const textoProgreso = document.getElementById('healing-bar-text');
  if (textoProgreso) {
    const porcentaje = Math.round(progreso * 100);
    textoProgreso.textContent = `🧃 Curando... ${porcentaje}%`;
  }
}

/**
 * Oculta la barra de progreso de curación
 * Requirements: 3.1 - Ocultar indicador cuando no está curando
 */
export function ocultarBarraCuracion() {
  if (!barraCuracionVisible) return;
  
  const container = document.getElementById('healing-bar-container');
  if (container) {
    container.style.opacity = '0';
  }
  barraCuracionVisible = false;
}
