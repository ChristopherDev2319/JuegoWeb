/**
 * Clase BotMovil
 * Bot de entrenamiento que se mueve lateralmente para práctica de tracking
 * Extiende BotBase con tipo 'movil' y color azul
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 5.2
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { BotBase } from './BotBase.js';
import { CONFIG } from '../config.js';

export class BotMovil extends BotBase {
  /**
   * Crea un bot móvil en la posición especificada
   * Requirement 2.1: Crear bots móviles laterales en zonas designadas
   * Requirement 5.2: Asignar color distintivo azul
   * 
   * @param {THREE.Scene} scene - Escena de Three.js
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {number} z - Posición Z inicial
   */
  constructor(scene, x = 0, y = 1, z = 0) {
    // Obtener configuración de bots móviles
    const configMovil = CONFIG.botsEntrenamiento.movil;
    
    // Llamar al constructor padre con tipo 'movil' y color azul
    // Property 8: Colores distintivos por tipo (azul para móvil)
    super(scene, {
      tipo: 'movil',
      color: configMovil.color,           // 0x0088ff - Azul
      vida: configMovil.vida,             // 100
      tiempoRespawn: configMovil.tiempoRespawn  // 3000ms
    }, x, y, z);

    // Configuración de movimiento lateral
    // Requirement 2.2: Mover en patrón de ida y vuelta horizontal
    this.rangoMovimiento = configMovil.rangoMovimiento || 8;
    this.velocidad = configMovil.velocidad || 2;
    
    // Dirección actual: 1 = derecha, -1 = izquierda
    this.direccion = 1;
    
    // Guardar posición X inicial para calcular límites
    // Property 4: Movimiento lateral dentro de rango [X - R, X + R]
    this.posicionXInicial = x;
  }

  /**
   * Invierte la dirección del movimiento
   * Requirement 2.3: Invertir dirección al alcanzar límite de rango
   */
  invertirDireccion() {
    this.direccion *= -1;
  }

  /**
   * Actualiza el estado del bot móvil
   * Implementa movimiento lateral y verifica respawn
   * 
   * Requirement 2.2: Mover en patrón de ida y vuelta horizontal
   * Requirement 2.3: Invertir dirección al alcanzar límite
   * Requirement 2.4: Detener movimiento al morir, reaparecer en posición inicial
   * 
   * @param {number} deltaTime - Tiempo desde la última actualización en ms
   */
  actualizar(deltaTime) {
    // Si el bot está muerto, solo verificar respawn (sin movimiento)
    // Requirement 2.4: Detener movimiento al morir
    if (!this.datos.estaVivo) {
      super.actualizar(deltaTime);
      return;
    }

    // Calcular desplazamiento basado en velocidad y deltaTime
    // deltaTime viene en ms, convertir a segundos para el cálculo
    const deltaSegundos = deltaTime / 1000;
    const desplazamiento = this.velocidad * deltaSegundos * this.direccion;

    // Calcular nueva posición X
    const nuevaPosicionX = this.mesh.position.x + desplazamiento;

    // Calcular límites del rango de movimiento
    // Property 4: Posición X debe estar en [posicionXInicial - rango, posicionXInicial + rango]
    const limiteIzquierdo = this.posicionXInicial - this.rangoMovimiento;
    const limiteDerecho = this.posicionXInicial + this.rangoMovimiento;

    // Verificar si alcanzó el límite del rango
    // Requirement 2.3: Invertir dirección al alcanzar límite
    if (nuevaPosicionX >= limiteDerecho) {
      this.mesh.position.x = limiteDerecho;
      this.invertirDireccion();
    } else if (nuevaPosicionX <= limiteIzquierdo) {
      this.mesh.position.x = limiteIzquierdo;
      this.invertirDireccion();
    } else {
      // Movimiento normal dentro del rango
      this.mesh.position.x = nuevaPosicionX;
    }

    // Llamar al método padre para verificar respawn si es necesario
    super.actualizar(deltaTime);
  }

  /**
   * Reaparece el bot en su posición inicial
   * Sobrescribe el método padre para también resetear la dirección
   * 
   * Requirement 2.4: Reaparecer en posición inicial
   */
  reaparecer() {
    // Llamar al método padre para restaurar posición, vida, etc.
    super.reaparecer();
    
    // Resetear dirección a la inicial
    this.direccion = 1;
  }

  /**
   * Obtiene la dirección actual del movimiento
   * @returns {number} 1 para derecha, -1 para izquierda
   */
  obtenerDireccion() {
    return this.direccion;
  }

  /**
   * Obtiene el rango de movimiento configurado
   * @returns {number}
   */
  obtenerRangoMovimiento() {
    return this.rangoMovimiento;
  }

  /**
   * Obtiene la velocidad de movimiento
   * @returns {number}
   */
  obtenerVelocidad() {
    return this.velocidad;
  }
}
