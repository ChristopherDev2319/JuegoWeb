/**
 * Clase EstadisticasEntrenamiento
 * Rastrea el progreso del jugador durante el entrenamiento
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

export class EstadisticasEntrenamiento {
  constructor() {
    // Requirement 6.1, 6.2: Contador de bots eliminados por tipo
    this.eliminaciones = {
      estaticos: 0,
      moviles: 0,
      tiradores: 0
    };

    // Requirement 6.3: Registro de impactos recibidos
    this.impactosRecibidos = 0;

    // Para cálculo de precisión
    this.disparosRealizados = 0;
    this.impactosAcertados = 0;

    // Timestamps para estadísticas de tiempo
    this.tiempoInicio = performance.now();
    this.tiemposReaccion = []; // Array de tiempos de reacción en ms
  }

  /**
   * Registra la eliminación de un bot
   * Requirement 6.2: Incrementar contador correspondiente al tipo de bot
   * Property 7: Contador de eliminaciones incrementa correctamente
   * 
   * @param {string} tipo - Tipo de bot eliminado ('estatico', 'movil', 'tirador')
   */
  registrarEliminacion(tipo) {
    // Normalizar tipo a plural para coincidir con las claves
    const tipoNormalizado = this.normalizarTipo(tipo);
    
    if (this.eliminaciones.hasOwnProperty(tipoNormalizado)) {
      this.eliminaciones[tipoNormalizado] += 1;
    }
  }

  /**
   * Normaliza el tipo de bot a la clave del objeto eliminaciones
   * @param {string} tipo - Tipo de bot
   * @returns {string} - Tipo normalizado
   */
  normalizarTipo(tipo) {
    const mapeo = {
      'estatico': 'estaticos',
      'estaticos': 'estaticos',
      'movil': 'moviles',
      'moviles': 'moviles',
      'tirador': 'tiradores',
      'tiradores': 'tiradores'
    };
    return mapeo[tipo] || tipo;
  }

  /**
   * Registra un impacto recibido de un bot tirador
   * Requirement 6.3: Registrar impacto recibido
   */
  registrarImpactoRecibido() {
    this.impactosRecibidos += 1;
  }

  /**
   * Registra un disparo realizado por el jugador
   */
  registrarDisparo() {
    this.disparosRealizados += 1;
  }

  /**
   * Registra un impacto acertado por el jugador
   */
  registrarAcierto() {
    this.impactosAcertados += 1;
  }

  /**
   * Registra un tiempo de reacción (tiempo entre ver enemigo y disparar)
   * @param {number} tiempoMs - Tiempo de reacción en milisegundos
   */
  registrarTiempoReaccion(tiempoMs) {
    if (tiempoMs > 0 && tiempoMs < 10000) { // Filtrar valores absurdos
      this.tiemposReaccion.push(tiempoMs);
    }
  }

  /**
   * Calcula la precisión del jugador
   * Requirement 6.4: Mostrar precisión
   * 
   * @returns {number} - Precisión como porcentaje (0-100)
   */
  obtenerPrecision() {
    if (this.disparosRealizados === 0) return 0;
    return (this.impactosAcertados / this.disparosRealizados) * 100;
  }

  /**
   * Calcula el tiempo de reacción promedio
   * Requirement 6.4: Mostrar tiempo de reacción promedio
   * 
   * @returns {number} - Tiempo promedio en ms, o 0 si no hay datos
   */
  obtenerTiempoReaccionPromedio() {
    if (this.tiemposReaccion.length === 0) return 0;
    const suma = this.tiemposReaccion.reduce((a, b) => a + b, 0);
    return suma / this.tiemposReaccion.length;
  }

  /**
   * Obtiene el total de eliminaciones
   * @returns {number}
   */
  obtenerTotalEliminaciones() {
    return this.eliminaciones.estaticos + 
           this.eliminaciones.moviles + 
           this.eliminaciones.tiradores;
  }

  /**
   * Obtiene las eliminaciones por tipo
   * @param {string} tipo - Tipo de bot
   * @returns {number}
   */
  obtenerEliminacionesPorTipo(tipo) {
    const tipoNormalizado = this.normalizarTipo(tipo);
    return this.eliminaciones[tipoNormalizado] || 0;
  }

  /**
   * Obtiene el tiempo de sesión en segundos
   * @returns {number}
   */
  obtenerTiempoSesion() {
    return (performance.now() - this.tiempoInicio) / 1000;
  }

  /**
   * Obtiene todas las estadísticas como objeto
   * Requirement 6.4: Mostrar estadísticas completas
   * 
   * @returns {Object} - Objeto con todas las estadísticas
   */
  obtenerEstadisticas() {
    return {
      eliminaciones: { ...this.eliminaciones },
      totalEliminaciones: this.obtenerTotalEliminaciones(),
      impactosRecibidos: this.impactosRecibidos,
      disparosRealizados: this.disparosRealizados,
      impactosAcertados: this.impactosAcertados,
      precision: this.obtenerPrecision(),
      tiempoReaccionPromedio: this.obtenerTiempoReaccionPromedio(),
      tiempoSesion: this.obtenerTiempoSesion()
    };
  }

  /**
   * Reinicia todas las estadísticas
   */
  reiniciar() {
    this.eliminaciones = {
      estaticos: 0,
      moviles: 0,
      tiradores: 0
    };
    this.impactosRecibidos = 0;
    this.disparosRealizados = 0;
    this.impactosAcertados = 0;
    this.tiemposReaccion = [];
    this.tiempoInicio = performance.now();
  }
}
