/**
 * GameRoom Class
 * Represents a single game room/lobby
 * 
 * Requirements: 10.1, 10.4, 10.5
 */

import { GameManager } from '../gameManager.js';

/**
 * Generate a unique room ID
 * @returns {string}
 */
function generateRoomId() {
  return `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a 6-character alphanumeric room code
 * @returns {string}
 */
function generateRoomCode() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}

/**
 * GameRoom class - Represents a game room/lobby
 * Requirement 10.1: Create room with unique ID
 * Requirement 10.4: Validate code and password before access
 * Requirement 10.5: Maintain max 8 players per room
 */
export class GameRoom {
  /**
   * Create a new game room
   * @param {Object} opciones - Room options
   * @param {string} [opciones.id] - Custom room ID (auto-generated if not provided)
   * @param {string} [opciones.codigo] - Custom room code (auto-generated if not provided)
   * @param {'publica'|'privada'} [opciones.tipo='publica'] - Room type
   * @param {string} [opciones.password=''] - Room password (for private rooms)
   * @param {number} [opciones.maxJugadores=8] - Maximum players allowed
   */
  constructor(opciones = {}) {
    /** @type {string} - Unique room ID */
    this.id = opciones.id || generateRoomId();
    
    /** @type {string} - 6-character room code */
    this.codigo = opciones.codigo || generateRoomCode();
    
    /** @type {'publica'|'privada'} - Room type */
    this.tipo = opciones.tipo || 'publica';
    
    /** @type {string} - Room password (stored as plain text for simplicity) */
    this.password = opciones.password || '';
    
    /** @type {number} - Maximum players allowed (Requirement 10.5) */
    this.maxJugadores = opciones.maxJugadores || 8;
    
    /** @type {Map<string, {id: string, nombre: string, listo: boolean}>} - Players in room */
    this.jugadores = new Map();
    
    /** @type {Map<string, number>} - Kills por jugador en esta sala */
    this.killsPorJugador = new Map();
    
    /** @type {GameManager} - Game manager instance for this room */
    this.gameManager = new GameManager();
    
    /** @type {Date} - Room creation timestamp */
    this.creadaEn = new Date();
    
    /** @type {Date} - Last activity timestamp */
    this.ultimaActividad = new Date();
    
    /** @type {'esperando'|'jugando'} - Room state */
    this.estado = 'esperando';
  }

  /**
   * Add a player to the room
   * Requirement 10.5: Maintain max 8 players per room
   * @param {string} playerId - Player ID
   * @param {string} nombre - Player name
   * @param {string} weaponType - Weapon type selected by player
   * @returns {boolean} - True if player was added successfully
   */
  agregarJugador(playerId, nombre, weaponType = null) {
    // Check if room has space (Requirement 10.5)
    if (!this.tieneEspacio()) {
      return false;
    }
    
    // Check if player is already in room
    if (this.jugadores.has(playerId)) {
      return false;
    }
    
    // Add player to room
    this.jugadores.set(playerId, {
      id: playerId,
      nombre: nombre,
      listo: false
    });
    
    // Inicializar kills a 0 para el nuevo jugador (Requirement 2.3)
    this.killsPorJugador.set(playerId, 0);
    
    // Add player to game manager with selected weapon
    this.gameManager.addPlayer(playerId, weaponType);
    
    // Update last activity
    this.ultimaActividad = new Date();
    
    return true;
  }

  /**
   * Remove a player from the room
   * @param {string} playerId - Player ID
   * @returns {boolean} - True if player was removed
   */
  removerJugador(playerId) {
    if (!this.jugadores.has(playerId)) {
      return false;
    }
    
    // Remove from room
    this.jugadores.delete(playerId);
    
    // Remover kills del jugador
    this.killsPorJugador.delete(playerId);
    
    // Remove from game manager
    this.gameManager.removePlayer(playerId);
    
    // Update last activity
    this.ultimaActividad = new Date();
    
    return true;
  }

  /**
   * Check if room has space for more players
   * Requirement 10.5: Maintain max 8 players per room
   * @returns {boolean} - True if room has space
   */
  tieneEspacio() {
    return this.jugadores.size < this.maxJugadores;
  }

  /**
   * Verify room password
   * Requirement 10.4: Validate password before access
   * @param {string} password - Password to verify
   * @returns {boolean} - True if password matches
   */
  verificarPassword(password) {
    // Public rooms don't require password
    if (this.tipo === 'publica') {
      return true;
    }
    
    // For private rooms, check password
    return this.password === password;
  }

  /**
   * Get room state for broadcasting
   * Requirements: 5.1, 5.2 - Incluir scoreboard en estado para sincronización
   * @returns {Object} - Room state object
   */
  obtenerEstado() {
    const jugadoresArray = [];
    for (const [id, jugador] of this.jugadores) {
      jugadoresArray.push({
        id: jugador.id,
        nombre: jugador.nombre,
        listo: jugador.listo
      });
    }
    
    return {
      id: this.id,
      codigo: this.codigo,
      tipo: this.tipo,
      jugadores: jugadoresArray,
      maxJugadores: this.maxJugadores,
      estado: this.estado,
      creadaEn: this.creadaEn.toISOString(),
      scoreboard: this.obtenerScoreboard()
    };
  }

  /**
   * Check if room is empty
   * @returns {boolean} - True if room has no players
   */
  estaVacia() {
    return this.jugadores.size === 0;
  }

  /**
   * Get time since room became inactive (empty)
   * @returns {number} - Time in milliseconds since last activity
   */
  tiempoInactiva() {
    return Date.now() - this.ultimaActividad.getTime();
  }

  /**
   * Get current player count
   * @returns {number} - Number of players in room
   */
  getPlayerCount() {
    return this.jugadores.size;
  }

  /**
   * Set player ready status
   * @param {string} playerId - Player ID
   * @param {boolean} listo - Ready status
   * @returns {boolean} - True if status was updated
   */
  setPlayerReady(playerId, listo) {
    const jugador = this.jugadores.get(playerId);
    if (!jugador) {
      return false;
    }
    
    jugador.listo = listo;
    this.ultimaActividad = new Date();
    return true;
  }

  /**
   * Check if all players are ready
   * @returns {boolean} - True if all players are ready
   */
  todosListos() {
    if (this.jugadores.size === 0) {
      return false;
    }
    
    for (const [id, jugador] of this.jugadores) {
      if (!jugador.listo) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Start the game
   * @returns {boolean} - True if game started successfully
   */
  iniciarJuego() {
    if (this.estado === 'jugando') {
      return false;
    }
    
    this.estado = 'jugando';
    this.ultimaActividad = new Date();
    return true;
  }

  /**
   * End the game and return to waiting state
   */
  terminarJuego() {
    this.estado = 'esperando';
    this.ultimaActividad = new Date();
    
    // Reset player ready status
    for (const [id, jugador] of this.jugadores) {
      jugador.listo = false;
    }
  }

  /**
   * Registra una kill para un jugador
   * Requirement 2.2: Incrementar contador de kills del jugador que realizó la eliminación
   * @param {string} killerId - ID del jugador que realizó la kill
   */
  registrarKill(killerId) {
    if (!this.jugadores.has(killerId)) {
      console.warn(`[GameRoom] Intento de registrar kill para jugador no existente: ${killerId}`);
      return;
    }
    const killsActuales = this.killsPorJugador.get(killerId) || 0;
    this.killsPorJugador.set(killerId, killsActuales + 1);
    this.ultimaActividad = new Date();
  }

  /**
   * Obtiene el estado del scoreboard ordenado
   * Requirement 2.4: Mantener contadores persistentes durante la sesión
   * Requirement 6.1: Ordenar de mayor a menor kills
   * Requirement 6.2: Orden alfabético como criterio secundario
   * @returns {Array<{id: string, nombre: string, kills: number}>}
   */
  obtenerScoreboard() {
    const scoreboard = [];
    for (const [id, jugador] of this.jugadores) {
      scoreboard.push({
        id: jugador.id,
        nombre: jugador.nombre,
        kills: this.killsPorJugador.get(id) || 0
      });
    }
    // Ordenar por kills desc, luego por nombre asc
    return scoreboard.sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills;
      return a.nombre.localeCompare(b.nombre);
    });
  }
}

/**
 * Create a new game room
 * @param {Object} opciones - Room options
 * @returns {GameRoom} - New game room instance
 */
export function createGameRoom(opciones = {}) {
  return new GameRoom(opciones);
}
