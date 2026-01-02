/**
 * Tests for matchmaking system
 * Feature: mejora-sistema-servidores
 * 
 * Requirements: 1.1, 1.4
 */

import { RoomManager } from '../roomManager.js';
import { encontrarMejorSala, calcularPuntuacionSala } from '../matchmaking.js';

describe('Matchmaking System', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('obtenerSalasPublicasDisponibles', () => {
    test('should return empty array when no rooms exist', () => {
      const salas = roomManager.obtenerSalasPublicasDisponibles();
      expect(salas).toEqual([]);
    });

    test('should include public rooms with 1 player (Requirement 1.4)', () => {
      // Create a public room and add one player
      const sala = roomManager.crearSala({ tipo: 'publica' });
      sala.agregarJugador('player1', 'Jugador1');
      
      const salasDisponibles = roomManager.obtenerSalasPublicasDisponibles();
      
      expect(salasDisponibles.length).toBe(1);
      expect(salasDisponibles[0].id).toBe(sala.id);
      expect(salasDisponibles[0].getPlayerCount()).toBe(1);
    });

    test('should include public rooms with multiple players', () => {
      const sala = roomManager.crearSala({ tipo: 'publica' });
      sala.agregarJugador('player1', 'Jugador1');
      sala.agregarJugador('player2', 'Jugador2');
      sala.agregarJugador('player3', 'Jugador3');
      
      const salasDisponibles = roomManager.obtenerSalasPublicasDisponibles();
      
      expect(salasDisponibles.length).toBe(1);
      expect(salasDisponibles[0].getPlayerCount()).toBe(3);
    });

    test('should exclude private rooms', () => {
      roomManager.crearSala({ tipo: 'publica' });
      roomManager.crearSala({ tipo: 'privada', password: '123456' });
      
      const salasDisponibles = roomManager.obtenerSalasPublicasDisponibles();
      
      expect(salasDisponibles.length).toBe(1);
      expect(salasDisponibles[0].tipo).toBe('publica');
    });

    test('should exclude full rooms (8 players)', () => {
      const sala = roomManager.crearSala({ tipo: 'publica', maxJugadores: 8 });
      
      // Add 8 players to fill the room
      for (let i = 0; i < 8; i++) {
        sala.agregarJugador(`player${i}`, `Jugador${i}`);
      }
      
      const salasDisponibles = roomManager.obtenerSalasPublicasDisponibles();
      
      expect(salasDisponibles.length).toBe(0);
    });
  });

  describe('tieneEspacio', () => {
    test('should return true for empty room', () => {
      const sala = roomManager.crearSala({ tipo: 'publica' });
      expect(sala.tieneEspacio()).toBe(true);
    });

    test('should return true for room with 1 player', () => {
      const sala = roomManager.crearSala({ tipo: 'publica' });
      sala.agregarJugador('player1', 'Jugador1');
      
      expect(sala.tieneEspacio()).toBe(true);
      expect(sala.getPlayerCount()).toBe(1);
    });

    test('should return true for room with 7 players', () => {
      const sala = roomManager.crearSala({ tipo: 'publica', maxJugadores: 8 });
      
      for (let i = 0; i < 7; i++) {
        sala.agregarJugador(`player${i}`, `Jugador${i}`);
      }
      
      expect(sala.tieneEspacio()).toBe(true);
    });

    test('should return false for full room (8 players)', () => {
      const sala = roomManager.crearSala({ tipo: 'publica', maxJugadores: 8 });
      
      for (let i = 0; i < 8; i++) {
        sala.agregarJugador(`player${i}`, `Jugador${i}`);
      }
      
      expect(sala.tieneEspacio()).toBe(false);
    });
  });

  describe('encontrarMejorSala (Requirement 1.1)', () => {
    test('should create new room when no rooms available', () => {
      const sala = encontrarMejorSala(roomManager);
      
      expect(sala).toBeDefined();
      expect(sala.tipo).toBe('publica');
      expect(roomManager.getTotalSalas()).toBe(1);
    });

    test('should select room with most players', () => {
      // Create rooms with different player counts
      const sala1 = roomManager.crearSala({ tipo: 'publica' });
      sala1.agregarJugador('p1', 'J1');
      
      const sala2 = roomManager.crearSala({ tipo: 'publica' });
      sala2.agregarJugador('p2', 'J2');
      sala2.agregarJugador('p3', 'J3');
      sala2.agregarJugador('p4', 'J4');
      
      const sala3 = roomManager.crearSala({ tipo: 'publica' });
      sala3.agregarJugador('p5', 'J5');
      sala3.agregarJugador('p6', 'J6');
      
      const mejorSala = encontrarMejorSala(roomManager);
      
      // Should select sala2 (3 players)
      expect(mejorSala.id).toBe(sala2.id);
      expect(mejorSala.getPlayerCount()).toBe(3);
    });

    test('should join room with 1 player instead of creating new (Requirement 1.4)', () => {
      const salaExistente = roomManager.crearSala({ tipo: 'publica' });
      salaExistente.agregarJugador('player1', 'Jugador1');
      
      const mejorSala = encontrarMejorSala(roomManager);
      
      // Should return existing room, not create new one
      expect(mejorSala.id).toBe(salaExistente.id);
      expect(roomManager.getTotalSalas()).toBe(1);
    });
  });

  describe('calcularPuntuacionSala', () => {
    test('should return player count as score', () => {
      const sala = roomManager.crearSala({ tipo: 'publica' });
      
      expect(calcularPuntuacionSala(sala)).toBe(0);
      
      sala.agregarJugador('p1', 'J1');
      expect(calcularPuntuacionSala(sala)).toBe(1);
      
      sala.agregarJugador('p2', 'J2');
      expect(calcularPuntuacionSala(sala)).toBe(2);
    });
  });
});
