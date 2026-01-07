/**
 * Clase BotTirador
 * Bot de entrenamiento que dispara hacia adelante de forma continua
 * Extiende BotBase con tipo 'tirador' y color naranja
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { BotBase } from './BotBase.js';
import { CONFIG } from '../config.js';

export class BotTirador extends BotBase {
  /**
   * Crea un bot tirador en la posición especificada
   * Requirement 4.1: Configurar al bot para disparar en la dirección que está mirando
   * 
   * @param {THREE.Scene} scene - Escena de Three.js
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {number} z - Posición Z inicial
   * @param {Object} [opciones] - Opciones adicionales
   * @param {Function} [opciones.onDisparo] - Callback cuando el bot dispara
   */
  constructor(scene, x = 0, y = 1, z = 0, opciones = {}) {
    // Obtener configuración de bots tiradores
    const configTirador = CONFIG.botsEntrenamiento.tirador;
    
    // Llamar al constructor padre con tipo 'tirador' y color naranja
    super(scene, {
      tipo: 'tirador',
      color: configTirador.color,           // 0xff8800 - Naranja
      vida: configTirador.vida,             // 150
      tiempoRespawn: configTirador.tiempoRespawn  // 5000ms
    }, x, y, z);

    // Configuración de disparo
    // Requirement 4.3: Disparar a intervalos regulares configurables
    this.cadenciaDisparo = configTirador.cadenciaDisparo || 2000; // ms entre disparos
    
    // Daño reducido para entrenamiento
    this.dañoReducido = configTirador.dañoReducido || 10;
    
    // Velocidad del proyectil
    this.velocidadBala = configTirador.velocidadBala || 30;
    
    // Estado de disparo
    this.ultimoDisparo = 0;
    
    // Callbacks
    this.onDisparo = opciones.onDisparo || null;
    
    // Lista de proyectiles activos para actualizar
    this.proyectilesActivos = [];
  }

  /**
   * Obtiene la dirección frontal del bot basada en su rotación Y
   * Requirement 4.1: Disparar en la dirección que está mirando
   * 
   * @returns {THREE.Vector3} - Vector de dirección normalizado
   */
  obtenerDireccionFrontal() {
    // La dirección frontal se calcula a partir de la rotación Y del mesh
    // Considerando el offset de rotación del modelo
    const rotacionY = this.mesh.rotation.y;
    
    // Calcular dirección frontal (hacia donde mira el bot)
    const direccion = new THREE.Vector3(
      Math.sin(rotacionY),
      0,
      Math.cos(rotacionY)
    );
    
    return direccion.normalize();
  }

  /**
   * Ejecuta un disparo hacia adelante (dirección frontal del bot)
   * Requirement 4.1: Disparar en la dirección que está mirando
   * Requirement 4.2: Crear proyectil visual que viaja hacia adelante
   * Requirement 4.4: No disparar si el bot está muerto
   * 
   * @returns {Object|null} - Información del disparo o null si no se disparó
   */
  disparar() {
    // Property 7: Bots muertos no disparan
    if (!this.datos.estaVivo) {
      return null;
    }

    // Registrar tiempo del disparo
    this.ultimoDisparo = performance.now();

    // Calcular posición de origen del disparo
    const posicionBot = this.mesh.position.clone();
    posicionBot.y += 1.5; // Altura de disparo (nivel del pecho del modelo)
    
    // Obtener dirección frontal basada en rotación Y
    // Property 6: Dirección de disparo consistente con rotación
    const direccion = this.obtenerDireccionFrontal();

    // Crear efecto visual del disparo (tracer + proyectil)
    this.crearEfectoDisparo(posicionBot, direccion);
    
    // Crear proyectil visual que viaja
    this.crearProyectilVisual(posicionBot, direccion);

    // Información del disparo
    const infoDisparo = {
      origen: posicionBot.clone(),
      direccion: direccion.clone(),
      daño: this.dañoReducido,
      velocidad: this.velocidadBala
    };

    // Llamar callback si existe
    if (this.onDisparo) {
      this.onDisparo(infoDisparo);
    }

    return infoDisparo;
  }

  /**
   * Crea efecto visual de flash cuando el bot dispara (optimizado)
   * Requirement 4.2: Crear proyectil visual
   * @param {THREE.Vector3} origen - Posición de origen del disparo
   * @param {THREE.Vector3} direccion - Dirección del disparo
   */
  crearEfectoDisparo(origen, direccion) {
    // Flash simplificado - sin animación compleja
    const geometriaFlash = new THREE.SphereGeometry(0.15, 4, 4);
    const materialFlash = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    });
    const flash = new THREE.Mesh(geometriaFlash, materialFlash);
    flash.position.copy(origen);
    this.scene.add(flash);

    // Remover después de 50ms sin animación
    setTimeout(() => {
      this.scene.remove(flash);
      geometriaFlash.dispose();
      materialFlash.dispose();
    }, 50);
  }

  /**
   * Crea un proyectil visual que viaja hacia adelante
   * Requirement 4.2: Crear proyectil visual que viaja hacia adelante
   * @param {THREE.Vector3} origen - Posición de origen del proyectil
   * @param {THREE.Vector3} direccion - Dirección del proyectil
   */
  crearProyectilVisual(origen, direccion) {
    // Crear geometría del proyectil (cilindro alargado como tracer)
    const geometriaProyectil = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
    geometriaProyectil.rotateX(Math.PI / 2); // Orientar hacia adelante
    
    const materialProyectil = new THREE.MeshBasicMaterial({
      color: this.color, // Color naranja del bot tirador
      transparent: true,
      opacity: 0.9
    });
    
    const proyectil = new THREE.Mesh(geometriaProyectil, materialProyectil);
    proyectil.position.copy(origen);
    
    // Orientar el proyectil en la dirección de disparo
    const rotacionY = Math.atan2(direccion.x, direccion.z);
    proyectil.rotation.y = rotacionY;
    
    this.scene.add(proyectil);
    
    // Datos del proyectil para animación
    const datosProyectil = {
      mesh: proyectil,
      direccion: direccion.clone(),
      velocidad: this.velocidadBala,
      distanciaRecorrida: 0,
      distanciaMaxima: 50, // Distancia máxima antes de desaparecer
      geometria: geometriaProyectil,
      material: materialProyectil
    };
    
    this.proyectilesActivos.push(datosProyectil);
  }

  /**
   * Actualiza los proyectiles activos
   * @param {number} deltaTime - Tiempo desde la última actualización en segundos
   */
  actualizarProyectiles(deltaTime) {
    // Iterar en reversa para poder eliminar elementos
    for (let i = this.proyectilesActivos.length - 1; i >= 0; i--) {
      const proyectil = this.proyectilesActivos[i];
      
      // Calcular movimiento
      const movimiento = proyectil.direccion.clone().multiplyScalar(proyectil.velocidad * deltaTime);
      proyectil.mesh.position.add(movimiento);
      proyectil.distanciaRecorrida += movimiento.length();
      
      // Verificar si debe eliminarse
      if (proyectil.distanciaRecorrida >= proyectil.distanciaMaxima) {
        // Eliminar proyectil
        this.scene.remove(proyectil.mesh);
        proyectil.geometria.dispose();
        proyectil.material.dispose();
        this.proyectilesActivos.splice(i, 1);
      }
    }
  }

  /**
   * Actualiza el estado del bot tirador
   * Dispara hacia adelante a intervalos regulares
   * 
   * Requirement 4.1: Disparar en la dirección que está mirando
   * Requirement 4.3: Disparar a intervalos regulares configurables
   * Requirement 4.4: Detener disparos al morir
   * 
   * @param {number} deltaTime - Tiempo desde la última actualización en segundos
   * @param {THREE.Vector3} [jugadorPos] - Posición del jugador (no usado, mantenido por compatibilidad)
   */
  actualizar(deltaTime, jugadorPos = null) {
    // Actualizar proyectiles activos
    this.actualizarProyectiles(deltaTime);
    
    // Si el bot está muerto, solo verificar respawn (sin disparos)
    // Requirement 4.4: Detener disparos al morir
    // Property 7: Bots muertos no disparan
    if (!this.datos.estaVivo) {
      super.actualizar(deltaTime);
      return;
    }

    // Verificar si puede disparar (cadencia)
    const ahora = performance.now();
    const tiempoDesdeUltimoDisparo = ahora - this.ultimoDisparo;
    
    // Requirement 4.3: Disparar a intervalos regulares
    if (tiempoDesdeUltimoDisparo >= this.cadenciaDisparo) {
      this.disparar();
    }

    // Llamar al método padre para verificar respawn si es necesario
    super.actualizar(deltaTime);
  }

  /**
   * Reaparece el bot en su posición inicial
   * Sobrescribe el método padre para también resetear estado de disparo
   * 
   * Requirement 4.4: Reaparecer después del tiempo de respawn
   */
  reaparecer() {
    // Llamar al método padre para restaurar posición, vida, etc.
    super.reaparecer();
    
    // Resetear estado de disparo
    this.ultimoDisparo = 0;
  }

  /**
   * Establece el callback de disparo
   * @param {Function} callback - Función a llamar cuando el bot dispara
   */
  establecerCallbackDisparo(callback) {
    this.onDisparo = callback;
  }

  /**
   * Obtiene el daño reducido configurado
   * @returns {number}
   */
  obtenerDañoReducido() {
    return this.dañoReducido;
  }

  /**
   * Obtiene la cadencia de disparo en ms
   * @returns {number}
   */
  obtenerCadenciaDisparo() {
    return this.cadenciaDisparo;
  }

  /**
   * Obtiene la velocidad de la bala
   * @returns {number}
   */
  obtenerVelocidadBala() {
    return this.velocidadBala;
  }

  /**
   * Destruye el bot y limpia recursos
   * Sobrescribe el método padre para limpiar recursos adicionales
   */
  destruir() {
    // Limpiar proyectiles activos
    for (const proyectil of this.proyectilesActivos) {
      this.scene.remove(proyectil.mesh);
      proyectil.geometria.dispose();
      proyectil.material.dispose();
    }
    this.proyectilesActivos = [];
    
    this.onDisparo = null;
    
    // Llamar al método padre
    super.destruir();
  }
}
