/**
 * Sistema de Física con Rapier3D
 * Proporciona física determinista para colisiones del mapa, movimiento del jugador y raycasts
 * 
 * Requirements: 5.1, 5.2
 * @module fisica
 */

import { CONFIG } from '../config.js';

// Estado del sistema de física
let RAPIER = null;
let world = null;
let mapCollider = null;
let characterController = null;
let playerCollider = null;
let playerRigidBody = null;
let sistemaActivo = false;

// Configuración por defecto de física (se puede sobrescribir desde CONFIG)
const FISICA_CONFIG_DEFAULT = {
  gravedad: -9.81,
  alturaMaxEscalon: 0.5,
  anguloMaxRampa: 45,
  offsetSuelo: 0.01,
  radioJugador: 0.4,
  alturaJugador: 1.8,
  margenColision: 0.02
};

/**
 * Obtiene la configuración de física, combinando defaults con CONFIG si existe
 * @returns {Object} Configuración de física
 */
function getFisicaConfig() {
  return CONFIG.fisica || FISICA_CONFIG_DEFAULT;
}

/**
 * Inicializa Rapier3D y el mundo de física
 * Requirements: 5.1
 * @returns {Promise<boolean>} true si la inicialización fue exitosa
 */
export async function inicializarFisica() {
  try {
    // Importar Rapier3D dinámicamente
    const rapierModule = await import('@dimforge/rapier3d-compat');
    await rapierModule.init();
    
    RAPIER = rapierModule;
    
    const config = getFisicaConfig();
    
    // Crear mundo de física con gravedad configurada
    const gravity = { x: 0.0, y: config.gravedad, z: 0.0 };
    world = new RAPIER.World(gravity);
    
    sistemaActivo = true;
    console.log('✅ Rapier3D inicializado correctamente');
    console.log(`   Gravedad: ${config.gravedad}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error inicializando Rapier3D:', error);
    sistemaActivo = false;
    return false;
  }
}

/**
 * Verifica si el sistema de física está activo
 * @returns {boolean}
 */
export function estaActivo() {
  return sistemaActivo && world !== null;
}

/**
 * Obtiene la referencia a RAPIER para uso externo
 * @returns {Object|null} Módulo RAPIER o null si no está inicializado
 */
export function getRAPIER() {
  return RAPIER;
}

/**
 * Obtiene la referencia al mundo de física
 * @returns {Object|null} Mundo de física o null si no está inicializado
 */
export function getWorld() {
  return world;
}

/**
 * Obtiene el collider del mapa
 * @returns {Object|null} Collider del mapa o null si no está creado
 */
export function getMapCollider() {
  return mapCollider;
}

/**
 * Obtiene el character controller
 * @returns {Object|null} Character controller o null si no está creado
 */
export function getCharacterController() {
  return characterController;
}

/**
 * Carga la geometría de colisiones desde un modelo GLB y crea el trimesh collider
 * Requirements: 5.2
 * @param {string} modelPath - Ruta al archivo GLB de colisiones
 * @param {number} escala - Factor de escala para la geometría (default: 5)
 * @returns {Promise<boolean>} true si la carga fue exitosa
 */
export async function cargarGeometriaColisiones(modelPath = 'modelos/map_coll.glb', escala = 5) {
  if (!sistemaActivo || !world || !RAPIER) {
    console.error('❌ Sistema de física no inicializado. Llama a inicializarFisica() primero.');
    return false;
  }
  
  return new Promise((resolve) => {
    const gltfLoader = new THREE.GLTFLoader();
    
    gltfLoader.load(modelPath, (gltf) => {
      const modelo = gltf.scene;
      
      // Recolectar TODOS los meshes del modelo
      const meshes = [];
      modelo.traverse((child) => {
        if (child.isMesh && child.geometry) {
          meshes.push(child);
        }
      });
      
      if (meshes.length === 0) {
        console.error('❌ No se encontraron meshes en el modelo de colisiones');
        resolve(false);
        return;
      }
      
      console.log(`📦 Encontrados ${meshes.length} meshes en el modelo de colisiones`);
      
      // Combinar todas las geometrías en una sola
      const allVertices = [];
      const allIndices = [];
      let vertexOffset = 0;
      
      for (const mesh of meshes) {
        const geometry = mesh.geometry;
        const positionAttribute = geometry.getAttribute('position');
        
        if (!positionAttribute) continue;
        
        // Obtener la matriz de transformación del mesh (incluye posición, rotación, escala del mesh)
        mesh.updateMatrixWorld(true);
        const matrix = mesh.matrixWorld;
        
        // Extraer vértices aplicando la transformación del mesh y la escala global
        for (let i = 0; i < positionAttribute.count; i++) {
          const vertex = new THREE.Vector3(
            positionAttribute.getX(i),
            positionAttribute.getY(i),
            positionAttribute.getZ(i)
          );
          
          // Aplicar transformación del mesh
          vertex.applyMatrix4(matrix);
          
          // Aplicar escala global
          allVertices.push(vertex.x * escala, vertex.y * escala, vertex.z * escala);
        }
        
        // Extraer índices con offset
        const indexAttribute = geometry.getIndex();
        if (indexAttribute) {
          for (let i = 0; i < indexAttribute.count; i++) {
            allIndices.push(indexAttribute.getX(i) + vertexOffset);
          }
        } else {
          // Sin índices - crear índices secuenciales
          for (let i = 0; i < positionAttribute.count; i++) {
            allIndices.push(i + vertexOffset);
          }
        }
        
        vertexOffset += positionAttribute.count;
      }
      
      // Crear el trimesh con la geometría combinada
      const exito = crearColliderMapaDesdeArrays(
        new Float32Array(allVertices),
        new Uint32Array(allIndices)
      );
      
      if (exito) {
        console.log(`✅ Geometría de colisiones cargada desde ${modelPath}`);
        console.log(`   Escala aplicada: ${escala}x`);
        console.log(`   Total: ${allVertices.length / 3} vértices, ${allIndices.length / 3} triángulos`);
      }
      
      resolve(exito);
    }, (progress) => {
      if (progress.total > 0) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        console.log(`📦 Cargando geometría de colisiones (Rapier): ${percent}%`);
      }
    }, (error) => {
      console.error('❌ Error cargando geometría de colisiones:', error);
      resolve(false);
    });
  });
}

/**
 * Crea el trimesh collider del mapa desde arrays de vértices e índices
 * @param {Float32Array} vertices - Array de vértices (x,y,z,x,y,z,...)
 * @param {Uint32Array} indices - Array de índices de triángulos
 * @returns {boolean} true si la creación fue exitosa
 */
function crearColliderMapaDesdeArrays(vertices, indices) {
  if (!sistemaActivo || !world || !RAPIER) {
    console.error('❌ Sistema de física no inicializado');
    return false;
  }
  
  try {
    console.log(`📐 Creando trimesh: ${vertices.length / 3} vértices, ${indices.length / 3} triángulos`);
    
    // Calcular bounding box del trimesh para debug
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    
    for (let i = 0; i < vertices.length; i += 3) {
      minX = Math.min(minX, vertices[i]);
      maxX = Math.max(maxX, vertices[i]);
      minY = Math.min(minY, vertices[i + 1]);
      maxY = Math.max(maxY, vertices[i + 1]);
      minZ = Math.min(minZ, vertices[i + 2]);
      maxZ = Math.max(maxZ, vertices[i + 2]);
    }
    
    console.log('📦 Bounding box del mapa de colisiones:');
    console.log(`   X: ${minX.toFixed(1)} a ${maxX.toFixed(1)}`);
    console.log(`   Y: ${minY.toFixed(1)} a ${maxY.toFixed(1)}`);
    console.log(`   Z: ${minZ.toFixed(1)} a ${maxZ.toFixed(1)}`);
    
    // Crear el trimesh collider en Rapier
    const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
    
    if (!colliderDesc) {
      console.error('❌ Error creando descriptor de trimesh');
      return false;
    }
    
    // Eliminar collider anterior si existe
    if (mapCollider) {
      world.removeCollider(mapCollider, true);
    }
    
    // Crear el collider en el mundo
    mapCollider = world.createCollider(colliderDesc);
    
    console.log('✅ Trimesh collider del mapa creado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error creando trimesh collider:', error);
    return false;
  }
}

/**
 * Crea el trimesh collider del mapa a partir de una geometría de Three.js
 * Requirements: 5.2
 * @param {THREE.BufferGeometry} geometry - Geometría del mapa
 * @param {number} escala - Factor de escala para la geometría
 * @returns {boolean} true si la creación fue exitosa
 */
export function crearColliderMapa(geometry, escala = 5) {
  if (!sistemaActivo || !world || !RAPIER) {
    console.error('❌ Sistema de física no inicializado');
    return false;
  }
  
  try {
    // Obtener atributos de la geometría
    const positionAttribute = geometry.getAttribute('position');
    const indexAttribute = geometry.getIndex();
    
    if (!positionAttribute) {
      console.error('❌ La geometría no tiene atributo de posición');
      return false;
    }
    
    // Extraer vértices y aplicar escala
    const vertices = new Float32Array(positionAttribute.count * 3);
    for (let i = 0; i < positionAttribute.count; i++) {
      vertices[i * 3] = positionAttribute.getX(i) * escala;
      vertices[i * 3 + 1] = positionAttribute.getY(i) * escala;
      vertices[i * 3 + 2] = positionAttribute.getZ(i) * escala;
    }
    
    // Extraer índices
    let indices;
    if (indexAttribute) {
      indices = new Uint32Array(indexAttribute.array);
    } else {
      // Si no hay índices, crear índices secuenciales (cada 3 vértices = 1 triángulo)
      indices = new Uint32Array(positionAttribute.count);
      for (let i = 0; i < positionAttribute.count; i++) {
        indices[i] = i;
      }
    }
    
    console.log(`📐 Creando trimesh: ${vertices.length / 3} vértices, ${indices.length / 3} triángulos`);
    
    // Crear el trimesh collider en Rapier
    const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices)
      // Configurar grupos de colisión (grupo 2 = mapa, colisiona con grupo 1 = jugador)
      .setCollisionGroups(0x00020001)
      .setSolverGroups(0x00020001);
    
    if (!colliderDesc) {
      console.error('❌ Error creando descriptor de trimesh');
      return false;
    }
    
    // Eliminar collider anterior si existe
    if (mapCollider) {
      world.removeCollider(mapCollider, true);
    }
    
    // Crear el collider en el mundo
    mapCollider = world.createCollider(colliderDesc);
    
    console.log('✅ Trimesh collider del mapa creado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error creando trimesh collider:', error);
    return false;
  }
}

/**
 * Crea el character controller para el jugador
 * Requirements: 2.1, 2.2, 5.3
 * @param {Object} config - Configuración opcional del character controller
 * @returns {boolean} true si la creación fue exitosa
 */
export function crearCharacterController(config = {}) {
  if (!sistemaActivo || !world || !RAPIER) {
    console.error('❌ Sistema de física no inicializado');
    return false;
  }
  
  try {
    const fisicaConfig = getFisicaConfig();
    
    // Combinar configuración por defecto con la proporcionada
    const controllerConfig = {
      offset: config.offset ?? fisicaConfig.margenColision ?? 0.02,
      alturaMaxEscalon: config.alturaMaxEscalon ?? fisicaConfig.alturaMaxEscalon ?? 0.8,
      anguloMaxRampa: config.anguloMaxRampa ?? fisicaConfig.anguloMaxRampa ?? 50,
      radioJugador: config.radioJugador ?? fisicaConfig.radioJugador ?? 0.4,
      alturaJugador: config.alturaJugador ?? fisicaConfig.alturaJugador ?? 1.8
    };
    
    // Eliminar character controller anterior si existe
    if (characterController) {
      characterController.free();
      characterController = null;
    }
    
    // Eliminar collider y rigidbody anteriores si existen
    if (playerCollider) {
      world.removeCollider(playerCollider, true);
      playerCollider = null;
    }
    if (playerRigidBody) {
      world.removeRigidBody(playerRigidBody);
      playerRigidBody = null;
    }
    
    // Crear el character controller con offset de separación
    characterController = world.createCharacterController(controllerConfig.offset);
    
    // Configurar ángulo máximo de rampa caminable
    characterController.setMaxSlopeClimbAngle(controllerConfig.anguloMaxRampa * Math.PI / 180);
    
    // Configurar auto-step para subir escalones automáticamente
    // Parámetros: maxHeight, minWidth, includeDynamicBodies
    characterController.enableAutostep(
      controllerConfig.alturaMaxEscalon,  // Altura máxima de escalón (0.8 para cajas/autos)
      0.1,                                  // Ancho mínimo del escalón (reducido para mejor detección)
      true                                  // Incluir cuerpos dinámicos
    );
    
    // Habilitar snap to ground para mantenerse pegado al suelo en bajadas y rampas
    // Valor más alto para mejor adherencia al suelo
    characterController.enableSnapToGround(1.0);
    
    // Configurar comportamiento de sliding en paredes
    characterController.setSlideEnabled(true);
    
    // Crear un RigidBody kinematic para el jugador
    // El character controller necesita un collider asociado a un rigidbody
    const rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(0, controllerConfig.alturaJugador / 2, 0);
    playerRigidBody = world.createRigidBody(rigidBodyDesc);
    
    // Crear el collider de cápsula para el jugador
    // La cápsula tiene altura total = alturaJugador, con hemisferios en los extremos
    const halfHeight = (controllerConfig.alturaJugador - 2 * controllerConfig.radioJugador) / 2;
    const capsuleDesc = RAPIER.ColliderDesc.capsule(
      Math.max(halfHeight, 0.1),  // Half-height del cilindro central
      controllerConfig.radioJugador
    )
    // Configurar grupos de colisión para que el jugador no colisione consigo mismo
    // pero sí con el mapa (grupo 1 = jugador, grupo 2 = mapa)
    .setCollisionGroups(0x00010002)  // Pertenece al grupo 1, colisiona con grupo 2
    .setSolverGroups(0x00010002);
    
    // Crear el collider del jugador asociado al rigidbody
    playerCollider = world.createCollider(capsuleDesc, playerRigidBody);
    
    console.log('✅ Character controller creado correctamente');
    console.log(`   Radio: ${controllerConfig.radioJugador}`);
    console.log(`   Altura: ${controllerConfig.alturaJugador}`);
    console.log(`   Altura máx escalón: ${controllerConfig.alturaMaxEscalon}`);
    console.log(`   Ángulo máx rampa: ${controllerConfig.anguloMaxRampa}°`);
    
    return true;
  } catch (error) {
    console.error('❌ Error creando character controller:', error);
    return false;
  }
}

/**
 * Obtiene el collider del jugador
 * @returns {Object|null} Collider del jugador o null si no está creado
 */
export function getPlayerCollider() {
  return playerCollider;
}

/**
 * Mueve al jugador usando el character controller
 * Usa computeColliderMovement() para detectar colisiones y calcular posición corregida
 * Requirements: 2.3, 2.4, 6.1
 * 
 * @param {THREE.Vector3} posicionActual - Posición actual del jugador (posición de los ojos)
 * @param {THREE.Vector3} desplazamiento - Desplazamiento deseado (vector de movimiento)
 * @param {number} deltaTime - Tiempo desde último frame
 * @returns {{posicion: THREE.Vector3, enSuelo: boolean, alturaCorregida: number}} Posición corregida y estado de suelo
 */
export function moverJugador(posicionActual, desplazamiento, deltaTime = 1/30) {
  // Resultado por defecto si el sistema no está activo
  const resultadoDefault = {
    posicion: posicionActual.clone().add(desplazamiento),
    enSuelo: false,
    alturaCorregida: posicionActual.y
  };
  
  if (!sistemaActivo || !world || !RAPIER || !characterController || !playerCollider || !playerRigidBody) {
    // Debug: mostrar qué componente falta
    if (!window._debugFisicaMostrado) {
      console.warn('⚠️ Sistema de física no completamente activo:', {
        sistemaActivo,
        world: !!world,
        RAPIER: !!RAPIER,
        characterController: !!characterController,
        playerCollider: !!playerCollider,
        playerRigidBody: !!playerRigidBody
      });
      window._debugFisicaMostrado = true;
    }
    return resultadoDefault;
  }
  
  // Verificar que el mapa collider existe
  if (!mapCollider) {
    if (!window._debugMapColliderMostrado) {
      console.warn('⚠️ Map collider no existe - las colisiones con el mapa no funcionarán');
      window._debugMapColliderMostrado = true;
    }
  }
  
  try {
    const config = getFisicaConfig();
    
    // La posición del jugador es la de los ojos (altura desde el suelo)
    const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
    const posicionPies = posicionActual.y - alturaOjos;
    
    // El centro de la cápsula de física
    const halfHeight = (config.alturaJugador - 2 * config.radioJugador) / 2;
    const capsuleCenterY = posicionPies + config.radioJugador + halfHeight;
    
    // Actualizar la posición del rigidbody del jugador directamente
    playerRigidBody.setTranslation({
      x: posicionActual.x,
      y: capsuleCenterY,
      z: posicionActual.z
    }, true);
    
    // Crear vector de desplazamiento para Rapier
    const desplazamientoRapier = {
      x: desplazamiento.x,
      y: desplazamiento.y,
      z: desplazamiento.z
    };
    
    // Calcular movimiento con colisiones usando el character controller
    characterController.computeColliderMovement(
      playerCollider,
      desplazamientoRapier,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS
    );
    
    // Obtener el movimiento corregido después de resolver colisiones
    const movimientoCorregido = characterController.computedMovement();
    
    // Calcular nueva posición del centro de la cápsula
    const nuevoCentroY = capsuleCenterY + movimientoCorregido.y;
    
    // Convertir de vuelta a posición de ojos
    const nuevaPosicionPies = nuevoCentroY - config.radioJugador - halfHeight;
    const nuevaPosicionOjos = nuevaPosicionPies + alturaOjos;
    
    let nuevaPosicion = new THREE.Vector3(
      posicionActual.x + movimientoCorregido.x,
      nuevaPosicionOjos,
      posicionActual.z + movimientoCorregido.z
    );
    
    // Detectar estado de suelo desde el character controller
    let enSuelo = characterController.computedGrounded();
    
    // SIEMPRE hacer raycast para verificar/corregir altura del suelo
    const rayOrigin = { x: nuevaPosicion.x, y: nuevaPosicionPies + 5.0, z: nuevaPosicion.z };
    const rayDir = { x: 0, y: -1, z: 0 };
    const ray = new RAPIER.Ray(rayOrigin, rayDir);
    
    // Raycast simple sin filtros complicados
    const hit = world.castRay(ray, 20.0, true);
    
    if (hit) {
      const alturaSueloDetectado = rayOrigin.y - hit.timeOfImpact;
      const distanciaAlSuelo = nuevaPosicionPies - alturaSueloDetectado;
      
      // Debug periódico
      if (!window._debugRaycastCount) window._debugRaycastCount = 0;
      window._debugRaycastCount++;
      if (window._debugRaycastCount % 60 === 0) {
        console.log('🔍 Raycast suelo:', {
          alturaSuelo: alturaSueloDetectado.toFixed(2),
          posicionPies: nuevaPosicionPies.toFixed(2),
          distancia: distanciaAlSuelo.toFixed(2),
          enSueloCC: enSuelo,
          hitTOI: hit.timeOfImpact.toFixed(2)
        });
      }
      
      // Si estamos cayendo y el suelo está cerca, corregir
      if (desplazamiento.y <= 0 && distanciaAlSuelo < 0.2 && distanciaAlSuelo > -0.5) {
        nuevaPosicion.y = alturaSueloDetectado + alturaOjos;
        enSuelo = true;
      }
      // Si estamos debajo del suelo, corregir inmediatamente
      else if (distanciaAlSuelo < -0.1) {
        nuevaPosicion.y = alturaSueloDetectado + alturaOjos;
        enSuelo = true;
      }
    } else {
      // No se detectó suelo - debug
      if (!window._debugNoSueloCount) window._debugNoSueloCount = 0;
      window._debugNoSueloCount++;
      if (window._debugNoSueloCount % 60 === 0) {
        console.warn('⚠️ Raycast no detectó suelo:', {
          posX: nuevaPosicion.x.toFixed(2),
          posY: nuevaPosicion.y.toFixed(2),
          posZ: nuevaPosicion.z.toFixed(2),
          mapColliderExiste: !!mapCollider,
          numColliders: world.colliders.len()
        });
      }
    }
    
    return {
      posicion: nuevaPosicion,
      enSuelo: enSuelo,
      alturaCorregida: nuevaPosicion.y
    };
  } catch (error) {
    console.error('Error en moverJugador:', error);
    return resultadoDefault;
  }
}

/**
 * Verifica si una posición está en el suelo y retorna información detallada
 * Usa raycast hacia abajo para detectar altura y normal del suelo
 * Requirements: 3.2, 3.3, 3.4
 * 
 * @param {THREE.Vector3} posicion - Posición a verificar (posición de los ojos del jugador)
 * @returns {{enSuelo: boolean, altura: number, normal: THREE.Vector3, distancia: number, enRampa: boolean}}
 */
export function verificarSuelo(posicion) {
  const config = getFisicaConfig();
  
  // Resultado por defecto
  const resultadoDefault = {
    enSuelo: true,
    altura: 0,
    normal: new THREE.Vector3(0, 1, 0),
    distancia: 0,
    enRampa: false
  };
  
  if (!sistemaActivo || !world || !RAPIER) {
    return resultadoDefault;
  }
  
  try {
    // La posición recibida es la de los ojos
    // Calcular la posición de los pies usando alturaOjos
    const alturaOjos = CONFIG.jugador?.alturaOjos || 1.7;
    const posicionPies = posicion.y - alturaOjos;
    
    // Origen del raycast: desde un poco arriba de los pies para detectar el suelo debajo
    const origenY = posicionPies + 0.5; // Medio metro arriba de los pies
    const origen = { x: posicion.x, y: origenY, z: posicion.z };
    
    // Dirección: hacia abajo
    const direccion = { x: 0, y: -1, z: 0 };
    
    // Distancia máxima del raycast
    const distanciaMax = 3.0; // Suficiente para detectar caídas
    
    // Crear el ray para Rapier
    const ray = new RAPIER.Ray(origen, direccion);
    
    // Usar castRayAndGetNormal para obtener la normal de la superficie (para rampas)
    const hit = world.castRayAndGetNormal(
      ray,
      distanciaMax,
      true, // solid: true para detectar el interior de los colliders
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS
    );
    
    if (hit) {
      // Calcular punto de impacto
      const distancia = hit.timeOfImpact;
      const puntoImpactoY = origenY - distancia;
      
      // Obtener la normal de la superficie
      let normal = new THREE.Vector3(0, 1, 0);
      if (hit.normal) {
        normal.set(hit.normal.x, hit.normal.y, hit.normal.z);
        normal.normalize();
      }
      
      // Calcular la distancia desde los pies al suelo
      const distanciaPiesASuelo = posicionPies - puntoImpactoY;
      
      // El jugador está en el suelo si sus pies están cerca del suelo
      // Umbral más generoso para permitir subir a superficies
      const umbralSuelo = 0.3; // 30cm de tolerancia
      const enSuelo = distanciaPiesASuelo >= -0.1 && distanciaPiesASuelo < umbralSuelo;
      
      // Detectar si está en una rampa basándose en la normal
      const anguloNormal = Math.acos(Math.abs(normal.y)) * (180 / Math.PI);
      const enRampa = enSuelo && anguloNormal > 1 && anguloNormal <= config.anguloMaxRampa;
      
      return {
        enSuelo: enSuelo,
        altura: puntoImpactoY,
        normal: normal,
        distancia: distanciaPiesASuelo,
        enRampa: enRampa
      };
    } else {
      // No hay suelo debajo - el jugador está cayendo
      return {
        enSuelo: false,
        altura: -Infinity,
        normal: new THREE.Vector3(0, 1, 0),
        distancia: Infinity,
        enRampa: false
      };
    }
  } catch (error) {
    console.error('Error en verificarSuelo:', error);
    return resultadoDefault;
  }
}

/**
 * Realiza un raycast para balas contra la geometría del mapa
 * Requirements: 1.1, 1.2
 * 
 * @param {THREE.Vector3} origen - Origen del rayo
 * @param {THREE.Vector3} direccion - Dirección normalizada del rayo
 * @param {number} distanciaMax - Distancia máxima del raycast
 * @returns {{hit: boolean, punto: THREE.Vector3, distancia: number, normal: THREE.Vector3} | null}
 */
export function raycastBala(origen, direccion, distanciaMax) {
  if (!sistemaActivo || !world || !RAPIER) {
    return null;
  }
  
  try {
    // Crear el ray para Rapier
    // Requirements 1.1: Perform raycast from bullet origin to maximum range
    const ray = new RAPIER.Ray(
      { x: origen.x, y: origen.y, z: origen.z },
      { x: direccion.x, y: direccion.y, z: direccion.z }
    );
    
    // Realizar raycast con obtención de normal para efectos de impacto
    // Requirements 1.2: Calculate exact impact point
    // Usar castRayAndGetNormal para obtener la normal de la superficie
    const hit = world.castRayAndGetNormal(
      ray,
      distanciaMax,
      true, // solid - detectar interior de colliders
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS // Filtrar solo geometría del mapa
    );
    
    if (hit) {
      const distancia = hit.timeOfImpact;
      
      // Calcular punto de impacto exacto
      const punto = new THREE.Vector3(
        origen.x + direccion.x * distancia,
        origen.y + direccion.y * distancia,
        origen.z + direccion.z * distancia
      );
      
      // Obtener normal de la superficie para efectos de impacto
      let normal = new THREE.Vector3(0, 1, 0);
      if (hit.normal) {
        normal.set(hit.normal.x, hit.normal.y, hit.normal.z);
        normal.normalize();
      }
      
      return {
        hit: true,
        punto: punto,
        distancia: distancia,
        normal: normal
      };
    }
    
    return {
      hit: false,
      punto: null,
      distancia: distanciaMax,
      normal: null
    };
  } catch (error) {
    console.error('Error en raycastBala:', error);
    return null;
  }
}

/**
 * Realiza un shape cast para el movimiento del dash
 * Detecta colisiones durante todo el trayecto del dash y calcula la posición final válida
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * 
 * @param {THREE.Vector3} posicionInicial - Posición inicial del jugador
 * @param {THREE.Vector3} direccionDash - Dirección normalizada del dash
 * @param {number} distanciaDash - Distancia total del dash
 * @returns {{posicionFinal: THREE.Vector3, colision: boolean, distanciaRecorrida: number, puntoImpacto: THREE.Vector3|null}}
 */
export function shapeCastDash(posicionInicial, direccionDash, distanciaDash) {
  const config = getFisicaConfig();
  
  // Resultado por defecto: dash completo sin colisión
  const resultadoDefault = {
    posicionFinal: new THREE.Vector3(
      posicionInicial.x + direccionDash.x * distanciaDash,
      posicionInicial.y,
      posicionInicial.z + direccionDash.z * distanciaDash
    ),
    colision: false,
    distanciaRecorrida: distanciaDash,
    puntoImpacto: null
  };
  
  if (!sistemaActivo || !world || !RAPIER) {
    return resultadoDefault;
  }
  
  try {
    // Crear la forma de cápsula para el shape cast
    // Usamos las mismas dimensiones que el character controller
    const halfHeight = (config.alturaJugador - 2 * config.radioJugador) / 2;
    const shape = new RAPIER.Capsule(Math.max(halfHeight, 0.1), config.radioJugador);
    
    // Posición inicial del centro de la cápsula
    // La posición del jugador es la de los ojos, calculamos el centro de la cápsula
    const capsuleCenterY = posicionInicial.y - config.alturaJugador / 2 + config.radioJugador + halfHeight;
    const shapePos = {
      x: posicionInicial.x,
      y: capsuleCenterY,
      z: posicionInicial.z
    };
    
    // Rotación de la cápsula (vertical, sin rotación)
    const shapeRot = { x: 0, y: 0, z: 0, w: 1 };
    
    // Dirección del movimiento (normalizada, solo horizontal para el dash)
    const shapeVel = {
      x: direccionDash.x,
      y: 0,
      z: direccionDash.z
    };
    
    // Realizar el shape cast
    // castShape retorna el primer impacto si existe
    const hit = world.castShape(
      shapePos,
      shapeRot,
      shapeVel,
      shape,
      distanciaDash,
      true, // stopAtPenetration
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS
    );
    
    if (hit && hit.timeOfImpact < distanciaDash) {
      // Hay colisión durante el dash
      // Calcular la distancia recorrida antes del impacto
      // Aplicar un pequeño margen para no quedar exactamente en la pared
      const margen = config.margenColision || 0.02;
      const distanciaSegura = Math.max(0, hit.timeOfImpact - margen);
      
      // Calcular posición final (antes del impacto)
      const posicionFinal = new THREE.Vector3(
        posicionInicial.x + direccionDash.x * distanciaSegura,
        posicionInicial.y,
        posicionInicial.z + direccionDash.z * distanciaSegura
      );
      
      // Calcular punto de impacto
      const puntoImpacto = new THREE.Vector3(
        posicionInicial.x + direccionDash.x * hit.timeOfImpact,
        posicionInicial.y,
        posicionInicial.z + direccionDash.z * hit.timeOfImpact
      );
      
      // Intentar sliding si el dash es en ángulo a la pared
      // Requirement 4.2: Allow sliding along the wall
      if (hit.normal) {
        const normal = new THREE.Vector3(hit.normal.x, 0, hit.normal.z);
        if (normal.lengthSq() > 0.001) {
          normal.normalize();
          
          // Calcular componente de movimiento paralelo a la pared
          const movimientoRestante = distanciaDash - distanciaSegura;
          if (movimientoRestante > 0.1) {
            const direccionOriginal = new THREE.Vector3(direccionDash.x, 0, direccionDash.z);
            const dotProduct = direccionOriginal.dot(normal);
            
            // Solo hacer sliding si el ángulo no es muy perpendicular
            if (Math.abs(dotProduct) < 0.95) {
              const componenteNormal = normal.clone().multiplyScalar(dotProduct);
              const componenteParalelo = direccionOriginal.clone().sub(componenteNormal);
              
              if (componenteParalelo.lengthSq() > 0.01) {
                componenteParalelo.normalize();
                
                // Hacer un segundo shape cast en la dirección de sliding
                const slidingDistance = movimientoRestante * (1 - Math.abs(dotProduct));
                const slidingVel = {
                  x: componenteParalelo.x,
                  y: 0,
                  z: componenteParalelo.z
                };
                
                // Posición desde donde empezar el sliding
                const slidingStartPos = {
                  x: posicionFinal.x,
                  y: capsuleCenterY,
                  z: posicionFinal.z
                };
                
                const slidingHit = world.castShape(
                  slidingStartPos,
                  shapeRot,
                  slidingVel,
                  shape,
                  slidingDistance,
                  true,
                  RAPIER.QueryFilterFlags.EXCLUDE_SENSORS
                );
                
                if (slidingHit) {
                  // Hay colisión durante el sliding
                  const slidingDistanciaSegura = Math.max(0, slidingHit.timeOfImpact - margen);
                  posicionFinal.x += componenteParalelo.x * slidingDistanciaSegura;
                  posicionFinal.z += componenteParalelo.z * slidingDistanciaSegura;
                } else {
                  // Sliding completo sin colisión
                  posicionFinal.x += componenteParalelo.x * slidingDistance;
                  posicionFinal.z += componenteParalelo.z * slidingDistance;
                }
              }
            }
          }
        }
      }
      
      return {
        posicionFinal: posicionFinal,
        colision: true,
        distanciaRecorrida: distanciaSegura,
        puntoImpacto: puntoImpacto
      };
    }
    
    // No hay colisión, dash completo
    return resultadoDefault;
  } catch (error) {
    console.error('Error en shapeCastDash:', error);
    return resultadoDefault;
  }
}

/**
 * Verifica si una posición es válida (no está dentro de geometría)
 * Requirement 4.4: Find nearest valid position if dash would place player inside geometry
 * 
 * @param {THREE.Vector3} posicion - Posición a verificar
 * @returns {{valida: boolean, posicionCorregida: THREE.Vector3}}
 */
export function verificarPosicionValida(posicion) {
  const config = getFisicaConfig();
  
  const resultadoDefault = {
    valida: true,
    posicionCorregida: posicion.clone()
  };
  
  if (!sistemaActivo || !world || !RAPIER) {
    return resultadoDefault;
  }
  
  try {
    // Crear la forma de cápsula
    const halfHeight = (config.alturaJugador - 2 * config.radioJugador) / 2;
    const shape = new RAPIER.Capsule(Math.max(halfHeight, 0.1), config.radioJugador);
    
    // Posición del centro de la cápsula
    const capsuleCenterY = posicion.y - config.alturaJugador / 2 + config.radioJugador + halfHeight;
    const shapePos = {
      x: posicion.x,
      y: capsuleCenterY,
      z: posicion.z
    };
    
    // Rotación de la cápsula
    const shapeRot = { x: 0, y: 0, z: 0, w: 1 };
    
    // Verificar si hay intersección con la geometría
    const intersecting = world.intersectionWithShape(
      shapePos,
      shapeRot,
      shape,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS
    );
    
    if (intersecting) {
      // La posición está dentro de geometría
      // Intentar encontrar la posición válida más cercana usando project point
      // Buscar en varias direcciones para encontrar una salida
      const direcciones = [
        { x: 1, y: 0, z: 0 },
        { x: -1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 },
        { x: 0, y: 0, z: -1 },
        { x: 0.707, y: 0, z: 0.707 },
        { x: -0.707, y: 0, z: 0.707 },
        { x: 0.707, y: 0, z: -0.707 },
        { x: -0.707, y: 0, z: -0.707 }
      ];
      
      let mejorPosicion = posicion.clone();
      let menorDistancia = Infinity;
      
      for (const dir of direcciones) {
        // Hacer shape cast desde la posición actual hacia afuera
        const hit = world.castShape(
          shapePos,
          shapeRot,
          dir,
          shape,
          5.0, // Distancia máxima de búsqueda
          true,
          RAPIER.QueryFilterFlags.EXCLUDE_SENSORS
        );
        
        if (!hit) {
          // No hay colisión en esta dirección, podemos movernos ahí
          // Mover un poco en esa dirección
          const distanciaMovimiento = config.radioJugador + config.margenColision;
          const nuevaPosicion = new THREE.Vector3(
            posicion.x + dir.x * distanciaMovimiento,
            posicion.y,
            posicion.z + dir.z * distanciaMovimiento
          );
          
          // Verificar que la nueva posición sea válida
          const nuevaCapsulePos = {
            x: nuevaPosicion.x,
            y: capsuleCenterY,
            z: nuevaPosicion.z
          };
          
          const aun_intersecting = world.intersectionWithShape(
            nuevaCapsulePos,
            shapeRot,
            shape,
            RAPIER.QueryFilterFlags.EXCLUDE_SENSORS
          );
          
          if (!aun_intersecting) {
            const distancia = nuevaPosicion.distanceTo(posicion);
            if (distancia < menorDistancia) {
              menorDistancia = distancia;
              mejorPosicion = nuevaPosicion;
            }
          }
        }
      }
      
      return {
        valida: false,
        posicionCorregida: mejorPosicion
      };
    }
    
    return resultadoDefault;
  } catch (error) {
    console.error('Error en verificarPosicionValida:', error);
    return resultadoDefault;
  }
}

/**
 * Libera todos los recursos del sistema de física
 */
export function destruir() {
  if (characterController) {
    characterController.free();
    characterController = null;
  }
  
  if (playerCollider) {
    world.removeCollider(playerCollider, true);
    playerCollider = null;
  }
  
  if (playerRigidBody) {
    world.removeRigidBody(playerRigidBody);
    playerRigidBody = null;
  }
  
  if (mapCollider) {
    world.removeCollider(mapCollider, true);
    mapCollider = null;
  }
  
  if (world) {
    world.free();
    world = null;
  }
  
  RAPIER = null;
  sistemaActivo = false;
  
  console.log('🧹 Sistema de física destruido');
}
