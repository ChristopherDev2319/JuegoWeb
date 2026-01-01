/**
 * Clase Bala
 * Representa un proyectil disparado por el jugador
 * 
 * Requirements: 1.1, 1.2, 1.3
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';
import { raycastBala } from '../sistemas/colisiones.js';

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
    
    // Configuración de la bala (usar valores por defecto si no se especifican)
    this.velocidadBala = configBala.velocidad || 30.0;
    this.dañoBala = configBala.daño || 20;
    
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
    this.velocidad = this.direccion.clone().multiplyScalar(this.velocidadBala);
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
   * Crea efecto visual de impacto en pared
   * Requirements: 1.3 - Create impact effect when bullet hits wall
   * @param {THREE.Vector3} posicion - Posición del impacto
   * @param {THREE.Vector3} normal - Normal de la superficie impactada
   */
  crearEfectoImpactoPared(posicion, normal) {
    // Crear destello de impacto
    const geometriaDestello = new THREE.SphereGeometry(0.06, 6, 6);
    const materialDestello = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.8
    });
    const destello = new THREE.Mesh(geometriaDestello, materialDestello);
    destello.position.copy(posicion);
    this.scene.add(destello);

    // Desvanecer el destello
    let opacidad = 0.8;
    const desvanecerDestello = () => {
      opacidad -= 0.08;
      materialDestello.opacity = opacidad;
      if (opacidad > 0) {
        requestAnimationFrame(desvanecerDestello);
      } else {
        this.scene.remove(destello);
        geometriaDestello.dispose();
        materialDestello.dispose();
      }
    };
    requestAnimationFrame(desvanecerDestello);

    // Crear partículas de escombros que salen en dirección de la normal
    const numParticulas = 6;
    for (let i = 0; i < numParticulas; i++) {
      const geometria = new THREE.BoxGeometry(0.03, 0.03, 0.03);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x888888,
        transparent: true,
        opacity: 0.9
      });
      const particula = new THREE.Mesh(geometria, material);
      particula.position.copy(posicion);

      // Calcular dirección de la partícula basada en la normal
      const direccionBase = normal ? normal.clone() : new THREE.Vector3(0, 1, 0);
      const velocidad = new THREE.Vector3(
        direccionBase.x + (Math.random() - 0.5) * 0.8,
        direccionBase.y + Math.random() * 0.5,
        direccionBase.z + (Math.random() - 0.5) * 0.8
      ).multiplyScalar(0.15);

      this.scene.add(particula);

      let vida = 0;
      const gravedad = -0.01;
      const animar = () => {
        vida += 0.016;
        velocidad.y += gravedad;
        particula.position.add(velocidad);
        material.opacity = Math.max(0, 0.9 - vida * 2);

        if (vida > 0.4) {
          this.scene.remove(particula);
          geometria.dispose();
          material.dispose();
        } else {
          requestAnimationFrame(animar);
        }
      };
      animar();
    }

    // Crear marca de impacto (decal simplificado)
    if (normal) {
      const geometriaMarca = new THREE.CircleGeometry(0.08, 8);
      const materialMarca = new THREE.MeshBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      const marca = new THREE.Mesh(geometriaMarca, materialMarca);
      
      // Posicionar ligeramente fuera de la superficie
      marca.position.copy(posicion).add(normal.clone().multiplyScalar(0.01));
      
      // Orientar la marca hacia la normal de la superficie
      marca.lookAt(posicion.clone().add(normal));
      
      this.scene.add(marca);

      // Desvanecer la marca después de un tiempo
      setTimeout(() => {
        let opacidadMarca = 0.6;
        const desvanecerMarca = () => {
          opacidadMarca -= 0.02;
          materialMarca.opacity = opacidadMarca;
          if (opacidadMarca > 0) {
            requestAnimationFrame(desvanecerMarca);
          } else {
            this.scene.remove(marca);
            geometriaMarca.dispose();
            materialMarca.dispose();
          }
        };
        desvanecerMarca();
      }, 2000);
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
