/**
 * Clase BotMovil
 * Bot de entrenamiento que se mueve lateralmente para práctica de tracking
 * Extiende BotBase con tipo 'movil' y color azul
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.4
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { BotBase } from './BotBase.js';
import { CONFIG } from '../config.js';

export class BotMovil extends BotBase {
  /**
   * Crea un bot móvil en la posición especificada
   * Requirement 2.1: Crear bots móviles laterales en zonas designadas
   * Requirement 5.1: Configurar dirección inicial de movimiento
   * Requirement 5.2: Desplazar bot horizontalmente a velocidad constante
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
    super(scene, {
      tipo: 'movil',
      color: configMovil.color,           // 0x0088ff - Azul
      vida: configMovil.vida,             // 100
      tiempoRespawn: configMovil.tiempoRespawn  // 3000ms
    }, x, y, z);

    // Configuración de movimiento lateral
    this.rangoMovimiento = configMovil.rangoMovimiento || 8;
    this.velocidad = configMovil.velocidad || 2;
    
    // Dirección actual: 1 = derecha, -1 = izquierda
    this.direccion = 1;
    
    // Guardar posición X inicial para calcular límites
    this.posicionXInicial = x;
  }

  /**
   * Invierte la dirección del movimiento
   */
  invertirDireccion() {
    this.direccion *= -1;
    this.actualizarRotacionModelo();
  }

  /**
   * Actualiza la rotación del modelo según la dirección de movimiento
   */
  actualizarRotacionModelo() {
    if (this.modelo) {
      const rotacionBase = Math.PI;
      const rotacionDireccion = this.direccion === 1 ? -Math.PI / 2 : Math.PI / 2;
      this.modelo.rotation.y = rotacionBase + rotacionDireccion;
    }
  }

  /**
   * Actualiza el estado del bot móvil
   * Implementa movimiento lateral y verifica respawn
   * 
   * @param {number} deltaTime - Tiempo desde la última actualización en ms
   */
  actualizar(deltaTime) {
    // Si el bot está muerto, solo verificar respawn
    if (!this.datos.estaVivo) {
      super.actualizar(deltaTime);
      return;
    }

    // Calcular desplazamiento
    const deltaSegundos = deltaTime / 1000;
    const desplazamiento = this.velocidad * deltaSegundos * this.direccion;

    // Calcular nueva posición X
    const nuevaPosicionX = this.mesh.position.x + desplazamiento;

    // Calcular límites del rango de movimiento
    const limiteIzquierdo = this.posicionXInicial - this.rangoMovimiento;
    const limiteDerecho = this.posicionXInicial + this.rangoMovimiento;

    // Verificar si alcanzó el límite del rango
    if (nuevaPosicionX >= limiteDerecho) {
      this.mesh.position.x = limiteDerecho;
      this.invertirDireccion();
    } else if (nuevaPosicionX <= limiteIzquierdo) {
      this.mesh.position.x = limiteIzquierdo;
      this.invertirDireccion();
    } else {
      this.mesh.position.x = nuevaPosicionX;
    }

    super.actualizar(deltaTime);
  }

  /**
   * Reaparece el bot en su posición inicial
   */
  reaparecer() {
    super.reaparecer();
    this.direccion = 1;
  }
}
