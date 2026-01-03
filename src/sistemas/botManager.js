/**
 * Clase BotManager
 * Gestor central que coordina todos los bots de entrenamiento y zonas
 * 
 * Requirements: 1.1, 2.1, 3.1, 4.1, 4.2, 4.3, 4.4, 6.2
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';
import { BotEstatico } from '../entidades/BotEstatico.js';
import { BotMovil } from '../entidades/BotMovil.js';
import { BotTirador } from '../entidades/BotTirador.js';
import { ZonaEntrenamiento } from '../entidades/ZonaEntrenamiento.js';
import { EstadisticasEntrenamiento } from '../entidades/EstadisticasEntrenamiento.js';

export class BotManager {
  /**
   * @param {THREE.Scene} scene - Escena de Three.js
   * @param {Object} [opciones] - Opciones adicionales
   * @param {Function} [opciones.onDisparoBot] - Callback cuando un bot tirador dispara
   * @param {Array} [opciones.obstaculos] - Lista de meshes para verificar obstrucciones
   * @param {Function} [opciones.onEliminacion] - Callback cuando se elimina un bot (tipo, estadisticas)
   * @param {Function} [opciones.onEntrarZona] - Callback cuando el jugador entra en una zona (nombreZona, tipoZona)
   * @param {Function} [opciones.onSalirZona] - Callback cuando el jugador sale de una zona (nombreZona, tipoZona)
   * @param {Function} [opciones.onEstadisticasActualizadas] - Callback cuando se actualizan las estadísticas
   */
  constructor(scene, opciones = {}) {
    this.scene = scene;
    this.opciones = opciones;
    
    // Colecciones de bots por tipo
    // Requirements: 1.1, 2.1, 3.1
    this.bots = {
      estaticos: [],
      moviles: [],
      tiradores: []
    };
    
    // Zonas de entrenamiento
    // Requirements: 4.1, 4.2, 4.3
    this.zonas = [];
    
    // Sistema de estadísticas
    // Requirement 6.2
    this.estadisticas = new EstadisticasEntrenamiento();
    
    // Estado del manager
    this.activo = false;
    this.inicializado = false;
    
    // Callback para disparos de bots tiradores
    this.onDisparoBot = opciones.onDisparoBot || null;
    
    // Obstáculos para línea de visión
    this.obstaculos = opciones.obstaculos || [];
    
    // Callbacks para UI de entrenamiento
    // Requirements: 6.1, 6.2, 4.4
    this.onEliminacion = opciones.onEliminacion || null;
    this.onEntrarZona = opciones.onEntrarZona || null;
    this.onSalirZona = opciones.onSalirZona || null;
    this.onEstadisticasActualizadas = opciones.onEstadisticasActualizadas || null;
  }

  /**
   * Inicializa el sistema de bots creando zonas y bots
   * Property 1: Inicialización correcta del sistema de bots
   * Requirements: 1.1, 2.1, 3.1, 4.1, 4.2, 4.3
   */
  inicializar() {
    if (this.inicializado) {
      console.warn('BotManager ya está inicializado');
      return;
    }

    console.log('Inicializando sistema de bots de entrenamiento...');

    // Crear zonas de entrenamiento
    this.crearZonas();

    // Crear bots en cada zona
    this.crearBotsEnZonas();

    this.activo = true;
    this.inicializado = true;

    console.log(`Sistema de bots inicializado: ${this.obtenerTotalBots()} bots en ${this.zonas.length} zonas`);
  }


  /**
   * Crea las zonas de entrenamiento basadas en la configuración
   * Requirements: 4.1, 4.2, 4.3
   */
  crearZonas() {
    const configZonas = CONFIG.botsEntrenamiento.zonas;

    // Requirement 4.1: Crear zona de bots estáticos
    this.zonas.push(new ZonaEntrenamiento({
      nombre: configZonas.estaticos.nombre || 'Zona de Puntería',
      tipo: 'estatico',
      centro: configZonas.estaticos.centro,
      radio: configZonas.estaticos.radio
    }));

    // Requirement 4.2: Crear zona de bots móviles
    this.zonas.push(new ZonaEntrenamiento({
      nombre: configZonas.moviles.nombre || 'Zona de Tracking',
      tipo: 'movil',
      centro: configZonas.moviles.centro,
      radio: configZonas.moviles.radio
    }));

    // Requirement 4.3: Crear zona de bots tiradores
    this.zonas.push(new ZonaEntrenamiento({
      nombre: configZonas.tiradores.nombre || 'Zona de Reacción',
      tipo: 'tirador',
      centro: configZonas.tiradores.centro,
      radio: configZonas.tiradores.radio
    }));

    console.log(`Creadas ${this.zonas.length} zonas de entrenamiento`);
  }

  /**
   * Crea bots en todas las zonas
   */
  crearBotsEnZonas() {
    for (const zona of this.zonas) {
      this.crearBotsEnZona(zona);
    }
  }

  /**
   * Crea bots de un tipo específico en una zona
   * Requirements: 1.1, 2.1, 3.1
   * 
   * @param {ZonaEntrenamiento} zona - Zona donde crear los bots
   */
  crearBotsEnZona(zona) {
    const tipo = zona.obtenerTipo();
    let cantidad = 0;
    
    // Obtener cantidad de bots según el tipo
    switch (tipo) {
      case 'estatico':
        cantidad = CONFIG.botsEntrenamiento.estatico.cantidad || 5;
        break;
      case 'movil':
        cantidad = CONFIG.botsEntrenamiento.movil.cantidad || 4;
        break;
      case 'tirador':
        cantidad = CONFIG.botsEntrenamiento.tirador.cantidad || 3;
        break;
    }

    console.log(`Creando ${cantidad} bots ${tipo}s en ${zona.obtenerNombre()}`);

    for (let i = 0; i < cantidad; i++) {
      const posicion = zona.generarPosicionAleatoria();
      this.crearBot(tipo, posicion.x, posicion.y, posicion.z);
    }
  }

  /**
   * Crea un bot individual del tipo especificado
   * 
   * @param {string} tipo - Tipo de bot ('estatico', 'movil', 'tirador')
   * @param {number} x - Posición X
   * @param {number} y - Posición Y
   * @param {number} z - Posición Z
   * @returns {BotBase|null} - El bot creado o null si el tipo es inválido
   */
  crearBot(tipo, x, y, z) {
    let bot = null;

    switch (tipo) {
      case 'estatico':
        // Requirement 1.1: Crear bots estáticos
        bot = new BotEstatico(this.scene, x, y, z);
        this.bots.estaticos.push(bot);
        break;

      case 'movil':
        // Requirement 2.1: Crear bots móviles
        bot = new BotMovil(this.scene, x, y, z);
        this.bots.moviles.push(bot);
        break;

      case 'tirador':
        // Requirement 3.1: Crear bots tiradores
        bot = new BotTirador(this.scene, x, y, z, {
          onDisparo: this.onDisparoBot,
          obstaculos: this.obstaculos
        });
        this.bots.tiradores.push(bot);
        break;

      default:
        console.warn(`Tipo de bot desconocido: ${tipo}`);
        return null;
    }

    return bot;
  }


  /**
   * Actualiza todos los bots y verifica activación de zonas
   * Requirement 4.4: Activar bots cuando el jugador se acerca
   * 
   * @param {number} deltaTime - Tiempo desde la última actualización en ms
   * @param {THREE.Vector3|Object} [jugadorPos] - Posición del jugador
   */
  actualizar(deltaTime, jugadorPos = null) {
    if (!this.activo || !this.inicializado) return;

    // Actualizar estado de zonas basado en posición del jugador
    // Requirement 4.4: Activar bots cuando el jugador se acerca
    if (jugadorPos) {
      this.actualizarZonas(jugadorPos);
    }

    // Actualizar bots estáticos
    for (const bot of this.bots.estaticos) {
      bot.actualizar(deltaTime);
    }

    // Actualizar bots móviles
    for (const bot of this.bots.moviles) {
      bot.actualizar(deltaTime);
    }

    // Actualizar bots tiradores (necesitan posición del jugador)
    for (const bot of this.bots.tiradores) {
      bot.actualizar(deltaTime, jugadorPos);
    }
  }

  /**
   * Actualiza el estado de activación de las zonas
   * Requirement 4.4: Activar bots cuando el jugador se acerca
   * 
   * @param {THREE.Vector3|Object} jugadorPos - Posición del jugador
   */
  actualizarZonas(jugadorPos) {
    for (const zona of this.zonas) {
      const estabaActiva = zona.estaActiva();
      const jugadorEnZona = zona.contienePunto(jugadorPos);

      if (jugadorEnZona && !estabaActiva) {
        zona.activar();
        this.onJugadorEntraZona(zona);
      } else if (!jugadorEnZona && estabaActiva) {
        zona.desactivar();
        this.onJugadorSaleZona(zona);
      }
    }
  }

  /**
   * Callback cuando el jugador entra en una zona
   * Requirement 4.4: Mostrar nombre de zona cuando el jugador entra
   * @param {ZonaEntrenamiento} zona - Zona en la que entró el jugador
   */
  onJugadorEntraZona(zona) {
    console.log(`Jugador entró en: ${zona.obtenerNombre()}`);
    
    // Llamar callback de UI si está configurado
    // Requirement 4.4: Mostrar nombre de zona cuando el jugador entra
    if (this.onEntrarZona) {
      this.onEntrarZona(zona.obtenerNombre(), zona.obtenerTipo());
    }
  }

  /**
   * Callback cuando el jugador sale de una zona
   * @param {ZonaEntrenamiento} zona - Zona de la que salió el jugador
   */
  onJugadorSaleZona(zona) {
    console.log(`Jugador salió de: ${zona.obtenerNombre()}`);
    
    // Llamar callback de UI si está configurado
    if (this.onSalirZona) {
      this.onSalirZona(zona.obtenerNombre(), zona.obtenerTipo());
    }
  }

  /**
   * Registra la eliminación de un bot y actualiza estadísticas
   * Requirement 6.2: Incrementar contador correspondiente al tipo de bot
   * Property 7: Contador de eliminaciones incrementa correctamente
   * 
   * @param {string} tipoBot - Tipo de bot eliminado
   */
  registrarEliminacion(tipoBot) {
    this.estadisticas.registrarEliminacion(tipoBot);
    console.log(`Bot ${tipoBot} eliminado. Total: ${this.estadisticas.obtenerTotalEliminaciones()}`);
    
    // Llamar callback de UI si está configurado
    // Requirement 6.2: Actualizar UI cuando se elimina un bot
    if (this.onEliminacion) {
      this.onEliminacion(tipoBot, this.estadisticas.obtenerEstadisticas());
    }
    
    // Notificar actualización de estadísticas
    if (this.onEstadisticasActualizadas) {
      this.onEstadisticasActualizadas(this.estadisticas.obtenerEstadisticas());
    }
  }

  /**
   * Registra un impacto recibido por el jugador
   */
  registrarImpactoRecibido() {
    this.estadisticas.registrarImpactoRecibido();
  }

  /**
   * Registra un disparo realizado por el jugador
   */
  registrarDisparo() {
    this.estadisticas.registrarDisparo();
  }

  /**
   * Registra un acierto del jugador
   */
  registrarAcierto() {
    this.estadisticas.registrarAcierto();
  }

  /**
   * Obtiene las estadísticas de entrenamiento
   * @returns {Object} - Objeto con todas las estadísticas
   */
  obtenerEstadisticas() {
    return this.estadisticas.obtenerEstadisticas();
  }

  /**
   * Reinicia las estadísticas de entrenamiento
   */
  reiniciarEstadisticas() {
    this.estadisticas.reiniciar();
  }


  /**
   * Obtiene todos los bots como un array plano
   * @returns {Array<BotBase>}
   */
  obtenerTodosBots() {
    return [
      ...this.bots.estaticos,
      ...this.bots.moviles,
      ...this.bots.tiradores
    ];
  }

  /**
   * Obtiene los bots de un tipo específico
   * @param {string} tipo - Tipo de bot
   * @returns {Array<BotBase>}
   */
  obtenerBotsPorTipo(tipo) {
    const tipoNormalizado = tipo + 's'; // estatico -> estaticos
    return this.bots[tipoNormalizado] || [];
  }

  /**
   * Obtiene el total de bots creados
   * @returns {number}
   */
  obtenerTotalBots() {
    return this.bots.estaticos.length + 
           this.bots.moviles.length + 
           this.bots.tiradores.length;
  }

  /**
   * Obtiene los bots vivos
   * @returns {Array<BotBase>}
   */
  obtenerBotsVivos() {
    return this.obtenerTodosBots().filter(bot => bot.estaVivo());
  }

  /**
   * Obtiene todas las zonas de entrenamiento
   * @returns {Array<ZonaEntrenamiento>}
   */
  obtenerZonas() {
    return this.zonas;
  }

  /**
   * Obtiene la zona activa actual (donde está el jugador)
   * @returns {ZonaEntrenamiento|null}
   */
  obtenerZonaActiva() {
    return this.zonas.find(zona => zona.estaActiva()) || null;
  }

  /**
   * Obtiene todos los meshes de los bots para detección de colisiones
   * @returns {Array<THREE.Mesh>}
   */
  obtenerMeshesBots() {
    return this.obtenerTodosBots()
      .filter(bot => bot.mesh)
      .map(bot => bot.mesh);
  }

  /**
   * Busca un bot por su mesh
   * @param {THREE.Mesh} mesh - Mesh del bot
   * @returns {BotBase|null}
   */
  buscarBotPorMesh(mesh) {
    if (!mesh || !mesh.userData || !mesh.userData.bot) {
      return null;
    }
    return mesh.userData.bot;
  }

  /**
   * Establece los obstáculos para los bots tiradores
   * @param {Array<THREE.Object3D>} obstaculos - Lista de meshes
   */
  establecerObstaculos(obstaculos) {
    this.obstaculos = obstaculos || [];
    
    // Actualizar obstáculos en todos los bots tiradores
    for (const bot of this.bots.tiradores) {
      bot.establecerObstaculos(this.obstaculos);
    }
  }

  /**
   * Establece el callback para disparos de bots tiradores
   * @param {Function} callback - Función a llamar cuando un bot dispara
   */
  establecerCallbackDisparo(callback) {
    this.onDisparoBot = callback;
    
    // Actualizar callback en todos los bots tiradores
    for (const bot of this.bots.tiradores) {
      bot.establecerCallbackDisparo(callback);
    }
  }

  /**
   * Verifica si el manager está activo
   * @returns {boolean}
   */
  estaActivo() {
    return this.activo;
  }

  /**
   * Verifica si el manager está inicializado
   * @returns {boolean}
   */
  estaInicializado() {
    return this.inicializado;
  }

  /**
   * Pausa el sistema de bots
   */
  pausar() {
    this.activo = false;
  }

  /**
   * Reanuda el sistema de bots
   */
  reanudar() {
    if (this.inicializado) {
      this.activo = true;
    }
  }

  /**
   * Destruye el manager y limpia todos los recursos
   */
  destruir() {
    console.log('Destruyendo sistema de bots...');

    // Destruir todos los bots
    for (const bot of this.obtenerTodosBots()) {
      bot.destruir();
    }

    // Limpiar colecciones
    this.bots = {
      estaticos: [],
      moviles: [],
      tiradores: []
    };
    this.zonas = [];

    // Limpiar referencias
    this.scene = null;
    this.obstaculos = [];
    this.onDisparoBot = null;

    this.activo = false;
    this.inicializado = false;

    console.log('Sistema de bots destruido');
  }
}
