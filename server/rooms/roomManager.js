/**
 * RoomManager Class
 * Manages all game rooms (public and private)
 * 
 * Requirements: 10.1, 10.3
 */

import { GameRoom } from './gameRoom.js';

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
 * RoomManager class - Manages all game rooms
 * Requirement 10.1: Create rooms with unique IDs
 * Requirement 10.3: Clean up empty rooms after 60 seconds
 */
export class RoomManager {
  constructor() {
    /** @type {Map<string, GameRoom>} - Map of room ID to GameRoom */
    this.salas = new Map();
    
    /** @type {Map<string, string>} - Map of room code to room ID (for quick lookup) */
    this.codigoASalaId = new Map();
  }

  /**
   * Create a new room with unique ID and code
   * Requirement 10.1: Create room with unique ID
   * @param {Object} opciones - Room options
   * @param {'publica'|'privada'} [opciones.tipo='publica'] - Room type
   * @param {string} [opciones.password=''] - Room password (for private rooms)
   * @param {number} [opciones.maxJugadores=8] - Maximum players allowed
   * @returns {GameRoom} - The created room
   */
  crearSala(opciones = {}) {
    // Generate unique ID
    let id = generateRoomId();
    while (this.salas.has(id)) {
      id = generateRoomId();
    }

    // Generate unique code
    let codigo = generateRoomCode();
    while (this.codigoASalaId.has(codigo)) {
      codigo = generateRoomCode();
    }

    // Create room with generated ID and code
    const sala = new GameRoom({
      id,
      codigo,
      tipo: opciones.tipo || 'publica',
      password: opciones.password || '',
      maxJugadores: opciones.maxJugadores || 8
    });

    // Store room
    this.salas.set(id, sala);
    this.codigoASalaId.set(codigo, id);

    return sala;
  }

  /**
   * Get a room by ID
   * @param {string} salaId - Room ID
   * @returns {GameRoom|null} - The room or null if not found
   */
  obtenerSala(salaId) {
    return this.salas.get(salaId) || null;
  }

  /**
   * Get a room by code (for private rooms)
   * @param {string} codigo - 6-character room code
   * @returns {GameRoom|null} - The room or null if not found
   */
  obtenerSalaPorCodigo(codigo) {
    const salaId = this.codigoASalaId.get(codigo);
    if (!salaId) {
      return null;
    }
    return this.salas.get(salaId) || null;
  }

  /**
   * Delete a room
   * @param {string} salaId - Room ID
   * @returns {boolean} - True if room was deleted
   */
  eliminarSala(salaId) {
    const sala = this.salas.get(salaId);
    if (!sala) {
      return false;
    }

    // Remove from code lookup
    this.codigoASalaId.delete(sala.codigo);
    
    // Remove from rooms map
    this.salas.delete(salaId);

    return true;
  }

  /**
   * Get all public rooms with available space
   * @returns {GameRoom[]} - Array of available public rooms
   */
  obtenerSalasPublicasDisponibles() {
    const salasDisponibles = [];
    
    for (const sala of this.salas.values()) {
      if (sala.tipo === 'publica' && sala.tieneEspacio()) {
        salasDisponibles.push(sala);
      }
    }

    return salasDisponibles;
  }

  /**
   * Clean up empty rooms that have been inactive for more than 60 seconds
   * Requirement 10.3: Delete empty rooms after 60 seconds
   * @returns {number} - Number of rooms cleaned up
   */
  limpiarSalasVacias() {
    const TIEMPO_INACTIVIDAD_MS = 60 * 1000; // 60 seconds
    let salasEliminadas = 0;

    for (const [salaId, sala] of this.salas) {
      if (sala.estaVacia() && sala.tiempoInactiva() > TIEMPO_INACTIVIDAD_MS) {
        this.eliminarSala(salaId);
        salasEliminadas++;
      }
    }

    return salasEliminadas;
  }

  /**
   * Get total number of rooms
   * @returns {number}
   */
  getTotalSalas() {
    return this.salas.size;
  }

  /**
   * Get all rooms (for debugging/admin purposes)
   * @returns {GameRoom[]}
   */
  obtenerTodasLasSalas() {
    return Array.from(this.salas.values());
  }
}

// Export singleton instance for convenience
export const roomManager = new RoomManager();
