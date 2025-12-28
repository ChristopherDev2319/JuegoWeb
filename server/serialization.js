/**
 * Game State Serialization Module
 * Handles serialization and deserialization of game state and messages
 * 
 * Requirements: 1.5, 9.1, 9.2, 9.3
 */

/**
 * Serialize game state to JSON string (Requirement 9.1)
 * @param {Object} gameState - Game state object with players and bullets
 * @returns {string} - JSON string representation
 */
export function serializeGameState(gameState) {
  if (!gameState) {
    return JSON.stringify({ players: [], bullets: [] });
  }

  const serialized = {
    players: [],
    bullets: []
  };

  // Serialize players
  if (gameState.players) {
    if (gameState.players instanceof Map) {
      for (const [id, player] of gameState.players) {
        serialized.players.push(serializePlayer(player));
      }
    } else if (Array.isArray(gameState.players)) {
      serialized.players = gameState.players.map(p => serializePlayer(p));
    }
  }

  // Serialize bullets
  if (gameState.bullets) {
    if (Array.isArray(gameState.bullets)) {
      serialized.bullets = gameState.bullets.map(b => serializeBullet(b));
    }
  }

  return JSON.stringify(serialized);
}

/**
 * Deserialize JSON string to game state object (Requirement 9.2)
 * @param {string} jsonString - JSON string to parse
 * @returns {Object|null} - Game state object or null if invalid
 */
export function deserializeGameState(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const gameState = {
      players: [],
      bullets: []
    };

    // Deserialize players
    if (Array.isArray(parsed.players)) {
      gameState.players = parsed.players.map(p => deserializePlayer(p)).filter(p => p !== null);
    }

    // Deserialize bullets
    if (Array.isArray(parsed.bullets)) {
      gameState.bullets = parsed.bullets.map(b => deserializeBullet(b)).filter(b => b !== null);
    }

    return gameState;
  } catch (error) {
    // Requirement 9.5: Handle malformed data gracefully
    return null;
  }
}


/**
 * Serialize a message for network transmission
 * @param {string} type - Message type
 * @param {Object} data - Message data
 * @returns {string} - JSON string
 */
export function serializeMessage(type, data) {
  const message = {
    type: type,
    data: data,
    timestamp: Date.now()
  };
  return JSON.stringify(message);
}

/**
 * Deserialize a message from network
 * @param {string} jsonString - JSON string to parse
 * @returns {Object|null} - Message object or null if invalid
 */
export function deserializeMessage(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    // Validate required fields
    if (typeof parsed.type !== 'string') {
      return null;
    }

    return {
      type: parsed.type,
      data: parsed.data || {},
      timestamp: parsed.timestamp || Date.now()
    };
  } catch (error) {
    // Requirement 9.5: Handle malformed data gracefully
    return null;
  }
}

/**
 * Serialize a player object
 * @param {Object} player - Player state object
 * @returns {Object} - Serialized player data
 */
function serializePlayer(player) {
  if (!player) return null;
  
  // Handle PlayerState class with toJSON method
  if (typeof player.toJSON === 'function') {
    return player.toJSON();
  }

  // Handle plain object
  return {
    id: player.id,
    position: player.position ? { ...player.position } : { x: 0, y: 0, z: 0 },
    rotation: player.rotation ? { ...player.rotation } : { x: 0, y: 0, z: 0 },
    velocity: player.velocity ? { ...player.velocity } : { x: 0, y: 0, z: 0 },
    health: player.health ?? 200,
    maxHealth: player.maxHealth ?? 200,
    isAlive: player.isAlive ?? true,
    ammo: player.ammo ?? 30,
    maxAmmo: player.maxAmmo ?? 30,
    totalAmmo: player.totalAmmo ?? 120,
    isReloading: player.isReloading ?? false,
    dashCharges: player.dashCharges ?? 3,
    maxDashCharges: player.maxDashCharges ?? 3
  };
}

/**
 * Deserialize a player object
 * @param {Object} data - Serialized player data
 * @returns {Object|null} - Player object or null if invalid
 */
function deserializePlayer(data) {
  if (!data || typeof data !== 'object') return null;
  if (!data.id) return null;

  return {
    id: data.id,
    position: deserializeVector3(data.position) || { x: 0, y: 0, z: 0 },
    rotation: deserializeVector3(data.rotation) || { x: 0, y: 0, z: 0 },
    velocity: deserializeVector3(data.velocity) || { x: 0, y: 0, z: 0 },
    health: typeof data.health === 'number' ? data.health : 200,
    maxHealth: typeof data.maxHealth === 'number' ? data.maxHealth : 200,
    isAlive: typeof data.isAlive === 'boolean' ? data.isAlive : true,
    ammo: typeof data.ammo === 'number' ? data.ammo : 30,
    maxAmmo: typeof data.maxAmmo === 'number' ? data.maxAmmo : 30,
    totalAmmo: typeof data.totalAmmo === 'number' ? data.totalAmmo : 120,
    isReloading: typeof data.isReloading === 'boolean' ? data.isReloading : false,
    dashCharges: typeof data.dashCharges === 'number' ? data.dashCharges : 3,
    maxDashCharges: typeof data.maxDashCharges === 'number' ? data.maxDashCharges : 3
  };
}


/**
 * Serialize a bullet object
 * @param {Object} bullet - Bullet object
 * @returns {Object} - Serialized bullet data
 */
function serializeBullet(bullet) {
  if (!bullet) return null;

  // Handle Bullet class with toJSON method
  if (typeof bullet.toJSON === 'function') {
    return bullet.toJSON();
  }

  // Handle plain object
  return {
    id: bullet.id,
    ownerId: bullet.ownerId,
    position: bullet.position ? { ...bullet.position } : { x: 0, y: 0, z: 0 },
    direction: bullet.direction ? { ...bullet.direction } : { x: 0, y: 0, z: 1 }
  };
}

/**
 * Deserialize a bullet object
 * @param {Object} data - Serialized bullet data
 * @returns {Object|null} - Bullet object or null if invalid
 */
function deserializeBullet(data) {
  if (!data || typeof data !== 'object') return null;
  if (!data.id || !data.ownerId) return null;

  return {
    id: data.id,
    ownerId: data.ownerId,
    position: deserializeVector3(data.position) || { x: 0, y: 0, z: 0 },
    direction: deserializeVector3(data.direction) || { x: 0, y: 0, z: 1 }
  };
}

/**
 * Deserialize a Vector3 object
 * @param {Object} data - Vector3 data
 * @returns {Object|null} - Vector3 object or null if invalid
 */
function deserializeVector3(data) {
  if (!data || typeof data !== 'object') return null;
  
  return {
    x: typeof data.x === 'number' ? data.x : 0,
    y: typeof data.y === 'number' ? data.y : 0,
    z: typeof data.z === 'number' ? data.z : 0
  };
}
