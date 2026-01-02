/**
 * Integration Tests for Server Room System
 * Feature: mejora-sistema-servidores
 * 
 * These tests verify the complete flows for:
 * - Matchmaking (Requirements 1.1, 1.2, 1.3, 1.4)
 * - Private rooms (Requirements 2.1, 2.2, 2.3, 2.4)
 * - Player limits (Requirements 4.1, 4.2, 4.3)
 */

import { RoomManager } from '../roomManager.js';
import { GameRoom } from '../gameRoom.js';
import { encontrarMejorSala, calcularPuntuacionSala } from '../matchmaking.js';

describe('Integration Tests: Matchmaking Flow', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  /**
   * Test 8.1: Probar flujo completo de matchmaking
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  describe('8.1 Complete Matchmaking Flow', () => {
    
    test('First player creates a new public room when none exist (Req 1.2)', () => {
      // Player 1 requests matchmaking with no existing rooms
      const sala = encontrarMejorSala(roomManager);
      const added = sala.agregarJugador('player1', 'Jugador1');
      
      expect(added).toBe(true);
      expect(sala.tipo).toBe('publica');
      expect(sala.getPlayerCount()).toBe(1);
      expect(roomManager.getTotalSalas()).toBe(1);
    });

    test('Second player joins existing room instead of creating new (Req 1.1, 1.4)', () => {
      // Player 1 creates room via matchmaking
      const sala1 = encontrarMejorSala(roomManager);
      sala1.agregarJugador('player1', 'Jugador1');
      
      // Player 2 requests matchmaking - should join existing room
      const sala2 = encontrarMejorSala(roomManager);
      const added = sala2.agregarJugador('player2', 'Jugador2');
      
      expect(added).toBe(true);
      expect(sala2.id).toBe(sala1.id); // Same room
      expect(sala2.getPlayerCount()).toBe(2);
      expect(roomManager.getTotalSalas()).toBe(1); // Still only 1 room
    });

    test('Matchmaking response contains required fields (Req 1.3)', () => {
      const sala = encontrarMejorSala(roomManager);
      sala.agregarJugador('player1', 'Jugador1');
      
      const estado = sala.obtenerEstado();
      
      // Verify all required fields are present
      expect(estado).toHaveProperty('id');
      expect(estado).toHaveProperty('codigo');
      expect(estado.codigo).toMatch(/^[A-Z0-9]{6}$/); // 6 alphanumeric chars
      expect(estado).toHaveProperty('jugadores');
      expect(estado).toHaveProperty('maxJugadores');
      expect(estado.maxJugadores).toBe(8);
    });

    test('Room with one player remains available for matchmaking (Req 1.4)', () => {
      // Create room with 1 player
      const sala = roomManager.crearSala({ tipo: 'publica' });
      sala.agregarJugador('player1', 'Jugador1');
      
      // Verify room appears in available rooms
      const salasDisponibles = roomManager.obtenerSalasPublicasDisponibles();
      expect(salasDisponibles.length).toBe(1);
      expect(salasDisponibles[0].id).toBe(sala.id);
      
      // Verify matchmaking selects this room
      const mejorSala = encontrarMejorSala(roomManager);
      expect(mejorSala.id).toBe(sala.id);
    });

    test('Multiple players join sequentially via matchmaking', () => {
      // Simulate 5 players joining via matchmaking
      let currentRoom = null;
      
      for (let i = 1; i <= 5; i++) {
        const sala = encontrarMejorSala(roomManager);
        const added = sala.agregarJugador(`player${i}`, `Jugador${i}`);
        
        expect(added).toBe(true);
        
        if (currentRoom === null) {
          currentRoom = sala;
        } else {
          // All players should be in the same room
          expect(sala.id).toBe(currentRoom.id);
        }
      }
      
      expect(currentRoom.getPlayerCount()).toBe(5);
      expect(roomManager.getTotalSalas()).toBe(1);
    });

    test('Matchmaking prefers room with more players', () => {
      // Create room A with 2 players
      const salaA = roomManager.crearSala({ tipo: 'publica' });
      salaA.agregarJugador('playerA1', 'JugadorA1');
      salaA.agregarJugador('playerA2', 'JugadorA2');
      
      // Create room B with 1 player
      const salaB = roomManager.crearSala({ tipo: 'publica' });
      salaB.agregarJugador('playerB1', 'JugadorB1');
      
      // Create room C with 4 players
      const salaC = roomManager.crearSala({ tipo: 'publica' });
      salaC.agregarJugador('playerC1', 'JugadorC1');
      salaC.agregarJugador('playerC2', 'JugadorC2');
      salaC.agregarJugador('playerC3', 'JugadorC3');
      salaC.agregarJugador('playerC4', 'JugadorC4');
      
      // New player should join room C (most players)
      const mejorSala = encontrarMejorSala(roomManager);
      expect(mejorSala.id).toBe(salaC.id);
      expect(mejorSala.getPlayerCount()).toBe(4);
    });
  });
});

describe('Integration Tests: Private Room Flow', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  /**
   * Test 8.2: Probar flujo de partida privada
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  describe('8.2 Complete Private Room Flow', () => {
    
    test('Create private room returns visible code (Req 2.1, 2.2)', () => {
      const sala = roomManager.crearSala({
        tipo: 'privada',
        password: 'secreto123'
      });
      sala.agregarJugador('creator', 'Creador');
      
      // Verify room code is generated and visible
      expect(sala.codigo).toBeDefined();
      expect(sala.codigo).toMatch(/^[A-Z0-9]{6}$/);
      expect(sala.tipo).toBe('privada');
      
      // Verify state includes code
      const estado = sala.obtenerEstado();
      expect(estado.codigo).toBe(sala.codigo);
    });

    test('Join private room with correct code and password (Req 2.3)', () => {
      // Creator creates private room
      const sala = roomManager.crearSala({
        tipo: 'privada',
        password: 'secreto123'
      });
      sala.agregarJugador('creator', 'Creador');
      const roomCode = sala.codigo;
      
      // Friend joins with code
      const salaEncontrada = roomManager.obtenerSalaPorCodigo(roomCode);
      expect(salaEncontrada).not.toBeNull();
      expect(salaEncontrada.id).toBe(sala.id);
      
      // Verify password
      expect(salaEncontrada.verificarPassword('secreto123')).toBe(true);
      
      // Join room
      const added = salaEncontrada.agregarJugador('friend', 'Amigo');
      expect(added).toBe(true);
      expect(salaEncontrada.getPlayerCount()).toBe(2);
    });

    test('Reject join with wrong password (Req 2.4)', () => {
      const sala = roomManager.crearSala({
        tipo: 'privada',
        password: 'correcta'
      });
      sala.agregarJugador('creator', 'Creador');
      
      const salaEncontrada = roomManager.obtenerSalaPorCodigo(sala.codigo);
      
      // Wrong password should fail
      expect(salaEncontrada.verificarPassword('incorrecta')).toBe(false);
    });

    test('Reject join with invalid room code', () => {
      const sala = roomManager.crearSala({
        tipo: 'privada',
        password: 'test'
      });
      sala.agregarJugador('creator', 'Creador');
      
      // Try to find room with invalid code
      const salaInvalida = roomManager.obtenerSalaPorCodigo('XXXXXX');
      expect(salaInvalida).toBeNull();
    });

    test('Private rooms do not appear in matchmaking', () => {
      // Create private room
      const salaPrivada = roomManager.crearSala({
        tipo: 'privada',
        password: 'secret'
      });
      salaPrivada.agregarJugador('player1', 'Jugador1');
      
      // Create public room
      const salaPublica = roomManager.crearSala({ tipo: 'publica' });
      salaPublica.agregarJugador('player2', 'Jugador2');
      
      // Matchmaking should only return public room
      const salasDisponibles = roomManager.obtenerSalasPublicasDisponibles();
      expect(salasDisponibles.length).toBe(1);
      expect(salasDisponibles[0].tipo).toBe('publica');
      
      // Matchmaking should select public room
      const mejorSala = encontrarMejorSala(roomManager);
      expect(mejorSala.id).toBe(salaPublica.id);
    });

    test('Complete flow: create, share code, join', () => {
      // Step 1: Creator creates private room
      const sala = roomManager.crearSala({
        tipo: 'privada',
        password: 'amigos2024'
      });
      sala.agregarJugador('creator', 'Creador');
      
      // Step 2: Creator gets room code to share
      const codigoParaCompartir = sala.codigo;
      expect(codigoParaCompartir).toMatch(/^[A-Z0-9]{6}$/);
      
      // Step 3: Friend uses code to find room
      const salaEncontrada = roomManager.obtenerSalaPorCodigo(codigoParaCompartir);
      expect(salaEncontrada).not.toBeNull();
      
      // Step 4: Friend verifies password
      expect(salaEncontrada.verificarPassword('amigos2024')).toBe(true);
      
      // Step 5: Friend joins
      const joined = salaEncontrada.agregarJugador('friend1', 'Amigo1');
      expect(joined).toBe(true);
      
      // Step 6: Another friend joins
      const joined2 = salaEncontrada.agregarJugador('friend2', 'Amigo2');
      expect(joined2).toBe(true);
      
      // Verify final state
      expect(salaEncontrada.getPlayerCount()).toBe(3);
      const estado = salaEncontrada.obtenerEstado();
      expect(estado.jugadores.length).toBe(3);
    });
  });
});

describe('Integration Tests: Player Limit', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  /**
   * Test 8.3: Probar límite de jugadores
   * Requirements: 4.1, 4.2, 4.3
   */
  describe('8.3 Player Limit Enforcement', () => {
    
    test('Room accepts up to 8 players (Req 4.1)', () => {
      const sala = roomManager.crearSala({ tipo: 'publica', maxJugadores: 8 });
      
      // Add 8 players
      for (let i = 1; i <= 8; i++) {
        const added = sala.agregarJugador(`player${i}`, `Jugador${i}`);
        expect(added).toBe(true);
      }
      
      expect(sala.getPlayerCount()).toBe(8);
      expect(sala.tieneEspacio()).toBe(false);
    });

    test('Room rejects 9th player with error (Req 4.1)', () => {
      const sala = roomManager.crearSala({ tipo: 'publica', maxJugadores: 8 });
      
      // Fill room with 8 players
      for (let i = 1; i <= 8; i++) {
        sala.agregarJugador(`player${i}`, `Jugador${i}`);
      }
      
      // 9th player should be rejected
      const added = sala.agregarJugador('player9', 'Jugador9');
      expect(added).toBe(false);
      expect(sala.getPlayerCount()).toBe(8);
    });

    test('Full room excluded from matchmaking (Req 4.2)', () => {
      // Create and fill a room
      const salaLlena = roomManager.crearSala({ tipo: 'publica', maxJugadores: 8 });
      for (let i = 1; i <= 8; i++) {
        salaLlena.agregarJugador(`player${i}`, `Jugador${i}`);
      }
      
      // Create room with space
      const salaConEspacio = roomManager.crearSala({ tipo: 'publica' });
      salaConEspacio.agregarJugador('playerX', 'JugadorX');
      
      // Matchmaking should only return room with space
      const salasDisponibles = roomManager.obtenerSalasPublicasDisponibles();
      expect(salasDisponibles.length).toBe(1);
      expect(salasDisponibles[0].id).toBe(salaConEspacio.id);
      
      // Matchmaking should select room with space
      const mejorSala = encontrarMejorSala(roomManager);
      expect(mejorSala.id).toBe(salaConEspacio.id);
    });

    test('Private room also enforces 8 player limit (Req 4.3)', () => {
      const sala = roomManager.crearSala({
        tipo: 'privada',
        password: 'test',
        maxJugadores: 8
      });
      
      // Fill room
      for (let i = 1; i <= 8; i++) {
        sala.agregarJugador(`player${i}`, `Jugador${i}`);
      }
      
      // 9th player should be rejected
      const added = sala.agregarJugador('player9', 'Jugador9');
      expect(added).toBe(false);
      expect(sala.tieneEspacio()).toBe(false);
    });

    test('When all rooms are full, matchmaking creates new room', () => {
      // Create and fill first room
      const sala1 = roomManager.crearSala({ tipo: 'publica', maxJugadores: 8 });
      for (let i = 1; i <= 8; i++) {
        sala1.agregarJugador(`p1_${i}`, `J1_${i}`);
      }
      
      // Create and fill second room
      const sala2 = roomManager.crearSala({ tipo: 'publica', maxJugadores: 8 });
      for (let i = 1; i <= 8; i++) {
        sala2.agregarJugador(`p2_${i}`, `J2_${i}`);
      }
      
      // No available rooms
      expect(roomManager.obtenerSalasPublicasDisponibles().length).toBe(0);
      
      // Matchmaking should create new room
      const nuevaSala = encontrarMejorSala(roomManager);
      expect(nuevaSala.id).not.toBe(sala1.id);
      expect(nuevaSala.id).not.toBe(sala2.id);
      expect(nuevaSala.getPlayerCount()).toBe(0);
      expect(roomManager.getTotalSalas()).toBe(3);
    });

    test('Player can join after another leaves full room', () => {
      const sala = roomManager.crearSala({ tipo: 'publica', maxJugadores: 8 });
      
      // Fill room
      for (let i = 1; i <= 8; i++) {
        sala.agregarJugador(`player${i}`, `Jugador${i}`);
      }
      expect(sala.tieneEspacio()).toBe(false);
      
      // One player leaves
      sala.removerJugador('player5');
      expect(sala.tieneEspacio()).toBe(true);
      expect(sala.getPlayerCount()).toBe(7);
      
      // New player can join
      const added = sala.agregarJugador('newPlayer', 'NuevoJugador');
      expect(added).toBe(true);
      expect(sala.getPlayerCount()).toBe(8);
    });
  });
});

describe('Integration Tests: Room State and Notifications', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('Player notifications and state sync', () => {
    
    test('Room state includes player count and max (Req 4.4)', () => {
      const sala = roomManager.crearSala({ tipo: 'publica', maxJugadores: 8 });
      sala.agregarJugador('player1', 'Jugador1');
      sala.agregarJugador('player2', 'Jugador2');
      
      const estado = sala.obtenerEstado();
      
      expect(estado.jugadores.length).toBe(2);
      expect(estado.maxJugadores).toBe(8);
    });

    test('Each room has independent GameManager (Req 3.1)', () => {
      const sala1 = roomManager.crearSala({ tipo: 'publica' });
      const sala2 = roomManager.crearSala({ tipo: 'publica' });
      
      // GameManagers should be different instances
      expect(sala1.gameManager).not.toBe(sala2.gameManager);
      
      // Adding player to one room shouldn't affect the other
      sala1.agregarJugador('player1', 'Jugador1');
      
      expect(sala1.getPlayerCount()).toBe(1);
      expect(sala2.getPlayerCount()).toBe(0);
    });

    test('Player list is returned when joining room (Req 5.3)', () => {
      const sala = roomManager.crearSala({ tipo: 'publica' });
      sala.agregarJugador('player1', 'Jugador1');
      sala.agregarJugador('player2', 'Jugador2');
      
      // Get current players before new player joins
      const jugadoresActuales = [];
      for (const [id, jugador] of sala.jugadores) {
        jugadoresActuales.push({
          id: jugador.id,
          nombre: jugador.nombre
        });
      }
      
      expect(jugadoresActuales.length).toBe(2);
      expect(jugadoresActuales[0].nombre).toBe('Jugador1');
      expect(jugadoresActuales[1].nombre).toBe('Jugador2');
    });

    test('Room code is unique across rooms', () => {
      const codigos = new Set();
      
      // Create 20 rooms and verify all codes are unique
      for (let i = 0; i < 20; i++) {
        const sala = roomManager.crearSala({ tipo: 'publica' });
        expect(codigos.has(sala.codigo)).toBe(false);
        codigos.add(sala.codigo);
      }
      
      expect(codigos.size).toBe(20);
    });
  });
});

describe('Integration Tests: Error Handling', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('Error scenarios', () => {
    
    test('Cannot add same player twice to room', () => {
      const sala = roomManager.crearSala({ tipo: 'publica' });
      
      const added1 = sala.agregarJugador('player1', 'Jugador1');
      const added2 = sala.agregarJugador('player1', 'Jugador1');
      
      expect(added1).toBe(true);
      expect(added2).toBe(false);
      expect(sala.getPlayerCount()).toBe(1);
    });

    test('Cannot remove non-existent player', () => {
      const sala = roomManager.crearSala({ tipo: 'publica' });
      sala.agregarJugador('player1', 'Jugador1');
      
      const removed = sala.removerJugador('nonexistent');
      expect(removed).toBe(false);
      expect(sala.getPlayerCount()).toBe(1);
    });

    test('Cannot delete non-existent room', () => {
      const deleted = roomManager.eliminarSala('nonexistent_room_id');
      expect(deleted).toBe(false);
    });

    test('Public room accepts empty password', () => {
      const sala = roomManager.crearSala({ tipo: 'publica' });
      
      // Public rooms should accept any password (including empty)
      expect(sala.verificarPassword('')).toBe(true);
      expect(sala.verificarPassword('anything')).toBe(true);
    });
  });
});
