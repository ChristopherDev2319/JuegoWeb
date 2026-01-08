/**
 * Clase BotManager
 * Gestor central que coordina todos los bots de entrenamiento distribuidos por el mapa
 * 
 * @requires THREE - Three.js debe estar disponible globalmente
 */

import { CONFIG } from '../config.js';
import { BotEstatico } from '../entidades/BotEstatico.js';
import { BotMovil } from '../entidades/BotMovil.js';
import { BotTirador } from '../entidades/BotTirador.js';
import { EstadisticasEntrenamiento } from '../entidades/EstadisticasEntrenamiento.js';

export class BotManager {
  /**
   * @param {THREE.Scene} scene - Escena de Three.js
   * @param {Object} [opciones] - Opciones adicionales
   * @param {Function} [opciones.onDisparoBot] - Callback cuando un bot tirador dispara
   * @param {Array} [opciones.obstaculos] - Lista de meshes para verificar obstrucciones
   * @param {Function} [opciones.onEliminacion] - Callback cuando se elimina un bot (tipo, estadisticas)
   * @param {Function} [opciones.onEstadisticasActualizadas] - Callback cuando se actualizan las estadísticas
   */
  constructor(scene, opciones = {}) {
    this.scene = scene;
    this.opciones = opciones;
    
    // Colecciones de bots por tipo
    this.bots = {
      estaticos: [],
      moviles: [],
      tiradores: []
    };
    
    // Sistema de estadísticas
    this.estadisticas = new EstadisticasEntrenamiento();
    
    // Estado del manager
    this.activo = false;
    this.inicializado = false;
    
    // Callback para disparos de bots tiradores
    this.onDisparoBot = opciones.onDisparoBot || null;
    
    // Obstáculos para línea de visión
    this.obstaculos = opciones.obstaculos || [];
    
    // Callbacks para UI de entrenamiento
    this.onEliminacion = opciones.onEliminacion || null;
    this.onEstadisticasActualizadas = opciones.onEstadisticasActualizadas || null;
  }

  /**
   * Inicializa el sistema de bots creando y distribuyendo bots por el mapa
   * Property 1: Inicialización correcta del sistema de bots
   */
  inicializar() {
    if (this.inicializado) {
      console.warn('BotManager ya está inicializado');
      return;
    }

    // Crear bots distribuidos por el mapa (sin zonas)
    this.crearBots();

    this.activo = true;
    this.inicializado = true;
  }

  /**
   * Posiciones FIJAS para los bots (configurables manualmente)
   * Coordenadas: X = izquierda(-)/derecha(+), Z = atrás(-)/adelante(+)
   */
  obtenerPosicionesFijas() {
    return {
      // Bots estáticos (4) - para práctica de puntería
      estaticos: [
        { x: 0, y: 0, z: 10 },    // Adelante del spawn bot 1
        { x: 3.5, y: 5, z: 3, rotacion: Math.PI },    // A la derecha, rotado 180° para ver hacia z+
        { x: 15, y: 0, z: 0 },   // A la izquierda
        { x: -6, y: 5.3, z: 32 }    // Adelante-izquierda bot 2
      ],
      // Bots móviles (3) - para práctica de tracking
      moviles: [
        { x: 10, y: 5.3, z: 36 },   // Derecha-adelante
        { x: 0, y: 0, z: -25 },  // Izquierda-adelante //
        { x: -10, y: 5, z: -35 }    // Atrás bot 3
      ],
      // Bot tirador (1) - para práctica de reacción
      tiradores: [
        { x: -15, y: 0, z: 20 }     // Adelante, mirando hacia el spawn
      ]
    };
  }

  /**
   * Crea todos los bots en posiciones FIJAS
   */
  crearBots() {
    const posiciones = this.obtenerPosicionesFijas();
    
    // Crear bots estáticos
    for (const pos of posiciones.estaticos) {
      const bot = this.crearBot('estatico', pos.x, pos.y, pos.z);
      // Aplicar rotación si está definida
      if (bot && pos.rotacion !== undefined) {
        bot.mesh.rotation.y = pos.rotacion;
      }
    }
    
    // Crear bots móviles
    for (const pos of posiciones.moviles) {
      const bot = this.crearBot('movil', pos.x, pos.y, pos.z);
      if (bot && pos.rotacion !== undefined) {
        bot.mesh.rotation.y = pos.rotacion;
      }
    }
    
    // Crear bots tiradores
    for (const pos of posiciones.tiradores) {
      const bot = this.crearBot('tirador', pos.x, pos.y, pos.z);
      if (bot && pos.rotacion !== undefined) {
        bot.mesh.rotation.y = pos.rotacion;
      }
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
   * Actualiza todos los bots
   * Requirements: 6.1, 6.2, 6.3 - Sin lógica de zonas
   * 
   * @param {number} deltaTime - Tiempo desde la última actualización en ms
   * @param {THREE.Vector3|Object} [jugadorPos] - Posición del jugador
   */
  actualizar(deltaTime, jugadorPos = null) {
    if (!this.activo || !this.inicializado) return;

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
   * Registra la eliminación de un bot y actualiza estadísticas
   * Requirement 6.2: Incrementar contador correspondiente al tipo de bot
   * Property 7: Contador de eliminaciones incrementa correctamente
   * 
   * @param {string} tipoBot - Tipo de bot eliminado
   */
  registrarEliminacion(tipoBot) {
    this.estadisticas.registrarEliminacion(tipoBot);
    
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
   * Alias para obtenerBotsVivos - usado por el sistema de cuchillo
   * @returns {Array<BotBase>}
   */
  obtenerBots() {
    return this.obtenerBotsVivos();
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

    // Limpiar referencias
    this.scene = null;
    this.obstaculos = [];
    this.onDisparoBot = null;

    this.activo = false;
    this.inicializado = false;
  }
}
