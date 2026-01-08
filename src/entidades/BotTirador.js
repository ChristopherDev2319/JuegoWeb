/**
 * Clase BotTirador
 * Bot de entrenamiento que dispara en línea recta hacia adelante
 * Solo dispara cuando el jugador está en su campo de visión frontal
 * Usa el modelo idle_tps.glb que tiene el arma M4 integrada (igual que JugadorRemoto)
 * 
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { BotBase } from './BotBase.js';
import { CONFIG } from '../config.js';
import { AnimadorPersonaje, cargarAnimacion } from '../sistemas/animaciones.js';

// Configuración del modelo con armas (igual que JugadorRemoto)
const MODEL_CONFIG = {
  modelPath: 'public/modelos/animaciones/idle_tps.glb',
  scale: 7.0,
  rotationOffset: Math.PI
};

// Nombre del mesh del arma M4 en el modelo
const WEAPON_M4_MESH_NAME = 'weapon_m4a6';

export class BotTirador extends BotBase {
  constructor(scene, x = 0, y = 1, z = 0, opciones = {}) {
    const configTirador = CONFIG.botsEntrenamiento.tirador;

    super(
      scene,
      {
        tipo: 'tirador',
        color: configTirador.color,
        vida: configTirador.vida,
        tiempoRespawn: configTirador.tiempoRespawn
      },
      x,
      y,
      z
    );

    // Configuración de disparo - 5 segundos entre disparos
    this.cadenciaDisparo = 5000;
    this.dañoReducido = configTirador.dañoReducido || 15;
    this.velocidadBala = 60;

    // Rango y ángulo de visión
    this.rangoDisparo = 50;
    this.anguloVision = Math.PI / 2; // 90 grados

    // Radio de colisión del jugador
    this.radioColisionJugador = 1.0;

    // Estado
    this.ultimoDisparo = -this.cadenciaDisparo;
    this.onDisparo = opciones.onDisparo || null;
    this.proyectilesActivos = [];

    // Referencia al mesh del arma M4
    this.meshArmaM4 = null;
    
    // Flag para saber si ya cargamos el modelo correcto
    this.modeloConArmasCargado = false;
  }

  /**
   * Sobrescribe cargarModeloBear para cargar el modelo con armas (idle_tps.glb)
   * en lugar del modelo simple cubed_bear.glb
   */
  cargarModeloBear(intentos = 0) {
    const maxIntentos = 3;
    const gltfLoader = new THREE.GLTFLoader();

    // Cargar el modelo con armas integradas (igual que JugadorRemoto)
    gltfLoader.load(
      MODEL_CONFIG.modelPath,
      async (gltf) => {
        this.modelo = gltf.scene;
        this.modelo.scale.setScalar(MODEL_CONFIG.scale);
        this.modelo.position.y = 0;
        this.modelo.rotation.y = MODEL_CONFIG.rotationOffset;

        // Guardar animaciones del modelo
        this.animacionesDelModelo = gltf.animations || [];

        // Lista de nombres de armas a OCULTAR (todas menos weapon_ak)
        const armasAOcultar = [
          'weapon_m4a6', 'weapon_1911', 'weapon_awp', 'weapon_pump', 'weapon_mp5'
        ];
        
        // Lista de items a ocultar
        const itemsAOcultar = ['knife', 'cuchillo', 'juice', 'juicebox', 'box', 'straw', 'Straw', 'stylized'];

        // Recorrer TODO el modelo
        this.modelo.traverse((child) => {
          child.frustumCulled = false;

          // Ocultar armas específicas (excepto AK)
          if (armasAOcultar.includes(child.name)) {
            child.visible = false;
            console.log(`🔫 Bot tirador: Ocultando arma ${child.name}`);
          }
          
          // Ocultar items (cuchillo, botiquín, etc)
          const nombreLower = child.name.toLowerCase();
          if (itemsAOcultar.some(item => nombreLower.includes(item.toLowerCase()))) {
            child.visible = false;
          }

          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
          
          // Hacer visible SOLO weapon_ak
          if (child.name === 'weapon_ak') {
            child.visible = true;
            this.meshArmaM4 = child;
            console.log(`🔫 Bot tirador: weapon_ak VISIBLE`);
          }
        });

        this.mesh.add(this.modelo);
        this.modeloCargado = true;
        this.modeloConArmasCargado = true;

        console.log(`🤖 Bot tirador: Modelo con armas cargado`);

        // Inicializar animaciones
        await this.inicializarAnimaciones();
      },
      undefined,
      (error) => {
        console.error(`Error cargando modelo para bot tirador (intento ${intentos + 1}/${maxIntentos}):`, error);

        if (intentos < maxIntentos - 1) {
          setTimeout(() => {
            this.cargarModeloBear(intentos + 1);
          }, 500 * (intentos + 1));
        } else {
          // Fallback al modelo simple
          console.warn('⚠️ Usando modelo de fallback para bot tirador');
          super.cargarModeloBear(0);
        }
      }
    );
  }

  /**
   * Inicializa animaciones - usa la animación 'aim' para el tirador
   */
  async inicializarAnimaciones() {
    if (!this.modelo) return;

    this.animador = new AnimadorPersonaje(this.modelo);
    this.animador.inicializar();

    try {
      // Cargar animación aim para el tirador
      const clip = await cargarAnimacion('aim');

      if (clip) {
        this.animador.agregarAnimacion('aim', clip);
        this.animador.reproducir('aim', { transicion: 0, loop: false });
        console.log(`✅ Animación 'aim' iniciada para bot tirador`);
      }
    } catch (error) {
      console.warn('Error cargando animación aim:', error);
    }
  }

  /**
   * Obtiene la dirección frontal del bot
   * El modelo tiene rotación PI, así que compensamos
   */
  obtenerDireccionFrontal() {
    const rotacionY = this.mesh.rotation.y + Math.PI;
    return new THREE.Vector3(Math.sin(rotacionY), 0, Math.cos(rotacionY)).normalize();
  }

  /**
   * Verifica si el jugador está en el campo de visión frontal del bot
   */
  jugadorEnCampoVision(jugadorPos) {
    if (!jugadorPos) return false;

    const distancia = this.mesh.position.distanceTo(jugadorPos);
    if (distancia > this.rangoDisparo) return false;

    const direccionJugador = new THREE.Vector3()
      .subVectors(jugadorPos, this.mesh.position)
      .normalize();
    direccionJugador.y = 0;

    const direccionFrontal = this.obtenerDireccionFrontal();
    const angulo = direccionFrontal.angleTo(direccionJugador);

    return angulo <= this.anguloVision;
  }

  /**
   * Ejecuta un disparo en línea recta hacia adelante
   */
  disparar() {
    if (!this.datos.estaVivo) return null;

    this.ultimoDisparo = performance.now();

    const posicionOrigen = this.mesh.position.clone();
    posicionOrigen.y += 1.3;

    const direccion = this.obtenerDireccionFrontal();
    posicionOrigen.add(direccion.clone().multiplyScalar(1.2));

    this.crearEfectoDisparo(posicionOrigen);
    this.crearProyectil(posicionOrigen, direccion);

    console.log(`🔫 Bot tirador disparó!`);

    return { origen: posicionOrigen, direccion, daño: this.dañoReducido };
  }

  /**
   * Crea efecto visual de flash al disparar
   */
  crearEfectoDisparo(origen) {
    const geo = new THREE.SphereGeometry(0.2, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 1
    });
    const flash = new THREE.Mesh(geo, mat);
    flash.position.copy(origen);
    this.scene.add(flash);

    setTimeout(() => {
      this.scene.remove(flash);
      geo.dispose();
      mat.dispose();
    }, 80);
  }

  /**
   * Crea un proyectil visual que viaja en línea recta
   */
  crearProyectil(origen, direccion) {
    const geo = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
    geo.rotateX(Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 1
    });

    const proyectil = new THREE.Mesh(geo, mat);
    proyectil.position.copy(origen);
    proyectil.rotation.y = Math.atan2(direccion.x, direccion.z);

    this.scene.add(proyectil);

    this.proyectilesActivos.push({
      mesh: proyectil,
      direccion: direccion.clone(),
      velocidad: this.velocidadBala,
      distanciaRecorrida: 0,
      distanciaMaxima: this.rangoDisparo + 5,
      geometria: geo,
      material: mat,
      haImpactado: false
    });
  }

  /**
   * Verifica colisión de un proyectil con el jugador
   */
  verificarColision(proyectil, jugadorPos) {
    if (!jugadorPos || proyectil.haImpactado) return false;

    const pos = proyectil.mesh.position;
    const dist = pos.distanceTo(jugadorPos);
    const enAltura = pos.y >= jugadorPos.y - 1 && pos.y <= jugadorPos.y + 2.5;

    return dist <= this.radioColisionJugador * 2 && enAltura;
  }

  /**
   * Actualiza los proyectiles activos
   */
  actualizarProyectiles(deltaTime, jugadorPos) {
    for (let i = this.proyectilesActivos.length - 1; i >= 0; i--) {
      const p = this.proyectilesActivos[i];

      const velocidadFrame = p.velocidad * deltaTime;
      const mov = p.direccion.clone().multiplyScalar(velocidadFrame);
      p.mesh.position.add(mov);
      p.distanciaRecorrida += velocidadFrame;

      if (!p.haImpactado && jugadorPos && this.verificarColision(p, jugadorPos)) {
        p.haImpactado = true;

        console.log(`💥 Bot tirador impactó al jugador! Daño: ${this.dañoReducido}`);

        if (this.onDisparo) {
          this.onDisparo({ daño: this.dañoReducido });
        }

        this.crearEfectoImpacto(p.mesh.position);
        this.eliminarProyectil(i);
        continue;
      }

      if (p.distanciaRecorrida >= p.distanciaMaxima) {
        this.eliminarProyectil(i);
      }
    }
  }

  /**
   * Crea efecto visual de impacto
   */
  crearEfectoImpacto(posicion) {
    const geo = new THREE.SphereGeometry(0.4, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.9
    });
    const efecto = new THREE.Mesh(geo, mat);
    efecto.position.copy(posicion);
    this.scene.add(efecto);

    setTimeout(() => {
      this.scene.remove(efecto);
      geo.dispose();
      mat.dispose();
    }, 200);
  }

  /**
   * Elimina un proyectil por índice
   */
  eliminarProyectil(index) {
    const p = this.proyectilesActivos[index];
    this.scene.remove(p.mesh);
    p.geometria.dispose();
    p.material.dispose();
    this.proyectilesActivos.splice(index, 1);
  }

  /**
   * Actualiza el estado del bot tirador
   */
  actualizar(deltaTime, jugadorPos = null) {
    const dt = deltaTime / 1000;
    this.actualizarProyectiles(dt, jugadorPos);

    if (!this.datos.estaVivo) {
      super.actualizar(deltaTime);
      return;
    }

    if (jugadorPos && this.jugadorEnCampoVision(jugadorPos)) {
      const ahora = performance.now();
      if (ahora - this.ultimoDisparo >= this.cadenciaDisparo) {
        this.disparar();
      }
    }

    super.actualizar(deltaTime);
  }

  /**
   * Reaparece el bot
   */
  reaparecer() {
    super.reaparecer();
    this.ultimoDisparo = -this.cadenciaDisparo;

    // Asegurar que el arma M4 sea visible al reaparecer
    if (this.meshArmaM4) {
      this.meshArmaM4.visible = true;
    }
  }

  /**
   * Establece el callback de impacto
   */
  establecerCallbackDisparo(callback) {
    this.onDisparo = callback;
  }

  /**
   * Destruye el bot y limpia recursos
   */
  destruir() {
    for (const p of this.proyectilesActivos) {
      this.scene.remove(p.mesh);
      p.geometria.dispose();
      p.material.dispose();
    }
    this.proyectilesActivos = [];
    this.meshArmaM4 = null;
    this.onDisparo = null;
    super.destruir();
  }
}
