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
