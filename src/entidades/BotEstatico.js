/**
 * Clase BotEstatico
 * Bot de entrenamiento que permanece inmóvil para práctica de puntería básica
 * Extiende BotBase con tipo 'estatico' y color rojo
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.1
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { BotBase } from './BotBase.js';
import { CONFIG } from '../config.js';

export class BotEstatico extends BotBase {
  /**
   * Crea un bot estático en la posición especificada
   * Requirement 1.1: Crear bots estáticos en posiciones predefinidas
   * Requirement 5.1: Asignar color distintivo rojo
   * 
   * @param {THREE.Scene} scene - Escena de Three.js
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {number} z - Posición Z inicial
   */
  constructor(scene, x = 0, y = 1, z = 0) {
    // Obtener configuración de bots estáticos
    const configEstatico = CONFIG.botsEntrenamiento.estatico;
    
    // Llamar al constructor padre con tipo 'estatico' y color rojo
    // Property 8: Colores distintivos por tipo (rojo para estático)
    super(scene, {
      tipo: 'estatico',
      color: configEstatico.color,      // 0xff0000 - Rojo
      vida: configEstatico.vida,         // 100
      tiempoRespawn: configEstatico.tiempoRespawn  // 3000ms
    }, x, y, z);
  }

  /**
   * Actualiza el estado del bot estático
   * Solo verifica si debe reaparecer (sin movimiento)
   * 
   * Requirement 1.3: Reaparecer después de tiempo configurable
   * 
   * @param {number} deltaTime - Tiempo desde la última actualización en ms
   */
  actualizar(deltaTime) {
    // El bot estático solo necesita verificar respawn
    // No tiene movimiento ni comportamiento adicional
    // Llamar al método padre que maneja la lógica de respawn
    super.actualizar(deltaTime);
  }
}
