/**
 * WorkerServer - Servidor de juego que corre en cada worker del cluster
 * 
 * Este módulo adapta el código de server/index.js para ejecutarse como
 * un proceso worker dentro del sistema de clustering.
 * 
 * Cada worker mantiene:
 * - Su propio RoomManager con salas independientes
 * - Sus propias conexiones WebSocket
 * - Reporte periódico de métricas al master
 * - Limpieza automática de salas vacías
 * 
 * Requirements: 2.4, 3.1, 5.1
 */

import cluster from 'cluster';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

import { GameManager } from '../gameManager.js';
import { SERVER_CONFIG } from '../config.js';
import { serializeMessage, deserializeMessage } from '../serialization.js';
import { RoomManager } from '../rooms/roomManager.js';
import { encontrarMejorSala } from '../rooms/matchmaking.js';
import { CLUSTER_CONFIG } from './config.js';
import { 
  getIPCHandler, 
  createIPCMessage, 
  IPCMessageType 
} from './ipcHandler.js';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Mensajes de error estandarizados para operaciones de lobby
 */
const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: 'Sala no encontrada',
  WRONG_PASSWORD: 'Contraseña incorrecta',
  ROOM_FULL: 'Partida llena',
  MATCHMAKING_FAILED: 'No se pudo encontrar partida',
  UNKNOWN_ACTION: 'Acción no reconocida'
};

/**
 * WorkerServer - Servidor de juego para un worker del cluster
 */
export class WorkerServer {
  constructor() {
    /** @type {number} ID del worker */
    this.workerId = cluster.worker?.id || 0;
    
    /** @type {RoomManager} Gestor de salas independiente */
    this.roomManager = new RoomManager();
    
    /** @type {Map<string, WebSocket>} Conexiones WebSocket por playerId */
    this.connections = new Map();
    
    /** @type {Map<string, string>} Mapeo de playerId a roomId */
    this.playerRooms = new Map();
    
    /** @type {GameManager} GameManager legacy para jugadores sin sala */
    this.gameManager = new GameManager();
    
    /** @type {Object} Servidor HTTP */
    this.server = null;
    
    /** @type {WebSocketServer} Servidor WebSocket */
    this.wss = null;
    
    /** @type {NodeJS.Timeout} Intervalo del game loop */
    this.tickInterval = null;
    
    /** @type {NodeJS.Timeout} Intervalo de limpieza de salas */
    this.cleanupInterval = null;
    
    /** @type {NodeJS.Timeout} Intervalo de reporte de métricas */
    this.metricsInterval = null;
    
    /** @type {boolean} Flag de shutdown en progreso */
    this.isShuttingDown = false;
    
    /** @type {Object} IPC Handler */
    this.ipcHandler = getIPCHandler();
  }

  /**
   * Inicia el servidor worker
   * Requirement 3.1: Worker ejecuta instancia independiente del servidor
   */
  start() {
    console.log(`[Worker ${this.workerId}] Starting server...`);
    
    // Inicializar IPC
    this.ipcHandler.initialize();
    this._setupIPCListeners();
    
    // Crear servidor Express y HTTP
    const app = express();
    this.server = createServer(app);
    
    // Servir archivos estáticos
    app.use(express.static(path.join(__dirname, '../..')));
    
    // Crear servidor WebSocket
    this.wss = new WebSocketServer({ server: this.server });
    this.wss.on('connection', (ws) => this._handleConnection(ws));
    
    // Iniciar game loop
    this.tickInterval = setInterval(() => this._gameLoop(), SERVER_CONFIG.tickInterval);
    
    // Iniciar limpieza periódica de salas vacías
    // Requirement 2.4: Limpiar salas inactivas después de 60 segundos
    this.cleanupInterval = setInterval(
      () => this._cleanupEmptyRooms(), 
      CLUSTER_CONFIG.roomCleanupTimeout
    );
    
    // Iniciar reporte de métricas
    // Requirement 5.1: Reportar métricas cada 30 segundos
    this.metricsInterval = setInterval(
      () => this.reportMetrics(), 
      CLUSTER_CONFIG.metricsInterval
    );
    
    // Obtener puerto
    const PORT = process.env.PORT || SERVER_CONFIG.port;
    
    // Iniciar servidor
    this.server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Worker ${this.workerId}] Server running on port ${PORT}`);
      console.log(`[Worker ${this.workerId}] Game loop at ${SERVER_CONFIG.tickRate}Hz`);
      
      // Reportar métricas iniciales
      this.reportMetrics();
    });
    
    // Configurar shutdown graceful
    this._setupShutdownHandlers();
  }

  /**
   * Reporta métricas al proceso master
   * Requirement 3.1: Worker envía métricas al master
   * Requirement 5.1: Incluir conteo de salas, jugadores y uso de memoria
   */
  reportMetrics() {
    const memUsage = process.memoryUsage();
    
    const metrics = {
      workerId: this.workerId,
      pid: process.pid,
      rooms: {
        total: this.roomManager.getTotalSalas(),
        public: this._countPublicRooms(),
        private: this._countPrivateRooms(),
        ids: Array.from(this.roomManager.salas.keys())
      },
      players: {
        total: this._getTotalPlayers(),
        byRoom: this._getPlayersByRoom()
      },
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      uptime: process.uptime()
    };
    
    const message = createIPCMessage(IPCMessageType.METRICS, metrics, this.workerId);
    this.ipcHandler.sendToMaster(message);
    
    console.log(`[Worker ${this.workerId}] Metrics: ${metrics.rooms.total} rooms, ${metrics.players.total} players`);
  }

  /**
   * Maneja el shutdown graceful del worker
   * @returns {Promise<void>}
   */
  async handleShutdown() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    
    console.log(`[Worker ${this.workerId}] Initiating graceful shutdown...`);
    
    // Detener intervalos
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    
    // Cerrar todas las conexiones WebSocket
    for (const [playerId, ws] of this.connections) {
      try {
        ws.close(1001, 'Server shutting down');
      } catch (e) {
        // Ignorar errores al cerrar
      }
    }
    this.connections.clear();
    
    // Cerrar servidor WebSocket
    if (this.wss) {
      await new Promise((resolve) => {
        this.wss.close(() => resolve());
      });
    }
    
    // Cerrar servidor HTTP
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(() => resolve());
      });
    }
    
    console.log(`[Worker ${this.workerId}] Shutdown complete`);
  }

  /**
   * Obtiene el estado actual del worker
   * @returns {Object} Estado del worker
   */
  getStatus() {
    const memUsage = process.memoryUsage();
    
    return {
      workerId: this.workerId,
      pid: process.pid,
      status: this.isShuttingDown ? 'draining' : 'active',
      rooms: this.roomManager.getTotalSalas(),
      players: this._getTotalPlayers(),
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        rss: memUsage.rss
      },
      uptime: process.uptime()
    };
  }

  // ==================== Métodos Privados ====================

  /**
   * Configura los listeners de IPC
   * @private
   */
  _setupIPCListeners() {
    // Escuchar solicitudes de estado
    this.ipcHandler.onMessage(IPCMessageType.STATUS, (message) => {
      const status = this.getStatus();
      const response = createIPCMessage(
        IPCMessageType.STATUS_RESPONSE, 
        { ...status, requestId: message.data?.requestId },
        this.workerId
      );
      this.ipcHandler.sendToMaster(response);
    });
    
    // Escuchar solicitudes de salas disponibles (Requirement 3.3)
    this.ipcHandler.onMessage(IPCMessageType.ROOMS_REQUEST, (message) => {
      const rooms = this._getAvailableRoomsInfo();
      const response = createIPCMessage(
        IPCMessageType.ROOMS_RESPONSE,
        { 
          rooms, 
          requestId: message.data?.requestId,
          workerId: this.workerId
        },
        this.workerId
      );
      this.ipcHandler.sendToMaster(response);
    });
    
    // Escuchar señal de shutdown
    this.ipcHandler.onMessage(IPCMessageType.SHUTDOWN, () => {
      this.handleShutdown();
    });
  }
  
  /**
   * Obtiene información de salas disponibles para matchmaking distribuido
   * Requirement 3.3: Reportar disponibilidad de salas
   * @private
   * @returns {Array} Lista de salas disponibles con su información
   */
  _getAvailableRoomsInfo() {
    const salasDisponibles = this.roomManager.obtenerSalasPublicasDisponibles();
    return salasDisponibles.map(sala => ({
      id: sala.id,
      codigo: sala.codigo,
      tipo: sala.tipo,
      jugadores: sala.getPlayerCount(),
      maxJugadores: sala.maxJugadores,
      workerId: this.workerId
    }));
  }

  /**
   * Configura los handlers de shutdown
   * @private
   */
  _setupShutdownHandlers() {
    process.on('SIGINT', () => this.handleShutdown());
    process.on('SIGTERM', () => this.handleShutdown());
    
    // Escuchar mensaje de shutdown del master
    process.on('message', (msg) => {
      if (msg && msg.type === IPCMessageType.SHUTDOWN) {
        this.handleShutdown();
      }
    });
  }

  /**
   * Maneja nueva conexión WebSocket
   * @private
   * @param {WebSocket} ws
   */
  _handleConnection(ws) {
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    this.connections.set(playerId, ws);
    ws.playerId = playerId;
    ws.inLobby = true;
    
    console.log(`[Worker ${this.workerId}] Client connected: ${playerId}`);
    
    // Enviar confirmación de conexión
    ws.send(serializeMessage('connected', { playerId }));
    
    // Configurar handlers
    ws.on('message', (data) => this._handleMessage(ws, data));
    ws.on('close', () => this._handleDisconnection(ws));
    ws.on('error', (error) => {
      console.error(`[Worker ${this.workerId}] WebSocket error for ${playerId}:`, error.message);
    });
    
    // Notificar al master
    const message = createIPCMessage(IPCMessageType.PLAYER_JOINED, {
      playerId,
      totalPlayers: this._getTotalPlayers()
    }, this.workerId);
    this.ipcHandler.sendToMaster(message);
  }

  /**
   * Maneja mensaje entrante
   * @private
   */
  _handleMessage(ws, data) {
    const playerId = ws.playerId;
    const message = deserializeMessage(data.toString());
    
    if (!message) {
      console.warn(`[Worker ${this.workerId}] Malformed message from ${playerId}`);
      return;
    }
    
    // Mensajes de lobby
    if (message.type === 'lobby') {
      this._handleLobbyMessage(ws, message);
      return;
    }
    
    // Mensajes de juego
    const roomId = this.playerRooms.get(playerId);
    const sala = roomId ? this.roomManager.obtenerSala(roomId) : null;
    const currentGameManager = sala ? sala.gameManager : this.gameManager;
    
    // Mapear tipos de mensaje
    let inputType = message.type;
    let inputData = message.data;
    
    if (message.type === 'input') {
      inputType = 'movement';
      inputData = {
        rotation: inputData.rotation,
        position: inputData.position,
        isAiming: inputData.isAiming
      };
    }
    
    // Manejar cambio de arma
    if (message.type === 'weaponChange') {
      const player = currentGameManager.getPlayer(playerId);
      if (player && inputData.weaponType) {
        player.changeWeapon(inputData.weaponType);
      }
      return;
    }
    
    // Manejar respawn
    if (message.type === 'respawn') {
      const player = currentGameManager.getPlayer(playerId);
      if (player) {
        const result = currentGameManager.processRespawnInput(player, inputData);
        if (result.success) {
          const respawnData = { playerId, weaponType: result.weaponType };
          if (roomId) {
            this._broadcastToRoom(roomId, serializeMessage('respawn', respawnData));
          } else {
            this._broadcast(serializeMessage('respawn', respawnData));
          }
        }
      }
      return;
    }
    
    // Actualizar arma antes de disparar
    if (message.type === 'shoot' && inputData.weaponType) {
      const player = currentGameManager.getPlayer(playerId);
      if (player && player.currentWeapon !== inputData.weaponType) {
        player.changeWeapon(inputData.weaponType);
      }
    }
    
    // Handle melee attack - ensure player has KNIFE equipped
    // Requirements: 3.1, 6.4 - Broadcast melee attack to other players for TPS animation
    if (message.type === 'meleeAttack') {
      const player = currentGameManager.getPlayer(playerId);
      if (player) {
        // Asegurar que el jugador tiene el cuchillo equipado en el servidor
        if (player.currentWeapon !== 'KNIFE') {
          player.changeWeapon('KNIFE');
          console.log(`[Worker ${this.workerId}] [MELEE] Auto-equipped KNIFE for player ${playerId}`);
        }
      }
    }
    
    // Procesar input
    const input = { type: inputType, data: inputData };
    const result = currentGameManager.processInput(playerId, input);
    
    // Manejar disparos
    if ((message.type === 'shoot' || inputType === 'shoot') && result && result.success) {
      if (roomId) {
        this._broadcastToRoom(roomId, serializeMessage('bulletCreated', { bullet: result.bullet }));
      } else {
        this._broadcast(serializeMessage('bulletCreated', { bullet: result.bullet }));
      }
    }
    
    // Broadcast melee attack to other players for TPS animation
    // Requirements: 3.1, 6.4 - Broadcast melee attack event
    if ((message.type === 'meleeAttack' || inputType === 'meleeAttack') && result && result.success) {
      const meleeData = {
        attackerId: playerId,
        hits: result.hits || []
      };
      if (roomId) {
        this._broadcastToRoom(roomId, serializeMessage('meleeAttack', meleeData), playerId);
      } else {
        this._broadcast(serializeMessage('meleeAttack', meleeData));
      }
      console.log(`[Worker ${this.workerId}] [MELEE] Broadcast melee attack from ${playerId}`);
      
      // Requirements: 4.1, 4.2 - Send damageDealt notification to attacker for each hit
      // This enables the damage indicator to show for melee attacks in multiplayer
      if (result.hits && result.hits.length > 0) {
        const attackerWs = this.connections.get(playerId);
        if (attackerWs && attackerWs.readyState === attackerWs.OPEN) {
          for (const hit of result.hits) {
            const targetPlayer = currentGameManager.getPlayer(hit.targetId);
            attackerWs.send(serializeMessage('damageDealt', {
              damage: hit.damage,
              targetId: hit.targetId,
              targetHealth: targetPlayer ? targetPlayer.health : 0
            }));
          }
        }
        
        // Send death event for kills by knife
        // This ensures the victim sees the death screen and can respawn
        for (const hit of result.hits) {
          if (hit.killed) {
            const sala = roomId ? this.roomManager.obtenerSala(roomId) : null;
            if (sala) {
              sala.registrarKill(playerId);
            }
            
            const killer = sala?.jugadores.get(playerId);
            const victim = sala?.jugadores.get(hit.targetId);
            
            const deathData = {
              playerId: hit.targetId,
              killerId: playerId,
              killerName: killer?.nombre || playerId,
              victimName: victim?.nombre || hit.targetId,
              scoreboard: sala?.obtenerScoreboard() || []
            };
            
            if (roomId) {
              this._broadcastToRoom(roomId, serializeMessage('death', deathData));
            } else {
              this._broadcast(serializeMessage('death', deathData));
            }
            
            console.log(`[Worker ${this.workerId}] [MELEE DEATH] Broadcast death event: ${hit.targetId} killed by ${playerId}`);
          }
        }
      }
    }
  }

  /**
   * Maneja mensajes de lobby
   * @private
   */
  _handleLobbyMessage(ws, message) {
    const playerId = ws.playerId;
    const action = message.data.action;
    const data = message.data;
    
    switch (action) {
      case 'matchmaking': {
        const sala = encontrarMejorSala(this.roomManager);
        const playerName = data.playerName || `Jugador_${Math.floor(Math.random() * 10000)}`;
        const weaponType = data.weaponType || 'M4A1';
        
        const jugadoresActuales = [];
        for (const [id, jugador] of sala.jugadores) {
          jugadoresActuales.push({ id: jugador.id, nombre: jugador.nombre });
        }
        
        const added = sala.agregarJugador(playerId, playerName, weaponType);
        
        if (added) {
          this.playerRooms.set(playerId, sala.id);
          ws.inLobby = false;
          ws.roomId = sala.id;
          
          ws.send(serializeMessage('lobbyResponse', {
            action: 'matchmaking',
            success: true,
            data: {
              roomId: sala.id,
              roomCode: sala.codigo,
              players: sala.getPlayerCount(),
              maxPlayers: sala.maxJugadores,
              playerList: jugadoresActuales
            }
          }));
          
          this._broadcastToRoom(sala.id, serializeMessage('playerJoined', {
            player: { id: playerId, nombre: playerName }
          }), playerId);
          
          ws.send(serializeMessage('welcome', {
            playerId,
            gameState: sala.gameManager.getState()
          }));
          
          // Notificar al master sobre nueva sala si es necesario
          this._notifyRoomCreated(sala);
        } else {
          ws.send(serializeMessage('lobbyResponse', {
            action: 'matchmaking',
            success: false,
            data: { error: ERROR_MESSAGES.ROOM_FULL }
          }));
        }
        break;
      }
      
      case 'createPrivate': {
        const password = data.password || '';
        const playerName = data.playerName || `Jugador_${Math.floor(Math.random() * 10000)}`;
        const weaponType = data.weaponType || 'M4A1';
        
        const sala = this.roomManager.crearSala({ tipo: 'privada', password });
        sala.agregarJugador(playerId, playerName, weaponType);
        this.playerRooms.set(playerId, sala.id);
        ws.inLobby = false;
        ws.roomId = sala.id;
        
        ws.send(serializeMessage('lobbyResponse', {
          action: 'createPrivate',
          success: true,
          data: {
            roomId: sala.id,
            roomCode: sala.codigo,
            players: sala.getPlayerCount(),
            maxPlayers: sala.maxJugadores
          }
        }));
        
        ws.send(serializeMessage('welcome', {
          playerId,
          gameState: sala.gameManager.getState()
        }));
        
        this._notifyRoomCreated(sala);
        break;
      }
      
      case 'joinPrivate': {
        const roomCode = data.roomCode;
        const password = data.password || '';
        const playerName = data.playerName || `Jugador_${Math.floor(Math.random() * 10000)}`;
        
        const sala = this.roomManager.obtenerSalaPorCodigo(roomCode);
        
        if (!sala) {
          ws.send(serializeMessage('lobbyResponse', {
            action: 'joinPrivate',
            success: false,
            data: { error: ERROR_MESSAGES.ROOM_NOT_FOUND }
          }));
          return;
        }
        
        if (!sala.verificarPassword(password)) {
          ws.send(serializeMessage('lobbyResponse', {
            action: 'joinPrivate',
            success: false,
            data: { error: ERROR_MESSAGES.WRONG_PASSWORD }
          }));
          return;
        }
        
        if (!sala.tieneEspacio()) {
          ws.send(serializeMessage('lobbyResponse', {
            action: 'joinPrivate',
            success: false,
            data: { error: ERROR_MESSAGES.ROOM_FULL }
          }));
          return;
        }
        
        const jugadoresActuales = [];
        for (const [id, jugador] of sala.jugadores) {
          jugadoresActuales.push({ id: jugador.id, nombre: jugador.nombre });
        }
        
        const weaponType = data.weaponType || 'M4A1';
        sala.agregarJugador(playerId, playerName, weaponType);
        this.playerRooms.set(playerId, sala.id);
        ws.inLobby = false;
        ws.roomId = sala.id;
        
        ws.send(serializeMessage('lobbyResponse', {
          action: 'joinPrivate',
          success: true,
          data: {
            roomId: sala.id,
            roomCode: sala.codigo,
            players: sala.getPlayerCount(),
            maxPlayers: sala.maxJugadores,
            playerList: jugadoresActuales
          }
        }));
        
        this._broadcastToRoom(sala.id, serializeMessage('playerJoined', {
          player: { id: playerId, nombre: playerName }
        }), playerId);
        
        ws.send(serializeMessage('welcome', {
          playerId,
          gameState: sala.gameManager.getState()
        }));
        break;
      }
      
      case 'listRooms': {
        const salasDisponibles = this.roomManager.obtenerSalasPublicasDisponibles();
        const roomList = salasDisponibles.map(sala => ({
          id: sala.id,
          codigo: sala.codigo,
          jugadores: sala.getPlayerCount(),
          maxJugadores: sala.maxJugadores
        }));
        
        ws.send(serializeMessage('lobbyResponse', {
          action: 'listRooms',
          success: true,
          data: { rooms: roomList }
        }));
        break;
      }
      
      default:
        ws.send(serializeMessage('lobbyResponse', {
          action,
          success: false,
          data: { error: ERROR_MESSAGES.UNKNOWN_ACTION }
        }));
    }
  }

  /**
   * Maneja desconexión de cliente
   * @private
   */
  _handleDisconnection(ws) {
    const playerId = ws.playerId;
    if (!playerId) return;
    
    console.log(`[Worker ${this.workerId}] Player disconnecting: ${playerId}`);
    
    const roomId = this.playerRooms.get(playerId);
    
    if (roomId) {
      const sala = this.roomManager.obtenerSala(roomId);
      if (sala) {
        const jugador = sala.jugadores.get(playerId);
        const playerName = jugador ? jugador.nombre : 'Jugador';
        
        sala.removerJugador(playerId);
        
        this._broadcastToRoom(roomId, serializeMessage('playerLeft', {
          playerId,
          playerName
        }));
      }
      this.playerRooms.delete(playerId);
    } else {
      this.gameManager.removePlayer(playerId);
      this._broadcast(serializeMessage('playerLeft', { playerId }));
    }
    
    this.connections.delete(playerId);
    
    // Notificar al master
    const message = createIPCMessage(IPCMessageType.PLAYER_LEFT, {
      playerId,
      totalPlayers: this._getTotalPlayers()
    }, this.workerId);
    this.ipcHandler.sendToMaster(message);
  }

  /**
   * Game loop principal
   * @private
   */
  _gameLoop() {
    // Actualizar todas las salas activas
    for (const [roomId, sala] of this.roomManager.salas) {
      if (sala.getPlayerCount() === 0) continue;
      
      const events = sala.gameManager.update();
      
      // Broadcast estado del juego
      const gameState = sala.gameManager.getState();
      gameState.scoreboard = sala.obtenerScoreboard();
      this._broadcastToRoom(roomId, serializeMessage('state', gameState));
      
      // Broadcast eventos
      if (events.deaths.length > 0) {
        for (const death of events.deaths) {
          sala.registrarKill(death.killerId);
          const killer = sala.jugadores.get(death.killerId);
          const victim = sala.jugadores.get(death.playerId);
          
          this._broadcastToRoom(roomId, serializeMessage('death', {
            ...death,
            killerName: killer?.nombre || death.killerId,
            victimName: victim?.nombre || death.playerId,
            scoreboard: sala.obtenerScoreboard()
          }));
        }
      }
      
      if (events.respawns.length > 0) {
        for (const respawn of events.respawns) {
          this._broadcastToRoom(roomId, serializeMessage('respawn', respawn));
        }
      }
      
      if (events.collisions.length > 0) {
        for (const collision of events.collisions) {
          const targetWs = this.connections.get(collision.targetId);
          if (targetWs && targetWs.readyState === targetWs.OPEN) {
            targetWs.send(serializeMessage('hit', {
              damage: collision.damage,
              health: collision.targetHealth
            }));
          }
          
          const shooterWs = this.connections.get(collision.ownerId);
          if (shooterWs && shooterWs.readyState === shooterWs.OPEN && collision.ownerId !== collision.targetId) {
            shooterWs.send(serializeMessage('damageDealt', {
              damage: collision.damage,
              targetId: collision.targetId,
              targetHealth: collision.targetHealth
            }));
          }
        }
      }
    }
    
    // Actualizar game manager legacy
    const legacyEvents = this.gameManager.update();
    if (this.gameManager.getPlayerCount() > 0) {
      const stateMessage = serializeMessage('state', this.gameManager.getState());
      for (const [playerId, ws] of this.connections) {
        if (!this.playerRooms.has(playerId) && ws.readyState === ws.OPEN) {
          ws.send(stateMessage);
        }
      }
    }
  }

  /**
   * Limpia salas vacías
   * Requirement 2.4: Limpiar salas inactivas después de 60 segundos
   * @private
   */
  _cleanupEmptyRooms() {
    const cleaned = this.roomManager.limpiarSalasVacias();
    
    if (cleaned > 0) {
      console.log(`[Worker ${this.workerId}] Cleaned ${cleaned} empty room(s)`);
      
      // Notificar al master
      const message = createIPCMessage(IPCMessageType.ROOM_DELETED, {
        count: cleaned,
        totalRooms: this.roomManager.getTotalSalas()
      }, this.workerId);
      this.ipcHandler.sendToMaster(message);
    }
  }

  /**
   * Notifica al master sobre una nueva sala
   * @private
   */
  _notifyRoomCreated(sala) {
    const message = createIPCMessage(IPCMessageType.ROOM_CREATED, {
      roomId: sala.id,
      roomCode: sala.codigo,
      tipo: sala.tipo,
      totalRooms: this.roomManager.getTotalSalas()
    }, this.workerId);
    this.ipcHandler.sendToMaster(message);
  }

  /**
   * Broadcast a todos los clientes
   * @private
   */
  _broadcast(message) {
    for (const [playerId, ws] of this.connections) {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    }
  }

  /**
   * Broadcast a clientes de una sala específica
   * @private
   */
  _broadcastToRoom(roomId, message, excludePlayerId = null) {
    const sala = this.roomManager.obtenerSala(roomId);
    if (!sala) return;
    
    for (const [playerId] of sala.jugadores) {
      if (excludePlayerId && playerId === excludePlayerId) continue;
      
      const ws = this.connections.get(playerId);
      if (ws && ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    }
  }

  /**
   * Cuenta salas públicas
   * @private
   */
  _countPublicRooms() {
    let count = 0;
    for (const sala of this.roomManager.salas.values()) {
      if (sala.tipo === 'publica') count++;
    }
    return count;
  }

  /**
   * Cuenta salas privadas
   * @private
   */
  _countPrivateRooms() {
    let count = 0;
    for (const sala of this.roomManager.salas.values()) {
      if (sala.tipo === 'privada') count++;
    }
    return count;
  }

  /**
   * Obtiene total de jugadores conectados
   * @private
   */
  _getTotalPlayers() {
    return this.connections.size;
  }

  /**
   * Obtiene jugadores por sala
   * @private
   */
  _getPlayersByRoom() {
    const byRoom = {};
    for (const [roomId, sala] of this.roomManager.salas) {
      byRoom[roomId] = sala.getPlayerCount();
    }
    return byRoom;
  }
}

// Singleton para el worker actual
let workerServerInstance = null;

/**
 * Obtiene la instancia del WorkerServer
 * @returns {WorkerServer}
 */
export function getWorkerServer() {
  if (!workerServerInstance) {
    workerServerInstance = new WorkerServer();
  }
  return workerServerInstance;
}

/**
 * Inicia el WorkerServer si estamos en un proceso worker
 */
export function startWorkerIfNeeded() {
  if (cluster.isWorker) {
    const server = getWorkerServer();
    server.start();
    return server;
  }
  return null;
}

export default WorkerServer;
