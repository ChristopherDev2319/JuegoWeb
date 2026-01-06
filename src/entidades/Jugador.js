/**
 * Módulo Jugador
 * Gestiona el estado y movimiento del jugador
 * Usa el sistema de colisiones con Rapier3D para física mejorada
 * 
 * Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 4.2
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';
import { 
  resolverColision, 
  verificarSuelo, 
  verificarTecho,
  verificarYDesatorar,
  estaActivo as colisionesActivas,
  usaRapier 
} from '../sistemas/colisiones.js';
import * as Fisica from '../sistemas/fisica.js';

// Vectores reutilizables para evitar garbage collection (OPTIMIZACIÓN)
const _direccion = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

/**
 * Estado del jugador
 */
export const jugador = {
  posicion: null,
  velocidad: null,
  rotacion: null,
  enSuelo: true,
  enRampa: false,
  normalSuelo: null,
  tiempoEnAire: 0,
  // Server state for reconciliation
  serverPosition: null,
  serverRotation: null,
  health: 200,
  maxHealth: 200,
  isAlive: true,
  // Dash state for reconciliation
  ultimoDash: 0,
  dashEnProgreso: false
};

// Reconciliation threshold - if local differs from server by more than this, snap to server
const RECONCILIATION_THRESHOLD = 5.0; // Aumentado para permitir más diferencia en superficies elevadas
// Tiempo de gracia después de un dash para no reconciliar (ms)
const DASH_GRACE_PERIOD = 500;

/**
 * Inicializa el estado del jugador
 * Debe llamarse después de que THREE esté disponible
 * @param {Object} opciones - Opciones de inicialización
 * @param {boolean} opciones.modoLocal - Si es modo local, spawn en posición de entrenamiento
 */
export function inicializarJugador(opciones = {}) {
  // Posición inicial: modo local spawn en Z=5 mirando hacia +Z
  const posX = 0;
  const posZ = opciones.modoLocal ? 5 : 0;
  const rotY = opciones.modoLocal ? 0 : 0; // 0 = mirando hacia +Z
  
  jugador.posicion = new THREE.Vector3(posX, CONFIG.jugador.alturaOjos, posZ);
  jugador.velocidad = new THREE.Vector3();
  jugador.rotacion = new THREE.Euler(0, rotY, 0, 'YXZ');
  jugador.enSuelo = true;
  jugador.enRampa = false;
  jugador.normalSuelo = new THREE.Vector3(0, 1, 0);
  jugador.tiempoEnAire = 0;
  jugador.serverPosition = new THREE.Vector3(posX, CONFIG.jugador.alturaOjos, posZ);
  jugador.serverRotation = new THREE.Euler(0, rotY, 0, 'YXZ');
  jugador.health = 200;
  jugador.maxHealth = 200;
  jugador.isAlive = true;
  jugador.ultimoDash = 0;
  jugador.dashEnProgreso = false;
}

/**
 * Marca que se inició un dash (para evitar reconciliación durante el dash)
 */
export function marcarInicioDash() {
  jugador.ultimoDash = performance.now();
  jugador.dashEnProgreso = true;
}

/**
 * Calcula la dirección de movimiento basada en las teclas presionadas
 * OPTIMIZADO: Usa vectores reutilizables para evitar garbage collection
 * @param {Object} teclas - Estado de las teclas presionadas
 * @returns {{direccion: THREE.Vector3, forward: THREE.Vector3, right: THREE.Vector3}}
 */
export function calcularDireccionMovimiento(teclas) {
  // Resetear vectores reutilizables
  _direccion.set(0, 0, 0);
  
  // Calcular vectores de dirección basados en la rotación del jugador
  _euler.set(0, jugador.rotacion.y, 0);
  _quaternion.setFromEuler(_euler);
  
  _forward.set(0, 0, -1).applyQuaternion(_quaternion);
  _right.set(1, 0, 0).applyQuaternion(_quaternion);

  // Aplicar movimiento según teclas
  if (teclas['KeyW']) _direccion.add(_forward);
  if (teclas['KeyS']) _direccion.sub(_forward);
  if (teclas['KeyA']) _direccion.sub(_right);
  if (teclas['KeyD']) _direccion.add(_right);

  return { direccion: _direccion, forward: _forward, right: _right };
}


/**
 * Actualiza el movimiento horizontal del jugador
 * Usa el sistema de colisiones con Rapier3D para detectar y resolver colisiones
 * El character controller maneja automáticamente escalones y rampas
 * Requirements: 2.1, 2.2, 2.3, 2.4, 3.2, 3.3
 * 
 * @param {Object} teclas - Estado de las teclas presionadas
 */
export function actualizarMovimiento(teclas) {
  // No mover si el jugador está muerto
  if (!jugador.isAlive) return;
  
  const { direccion } = calcularDireccionMovimiento(teclas);

  // Calcular desplazamiento deseado (puede ser 0 si no hay input)
  const desplazamientoX = direccion.length() > 0 ? direccion.x / direccion.length() * CONFIG.jugador.velocidad : 0;
  const desplazamientoZ = direccion.length() > 0 ? direccion.z / direccion.length() * CONFIG.jugador.velocidad : 0;
  
  // Debug: mostrar qué sistema se está usando (solo una vez)
  if (!window._debugSistemaColisionesMostrado) {
    console.log('🎮 Sistema de movimiento:', {
      colisionesActivas: colisionesActivas(),
      usaRapier: usaRapier()
    });
    window._debugSistemaColisionesMostrado = true;
  }
  
  // Usar sistema de colisiones si está activo
  if (colisionesActivas()) {
    // Solo usar Rapier si el sistema de colisiones lo indica
    if (usaRapier()) {
      // Aplicar gravedad antes de mover (si no está en suelo)
      if (!jugador.enSuelo) {
        jugador.velocidad.y -= CONFIG.jugador.gravedad;
      }
      
      // Limitar velocidad de caída para evitar atravesar el suelo
      const velocidadMaxCaida = -0.5;
      if (jugador.velocidad.y < velocidadMaxCaida) {
        jugador.velocidad.y = velocidadMaxCaida;
      }
      
      // Incluir velocidad vertical (gravedad/salto) en el desplazamiento
      const desplazamiento = new THREE.Vector3(
        desplazamientoX, 
        jugador.velocidad.y, 
        desplazamientoZ
      );
      
      // Usar el character controller de Rapier para movimiento con colisiones
      const resultado = Fisica.moverJugador(jugador.posicion, desplazamiento, 1/30);
      
      // Aplicar posición completa incluyendo Y
      jugador.posicion.copy(resultado.posicion);
      
      // Actualizar estado de suelo desde el character controller
      if (resultado.enSuelo) {
        if (!jugador.enSuelo) {
          // Transición de aire a suelo - aterrizar
          jugador.tiempoEnAire = 0;
        }
        jugador.enSuelo = true;
        jugador.velocidad.y = 0; // Resetear velocidad vertical al tocar suelo
      } else {
        jugador.enSuelo = false;
        jugador.tiempoEnAire += 1/60;
      }
      
    } else {
      // Fallback: usar resolverColision con raycasting
      if (direccion.length() > 0) {
        direccion.normalize();
        const posicionDeseada = jugador.posicion.clone();
        posicionDeseada.x += desplazamientoX;
        posicionDeseada.z += desplazamientoZ;
        
        const radio = CONFIG.colisiones.radioJugador;
        const posicionFinal = resolverColision(jugador.posicion, posicionDeseada, radio);
        jugador.posicion.x = posicionFinal.x;
        jugador.posicion.z = posicionFinal.z;
      }
      
      // Verificar si el jugador está atrapado y desatorar si es necesario
      const estadoAtrapado = verificarYDesatorar(jugador.posicion);
      if (estadoAtrapado.necesitaCorreccion) {
        jugador.posicion.copy(estadoAtrapado.posicionCorregida);
      }
    }
  } else {
    // Fallback: movimiento libre sin colisiones
    if (direccion.length() > 0) {
      direccion.normalize();
      jugador.posicion.x += desplazamientoX;
      jugador.posicion.z += desplazamientoZ;
    }
  }
}

/**
 * Aplica la gravedad al jugador
 * Usa verificarSuelo() mejorado con Rapier para detección precisa
 * NOTA: Cuando se usa Rapier, la gravedad se aplica en actualizarMovimiento()
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export function aplicarGravedad() {
  // Si usamos Rapier, la gravedad ya se maneja en actualizarMovimiento()
  if (colisionesActivas() && usaRapier()) {
    // Solo verificar suelo para actualizar información de rampa y normal
    const estadoSuelo = verificarSuelo(jugador.posicion);
    if (estadoSuelo.normal) {
      jugador.normalSuelo = estadoSuelo.normal.clone();
    }
    jugador.enRampa = estadoSuelo.enRampa || false;
    return;
  }
  
  // Fallback: sistema de gravedad manual para cuando no hay Rapier
  
  // Usar sistema de colisiones para verificar suelo si está activo
  if (colisionesActivas()) {
    // Obtener estado del suelo con información detallada
    const estadoSuelo = verificarSuelo(jugador.posicion);
    
    // Calcular altura objetivo basada en la altura del suelo detectada
    const alturaObjetivo = estadoSuelo.altura + CONFIG.jugador.alturaOjos;
    
    // Actualizar información de rampa y normal del suelo
    if (estadoSuelo.normal) {
      jugador.normalSuelo = estadoSuelo.normal.clone();
    }
    jugador.enRampa = estadoSuelo.enRampa || false;
    
    // Calcular la diferencia de altura entre posición actual y suelo detectado
    const diferenciaAltura = alturaObjetivo - jugador.posicion.y;
    const alturaMaxEscalon = CONFIG.fisica?.alturaMaxEscalon || 0.8;
    
    // SNAP TO GROUND: Si estamos en el suelo o muy cerca, pegarnos al suelo
    // Esto evita los saltitos al bajar rampas
    if (estadoSuelo.enSuelo && jugador.velocidad.y <= 0) {
      // Si el suelo está cerca (arriba o abajo), hacer snap
      if (Math.abs(diferenciaAltura) <= alturaMaxEscalon) {
        jugador.posicion.y = alturaObjetivo;
        jugador.velocidad.y = 0;
        jugador.enSuelo = true;
        jugador.tiempoEnAire = 0;
        return;
      }
    }
    
    // Si estamos saltando, verificar techo y aplicar gravedad
    if (jugador.velocidad.y > 0) {
      // Verificar si hay techo arriba
      const techo = verificarTecho(jugador.posicion, jugador.velocidad.y);
      if (techo && techo.hayTecho) {
        // Calcular distancia al techo
        const margenCabeza = 0.3;
        const distanciaAlTecho = techo.alturaTecho - (jugador.posicion.y + margenCabeza);
        
        // Si vamos a golpear el techo, detener el salto
        if (distanciaAlTecho < jugador.velocidad.y + 0.1) {
          jugador.posicion.y = techo.alturaTecho - margenCabeza - 0.1;
          jugador.velocidad.y = -0.01; // Empezar a caer
          jugador.enSuelo = false;
          jugador.tiempoEnAire += 1/60;
          return;
        }
      }
      
      jugador.velocidad.y -= CONFIG.jugador.gravedad;
      jugador.posicion.y += jugador.velocidad.y;
      jugador.enSuelo = false;
      jugador.tiempoEnAire += 1/60;
      return;
    }
    
    // Cayendo - aplicar gravedad
    jugador.velocidad.y -= CONFIG.jugador.gravedad;
    
    // Limitar velocidad de caída
    const velocidadMaxCaida = -1.0;
    if (jugador.velocidad.y < velocidadMaxCaida) {
      jugador.velocidad.y = velocidadMaxCaida;
    }
    
    const nuevaY = jugador.posicion.y + jugador.velocidad.y;
    
    // Si vamos a caer por debajo del suelo, aterrizar
    if (nuevaY <= alturaObjetivo) {
      jugador.posicion.y = alturaObjetivo;
      jugador.velocidad.y = 0;
      jugador.enSuelo = true;
      jugador.tiempoEnAire = 0;
    } else {
      jugador.posicion.y = nuevaY;
      jugador.enSuelo = false;
      jugador.tiempoEnAire += 1/60;
    }
  } else {
    // Fallback: usar altura fija del suelo (0)
    jugador.velocidad.y -= CONFIG.jugador.gravedad;
    jugador.posicion.y += jugador.velocidad.y;
    
    if (jugador.posicion.y <= CONFIG.jugador.alturaOjos) {
      jugador.posicion.y = CONFIG.jugador.alturaOjos;
      jugador.velocidad.y = 0;
      jugador.enSuelo = true;
      jugador.tiempoEnAire = 0;
    } else {
      jugador.enSuelo = false;
      jugador.tiempoEnAire += 1/60;
    }
  }
}

/**
 * Ejecuta un salto si el jugador está en el suelo
 * Requirement 3.1: Apply upward velocity
 * @returns {boolean} - true si el salto se ejecutó
 */
export function saltar() {
  if (jugador.enSuelo) {
    jugador.velocidad.y = CONFIG.jugador.poderSalto;
    jugador.enSuelo = false;
    jugador.tiempoEnAire = 0;
    return true;
  }
  return false;
}

/**
 * Actualiza la rotación del jugador basada en el movimiento del mouse
 * @param {number} movimientoX - Movimiento horizontal del mouse
 * @param {number} movimientoY - Movimiento vertical del mouse
 */
export function actualizarRotacion(movimientoX, movimientoY) {
  const sensibilidad = CONFIG.controles.sensibilidadMouse;

  jugador.rotacion.y -= movimientoX * sensibilidad;
  jugador.rotacion.x -= movimientoY * sensibilidad;

  // Limitar rotación vertical
  jugador.rotacion.x = Math.max(
    -Math.PI / 2,
    Math.min(Math.PI / 2, jugador.rotacion.x)
  );
}

/**
 * Sincroniza la cámara con la posición y rotación del jugador
 * @param {THREE.Camera} camera - Cámara de Three.js
 */
export function sincronizarCamara(camera) {
  camera.position.copy(jugador.posicion);
  camera.rotation.copy(jugador.rotacion);
}

/**
 * Obtiene la posición actual del jugador
 * @returns {THREE.Vector3}
 */
export function obtenerPosicion() {
  return jugador.posicion.clone();
}

/**
 * Obtiene la rotación actual del jugador
 * @returns {THREE.Euler}
 */
export function obtenerRotacion() {
  return jugador.rotacion.clone();
}

/**
 * Verifica si el jugador está en el suelo
 * @returns {boolean}
 */
export function estaEnSuelo() {
  return jugador.enSuelo;
}

/**
 * Verifica si el jugador está en una rampa
 * @returns {boolean}
 */
export function estaEnRampa() {
  return jugador.enRampa;
}

/**
 * Obtiene la normal del suelo actual
 * @returns {THREE.Vector3}
 */
export function obtenerNormalSuelo() {
  return jugador.normalSuelo ? jugador.normalSuelo.clone() : new THREE.Vector3(0, 1, 0);
}

/**
 * Obtiene el tiempo que el jugador ha estado en el aire
 * @returns {number} - Tiempo en segundos
 */
export function obtenerTiempoEnAire() {
  return jugador.tiempoEnAire;
}

/**
 * Apply server state to local player with reconciliation
 * Keeps local prediction for responsiveness while reconciling with server state
 * Maintains compatibility with server reconciliation
 * Requirements: 3.2, 4.2
 * 
 * @param {Object} serverState - Player state from server
 */
export function aplicarEstadoServidor(serverState) {
  if (!serverState) return;
  
  // Detectar si el jugador acaba de revivir
  const acabaDeRevivir = !jugador.isAlive && serverState.isAlive;
  
  // Actualizar referencia de posición del servidor
  jugador.serverPosition.set(
    serverState.position.x,
    serverState.position.y,
    serverState.position.z
  );
  
  // Actualizar referencia de rotación del servidor
  if (serverState.rotation) {
    jugador.serverRotation.set(
      serverState.rotation.x || 0,
      serverState.rotation.y || 0,
      serverState.rotation.z || 0,
      'YXZ'
    );
  }
  
  // Si el jugador acaba de revivir, forzar sincronización completa
  if (acabaDeRevivir) {
    jugador.posicion.copy(jugador.serverPosition);
    jugador.velocidad.set(0, 0, 0);
    jugador.enSuelo = true;
    jugador.enRampa = false;
    jugador.tiempoEnAire = 0;
    jugador.dashEnProgreso = false;
    console.log('Jugador revivido - posición sincronizada');
  } else {
    // Verificar si estamos en período de gracia del dash
    const tiempoDesdeUltimoDash = performance.now() - jugador.ultimoDash;
    const enGraciaDash = tiempoDesdeUltimoDash < DASH_GRACE_PERIOD;
    
    // Si el dash terminó, marcar como no en progreso
    if (jugador.dashEnProgreso && !enGraciaDash) {
      jugador.dashEnProgreso = false;
    }
    
    // Calcular distancia entre posición local y del servidor
    const distancia = jugador.posicion.distanceTo(jugador.serverPosition);
    
    // Si estamos en dash, usar interpolación suave hacia el servidor en lugar de snap
    if (enGraciaDash && distancia > 0.5) {
      // Interpolar suavemente hacia la posición del servidor
      const factor = 0.15; // Factor de interpolación suave
      jugador.posicion.x += (jugador.serverPosition.x - jugador.posicion.x) * factor;
      jugador.posicion.z += (jugador.serverPosition.z - jugador.posicion.z) * factor;
    } else if (!enGraciaDash && distancia > RECONCILIATION_THRESHOLD) {
      // Si no estamos en dash y la diferencia es grande, sincronizar
      jugador.posicion.copy(jugador.serverPosition);
      console.log('Posición reconciliada con servidor');
    }
  }
  
  // Actualizar vida y estado vivo desde el servidor (autoritativo)
  jugador.health = serverState.health;
  jugador.maxHealth = serverState.maxHealth || 200;
  jugador.isAlive = serverState.isAlive;
  
  // Actualizar estado de suelo desde el servidor
  if (serverState.position.y <= CONFIG.jugador.alturaOjos + 0.1) {
    jugador.enSuelo = true;
  }
}

/**
 * Get current health
 * @returns {number}
 */
export function obtenerVida() {
  return jugador.health;
}

/**
 * Check if player is alive
 * @returns {boolean}
 */
export function estaVivo() {
  return jugador.isAlive;
}
