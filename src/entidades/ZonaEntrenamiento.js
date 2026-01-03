/**
 * Clase ZonaEntrenamiento
 * Define un área del mapa para un tipo específico de bots de entrenamiento
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

export class ZonaEntrenamiento {
  /**
   * @param {Object} config - Configuración de la zona
   * @param {string} config.nombre - Nombre descriptivo de la zona
   * @param {string} config.tipo - Tipo de bots en la zona ('estatico', 'movil', 'tirador')
   * @param {Object} config.centro - Centro de la zona {x, y, z}
   * @param {number} config.radio - Radio de la zona
   */
  constructor(config) {
    this.nombre = config.nombre || 'Zona de Entrenamiento';
    this.tipo = config.tipo || 'estatico';
    this.centro = {
      x: config.centro?.x || 0,
      y: config.centro?.y || 1,
      z: config.centro?.z || 0
    };
    this.radio = config.radio || 15;
    this.activa = false;
  }

  /**
   * Verifica si un punto está dentro de la zona
   * Usa distancia euclidiana en el plano XZ (ignora altura Y)
   * 
   * Requirement 4.4: Activar bots cuando el jugador se acerca
   * 
   * @param {Object} punto - Punto a verificar {x, y, z} o THREE.Vector3
   * @returns {boolean} - true si el punto está dentro de la zona
   */
  contienePunto(punto) {
    if (!punto) return false;

    // Obtener coordenadas del punto
    const px = punto.x !== undefined ? punto.x : 0;
    const pz = punto.z !== undefined ? punto.z : 0;

    // Calcular distancia en el plano XZ (horizontal)
    const dx = px - this.centro.x;
    const dz = pz - this.centro.z;
    const distancia = Math.sqrt(dx * dx + dz * dz);

    return distancia <= this.radio;
  }

  /**
   * Activa la zona
   * Requirement 4.4: Activar bots de la zona
   */
  activar() {
    this.activa = true;
  }

  /**
   * Desactiva la zona
   */
  desactivar() {
    this.activa = false;
  }

  /**
   * Verifica si la zona está activa
   * @returns {boolean}
   */
  estaActiva() {
    return this.activa;
  }

  /**
   * Obtiene el nombre de la zona
   * @returns {string}
   */
  obtenerNombre() {
    return this.nombre;
  }

  /**
   * Obtiene el tipo de bots de la zona
   * @returns {string}
   */
  obtenerTipo() {
    return this.tipo;
  }

  /**
   * Obtiene el centro de la zona
   * @returns {Object} - {x, y, z}
   */
  obtenerCentro() {
    return { ...this.centro };
  }

  /**
   * Obtiene el radio de la zona
   * @returns {number}
   */
  obtenerRadio() {
    return this.radio;
  }

  /**
   * Genera una posición aleatoria dentro de la zona
   * Útil para posicionar bots
   * 
   * @returns {Object} - {x, y, z}
   */
  generarPosicionAleatoria() {
    // Generar punto aleatorio dentro del círculo
    const angulo = Math.random() * Math.PI * 2;
    const distancia = Math.random() * this.radio * 0.8; // 80% del radio para margen

    return {
      x: this.centro.x + Math.cos(angulo) * distancia,
      y: this.centro.y,
      z: this.centro.z + Math.sin(angulo) * distancia
    };
  }
}
