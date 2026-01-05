/**
 * Sistema de Colisiones Optimizado
 * Utiliza Rapier3D internamente para física determinista
 * Mantiene API existente para compatibilidad con el resto del código
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 4.1, 4.2, 4.3, 5.1, 5.3
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';
import * as Fisica from './fisica.js';

// Estado del sistema de colisiones
let sistemaActivo = false;
let usandoRapier = false;
let escenaRef = null;

// Fallback: estado para sistema de colisiones legacy (raycasting manual)
let collisionMesh = null;
let collisionModel = null;
let raycaster = null;

// Función helper para obtener configuración de colisiones
function getColisionesConfig() {
  return CONFIG.colisiones || {
    radioJugador: 0.5,
    alturaJugador: 1.7,
    margenPared: 0.1,
    rayosHorizontales: 8,
    distanciaRayo: 0.6
  };
}

// Vectores reutilizables para evitar allocaciones (fallback)
const _direccionRayo = new THREE.Vector3();
const _posicionRayo = new THREE.Vector3();
const _desplazamiento = new THREE.Vector3();

/**
 * Inicializa el sistema de colisiones
 * Intenta usar Rapier3D, con fallback a raycasting manual si falla
 * Requirements: 5.1, 5.2
 * 
 * @param {THREE.Scene} scene - Escena de Three.js
 * @param {Function} onProgress - Callback de progreso
 * @returns {Promise<void>}
 */
export async function inicializarColisiones(scene, onProgress = null) {
  escenaRef = scene;
  
  // TEMPORALMENTE DESHABILITADO: Rapier tiene problemas con el raycast del trimesh
  // Usar directamente el fallback de raycasting que funciona
  console.log('🔄 Usando sistema de colisiones con raycasting (fallback)...');
  await inicializarColisionesFallback(scene, onProgress);
}

/**
 * Inicializa el sistema de colisiones con raycasting manual (fallback)
 * @param {THREE.Scene} scene - Escena de Three.js
 * @param {Function} onProgress - Callback de progreso
 * @returns {Promise<void>}
 */
async function inicializarColisionesFallback(scene, onProgress) {
  return new Promise((resolve) => {
    const gltfLoader = new THREE.GLTFLoader();
    
    // Inicializar raycaster
    raycaster = new THREE.Raycaster();
    
    gltfLoader.load('modelos/map_coll.glb', (gltf) => {
      collisionModel = gltf.scene;

      // Escalar el modelo de colisiones a 5x (igual que el mapa visual)
      collisionModel.scale.setScalar(5);
      
      // Buscar el mesh de colisiones en el modelo
      collisionModel.traverse((child) => {
        if (child.isMesh && !collisionMesh) {
          collisionMesh = child;
        }
      });
      
      if (!collisionMesh) {
        console.error('❌ No se encontró mesh en map_coll.glb');
        sistemaActivo = false;
        resolve();
        return;
      }
      
      // Añadir el modelo a la escena (invisible) para que las matrices funcionen
      collisionModel.visible = false;
      if (escenaRef) {
        escenaRef.add(collisionModel);
      }
      
      // Actualizar matrices del mundo
      collisionModel.updateMatrixWorld(true);
      collisionMesh.updateMatrixWorld(true);
      
      usandoRapier = false;
      sistemaActivo = true;
      console.log('✅ Sistema de colisiones inicializado (fallback raycasting)');
      console.log('💡 Usa window.toggleCollisionDebug(true) para ver las colisiones');
      resolve();
    }, (progress) => {
      if (progress.total > 0) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        console.log(`📦 Cargando geometría de colisiones: ${percent}%`);
        if (onProgress) onProgress(percent);
      }
    }, (error) => {
      console.error('❌ Error cargando geometría de colisiones:', error);
      sistemaActivo = false;
      resolve();
    });
  });
}

/**
 * Verifica colisión y retorna posición corregida
 * Usa Rapier3D si está disponible, fallback a raycasting manual
 * Requirements: 2.3, 2.4, 4.3, 5.1, 6.1
 * 
 * @param {THREE.Vector3} posicionActual - Posición actual del jugador
 * @param {THREE.Vector3} posicionDeseada - Posición a la que quiere moverse
 * @param {number} radio - Radio del jugador para colisiones
 * @returns {THREE.Vector3} - Posición final después de resolver colisiones
 */
export function resolverColision(posicionActual, posicionDeseada, radio = null) {
  const config = getColisionesConfig();
  radio = radio || config.radioJugador;
  
  // Si el sistema no está activo, permitir movimiento libre
  if (!sistemaActivo) {
    return posicionDeseada.clone();
  }
  
  // Usar Rapier si está disponible
  if (usandoRapier && Fisica.estaActivo()) {
    return resolverColisionRapier(posicionActual, posicionDeseada);
  }
  
  // Fallback: usar raycasting manual
  return resolverColisionFallback(posicionActual, posicionDeseada, radio);
}

/**
 * Resuelve colisiones usando Rapier3D character controller
 * Requirements: 2.3, 2.4, 6.1
 * 
 * @param {THREE.Vector3} posicionActual - Posición actual del jugador
 * @param {THREE.Vector3} posicionDeseada - Posición deseada
 * @returns {THREE.Vector3} - Posición corregida
 */
function resolverColisionRapier(posicionActual, posicionDeseada) {
  // Calcular desplazamiento deseado
  const desplazamiento = posicionDeseada.clone().sub(posicionActual);
  
  // Si no hay movimiento significativo, retornar posición actual
  if (desplazamiento.length() < 0.001) {
    return posicionActual.clone();
  }
  
  // Usar el character controller de Rapier para mover al jugador
  // El character controller maneja automáticamente:
  // - Sliding en paredes (Requirement 6.1)
  // - Subir escalones (Requirement 2.2)
  // - Mantenerse en rampas (Requirement 2.1, 2.3)
  const resultado = Fisica.moverJugador(posicionActual, desplazamiento, 1/30);
  
  return resultado.posicion;
}

/**
 * Resuelve colisiones usando raycasting manual (fallback)
 * @param {THREE.Vector3} posicionActual - Posición actual
 * @param {THREE.Vector3} posicionDeseada - Posición deseada
 * @param {number} radio - Radio del jugador
 * @returns {THREE.Vector3} - Posición corregida
 */
function resolverColisionFallback(posicionActual, posicionDeseada, radio) {
  if (!collisionMesh) {
    return posicionDeseada.clone();
  }
  
  const config = getColisionesConfig();
  const margen = config.margenPared;
  
  // Calcular dirección del movimiento
  _desplazamiento.subVectors(posicionDeseada, posicionActual);
  const distanciaMovimiento = _desplazamiento.length();
  
  // Si no hay movimiento significativo, retornar posición actual
  if (distanciaMovimiento < 0.001) {
    return posicionActual.clone();
  }
  
  // Verificar si la posición actual ya está dentro de una pared
  const enColisionActual = hayColisionEnPosicionFallback(posicionActual, radio, margen);
  
  // Si ya estamos en colisión, permitir movimiento que nos aleje de la pared
  if (enColisionActual) {
    const enColisionDeseada = hayColisionEnPosicionFallback(posicionDeseada, radio, margen);
    
    if (!enColisionDeseada) {
      return posicionDeseada.clone();
    }
    
    return posicionActual.clone();
  }
  
  // Intentar movimiento completo primero
  if (!hayColisionEnPosicionFallback(posicionDeseada, radio, margen)) {
    return posicionDeseada.clone();
  }
  
  // Hay colisión: intentar sliding en cada eje por separado
  const posicionX = posicionActual.clone();
  posicionX.x = posicionDeseada.x;
  
  if (!hayColisionEnPosicionFallback(posicionX, radio, margen)) {
    return posicionX;
  }
  
  const posicionZ = posicionActual.clone();
  posicionZ.z = posicionDeseada.z;
  
  if (!hayColisionEnPosicionFallback(posicionZ, radio, margen)) {
    return posicionZ;
  }
  
  return posicionActual.clone();
}

/**
 * Verifica si hay colisión en una posición específica (fallback)
 * @param {THREE.Vector3} posicion - Posición a verificar (posición de los ojos)
 * @param {number} radio - Radio del jugador
 * @param {number} margen - Margen de separación
 * @returns {boolean} - true si hay colisión
 */
function hayColisionEnPosicionFallback(posicion, radio, margen) {
  if (!collisionModel || !raycaster) {
    return false;
  }
  
  const numRayos = 8;
  const distanciaDeteccion = radio + margen;
  
  // La posición es la de los ojos
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  const posicionPies = posicion.y - alturaOjos;
  
  // Ángulo máximo de rampa caminable (en radianes)
  const anguloMaxRampa = (CONFIG.fisica?.anguloMaxRampa || 50) * Math.PI / 180;
  const cosAnguloMaxRampa = Math.cos(anguloMaxRampa);
  
  // Verificar colisiones a diferentes alturas desde los pies
  // Empezar más arriba para no detectar rampas como paredes
  const alturas = [
    posicionPies + 0.5,  // A la altura de las rodillas (evita detectar rampas bajas)
    posicionPies + 1.0,  // A la altura de la cintura
    posicionPies + 1.4   // A la altura del pecho
  ];
  
  for (const altura of alturas) {
    for (let i = 0; i < numRayos; i++) {
      const angulo = (i / numRayos) * Math.PI * 2;
      
      _direccionRayo.set(
        Math.cos(angulo),
        0,
        Math.sin(angulo)
      );
      
      _posicionRayo.set(posicion.x, altura, posicion.z);
      
      raycaster.set(_posicionRayo, _direccionRayo);
      raycaster.far = distanciaDeteccion;
      
      const intersecciones = raycaster.intersectObject(collisionModel, true);
      
      if (intersecciones.length > 0 && intersecciones[0].distance < distanciaDeteccion) {
        const hit = intersecciones[0];
        
        // Verificar si es una rampa caminable (no una pared)
        if (hit.face && hit.face.normal) {
          const normalMundo = hit.face.normal.clone();
          normalMundo.transformDirection(collisionModel.matrixWorld);
          normalMundo.normalize();
          
          // Si la normal apunta hacia arriba (es suelo/rampa), ignorar
          // Una rampa tiene normal.y > cos(anguloMaxRampa)
          if (normalMundo.y > cosAnguloMaxRampa) {
            // Es una rampa caminable, no es una pared
            continue;
          }
        }
        
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Verifica si hay colisión con el techo al saltar
 * @param {THREE.Vector3} posicion - Posición actual (ojos)
 * @param {number} velocidadY - Velocidad vertical actual
 * @returns {{hayTecho: boolean, alturaTecho: number}}
 */
export function verificarTecho(posicion, velocidadY = 0) {
  const resultado = {
    hayTecho: false,
    alturaTecho: Infinity
  };
  
  if (!collisionModel || !raycaster || velocidadY <= 0) {
    return resultado;
  }
  
  // La posición es la de los ojos
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  
  // Raycast hacia arriba desde la cabeza
  const margenCabeza = 0.3; // Espacio sobre la cabeza
  _posicionRayo.set(posicion.x, posicion.y + margenCabeza, posicion.z);
  _direccionRayo.set(0, 1, 0);
  
  raycaster.set(_posicionRayo, _direccionRayo);
  raycaster.far = 3.0; // Distancia máxima de detección de techo
  
  const intersecciones = raycaster.intersectObject(collisionModel, true);
  
  if (intersecciones.length > 0) {
    const hit = intersecciones[0];
    
    // Verificar que es un techo (normal apuntando hacia abajo)
    if (hit.face && hit.face.normal) {
      const normalMundo = hit.face.normal.clone();
      normalMundo.transformDirection(collisionModel.matrixWorld);
      normalMundo.normalize();
      
      // Si la normal apunta hacia abajo (Y negativo), es un techo
      if (normalMundo.y < -0.5) {
        resultado.hayTecho = true;
        resultado.alturaTecho = hit.point.y;
      }
    }
  }
  
  return resultado;
}

/**
 * Verifica si una posición está en el suelo y retorna la altura
 * Usa Rapier3D si está disponible, fallback a raycasting manual
 * Requirements: 3.1, 3.2, 3.3, 3.4, 5.3
 * 
 * @param {THREE.Vector3} posicion - Posición a verificar
 * @returns {{enSuelo: boolean, altura: number, normal?: THREE.Vector3, enRampa?: boolean}}
 */
export function verificarSuelo(posicion) {
  // Si el sistema no está activo, usar altura por defecto
  if (!sistemaActivo) {
    return {
      enSuelo: true,
      altura: 0,
      normal: new THREE.Vector3(0, 1, 0),
      enRampa: false
    };
  }
  
  // Usar Rapier si está disponible
  if (usandoRapier && Fisica.estaActivo()) {
    return Fisica.verificarSuelo(posicion);
  }
  
  // Fallback: usar raycasting manual
  return verificarSueloFallback(posicion);
}

/**
 * Verifica suelo usando raycasting manual (fallback)
 * Mejorado para manejar bordes de objetos correctamente
 * @param {THREE.Vector3} posicion - Posición a verificar (posición de los ojos)
 * @returns {{enSuelo: boolean, altura: number, normal: THREE.Vector3, distancia: number, enRampa: boolean}}
 */
function verificarSueloFallback(posicion) {
  const resultado = {
    enSuelo: false,
    altura: 0,
    normal: new THREE.Vector3(0, 1, 0),
    distancia: Infinity,
    enRampa: false
  };
  
  if (!collisionMesh || !raycaster) {
    resultado.enSuelo = true;
    resultado.altura = 0;
    return resultado;
  }
  
  // La posición es la de los ojos, calcular posición de los pies
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  const posicionPies = posicion.y - alturaOjos;
  
  // Hacer raycast desde más arriba para detectar superficies elevadas
  const alturaMaxEscalon = CONFIG.fisica?.alturaMaxEscalon || 0.8;
  
  // Origen: desde arriba del escalón máximo posible
  const origenY = posicionPies + alturaMaxEscalon + 0.5;
  
  // Hacer múltiples raycasts para detectar mejor los bordes
  // Un raycast central y 4 en las esquinas del radio del jugador
  const radioJugador = CONFIG.colisiones?.radioJugador || 0.4;
  const puntosRaycast = [
    { x: 0, z: 0 },  // Centro
    { x: radioJugador * 0.7, z: 0 },  // Adelante
    { x: -radioJugador * 0.7, z: 0 }, // Atrás
    { x: 0, z: radioJugador * 0.7 },  // Derecha
    { x: 0, z: -radioJugador * 0.7 }  // Izquierda
  ];
  
  let mejorAltura = -Infinity;
  let mejorNormal = new THREE.Vector3(0, 1, 0);
  let hayHit = false;
  let hitsCercanos = 0;
  
  for (const punto of puntosRaycast) {
    _posicionRayo.set(posicion.x + punto.x, origenY, posicion.z + punto.z);
    _direccionRayo.set(0, -1, 0);
    
    raycaster.set(_posicionRayo, _direccionRayo);
    raycaster.far = alturaMaxEscalon + 3.0;
    
    const intersecciones = raycaster.intersectObject(collisionModel, true);
    
    if (intersecciones.length > 0) {
      const hit = intersecciones[0];
      hayHit = true;
      
      // Usar la altura más alta encontrada (para no caer en bordes)
      if (hit.point.y > mejorAltura) {
        mejorAltura = hit.point.y;
        
        // Obtener normal si está disponible
        if (hit.face && hit.face.normal) {
          mejorNormal = hit.face.normal.clone();
          mejorNormal.transformDirection(collisionModel.matrixWorld);
          mejorNormal.normalize();
        }
      }
      
      // Contar hits cercanos al nivel de los pies
      const distanciaAlPie = Math.abs(hit.point.y - posicionPies);
      if (distanciaAlPie < 0.5) {
        hitsCercanos++;
      }
    }
  }
  
  if (hayHit) {
    resultado.altura = mejorAltura;
    resultado.normal = mejorNormal;
    
    // Calcular distancia desde los pies al suelo detectado
    const distanciaPiesASuelo = posicionPies - mejorAltura;
    resultado.distancia = distanciaPiesASuelo;
    
    // El jugador está "en el suelo" si:
    // 1. Sus pies están cerca del suelo (parado o cayendo cerca)
    // 2. O hay un escalón/rampa que puede subir
    // 3. Y hay suficientes hits cercanos (no está en un borde muy fino)
    const cercaDelSuelo = distanciaPiesASuelo >= -0.15 && distanciaPiesASuelo < 0.5;
    const puedeSubirEscalon = distanciaPiesASuelo < -0.15 && distanciaPiesASuelo >= -alturaMaxEscalon;
    
    // Requerir al menos 2 hits cercanos para considerar que está en suelo sólido
    // Esto evita quedarse atrapado en bordes muy finos
    const sueloSolido = hitsCercanos >= 2 || (hitsCercanos >= 1 && cercaDelSuelo);
    
    resultado.enSuelo = (cercaDelSuelo || puedeSubirEscalon) && sueloSolido;
    
    // Detectar rampa
    if (resultado.normal) {
      const anguloNormal = Math.acos(Math.abs(resultado.normal.y)) * (180 / Math.PI);
      resultado.enRampa = resultado.enSuelo && anguloNormal > 5 && anguloNormal <= 50;
    }
  } else {
    // No hay suelo - cayendo al vacío
    resultado.enSuelo = false;
    resultado.altura = -100; // Valor muy bajo
    resultado.distancia = Infinity;
  }
  
  return resultado;
}

/**
 * Realiza un raycast para balas contra la geometría del mapa
 * Usa Rapier3D si está disponible
 * Requirements: 1.1, 1.2
 * 
 * @param {THREE.Vector3} origen - Origen del rayo
 * @param {THREE.Vector3} direccion - Dirección normalizada
 * @param {number} distanciaMax - Distancia máxima
 * @returns {{hit: boolean, punto: THREE.Vector3, distancia: number, normal?: THREE.Vector3} | null}
 */
export function raycastBala(origen, direccion, distanciaMax) {
  if (!sistemaActivo) {
    return null;
  }
  
  // Usar Rapier si está disponible
  if (usandoRapier && Fisica.estaActivo()) {
    return Fisica.raycastBala(origen, direccion, distanciaMax);
  }
  
  // Fallback: usar raycasting de Three.js
  return raycastBalaFallback(origen, direccion, distanciaMax);
}

/**
 * Realiza un shape cast para el movimiento del dash
 * Detecta colisiones durante todo el trayecto y calcula posición final válida
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * 
 * @param {THREE.Vector3} posicionInicial - Posición inicial del jugador
 * @param {THREE.Vector3} direccionDash - Dirección normalizada del dash
 * @param {number} distanciaDash - Distancia total del dash
 * @returns {{posicionFinal: THREE.Vector3, colision: boolean, distanciaRecorrida: number, puntoImpacto: THREE.Vector3|null}}
 */
export function shapeCastDash(posicionInicial, direccionDash, distanciaDash) {
  // Log para verificar qué sistema se usa
  if (!window._dashSystemLogged) {
    console.log('🎯 Sistema de Dash:', {
      usandoRapier: usandoRapier,
      fisicaActiva: Fisica.estaActivo(),
      sistemaColisionesActivo: sistemaActivo,
      collisionModelCargado: !!collisionModel
    });
    window._dashSystemLogged = true;
  }
  
  // Usar Rapier si está disponible
  if (usandoRapier && Fisica.estaActivo()) {
    console.log('🚀 Dash usando Rapier3D');
    return Fisica.shapeCastDash(posicionInicial, direccionDash, distanciaDash);
  }
  
  // Fallback: usar resolución de colisiones paso a paso
  console.log('🚀 Dash usando Fallback (raycasting)');
  return shapeCastDashFallback(posicionInicial, direccionDash, distanciaDash);
}

/**
 * Shape cast para dash usando raycasting manual (fallback)
 * Mejorado para detectar colisiones y DETENER el dash antes de atravesar estructuras
 * Requirements: 3.1, 3.3, 3.4 - No permite atravesar estructuras bajo ninguna circunstancia
 * @param {THREE.Vector3} posicionInicial - Posición inicial
 * @param {THREE.Vector3} direccionDash - Dirección del dash
 * @param {number} distanciaDash - Distancia del dash
 * @returns {{posicionFinal: THREE.Vector3, colision: boolean, distanciaRecorrida: number, puntoImpacto: THREE.Vector3|null}}
 */
function shapeCastDashFallback(posicionInicial, direccionDash, distanciaDash) {
  if (!collisionModel || !raycaster) {
    // Sin sistema de colisiones, dash completo
    return {
      posicionFinal: new THREE.Vector3(
        posicionInicial.x + direccionDash.x * distanciaDash,
        posicionInicial.y,
        posicionInicial.z + direccionDash.z * distanciaDash
      ),
      colision: false,
      distanciaRecorrida: distanciaDash,
      puntoImpacto: null
    };
  }

  const config = getColisionesConfig();
  const radio = config.radioJugador || 0.4;
  const margen = config.margenPared || 0.1;
  // Margen de seguridad adicional para garantizar que no atravesamos
  const margenSeguridad = 0.15;
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  const posicionPies = posicionInicial.y - alturaOjos;

  // Hacer múltiples raycasts en la dirección del dash a diferentes alturas
  // para detectar colisiones con paredes
  // Requirement 3.3: Respetar colisiones en diagonal (múltiples alturas)
  const alturas = [
    posicionPies + 0.3, // Cerca de los pies
    posicionPies + 0.6, // Espinillas
    posicionPies + 0.9, // Rodillas
    posicionPies + 1.2, // Cintura
    posicionPies + 1.5  // Pecho
  ];

  let distanciaMinima = distanciaDash;
  let hayColision = false;
  let puntoImpacto = null;

  // Normalizar dirección del dash en el plano horizontal
  const direccionNormalizada = new THREE.Vector3(direccionDash.x, 0, direccionDash.z).normalize();

  // Raycast central en la dirección del dash
  for (const altura of alturas) {
    _posicionRayo.set(posicionInicial.x, altura, posicionInicial.z);
    _direccionRayo.copy(direccionNormalizada);

    raycaster.set(_posicionRayo, _direccionRayo);
    raycaster.far = distanciaDash + radio + margen;

    const intersecciones = raycaster.intersectObject(collisionModel, true);

    if (intersecciones.length > 0) {
      const hit = intersecciones[0];
      
      // Verificar que no es una rampa (solo paredes)
      if (hit.face && hit.face.normal) {
        const normalMundo = hit.face.normal.clone();
        normalMundo.transformDirection(collisionModel.matrixWorld);
        normalMundo.normalize();

        // Si la normal es mayormente horizontal, es una pared
        // Requirement 3.1: Detener dash antes de atravesar la estructura
        if (Math.abs(normalMundo.y) < 0.5) {
          // Calcular distancia segura (antes de la pared con margen de seguridad)
          const distanciaSegura = Math.max(0, hit.distance - radio - margen - margenSeguridad);
          
          if (distanciaSegura < distanciaMinima) {
            distanciaMinima = distanciaSegura;
            hayColision = true;
            puntoImpacto = hit.point.clone();
          }
        }
      }
    }
  }

  // También hacer raycasts laterales para detectar colisiones con el cuerpo del jugador
  // Requirement 3.3: Respetar ambas superficies de colisión en esquinas
  const direccionLateral = new THREE.Vector3(-direccionNormalizada.z, 0, direccionNormalizada.x);
  const offsetsLaterales = [-radio * 0.9, -radio * 0.5, radio * 0.5, radio * 0.9];

  for (const offset of offsetsLaterales) {
    for (const altura of alturas) {
      const origenLateral = new THREE.Vector3(
        posicionInicial.x + direccionLateral.x * offset,
        altura,
        posicionInicial.z + direccionLateral.z * offset
      );

      raycaster.set(origenLateral, direccionNormalizada);
      raycaster.far = distanciaDash + margen;

      const intersecciones = raycaster.intersectObject(collisionModel, true);

      if (intersecciones.length > 0) {
        const hit = intersecciones[0];
        
        if (hit.face && hit.face.normal) {
          const normalMundo = hit.face.normal.clone();
          normalMundo.transformDirection(collisionModel.matrixWorld);
          normalMundo.normalize();

          if (Math.abs(normalMundo.y) < 0.5) {
            // Requirement 3.2: Posicionar en el punto más cercano válido antes de la colisión
            const distanciaSegura = Math.max(0, hit.distance - margen - margenSeguridad);
            
            if (distanciaSegura < distanciaMinima) {
              distanciaMinima = distanciaSegura;
              hayColision = true;
              puntoImpacto = hit.point.clone();
            }
          }
        }
      }
    }
  }

  // Requirement 3.4: Calcular distancia disponible antes de la colisión
  // Si estamos muy cerca de una pared, reducir aún más la distancia
  if (hayColision && distanciaMinima < 0.5) {
    distanciaMinima = Math.max(0, distanciaMinima - 0.1);
  }

  // Calcular posición final
  let posicionFinal = new THREE.Vector3(
    posicionInicial.x + direccionNormalizada.x * distanciaMinima,
    posicionInicial.y,
    posicionInicial.z + direccionNormalizada.z * distanciaMinima
  );

  // Verificación final: asegurar que la posición final no está en colisión
  // Requirement 3.1: No permitir atravesar estructuras bajo ninguna circunstancia
  let intentos = 0;
  const maxIntentos = 5;
  while (hayColisionEnPosicionFallback(posicionFinal, radio, margen) && intentos < maxIntentos) {
    // Retroceder incrementalmente hasta encontrar posición válida
    distanciaMinima = Math.max(0, distanciaMinima - 0.15);
    posicionFinal.set(
      posicionInicial.x + direccionNormalizada.x * distanciaMinima,
      posicionInicial.y,
      posicionInicial.z + direccionNormalizada.z * distanciaMinima
    );
    intentos++;
    hayColision = true;
  }

  // Si después de todos los intentos sigue en colisión, quedarse en posición inicial
  if (hayColisionEnPosicionFallback(posicionFinal, radio, margen)) {
    posicionFinal.copy(posicionInicial);
    distanciaMinima = 0;
    hayColision = true;
    console.log('⚠️ Dash bloqueado: no hay espacio para moverse');
  }

  // Log del resultado del dash
  console.log('🎯 Resultado Dash Fallback:', {
    colision: hayColision,
    distanciaOriginal: distanciaDash,
    distanciaRecorrida: distanciaMinima,
    posicionInicial: `(${posicionInicial.x.toFixed(2)}, ${posicionInicial.z.toFixed(2)})`,
    posicionFinal: `(${posicionFinal.x.toFixed(2)}, ${posicionFinal.z.toFixed(2)})`
  });

  return {
    posicionFinal: posicionFinal,
    colision: hayColision,
    distanciaRecorrida: distanciaMinima,
    puntoImpacto: puntoImpacto
  };
}

/**
 * Verifica si una posición es válida (no está dentro de geometría)
 * Requirements: 4.4
 * 
 * @param {THREE.Vector3} posicion - Posición a verificar
 * @returns {{valida: boolean, posicionCorregida: THREE.Vector3}}
 */
export function verificarPosicionValida(posicion) {
  // Usar Rapier si está disponible
  if (usandoRapier && Fisica.estaActivo()) {
    return Fisica.verificarPosicionValida(posicion);
  }
  
  // Fallback: verificar con raycasting
  return verificarPosicionValidaFallback(posicion);
}

/**
 * Verifica si una posición es válida usando raycasting (fallback)
 * @param {THREE.Vector3} posicion - Posición a verificar (ojos)
 * @returns {{valida: boolean, posicionCorregida: THREE.Vector3}}
 */
function verificarPosicionValidaFallback(posicion) {
  const config = getColisionesConfig();
  const radio = config.radioJugador || 0.4;
  const margen = config.margenPared || 0.1;
  
  // Verificar si está en colisión
  const enColision = hayColisionEnPosicionFallback(posicion, radio, margen);
  
  if (!enColision) {
    return {
      valida: true,
      posicionCorregida: posicion.clone()
    };
  }
  
  // Está en colisión - intentar encontrar posición válida
  const posicionCorregida = desatorarJugador(posicion);
  
  return {
    valida: false,
    posicionCorregida: posicionCorregida
  };
}

/**
 * Intenta desatorar al jugador si está dentro de una colisión
 * Busca la dirección más cercana para salir de la geometría
 * @param {THREE.Vector3} posicion - Posición actual (ojos)
 * @returns {THREE.Vector3} - Posición corregida fuera de la colisión
 */
export function desatorarJugador(posicion) {
  if (!collisionModel || !raycaster) {
    return posicion.clone();
  }
  
  const config = getColisionesConfig();
  const radio = config.radioJugador || 0.4;
  const margen = config.margenPared || 0.1;
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  const posicionPies = posicion.y - alturaOjos;
  
  // Direcciones para buscar salida (8 direcciones horizontales + arriba)
  const direcciones = [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
    { x: 0.707, y: 0, z: 0.707 },
    { x: -0.707, y: 0, z: 0.707 },
    { x: 0.707, y: 0, z: -0.707 },
    { x: -0.707, y: 0, z: -0.707 },
    { x: 0, y: 1, z: 0 }  // Arriba (para salir de techos)
  ];
  
  let mejorPosicion = posicion.clone();
  let menorDistancia = Infinity;
  let encontradaSalida = false;
  
  // Para cada dirección, hacer raycast inverso para encontrar la superficie más cercana
  for (const dir of direcciones) {
    // Altura de prueba (cintura del jugador)
    const alturaTest = posicionPies + 1.0;
    
    // Raycast desde la posición actual hacia afuera
    _posicionRayo.set(posicion.x, alturaTest, posicion.z);
    _direccionRayo.set(dir.x, dir.y, dir.z);
    
    raycaster.set(_posicionRayo, _direccionRayo);
    raycaster.far = 5.0; // Distancia máxima de búsqueda
    
    const intersecciones = raycaster.intersectObject(collisionModel, true);
    
    if (intersecciones.length > 0) {
      const hit = intersecciones[0];
      
      // Calcular posición justo fuera de la superficie
      const distanciaSalida = hit.distance + radio + margen + 0.1;
      const nuevaPosicion = new THREE.Vector3(
        posicion.x + dir.x * distanciaSalida,
        dir.y !== 0 ? posicion.y + dir.y * distanciaSalida : posicion.y,
        posicion.z + dir.z * distanciaSalida
      );
      
      // Verificar que la nueva posición es válida
      if (!hayColisionEnPosicionFallback(nuevaPosicion, radio, margen)) {
        if (distanciaSalida < menorDistancia) {
          menorDistancia = distanciaSalida;
          mejorPosicion = nuevaPosicion;
          encontradaSalida = true;
        }
      }
    } else {
      // No hay intersección en esta dirección - podemos movernos libremente
      // Mover un poco en esa dirección
      const distanciaMovimiento = radio + margen + 0.2;
      const nuevaPosicion = new THREE.Vector3(
        posicion.x + dir.x * distanciaMovimiento,
        dir.y !== 0 ? posicion.y + dir.y * distanciaMovimiento : posicion.y,
        posicion.z + dir.z * distanciaMovimiento
      );
      
      // Verificar que la nueva posición es válida
      if (!hayColisionEnPosicionFallback(nuevaPosicion, radio, margen)) {
        if (distanciaMovimiento < menorDistancia) {
          menorDistancia = distanciaMovimiento;
          mejorPosicion = nuevaPosicion;
          encontradaSalida = true;
        }
      }
    }
  }
  
  // Si no encontramos salida horizontal, intentar mover hacia arriba
  if (!encontradaSalida) {
    // Buscar suelo debajo y mover arriba de él
    const estadoSuelo = verificarSueloFallback(posicion);
    if (estadoSuelo.altura > -100) {
      mejorPosicion = new THREE.Vector3(
        posicion.x,
        estadoSuelo.altura + alturaOjos + 0.1,
        posicion.z
      );
      console.log('🔧 Jugador desatorado hacia arriba');
    }
  } else {
    console.log('🔧 Jugador desatorado en dirección horizontal');
  }
  
  return mejorPosicion;
}

/**
 * Lanza un raycast inverso desde un punto lejano hacia atrás para encontrar el punto de salida de una estructura
 * Requirements: 4.1, 6.1
 * 
 * @param {THREE.Vector3} puntoColision - Punto donde el raycast original colisionó (entrada a la estructura)
 * @param {THREE.Vector3} direccion - Dirección normalizada del dash (hacia donde se mueve)
 * @param {number} distanciaMaxima - Distancia máxima para buscar el punto de salida
 * @returns {{encontrado: boolean, puntoSalida: THREE.Vector3|null, distanciaDesdeEntrada: number}}
 */
export function raycastInverso(puntoColision, direccion, distanciaMaxima) {
  if (!collisionModel || !raycaster) {
    return {
      encontrado: false,
      puntoSalida: null,
      distanciaDesdeEntrada: 0
    };
  }
  
  const config = getColisionesConfig();
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  
  // Calcular punto de origen lejano (más allá de la distancia máxima en la dirección del dash)
  // Lanzamos el raycast desde este punto hacia atrás (dirección opuesta)
  const puntoLejano = new THREE.Vector3(
    puntoColision.x + direccion.x * distanciaMaxima,
    puntoColision.y,
    puntoColision.z + direccion.z * distanciaMaxima
  );
  
  // Dirección inversa (hacia el punto de colisión original)
  const direccionInversa = new THREE.Vector3(
    -direccion.x,
    0,
    -direccion.z
  ).normalize();
  
  // Hacer raycast inverso a diferentes alturas para encontrar el punto de salida más confiable
  const posicionPies = puntoColision.y - alturaOjos;
  const alturas = [
    posicionPies + 0.5,  // Rodillas
    posicionPies + 1.0,  // Cintura
    posicionPies + 1.4   // Pecho
  ];
  
  let puntoSalidaMasCercano = null;
  let distanciaMenor = Infinity;
  
  for (const altura of alturas) {
    _posicionRayo.set(puntoLejano.x, altura, puntoLejano.z);
    _direccionRayo.copy(direccionInversa);
    
    raycaster.set(_posicionRayo, _direccionRayo);
    raycaster.far = distanciaMaxima;
    
    const intersecciones = raycaster.intersectObject(collisionModel, true);
    
    if (intersecciones.length > 0) {
      const hit = intersecciones[0];
      
      // Verificar que es una pared (normal mayormente horizontal)
      if (hit.face && hit.face.normal) {
        const normalMundo = hit.face.normal.clone();
        normalMundo.transformDirection(collisionModel.matrixWorld);
        normalMundo.normalize();
        
        // Solo considerar paredes (no suelos/techos)
        if (Math.abs(normalMundo.y) < 0.5) {
          // El punto de salida es donde el raycast inverso golpea la estructura
          // (el lado opuesto de donde entramos)
          const distanciaDesdeOrigen = hit.distance;
          const distanciaDesdeEntrada = distanciaMaxima - distanciaDesdeOrigen;
          
          if (distanciaDesdeEntrada < distanciaMenor && distanciaDesdeEntrada > 0) {
            distanciaMenor = distanciaDesdeEntrada;
            puntoSalidaMasCercano = new THREE.Vector3(
              puntoLejano.x + direccionInversa.x * distanciaDesdeOrigen,
              puntoColision.y,
              puntoLejano.z + direccionInversa.z * distanciaDesdeOrigen
            );
          }
        }
      }
    }
  }
  
  if (puntoSalidaMasCercano) {
    return {
      encontrado: true,
      puntoSalida: puntoSalidaMasCercano,
      distanciaDesdeEntrada: distanciaMenor
    };
  }
  
  return {
    encontrado: false,
    puntoSalida: null,
    distanciaDesdeEntrada: 0
  };
}

/**
 * Detecta colisión en la dirección del dash y calcula el punto de salida de la estructura
 * Requirements: 2.1, 4.1, 6.1
 * 
 * @param {THREE.Vector3} origen - Posición inicial del jugador (ojos)
 * @param {THREE.Vector3} direccion - Dirección normalizada del dash
 * @param {number} distanciaMaxima - Distancia máxima del dash (incluyendo extensión)
 * @returns {{hayColision: boolean, puntoEntrada: THREE.Vector3|null, puntoSalida: THREE.Vector3|null, grosorEstructura: number}}
 */
export function detectarColisionYSalida(origen, direccion, distanciaMaxima) {
  if (!collisionModel || !raycaster) {
    return {
      hayColision: false,
      puntoEntrada: null,
      puntoSalida: null,
      grosorEstructura: 0
    };
  }
  
  const config = getColisionesConfig();
  const radio = config.radioJugador || 0.4;
  const margen = config.margenPared || 0.1;
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  const posicionPies = origen.y - alturaOjos;
  
  // Hacer raycasts a diferentes alturas para detectar colisiones
  const alturas = [
    posicionPies + 0.5,  // Rodillas
    posicionPies + 1.0,  // Cintura
    posicionPies + 1.4   // Pecho
  ];
  
  let puntoEntradaMasCercano = null;
  let distanciaEntradaMenor = Infinity;
  
  // Paso 1: Detectar punto de entrada (primera colisión en la dirección del dash)
  for (const altura of alturas) {
    _posicionRayo.set(origen.x, altura, origen.z);
    _direccionRayo.set(direccion.x, 0, direccion.z).normalize();
    
    raycaster.set(_posicionRayo, _direccionRayo);
    raycaster.far = distanciaMaxima + radio;
    
    const intersecciones = raycaster.intersectObject(collisionModel, true);
    
    if (intersecciones.length > 0) {
      const hit = intersecciones[0];
      
      // Verificar que es una pared (normal mayormente horizontal)
      if (hit.face && hit.face.normal) {
        const normalMundo = hit.face.normal.clone();
        normalMundo.transformDirection(collisionModel.matrixWorld);
        normalMundo.normalize();
        
        // Solo considerar paredes (no suelos/techos)
        if (Math.abs(normalMundo.y) < 0.5) {
          if (hit.distance < distanciaEntradaMenor) {
            distanciaEntradaMenor = hit.distance;
            puntoEntradaMasCercano = new THREE.Vector3(
              origen.x + direccion.x * hit.distance,
              origen.y,
              origen.z + direccion.z * hit.distance
            );
          }
        }
      }
    }
  }
  
  // Si no hay colisión, retornar sin colisión
  if (!puntoEntradaMasCercano) {
    return {
      hayColision: false,
      puntoEntrada: null,
      puntoSalida: null,
      grosorEstructura: 0
    };
  }
  
  // Paso 2: Usar raycast inverso para encontrar el punto de salida
  // La distancia máxima para el raycast inverso es la distancia restante después del punto de entrada
  const distanciaRestante = distanciaMaxima - distanciaEntradaMenor;
  const extensionMaxima = CONFIG.dash?.extensionMaxima || 3;
  const distanciaBase = CONFIG.dash?.poder || 5;
  const distanciaBusquedaSalida = Math.min(distanciaRestante + distanciaBase * extensionMaxima, distanciaBase * extensionMaxima);
  
  const resultadoInverso = raycastInverso(
    puntoEntradaMasCercano,
    direccion,
    distanciaBusquedaSalida
  );
  
  if (resultadoInverso.encontrado) {
    return {
      hayColision: true,
      puntoEntrada: puntoEntradaMasCercano,
      puntoSalida: resultadoInverso.puntoSalida,
      grosorEstructura: resultadoInverso.distanciaDesdeEntrada
    };
  }
  
  // Si no encontramos punto de salida, la estructura es muy gruesa o no tiene salida
  // Retornar solo el punto de entrada
  return {
    hayColision: true,
    puntoEntrada: puntoEntradaMasCercano,
    puntoSalida: null,
    grosorEstructura: Infinity
  };
}

/**
 * Verifica si una posición está dentro de geometría de colisión
 * Usa raycasts en múltiples direcciones para detectar si está encerrado
 * Requirements: 2.3, 4.1
 * 
 * @param {THREE.Vector3} posicion - Posición a verificar (posición de los ojos)
 * @returns {boolean} - true si la posición está dentro de geometría
 */
export function estaDentroGeometria(posicion) {
  if (!collisionModel || !raycaster) {
    return false;
  }
  
  const config = getColisionesConfig();
  const radio = config.radioJugador || 0.4;
  const margen = config.margenPared || 0.1;
  
  // Usar la función existente de detección de colisión
  return hayColisionEnPosicionFallback(posicion, radio, margen);
}

/**
 * Desatora al jugador después de un dash que terminó dentro de geometría
 * Busca posición válida primero en la dirección del dash, luego en 8 direcciones horizontales
 * Si no encuentra, mueve hacia arriba
 * Requirements: 2.3, 4.2, 4.3, 4.4
 * 
 * @param {THREE.Vector3} posicion - Posición actual del jugador (ojos)
 * @param {THREE.Vector3|null} direccionDash - Dirección del dash (opcional, para priorizar búsqueda)
 * @returns {THREE.Vector3} - Posición válida fuera de la geometría
 */
export function desatorarDespuesDash(posicion, direccionDash = null) {
  if (!collisionModel || !raycaster) {
    return posicion.clone();
  }
  
  const config = getColisionesConfig();
  const radio = config.radioJugador || 0.4;
  const margen = config.margenPared || 0.1;
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  const posicionPies = posicion.y - alturaOjos;
  
  // Primero verificar si realmente está dentro de geometría
  if (!hayColisionEnPosicionFallback(posicion, radio, margen)) {
    // No está atrapado, retornar posición original
    return posicion.clone();
  }
  
  console.log('🔧 Desatorando jugador después del dash...');
  
  // Requirements: 4.2 - Buscar primero en la dirección del dash
  // Si se proporciona dirección del dash, buscar primero en esa dirección
  if (direccionDash) {
    const dirNormalizada = {
      x: direccionDash.x,
      z: direccionDash.z
    };
    // Normalizar si es necesario
    const len = Math.sqrt(dirNormalizada.x * dirNormalizada.x + dirNormalizada.z * dirNormalizada.z);
    if (len > 0.001) {
      dirNormalizada.x /= len;
      dirNormalizada.z /= len;
      
      // Altura de prueba (cintura del jugador)
      const alturaTestDash = posicionPies + 1.0;
      
      // Buscar en la dirección del dash con diferentes distancias
      const distanciasBusqueda = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0];
      
      for (const distancia of distanciasBusqueda) {
        const nuevaPosicion = new THREE.Vector3(
          posicion.x + dirNormalizada.x * distancia,
          posicion.y,
          posicion.z + dirNormalizada.z * distancia
        );
        
        if (!hayColisionEnPosicionFallback(nuevaPosicion, radio, margen)) {
          console.log(`✅ Jugador desatorado en dirección del dash (+${distancia} unidades)`);
          return nuevaPosicion;
        }
      }
      
      console.log('⚠️ No se encontró salida en dirección del dash, buscando en 8 direcciones...');
    }
  }
  
  // 8 direcciones horizontales (cardinales y diagonales)
  // Requirements: 4.2, 4.4 - Si no encuentra en dirección del dash, buscar en 8 direcciones
  const direccionesHorizontales = [
    { x: 1, z: 0 },           // Este
    { x: -1, z: 0 },          // Oeste
    { x: 0, z: 1 },           // Sur
    { x: 0, z: -1 },          // Norte
    { x: 0.707, z: 0.707 },   // Sureste
    { x: -0.707, z: 0.707 },  // Suroeste
    { x: 0.707, z: -0.707 },  // Noreste
    { x: -0.707, z: -0.707 }  // Noroeste
  ];
  
  let mejorPosicion = null;
  let menorDistancia = Infinity;
  
  // Altura de prueba (cintura del jugador)
  const alturaTest = posicionPies + 1.0;
  
  // Buscar en cada dirección horizontal
  // Requirements: 4.2, 4.3 - Encontrar posición válida más cercana
  for (const dir of direccionesHorizontales) {
    // Raycast desde la posición actual hacia afuera
    _posicionRayo.set(posicion.x, alturaTest, posicion.z);
    _direccionRayo.set(dir.x, 0, dir.z);
    
    raycaster.set(_posicionRayo, _direccionRayo);
    raycaster.far = 10.0; // Distancia máxima de búsqueda
    
    const intersecciones = raycaster.intersectObject(collisionModel, true);
    
    if (intersecciones.length > 0) {
      const hit = intersecciones[0];
      
      // Calcular posición justo fuera de la superficie
      const distanciaSalida = hit.distance + radio + margen + 0.1;
      const nuevaPosicion = new THREE.Vector3(
        posicion.x + dir.x * distanciaSalida,
        posicion.y,
        posicion.z + dir.z * distanciaSalida
      );
      
      // Verificar que la nueva posición es válida
      if (!hayColisionEnPosicionFallback(nuevaPosicion, radio, margen)) {
        if (distanciaSalida < menorDistancia) {
          menorDistancia = distanciaSalida;
          mejorPosicion = nuevaPosicion;
        }
      }
    } else {
      // No hay intersección - podemos movernos libremente en esta dirección
      const distanciaMovimiento = radio + margen + 0.3;
      const nuevaPosicion = new THREE.Vector3(
        posicion.x + dir.x * distanciaMovimiento,
        posicion.y,
        posicion.z + dir.z * distanciaMovimiento
      );
      
      // Verificar que la nueva posición es válida
      if (!hayColisionEnPosicionFallback(nuevaPosicion, radio, margen)) {
        if (distanciaMovimiento < menorDistancia) {
          menorDistancia = distanciaMovimiento;
          mejorPosicion = nuevaPosicion;
        }
      }
    }
  }
  
  // Si encontramos posición horizontal válida, usarla
  if (mejorPosicion) {
    console.log('✅ Jugador desatorado horizontalmente después del dash');
    return mejorPosicion;
  }
  
  // Requirements: 4.4 - Si no hay posición horizontal, mover hacia arriba
  console.log('⬆️ No se encontró salida horizontal, moviendo hacia arriba...');
  
  // Buscar espacio libre hacia arriba
  const incrementoAltura = 0.5;
  const alturaMaxima = 10.0; // Límite de búsqueda vertical
  
  for (let deltaY = incrementoAltura; deltaY <= alturaMaxima; deltaY += incrementoAltura) {
    const nuevaPosicion = new THREE.Vector3(
      posicion.x,
      posicion.y + deltaY,
      posicion.z
    );
    
    if (!hayColisionEnPosicionFallback(nuevaPosicion, radio, margen)) {
      console.log(`✅ Jugador desatorado hacia arriba (+${deltaY} unidades)`);
      return nuevaPosicion;
    }
  }
  
  // Último recurso: usar la función de verificar suelo para encontrar altura válida
  const estadoSuelo = verificarSueloFallback(posicion);
  if (estadoSuelo.altura > -100) {
    const posicionSobreSuelo = new THREE.Vector3(
      posicion.x,
      estadoSuelo.altura + alturaOjos + 0.5,
      posicion.z
    );
    console.log('✅ Jugador colocado sobre el suelo detectado');
    return posicionSobreSuelo;
  }
  
  // Si todo falla, retornar posición original (no debería pasar)
  console.warn('⚠️ No se pudo desatorar al jugador');
  return posicion.clone();
}

/**
 * Verifica y corrige la posición del jugador si está atrapado
 * Debe llamarse periódicamente (cada frame o cada pocos frames)
 * @param {THREE.Vector3} posicion - Posición actual del jugador (ojos)
 * @returns {{necesitaCorreccion: boolean, posicionCorregida: THREE.Vector3}}
 */
export function verificarYDesatorar(posicion) {
  const config = getColisionesConfig();
  const radio = config.radioJugador || 0.4;
  const margen = config.margenPared || 0.1;
  
  // Verificar si está en colisión
  const enColision = hayColisionEnPosicionFallback(posicion, radio, margen);
  
  if (!enColision) {
    return {
      necesitaCorreccion: false,
      posicionCorregida: posicion.clone()
    };
  }
  
  // Está atrapado - desatorar
  const posicionCorregida = desatorarJugador(posicion);
  
  return {
    necesitaCorreccion: true,
    posicionCorregida: posicionCorregida
  };
}

/**
 * Raycast para balas usando Three.js (fallback)
 * @param {THREE.Vector3} origen - Origen del rayo
 * @param {THREE.Vector3} direccion - Dirección normalizada
 * @param {number} distanciaMax - Distancia máxima
 * @returns {{hit: boolean, punto: THREE.Vector3, distancia: number} | null}
 */
function raycastBalaFallback(origen, direccion, distanciaMax) {
  if (!collisionModel || !raycaster) {
    return null;
  }
  
  raycaster.set(origen, direccion);
  raycaster.far = distanciaMax;
  
  const intersecciones = raycaster.intersectObject(collisionModel, true);
  
  if (intersecciones.length > 0) {
    const hit = intersecciones[0];
    return {
      hit: true,
      punto: hit.point.clone(),
      distancia: hit.distance,
      normal: hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0)
    };
  }
  
  return {
    hit: false,
    punto: null,
    distancia: distanciaMax,
    normal: null
  };
}

/**
 * Verifica si el sistema de colisiones está activo
 * @returns {boolean}
 */
export function estaActivo() {
  return sistemaActivo;
}

/**
 * Verifica si el sistema está usando Rapier3D
 * @returns {boolean}
 */
export function usaRapier() {
  return usandoRapier;
}

/**
 * Calcula el componente de velocidad paralelo a una pared (sliding puro)
 * @param {THREE.Vector3} movimiento - Vector de movimiento deseado
 * @param {THREE.Vector3} normalPared - Normal de la superficie de la pared
 * @returns {THREE.Vector3} - Componente de movimiento paralelo a la pared
 */
export function calcularSlidingPared(movimiento, normalPared) {
  const normalHorizontal = new THREE.Vector3(normalPared.x, 0, normalPared.z);
  
  if (normalHorizontal.lengthSq() < 0.001) {
    return movimiento.clone();
  }
  
  normalHorizontal.normalize();
  
  const dotProduct = movimiento.dot(normalHorizontal);
  const componenteNormal = normalHorizontal.clone().multiplyScalar(dotProduct);
  const componenteParalelo = movimiento.clone().sub(componenteNormal);
  
  return componenteParalelo;
}

/**
 * Libera recursos del sistema de colisiones
 */
export function destruir() {
  // Destruir sistema Rapier si está activo
  if (usandoRapier) {
    Fisica.destruir();
  }
  
  // Limpiar recursos del fallback
  if (collisionModel && escenaRef) {
    escenaRef.remove(collisionModel);
  }
  collisionMesh = null;
  collisionModel = null;
  raycaster = null;
  
  sistemaActivo = false;
  usandoRapier = false;
  escenaRef = null;
}

/**
 * Hace visible el modelo de colisiones para debugging
 * @param {boolean} visible - true para mostrar, false para ocultar
 */
export function toggleDebugVisual(visible = true) {
  // Solo funciona con el fallback (el modelo de Three.js)
  if (collisionModel) {
    collisionModel.visible = visible;
    if (visible && collisionMesh) {
      collisionMesh.material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      console.log('🔍 Colisiones visibles (wireframe verde)');
    } else {
      console.log('🔍 Colisiones ocultas');
    }
  } else if (usandoRapier) {
    console.log('ℹ️ Debug visual no disponible con Rapier3D');
  }
}
