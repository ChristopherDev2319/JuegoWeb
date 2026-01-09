/**
 * Sistema de Colisiones
 * Usa raycasting de Three.js para física de colisiones
 * 
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';

// Estado del sistema de colisiones
let sistemaActivo = false;
let escenaRef = null;

// Estado para sistema de colisiones (raycasting manual)
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

// Vectores reutilizables para evitar allocaciones
const _direccionRayo = new THREE.Vector3();
const _posicionRayo = new THREE.Vector3();
const _desplazamiento = new THREE.Vector3();
const _normalMundo = new THREE.Vector3();

/**
 * Inicializa el sistema de colisiones
 * @param {THREE.Scene} scene - Escena de Three.js
 * @param {Function} onProgress - Callback de progreso
 * @returns {Promise<void>}
 */
export async function inicializarColisiones(scene, onProgress = null) {
  escenaRef = scene;
  
  return new Promise((resolve) => {
    const gltfLoader = new THREE.GLTFLoader();
    raycaster = new THREE.Raycaster();

    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout cargando colisiones, continuando sin ellas');
      sistemaActivo = false;
      resolve();
    }, 15000);
    
    gltfLoader.load('public/modelos/map_coll.glb', (gltf) => {
      clearTimeout(timeoutId);
      collisionModel = gltf.scene;
      collisionModel.scale.setScalar(5);
      
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
      
      collisionModel.visible = false;
      if (escenaRef) {
        escenaRef.add(collisionModel);
      }
      
      collisionModel.updateMatrixWorld(true);
      collisionMesh.updateMatrixWorld(true);
      
      sistemaActivo = true;
      resolve();
    }, (progress) => {
      if (progress.total > 0) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        if (onProgress) onProgress(percent);
      }
    }, (error) => {
      clearTimeout(timeoutId);
      console.error('❌ Error cargando geometría de colisiones:', error);
      sistemaActivo = false;
      resolve();
    });
  });
}

/**
 * Verifica colisión y retorna posición corregida
 * @param {THREE.Vector3} posicionActual - Posición actual del jugador
 * @param {THREE.Vector3} posicionDeseada - Posición a la que quiere moverse
 * @param {number} radio - Radio del jugador para colisiones
 * @returns {THREE.Vector3} - Posición final después de resolver colisiones
 */
export function resolverColision(posicionActual, posicionDeseada, radio = null) {
  const config = getColisionesConfig();
  radio = radio || config.radioJugador;
  
  if (!sistemaActivo) {
    return posicionDeseada.clone();
  }
  
  if (!collisionMesh) {
    return posicionDeseada.clone();
  }
  
  const margen = config.margenPared;
  
  _desplazamiento.subVectors(posicionDeseada, posicionActual);
  const distanciaMovimiento = _desplazamiento.length();
  
  if (distanciaMovimiento < 0.001) {
    return posicionActual.clone();
  }
  
  const enColisionActual = hayColisionEnPosicion(posicionActual, radio, margen);
  
  if (enColisionActual) {
    const enColisionDeseada = hayColisionEnPosicion(posicionDeseada, radio, margen);
    if (!enColisionDeseada) {
      return posicionDeseada.clone();
    }
    return posicionActual.clone();
  }
  
  if (!hayColisionEnPosicion(posicionDeseada, radio, margen)) {
    return posicionDeseada.clone();
  }
  
  // Sliding en cada eje
  const posicionX = posicionActual.clone();
  posicionX.x = posicionDeseada.x;
  if (!hayColisionEnPosicion(posicionX, radio, margen)) {
    return posicionX;
  }
  
  const posicionZ = posicionActual.clone();
  posicionZ.z = posicionDeseada.z;
  if (!hayColisionEnPosicion(posicionZ, radio, margen)) {
    return posicionZ;
  }
  
  return posicionActual.clone();
}


/**
 * Verifica si hay colisión en una posición específica
 * @param {THREE.Vector3} posicion - Posición a verificar (posición de los ojos)
 * @param {number} radio - Radio del jugador
 * @param {number} margen - Margen de separación
 * @returns {boolean} - true si hay colisión
 */
function hayColisionEnPosicion(posicion, radio, margen) {
  if (!collisionModel || !raycaster) {
    return false;
  }
  
  const numRayos = 8;
  const distanciaDeteccion = radio + margen;
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  const posicionPies = posicion.y - alturaOjos;
  const anguloMaxRampa = (CONFIG.fisica?.anguloMaxRampa || 50) * Math.PI / 180;
  const cosAnguloMaxRampa = Math.cos(anguloMaxRampa);
  
  const alturas = [
    posicionPies + 0.5,
    posicionPies + 1.0,
    posicionPies + 1.4
  ];
  
  for (const altura of alturas) {
    for (let i = 0; i < numRayos; i++) {
      const angulo = (i / numRayos) * Math.PI * 2;
      
      _direccionRayo.set(Math.cos(angulo), 0, Math.sin(angulo));
      _posicionRayo.set(posicion.x, altura, posicion.z);
      
      raycaster.set(_posicionRayo, _direccionRayo);
      raycaster.far = distanciaDeteccion;
      
      const intersecciones = raycaster.intersectObject(collisionModel, true);
      
      if (intersecciones.length > 0 && intersecciones[0].distance < distanciaDeteccion) {
        const hit = intersecciones[0];
        
        if (hit.face && hit.face.normal) {
          _normalMundo.copy(hit.face.normal);
          _normalMundo.transformDirection(collisionModel.matrixWorld);
          _normalMundo.normalize();
          
          if (_normalMundo.y > cosAnguloMaxRampa) {
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
  const resultado = { hayTecho: false, alturaTecho: Infinity };
  
  if (!collisionModel || !raycaster || velocidadY <= 0) {
    return resultado;
  }
  
  const margenCabeza = 0.3;
  _posicionRayo.set(posicion.x, posicion.y + margenCabeza, posicion.z);
  _direccionRayo.set(0, 1, 0);
  
  raycaster.set(_posicionRayo, _direccionRayo);
  raycaster.far = 3.0;
  
  const intersecciones = raycaster.intersectObject(collisionModel, true);
  
  if (intersecciones.length > 0) {
    const hit = intersecciones[0];
    if (hit.face && hit.face.normal) {
      const normalMundo = hit.face.normal.clone();
      normalMundo.transformDirection(collisionModel.matrixWorld);
      normalMundo.normalize();
      
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
 * @param {THREE.Vector3} posicion - Posición a verificar
 * @returns {{enSuelo: boolean, altura: number, normal?: THREE.Vector3, enRampa?: boolean}}
 */
export function verificarSuelo(posicion) {
  if (!sistemaActivo) {
    return {
      enSuelo: true,
      altura: 0,
      normal: new THREE.Vector3(0, 1, 0),
      enRampa: false
    };
  }
  
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
  
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  const posicionPies = posicion.y - alturaOjos;
  const alturaMaxEscalon = CONFIG.fisica?.alturaMaxEscalon || 0.8;
  const origenY = posicionPies + alturaMaxEscalon + 0.5;
  const radioJugador = CONFIG.colisiones?.radioJugador || 0.4;
  
  const puntosRaycast = [
    { x: 0, z: 0 },
    { x: radioJugador * 0.7, z: 0 },
    { x: -radioJugador * 0.7, z: 0 },
    { x: 0, z: radioJugador * 0.7 },
    { x: 0, z: -radioJugador * 0.7 }
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
      
      if (hit.point.y > mejorAltura) {
        mejorAltura = hit.point.y;
        if (hit.face && hit.face.normal) {
          mejorNormal = hit.face.normal.clone();
          mejorNormal.transformDirection(collisionModel.matrixWorld);
          mejorNormal.normalize();
        }
      }
      
      const distanciaAlPie = Math.abs(hit.point.y - posicionPies);
      if (distanciaAlPie < 0.5) {
        hitsCercanos++;
      }
    }
  }
  
  if (hayHit) {
    resultado.altura = mejorAltura;
    resultado.normal = mejorNormal;
    
    const distanciaPiesASuelo = posicionPies - mejorAltura;
    resultado.distancia = distanciaPiesASuelo;
    
    const cercaDelSuelo = distanciaPiesASuelo >= -0.15 && distanciaPiesASuelo < 0.5;
    const puedeSubirEscalon = distanciaPiesASuelo < -0.15 && distanciaPiesASuelo >= -alturaMaxEscalon;
    const sueloSolido = hitsCercanos >= 2 || (hitsCercanos >= 1 && cercaDelSuelo);
    
    resultado.enSuelo = (cercaDelSuelo || puedeSubirEscalon) && sueloSolido;
    
    if (resultado.normal) {
      const anguloNormal = Math.acos(Math.abs(resultado.normal.y)) * (180 / Math.PI);
      resultado.enRampa = resultado.enSuelo && anguloNormal > 5 && anguloNormal <= 50;
    }
  } else {
    resultado.enSuelo = false;
    resultado.altura = -100;
    resultado.distancia = Infinity;
  }
  
  return resultado;
}


/**
 * Realiza un raycast para balas contra la geometría del mapa
 * @param {THREE.Vector3} origen - Origen del rayo
 * @param {THREE.Vector3} direccion - Dirección normalizada
 * @param {number} distanciaMax - Distancia máxima
 * @returns {{hit: boolean, punto: THREE.Vector3, distancia: number, normal?: THREE.Vector3} | null}
 */
export function raycastBala(origen, direccion, distanciaMax) {
  if (!sistemaActivo || !collisionModel || !raycaster) {
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
 * Realiza un shape cast para el movimiento del dash
 * @param {THREE.Vector3} posicionInicial - Posición inicial del jugador
 * @param {THREE.Vector3} direccionDash - Dirección normalizada del dash
 * @param {number} distanciaDash - Distancia total del dash
 * @returns {{posicionFinal: THREE.Vector3, colision: boolean, distanciaRecorrida: number, puntoImpacto: THREE.Vector3|null}}
 */
export function shapeCastDash(posicionInicial, direccionDash, distanciaDash) {
  if (!collisionModel || !raycaster) {
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
  const margenSeguridad = 0.15;
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  const posicionPies = posicionInicial.y - alturaOjos;

  const alturas = [
    posicionPies + 0.3,
    posicionPies + 0.6,
    posicionPies + 0.9,
    posicionPies + 1.2,
    posicionPies + 1.5
  ];

  let distanciaMinima = distanciaDash;
  let hayColision = false;
  let puntoImpacto = null;

  const direccionNormalizada = new THREE.Vector3(direccionDash.x, 0, direccionDash.z).normalize();

  // Raycast central
  for (const altura of alturas) {
    _posicionRayo.set(posicionInicial.x, altura, posicionInicial.z);
    _direccionRayo.copy(direccionNormalizada);

    raycaster.set(_posicionRayo, _direccionRayo);
    raycaster.far = distanciaDash + radio + margen;

    const intersecciones = raycaster.intersectObject(collisionModel, true);

    if (intersecciones.length > 0) {
      const hit = intersecciones[0];
      
      if (hit.face && hit.face.normal) {
        const normalMundo = hit.face.normal.clone();
        normalMundo.transformDirection(collisionModel.matrixWorld);
        normalMundo.normalize();

        if (Math.abs(normalMundo.y) < 0.5) {
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

  // Raycasts laterales
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

  if (hayColision && distanciaMinima < 0.5) {
    distanciaMinima = Math.max(0, distanciaMinima - 0.1);
  }

  let posicionFinal = new THREE.Vector3(
    posicionInicial.x + direccionNormalizada.x * distanciaMinima,
    posicionInicial.y,
    posicionInicial.z + direccionNormalizada.z * distanciaMinima
  );

  let intentos = 0;
  const maxIntentos = 5;
  while (hayColisionEnPosicion(posicionFinal, radio, margen) && intentos < maxIntentos) {
    distanciaMinima = Math.max(0, distanciaMinima - 0.15);
    posicionFinal.set(
      posicionInicial.x + direccionNormalizada.x * distanciaMinima,
      posicionInicial.y,
      posicionInicial.z + direccionNormalizada.z * distanciaMinima
    );
    intentos++;
    hayColision = true;
  }

  if (hayColisionEnPosicion(posicionFinal, radio, margen)) {
    posicionFinal.copy(posicionInicial);
    distanciaMinima = 0;
    hayColision = true;
  }

  return {
    posicionFinal: posicionFinal,
    colision: hayColision,
    distanciaRecorrida: distanciaMinima,
    puntoImpacto: puntoImpacto
  };
}

/**

 * Verifica si una posición es válida (no está dentro de geometría)
 * @param {THREE.Vector3} posicion - Posición a verificar
 * @returns {{valida: boolean, posicionCorregida: THREE.Vector3}}
 */
export function verificarPosicionValida(posicion) {
  const config = getColisionesConfig();
  const radio = config.radioJugador || 0.4;
  const margen = config.margenPared || 0.1;
  
  const enColision = hayColisionEnPosicion(posicion, radio, margen);
  
  if (!enColision) {
    return { valida: true, posicionCorregida: posicion.clone() };
  }
  
  const posicionCorregida = desatorarJugador(posicion);
  return { valida: false, posicionCorregida: posicionCorregida };
}

/**
 * Intenta desatorar al jugador si está dentro de una colisión
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
  
  const direcciones = [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
    { x: 0.707, y: 0, z: 0.707 },
    { x: -0.707, y: 0, z: 0.707 },
    { x: 0.707, y: 0, z: -0.707 },
    { x: -0.707, y: 0, z: -0.707 },
    { x: 0, y: 1, z: 0 }
  ];
  
  let mejorPosicion = posicion.clone();
  let menorDistancia = Infinity;
  let encontradaSalida = false;
  
  for (const dir of direcciones) {
    const alturaTest = posicionPies + 1.0;
    
    _posicionRayo.set(posicion.x, alturaTest, posicion.z);
    _direccionRayo.set(dir.x, dir.y, dir.z);
    
    raycaster.set(_posicionRayo, _direccionRayo);
    raycaster.far = 5.0;
    
    const intersecciones = raycaster.intersectObject(collisionModel, true);
    
    if (intersecciones.length > 0) {
      const hit = intersecciones[0];
      const distanciaSalida = hit.distance + radio + margen + 0.1;
      const nuevaPosicion = new THREE.Vector3(
        posicion.x + dir.x * distanciaSalida,
        dir.y !== 0 ? posicion.y + dir.y * distanciaSalida : posicion.y,
        posicion.z + dir.z * distanciaSalida
      );
      
      if (!hayColisionEnPosicion(nuevaPosicion, radio, margen)) {
        if (distanciaSalida < menorDistancia) {
          menorDistancia = distanciaSalida;
          mejorPosicion = nuevaPosicion;
          encontradaSalida = true;
        }
      }
    } else {
      const distanciaMovimiento = radio + margen + 0.2;
      const nuevaPosicion = new THREE.Vector3(
        posicion.x + dir.x * distanciaMovimiento,
        dir.y !== 0 ? posicion.y + dir.y * distanciaMovimiento : posicion.y,
        posicion.z + dir.z * distanciaMovimiento
      );
      
      if (!hayColisionEnPosicion(nuevaPosicion, radio, margen)) {
        if (distanciaMovimiento < menorDistancia) {
          menorDistancia = distanciaMovimiento;
          mejorPosicion = nuevaPosicion;
          encontradaSalida = true;
        }
      }
    }
  }
  
  if (!encontradaSalida) {
    const estadoSuelo = verificarSuelo(posicion);
    if (estadoSuelo.altura > -100) {
      mejorPosicion = new THREE.Vector3(
        posicion.x,
        estadoSuelo.altura + alturaOjos + 0.1,
        posicion.z
      );
    }
  }
  
  return mejorPosicion;
}


/**
 * Lanza un raycast inverso para encontrar el punto de salida de una estructura
 * @param {THREE.Vector3} puntoColision - Punto donde el raycast original colisionó
 * @param {THREE.Vector3} direccion - Dirección normalizada del dash
 * @param {number} distanciaMaxima - Distancia máxima para buscar el punto de salida
 * @returns {{encontrado: boolean, puntoSalida: THREE.Vector3|null, distanciaDesdeEntrada: number}}
 */
export function raycastInverso(puntoColision, direccion, distanciaMaxima) {
  if (!collisionModel || !raycaster) {
    return { encontrado: false, puntoSalida: null, distanciaDesdeEntrada: 0 };
  }
  
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  
  const puntoLejano = new THREE.Vector3(
    puntoColision.x + direccion.x * distanciaMaxima,
    puntoColision.y,
    puntoColision.z + direccion.z * distanciaMaxima
  );
  
  const direccionInversa = new THREE.Vector3(-direccion.x, 0, -direccion.z).normalize();
  
  const posicionPies = puntoColision.y - alturaOjos;
  const alturas = [posicionPies + 0.5, posicionPies + 1.0, posicionPies + 1.4];
  
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
      
      if (hit.face && hit.face.normal) {
        const normalMundo = hit.face.normal.clone();
        normalMundo.transformDirection(collisionModel.matrixWorld);
        normalMundo.normalize();
        
        if (Math.abs(normalMundo.y) < 0.5) {
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
    return { encontrado: true, puntoSalida: puntoSalidaMasCercano, distanciaDesdeEntrada: distanciaMenor };
  }
  
  return { encontrado: false, puntoSalida: null, distanciaDesdeEntrada: 0 };
}

/**
 * Detecta colisión en la dirección del dash y calcula el punto de salida
 * @param {THREE.Vector3} origen - Posición inicial del jugador (ojos)
 * @param {THREE.Vector3} direccion - Dirección normalizada del dash
 * @param {number} distanciaMaxima - Distancia máxima del dash
 * @returns {{hayColision: boolean, puntoEntrada: THREE.Vector3|null, puntoSalida: THREE.Vector3|null, grosorEstructura: number}}
 */
export function detectarColisionYSalida(origen, direccion, distanciaMaxima) {
  if (!collisionModel || !raycaster) {
    return { hayColision: false, puntoEntrada: null, puntoSalida: null, grosorEstructura: 0 };
  }
  
  const config = getColisionesConfig();
  const radio = config.radioJugador || 0.4;
  const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
  const posicionPies = origen.y - alturaOjos;
  
  const alturas = [posicionPies + 0.5, posicionPies + 1.0, posicionPies + 1.4];
  
  let puntoEntradaMasCercano = null;
  let distanciaEntradaMenor = Infinity;
  
  for (const altura of alturas) {
    _posicionRayo.set(origen.x, altura, origen.z);
    _direccionRayo.set(direccion.x, 0, direccion.z).normalize();
    
    raycaster.set(_posicionRayo, _direccionRayo);
    raycaster.far = distanciaMaxima + radio;
    
    const intersecciones = raycaster.intersectObject(collisionModel, true);
    
    if (intersecciones.length > 0) {
      const hit = intersecciones[0];
      
      if (hit.face && hit.face.normal) {
        const normalMundo = hit.face.normal.clone();
        normalMundo.transformDirection(collisionModel.matrixWorld);
        normalMundo.normalize();
        
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
  
  if (!puntoEntradaMasCercano) {
    return { hayColision: false, puntoEntrada: null, puntoSalida: null, grosorEstructura: 0 };
  }
  
  const distanciaRestante = distanciaMaxima - distanciaEntradaMenor;
  const extensionMaxima = CONFIG.dash?.extensionMaxima || 3;
  const distanciaBase = CONFIG.dash?.poder || 5;
  const distanciaBusquedaSalida = Math.min(distanciaRestante + distanciaBase * extensionMaxima, distanciaBase * extensionMaxima);
  
  const resultadoInverso = raycastInverso(puntoEntradaMasCercano, direccion, distanciaBusquedaSalida);
  
  if (resultadoInverso.encontrado) {
    return {
      hayColision: true,
      puntoEntrada: puntoEntradaMasCercano,
      puntoSalida: resultadoInverso.puntoSalida,
      grosorEstructura: resultadoInverso.distanciaDesdeEntrada
    };
  }
  
  return { hayColision: true, puntoEntrada: puntoEntradaMasCercano, puntoSalida: null, grosorEstructura: Infinity };
}


/**
 * Verifica si una posición está dentro de geometría de colisión
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
  
  return hayColisionEnPosicion(posicion, radio, margen);
}

/**
 * Desatora al jugador después de un dash que terminó dentro de geometría
 * @param {THREE.Vector3} posicion - Posición actual del jugador (ojos)
 * @param {THREE.Vector3|null} direccionDash - Dirección del dash (opcional)
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
  
  if (!hayColisionEnPosicion(posicion, radio, margen)) {
    return posicion.clone();
  }
  
  // Buscar primero en la dirección del dash
  if (direccionDash) {
    const len = Math.sqrt(direccionDash.x * direccionDash.x + direccionDash.z * direccionDash.z);
    if (len > 0.001) {
      const dirNormalizada = { x: direccionDash.x / len, z: direccionDash.z / len };
      const distanciasBusqueda = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0];
      
      for (const distancia of distanciasBusqueda) {
        const nuevaPosicion = new THREE.Vector3(
          posicion.x + dirNormalizada.x * distancia,
          posicion.y,
          posicion.z + dirNormalizada.z * distancia
        );
        
        if (!hayColisionEnPosicion(nuevaPosicion, radio, margen)) {
          return nuevaPosicion;
        }
      }
    }
  }
  
  // Buscar en 8 direcciones horizontales
  const direccionesHorizontales = [
    { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 },
    { x: 0.707, z: 0.707 }, { x: -0.707, z: 0.707 },
    { x: 0.707, z: -0.707 }, { x: -0.707, z: -0.707 }
  ];
  
  let mejorPosicion = null;
  let menorDistancia = Infinity;
  const alturaTest = posicionPies + 1.0;
  
  for (const dir of direccionesHorizontales) {
    _posicionRayo.set(posicion.x, alturaTest, posicion.z);
    _direccionRayo.set(dir.x, 0, dir.z);
    
    raycaster.set(_posicionRayo, _direccionRayo);
    raycaster.far = 10.0;
    
    const intersecciones = raycaster.intersectObject(collisionModel, true);
    
    if (intersecciones.length > 0) {
      const hit = intersecciones[0];
      const distanciaSalida = hit.distance + radio + margen + 0.1;
      const nuevaPosicion = new THREE.Vector3(
        posicion.x + dir.x * distanciaSalida,
        posicion.y,
        posicion.z + dir.z * distanciaSalida
      );
      
      if (!hayColisionEnPosicion(nuevaPosicion, radio, margen)) {
        if (distanciaSalida < menorDistancia) {
          menorDistancia = distanciaSalida;
          mejorPosicion = nuevaPosicion;
        }
      }
    } else {
      const distanciaMovimiento = radio + margen + 0.3;
      const nuevaPosicion = new THREE.Vector3(
        posicion.x + dir.x * distanciaMovimiento,
        posicion.y,
        posicion.z + dir.z * distanciaMovimiento
      );
      
      if (!hayColisionEnPosicion(nuevaPosicion, radio, margen)) {
        if (distanciaMovimiento < menorDistancia) {
          menorDistancia = distanciaMovimiento;
          mejorPosicion = nuevaPosicion;
        }
      }
    }
  }
  
  if (mejorPosicion) {
    return mejorPosicion;
  }
  
  // Buscar hacia arriba
  const incrementoAltura = 0.5;
  const alturaMaxima = 10.0;
  
  for (let deltaY = incrementoAltura; deltaY <= alturaMaxima; deltaY += incrementoAltura) {
    const nuevaPosicion = new THREE.Vector3(posicion.x, posicion.y + deltaY, posicion.z);
    
    if (!hayColisionEnPosicion(nuevaPosicion, radio, margen)) {
      return nuevaPosicion;
    }
  }
  
  // Último recurso
  const estadoSuelo = verificarSuelo(posicion);
  if (estadoSuelo.altura > -100) {
    return new THREE.Vector3(posicion.x, estadoSuelo.altura + alturaOjos + 0.5, posicion.z);
  }
  
  return posicion.clone();
}

/**

 * Verifica y corrige la posición del jugador si está atrapado
 * @param {THREE.Vector3} posicion - Posición actual del jugador (ojos)
 * @returns {{necesitaCorreccion: boolean, posicionCorregida: THREE.Vector3}}
 */
export function verificarYDesatorar(posicion) {
  const config = getColisionesConfig();
  const radio = config.radioJugador || 0.4;
  const margen = config.margenPared || 0.1;
  
  const enColision = hayColisionEnPosicion(posicion, radio, margen);
  
  if (!enColision) {
    return { necesitaCorreccion: false, posicionCorregida: posicion.clone() };
  }
  
  const posicionCorregida = desatorarJugador(posicion);
  return { necesitaCorreccion: true, posicionCorregida: posicionCorregida };
}

/**
 * Verifica si el sistema de colisiones está activo
 * @returns {boolean}
 */
export function estaActivo() {
  return sistemaActivo;
}

/**
 * Calcula el componente de velocidad paralelo a una pared (sliding)
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
  if (collisionModel && escenaRef) {
    escenaRef.remove(collisionModel);
  }
  collisionMesh = null;
  collisionModel = null;
  raycaster = null;
  sistemaActivo = false;
  escenaRef = null;
}

/**
 * Hace visible el modelo de colisiones para debugging
 * @param {boolean} visible - true para mostrar, false para ocultar
 */
export function toggleDebugVisual(visible = true) {
  if (collisionModel) {
    collisionModel.visible = visible;
    if (visible && collisionMesh) {
      collisionMesh.material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
    }
  }
}