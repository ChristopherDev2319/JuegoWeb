/**
 * Clase Bala
 * Representa un proyectil disparado por el jugador
 * 
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';

export class Bala {
  /**
   * @param {THREE.Scene} scene - Escena de Three.js
   * @param {THREE.Vector3} posicion - Posición inicial de la bala
   * @param {THREE.Vector3} direccion - Dirección de movimiento
   * @param {Function} onImpacto - Callback cuando la bala impacta un enemigo
   */
  constructor(scene, posicion, direccion, onImpacto = null) {
    this.scene = scene;
    this.onImpactoCallback = onImpacto;
    
    // Crear mesh de la bala
    const geometria = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 6);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });

    this.mesh = new THREE.Mesh(geometria, material);
    this.mesh.castShadow = true;
    this.mesh.position.copy(posicion);

    // Orientar la bala en la dirección de movimiento
    this.mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direccion.clone().normalize()
    );

    // Propiedades de movimiento
    this.direccion = direccion.clone().normalize();
    this.velocidad = this.direccion.clone().multiplyScalar(CONFIG.arma.velocidadBala);
    this.tiempoVida = CONFIG.bala.tiempoVida;
    this.edad = 0;
    this.distanciaMaxima = CONFIG.bala.distanciaMaxima;
    this.posicionInicial = posicion.clone();
    this.haImpactado = false;

    // Raycaster para detección de colisiones
    this.raycaster = new THREE.Raycaster();

    scene.add(this.mesh);
    this.crearDestelloDisparo(posicion);
  }

  /**
   * Crea el efecto visual del destello del disparo
   * @param {THREE.Vector3} posicion - Posición del destello
   */
  crearDestelloDisparo(posicion) {
    const geometriaDestello = new THREE.SphereGeometry(0.08, 8, 8);
    const materialDestello = new THREE.MeshBasicMaterial({
      color: 0xffdd00,
      transparent: true,
      opacity: 0.7
    });
    const destello = new THREE.Mesh(geometriaDestello, materialDestello);
    destello.position.copy(posicion);
    this.scene.add(destello);

    setTimeout(() => {
      this.scene.remove(destello);
      geometriaDestello.dispose();
      materialDestello.dispose();
    }, 100);
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
    // Aplicar daño al enemigo
    enemigo.recibirDaño(CONFIG.arma.daño);

    // Crear efecto de impacto
    this.crearEfectoImpacto(this.mesh.position);

    // Ejecutar callback si existe
    if (this.onImpactoCallback) {
      this.onImpactoCallback(enemigo, CONFIG.arma.daño);
    }
  }

  /**
   * Crea efecto visual de partículas al impactar
   * @param {THREE.Vector3} posicion - Posición del impacto
   */
  crearEfectoImpacto(posicion) {
    const particulas = 8;
    for (let i = 0; i < particulas; i++) {
      const geometria = new THREE.SphereGeometry(0.05, 4, 4);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const particula = new THREE.Mesh(geometria, material);

      particula.position.copy(posicion);

      const velocidad = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );

      this.scene.add(particula);

      let vida = 0;
      const animar = () => {
        vida += 0.016;
        particula.position.add(velocidad.clone().multiplyScalar(0.05));

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
   * Actualiza la posición de la bala
   * @param {number} deltaTime - Tiempo transcurrido desde el último frame
   * @returns {boolean} - false si la bala debe ser destruida
   */
  actualizar(deltaTime) {
    this.edad += deltaTime;

    // Mover la bala
    const movimiento = this.velocidad.clone().multiplyScalar(deltaTime);
    this.mesh.position.add(movimiento);

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
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }

  /**
   * Obtiene la dirección de la bala
   * @returns {THREE.Vector3}
   */
  obtenerDireccion() {
    return this.direccion.clone();
  }
}
