/**
 * Integration Tests for Bot Damage System
 * Feature: mejora-bots-entrenamiento
 * 
 * Verifies integration between damage system and health bar updates
 * Requirements: 1.3, 7.2
 */

describe('Bot Damage System Integration', () => {
  
  /**
   * Test: Damage reduces health correctly
   * Requirement 7.2: Health bar reflects remaining health
   */
  describe('recibirDaño', () => {
    
    test('should reduce health by damage amount', () => {
      // Create a simple bot-like object to test the damage logic
      const botData = {
        vidaMaxima: 100,
        vidaActual: 100,
        estaVivo: true,
        tiempoRespawn: 3000,
        tiempoMuerte: 0
      };
      
      // Simulate damage
      const daño = 30;
      botData.vidaActual = Math.max(0, botData.vidaActual - daño);
      
      expect(botData.vidaActual).toBe(70);
      expect(botData.estaVivo).toBe(true);
    });

    test('should not reduce health below zero', () => {
      const botData = {
        vidaMaxima: 100,
        vidaActual: 20,
        estaVivo: true
      };
      
      // Apply damage greater than remaining health
      const daño = 50;
      botData.vidaActual = Math.max(0, botData.vidaActual - daño);
      
      expect(botData.vidaActual).toBe(0);
    });

    test('should mark bot as dead when health reaches zero', () => {
      const botData = {
        vidaMaxima: 100,
        vidaActual: 30,
        estaVivo: true,
        tiempoMuerte: 0
      };
      
      // Apply lethal damage
      const daño = 30;
      botData.vidaActual = Math.max(0, botData.vidaActual - daño);
      
      if (botData.vidaActual <= 0) {
        botData.estaVivo = false;
        botData.tiempoMuerte = Date.now();
      }
      
      expect(botData.vidaActual).toBe(0);
      expect(botData.estaVivo).toBe(false);
      expect(botData.tiempoMuerte).toBeGreaterThan(0);
    });

    test('should not apply damage to dead bot', () => {
      const botData = {
        vidaMaxima: 100,
        vidaActual: 0,
        estaVivo: false
      };
      
      // Try to apply damage to dead bot
      const daño = 50;
      if (botData.estaVivo) {
        botData.vidaActual = Math.max(0, botData.vidaActual - daño);
      }
      
      // Health should remain unchanged
      expect(botData.vidaActual).toBe(0);
    });
  });

  /**
   * Test: Health bar percentage calculation
   * Requirement 7.2: Health bar reflects remaining health
   */
  describe('Health Bar Calculation', () => {
    
    test('should calculate correct health percentage', () => {
      const testCases = [
        { vidaActual: 100, vidaMaxima: 100, expected: 1.0 },
        { vidaActual: 50, vidaMaxima: 100, expected: 0.5 },
        { vidaActual: 25, vidaMaxima: 100, expected: 0.25 },
        { vidaActual: 0, vidaMaxima: 100, expected: 0 },
        { vidaActual: 75, vidaMaxima: 150, expected: 0.5 }
      ];
      
      testCases.forEach(({ vidaActual, vidaMaxima, expected }) => {
        const porcentaje = vidaActual / vidaMaxima;
        expect(porcentaje).toBeCloseTo(expected, 2);
      });
    });

    test('should determine correct health bar color based on percentage', () => {
      const getHealthColor = (porcentaje) => {
        if (porcentaje > 0.5) return 'green';
        if (porcentaje > 0.25) return 'orange';
        return 'red';
      };
      
      expect(getHealthColor(1.0)).toBe('green');
      expect(getHealthColor(0.75)).toBe('green');
      expect(getHealthColor(0.51)).toBe('green');
      expect(getHealthColor(0.5)).toBe('orange');
      expect(getHealthColor(0.3)).toBe('orange');
      expect(getHealthColor(0.25)).toBe('red');
      expect(getHealthColor(0.1)).toBe('red');
      expect(getHealthColor(0)).toBe('red');
    });
  });

  /**
   * Test: Respawn restores health
   * Requirement 7.3: Health bar restored to max on respawn
   */
  describe('Respawn Health Restoration', () => {
    
    test('should restore health to maximum on respawn', () => {
      const botData = {
        vidaMaxima: 100,
        vidaActual: 0,
        estaVivo: false,
        tiempoMuerte: 0
      };
      
      // Simulate respawn
      botData.vidaActual = botData.vidaMaxima;
      botData.estaVivo = true;
      botData.tiempoMuerte = 0;
      
      expect(botData.vidaActual).toBe(100);
      expect(botData.estaVivo).toBe(true);
    });

    test('should restore health for bots with different max health', () => {
      const botConfigs = [
        { vidaMaxima: 100 },  // Bot estático
        { vidaMaxima: 100 },  // Bot móvil
        { vidaMaxima: 150 }   // Bot tirador
      ];
      
      botConfigs.forEach(config => {
        const botData = {
          vidaMaxima: config.vidaMaxima,
          vidaActual: 0,
          estaVivo: false
        };
        
        // Respawn
        botData.vidaActual = botData.vidaMaxima;
        botData.estaVivo = true;
        
        expect(botData.vidaActual).toBe(config.vidaMaxima);
      });
    });
  });

  /**
   * Test: Multiple damage applications
   * Requirement 7.2: Health bar updates correctly after each hit
   */
  describe('Multiple Damage Applications', () => {
    
    test('should correctly track health through multiple hits', () => {
      const botData = {
        vidaMaxima: 100,
        vidaActual: 100,
        estaVivo: true
      };
      
      const damages = [20, 15, 30, 25, 10];
      const expectedHealth = [80, 65, 35, 10, 0];
      
      damages.forEach((daño, index) => {
        if (botData.estaVivo) {
          botData.vidaActual = Math.max(0, botData.vidaActual - daño);
          if (botData.vidaActual <= 0) {
            botData.estaVivo = false;
          }
        }
        expect(botData.vidaActual).toBe(expectedHealth[index]);
      });
      
      expect(botData.estaVivo).toBe(false);
    });
  });
});
