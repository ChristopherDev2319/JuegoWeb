/**
 * Clase BotBase
 * Clase base abstracta para todos los tipos de bots de entrenamiento
 * Proporciona funcionalidad común: modelo 3D, barra de vida, daño, muerte y respawn
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 3.2, 5.4, 7.1
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { AnimadorPersonaje, cargarAnimacion } from '../sistemas/animaciones.js';
import { CONFIG } from '../config.js';

// Configuración del modelo del bot
// Requirements: 1.1, 1.2
const BOT_MODEL_CONFIG = {
  modelPath: 'modelos/cubed_bear.glb',
  scale: 7.0,
  rotationOffset: Math.PI,
  heightOffset: 0
};

// Hitbox del bot - IGUAL que jugadores remotos (SERVER_HITBOX)
const BOT_HITBOX = {
  width: 1.4,
  height: 2.0,
  depth: 1.2,
  centerYOffset: -0.7
};

// Debug: mostrar hitbox visualmente
const DEBUG_HITBOX = true;

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
  constructor(scene, config, x = 0, y = 0, z = 0) {
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

    // Guardar posición inicial para respawn (mantener altura original)
    // Requirement 1.3: Reaparecer en posición inicial
    this.posicionInicial = { x: x, y: y, z: z };

    // Sistema de animaciones
    // Requirements: 3.2, 5.4
    this.animador = null;
    this.modelo = null;
    this.modeloCargado = false;
    this.mesh = null; // Mesh de fallback

    // Crear modelo del bot (carga asíncrona)
    this.crearModelo(x, y, z);

    // Crear hitbox igual que jugadores remotos
    this.crearHitbox();

    // Crear barra de vida con indicador de tipo
    // Requirement 5.4: Barra de vida con indicador de tipo
    this.crearBarraVida();
  }

  /**
   * Crea la hitbox del bot (igual que jugadores remotos)
   */
  crearHitbox() {
    const { width, height, depth, centerYOffset } = BOT_HITBOX;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      visible: DEBUG_HITBOX
    });
    
    this.hitbox = new THREE.Mesh(geometry, material);
    this.hitbox.position.y = CONFIG.jugador.alturaOjos + centerYOffset;
    this.mesh.add(this.hitbox);
    
    // Guardar referencia en userData para detección de impactos
    this.hitbox.userData.bot = this;
    this.hitbox.userData.tipo = this.tipo;
  }


  /**
   * Crea el modelo 3D del bot usando el modelo bear
   * Requirements: 1.1, 1.2
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} z - Posición Z
   */
  crearModelo(x, y, z) {
    // Crear grupo contenedor para el modelo
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, z);
    
    // Guardar referencia al bot en el mesh para detección de impactos
    this.mesh.userData.bot = this;
    this.mesh.userData.tipo = this.tipo;
    
    this.scene.add(this.mesh);
    
    // Cargar modelo bear de forma asíncrona
    this.cargarModeloBear();
  }

  /**
   * Carga el modelo GLB del personaje cubed_bear
   * Requirements: 1.1, 1.2
   * @param {number} intentos - Número de intentos de carga
   */
  cargarModeloBear(intentos = 0) {
    const maxIntentos = 3;
    const gltfLoader = new THREE.GLTFLoader();
    
    gltfLoader.load(
      BOT_MODEL_CONFIG.modelPath,
      async (gltf) => {
        this.modelo = gltf.scene;
        this.modelo.scale.setScalar(BOT_MODEL_CONFIG.scale);
        this.modelo.position.y = BOT_MODEL_CONFIG.heightOffset;
        this.modelo.rotation.y = BOT_MODEL_CONFIG.rotationOffset;
        
        // Guardar animaciones del modelo
        this.animacionesDelModelo = gltf.animations || [];
        
        // Configurar materiales y visibilidad - cubed_bear es un modelo simple
        this.modelo.traverse((child) => {
          child.visible = true;
          
          // IMPORTANTE: Desactivar frustum culling para evitar que el modelo
          // desaparezca cuando la cámara mira hacia arriba
          child.frustumCulled = false;
          
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
            console.log(`🤖 Bot ${this.tipo}: Mesh: ${child.name}`);
          }
        });
        
        this.mesh.add(this.modelo);
        this.modeloCargado = true;
        
        // Asegurar visibilidad
        this.mesh.visible = true;
        this.modelo.visible = true;
        
        console.log(`🤖 Bot ${this.tipo}: Modelo cubed_bear cargado en (${this.mesh.position.x.toFixed(1)}, ${this.mesh.position.y.toFixed(1)}, ${this.mesh.position.z.toFixed(1)})`);
        
        // Inicializar sistema de animaciones
        await this.inicializarAnimaciones();
        
        console.log(`✅ Modelo bear cargado para bot ${this.tipo}`);
      },
      undefined,
      (error) => {
        console.error(`Error cargando modelo bear para bot ${this.tipo} (intento ${intentos + 1}/${maxIntentos}):`, error);
        
        // Reintentar si no hemos alcanzado el máximo de intentos
        if (intentos < maxIntentos - 1) {
          console.log(`Reintentando carga del modelo para bot ${this.tipo}...`);
          setTimeout(() => {
            this.cargarModeloBear(intentos + 1);
          }, 500 * (intentos + 1));
        } else {
          // Crear mesh de fallback después de agotar todos los intentos
          console.error(`No se pudo cargar el modelo después de ${maxIntentos} intentos para bot ${this.tipo}`);
          this.crearMeshFallback();
        }
      }
    );
  }

  /**
   * Crea un mesh de fallback (cubo) si falla la carga del modelo
   * Requirements: 1.1 - Error handling
   */
  crearMeshFallback() {
    const geometria = new THREE.BoxGeometry(1.5, 2, 1.5);
    const material = new THREE.MeshStandardMaterial({ color: this.color });
    const meshFallback = new THREE.Mesh(geometria, material);
    meshFallback.position.y = 1;
    meshFallback.castShadow = true;
    meshFallback.receiveShadow = true;
    meshFallback.frustumCulled = false;
    
    this.mesh.add(meshFallback);
    this.modeloCargado = true;
    
    console.warn(`⚠️ Usando mesh de fallback para bot ${this.tipo}`);
  }

  /**
   * Inicializa el sistema de animaciones del bot
   * Requirements: 3.2, 5.4
   * Carga animaciones según el tipo de bot:
   * - estatico: idle (loop)
   * - movil: walk (loop)
   * - tirador: aim (sin loop, se queda en pose final)
   */
  async inicializarAnimaciones() {
    if (!this.modelo) return;
    
    this.animador = new AnimadorPersonaje(this.modelo);
    this.animador.inicializar();
    
    try {
      // Determinar qué animación cargar según el tipo de bot
      let animacionPrincipal = 'idle';
      let hacerLoop = true;
      
      if (this.tipo === 'movil') {
        animacionPrincipal = 'walk';
        hacerLoop = true;
      } else if (this.tipo === 'tirador') {
        animacionPrincipal = 'aim';
        hacerLoop = false; // aim no hace loop, se queda en pose final
      }
      
      // Cargar la animación principal para este tipo de bot
      const clip = await cargarAnimacion(animacionPrincipal);
      
      if (clip) {
        this.animador.agregarAnimacion(animacionPrincipal, clip);
        this.animador.reproducir(animacionPrincipal, { transicion: 0, loop: hacerLoop });
        console.log(`✅ Animación '${animacionPrincipal}' iniciada para bot ${this.tipo} (loop: ${hacerLoop})`);
      } else {
        console.warn(`⚠️ No se pudo cargar animación '${animacionPrincipal}' para bot ${this.tipo}`);
      }
      
      console.log(`✅ Animaciones inicializadas para bot ${this.tipo}`);
    } catch (error) {
      console.warn(`Error cargando animaciones para bot ${this.tipo}:`, error);
    }
  }

  /**
   * Reproduce una animación específica
   * Requirements: 3.2, 5.4
   * @param {string} nombre - Nombre de la animación ('idle', 'walk')
   * @param {Object} opciones - Opciones de reproducción
   */
  reproducirAnimacion(nombre, opciones = {}) {
    if (this.animador) {
      this.animador.reproducir(nombre, opciones);
    }
  }

  /**
   * Crea el canvas y sprite para la barra de vida
   * Requirement 5.4: Incluir indicador del tipo de bot
   * Requirement 7.1: Posicionar sobre el modelo bear
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
    // Ajustar altura para modelo bear (escala 7.0, altura aproximada 2.5 unidades)
    // Requirements: 7.1
    this.spriteBarraVida.position.set(0, 3.5, 0);
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

    // Efecto visual de daño (flash blanco)
    this.crearEfectoDaño();
    
    // El indicador de daño en pantalla se muestra desde main.js usando mostrarDañoCausado()

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
   * Muestra un número de daño flotante sobre el bot
   * @param {number} cantidad - Cantidad de daño
   */
  mostrarNumeroDaño(cantidad) {
    // Crear sprite con el número de daño
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Dibujar número de daño
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(`-${Math.round(cantidad)}`, 64, 32);
    ctx.fillText(`-${Math.round(cantidad)}`, 64, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture, 
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(material);
    
    // Posicionar sobre el bot
    sprite.position.copy(this.mesh.position);
    sprite.position.y += 3;
    sprite.position.x += (Math.random() - 0.5) * 0.5;
    sprite.scale.set(2, 1, 1);
    
    this.scene.add(sprite);
    
    // Animar el número subiendo y desvaneciéndose
    let tiempo = 0;
    const animar = () => {
      tiempo += 0.016;
      sprite.position.y += 0.03;
      material.opacity = 1 - tiempo * 2;
      
      if (tiempo > 0.5) {
        this.scene.remove(sprite);
        texture.dispose();
        material.dispose();
      } else {
        requestAnimationFrame(animar);
      }
    };
    animar();
  }

  /**
   * Crea efecto visual cuando el bot recibe daño
   * Requirements: 1.3
   */
  crearEfectoDaño() {
    // Flash blanco temporal en el modelo
    if (this.modelo) {
      const materialesOriginales = [];
      
      // Guardar colores originales y cambiar a blanco
      this.modelo.traverse((child) => {
        if (child.isMesh && child.material) {
          const material = child.material;
          if (material.color) {
            materialesOriginales.push({
              material: material,
              color: material.color.getHex()
            });
            material.color.setHex(0xffffff);
          }
        }
      });
      
      // Restaurar colores originales después de 100ms
      setTimeout(() => {
        materialesOriginales.forEach(({ material, color }) => {
          if (material && material.color) {
            material.color.setHex(color);
          }
        });
      }, 100);
    }
  }

  /**
   * Ejecuta la muerte del bot
   * Requirement 1.3: Preparar para respawn después de tiempo configurable
   * Requirement 1.4: Efecto visual de muerte
   */
  morir() {
    // Cambiar color del modelo a gris
    if (this.modelo) {
      this.modelo.traverse((child) => {
        if (child.isMesh && child.material && child.material.color) {
          child.material.color.setHex(0x333333);
        }
      });
    }
    
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

    // Restaurar colores originales del modelo
    if (this.modelo) {
      this.modelo.traverse((child) => {
        if (child.isMesh && child.material && child.material.color) {
          // Restaurar color original (el modelo tiene sus propios colores)
          // No necesitamos cambiar el color ya que el modelo tiene texturas
        }
      });
    }

    // Restaurar vida completa
    this.datos.vidaActual = this.datos.vidaMaxima;
    this.datos.estaVivo = true;
    this.datos.tiempoMuerte = 0;

    // Mostrar barra de vida
    this.spriteBarraVida.visible = true;
    this.actualizarBarraVida();

    // Restaurar animación idle
    this.reproducirAnimacion('idle', { transicion: 0.2, loop: true });
    
    // Sin efecto de partículas al reaparecer
  }

  /**
   * Crea efecto visual de partículas al reaparecer (optimizado)
   */
  crearEfectoRespawn() {
    // Reducido de 15 a 4 partículas
    const particulas = 4;
    for (let i = 0; i < particulas; i++) {
      const geometria = new THREE.SphereGeometry(0.1, 4, 4);
      const material = new THREE.MeshBasicMaterial({
        color: this.color,
        transparent: true,
        opacity: 0.6
      });
      const particula = new THREE.Mesh(geometria, material);
      particula.position.copy(this.mesh.position);
      particula.position.y += Math.random() * 2;
      this.scene.add(particula);

      // Usar setTimeout en lugar de requestAnimationFrame
      let frame = 0;
      const intervalo = setInterval(() => {
        frame++;
        particula.position.y += 0.08;
        material.opacity -= 0.12;
        
        if (frame >= 5) {
          clearInterval(intervalo);
          this.scene.remove(particula);
          geometria.dispose();
          material.dispose();
        }
      }, 33);
    }
  }


  /**
   * Actualiza el estado del bot (verifica respawn y animaciones)
   * Método base que puede ser sobrescrito por clases hijas
   * 
   * @param {number} deltaTime - Tiempo desde la última actualización en milisegundos
   */
  actualizar(deltaTime) {
    // Actualizar animaciones (convertir ms a segundos)
    if (this.animador) {
      this.animador.actualizar(deltaTime / 1000);
    }
    
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
   * Obtiene la hitbox del bot
   * @returns {THREE.Mesh}
   */
  obtenerHitbox() {
    return this.hitbox;
  }

  /**
   * Obtiene las dimensiones de la hitbox
   * @returns {Object}
   */
  static obtenerDimensionesHitbox() {
    return { ...BOT_HITBOX };
  }

  /**
   * Destruye el bot y limpia recursos
   */
  destruir() {
    // Limpiar animador
    if (this.animador) {
      this.animador.destruir();
      this.animador = null;
    }
    
    // Limpiar hitbox
    if (this.hitbox) {
      this.hitbox.geometry.dispose();
      this.hitbox.material.dispose();
      this.hitbox = null;
    }
    
    // Remover mesh de la escena
    if (this.mesh) {
      this.scene.remove(this.mesh);
      
      // Limpiar todos los hijos del grupo
      this.mesh.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    // Limpiar barra de vida
    if (this.spriteBarraVida) {
      this.texturaBarraVida.dispose();
      this.spriteBarraVida.material.dispose();
    }

    // Limpiar referencias
    this.mesh = null;
    this.modelo = null;
    this.spriteBarraVida = null;
    this.scene = null;
  }
}
