/**
 * Matchmaking Module
 * Automatic player matching system for public games
 * 
 * Requirements: 6.1, 6.2, 6.3, 10.2
 */

/**
 * Calculate room score for matchmaking
 * Higher score = better room to join
 * Requirement 6.2: Connect to room with most active players
 * Requirement 10.2: Return public room with most players
 * 
 * @param {import('./gameRoom.js').GameRoom} sala - Room to evaluate
 * @returns {number} - Score (higher = better)
 */
export function calcularPuntuacionSala(sala) {
  // Score is based on number of players (more players = higher score)
  // This ensures we fill rooms before creating new ones
  return sala.getPlayerCount();
}

/**
 * Find the best room for a player via matchmaking
 * Requirement 6.1: Search for public rooms with available space
 * Requirement 6.2: Connect to room with most active players
 * Requirement 6.3: Create new public room if none available
 * Requirement 10.2: Return public room with most players
 * 
 * @param {import('./roomManager.js').RoomManager} roomManager - Room manager instance
 * @returns {import('./gameRoom.js').GameRoom} - Best room or newly created room
 */
export function encontrarMejorSala(roomManager) {
  // Get all available public rooms (Requirement 6.1)
  const salasDisponibles = roomManager.obtenerSalasPublicasDisponibles();
  
  console.log(`[MATCHMAKING] Salas públicas disponibles: ${salasDisponibles.length}`);
  salasDisponibles.forEach(sala => {
    console.log(`  - Sala ${sala.codigo}: ${sala.getPlayerCount()}/${sala.maxJugadores} jugadores`);
  });
  
  // If no rooms available, create a new public room (Requirement 6.3)
  if (salasDisponibles.length === 0) {
    console.log('[MATCHMAKING] No hay salas disponibles, creando nueva sala pública');
    return roomManager.crearSala({ tipo: 'publica' });
  }
  
  // Find room with highest score (most players) (Requirement 6.2, 10.2)
  let mejorSala = salasDisponibles[0];
  let mejorPuntuacion = calcularPuntuacionSala(mejorSala);
  
  for (let i = 1; i < salasDisponibles.length; i++) {
    const sala = salasDisponibles[i];
    const puntuacion = calcularPuntuacionSala(sala);
    
    if (puntuacion > mejorPuntuacion) {
      mejorSala = sala;
      mejorPuntuacion = puntuacion;
    }
  }
  
  console.log(`[MATCHMAKING] Mejor sala encontrada: ${mejorSala.codigo} con ${mejorSala.getPlayerCount()} jugadores`);
  return mejorSala;
}
