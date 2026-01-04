/**
 * Sistema de Spawns de Munición
 * Gestiona los puntos de recolección de munición en el mapa
 * 
 * Requirements: 5.1, 5.2, 5.3
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';

/**
 * Clase AmmoSpawn
 * Representa un punto de spawn de munición en el mapa
 * 
 * Requirements: 5.1, 5.2, 5.3
 */
export class AmmoSpawn {
  /**
   * Constructor del spawn de munición
   * @param {THREE.Scene} scene - Escena de Three.js
   * @param {Object} posicion - Posición {x, y, z} del spawn
   * @param {Object} config - Configuración del spawn (opcional)
   */
  constructor(scene, posicion, config = {}) {
    this.scene = scene;
    this.posicion = new THREE.Vector3(
      posicion.x ?? 0,
      posicion.y ?? 0,
      posicion.z ?? 0
    );
    
    // Configuración del spawn
    this.config = {
      porcentajeMunicion: config.porcentajeMunicion || 0.35,
      tiempoRecarga: config.tiempoRecarga || 10000,
      radioRecoleccion: config.radioRecoleccion || 1.5,
      escala: config.escala || 1.5
    };
    
    // Estado del spawn
    this.activo = true;
    this.tiempoDesactivacion = 0;
    
    // Modelo 3D
    this.modelo = null;
    this.modeloCargado = false;
    
    // ID único para identificación
    this.id = `ammo_spawn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Carga el modelo 3D de la caja de munición
   * Requirements: 5.5
   * @param {string} rutaModelo - Ruta al archivo GLB del modelo
   * @returns {Promise<void>}
   */
  cargarModelo(rutaModelo) {
    return new Promise((resolve, reject) => {
      if (!rutaModelo) {
        // Crear modelo placeholder si no hay ruta
        this._crearModeloPlaceholder();
        resolve();
        return;
      }

      const gltfLoader = new THREE.GLTFLoader();
      
      gltfLoader.load(
        rutaModelo,
        (gltf) => {
          this.modelo = gltf.scene;
          
          // Aplicar escala
          this.modelo.scale.setScalar(this.config.escala);
          
          // Posicionar el modelo
          this.modelo.position.copy(this.posicion);
          
          // Configurar sombras
          this.modelo.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          // Agregar a la escena
          this.scene.add(this.modelo);
          this.modeloCargado = true;
          
          console.log(`📦 Modelo de munición cargado en posición: (${this.posicion.x}, ${this.posicion.y}, ${this.posicion.z})`);
          resolve();
        },
        (progress) => {
          // Progreso de carga
        },
        (error) => {
          console.warn(`⚠️ Error cargando modelo de munición, usando placeholder:`, error);
          this._crearModeloPlaceholder();
          resolve();
        }
      );
    });
  }

  /**
   * Crea un modelo placeholder (caja simple) si el modelo GLB no carga
   * @private
   */
  _crearModeloPlaceholder() {
    const geometria = new THREE.BoxGeometry(0.5, 0.3, 0.3);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4a7c4e,
      metalness: 0.3,
      roughness: 0.7
    });
    
    this.modelo = new THREE.Mesh(geometria, material);
    this.modelo.position.copy(this.posicion);
    this.modelo.castShadow = true;
    this.modelo.receiveShadow = true;
    
    this.scene.add(this.modelo);
    this.modeloCargado = true;
    
    console.log(`📦 Modelo placeholder de munición creado en: (${this.posicion.x}, ${this.posicion.y}, ${this.posicion.z})`);
  }

  /**
   * Intenta recoger la munición del spawn
   * Requirements: 5.1, 5.2
   * 
   * @param {Object} jugador - Objeto jugador con información del arma
   * @param {Object} armaActual - Estado del arma actual del jugador
   * @returns {Object} - { exito: boolean, municionOtorgada: number }
   */
  recoger(jugador, armaActual) {
    // Verificar si el spawn está activo
    if (!this.activo) {
      return { exito: false, municionOtorgada: 0 };
    }

    // Verificar proximidad del jugador
    if (!this._jugadorEnRango(jugador)) {
      return { exito: false, municionOtorgada: 0 };
    }

    // Calcular munición a otorgar (35% de munición máxima)
    const configArma = CONFIG.armas[armaActual.tipoActual];
    if (!configArma || configArma.tipo === 'melee') {
      // El cuchillo no usa munición
      return { exito: false, municionOtorgada: 0 };
    }

    const municionMaxima = configArma.municionTotal || 100;
    const municionOtorgada = Math.round(municionMaxima * this.config.porcentajeMunicion);

    // Desactivar el spawn
    this._desactivar();

    console.log(`🎁 Munición recogida: +${municionOtorgada} balas (35% de ${municionMaxima})`);

    return { 
      exito: true, 
      municionOtorgada: municionOtorgada 
    };
  }

  /**
   * Verifica si el jugador está en rango de recolección
   * @private
   * @param {Object} jugador - Objeto jugador con posición
   * @returns {boolean}
   */
  _jugadorEnRango(jugador) {
    if (!jugador || !jugador.posicion) return false;
    
    const distancia = this.posicion.distanceTo(jugador.posicion);
    return distancia <= this.config.radioRecoleccion;
  }

  /**
   * Desactiva el spawn después de ser recogido
   * Requirements: 5.2
   * @private
   */
  _desactivar() {
    this.activo = false;
    this.tiempoDesactivacion = performance.now();
    
    // Ocultar el modelo
    if (this.modelo) {
      this.modelo.visible = false;
    }
  }

  /**
   * Reactiva el spawn después del tiempo de recarga
   * Requirements: 5.3
   * @private
   */
  _reactivar() {
    this.activo = true;
    this.tiempoDesactivacion = 0;
    
    // Mostrar el modelo
    if (this.modelo) {
      this.modelo.visible = true;
    }
    
    console.log(`📦 Spawn de munición reactivado en: (${this.posicion.x}, ${this.posicion.y}, ${this.posicion.z})`);
  }

  /**
   * Actualiza el estado del spawn (timer de recarga)
   * Requirements: 5.3
   * @param {number} deltaTime - Tiempo desde el último frame (no usado, usamos tiempo absoluto)
   */
  actualizar(deltaTime) {
    // Si está activo, no hay nada que actualizar
    if (this.activo) return;

    // Verificar si ha pasado el tiempo de recarga (10 segundos)
    const tiempoTranscurrido = performance.now() - this.tiempoDesactivacion;
    
    if (tiempoTranscurrido >= this.config.tiempoRecarga) {
      this._reactivar();
    }
  }

  /**
   * Verifica si el spawn está activo y disponible
   * @returns {boolean}
   */
  estaActivo() {
    return this.activo;
  }

  /**
   * Obtiene el tiempo restante para reactivación (en ms)
   * @returns {number} - Tiempo restante en ms, 0 si está activo
   */
  obtenerTiempoRestante() {
    if (this.activo) return 0;
    
    const tiempoTranscurrido = performance.now() - this.tiempoDesactivacion;
    const tiempoRestante = this.config.tiempoRecarga - tiempoTranscurrido;
    
    return Math.max(0, tiempoRestante);
  }

  /**
   * Elimina el spawn de la escena
   */
  destruir() {
    if (this.modelo && this.scene) {
      this.scene.remove(this.modelo);
      
      // Liberar geometría y materiales
      if (this.modelo.geometry) {
        this.modelo.geometry.dispose();
      }
      if (this.modelo.material) {
        if (Array.isArray(this.modelo.material)) {
          this.modelo.material.forEach(m => m.dispose());
        } else {
          this.modelo.material.dispose();
        }
      }
    }
    
    this.modelo = null;
    this.modeloCargado = false;
  }
}

/**
 * Calcula la munición que otorga un spawn para un arma específica
 * Función utilitaria para property testing
 * Requirements: 5.1
 * 
 * @param {number} municionMaxima - Munición máxima del arma
 * @param {number} porcentaje - Porcentaje a otorgar (default 0.35)
 * @returns {number} - Munición a otorgar (redondeada)
 */
export function calcularMunicionSpawn(municionMaxima, porcentaje = 0.35) {
  return Math.round(municionMaxima * porcentaje);
}
