/**
 * Módulo de utilidades de interfaz de usuario
 * Contiene funciones para actualizar elementos de la UI del juego
 * 
 * NOTA: Los valores de munición y estado de arma se reciben del servidor.
 * El cliente NO calcula estos valores localmente - solo los muestra.
 * Requisitos: 2.4
 * 
 * OPTIMIZACIÓN: Cache de elementos DOM para evitar queries repetidas
 * Requirements: 5.1 - Usar referencias DOM cacheadas en lugar de consultar cada frame
 */

// ============================================
// CACHE DE ELEMENTOS DOM - OPTIMIZACIÓN 5.1
// ============================================
let cachedAmmoDiv = null;
let cachedWeaponNameDiv = null;
let cachedCrosshair = null;
let cachedAimIndicator = null;
let cachedKillFeed = null;
let cachedSlotSuperior = null;
let cachedSlotInferior = null;
let cachedSlotNombre = null;

// Cache de estado anterior para actualizaciones condicionales - OPTIMIZACIÓN 5.2
let lastAmmoState = { currentAmmo: null, totalAmmo: null, isReloading: null, isHidden: null };
let lastCrosshairState = { estaApuntando: null };

/**
 * Inicializa el cache de elementos DOM
 * Debe llamarse una vez cuando el DOM esté listo
 * Requirements: 5.1 - Cache de referencias DOM
 */
export function inicializarCacheDOM() {
  cachedAmmoDiv = document.getElementById('ammo');
  cachedWeaponNameDiv = document.getElementById('weapon-name');
  cachedCrosshair = document.getElementById('crosshair');
  cachedAimIndicator = document.getElementById('aim-indicator');
  cachedKillFeed = document.getElementById('kill-feed');
  cachedSlotSuperior = document.getElementById('weapon-slot-superior');
  cachedSlotInferior = document.getElementById('weapon-slot-inferior');
  if (cachedSlotSuperior) {
    cachedSlotNombre = cachedSlotSuperior.querySelector('.slot-nombre');
  }
}

/**
 * Actualiza el display de munición con valores del servidor
 * NOTA: Los valores de munición son autoritativos del servidor
 * Requirements: 4.1, 4.2 - Ocultar contador cuando cuchillo está equipado
 * OPTIMIZADO: Cache de DOM y actualizaciones condicionales
 * Requirements: 5.1, 5.2
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
  // Usar cache o buscar elemento si no está cacheado
  if (!cachedAmmoDiv) {
    cachedAmmoDiv = document.getElementById('ammo');
  }
  if (!cachedAmmoDiv) return;

  // Verificar si es cuchillo o JuiceBox - ocultar munición
  // Requirements: 4.1, 4.2 - Ocultar contador de munición cuando cuchillo está equipado
  const esCuchillo = estadoMunicion.esCuchillo || estadoMunicion.tipoArma === 'KNIFE';
  const esJuiceBox = estadoMunicion.esJuiceBox;
  const shouldHide = esCuchillo || esJuiceBox;
  
  // OPTIMIZACIÓN 5.2: Solo actualizar DOM si el estado de visibilidad cambió
  if (lastAmmoState.isHidden !== shouldHide) {
    if (shouldHide) {
      cachedAmmoDiv.classList.add('hidden');
    } else {
      cachedAmmoDiv.classList.remove('hidden');
    }
    lastAmmoState.isHidden = shouldHide;
  }
  
  if (shouldHide) return;

  // Soportar tanto nombres en inglés (del servidor) como español (del cliente)
  const estaRecargando = estadoMunicion.isReloading || estadoMunicion.estaRecargando;
  const municionActual = estadoMunicion.currentAmmo ?? estadoMunicion.municionActual ?? 0;
  const municionTotal = estadoMunicion.totalAmmo ?? estadoMunicion.municionTotal ?? 0;
  
  // OPTIMIZACIÓN 5.2: Solo actualizar DOM si los valores cambiaron
  if (lastAmmoState.isReloading !== estaRecargando ||
      lastAmmoState.currentAmmo !== municionActual ||
      lastAmmoState.totalAmmo !== municionTotal) {
    
    if (estaRecargando) {
      cachedAmmoDiv.textContent = 'RECARGANDO...';
      cachedAmmoDiv.style.color = '#ffaa00';
    } else {
      cachedAmmoDiv.textContent = `${municionActual} / ${municionTotal}`;
      cachedAmmoDiv.style.color = municionActual <= 5 ? '#ff0000' : 'white';
    }
    
    lastAmmoState.isReloading = estaRecargando;
    lastAmmoState.currentAmmo = municionActual;
    lastAmmoState.totalAmmo = municionTotal;
  }
}

/**
 * Actualiza el display del arma actual
 * NOTA: Los valores de munición vienen del servidor
 * Requirements: 4.3, 4.4, 4.5 - UI de munición con slots intercambiables
 * OPTIMIZADO: Cache de DOM
 * Requirements: 5.1
 * 
 * @param {Object} estadoArma - Estado completo del arma (combinación de visual local + munición del servidor)
 */
export function actualizarInfoArma(estadoArma) {
  // Verificar si es cuchillo
  const esCuchillo = estadoArma.tipoActual === 'KNIFE' || estadoArma.esCuchillo;
  const esJuiceBox = estadoArma.esJuiceBox;
  
  // Usar cache o buscar elemento si no está cacheado
  if (!cachedWeaponNameDiv) {
    cachedWeaponNameDiv = document.getElementById('weapon-name');
  }
  
  // Actualizar nombre del arma (valor visual local)
  if (cachedWeaponNameDiv && estadoArma.nombre) {
    let nombreTexto = estadoArma.nombre;
    
    // Si el JuiceBox está equipado, mostrar "Botiquín"
    if (esJuiceBox) {
      nombreTexto = 'Botiquín';
    }
    
    if (estadoArma.estaApuntando) {
      nombreTexto += ' [APUNTANDO]';
    }
    cachedWeaponNameDiv.textContent = nombreTexto;
    
    // Cambiar color si está apuntando
    cachedWeaponNameDiv.style.color = estadoArma.estaApuntando ? '#00ff00' : '#ffaa00';
  }

  // Actualizar munición (valores del servidor) - incluir info de cuchillo y JuiceBox
  actualizarMunicion({
    ...estadoArma,
    esCuchillo: esCuchillo,
    esJuiceBox: esJuiceBox,
    tipoArma: estadoArma.tipoActual
  });

  // Actualizar slots de arma
  // Requirements: 4.3, 4.4, 4.5 - Slots intercambiables
  // Determinar qué mostrar en el slot intercambiable [Q]
  let armaSecundaria;
  if (esJuiceBox) {
    // Cuando tienes JuiceBox, Q siempre va al arma principal
    // Mostrar el nombre del arma principal en el slot
    armaSecundaria = estadoArma.armaPrincipal || estadoArma.armaPrincipalPrevia || 'M4A1';
    // Obtener el nombre legible del arma
    if (armaSecundaria && armaSecundaria !== 'Cuchillo' && armaSecundaria !== 'KNIFE') {
      // Es un tipo de arma, buscar su nombre en CONFIG si está disponible
      armaSecundaria = armaSecundaria; // Mantener el tipo como nombre por ahora
    }
  } else if (esCuchillo) {
    // Cuando tienes cuchillo, mostrar el arma principal
    armaSecundaria = estadoArma.armaPrincipalPrevia || estadoArma.armaPrincipal;
  } else {
    // Cuando tienes arma, mostrar "Cuchillo"
    armaSecundaria = 'Cuchillo';
  }
  
  const nombreArmaEquipada = esJuiceBox ? 'Botiquín' : estadoArma.nombre;
  actualizarSlotsArma(nombreArmaEquipada, armaSecundaria, esCuchillo);

  // Actualizar crosshair
  actualizarCrosshair(estadoArma);
}

/**
 * Actualiza el crosshair basado en el estado de apuntado
 * OPTIMIZADO: Cache de DOM y actualizaciones condicionales
 * Requirements: 5.1, 5.2
 * @param {Object} estadoArma - Estado del arma
 */
export function actualizarCrosshair(estadoArma) {
  // Usar cache o buscar elementos si no están cacheados
  if (!cachedCrosshair) {
    cachedCrosshair = document.getElementById('crosshair');
  }
  if (!cachedAimIndicator) {
    cachedAimIndicator = document.getElementById('aim-indicator');
  }
  
  // OPTIMIZACIÓN 5.2: Solo actualizar si el estado de apuntado cambió
  if (lastCrosshairState.estaApuntando === estadoArma.estaApuntando) {
    return;
  }
  lastCrosshairState.estaApuntando = estadoArma.estaApuntando;
  
  if (cachedCrosshair) {
    if (estadoArma.estaApuntando) {
      // Crosshair más pequeño y preciso al apuntar
      cachedCrosshair.style.transform = 'translate(-50%, -50%) scale(0.5)';
      cachedCrosshair.style.backgroundColor = '#00ff00';
      cachedCrosshair.style.boxShadow = '0 0 0 1px rgba(0, 255, 0, 0.8)';
      cachedCrosshair.classList.add('aiming');
    } else {
      // Crosshair normal
      cachedCrosshair.style.transform = 'translate(-50%, -50%) scale(1)';
      cachedCrosshair.style.backgroundColor = 'white';
      cachedCrosshair.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.5)';
      cachedCrosshair.classList.remove('aiming');
    }
  }
  
  if (cachedAimIndicator) {
    if (estadoArma.estaApuntando) {
      cachedAimIndicator.classList.add('active');
    } else {
      cachedAimIndicator.classList.remove('active');
    }
  }
}



/**
 * Muestra notificación de cambio de arma
 * Requirements: 3.4 - Notificación temporal con animación de fade
 * @param {string} nombreArma - Nombre del arma seleccionada
 */
export function mostrarCambioArma(nombreArma) {
  let notification = document.getElementById('weapon-change-notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'weapon-change-notification';
    document.body.appendChild(notification);
  }

  notification.textContent = `Arma: ${nombreArma}`;
  
  // Aplicar animación de entrada
  notification.style.animation = 'weaponNotificationIn 0.25s ease forwards';
  notification.classList.add('visible');

  // Ocultar después de 2 segundos con animación de salida
  setTimeout(() => {
    notification.style.animation = 'weaponNotificationOut 0.25s ease forwards';
    setTimeout(() => {
      notification.classList.remove('visible');
    }, 250);
  }, 2000);
}

// Cache para elementos de dash
let cachedDashContainer = null;
let cachedDashIcons = null;

/**
 * OLD actualizarCargasDash - DEPRECATED
 * Now using actualizarDashBox for the new dash-box UI
 * Keeping for backward compatibility but should not be used
 * Requirements: 2.6, 2.7, 2.8 - Estado visual de cargas de dash
 * OPTIMIZADO: Cache de elementos DOM
 * @param {Object} sistemaDash - Estado del sistema dash
 */
export function actualizarCargasDash(sistemaDash) {
  // OLD: This function targeted the deprecated #dash-charges element
  // Now using actualizarDashBox for the new #dash-box element
  // Keeping function signature for backward compatibility
  
  // Cachear elementos si no están cacheados
  if (!cachedDashContainer) {
    cachedDashContainer = document.getElementById('dash-charges');
  }
  if (!cachedDashContainer) return;
  
  // Cachear iconos si no están cacheados
  if (!cachedDashIcons) {
    const iconsContainer = cachedDashContainer.querySelector('.dash-icons-container');
    cachedDashIcons = iconsContainer 
      ? iconsContainer.querySelectorAll('.dash-icon') 
      : cachedDashContainer.querySelectorAll('.dash-icon');
  }
  
  if (!cachedDashIcons || !cachedDashIcons.length) return;

  // Soportar tanto nombres en inglés como español para compatibilidad
  const cargasActuales = sistemaDash.currentCharges ?? sistemaDash.cargasActuales ?? 0;
  const cargasRecargando = sistemaDash.rechargingCharges ?? sistemaDash.cargasRecargando ?? [];

  for (let i = 0; i < cachedDashIcons.length; i++) {
    const icon = cachedDashIcons[i];
    
    // Requirements: 2.8 - Indicador verde brillante cuando carga disponible
    if (i < cargasActuales) {
      // Carga disponible - solo cambiar si tiene clases incorrectas
      if (icon.classList.contains('recharging') || icon.classList.contains('empty')) {
        icon.classList.remove('recharging', 'empty');
      }
    }
    // Requirements: 2.7 - Indicador de progreso cuando se está recargando
    else if (cargasRecargando[i]) {
      if (!icon.classList.contains('recharging')) {
        icon.classList.remove('empty');
        icon.classList.add('recharging');
      }
    }
    // Requirements: 2.6 - Indicador vacío cuando no está disponible
    else {
      if (!icon.classList.contains('empty')) {
        icon.classList.remove('recharging');
        icon.classList.add('empty');
      }
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

// Constante para el límite máximo de entradas en el kill feed
// Requirements: 5.4 - Limitar entradas a 5 máximo
const KILL_FEED_MAX_ENTRIES = 5;

/**
 * Add entry to kill feed
 * Requirements: 4.1, 4.3, 5.3, 5.4
 * OPTIMIZADO: Cache de DOM y eliminación eficiente de entradas antiguas
 * Requirements: 5.1, 5.4
 * @param {string} killerName - Nombre de lobby del asesino
 * @param {string} victimName - Nombre de lobby de la víctima
 * @param {string} localPlayerName - Nombre del jugador local (para resaltar)
 */
export function agregarEntradaKillFeed(killerName, victimName, localPlayerName = null) {
  // Usar cache o buscar elemento si no está cacheado
  if (!cachedKillFeed) {
    cachedKillFeed = document.getElementById('kill-feed');
  }
  if (!cachedKillFeed) return;
  
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
    <span class="weapon-icon"><i data-lucide="skull"></i></span>
    <span class="${victimClass}">${victimDisplay}</span>
  `;
  
  // Add to top of kill feed
  cachedKillFeed.insertBefore(entry, cachedKillFeed.firstChild);
  
  // Reinicializar iconos Lucide después de agregar el HTML
  // Usar función debounced para optimización (Requirement 1.3)
  if (typeof window.reinicializarIconosDebounced === 'function') {
    window.reinicializarIconosDebounced();
  } else if (typeof window.reinicializarIconos === 'function') {
    window.reinicializarIconos();
  }
  
  // Remove entry after 5 seconds
  setTimeout(() => {
    if (entry.parentNode) {
      entry.remove();
    }
  }, 5000);
  
  // Requirements: 5.4 - Limitar kill feed a máximo 5 entradas
  // Eliminar entradas antiguas de forma eficiente
  while (cachedKillFeed.children.length > KILL_FEED_MAX_ENTRIES) {
    cachedKillFeed.removeChild(cachedKillFeed.lastChild);
  }
}

// Estado de la barra de vida para interpolación suave
let targetHealth = 200;
let currentDisplayHealth = 200;
let healthAnimationFrame = null;
let cachedHealthBar = null;
let cachedHealthText = null;
let cachedMaxHealth = 200;
let lastHealthClass = ''; // Cache para evitar cambios de clase innecesarios

/**
 * Update health bar display with smooth interpolation
 * Requirements: 3.3 - Transición suave de 150ms
 * Requirements: 3.4, 3.5, 3.6 - Clases de color según porcentaje
 * OPTIMIZADO: Reduce actualizaciones del DOM
 * @param {number} currentHealth - Current health value
 * @param {number} maxHealth - Maximum health value (default 200)
 */
export function actualizarBarraVida(currentHealth, maxHealth = 200) {
  // Solo cachear elementos si no están cacheados
  if (!cachedHealthBar) {
    cachedHealthBar = document.getElementById('health-bar');
    cachedHealthText = document.getElementById('health-text');
  }
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
 * Requirements: 3.3 - Transición suave de 150ms (CSS)
 * Requirements: 3.4 - Color rojo con pulso cuando vida < 25%
 * Requirements: 3.5 - Color amarillo/naranja cuando vida entre 25% y 50%
 * Requirements: 3.6 - Color verde cuando vida > 50%
 * OPTIMIZADO: Reduce manipulaciones del DOM
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
  
  // Actualizar visual - solo si cambió significativamente
  const healthPercent = Math.max(0, Math.min(100, (currentDisplayHealth / cachedMaxHealth) * 100));
  cachedHealthBar.style.width = `${healthPercent}%`;
  
  // Determinar clase de color según porcentaje
  // Requirements: 3.4 - low cuando < 25%
  // Requirements: 3.5 - medium cuando 25% <= vida <= 50%
  // Requirements: 3.6 - normal (sin clase) cuando > 50%
  let newClass = '';
  if (healthPercent <= 25) {
    newClass = 'low';
  } else if (healthPercent <= 50) {
    newClass = 'medium';
  }
  
  // Solo actualizar clases si cambiaron
  if (newClass !== lastHealthClass) {
    cachedHealthBar.classList.remove('low', 'medium');
    if (newClass) {
      cachedHealthBar.classList.add(newClass);
    }
    lastHealthClass = newClass;
  }
  
  // Actualizar texto solo si cambió el valor entero
  if (cachedHealthText) {
    const roundedHealth = Math.round(targetHealth);
    const currentText = `${roundedHealth} / ${cachedMaxHealth}`;
    if (cachedHealthText.textContent !== currentText) {
      cachedHealthText.textContent = currentText;
    }
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
 * Requirements: 3.2 - Efecto de flash rojo en los bordes de la pantalla
 */
export function mostrarEfectoDaño() {
  let flash = document.getElementById('damage-flash');
  
  // Create flash element if it doesn't exist
  if (!flash) {
    flash = document.createElement('div');
    flash.id = 'damage-flash';
    document.body.appendChild(flash);
  }
  
  // Remove active class first to reset animation
  flash.classList.remove('active');
  
  // Force reflow to restart animation
  void flash.offsetWidth;
  
  // Trigger flash
  flash.classList.add('active');
  
  // Remove flash after animation completes
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
 * OPTIMIZADO: Cache de DOM
 * Requirements: 5.1
 * 
 * @param {string} armaEquipada - Nombre del arma actualmente equipada
 * @param {string} armaSecundaria - Nombre del arma secundaria (para mostrar con [Q])
 * @param {boolean} esCuchillo - Si el arma equipada es el cuchillo
 */
export function actualizarSlotsArma(armaEquipada, armaSecundaria, esCuchillo = false) {
  // Usar cache o buscar elementos si no están cacheados
  if (!cachedSlotSuperior) {
    cachedSlotSuperior = document.getElementById('weapon-slot-superior');
    if (cachedSlotSuperior) {
      cachedSlotNombre = cachedSlotSuperior.querySelector('.slot-nombre');
    }
  }
  if (!cachedSlotInferior) {
    cachedSlotInferior = document.getElementById('weapon-slot-inferior');
  }
  if (!cachedWeaponNameDiv) {
    cachedWeaponNameDiv = document.getElementById('weapon-name');
  }
  if (!cachedAmmoDiv) {
    cachedAmmoDiv = document.getElementById('ammo');
  }
  
  if (!cachedSlotSuperior || !cachedSlotInferior) return;
  
  // Actualizar slot superior (arma secundaria con [Q])
  if (cachedSlotNombre) {
    cachedSlotNombre.textContent = armaSecundaria || 'Cuchillo';
  }
  
  // Mostrar/ocultar slot superior según si hay arma secundaria
  if (armaSecundaria) {
    cachedSlotSuperior.classList.remove('hidden');
  } else {
    cachedSlotSuperior.classList.add('hidden');
  }
  
  // Actualizar slot inferior (arma equipada)
  if (cachedWeaponNameDiv) {
    // Si es "Botiquín", mantener ese nombre, sino usar el nombre del arma
    if (armaEquipada === 'Botiquín') {
      cachedWeaponNameDiv.textContent = 'Botiquín';
    } else {
      cachedWeaponNameDiv.textContent = armaEquipada || 'Sin arma';
    }
  }
  
  // Ocultar munición si es cuchillo o JuiceBox
  // Requirements: 4.1, 4.2 - Ocultar contador de munición cuando cuchillo está equipado
  if (cachedAmmoDiv) {
    if (esCuchillo || armaEquipada === 'Botiquín') {
      cachedAmmoDiv.classList.add('hidden');
    } else {
      cachedAmmoDiv.classList.remove('hidden');
    }
  }
}

/**
 * Oculta el contador de munición
 * Requirements: 4.1 - Ocultar contador cuando cuchillo está equipado
 * OPTIMIZADO: Cache de DOM
 * Requirements: 5.1
 */
export function ocultarContadorMunicion() {
  if (!cachedAmmoDiv) {
    cachedAmmoDiv = document.getElementById('ammo');
  }
  if (cachedAmmoDiv) {
    cachedAmmoDiv.classList.add('hidden');
  }
}

/**
 * Muestra el contador de munición
 * Requirements: 4.2 - Mostrar contador cuando arma principal está equipada
 * OPTIMIZADO: Cache de DOM
 * Requirements: 5.1
 */
export function mostrarContadorMunicion() {
  if (!cachedAmmoDiv) {
    cachedAmmoDiv = document.getElementById('ammo');
  }
  if (cachedAmmoDiv) {
    cachedAmmoDiv.classList.remove('hidden');
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
    textoProgreso.textContent = 'Curando...';
    
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
    textoProgreso.textContent = `Curando... ${porcentaje}%`;
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

// Cache para elementos del Dash Box
let cachedDashBox = null;
let cachedDashCircle = null;
let cachedDashCircleNumber = null;
let cachedDashCircleProgress = null;
// Cache de estado anterior para evitar actualizaciones innecesarias
let lastDashState = { cargas: null, recargando: null, progreso: null };

// Constante para el perímetro del círculo SVG (2 * PI * 15.5)
const DASH_CIRCLE_CIRCUMFERENCE = 97.4;

/**
 * Actualiza el Dash Box con el estado actual del sistema de dash
 * Requirements: 4.5, 4.6, 4.7, 4.8, 4.9
 * OPTIMIZADO: Solo actualiza si el estado cambió significativamente
 * 
 * @param {Object} estadoDash - Estado del sistema de dash
 * @param {number} estadoDash.cargasActuales - Número de cargas disponibles (0-3)
 * @param {number} estadoDash.cargasMaximas - Número máximo de cargas (default 3)
 * @param {boolean} estadoDash.estaRecargando - Si hay una carga recargándose
 * @param {number} estadoDash.progresoRecarga - Progreso de recarga (0-1)
 */
export function actualizarDashBox(estadoDash) {
  const cargasActuales = estadoDash.cargasActuales ?? 0;
  const estaRecargando = estadoDash.estaRecargando ?? false;
  const progresoRecarga = estadoDash.progresoRecarga ?? 0;
  
  // OPTIMIZACIÓN: Solo actualizar si el estado cambió significativamente
  const progresoRedondeado = Math.round(progresoRecarga * 20) / 20; // Redondear a 5%
  if (lastDashState.cargas === cargasActuales && 
      lastDashState.recargando === estaRecargando && 
      lastDashState.progreso === progresoRedondeado) {
    return;
  }
  lastDashState.cargas = cargasActuales;
  lastDashState.recargando = estaRecargando;
  lastDashState.progreso = progresoRedondeado;
  
  // Cachear elementos si no están cacheados
  if (!cachedDashBox) {
    cachedDashBox = document.getElementById('dash-box');
  }
  if (!cachedDashCircle) {
    cachedDashCircle = document.getElementById('dash-circle');
  }
  if (!cachedDashCircleNumber) {
    cachedDashCircleNumber = cachedDashCircle?.querySelector('.dash-circle-number');
  }
  if (!cachedDashCircleProgress) {
    cachedDashCircleProgress = cachedDashCircle?.querySelector('.dash-circle-progress');
  }
  
  if (!cachedDashBox || !cachedDashCircle) return;
  const cargasMaximas = estadoDash.cargasMaximas ?? 3;
  
  // Requirements: 4.5 - Actualizar número de cargas en la circunferencia
  if (cachedDashCircleNumber) {
    cachedDashCircleNumber.textContent = cargasActuales.toString();
  }
  
  // Determinar estado visual
  // Requirements: 4.6 - Verde cuando hay cargas disponibles
  // Requirements: 4.7 - Gris cuando está recargando
  if (cargasActuales > 0) {
    cachedDashCircle.classList.remove('empty', 'recharging');
    cachedDashCircle.classList.add('available');
    cachedDashBox.classList.remove('empty');
    cachedDashBox.classList.add('available');
  } else if (estaRecargando) {
    cachedDashCircle.classList.remove('available', 'empty');
    cachedDashCircle.classList.add('recharging');
    cachedDashBox.classList.remove('available');
    cachedDashBox.classList.add('empty');
  } else {
    cachedDashCircle.classList.remove('available', 'recharging');
    cachedDashCircle.classList.add('empty');
    cachedDashBox.classList.remove('available');
    cachedDashBox.classList.add('empty');
  }
  
  // Requirements: 4.8 - Actualizar progreso de recarga con SVG stroke-dashoffset
  if (cachedDashCircleProgress) {
    if (estaRecargando && cargasActuales < cargasMaximas) {
      // Calcular el offset basado en el progreso (0 = vacío, 1 = lleno)
      // stroke-dashoffset: 97.4 = vacío, 0 = lleno
      const offset = DASH_CIRCLE_CIRCUMFERENCE * (1 - progresoRecarga);
      cachedDashCircleProgress.style.strokeDashoffset = offset.toString();
    } else if (cargasActuales >= cargasMaximas) {
      // Círculo completo cuando todas las cargas están disponibles
      cachedDashCircleProgress.style.strokeDashoffset = '0';
    } else if (cargasActuales === 0 && !estaRecargando) {
      // Círculo vacío cuando no hay cargas y no está recargando
      cachedDashCircleProgress.style.strokeDashoffset = DASH_CIRCLE_CIRCUMFERENCE.toString();
    }
  }
}

// Cache para elementos del Heal Box
let cachedHealBox = null;
let cachedHealIcon = null;
// Cache de estado anterior para evitar actualizaciones innecesarias
let lastHealState = { puedeUsarse: null, enCooldown: null };

/**
 * Actualiza el Heal Box con el estado actual del sistema de curación
 * Requirements: 5.4, 5.5, 5.6
 * OPTIMIZADO: Solo actualiza si el estado cambió
 * 
 * @param {Object} estadoHeal - Estado del sistema de curación
 * @param {boolean} estadoHeal.puedeUsarse - Si el jugador puede curarse
 * @param {boolean} estadoHeal.enCooldown - Si la curación está en cooldown
 * @param {number} estadoHeal.progresoCooldown - Progreso del cooldown (0-1)
 */
export function actualizarHealBox(estadoHeal) {
  const puedeUsarse = estadoHeal.puedeUsarse ?? false;
  const enCooldown = estadoHeal.enCooldown ?? false;
  
  // OPTIMIZACIÓN: Solo actualizar si el estado cambió
  if (lastHealState.puedeUsarse === puedeUsarse && lastHealState.enCooldown === enCooldown) {
    return;
  }
  lastHealState.puedeUsarse = puedeUsarse;
  lastHealState.enCooldown = enCooldown;
  
  // Cachear elementos si no están cacheados
  if (!cachedHealBox) {
    cachedHealBox = document.getElementById('heal-box');
  }
  if (!cachedHealIcon) {
    cachedHealIcon = cachedHealBox?.querySelector('.action-icon');
  }
  
  if (!cachedHealBox) return;
  
  // Requirements: 5.4 - Icono verde/blanco brillante cuando puede curarse
  // Requirements: 5.5 - Icono gris atenuado cuando no puede curarse
  if (puedeUsarse) {
    cachedHealBox.classList.remove('disabled', 'cooldown');
    cachedHealBox.classList.add('enabled');
  } else if (enCooldown) {
    // Requirements: 5.6 - Indicador de cooldown
    cachedHealBox.classList.remove('enabled', 'disabled');
    cachedHealBox.classList.add('cooldown');
  } else {
    cachedHealBox.classList.remove('enabled', 'cooldown');
    cachedHealBox.classList.add('disabled');
  }
}

/**
 * Inicializa los iconos de Lucide después de que el DOM esté listo
 * Requirements: 6.1, 6.2, 6.3
 */
export function inicializarLucideIcons() {
  // Usar la función debounced global si está disponible (optimización de rendimiento)
  // Requirement 1.3: Use debounced reinitialize function
  if (typeof window.reinicializarIconosDebounced === 'function') {
    window.reinicializarIconosDebounced();
  } else if (typeof window.lucide !== 'undefined' && window.lucide.createIcons) {
    // Fallback si la función debounced no está disponible
    window.lucide.createIcons();
  } else {
    // Reintentar después de un breve delay si Lucide aún no está cargado
    setTimeout(() => {
      if (typeof window.reinicializarIconosDebounced === 'function') {
        window.reinicializarIconosDebounced();
      } else if (typeof window.lucide !== 'undefined' && window.lucide.createIcons) {
        window.lucide.createIcons();
      }
    }, 100);
  }
}
