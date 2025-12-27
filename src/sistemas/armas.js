/**
 * Sistema de Armas
 * Gestiona el estado del arma, disparo y recarga
 * 
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';
import { Bala } from '../entidades/Bala.js';

/**
 * Estado del arma
 */
export const arma = {
  municionActual: CONFIG.arma.tamañoCargador,
  municionTotal: CONFIG.arma.municionTotal,
  estaRecargando: false,
  puedeDisparar: true,
  ultimoDisparo: 0
};

/**
 * Referencia al modelo del arma para animaciones
 */
let modeloArma = null;

/**
 * Establece el modelo del arma para animaciones de retroceso
 * @param {THREE.Object3D} modelo - Modelo 3D del arma
 */
export function establecerModeloArma(modelo) {
  modeloArma = modelo;
}

/**
 * Dispara el arma si es posible
 * @param {THREE.Camera} camera - Cámara del jugador
 * @param {Array} enemigos - Array de enemigos
 * @param {Array} balas - Array de balas activas
 * @param {THREE.Scene} scene - Escena de Three.js
 * @param {Function} onImpacto - Callback cuando una bala impacta
 * @returns {boolean} - true si se disparó exitosamente
 */
export function disparar(camera, enemigos, balas, scene, onImpacto = null) {
  const ahora = performance.now();
  const tiempoEntreDisparos = (60 / CONFIG.arma.cadenciaDisparo) * 1000;

  if (
    !arma.puedeDisparar ||
    arma.estaRecargando ||
    arma.municionActual <= 0 ||
    ahora - arma.ultimoDisparo < tiempoEntreDisparos
  ) {
    return false;
  }

  arma.ultimoDisparo = ahora;
  arma.municionActual--;

  // Calcular posición inicial de la bala
  const posicionBala = camera.position.clone();
  const offsetAdelante = new THREE.Vector3(0, 0, -1);
  offsetAdelante.applyQuaternion(camera.quaternion);
  posicionBala.add(offsetAdelante);

  // Calcular dirección de la bala
  const direccion = new THREE.Vector3(0, 0, -1);
  direccion.applyQuaternion(camera.quaternion);
  direccion.normalize();

  // Crear la bala
  const bala = new Bala(scene, posicionBala, direccion, onImpacto);
  balas.push(bala);

  // Animar retroceso
  animarRetroceso();

  return true;
}

/**
 * Inicia la recarga del arma
 * @param {Function} onRecargaCompleta - Callback cuando termina la recarga
 * @returns {boolean} - true si se inició la recarga
 */
export function recargar(onRecargaCompleta = null) {
  if (
    arma.estaRecargando ||
    arma.municionActual === CONFIG.arma.tamañoCargador ||
    arma.municionTotal <= 0
  ) {
    return false;
  }

  arma.estaRecargando = true;

  setTimeout(() => {
    const municionNecesaria = CONFIG.arma.tamañoCargador - arma.municionActual;
    const municionARecargar = Math.min(municionNecesaria, arma.municionTotal);

    arma.municionActual += municionARecargar;
    arma.municionTotal -= municionARecargar;
    arma.estaRecargando = false;

    if (onRecargaCompleta) {
      onRecargaCompleta();
    }
  }, CONFIG.arma.tiempoRecarga * 1000);

  return true;
}

/**
 * Anima el retroceso del arma al disparar
 */
export function animarRetroceso() {
  if (!modeloArma) return;

  const posicionOriginalZ = modeloArma.position.z;
  const posicionOriginalY = modeloArma.position.y;

  modeloArma.position.z += CONFIG.arma.retroceso.cantidad;
  modeloArma.position.y += CONFIG.arma.retroceso.arriba;

  setTimeout(() => {
    modeloArma.position.z = posicionOriginalZ;
    modeloArma.position.y = posicionOriginalY;
  }, CONFIG.arma.retroceso.duracion);
}

/**
 * Obtiene el estado actual del arma
 * @returns {Object} - Estado del arma
 */
export function obtenerEstado() {
  return {
    municionActual: arma.municionActual,
    municionTotal: arma.municionTotal,
    estaRecargando: arma.estaRecargando,
    puedeDisparar: arma.puedeDisparar
  };
}

/**
 * Verifica si el arma puede disparar
 * @returns {boolean}
 */
export function puedeDisparar() {
  const ahora = performance.now();
  const tiempoEntreDisparos = (60 / CONFIG.arma.cadenciaDisparo) * 1000;

  return (
    arma.puedeDisparar &&
    !arma.estaRecargando &&
    arma.municionActual > 0 &&
    ahora - arma.ultimoDisparo >= tiempoEntreDisparos
  );
}

/**
 * Reinicia el estado del arma a valores iniciales
 */
export function reiniciarArma() {
  arma.municionActual = CONFIG.arma.tamañoCargador;
  arma.municionTotal = CONFIG.arma.municionTotal;
  arma.estaRecargando = false;
  arma.puedeDisparar = true;
  arma.ultimoDisparo = 0;
}
