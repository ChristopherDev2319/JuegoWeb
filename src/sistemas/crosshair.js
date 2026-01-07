/**
 * Sistema de Crosshair Dinámico
 * Maneja el comportamiento del punto de mira según el estado del jugador
 */

import { CONFIG } from '../config.js';

// Estado del crosshair
let crosshairElement = null;
let estadoCrosshair = {
  dispersión: 0,
  retroceso: 0,
  movimiento: false,
  apuntando: false,
  disparando: false,
  tipoArma: 'rifle'
};

// Configuración del crosshair por tipo de arma
const CROSSHAIR_CONFIG = {
  rifle: {
    tamaño: 4,
    grosor: 2,
    longitud: 20,
    gap: 8,
    colorNormal: '#ffffff',
    colorApuntando: '#00ff00',
    colorDisparando: '#ff4444'
  },
  pistola: {
    tamaño: 3,
    grosor: 2,
    longitud: 15,
    gap: 6,
    colorNormal: '#ffffff',
    colorApuntando: '#00ff00',
    colorDisparando: '#ff4444'
  },
  francotirador: {
    tamaño: 2,
    grosor: 1,
    longitud: 25,
    gap: 12,
    colorNormal: '#ffffff',
    colorApuntando: '#00ff00',
    colorDisparando: '#ff4444'
  },
  escopeta: {
    tamaño: 6,
    grosor: 3,
    longitud: 18,
    gap: 10,
    colorNormal: '#ffffff',
    colorApuntando: '#00ff00',
    colorDisparando: '#ff4444'
  },
  subfusil: {
    tamaño: 4,
    grosor: 2,
    longitud: 16,
    gap: 7,
    colorNormal: '#ffffff',
    colorApuntando: '#00ff00',
    colorDisparando: '#ff4444'
  }
};

// Animaciones activas
let animaciones = {
  retroceso: null,
  disparo: null,
  movimiento: null
};

/**
 * Inicializa el sistema de crosshair dinámico
 */
export function inicializarCrosshair() {
  crosshairElement = document.getElementById('crosshair');
  
  if (!crosshairElement) {
    console.error('❌ Elemento crosshair no encontrado');
    return;
  }

  // Crear elementos dinámicos del crosshair
  crearElementosCrosshair();
  
  // Aplicar configuración inicial
  actualizarCrosshair();
}

/**
 * Crea los elementos HTML del crosshair dinámico
 */
function crearElementosCrosshair() {
  // Limpiar crosshair existente
  crosshairElement.innerHTML = '';
  crosshairElement.className = 'crosshair-dynamic';
  
  // Crear punto central
  const centro = document.createElement('div');
  centro.className = 'crosshair-center';
  crosshairElement.appendChild(centro);
  
  // Crear líneas del crosshair
  const lineas = ['top', 'bottom', 'left', 'right'];
  lineas.forEach(direccion => {
    const linea = document.createElement('div');
    linea.className = `crosshair-line crosshair-${direccion}`;
    crosshairElement.appendChild(linea);
  });
  
  // Agregar estilos CSS dinámicos
  agregarEstilosCrosshair();
}

/**
 * Agrega los estilos CSS para el crosshair dinámico
 */
function agregarEstilosCrosshair() {
  const styleId = 'crosshair-dynamic-styles';
  
  // Remover estilos existentes
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .crosshair-dynamic {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 100;
      transition: all 0.1s ease;
    }
    
    .crosshair-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 4px;
      height: 4px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.8);
      transition: all 0.1s ease;
    }
    
    .crosshair-line {
      position: absolute;
      background: white;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.8);
      transition: all 0.1s ease;
    }
    
    .crosshair-top {
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 12px;
    }
    
    .crosshair-bottom {
      bottom: -20px;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 12px;
    }
    
    .crosshair-left {
      left: -20px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 2px;
    }
    
    .crosshair-right {
      right: -20px;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 2px;
    }
    
    .crosshair-dynamic.aiming .crosshair-center {
      background: #00ff00;
      box-shadow: 0 0 0 1px rgba(0, 255, 0, 0.8);
    }
    
    .crosshair-dynamic.aiming .crosshair-line {
      background: #00ff00;
      box-shadow: 0 0 0 1px rgba(0, 255, 0, 0.8);
    }
    
    .crosshair-dynamic.shooting .crosshair-center {
      background: #ff4444;
      box-shadow: 0 0 0 1px rgba(255, 68, 68, 0.8);
    }
    
    .crosshair-dynamic.shooting .crosshair-line {
      background: #ff4444;
      box-shadow: 0 0 0 1px rgba(255, 68, 68, 0.8);
    }
    
    .crosshair-dynamic.moving .crosshair-line {
      opacity: 0.7;
    }
    
    .crosshair-dynamic.sniper-scope {
      display: none;
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Actualiza el crosshair según el estado actual
 */
function actualizarCrosshair() {
  if (!crosshairElement) return;
  
  const config = CROSSHAIR_CONFIG[estadoCrosshair.tipoArma] || CROSSHAIR_CONFIG.rifle;
  
  // Calcular dispersión total
  const dispersionTotal = calcularDispersionTotal();
  
  // Actualizar clases CSS
  actualizarClasesCrosshair();
  
  // Actualizar posición de líneas basado en dispersión
  actualizarPosicionLineas(dispersionTotal, config);
  
  // Actualizar colores
  actualizarColoresCrosshair(config);
}

/**
 * Calcula la dispersión total del crosshair
 */
function calcularDispersionTotal() {
  let dispersion = 0;
  
  // Dispersión base por retroceso
  dispersion += estadoCrosshair.retroceso * 15;
  
  // Dispersión por movimiento
  if (estadoCrosshair.movimiento) {
    dispersion += 8;
  }
  
  // Dispersión por disparo
  if (estadoCrosshair.disparando) {
    dispersion += 12;
  }
  
  // Reducir dispersión si está apuntando
  if (estadoCrosshair.apuntando) {
    dispersion *= 0.3;
  }
  
  return Math.min(dispersion, 50); // Máximo 50px de dispersión
}

/**
 * Actualiza las clases CSS del crosshair
 */
function actualizarClasesCrosshair() {
  crosshairElement.className = 'crosshair-dynamic';
  
  if (estadoCrosshair.apuntando) {
    crosshairElement.classList.add('aiming');
  }
  
  if (estadoCrosshair.disparando) {
    crosshairElement.classList.add('shooting');
  }
  
  if (estadoCrosshair.movimiento) {
    crosshairElement.classList.add('moving');
  }
  
  // Ocultar crosshair para mira telescópica
  if (estadoCrosshair.tipoArma === 'francotirador' && estadoCrosshair.apuntando) {
    crosshairElement.classList.add('sniper-scope');
  }
}

/**
 * Actualiza la posición de las líneas del crosshair
 */
function actualizarPosicionLineas(dispersion, config) {
  const lineas = crosshairElement.querySelectorAll('.crosshair-line');
  const gap = config.gap + dispersion;
  
  lineas.forEach(linea => {
    if (linea.classList.contains('crosshair-top')) {
      linea.style.top = `-${gap + config.longitud}px`;
    } else if (linea.classList.contains('crosshair-bottom')) {
      linea.style.bottom = `-${gap + config.longitud}px`;
    } else if (linea.classList.contains('crosshair-left')) {
      linea.style.left = `-${gap + config.longitud}px`;
    } else if (linea.classList.contains('crosshair-right')) {
      linea.style.right = `-${gap + config.longitud}px`;
    }
    
    // Actualizar grosor
    if (linea.classList.contains('crosshair-top') || linea.classList.contains('crosshair-bottom')) {
      linea.style.width = `${config.grosor}px`;
      linea.style.height = `${config.longitud}px`;
    } else {
      linea.style.width = `${config.longitud}px`;
      linea.style.height = `${config.grosor}px`;
    }
  });
}

/**
 * Actualiza los colores del crosshair
 */
function actualizarColoresCrosshair(config) {
  let color = config.colorNormal;
  
  if (estadoCrosshair.disparando) {
    color = config.colorDisparando;
  } else if (estadoCrosshair.apuntando) {
    color = config.colorApuntando;
  }
  
  const elementos = [
    crosshairElement.querySelector('.crosshair-center'),
    ...crosshairElement.querySelectorAll('.crosshair-line')
  ];
  
  elementos.forEach(elemento => {
    if (elemento) {
      elemento.style.background = color;
    }
  });
}

/**
 * Establece el tipo de arma para el crosshair
 */
export function establecerTipoArma(tipoArma) {
  const tipoMapeado = mapearTipoArma(tipoArma);
  if (estadoCrosshair.tipoArma !== tipoMapeado) {
    estadoCrosshair.tipoArma = tipoMapeado;
    actualizarCrosshair();
  }
}

/**
 * Mapea el tipo de arma del config a los tipos del crosshair
 */
function mapearTipoArma(tipoArma) {
  const mapeo = {
    'rifle': 'rifle',
    'pistola': 'pistola',
    'francotirador': 'francotirador',
    'escopeta': 'escopeta',
    'subfusil': 'subfusil'
  };
  
  return mapeo[tipoArma] || 'rifle';
}

/**
 * Establece el estado de apuntado
 */
export function establecerApuntando(apuntando) {
  if (estadoCrosshair.apuntando !== apuntando) {
    estadoCrosshair.apuntando = apuntando;
    actualizarCrosshair();
  }
}

/**
 * Establece el estado de movimiento
 */
export function establecerMovimiento(moviendose) {
  if (estadoCrosshair.movimiento !== moviendose) {
    estadoCrosshair.movimiento = moviendose;
    actualizarCrosshair();
  }
}

/**
 * Establece el nivel de retroceso (0.0 - 1.0)
 */
export function establecerRetroceso(nivelRetroceso) {
  estadoCrosshair.retroceso = Math.max(0, Math.min(1, nivelRetroceso));
  actualizarCrosshair();
}

/**
 * Anima el disparo del crosshair
 */
export function animarDisparo(duracion = 100) {
  estadoCrosshair.disparando = true;
  actualizarCrosshair();
  
  // Limpiar animación anterior
  if (animaciones.disparo) {
    clearTimeout(animaciones.disparo);
  }
  
  // Programar fin de animación
  animaciones.disparo = setTimeout(() => {
    estadoCrosshair.disparando = false;
    actualizarCrosshair();
    animaciones.disparo = null;
  }, duracion);
}

/**
 * Anima el retroceso del crosshair
 */
export function animarRetroceso(intensidad = 0.5, duracion = 200) {
  const retrocesoPrevio = estadoCrosshair.retroceso;
  estadoCrosshair.retroceso = Math.min(1, retrocesoPrevio + intensidad);
  actualizarCrosshair();
  
  // Limpiar animación anterior
  if (animaciones.retroceso) {
    clearTimeout(animaciones.retroceso);
  }
  
  // Reducir retroceso gradualmente
  const pasos = 10;
  const reduccionPorPaso = intensidad / pasos;
  const tiempoPorPaso = duracion / pasos;
  
  let pasoActual = 0;
  const reducirRetroceso = () => {
    if (pasoActual < pasos) {
      estadoCrosshair.retroceso = Math.max(0, estadoCrosshair.retroceso - reduccionPorPaso);
      actualizarCrosshair();
      pasoActual++;
      animaciones.retroceso = setTimeout(reducirRetroceso, tiempoPorPaso);
    } else {
      animaciones.retroceso = null;
    }
  };
  
  animaciones.retroceso = setTimeout(reducirRetroceso, tiempoPorPaso);
}

/**
 * Obtiene el estado actual del crosshair
 */
export function obtenerEstadoCrosshair() {
  return { ...estadoCrosshair };
}

/**
 * Reinicia el estado del crosshair
 */
export function reiniciarCrosshair() {
  estadoCrosshair = {
    dispersión: 0,
    retroceso: 0,
    movimiento: false,
    apuntando: false,
    disparando: false,
    tipoArma: 'rifle'
  };
  
  // Limpiar animaciones
  Object.values(animaciones).forEach(animacion => {
    if (animacion) clearTimeout(animacion);
  });
  
  animaciones = {
    retroceso: null,
    disparo: null,
    movimiento: null
  };
  
  actualizarCrosshair();
}

/**
 * Habilita o deshabilita el crosshair dinámico
 */
export function habilitarCrosshairDinamico(habilitar) {
  if (!crosshairElement) return;
  
  if (habilitar) {
    crosshairElement.style.display = 'block';
    actualizarCrosshair();
  } else {
    crosshairElement.style.display = 'none';
  }
}