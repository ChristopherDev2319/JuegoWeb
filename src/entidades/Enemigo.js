/**
 * Clase Enemigo
 * Representa un enemigo en el juego con barra de vida y sistema de respawn
 * 
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';

export class Enemigo {
  /**
   * @param {THREE.Scene} scene - Escena de Three.js
   * @param {number} x - Posición X inicial
   * @param {number} z - Posición Z inicial
   * @param {number} color - Color hexadecimal del enemigo
   */
  constructor(scene, x, z, color = 0xff0000) {
    this.scene = scene;
    
    // Crear mesh del enemigo
    const geometria = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: color });
    this.mesh = new THREE.Mesh(geometria, material);
    this.mesh.position.set(x, 1, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    // Datos del enemigo
    this.datos = {
      vidaMaxima: CONFIG.enemigo.vidaMaxima,
      vidaActual: CONFIG.enemigo.vidaMaxima,
      estaVivo: true,
      tiempoRespawn: CONFIG.enemigo.tiempoRespawn,
      tiempoMuerte: 0
    };

    // Guardar posición y color inicial para respawn
    this.posicionInicial = { x: x, y: 1, z: z };
    this.colorInicial = color;

    // Crear barra de vida
    this.datosBarraVida = this.crearBarraVida();
    this.texturaBarraVida = new THREE.CanvasTexture(this.datosBarraVida.canvas);
    const materialBarraVida = new THREE.SpriteMaterial({
      map: this.texturaBarraVida,
      transparent: true
    });
    this.spriteBarraVida = new THREE.Sprite(materialBarraVida);
    this.spriteBarraVida.scale.set(3, 0.5, 1);
    this.spriteBarraVida.position.set(0, 2.5, 0);
    this.mesh.add(this.spriteBarraVida);

    this.actualizarBarraVida();
  }

  /**
   * Crea el canvas para la barra de vida
   * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}}
   */
  crearBarraVida() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    return { canvas, ctx };
  }


  /**
   * Actualiza el dibujo de la barra de vida
   */
  actualizarBarraVida() {
    const ctx = this.datosBarraVida.ctx;
    const canvas = this.datosBarraVida.canvas;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.datos.estaVivo) return;

    // Fondo negro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Barra de vida
    const porcentajeVida = this.datos.vidaActual / this.datos.vidaMaxima;
    const anchoBarraVida = (canvas.width - 60) * porcentajeVida;

    // Color según porcentaje
    if (porcentajeVida > 0.5) {
      ctx.fillStyle = '#00ff00';
    } else if (porcentajeVida > 0.25) {
      ctx.fillStyle = '#ffaa00';
    } else {
      ctx.fillStyle = '#ff0000';
    }

    ctx.fillRect(30, 30, anchoBarraVida, canvas.height - 60);

    // Borde blanco
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Texto de vida
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${Math.ceil(this.datos.vidaActual)} / ${this.datos.vidaMaxima}`,
      canvas.width / 2,
      canvas.height / 2
    );

    this.texturaBarraVida.needsUpdate = true;
  }

  /**
   * Aplica daño al enemigo
   * @param {number} cantidad - Cantidad de daño a aplicar
   */
  recibirDaño(cantidad) {
    if (!this.datos.estaVivo) return;

    this.datos.vidaActual -= cantidad;

    if (this.datos.vidaActual <= 0) {
      this.datos.vidaActual = 0;
      this.datos.estaVivo = false;
      this.datos.tiempoMuerte = performance.now();
      this.morir();
    }

    this.actualizarBarraVida();
  }

  /**
   * Ejecuta la animación de muerte del enemigo
   */
  morir() {
    // Cambiar color a gris
    this.mesh.material.color.setHex(0x333333);
    this.spriteBarraVida.visible = false;

    // Animar caída
    let velocidadCaida = 0;
    const animarCaida = () => {
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
   * Reaparece el enemigo en su posición inicial
   */
  reaparecer() {
    // Restaurar posición y rotación
    this.mesh.position.set(
      this.posicionInicial.x,
      this.posicionInicial.y,
      this.posicionInicial.z
    );
    this.mesh.rotation.set(0, 0, 0);

    // Restaurar color
    this.mesh.material.color.setHex(this.colorInicial);

    // Restaurar vida
    this.datos.vidaActual = this.datos.vidaMaxima;
    this.datos.estaVivo = true;

    // Mostrar barra de vida
    this.spriteBarraVida.visible = true;
    this.actualizarBarraVida();

    // Efecto de respawn
    this.crearEfectoRespawn();
  }

  /**
   * Crea efecto visual de partículas al reaparecer
   */
  crearEfectoRespawn() {
    const particulas = 20;
    for (let i = 0; i < particulas; i++) {
      const geometria = new THREE.SphereGeometry(0.1, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
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
   * Actualiza el estado del enemigo (verifica respawn)
   */
  actualizar() {
    if (!this.datos.estaVivo) {
      const ahora = performance.now();
      if (ahora - this.datos.tiempoMuerte >= this.datos.tiempoRespawn) {
        this.reaparecer();
      }
    }
  }

  /**
   * Verifica si el enemigo está vivo
   * @returns {boolean}
   */
  estaVivo() {
    return this.datos.estaVivo;
  }
}
