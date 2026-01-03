/**
 * StatusEndpoint - Endpoint HTTP para estado del cluster
 * 
 * Este módulo implementa un servidor HTTP en el proceso master que expone:
 * - Estado del cluster en formato JSON
 * - Métricas para monitoreo externo
 * 
 * Requirement 5.4: Retornar JSON con workers activos, salas totales y jugadores totales
 */

import http from 'http';
import { CLUSTER_CONFIG } from './config.js';

/**
 * Puerto para el endpoint de estado (diferente al puerto del juego)
 */
const STATUS_PORT = parseInt(process.env.CLUSTER_STATUS_PORT) || 3001;

/**
 * StatusEndpoint - Servidor HTTP para métricas del cluster
 */
class StatusEndpoint {
  /**
   * @param {import('./clusterManager.js').ClusterManager} clusterManager - Referencia al ClusterManager
   */
  constructor(clusterManager) {
    /** @type {import('./clusterManager.js').ClusterManager} */
    this.clusterManager = clusterManager;
    
    /** @type {http.Server|null} */
    this.server = null;
    
    /** @type {number} */
    this.port = STATUS_PORT;
  }

  /**
   * Inicia el servidor de estado
   * Requirement 5.4: Exponer métricas para monitoreo externo
   */
  start() {
    this.server = http.createServer((req, res) => {
      this._handleRequest(req, res);
    });

    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`[STATUS_ENDPOINT] Cluster status endpoint running on port ${this.port}`);
      console.log(`[STATUS_ENDPOINT] Access at http://localhost:${this.port}/status`);
    });

    this.server.on('error', (error) => {
      console.error('[STATUS_ENDPOINT] Server error:', error.message);
    });
  }

  /**
   * Detiene el servidor de estado
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('[STATUS_ENDPOINT] Server stopped');
          resolve();
        });
      });
    }
  }

  /**
   * Maneja las solicitudes HTTP
   * @private
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   */
  _handleRequest(req, res) {
    // CORS headers para permitir acceso desde cualquier origen
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    switch (path) {
      case '/status':
      case '/':
        this._handleStatusRequest(req, res);
        break;
      case '/health':
        this._handleHealthRequest(req, res);
        break;
      case '/metrics':
        this._handleMetricsRequest(req, res);
        break;
      case '/matchmaking':
        this._handleMatchmakingRequest(req, res);
        break;
      default:
        this._sendNotFound(res);
    }
  }

  /**
   * Maneja solicitud de estado del cluster
   * Requirement 5.4: Retornar JSON con workers activos, salas totales y jugadores totales
   * @private
   */
  _handleStatusRequest(req, res) {
    const stats = this.clusterManager.getClusterStats();
    
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      cluster: {
        totalWorkers: stats.totalWorkers,
        activeWorkers: stats.activeWorkers,
        totalRooms: stats.totalRooms,
        totalPlayers: stats.totalPlayers
      },
      workers: stats.workersStats.map(worker => {
        // Manejar rooms y players como objetos o números
        const roomCount = typeof worker.rooms === 'object' ? (worker.rooms.total || 0) : (worker.rooms || 0);
        const playerCount = typeof worker.players === 'object' ? (worker.players.total || 0) : (worker.players || 0);
        
        return {
          id: worker.id,
          pid: worker.pid,
          status: worker.status,
          rooms: typeof worker.rooms === 'object' ? worker.rooms : { total: roomCount },
          players: typeof worker.players === 'object' ? worker.players : { total: playerCount },
          memoryUsage: `${(worker.memoryUsage * 100).toFixed(1)}%`,
          lastHeartbeat: new Date(worker.lastHeartbeat).toISOString()
        };
      }),
      config: {
        maxRoomsPerWorker: CLUSTER_CONFIG.maxRoomsPerWorker,
        maxPlayersPerWorker: CLUSTER_CONFIG.maxPlayersPerWorker,
        metricsInterval: CLUSTER_CONFIG.metricsInterval
      }
    };

    this._sendJSON(res, status);
  }

  /**
   * Maneja solicitud de health check
   * @private
   */
  _handleHealthRequest(req, res) {
    const stats = this.clusterManager.getClusterStats();
    const isHealthy = stats.activeWorkers > 0;

    const health = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      activeWorkers: stats.activeWorkers,
      totalWorkers: stats.totalWorkers
    };

    res.writeHead(isHealthy ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health, null, 2));
  }

  /**
   * Maneja solicitud de métricas en formato Prometheus-like
   * @private
   */
  _handleMetricsRequest(req, res) {
    const stats = this.clusterManager.getClusterStats();
    
    let metrics = '';
    metrics += `# HELP cluster_workers_total Total number of workers\n`;
    metrics += `# TYPE cluster_workers_total gauge\n`;
    metrics += `cluster_workers_total ${stats.totalWorkers}\n\n`;
    
    metrics += `# HELP cluster_workers_active Number of active workers\n`;
    metrics += `# TYPE cluster_workers_active gauge\n`;
    metrics += `cluster_workers_active ${stats.activeWorkers}\n\n`;
    
    metrics += `# HELP cluster_rooms_total Total number of rooms\n`;
    metrics += `# TYPE cluster_rooms_total gauge\n`;
    metrics += `cluster_rooms_total ${stats.totalRooms}\n\n`;
    
    metrics += `# HELP cluster_players_total Total number of players\n`;
    metrics += `# TYPE cluster_players_total gauge\n`;
    metrics += `cluster_players_total ${stats.totalPlayers}\n\n`;
    
    // Per-worker metrics
    for (const worker of stats.workersStats) {
      const roomCount = typeof worker.rooms === 'object' ? (worker.rooms.total || 0) : (worker.rooms || 0);
      const playerCount = typeof worker.players === 'object' ? (worker.players.total || 0) : (worker.players || 0);
      
      metrics += `# HELP worker_rooms Number of rooms per worker\n`;
      metrics += `# TYPE worker_rooms gauge\n`;
      metrics += `worker_rooms{worker_id="${worker.id}"} ${roomCount}\n`;
      
      metrics += `# HELP worker_players Number of players per worker\n`;
      metrics += `# TYPE worker_players gauge\n`;
      metrics += `worker_players{worker_id="${worker.id}"} ${playerCount}\n`;
      
      metrics += `# HELP worker_memory_usage Memory usage percentage per worker\n`;
      metrics += `# TYPE worker_memory_usage gauge\n`;
      metrics += `worker_memory_usage{worker_id="${worker.id}"} ${worker.memoryUsage}\n\n`;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(metrics);
  }

  /**
   * Maneja solicitud de estadísticas de matchmaking
   * @private
   */
  _handleMatchmakingRequest(req, res) {
    const matchmakingStats = this.clusterManager.getMatchmakingStats();
    
    const response = {
      timestamp: new Date().toISOString(),
      matchmaking: {
        totalRooms: matchmakingStats.totalRooms,
        totalPlayers: matchmakingStats.totalPlayers,
        availableWorkers: matchmakingStats.availableWorkers,
        totalWorkers: matchmakingStats.totalWorkers,
        limits: {
          maxRoomsPerWorker: matchmakingStats.maxRoomsPerWorker,
          maxPlayersPerWorker: matchmakingStats.maxPlayersPerWorker
        }
      }
    };

    this._sendJSON(res, response);
  }

  /**
   * Envía respuesta JSON
   * @private
   */
  _sendJSON(res, data) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  /**
   * Envía respuesta 404
   * @private
   */
  _sendNotFound(res) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      availableEndpoints: ['/status', '/health', '/metrics', '/matchmaking']
    }));
  }
}

export { StatusEndpoint };
export default StatusEndpoint;
