/**
 * Ejemplo de cómo usar el nuevo sistema de armas
 * Este archivo muestra cómo integrar las nuevas funcionalidades de armas en tu juego
 */

import { 
  cambiarArma, 
  agregarArma, 
  siguienteArma, 
  armaAnterior, 
  obtenerEstado,
  disparar,
  recargar
} from './src/sistemas/armas.js';

import { 
  inicializarControles, 
  actualizarCallback 
} from './src/sistemas/controles.js';

import { 
  actualizarInfoArma, 
  mostrarCambioArma 
} from './src/utils/ui.js';

/**
 * Ejemplo de inicialización del sistema de armas
 */
export function inicializarSistemaArmas(scene, camera, enemigos, balas) {
  
  // 1. Agregar armas al inventario del jugador
  console.log('Agregando armas al inventario...');
  
  // El jugador empieza con M4A1, agreguemos más armas
  agregarArma('PISTOLA');
  agregarArma('AK47');
  agregarArma('SNIPER');
  agregarArma('ESCOPETA');
  
  // 2. Configurar los controles para cambio de armas
  const controlesArmas = {
    onSiguienteArma: () => {
      siguienteArma();
      const estado = obtenerEstado();
      mostrarCambioArma(estado.nombre);
      actualizarInfoArma(estado);
      console.log(`Cambiado a: ${estado.nombre}`);
    },
    
    onArmaAnterior: () => {
      armaAnterior();
      const estado = obtenerEstado();
      mostrarCambioArma(estado.nombre);
      actualizarInfoArma(estado);
      console.log(`Cambiado a: ${estado.nombre}`);
    },
    
    onSeleccionarArma: (indice) => {
      const estado = obtenerEstado();
      if (indice < estado.armasDisponibles.length) {
        const tipoArma = estado.armasDisponibles[indice];
        if (cambiarArma(tipoArma)) {
          const nuevoEstado = obtenerEstado();
          mostrarCambioArma(nuevoEstado.nombre);
          actualizarInfoArma(nuevoEstado);
          console.log(`Seleccionado: ${nuevoEstado.nombre}`);
        }
      }
    },
    
    onDisparar: () => {
      if (disparar(camera, enemigos, balas, scene)) {
        // Actualizar UI después de disparar
        const estado = obtenerEstado();
        actualizarInfoArma(estado);
      }
    },
    
    onRecargar: () => {
      if (recargar(() => {
        // Callback cuando termina la recarga
        const estado = obtenerEstado();
        actualizarInfoArma(estado);
        console.log('Recarga completada');
      })) {
        console.log('Iniciando recarga...');
        const estado = obtenerEstado();
        actualizarInfoArma(estado);
      }
    }
  };
  
  // Actualizar los callbacks de controles
  Object.keys(controlesArmas).forEach(callback => {
    actualizarCallback(callback, controlesArmas[callback]);
  });
  
  // 3. Actualizar la UI inicial
  const estadoInicial = obtenerEstado();
  actualizarInfoArma(estadoInicial);
  
  console.log('Sistema de armas inicializado correctamente');
  console.log('Armas disponibles:', estadoInicial.armasDisponibles);
  console.log('Arma actual:', estadoInicial.nombre);
}

/**
 * Ejemplo de cómo agregar un arma durante el juego (por ejemplo, al recoger un pickup)
 */
export function recogerArma(tipoArma) {
  if (agregarArma(tipoArma)) {
    console.log(`¡Arma recogida: ${tipoArma}!`);
    
    // Cambiar automáticamente al arma recogida
    if (cambiarArma(tipoArma)) {
      const estado = obtenerEstado();
      mostrarCambioArma(estado.nombre);
      actualizarInfoArma(estado);
    }
    
    return true;
  }
  
  console.log(`Ya tienes el arma: ${tipoArma}`);
  return false;
}

/**
 * Ejemplo de función para mostrar estadísticas de todas las armas
 */
export function mostrarEstadisticasArmas() {
  const { CONFIG } = await import('./src/config.js');
  
  console.log('=== ESTADÍSTICAS DE ARMAS ===');
  
  Object.entries(CONFIG.armas).forEach(([tipo, config]) => {
    console.log(`\n${config.nombre} (${tipo}):`);
    console.log(`  - Tipo: ${config.tipo}`);
    console.log(`  - Daño: ${config.daño}`);
    console.log(`  - Cadencia: ${config.cadenciaDisparo} RPM`);
    console.log(`  - Cargador: ${config.tamañoCargador}`);
    console.log(`  - Munición total: ${config.municionTotal}`);
    console.log(`  - Tiempo recarga: ${config.tiempoRecarga}s`);
    console.log(`  - Velocidad bala: ${config.velocidadBala}`);
    
    if (config.proyectiles) {
      console.log(`  - Proyectiles por disparo: ${config.proyectiles}`);
      console.log(`  - Dispersión: ${config.dispersion}`);
    }
  });
}

/**
 * Controles del teclado para testing rápido
 */
export function configurarTestingArmas() {
  console.log('\n=== CONTROLES DE TESTING ===');
  console.log('Q / Rueda del mouse: Cambiar arma');
  console.log('1-5: Seleccionar arma directamente');
  console.log('R: Recargar');
  console.log('Clic izquierdo: Disparar');
  console.log('\nEscribe mostrarEstadisticasArmas() en la consola para ver stats');
  
  // Hacer la función disponible globalmente para testing
  window.mostrarEstadisticasArmas = mostrarEstadisticasArmas;
  window.recogerArma = recogerArma;
}