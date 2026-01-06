/**
 * Sistema de Selector de Armas para Modo Local
 * Menú visual compacto que aparece arriba del indicador de arma
 */

import { CONFIG } from '../config.js';
import { cambiarArma, obtenerEstado } from '../sistemas/armas.js';
import { actualizarInfoArma, mostrarCambioArma } from '../utils/ui.js';

// Estado del selector
let weaponContainer = null;
let isMultiplayerConnected = false;
let inputSender = null;

// Referencias DOM
let weaponSelectorLocal = null;
let weaponSelectorGrid = null;

/**
 * Inicializa el selector de armas local
 */
export function inicializarSelectorArmasLocal(container, isConnected = false, sender = null) {
  weaponContainer = container;
  isMultiplayerConnected = isConnected;
  inputSender = sender;
  
  // Obtener referencias DOM
  weaponSelectorLocal = document.getElementById('weapon-selector-local');
  weaponSelectorGrid = document.querySelector('.weapon-selector-grid');
  
  if (!weaponSelectorLocal || !weaponSelectorGrid) {
    console.warn('⚠️ Elementos del selector de armas no encontrados en DOM');
    return;
  }
  
  console.log('✅ Selector de armas local inicializado');
}

/**
 * Muestra el selector de armas en modo local
 */
export function mostrarSelectorArmasLocal() {
  if (!weaponSelectorLocal || typeof window.modoJuegoActual !== 'string' || window.modoJuegoActual !== 'local') {
    return;
  }
  
  // Generar grid de armas
  generarGridArmas();
  
  // Mostrar selector
  weaponSelectorLocal.classList.remove('hidden');
  
  console.log('🔫 Selector de armas local mostrado');
}

/**
 * Oculta el selector de armas local
 */
export function ocultarSelectorArmasLocal() {
  if (!weaponSelectorLocal) return;
  
  weaponSelectorLocal.classList.add('hidden');
  console.log('🔫 Selector de armas local ocultado');
}

/**
 * Genera el grid de armas disponibles
 */
function generarGridArmas() {
  if (!weaponSelectorGrid) return;
  
  // Limpiar grid existente
  weaponSelectorGrid.innerHTML = '';
  
  // Obtener estado actual del sistema de armas
  const estadoArmas = obtenerEstado();
  const armaActual = estadoArmas.tipoActual;
  
  // Usar las armas disponibles del inventario en lugar de lista fija
  const armasDisponibles = estadoArmas.armasDisponibles || [
    'M4A1', 'AK47', 'PISTOLA', 'SNIPER', 'ESCOPETA', 'MP5'
  ];
  
  console.log('🔫 Armas en inventario:', armasDisponibles);
  
  // Crear elemento para cada arma
  armasDisponibles.forEach((tipoArma, index) => {
    const configArma = CONFIG.armas[tipoArma];
    if (!configArma) return;
    
    const weaponItem = document.createElement('div');
    weaponItem.className = 'weapon-selector-item';
    weaponItem.dataset.weaponType = tipoArma;
    
    // Marcar arma actual como activa
    if (tipoArma === armaActual) {
      weaponItem.classList.add('active');
    }
    
    // Obtener icono del arma
    const icono = obtenerIconoArma(tipoArma);
    
    // Tecla numérica para selección rápida
    const tecla = index + 1;
    
    weaponItem.innerHTML = `
      <div class="weapon-key">${tecla}</div>
      <div class="weapon-icon">${icono}</div>
      <div class="weapon-name">${obtenerNombreCorto(configArma.nombre)}</div>
    `;
    
    // Evento de clic para seleccionar arma
    weaponItem.addEventListener('click', () => {
      seleccionarArma(tipoArma);
    });
    
    weaponSelectorGrid.appendChild(weaponItem);
  });
  
  // Reinicializar iconos Lucide después de agregar el HTML
  if (typeof window.reinicializarIconos === 'function') {
    window.reinicializarIconos();
  }
}

/**
 * Selecciona un arma del selector
 */
function seleccionarArma(tipoArma) {
  if (!weaponContainer) {
    console.warn('⚠️ WeaponContainer no disponible');
    return;
  }
  
  // Cambiar arma usando el sistema de armas
  const exito = cambiarArma(tipoArma, weaponContainer);
  
  if (exito) {
    // Actualizar UI
    const nuevoEstado = obtenerEstado();
    mostrarCambioArma(nuevoEstado.nombre);
    actualizarInfoArma(nuevoEstado);
    
    // Notificar al servidor si está conectado
    if (isMultiplayerConnected && inputSender) {
      inputSender.sendWeaponChange(tipoArma);
    }
    
    // Actualizar selector para mostrar arma activa
    actualizarArmaActiva(tipoArma);
    
    console.log(`🔫 Arma seleccionada desde selector: ${nuevoEstado.nombre}`);
  }
}

/**
 * Actualiza la visualización del arma activa en el selector
 */
function actualizarArmaActiva(tipoArma) {
  if (!weaponSelectorGrid) return;
  
  // Remover clase active de todos los elementos
  const items = weaponSelectorGrid.querySelectorAll('.weapon-selector-item');
  items.forEach(item => item.classList.remove('active'));
  
  // Agregar clase active al arma seleccionada
  const itemActivo = weaponSelectorGrid.querySelector(`[data-weapon-type="${tipoArma}"]`);
  if (itemActivo) {
    itemActivo.classList.add('active');
  }
}

/**
 * Actualiza el arma activa cuando se cambia desde otros métodos
 */
export function actualizarSelectorArmaActiva() {
  const estadoArmas = obtenerEstado();
  actualizarArmaActiva(estadoArmas.tipoActual);
}

/**
 * Obtiene el icono Lucide específico para cada arma
 */
function obtenerIconoArma(tipoArma) {
  // Mapeo específico por tipo de arma
  const iconosPorTipo = {
    'rifle': '<i data-lucide="target"></i>',
    'pistola': '<i data-lucide="circle-dot"></i>',
    'francotirador': '<i data-lucide="crosshair"></i>',
    'escopeta': '<i data-lucide="flame"></i>',
    'subfusil': '<i data-lucide="bolt"></i>',
    'melee': '<i data-lucide="sword"></i>'
  };
  
  // Mapeo específico por nombre de arma (más específico)
  const iconosPorArma = {
    'M4A1': '<i data-lucide="target"></i>',
    'AK47': '<i data-lucide="zap"></i>',
    'PISTOLA': '<i data-lucide="circle-dot"></i>',
    'SNIPER': '<i data-lucide="crosshair"></i>',
    'ESCOPETA': '<i data-lucide="flame"></i>',
    'MP5': '<i data-lucide="bolt"></i>',
    'KNIFE': '<i data-lucide="sword"></i>',
    'JUICEBOX': '<i data-lucide="heart-pulse"></i>'
  };
  
  // Primero intentar por nombre específico, luego por tipo
  return iconosPorArma[tipoArma] || iconosPorTipo[tipoArma] || '<i data-lucide="circle-dot"></i>';
}

/**
 * Obtiene un nombre corto para mostrar en el selector
 */
function obtenerNombreCorto(nombre) {
  const nombresCortos = {
    'M4A1': 'M4A1',
    'AK-47': 'AK47',
    'Colt 1911': 'PISTOL',
    'AWP': 'SNIPER',
    'Pump Shotgun': 'SHOTGUN',
    'MP5': 'MP5'
  };
  
  return nombresCortos[nombre] || nombre.substring(0, 6).toUpperCase();
}

/**
 * Actualiza el estado de conexión del selector
 */
export function actualizarEstadoConexionSelector(isConnected, sender = null) {
  isMultiplayerConnected = isConnected;
  inputSender = sender;
}