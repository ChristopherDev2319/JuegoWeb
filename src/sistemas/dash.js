/**
 * Sistema de Dash
 * Gestiona las cargas de dash, ejecución y recarga
 * Usa shape casting para detectar colisiones durante el dash
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 7.5
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';
import { shapeCastDash, verificarPosicionValida, estaActivo as colisionesActivas, desatorarJugador, estaDentroGeometria, desatorarDespuesDash, detectarColisionYSalida } from './colisiones.js';

/**
 * Estado del sistema de dash
 * Requirements: 1.1, 1.2
 */
export const sistemaDash = {
  cargasActuales: CONFIG.dash.cargasMaximas,
  estaEnDash: false,
  cargasRecargando: [false, false, false],
  inicioRecarga: [0, 0, 0],
  // Campos para interpolación suave del dash
  // Requirements: 1.1, 1.2
  dashEnProgreso: false,
  posicionInicioDash: null,
  posicionFinDash: null,
  tiempoInicioDash: 0,
  duracionDash: CONFIG.dash.duracion,
  // Campos para extensión automática
  // Requirements: 2.1, 2.2, 6.1, 6.2
  distanciaExtendida: 0,
  atravesoEstructura: false
};

/**
 * Ejecuta un dash si hay cargas disponibles
 * Usa shape cast de Rapier para detectar colisiones durante todo el trayecto
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * 
 * @param {Object} jugador - Estado del jugador con posicion y rotacion
 * @param {Object} teclas - Estado de las teclas presionadas
 * @param {Function} onDashEjecutado - Callback cuando se ejecuta el dash
 * @returns {boolean} - true si se ejecutó el dash
 */
export function ejecutarDash(jugador, teclas, onDashEjecutado = null) {
  if (sistemaDash.estaEnDash || sistemaDash.cargasActuales <= 0) {
    return false;
  }

  // Calcular dirección del dash
  const direccionDash = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  forward.set(0, 0, -1).applyQuaternion(
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, jugador.rotacion.y, 0, 'YXZ')
    )
  );

  right.set(1, 0, 0).applyQuaternion(
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, jugador.rotacion.y, 0, 'YXZ')
    )
  );

  // Determinar dirección según teclas presionadas
  if (teclas['KeyW']) direccionDash.add(forward);
  if (teclas['KeyS']) direccionDash.sub(forward);
  if (teclas['KeyA']) direccionDash.sub(right);
  if (teclas['KeyD']) direccionDash.add(right);

  // Si no hay dirección de movimiento, dash hacia adelante
  if (direccionDash.length() === 0) {
    direccionDash.copy(forward);
  }

  direccionDash.normalize();

  // Consumir carga
  sistemaDash.cargasActuales--;
  sistemaDash.estaEnDash = true;

  // Calcular posición final del dash usando shape cast
  // Requirements: 4.1, 4.2, 4.3, 4.4
  const distanciaDash = CONFIG.dash.poder;
  let posicionFinal;
  let huboColision = false;
  
  if (colisionesActivas()) {
    // Usar shape cast para detectar colisiones durante el dash completo
    // Requirement 4.1: Stop dash at wall surface
    // Requirement 4.2: Allow sliding along the wall
    // Requirement 4.3: Allow passage through gaps wider than player
    const resultadoDash = shapeCastDash(
      jugador.posicion,
      direccionDash,
      distanciaDash
    );
    
    posicionFinal = resultadoDash.posicionFinal;
    huboColision = resultadoDash.colision;
    
    // Requirement 4.4: Find nearest valid position if inside geometry
    const validacion = verificarPosicionValida(posicionFinal);
    if (!validacion.valida) {
      posicionFinal = validacion.posicionCorregida;
    }
  } else {
    // Fallback: dash sin colisiones si el sistema no está disponible
    posicionFinal = new THREE.Vector3(
      jugador.posicion.x + direccionDash.x * distanciaDash,
      jugador.posicion.y,
      jugador.posicion.z + direccionDash.z * distanciaDash
    );
  }
  
  // Aplicar posición final del dash
  jugador.posicion.x = posicionFinal.x;
  jugador.posicion.z = posicionFinal.z;

  // Ejecutar callback si existe
  if (onDashEjecutado) {
    onDashEjecutado(direccionDash, huboColision);
  }

  // Terminar dash después de la duración
  setTimeout(() => {
    sistemaDash.estaEnDash = false;
  }, CONFIG.dash.duracion);

  return true;
}

/**
 * Actualiza el sistema de recarga de cargas de dash
 */
export function actualizarRecargaDash() {
  const ahora = performance.now();

  // Verificar cargas que terminaron de recargar
  for (let i = 0; i < CONFIG.dash.cargasMaximas; i++) {
    if (sistemaDash.cargasRecargando[i]) {
      const tiempoTranscurrido = ahora - sistemaDash.inicioRecarga[i];

      if (tiempoTranscurrido >= CONFIG.dash.tiempoRecarga) {
        sistemaDash.cargasActuales++;
        sistemaDash.cargasRecargando[i] = false;
      }
    }
  }

  // Iniciar recarga de la siguiente carga si es necesario
  if (sistemaDash.cargasActuales < CONFIG.dash.cargasMaximas) {
    const indiceSiguienteCarga = sistemaDash.cargasActuales;
    if (!sistemaDash.cargasRecargando[indiceSiguienteCarga]) {
      sistemaDash.cargasRecargando[indiceSiguienteCarga] = true;
      sistemaDash.inicioRecarga[indiceSiguienteCarga] = ahora;
    }
  }
}

/**
 * Obtiene el estado actual del sistema de dash
 * @returns {Object} - Estado del sistema de dash
 */
export function obtenerEstado() {
  return {
    cargasActuales: sistemaDash.cargasActuales,
    cargasMaximas: CONFIG.dash.cargasMaximas,
    estaEnDash: sistemaDash.estaEnDash,
    cargasRecargando: [...sistemaDash.cargasRecargando]
  };
}

/**
 * Verifica si se puede ejecutar un dash
 * @returns {boolean}
 */
export function puedeDash() {
  return !sistemaDash.estaEnDash && sistemaDash.cargasActuales > 0;
}

/**
 * Obtiene el progreso de recarga de cada carga
 * @returns {Array<number>} - Array con el progreso (0-1) de cada carga
 */
export function obtenerProgresoRecarga() {
  const ahora = performance.now();
  const progreso = [];

  for (let i = 0; i < CONFIG.dash.cargasMaximas; i++) {
    if (i < sistemaDash.cargasActuales) {
      progreso.push(1); // Carga completa
    } else if (sistemaDash.cargasRecargando[i]) {
      const tiempoTranscurrido = ahora - sistemaDash.inicioRecarga[i];
      progreso.push(Math.min(tiempoTranscurrido / CONFIG.dash.tiempoRecarga, 1));
    } else {
      progreso.push(0); // Sin carga
    }
  }

  return progreso;
}

/**
 * Reinicia el sistema de dash a valores iniciales
 */
export function reiniciarDash() {
  sistemaDash.cargasActuales = CONFIG.dash.cargasMaximas;
  sistemaDash.estaEnDash = false;
  sistemaDash.cargasRecargando = [false, false, false];
  sistemaDash.inicioRecarga = [0, 0, 0];
  // Reiniciar campos de interpolación
  sistemaDash.dashEnProgreso = false;
  sistemaDash.posicionInicioDash = null;
  sistemaDash.posicionFinDash = null;
  sistemaDash.tiempoInicioDash = 0;
  // Reiniciar campos de extensión automática
  sistemaDash.distanciaExtendida = 0;
  sistemaDash.atravesoEstructura = false;
}

/**
 * Update dash state from server (Requirement 7.5)
 * @param {Object} serverState - Player state from server containing dash info
 */
export function actualizarDesdeServidor(serverState) {
  if (!serverState) return;
  
  // Update dash charges from server (authoritative)
  if (typeof serverState.dashCharges === 'number') {
    sistemaDash.cargasActuales = serverState.dashCharges;
  }
  
  // Update max charges if provided
  if (typeof serverState.maxDashCharges === 'number') {
    // Max charges is typically constant, but sync if server provides it
    // CONFIG.dash.cargasMaximas = serverState.maxDashCharges;
  }
  
  // Reset recharging state based on server charges
  // If server says we have full charges, clear recharging state
  if (sistemaDash.cargasActuales >= CONFIG.dash.cargasMaximas) {
    sistemaDash.cargasRecargando = [false, false, false];
  }
}

/**
 * Aplica los límites del mapa a una posición
 * Requirements: 3.1, 3.2, 3.3
 * 
 * @param {THREE.Vector3|{x: number, y: number, z: number}} posicion - Posición a limitar
 * @returns {THREE.Vector3} - Posición dentro de los límites del mapa
 */
export function aplicarLimitesMapa(posicion) {
  const limites = CONFIG.limitesMapa;
  const margen = limites.margenSeguridad;
  
  // Calcular límites efectivos con margen de seguridad
  const minX = limites.minX + margen;
  const maxX = limites.maxX - margen;
  const minZ = limites.minZ + margen;
  const maxZ = limites.maxZ - margen;
  
  // Crear nueva posición limitada
  const posicionLimitada = new THREE.Vector3(
    Math.max(minX, Math.min(maxX, posicion.x)),
    posicion.y,
    Math.max(minZ, Math.min(maxZ, posicion.z))
  );
  
  return posicionLimitada;
}

/**
 * Calcula la posición final del dash ignorando colisiones internas
 * Solo respeta los límites del mapa (paredes exteriores)
 * Requirements: 2.1, 2.2, 3.1
 * 
 * @param {THREE.Vector3|{x: number, y: number, z: number}} posicionInicial - Posición inicial del jugador
 * @param {THREE.Vector3|{x: number, y: number, z: number}} direccion - Dirección normalizada del dash
 * @param {number} distancia - Distancia del dash
 * @returns {THREE.Vector3} - Posición final del dash (dentro de límites del mapa)
 */
export function calcularPosicionFinalDash(posicionInicial, direccion, distancia) {
  // Calcular posición final sin considerar colisiones internas
  // Requirements: 2.1, 2.2 - El dash atraviesa colisiones internas
  const posicionFinal = new THREE.Vector3(
    posicionInicial.x + direccion.x * distancia,
    posicionInicial.y,
    posicionInicial.z + direccion.z * distancia
  );
  
  // Aplicar límites del mapa (paredes exteriores)
  // Requirements: 3.1, 3.2, 3.3
  return aplicarLimitesMapa(posicionFinal);
}

/**
 * Calcula la posición final del dash con extensión automática para atravesar estructuras
 * Detecta colisiones y extiende la distancia del dash para posicionar al jugador
 * al otro lado de la estructura
 * Requirements: 2.1, 2.2, 6.2, 6.4
 * 
 * @param {THREE.Vector3|{x: number, y: number, z: number}} posicionInicial - Posición inicial del jugador
 * @param {THREE.Vector3|{x: number, y: number, z: number}} direccion - Dirección normalizada del dash
 * @param {number} distanciaBase - Distancia base del dash
 * @returns {{posicionFinal: THREE.Vector3, fueExtendido: boolean, distanciaTotal: number}}
 */
export function calcularPosicionFinalConExtension(posicionInicial, direccion, distanciaBase) {
  // Configuración de extensión
  const extensionMaxima = CONFIG.dash?.extensionMaxima || 3;
  const margenSalida = CONFIG.dash?.margenSalida || 0.5;
  const distanciaMaximaPermitida = distanciaBase * extensionMaxima;
  
  // Convertir a THREE.Vector3 si es necesario
  const posInicial = posicionInicial instanceof THREE.Vector3 
    ? posicionInicial 
    : new THREE.Vector3(posicionInicial.x, posicionInicial.y, posicionInicial.z);
  
  const dir = direccion instanceof THREE.Vector3 
    ? direccion 
    : new THREE.Vector3(direccion.x, direccion.y, direccion.z);
  
  // Requirement 2.1: Detectar colisión y punto de salida de la estructura
  const deteccion = detectarColisionYSalida(posInicial, dir, distanciaMaximaPermitida);
  
  // Si no hay colisión, usar distancia base normal
  if (!deteccion.hayColision) {
    const posicionFinal = new THREE.Vector3(
      posInicial.x + dir.x * distanciaBase,
      posInicial.y,
      posInicial.z + dir.z * distanciaBase
    );
    
    // Aplicar límites del mapa
    // Requirements: 3.1, 3.2, 3.3
    return {
      posicionFinal: aplicarLimitesMapa(posicionFinal),
      fueExtendido: false,
      distanciaTotal: distanciaBase
    };
  }
  
  // Hay colisión - calcular extensión necesaria
  // Requirement 6.2: Extender hasta punto de salida + margen
  if (deteccion.puntoSalida) {
    // Calcular distancia desde posición inicial hasta punto de salida
    const distanciaAlPuntoSalida = Math.sqrt(
      Math.pow(deteccion.puntoSalida.x - posInicial.x, 2) +
      Math.pow(deteccion.puntoSalida.z - posInicial.z, 2)
    );
    
    // Distancia total = distancia al punto de salida + margen de seguridad
    let distanciaExtendida = distanciaAlPuntoSalida + margenSalida;
    
    // Requirement 6.4: Limitar extensión máxima a 3x distancia base
    distanciaExtendida = Math.min(distanciaExtendida, distanciaMaximaPermitida);
    
    const posicionFinal = new THREE.Vector3(
      posInicial.x + dir.x * distanciaExtendida,
      posInicial.y,
      posInicial.z + dir.z * distanciaExtendida
    );
    
    // Aplicar límites del mapa
    // Requirements: 3.1, 3.2, 3.3
    return {
      posicionFinal: aplicarLimitesMapa(posicionFinal),
      fueExtendido: true,
      distanciaTotal: distanciaExtendida
    };
  }
  
  // Hay colisión pero no se encontró punto de salida (estructura muy gruesa)
  // Requirement 6.4: Usar distancia máxima permitida y confiar en desatorar
  const posicionFinal = new THREE.Vector3(
    posInicial.x + dir.x * distanciaMaximaPermitida,
    posInicial.y,
    posInicial.z + dir.z * distanciaMaximaPermitida
  );
  
  // Aplicar límites del mapa
  return {
    posicionFinal: aplicarLimitesMapa(posicionFinal),
    fueExtendido: true,
    distanciaTotal: distanciaMaximaPermitida
  };
}


/**
 * Ejecuta un dash con interpolación suave
 * Reemplaza el dash instantáneo por uno que interpola la posición durante la duración
 * Usa extensión automática para atravesar estructuras
 * Requirements: 1.1, 1.4, 2.1, 2.2, 2.3
 * 
 * @param {Object} jugador - Estado del jugador con posicion y rotacion
 * @param {Object} teclas - Estado de las teclas presionadas
 * @param {Function} onDashEjecutado - Callback cuando se inicia el dash
 * @returns {boolean} - true si se inició el dash
 */
export function ejecutarDashInterpolado(jugador, teclas, onDashEjecutado = null) {
  // No ejecutar si ya hay un dash en progreso o no hay cargas
  if (sistemaDash.estaEnDash || sistemaDash.dashEnProgreso || sistemaDash.cargasActuales <= 0) {
    return false;
  }

  // Calcular dirección del dash
  const direccionDash = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  forward.set(0, 0, -1).applyQuaternion(
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, jugador.rotacion.y, 0, 'YXZ')
    )
  );

  right.set(1, 0, 0).applyQuaternion(
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, jugador.rotacion.y, 0, 'YXZ')
    )
  );

  // Determinar dirección según teclas presionadas
  if (teclas['KeyW']) direccionDash.add(forward);
  if (teclas['KeyS']) direccionDash.sub(forward);
  if (teclas['KeyA']) direccionDash.sub(right);
  if (teclas['KeyD']) direccionDash.add(right);

  // Si no hay dirección de movimiento, dash hacia adelante
  if (direccionDash.length() === 0) {
    direccionDash.copy(forward);
  }

  direccionDash.normalize();

  // Consumir carga
  sistemaDash.cargasActuales--;
  sistemaDash.estaEnDash = true;
  sistemaDash.dashEnProgreso = true;

  // Guardar posición inicial
  // Requirement 1.1: Interpolar desde punto inicial
  sistemaDash.posicionInicioDash = new THREE.Vector3(
    jugador.posicion.x,
    jugador.posicion.y,
    jugador.posicion.z
  );

  // Calcular posición final con extensión automática para atravesar estructuras
  // Requirements: 2.1, 2.2, 2.3 - Extensión automática para atravesar colisiones internas
  const distanciaDash = CONFIG.dash.poder;
  const resultadoExtension = calcularPosicionFinalConExtension(
    jugador.posicion,
    direccionDash,
    distanciaDash
  );
  
  sistemaDash.posicionFinDash = resultadoExtension.posicionFinal;
  sistemaDash.atravesoEstructura = resultadoExtension.fueExtendido;
  sistemaDash.distanciaExtendida = resultadoExtension.distanciaTotal;

  // Guardar tiempo de inicio para interpolación
  sistemaDash.tiempoInicioDash = performance.now();
  sistemaDash.duracionDash = CONFIG.dash.duracion;

  // Ejecutar callback si existe
  if (onDashEjecutado) {
    onDashEjecutado(direccionDash, sistemaDash.posicionFinDash);
  }

  return true;
}


/**
 * Función de interpolación lineal (lerp)
 * @param {number} a - Valor inicial
 * @param {number} b - Valor final
 * @param {number} t - Progreso (0-1)
 * @returns {number} - Valor interpolado
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Actualiza la interpolación del dash en cada frame
 * Debe llamarse en el loop de actualización del juego
 * Requirements: 1.2, 2.3
 * 
 * @param {Object} jugador - Estado del jugador con posicion
 * @param {number} deltaTime - Tiempo transcurrido desde el último frame (ms)
 * @returns {boolean} - true si el dash sigue en progreso
 */
export function actualizarDashInterpolacion(jugador, deltaTime) {
  // Si no hay dash en progreso, no hacer nada
  if (!sistemaDash.dashEnProgreso) {
    return false;
  }

  const ahora = performance.now();
  const tiempoTranscurrido = ahora - sistemaDash.tiempoInicioDash;
  
  // Calcular progreso de interpolación (0 a 1)
  let progreso = tiempoTranscurrido / sistemaDash.duracionDash;
  
  // Clamp progreso entre 0 y 1
  progreso = Math.max(0, Math.min(1, progreso));

  // Interpolar posición usando lerp
  // Requirement 1.2: Actualizar posición en cada frame
  const posInicio = sistemaDash.posicionInicioDash;
  const posFin = sistemaDash.posicionFinDash;
  
  jugador.posicion.x = lerp(posInicio.x, posFin.x, progreso);
  jugador.posicion.z = lerp(posInicio.z, posFin.z, progreso);
  // Mantener Y constante durante el dash
  
  // Verificar si el dash terminó
  // Requirement 1.4: Garantizar posición final exacta
  if (progreso >= 1) {
    // Asegurar posición final exacta
    jugador.posicion.x = posFin.x;
    jugador.posicion.z = posFin.z;
    
    // Requirement 2.3: Desatorar si terminó dentro de geometría
    // Requirement 4.2: Pasar dirección del dash para buscar primero en esa dirección
    if (estaDentroGeometria(jugador.posicion)) {
      // Calcular dirección del dash desde posición inicial a final
      const direccionDash = new THREE.Vector3(
        posFin.x - posInicio.x,
        0,
        posFin.z - posInicio.z
      ).normalize();
      
      const posicionCorregida = desatorarDespuesDash(jugador.posicion, direccionDash);
      if (posicionCorregida) {
        jugador.posicion.x = posicionCorregida.x;
        jugador.posicion.y = posicionCorregida.y;
        jugador.posicion.z = posicionCorregida.z;
      }
    }
    
    // Finalizar dash
    sistemaDash.dashEnProgreso = false;
    sistemaDash.estaEnDash = false;
    sistemaDash.posicionInicioDash = null;
    sistemaDash.posicionFinDash = null;
    
    return false;
  }

  return true;
}
