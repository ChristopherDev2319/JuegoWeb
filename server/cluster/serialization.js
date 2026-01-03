/**
 * Serialización de salas para Redis
 * 
 * Funciones para serializar y deserializar información de salas
 * entre objetos JavaScript y strings JSON para almacenamiento en Redis.
 * 
 * Requirements: 1.5, 2.5
 */

/**
 * @typedef {Object} RoomInfo
 * @property {string} id - ID único de la sala
 * @property {string} codigo - Código de 6 caracteres
 * @property {'publica'|'privada'} tipo - Tipo de sala
 * @property {number} workerId - ID del worker que hospeda la sala
 * @property {number} jugadores - Número actual de jugadores
 * @property {number} maxJugadores - Máximo de jugadores permitidos
 * @property {number} createdAt - Timestamp de creación
 * @property {number} lastHeartbeat - Último heartbeat recibido
 */

/**
 * Campos requeridos para RoomInfo según Requirements 2.5
 */
const REQUIRED_FIELDS = ['id', 'codigo', 'tipo', 'workerId', 'jugadores', 'maxJugadores'];

/**
 * Valida que un objeto tenga todos los campos requeridos
 * @param {Object} obj - Objeto a validar
 * @returns {boolean} - True si tiene todos los campos requeridos
 */
function hasRequiredFields(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  for (const field of REQUIRED_FIELDS) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      return false;
    }
  }
  
  return true;
}

/**
 * Serializa un objeto RoomInfo a JSON string
 * 
 * Requirement 1.5: Serializar estado de sala a JSON
 * Requirement 2.5: Incluir workerId, roomId, código, tipo, jugadores actuales y máximos
 * 
 * @param {RoomInfo} room - Información de la sala
 * @returns {string} - JSON string de la sala
 * @throws {Error} Si la sala no tiene los campos requeridos
 */
export function serializeRoom(room) {
  if (!hasRequiredFields(room)) {
    const missingFields = REQUIRED_FIELDS.filter(f => !(f in room) || room[f] === undefined || room[f] === null);
    throw new Error(`RoomInfo missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Crear objeto con solo los campos necesarios para evitar datos innecesarios
  const roomData = {
    id: room.id,
    codigo: room.codigo,
    tipo: room.tipo,
    workerId: room.workerId,
    jugadores: room.jugadores,
    maxJugadores: room.maxJugadores,
    createdAt: room.createdAt || Date.now(),
    lastHeartbeat: room.lastHeartbeat || Date.now()
  };
  
  return JSON.stringify(roomData);
}

/**
 * Deserializa un JSON string a objeto RoomInfo
 * 
 * Requirement 1.5: Deserializar JSON y obtener estado equivalente
 * 
 * @param {string} json - JSON string de la sala
 * @returns {RoomInfo} - Objeto RoomInfo
 * @throws {Error} Si el JSON es inválido o faltan campos requeridos
 */
export function deserializeRoom(json) {
  if (typeof json !== 'string') {
    throw new Error('Input must be a JSON string');
  }
  
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`);
  }
  
  if (!hasRequiredFields(parsed)) {
    const missingFields = REQUIRED_FIELDS.filter(f => !(f in parsed) || parsed[f] === undefined || parsed[f] === null);
    throw new Error(`Deserialized RoomInfo missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Retornar objeto con tipos correctos
  return {
    id: String(parsed.id),
    codigo: String(parsed.codigo),
    tipo: parsed.tipo === 'privada' ? 'privada' : 'publica',
    workerId: Number(parsed.workerId),
    jugadores: Number(parsed.jugadores),
    maxJugadores: Number(parsed.maxJugadores),
    createdAt: Number(parsed.createdAt) || Date.now(),
    lastHeartbeat: Number(parsed.lastHeartbeat) || Date.now()
  };
}

/**
 * Verifica si dos RoomInfo son equivalentes
 * Útil para testing de round-trip
 * 
 * @param {RoomInfo} a - Primera sala
 * @param {RoomInfo} b - Segunda sala
 * @returns {boolean} - True si son equivalentes
 */
export function roomsAreEquivalent(a, b) {
  if (!a || !b) return false;
  
  return (
    a.id === b.id &&
    a.codigo === b.codigo &&
    a.tipo === b.tipo &&
    a.workerId === b.workerId &&
    a.jugadores === b.jugadores &&
    a.maxJugadores === b.maxJugadores &&
    a.createdAt === b.createdAt &&
    a.lastHeartbeat === b.lastHeartbeat
  );
}

export { REQUIRED_FIELDS };
