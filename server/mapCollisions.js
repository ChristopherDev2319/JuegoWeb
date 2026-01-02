/**
 * Sistema de Colisiones del Mapa para el Servidor
 * Usa una representación simplificada del mapa (AABBs de paredes) para raycasts
 * 
 * Requirements: 1.1, 1.2
 * @module mapCollisions
 */

// Estado del sistema de colisiones
let mapWalls = [];
let mapBounds = null;
let sistemaActivo = false;

// Colisiones del mapa habilitadas
const ENABLE_MAP_COLLISIONS = true;

/**
 * Representa un AABB (Axis-Aligned Bounding Box) para una pared
 * @typedef {Object} WallAABB
 * @property {number} minX - Coordenada X mínima
 * @property {number} maxX - Coordenada X máxima
 * @property {number} minY - Coordenada Y mínima
 * @property {number} maxY - Coordenada Y máxima
 * @property {number} minZ - Coordenada Z mínima
 * @property {number} maxZ - Coordenada Z máxima
 */

/**
 * Datos simplificados del mapa para colisiones del servidor
 * Estos AABBs representan las paredes principales del mapa
 * Escalados a 5x para coincidir con el mapa visual
 * 
 * NOTA: Solo incluir paredes EXTERIORES del mapa para evitar
 * que las balas se detengan en estructuras internas incorrectas.
 * Las estructuras internas deben coincidir exactamente con el mapa visual.
 */
const DEFAULT_MAP_WALLS = [
  // Paredes exteriores del mapa (límites del área jugable)
  // Pared Norte
  { minX: -125, maxX: 125, minY: 0, maxY: 20, minZ: -125, maxZ: -122 },
  // Pared Sur
  { minX: -125, maxX: 125, minY: 0, maxY: 20, minZ: 122, maxZ: 125 },
  // Pared Este
  { minX: 122, maxX: 125, minY: 0, maxY: 20, minZ: -125, maxZ: 125 },
  // Pared Oeste
  { minX: -125, maxX: -122, minY: 0, maxY: 20, minZ: -125, maxZ: 125 }
  
  // NOTA: Las estructuras internas han sido removidas porque no coinciden
  // con la geometría real del mapa y causan que las balas se detengan
  // incorrectamente. Para agregar colisiones internas, extraer los AABBs
  // del modelo map_coll.glb
];

/**
 * Límites por defecto del mapa
 */
const DEFAULT_MAP_BOUNDS = {
  minX: -125,
  maxX: 125,
  minY: -1,
  maxY: 50,
  minZ: -125,
  maxZ: 125
};

/**
 * Inicializa las colisiones del mapa en el servidor
 * @param {Object} mapData - Datos opcionales del mapa (AABBs de paredes)
 * @returns {boolean} true si la inicialización fue exitosa
 */
export function inicializarMapaServidor(mapData = null) {
  try {
    if (mapData && mapData.walls && Array.isArray(mapData.walls)) {
      mapWalls = mapData.walls;
      mapBounds = mapData.bounds || DEFAULT_MAP_BOUNDS;
    } else {
      // Usar datos por defecto
      mapWalls = DEFAULT_MAP_WALLS;
      mapBounds = DEFAULT_MAP_BOUNDS;
    }
    
    sistemaActivo = true;
    console.log(`✅ Colisiones del mapa inicializadas (servidor)`);
    console.log(`   ${mapWalls.length} AABBs de paredes cargados`);
    
    return true;
  } catch (error) {
    console.error('❌ Error inicializando colisiones del mapa:', error);
    sistemaActivo = false;
    return false;
  }
}

/**
 * Verifica si el sistema de colisiones está activo
 * @returns {boolean}
 */
export function estaActivo() {
  // TEMPORAL: Usar flag para desactivar colisiones del mapa
  return sistemaActivo && ENABLE_MAP_COLLISIONS;
}

/**
 * Obtiene los límites del mapa
 * @returns {Object|null}
 */
export function getMapBounds() {
  return mapBounds;
}

/**
 * Raycast contra un AABB individual
 * Usa el algoritmo de slab method para intersección rayo-AABB
 * 
 * @param {Object} from - Posición inicial {x, y, z}
 * @param {Object} direction - Dirección normalizada {x, y, z}
 * @param {number} maxDistance - Distancia máxima del raycast
 * @param {WallAABB} aabb - AABB a verificar
 * @returns {{hit: boolean, distance: number, point: Object, normal: Object} | null}
 */
function raycastAABB(from, direction, maxDistance, aabb) {
  // Slab method para intersección rayo-AABB
  let tMin = 0;
  let tMax = maxDistance;
  
  // Normal de la superficie impactada
  let normalX = 0, normalY = 0, normalZ = 0;
  
  // Eje X
  if (Math.abs(direction.x) < 0.0001) {
    // Rayo paralelo al eje X
    if (from.x < aabb.minX || from.x > aabb.maxX) {
      return null;
    }
  } else {
    const invD = 1.0 / direction.x;
    let t1 = (aabb.minX - from.x) * invD;
    let t2 = (aabb.maxX - from.x) * invD;
    
    let normalSign = -1;
    if (t1 > t2) {
      [t1, t2] = [t2, t1];
      normalSign = 1;
    }
    
    if (t1 > tMin) {
      tMin = t1;
      normalX = normalSign;
      normalY = 0;
      normalZ = 0;
    }
    tMax = Math.min(tMax, t2);
    
    if (tMin > tMax) return null;
  }
  
  // Eje Y
  if (Math.abs(direction.y) < 0.0001) {
    if (from.y < aabb.minY || from.y > aabb.maxY) {
      return null;
    }
  } else {
    const invD = 1.0 / direction.y;
    let t1 = (aabb.minY - from.y) * invD;
    let t2 = (aabb.maxY - from.y) * invD;
    
    let normalSign = -1;
    if (t1 > t2) {
      [t1, t2] = [t2, t1];
      normalSign = 1;
    }
    
    if (t1 > tMin) {
      tMin = t1;
      normalX = 0;
      normalY = normalSign;
      normalZ = 0;
    }
    tMax = Math.min(tMax, t2);
    
    if (tMin > tMax) return null;
  }
  
  // Eje Z
  if (Math.abs(direction.z) < 0.0001) {
    if (from.z < aabb.minZ || from.z > aabb.maxZ) {
      return null;
    }
  } else {
    const invD = 1.0 / direction.z;
    let t1 = (aabb.minZ - from.z) * invD;
    let t2 = (aabb.maxZ - from.z) * invD;
    
    let normalSign = -1;
    if (t1 > t2) {
      [t1, t2] = [t2, t1];
      normalSign = 1;
    }
    
    if (t1 > tMin) {
      tMin = t1;
      normalX = 0;
      normalY = 0;
      normalZ = normalSign;
    }
    tMax = Math.min(tMax, t2);
    
    if (tMin > tMax) return null;
  }
  
  // Verificar que la intersección está dentro del rango válido
  if (tMin < 0 || tMin > maxDistance) {
    return null;
  }
  
  // Calcular punto de impacto
  const point = {
    x: from.x + direction.x * tMin,
    y: from.y + direction.y * tMin,
    z: from.z + direction.z * tMin
  };
  
  return {
    hit: true,
    distance: tMin,
    point: point,
    normal: { x: normalX, y: normalY, z: normalZ }
  };
}

/**
 * Raycast contra la geometría del mapa
 * Verifica colisión con todos los AABBs y retorna el impacto más cercano
 * Requirements: 1.1, 1.2
 * 
 * @param {Object} from - Posición inicial {x, y, z}
 * @param {Object} to - Posición final {x, y, z}
 * @returns {{hit: boolean, point: Object, distance: number, normal: Object} | null}
 */
export function raycastContraMapa(from, to) {
  if (!sistemaActivo || mapWalls.length === 0) {
    return null;
  }
  
  // Calcular dirección y distancia del rayo
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const maxDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  if (maxDistance < 0.0001) {
    return null;
  }
  
  // Normalizar dirección
  const direction = {
    x: dx / maxDistance,
    y: dy / maxDistance,
    z: dz / maxDistance
  };
  
  // Buscar el impacto más cercano
  let closestHit = null;
  let closestDistance = maxDistance;
  
  for (const wall of mapWalls) {
    const hit = raycastAABB(from, direction, closestDistance, wall);
    
    if (hit && hit.distance < closestDistance) {
      closestDistance = hit.distance;
      closestHit = hit;
    }
  }
  
  return closestHit;
}

/**
 * Raycast desde un origen en una dirección dada
 * Versión alternativa que acepta dirección normalizada directamente
 * Requirements: 1.1, 1.2
 * 
 * @param {Object} origin - Origen del rayo {x, y, z}
 * @param {Object} direction - Dirección normalizada {x, y, z}
 * @param {number} maxDistance - Distancia máxima del raycast
 * @returns {{hit: boolean, point: Object, distance: number, normal: Object} | null}
 */
export function raycast(origin, direction, maxDistance) {
  if (!sistemaActivo || mapWalls.length === 0) {
    return null;
  }
  
  // Buscar el impacto más cercano
  let closestHit = null;
  let closestDistance = maxDistance;
  
  for (const wall of mapWalls) {
    const hit = raycastAABB(origin, direction, closestDistance, wall);
    
    if (hit && hit.distance < closestDistance) {
      closestDistance = hit.distance;
      closestHit = hit;
    }
  }
  
  return closestHit;
}

/**
 * Verifica si un segmento de línea intersecta con alguna pared del mapa
 * Útil para verificar línea de visión o trayectoria de bala
 * 
 * @param {Object} from - Posición inicial {x, y, z}
 * @param {Object} to - Posición final {x, y, z}
 * @returns {boolean} true si hay intersección
 */
export function lineaIntersectaMapa(from, to) {
  const hit = raycastContraMapa(from, to);
  return hit !== null && hit.hit;
}

/**
 * Agrega un AABB de pared al sistema de colisiones
 * @param {WallAABB} wall - AABB de la pared a agregar
 */
export function agregarPared(wall) {
  if (wall && 
      typeof wall.minX === 'number' && typeof wall.maxX === 'number' &&
      typeof wall.minY === 'number' && typeof wall.maxY === 'number' &&
      typeof wall.minZ === 'number' && typeof wall.maxZ === 'number') {
    mapWalls.push(wall);
  }
}

/**
 * Limpia todas las paredes del sistema
 */
export function limpiarParedes() {
  mapWalls = [];
}

/**
 * Obtiene el número de paredes cargadas
 * @returns {number}
 */
export function getNumeroParedes() {
  return mapWalls.length;
}

/**
 * Destruye el sistema de colisiones y libera recursos
 */
export function destruir() {
  mapWalls = [];
  mapBounds = null;
  sistemaActivo = false;
  console.log('🧹 Sistema de colisiones del mapa destruido (servidor)');
}

// Inicializar automáticamente con datos por defecto al importar el módulo
inicializarMapaServidor();
