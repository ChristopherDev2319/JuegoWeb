/**
 * Clase Bala
 * Representa un proyectil disparado por el jugador
 * 
 * Requirements: 1.1, 1.2, 1.3
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';
import { raycastBala } from '../sistemas/colisiones.js';

// Pool de geometrías y materiales reutilizables para optimización
let geometriaBalaCompartida = null;
let materialBalaCompartido = null;
let geometriaFlashCompartida = null;
let materialFlashCompartido = null;

function obtenerGeometriaBala() {
  if (!geometriaBalaCompartida) {
    geometriaBalaCompartida = new THREE.SphereGeometry(0.01, 4, 4);
  }
  return geometriaBalaCompartida;
}

function obtenerMaterialBala() {
  if (!materialBalaCompartido) {
    materialBalaCompartido = new THREE.MeshBasicMaterial({ visible: false });
  }
  return materialBalaCompartido;
}

// Geometría y material compartidos para muzzle flash (optimización)
function obtenerGeometriaFlash() {
  if (!geometriaFlashCompartida) {
    geometriaFlashCompartida = new THREE.PlaneGeometry(0.3, 0.3);
  }
  return geometriaFlashCompartida;
}

export class Bala {
  /**
   * @param {THREE.Scene} scene - Escena de Three.js
   * @param {THREE.Vector3} posicion - Posición inicial de la bala
   * @param {THREE.Vector3} direccion - Dirección de movimiento
   * @param {Function} onImpacto - Callback cuando la bala impacta un enemigo
   * @param {Object} configBala - Configuración específica de la bala (velocidad, daño, etc.)
   */
  constructor(scene, posicion, direccion, onImpacto = null, configBala = {}) {
    this.scene = scene;
    this.onImpactoCallback = onImpacto;
    
    // Configuración de la bala
    this.velocidadBala = configBala.velocidad || 30.0;
    this.dañoBala = configBala.daño || 20;
    
    // Usar geometría y material compartidos (optimización)
    this.mesh = new THREE.Mesh(obtenerGeometriaBala(), obtenerMaterialBala());
    this.mesh.position.copy(posicion);

    // Propiedades de movimiento
    this.direccion = direccion.clone().normalize();
    this.velocidad = this.direccion.clone().multiplyScalar(this.velocidadBala);
    this.tiempoVida = CONFIG.bala.tiempoVida;
    this.edad = 0;
    this.distanciaMaxima = CONFIG.bala.distanciaMaxima;
    this.posicionInicial = posicion.clone();
    this.haImpactado = false;

    // Raycaster para detección de colisiones
    this.raycaster = new THREE.Raycaster();

    scene.add(this.mesh);
    
    // Crear muzzle flash simple
    this.crearMuzzleFlash(posicion, direccion);
  }
  
  /**
   * Crea un muzzle flash simple y eficiente
   * @param {THREE.Vector3} posicion - Posición del disparo
   * @param {THREE.Vector3} direccion - Dirección del disparo
   */
  crearMuzzleFlash(posicion, direccion) {
    // Crear material para este flash (se destruye después)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    const flash = new THREE.Mesh(obtenerGeometriaFlash(), material);
    
    // Posicionar el flash cerca del arma
    const posFlash = posicion.clone();
    const arriba = new THREE.Vector3(0, 1, 0);
    const derecha = new THREE.Vector3().crossVectors(direccion, arriba).normalize();
    
    posFlash.add(derecha.multiplyScalar(0.2));
    posFlash.add(new THREE.Vector3(0, -0.1, 0));
    posFlash.add(direccion.clone().multiplyScalar(0.4));
    
    flash.position.copy(posFlash);
    flash.lookAt(posFlash.clone().add(direccion));
    
    this.scene.add(flash);
    
    // Remover después de 40ms (2-3 frames)
    setTimeout(() => {
      this.scene.remove(flash);
      material.dispose();
    }, 40);
  }


  /**
   * Verifica colisión con los enemigos
   * @param {Array} enemigos - Array de enemigos a verificar
   * @returns {boolean} - true si hubo colisión
   */
  verificarColision(enemigos) {
    if (this.haImpactado) return false;

    this.raycaster.set(this.mesh.position, this.direccion);

    for (let enemigo of enemigos) {
      if (!enemigo.datos.estaVivo) continue;

      const intersecciones = this.raycaster.intersectObject(enemigo.mesh);

      if (intersecciones.length > 0 && intersecciones[0].distance < 0.5) {
        this.haImpactado = true;
        this.alImpactar(enemigo);
        return true;
      }
    }

    return false;
  }

  /**
   * Ejecuta las acciones al impactar un enemigo
   * @param {Enemigo} enemigo - Enemigo impactado
   */
  alImpactar(enemigo) {
    // Aplicar daño al enemigo usando el daño específico de esta bala
    enemigo.recibirDaño(this.dañoBala);

    // Crear efecto de impacto
    this.crearEfectoImpacto(this.mesh.position);

    // Ejecutar callback si existe
    if (this.onImpactoCallback) {
      this.onImpactoCallback(enemigo, this.dañoBala);
    }
  }

  /**
   * Crea efecto visual de partículas al impactar
   * @param {THREE.Vector3} posicion - Posición del impacto
   */
  crearEfectoImpacto(posicion) {
    // Efecto simplificado - sin partículas para mejor rendimiento
  }

  /**
   * Crea efecto visual de impacto en pared (optimizado)
   * Requirements: 1.3 - Create impact effect when bullet hits wall
   * @param {THREE.Vector3} posicion - Posición del impacto
   * @param {THREE.Vector3} normal - Normal de la superficie impactada
   */
  crearEfectoImpactoPared(posicion, normal) {
    // Efecto mínimo: solo una marca de impacto sin partículas
    if (normal) {
      const geometriaMarca = new THREE.CircleGeometry(0.06, 6);
      const materialMarca = new THREE.MeshBasicMaterial({
        color: 0x222222,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const marca = new THREE.Mesh(geometriaMarca, materialMarca);
      marca.position.copy(posicion).add(normal.clone().multiplyScalar(0.01));
      marca.lookAt(posicion.clone().add(normal));
      this.scene.add(marca);

      // Remover marca después de 3 segundos
      setTimeout(() => {
        this.scene.remove(marca);
        geometriaMarca.dispose();
        materialMarca.dispose();
      }, 3000);
    }
  }

  /**
   * Actualiza la posición de la bala
   * Requirements: 1.3 - Deactivate bullet and create impact effect on collision
   * @param {number} deltaTime - Tiempo transcurrido desde el último frame
   * @returns {boolean} - false si la bala debe ser destruida
   */
  actualizar(deltaTime) {
    if (this.haImpactado) return false;
    
    this.edad += deltaTime;

    // Calcular movimiento deseado
    const movimiento = this.velocidad.clone().multiplyScalar(deltaTime);
    const posicionAnterior = this.mesh.position.clone();
    const posicionDeseada = posicionAnterior.clone().add(movimiento);
    
    // Requirements 1.1, 1.2: Verificar colisión con mapa antes de mover
    // Realizar raycast desde posición actual hacia la dirección de movimiento
    const distanciaMovimiento = movimiento.length();
    
    if (distanciaMovimiento > 0.001) {
      const resultado = raycastBala(
        posicionAnterior,
        this.direccion,
        distanciaMovimiento
      );
      
      // Requirements 1.3: Si hay colisión con el mapa, desactivar bala y crear efecto
      if (resultado && resultado.hit) {
        this.haImpactado = true;
        // Mover la bala al punto de impacto
        this.mesh.position.copy(resultado.punto);
        // Crear efecto de impacto en la pared
        this.crearEfectoImpactoPared(resultado.punto, resultado.normal);
        return false;
      }
    }
    
    // No hay colisión con mapa, mover la bala normalmente
    this.mesh.position.copy(posicionDeseada);

    // Verificar distancia recorrida
    const distanciaRecorrida = this.mesh.position.distanceTo(this.posicionInicial);

    // Verificar si debe destruirse
    if (
      this.edad >= this.tiempoVida ||
      distanciaRecorrida >= this.distanciaMaxima ||
      this.mesh.position.y < -10 ||
      this.mesh.position.y > 100
    ) {
      return false;
    }

    return true;
  }

  /**
   * Destruye la bala y libera recursos
   */
  destruir() {
    this.scene.remove(this.mesh);
    // No destruir geometría/material compartidos
  }

  /**
   * Obtiene la dirección de la bala
   * @returns {THREE.Vector3}
   */
  obtenerDireccion() {
    return this.direccion.clone();
  }
}
