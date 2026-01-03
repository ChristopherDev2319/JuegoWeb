/**
 * Clase BotTirador
 * Bot de entrenamiento que dispara al jugador cuando está en línea de visión
 * Extiende BotBase con tipo 'tirador' y color naranja
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.3
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { BotBase } from './BotBase.js';
import { CONFIG } from '../config.js';

export class BotTirador extends BotBase {
  /**
   * Crea un bot tirador en la posición especificada
   * Requirement 3.1: Crear bots que disparan cuando el jugador está en línea de visión
   * Requirement 5.3: Asignar color distintivo naranja
   * 
   * @param {THREE.Scene} scene - Escena de Three.js
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {number} z - Posición Z inicial
   * @param {Object} [opciones] - Opciones adicionales
   * @param {Function} [opciones.onDisparo] - Callback cuando el bot dispara
   * @param {Array} [opciones.obstaculos] - Lista de meshes para verificar obstrucciones
   */
  constructor(scene, x = 0, y = 1, z = 0, opciones = {}) {
    // Obtener configuración de bots tiradores
    const configTirador = CONFIG.botsEntrenamiento.tirador;
    
    // Llamar al constructor padre con tipo 'tirador' y color naranja
    // Property 8: Colores distintivos por tipo (naranja para tirador)
    super(scene, {
      tipo: 'tirador',
      color: configTirador.color,           // 0xff8800 - Naranja
      vida: configTirador.vida,             // 150
      tiempoRespawn: configTirador.tiempoRespawn  // 5000ms
    }, x, y, z);

    // Configuración de disparo
    // Requirement 3.2: Disparar a intervalos regulares
    this.cadenciaDisparo = configTirador.cadenciaDisparo || 1500; // ms entre disparos
    
    // Requirement 3.4: Daño reducido para entrenamiento
    // Property 6: Daño de bot tirador es reducido
    this.dañoReducido = configTirador.dañoReducido || 10;
    
    // Requirement 3.1, 3.3: Rango de visión para detectar jugador
    this.rangoVision = configTirador.rangoVision || 30;
    
    // Estado de disparo
    this.ultimoDisparo = 0;
    this.jugadorEnVision = false;
    
    // Callbacks y referencias externas
    this.onDisparo = opciones.onDisparo || null;
    this.obstaculos = opciones.obstaculos || [];
    
    // Raycaster para verificar línea de visión
    this.raycaster = new THREE.Raycaster();
  }

  /**
   * Verifica si el jugador está en la línea de visión del bot
   * Requirement 3.1: Detectar cuando el jugador entra en línea de visión
   * Requirement 3.3: Detectar cuando el jugador sale de línea de visión
   * Property 5: Línea de visión determina disparo
   * 
   * @param {THREE.Vector3} jugadorPos - Posición del jugador
   * @returns {boolean} - true si el jugador está en línea de visión
   */
  verificarLineaVision(jugadorPos) {
    if (!jugadorPos || !this.datos.estaVivo) {
      return false;
    }

    // Calcular distancia al jugador
    const posicionBot = this.mesh.position.clone();
    posicionBot.y += 1; // Altura de los "ojos" del bot
    
    const distancia = posicionBot.distanceTo(jugadorPos);
    
    // Si está fuera del rango de visión, no hay línea de visión
    if (distancia > this.rangoVision) {
      return false;
    }

    // Calcular dirección hacia el jugador
    const direccion = new THREE.Vector3()
      .subVectors(jugadorPos, posicionBot)
      .normalize();

    // Configurar raycaster para verificar obstrucciones
    this.raycaster.set(posicionBot, direccion);
    this.raycaster.far = distancia;

    // Verificar si hay obstáculos entre el bot y el jugador
    if (this.obstaculos.length > 0) {
      const intersecciones = this.raycaster.intersectObjects(this.obstaculos, true);
      
      // Si hay intersecciones antes de llegar al jugador, hay obstrucción
      if (intersecciones.length > 0) {
        const primeraInterseccion = intersecciones[0];
        // Si el obstáculo está más cerca que el jugador, hay obstrucción
        if (primeraInterseccion.distance < distancia - 0.5) {
          return false;
        }
      }
    }

    // El jugador está en línea de visión
    return true;
  }

  /**
   * Ejecuta un disparo hacia el jugador
   * Requirement 3.4: Aplicar daño reducido al jugador
   * Property 6: Daño de bot tirador es reducido (igual a dañoReducido configurado)
   * 
   * @param {THREE.Vector3} jugadorPos - Posición del jugador
   * @returns {Object|null} - Información del disparo o null si no se disparó
   */
  disparar(jugadorPos) {
    if (!this.datos.estaVivo || !jugadorPos) {
      return null;
    }

    // Registrar tiempo del disparo
    this.ultimoDisparo = performance.now();

    // Calcular dirección del disparo
    const posicionBot = this.mesh.position.clone();
    posicionBot.y += 1; // Altura de disparo
    
    const direccion = new THREE.Vector3()
      .subVectors(jugadorPos, posicionBot)
      .normalize();

    // Crear efecto visual del disparo
    this.crearEfectoDisparo(posicionBot, direccion);

    // Rotar el bot hacia el jugador
    this.rotarHaciaJugador(jugadorPos);

    // Información del disparo
    const infoDisparo = {
      origen: posicionBot.clone(),
      direccion: direccion.clone(),
      daño: this.dañoReducido,
      distancia: posicionBot.distanceTo(jugadorPos)
    };

    // Llamar callback si existe
    if (this.onDisparo) {
      this.onDisparo(infoDisparo);
    }

    return infoDisparo;
  }

  /**
   * Rota el bot para mirar hacia el jugador
   * @param {THREE.Vector3} jugadorPos - Posición del jugador
   */
  rotarHaciaJugador(jugadorPos) {
    const direccion = new THREE.Vector3()
      .subVectors(jugadorPos, this.mesh.position);
    direccion.y = 0; // Solo rotar en el eje Y
    
    if (direccion.length() > 0) {
      const angulo = Math.atan2(direccion.x, direccion.z);
      this.mesh.rotation.y = angulo;
    }
  }

  /**
   * Crea efecto visual cuando el bot dispara
   * @param {THREE.Vector3} origen - Posición de origen del disparo
   * @param {THREE.Vector3} direccion - Dirección del disparo
   */
  crearEfectoDisparo(origen, direccion) {
    // Crear línea de disparo (tracer)
    const longitudTracer = 20;
    const puntoFinal = origen.clone().add(
      direccion.clone().multiplyScalar(longitudTracer)
    );

    const geometriaLinea = new THREE.BufferGeometry().setFromPoints([
      origen,
      puntoFinal
    ]);
    
    const materialLinea = new THREE.LineBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.8
    });
    
    const linea = new THREE.Line(geometriaLinea, materialLinea);
    this.scene.add(linea);

    // Flash en el punto de disparo
    const geometriaFlash = new THREE.SphereGeometry(0.15, 8, 8);
    const materialFlash = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 1
    });
    const flash = new THREE.Mesh(geometriaFlash, materialFlash);
    flash.position.copy(origen);
    this.scene.add(flash);

    // Animar y eliminar efectos
    let vida = 0;
    const animar = () => {
      vida += 0.016;
      materialLinea.opacity = 0.8 - vida * 4;
      materialFlash.opacity = 1 - vida * 5;

      if (vida > 0.2) {
        this.scene.remove(linea);
        this.scene.remove(flash);
        geometriaLinea.dispose();
        materialLinea.dispose();
        geometriaFlash.dispose();
        materialFlash.dispose();
      } else {
        requestAnimationFrame(animar);
      }
    };
    animar();
  }

  /**
   * Actualiza el estado del bot tirador
   * Implementa lógica de disparo basada en línea de visión
   * 
   * Requirement 3.1: Iniciar disparos cuando jugador entra en línea de visión
   * Requirement 3.2: Continuar disparando a intervalos regulares
   * Requirement 3.3: Detener disparos cuando jugador sale de línea de visión
   * Requirement 3.5: Detener disparos al morir
   * 
   * @param {number} deltaTime - Tiempo desde la última actualización en ms
   * @param {THREE.Vector3} [jugadorPos] - Posición del jugador (opcional)
   */
  actualizar(deltaTime, jugadorPos = null) {
    // Si el bot está muerto, solo verificar respawn (sin disparos)
    // Requirement 3.5: Detener disparos al morir
    if (!this.datos.estaVivo) {
      super.actualizar(deltaTime);
      return;
    }

    // Si no hay posición del jugador, no hacer nada más
    if (!jugadorPos) {
      this.jugadorEnVision = false;
      super.actualizar(deltaTime);
      return;
    }

    // Verificar línea de visión
    // Property 5: Línea de visión determina disparo
    const enVision = this.verificarLineaVision(jugadorPos);
    
    // Actualizar estado de visión
    const estabaEnVision = this.jugadorEnVision;
    this.jugadorEnVision = enVision;

    // Si el jugador está en línea de visión
    if (enVision) {
      // Rotar hacia el jugador
      this.rotarHaciaJugador(jugadorPos);
      
      // Verificar si puede disparar (cadencia)
      const ahora = performance.now();
      const tiempoDesdeUltimoDisparo = ahora - this.ultimoDisparo;
      
      // Requirement 3.2: Disparar a intervalos regulares
      if (tiempoDesdeUltimoDisparo >= this.cadenciaDisparo) {
        this.disparar(jugadorPos);
      }
    }

    // Llamar al método padre para verificar respawn si es necesario
    super.actualizar(deltaTime);
  }

  /**
   * Reaparece el bot en su posición inicial
   * Sobrescribe el método padre para también resetear estado de disparo
   * 
   * Requirement 3.5: Reaparecer después del tiempo de respawn
   */
  reaparecer() {
    // Llamar al método padre para restaurar posición, vida, etc.
    super.reaparecer();
    
    // Resetear estado de disparo
    this.ultimoDisparo = 0;
    this.jugadorEnVision = false;
  }

  /**
   * Establece la lista de obstáculos para verificar línea de visión
   * @param {Array<THREE.Object3D>} obstaculos - Lista de meshes
   */
  establecerObstaculos(obstaculos) {
    this.obstaculos = obstaculos || [];
  }

  /**
   * Establece el callback de disparo
   * @param {Function} callback - Función a llamar cuando el bot dispara
   */
  establecerCallbackDisparo(callback) {
    this.onDisparo = callback;
  }

  /**
   * Verifica si el jugador está actualmente en la línea de visión
   * @returns {boolean}
   */
  jugadorEstaEnVision() {
    return this.jugadorEnVision;
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
   * Obtiene el rango de visión
   * @returns {number}
   */
  obtenerRangoVision() {
    return this.rangoVision;
  }

  /**
   * Destruye el bot y limpia recursos
   * Sobrescribe el método padre para limpiar recursos adicionales
   */
  destruir() {
    // Limpiar raycaster
    this.raycaster = null;
    this.obstaculos = [];
    this.onDisparo = null;
    
    // Llamar al método padre
    super.destruir();
  }
}
