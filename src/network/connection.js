/**
 * Network Connection Module
 * Handles WebSocket connection to the game server
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

/**
 * NetworkConnection class manages WebSocket communication with the server
 */
export class NetworkConnection {
  constructor() {
    this.socket = null;
    this.playerId = null;
    this.connected = false;
    
    // Event callbacks
    this._onGameState = null;
    this._onPlayerJoined = null;
    this._onPlayerLeft = null;
    this._onWelcome = null;
    this._onHit = null;
    this._onDeath = null;
    this._onRespawn = null;
    this._onBulletCreated = null;
    this._onDamageDealt = null;
    this._onError = null;
    this._onDisconnect = null;
    this._onLobbyResponse = null;
    this._onConnected = null;
  }

  /**
   * Connect to the game server (Requirement 2.1)
   * @param {string} serverUrl - WebSocket server URL
   * @returns {Promise<void>} - Resolves when connected, rejects on error
   */
  connect(serverUrl) {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(serverUrl);
        
        let connectionResolved = false;
        
        this.socket.onopen = () => {
          this.connected = true;
          console.log('Connected to server');
        };
        
        this.socket.onmessage = (event) => {
          this._handleMessage(event.data);
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (this._onError) {
            this._onError(error);
          }
          if (!this.connected && !connectionResolved) {
            connectionResolved = true;
            reject(new Error('Connection failed'));
          }
        };
        
        this.socket.onclose = () => {
          this.connected = false;
          this.playerId = null;
          console.log('Disconnected from server');
          if (this._onDisconnect) {
            this._onDisconnect();
          }
        };
        
        // Resolver la promesa cuando recibimos 'connected' (conexión inicial al lobby)
        const originalOnConnected = this._onConnected;
        this._onConnected = (data) => {
          if (data && data.playerId) {
            this.playerId = data.playerId;
          }
          if (originalOnConnected) {
            originalOnConnected(data);
          }
          if (!connectionResolved) {
            connectionResolved = true;
            resolve();
          }
        };
        
        // También resolver en welcome (para compatibilidad con flujo de juego)
        const originalOnWelcome = this._onWelcome;
        this._onWelcome = (data) => {
          if (data && data.playerId) {
            this.playerId = data.playerId;
          }
          if (originalOnWelcome) {
            originalOnWelcome(data);
          }
          if (!connectionResolved) {
            connectionResolved = true;
            resolve();
          }
        };
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
      this.playerId = null;
    }
  }

  /**
   * Send a message to the server
   * @param {string} type - Message type
   * @param {Object} data - Message data
   */
  send(type, data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: not connected');
      return;
    }
    
    const message = {
      type: type,
      data: data,
      timestamp: Date.now()
    };
    
    this.socket.send(JSON.stringify(message));
  }

  /**
   * Handle incoming message from server
   * @param {string} data - Raw message data
   * @private
   */
  _handleMessage(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse message:', error);
      return;
    }
    
    if (!message || !message.type) {
      return;
    }
    
    switch (message.type) {
      case 'welcome':
        // Requirement 2.2: Receive player ID and initial game state
        if (this._onWelcome) {
          this._onWelcome(message.data);
        }
        break;
        
      case 'state':
        // Game state update
        if (this._onGameState) {
          this._onGameState(message.data);
        }
        break;
        
      case 'playerJoined':
        if (this._onPlayerJoined) {
          this._onPlayerJoined(message.data.player);
        }
        break;
        
      case 'playerLeft':
        if (this._onPlayerLeft) {
          this._onPlayerLeft(message.data.playerId);
        }
        break;
        
      case 'hit':
        if (this._onHit) {
          this._onHit(message.data);
        }
        break;
        
      case 'death':
        if (this._onDeath) {
          this._onDeath(message.data);
        }
        break;
        
      case 'respawn':
        if (this._onRespawn) {
          this._onRespawn(message.data);
        }
        break;
        
      case 'bulletCreated':
        if (this._onBulletCreated) {
          this._onBulletCreated(message.data.bullet);
        }
        break;
        
      case 'damageDealt':
        if (this._onDamageDealt) {
          this._onDamageDealt(message.data);
        }
        break;
        
      case 'lobbyResponse':
        // Lobby response from server
        if (this._onLobbyResponse) {
          this._onLobbyResponse(message.data);
        }
        break;
        
      case 'connected':
        // Initial connection acknowledgment
        if (message.data && message.data.playerId) {
          this.playerId = message.data.playerId;
        }
        if (this._onConnected) {
          this._onConnected(message.data);
        }
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  /**
   * Register callback for game state updates
   * @param {Function} callback - Function to call with game state
   */
  onGameState(callback) {
    this._onGameState = callback;
  }

  /**
   * Register callback for player joined events
   * @param {Function} callback - Function to call with player data
   */
  onPlayerJoined(callback) {
    this._onPlayerJoined = callback;
  }

  /**
   * Register callback for player left events
   * @param {Function} callback - Function to call with player ID
   */
  onPlayerLeft(callback) {
    this._onPlayerLeft = callback;
  }

  /**
   * Register callback for welcome message
   * @param {Function} callback - Function to call with welcome data
   */
  onWelcome(callback) {
    this._onWelcome = callback;
  }

  /**
   * Register callback for hit events
   * @param {Function} callback - Function to call with hit data
   */
  onHit(callback) {
    this._onHit = callback;
  }

  /**
   * Register callback for death events
   * @param {Function} callback - Function to call with death data
   */
  onDeath(callback) {
    this._onDeath = callback;
  }

  /**
   * Register callback for respawn events
   * @param {Function} callback - Function to call with respawn data
   */
  onRespawn(callback) {
    this._onRespawn = callback;
  }

  /**
   * Register callback for bullet created events
   * @param {Function} callback - Function to call with bullet data
   */
  onBulletCreated(callback) {
    this._onBulletCreated = callback;
  }

  /**
   * Register callback for damage dealt events (when local player hits someone)
   * @param {Function} callback - Function to call with damage data
   */
  onDamageDealt(callback) {
    this._onDamageDealt = callback;
  }

  /**
   * Register callback for connection errors (Requirement 2.3)
   * @param {Function} callback - Function to call on error
   */
  onError(callback) {
    this._onError = callback;
  }

  /**
   * Register callback for disconnection
   * @param {Function} callback - Function to call on disconnect
   */
  onDisconnect(callback) {
    this._onDisconnect = callback;
  }

  /**
   * Register callback for lobby responses
   * @param {Function} callback - Function to call with lobby response data
   */
  onLobbyResponse(callback) {
    this._onLobbyResponse = callback;
  }

  /**
   * Register callback for initial connection acknowledgment
   * @param {Function} callback - Function to call when connected
   */
  onConnected(callback) {
    this._onConnected = callback;
  }

  /**
   * Check if connected to server
   * @returns {boolean} - True if connected
   */
  isConnected() {
    return this.connected && this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get the local player ID
   * @returns {string|null} - Player ID or null if not connected
   */
  getPlayerId() {
    return this.playerId;
  }

  /**
   * Send a lobby message to the server
   * Requirements: 3.2, 5.2
   * @param {string} action - Lobby action ('matchmaking', 'createPrivate', 'joinPrivate', 'listRooms')
   * @param {Object} data - Additional data for the action
   */
  sendLobbyMessage(action, data = {}) {
    this.send('lobby', {
      action,
      ...data
    });
  }
}

// Singleton instance for easy access
let connectionInstance = null;

/**
 * Get the network connection singleton
 * @returns {NetworkConnection}
 */
export function getConnection() {
  if (!connectionInstance) {
    connectionInstance = new NetworkConnection();
  }
  return connectionInstance;
}

/**
 * Create a new network connection (for testing or multiple connections)
 * @returns {NetworkConnection}
 */
export function createConnection() {
  return new NetworkConnection();
}
