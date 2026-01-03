/**
 * Clase BotBase
 * Clase base abstracta para todos los tipos de bots de entrenamiento
 * Proporciona funcionalidad común: mesh, barra de vida, daño, muerte y respawn
 * 
 * Requirements: 1.2, 1.3, 1.4, 5.4
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';

export class BotBase {
  /**
   * @param {THREE.Scene} scene - Escena de Three.js
   * @param {Object} config - Configuración del bot
   * @param {string} config.tipo - Tipo de bot ('estatico', 'movil', 'tirador')
   * @param {number} config.color - Color hexadecimal del bot
   * @param {number} config.vida - Vida máxima del bot
   * @param {number} config.tiempoRespawn - Tiempo de respawn en ms
   * @param {number} x - Posición X inicial
   * @param {number} y - Posición Y inicial
   * @param {number} z - Posición Z inicial
   */
  constructor(scene, config, x = 0, y = 1, z = 0) {
    this.scene = scene;
    this.tipo = config.tipo || 'base';
    this.color = config.color || 0xffffff;
    
    // Datos del bot
    // Requirement 1.2, 1.4: Sistema de vida y daño
    this.datos = {
      vidaMaxima: config.vida || 100,
      vidaActual: config.vida || 100,
      estaVivo: true,
      tiempoRespawn: config.tiempoRespawn || 3000,
      tiempoMuerte: 0
    };

    // Guardar posición inicial para respawn
    // Requirement 1.3: Reaparecer en posición inicial
    this.posicionInicial = { x: x, y: y, z: z };

    // Crear mesh del bot
    this.crearMesh(x, y, z);

    // Crear barra de vida con indicador de tipo
    // Requirement 5.4: Barra de vida con indicador de tipo
    this.crearBarraVida();
  }


  /**
   * Crea el mesh 3D del bot
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} z - Posición Z
   */
  crearMesh(x, y, z) {
    const geometria = new THREE.BoxGeometry(1.5, 2, 1.5);
    const material = new THREE.MeshStandardMaterial({ color: this.color });
    this.mesh = new THREE.Mesh(geometria, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Guardar referencia al bot en el mesh para detección de impactos
    this.mesh.userData.bot = this;
    this.mesh.userData.tipo = this.tipo;
    
    this.scene.add(this.mesh);
  }

  /**
   * Crea el canvas y sprite para la barra de vida
   * Requirement 5.4: Incluir indicador del tipo de bot
   */
  crearBarraVida() {
    // Crear canvas para la barra de vida
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    this.datosBarraVida = { canvas, ctx };

    // Crear textura y sprite
    this.texturaBarraVida = new THREE.CanvasTexture(canvas);
    const materialBarraVida = new THREE.SpriteMaterial({
      map: this.texturaBarraVida,
      transparent: true
    });
    this.spriteBarraVida = new THREE.Sprite(materialBarraVida);
    this.spriteBarraVida.scale.set(3, 0.8, 1);
    this.spriteBarraVida.position.set(0, 2, 0);
    this.mesh.add(this.spriteBarraVida);

    this.actualizarBarraVida();
  }

  /**
   * Obtiene el nombre legible del tipo de bot
   * @returns {string}
   */
  obtenerNombreTipo() {
    const nombres = {
      'estatico': 'ESTÁTICO',
      'movil': 'MÓVIL',
      'tirador': 'TIRADOR',
      'base': 'BOT'
    };
    return nombres[this.tipo] || 'BOT';
  }

  /**
   * Actualiza el dibujo de la barra de vida
   * Requirement 5.4: Mostrar indicador de tipo de bot
   */
  actualizarBarraVida() {
    const ctx = this.datosBarraVida.ctx;
    const canvas = this.datosBarraVida.canvas;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.datos.estaVivo) return;

    // Fondo negro semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Barra de vida
    const porcentajeVida = this.datos.vidaActual / this.datos.vidaMaxima;
    const anchoBarraVida = (canvas.width - 60) * porcentajeVida;

    // Color según porcentaje de vida
    if (porcentajeVida > 0.5) {
      ctx.fillStyle = '#00ff00';
    } else if (porcentajeVida > 0.25) {
      ctx.fillStyle = '#ffaa00';
    } else {
      ctx.fillStyle = '#ff0000';
    }

    ctx.fillRect(30, 50, anchoBarraVida, canvas.height - 80);

    // Borde con color del tipo de bot
    ctx.strokeStyle = '#' + this.color.toString(16).padStart(6, '0');
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Indicador de tipo de bot (arriba de la barra)
    ctx.fillStyle = '#' + this.color.toString(16).padStart(6, '0');
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.obtenerNombreTipo(), canvas.width / 2, 25);

    // Texto de vida
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${Math.ceil(this.datos.vidaActual)} / ${this.datos.vidaMaxima}`,
      canvas.width / 2,
      canvas.height / 2 + 10
    );

    this.texturaBarraVida.needsUpdate = true;
  }


  /**
   * Aplica daño al bot
   * Requirement 1.2: Mostrar cantidad de daño recibido visualmente
   * Requirement 1.4: Registrar impacto y actualizar barra de vida
   * 
   * @param {number} cantidad - Cantidad de daño a aplicar
   * @returns {boolean} - true si el bot murió por este daño
   */
  recibirDaño(cantidad) {
    if (!this.datos.estaVivo) return false;

    // Aplicar daño: vida = max(0, vida - daño)
    // Property 2: Daño reduce vida correctamente
    this.datos.vidaActual = Math.max(0, this.datos.vidaActual - cantidad);

    // Efecto visual de daño
    this.crearEfectoDaño();

    // Verificar si murió
    if (this.datos.vidaActual <= 0) {
      this.datos.estaVivo = false;
      this.datos.tiempoMuerte = performance.now();
      this.morir();
      return true;
    }

    this.actualizarBarraVida();
    return false;
  }

  /**
   * Crea efecto visual cuando el bot recibe daño
   */
  crearEfectoDaño() {
    // Flash rojo temporal
    const colorOriginal = this.mesh.material.color.getHex();
    this.mesh.material.color.setHex(0xffffff);
    
    setTimeout(() => {
      if (this.mesh && this.mesh.material) {
        this.mesh.material.color.setHex(this.datos.estaVivo ? colorOriginal : 0x333333);
      }
    }, 100);
  }

  /**
   * Ejecuta la muerte del bot
   * Requirement 1.3: Preparar para respawn después de tiempo configurable
   */
  morir() {
    // Cambiar color a gris
    this.mesh.material.color.setHex(0x333333);
    this.spriteBarraVida.visible = false;

    // Animar caída
    let velocidadCaida = 0;
    const animarCaida = () => {
      if (!this.mesh) return;
      
      if (this.mesh.position.y > -1) {
        velocidadCaida += 0.01;
        this.mesh.position.y -= velocidadCaida;
        this.mesh.rotation.x += 0.05;
        this.mesh.rotation.z += 0.03;
        requestAnimationFrame(animarCaida);
      }
    };
    animarCaida();
  }

  /**
   * Reaparece el bot en su posición inicial
   * Requirement 1.3: Reaparecer después de tiempo configurable
   * Property 3: Respawn restaura estado inicial
   */
  reaparecer() {
    // Restaurar posición inicial
    this.mesh.position.set(
      this.posicionInicial.x,
      this.posicionInicial.y,
      this.posicionInicial.z
    );
    this.mesh.rotation.set(0, 0, 0);

    // Restaurar color original
    this.mesh.material.color.setHex(this.color);

    // Restaurar vida completa
    this.datos.vidaActual = this.datos.vidaMaxima;
    this.datos.estaVivo = true;
    this.datos.tiempoMuerte = 0;

    // Mostrar barra de vida
    this.spriteBarraVida.visible = true;
    this.actualizarBarraVida();

    // Efecto visual de respawn
    this.crearEfectoRespawn();
  }

  /**
   * Crea efecto visual de partículas al reaparecer
   */
  crearEfectoRespawn() {
    const particulas = 15;
    for (let i = 0; i < particulas; i++) {
      const geometria = new THREE.SphereGeometry(0.1, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0.8
      });
      const particula = new THREE.Mesh(geometria, material);

      particula.position.copy(this.mesh.position);
      particula.position.y += Math.random() * 2;

      const velocidad = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      );

      this.scene.add(particula);

      let vida = 0;
      const animar = () => {
        vida += 0.016;
        particula.position.add(velocidad.clone().multiplyScalar(0.02));
        material.opacity = 0.8 - vida * 1.5;

        if (vida > 0.5) {
          this.scene.remove(particula);
          geometria.dispose();
          material.dispose();
        } else {
          requestAnimationFrame(animar);
        }
      };
      animar();
    }
  }


  /**
   * Actualiza el estado del bot (verifica respawn)
   * Método base que puede ser sobrescrito por clases hijas
   * 
   * @param {number} deltaTime - Tiempo desde la última actualización en ms
   */
  actualizar(deltaTime) {
    // Si el bot está muerto, verificar si debe reaparecer
    if (!this.datos.estaVivo) {
      const ahora = performance.now();
      if (ahora - this.datos.tiempoMuerte >= this.datos.tiempoRespawn) {
        this.reaparecer();
      }
    }
  }

  /**
   * Verifica si el bot está vivo
   * @returns {boolean}
   */
  estaVivo() {
    return this.datos.estaVivo;
  }

  /**
   * Obtiene la posición actual del bot
   * @returns {THREE.Vector3}
   */
  obtenerPosicion() {
    return this.mesh.position.clone();
  }

  /**
   * Obtiene el tipo de bot
   * @returns {string}
   */
  obtenerTipo() {
    return this.tipo;
  }

  /**
   * Obtiene la vida actual del bot
   * @returns {number}
   */
  obtenerVida() {
    return this.datos.vidaActual;
  }

  /**
   * Obtiene la vida máxima del bot
   * @returns {number}
   */
  obtenerVidaMaxima() {
    return this.datos.vidaMaxima;
  }

  /**
   * Destruye el bot y limpia recursos
   */
  destruir() {
    // Remover mesh de la escena
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }

    // Limpiar barra de vida
    if (this.spriteBarraVida) {
      this.texturaBarraVida.dispose();
      this.spriteBarraVida.material.dispose();
    }

    // Limpiar referencias
    this.mesh = null;
    this.spriteBarraVida = null;
    this.scene = null;
  }
}
