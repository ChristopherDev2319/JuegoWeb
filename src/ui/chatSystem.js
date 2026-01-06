/**
 * Sistema de Chat Universal
 * Funciona tanto en modo local como online
 */

export class ChatSystem {
  constructor(options = {}) {
    this.isOnline = options.isOnline || false;
    this.playerName = options.playerName || 'Jugador';
    this.maxMessages = 50;
    this.messages = [];
    this.chatActivo = false; // Para controlar si el chat está activo
    this.onChatStateChange = options.onChatStateChange || null; // Callback para notificar cambios
    
    this.createChatUI();
    this.setupEventListeners();
    
    // Mensaje de bienvenida
    if (this.isOnline) {
      this.addSystemMessage('Chat multijugador activado');
    } else {
      this.addSystemMessage('Chat de batalla - Escribe notas o comandos');
      this.addSystemMessage('Tip: Escribe "help" para ver comandos');
    }
  }
  
  createChatUI() {
    // Contenedor principal del chat
    // OPTIMIZADO: Removido backdrop-filter para mejor rendimiento
    // REDISEÑO UI: Chat oculto por defecto (display: none)
    this.chatContainer = document.createElement('div');
    this.chatContainer.id = 'chat-container';
    this.chatContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      max-height: 250px;
      background: rgba(0, 0, 0, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      display: none;
      flex-direction: column;
      font-family: 'Segoe UI', sans-serif;
      font-size: 13px;
      z-index: 1000;
      transition: opacity 0.3s ease;
    `;
    
    // Header del chat
    this.chatHeader = document.createElement('div');
    this.chatHeader.style.cssText = `
      background: rgba(255, 255, 255, 0.05);
      color: white;
      padding: 8px 12px;
      border-radius: 12px 12px 0 0;
      font-weight: 600;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    const title = document.createElement('span');
    title.textContent = this.isOnline ? 'Chat Multijugador' : 'Chat de Batalla';
    
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '−';
    toggleBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 14px;
      padding: 0;
      width: 20px;
      height: 20px;
    `;
    toggleBtn.onclick = () => this.toggleChat();
    
    this.chatHeader.appendChild(title);
    this.chatHeader.appendChild(toggleBtn);
    
    // Área de mensajes
    this.messagesArea = document.createElement('div');
    this.messagesArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 10px 12px;
      color: white;
      line-height: 1.5;
      max-height: 150px;
    `;
    
    // Input del chat
    this.inputContainer = document.createElement('div');
    this.inputContainer.style.cssText = `
      padding: 10px 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      gap: 8px;
    `;
    
    this.chatInput = document.createElement('input');
    this.chatInput.type = 'text';
    this.chatInput.placeholder = this.isOnline ? 'Escribe un mensaje...' : 'Escribe una nota o comando...';
    this.chatInput.maxLength = 200;
    this.chatInput.style.cssText = `
      flex: 1;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: white;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-family: 'Segoe UI', sans-serif;
      outline: none;
      transition: border-color 0.2s ease, background 0.2s ease;
    `;
    
    this.sendButton = document.createElement('button');
    this.sendButton.textContent = 'Enviar';
    this.sendButton.style.cssText = `
      background: rgba(76, 175, 80, 0.8);
      border: none;
      color: white;
      padding: 6px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      font-family: 'Segoe UI', sans-serif;
      font-weight: 500;
      min-width: 60px;
      transition: background 0.2s ease;
    `;
    
    // Ensamblar UI
    this.inputContainer.appendChild(this.chatInput);
    this.inputContainer.appendChild(this.sendButton);
    
    this.chatContainer.appendChild(this.chatHeader);
    this.chatContainer.appendChild(this.messagesArea);
    this.chatContainer.appendChild(this.inputContainer);
    
    document.body.appendChild(this.chatContainer);
    
    // Estado inicial: chat oculto (display: none ya está configurado)
  }
  
  setupEventListeners() {
    // Enter para enviar mensaje
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
    
    // Click en botón enviar
    this.sendButton.addEventListener('click', () => {
      this.sendMessage();
    });
    
    // Focus/blur para opacidad y control de estado
    this.chatInput.addEventListener('focus', () => {
      this.chatContainer.style.opacity = '1';
      this.chatActivo = true;
      this.notificarCambioEstado(true);
    });
    
    this.chatInput.addEventListener('blur', () => {
      setTimeout(() => {
        // Ocultar el chat cuando pierde el foco
        if (!this.chatActivo) {
          this.chatContainer.style.display = 'none';
        }
      }, 2000);
    });
    
    // Tecla T para abrir chat rápido
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 't' && !this.chatInput.matches(':focus') && !this.chatActivo) {
        e.preventDefault();
        this.abrirChat();
      }
      // Tecla Escape para cerrar el chat
      if (e.key === 'Escape' && this.chatActivo) {
        e.preventDefault();
        this.cerrarChat();
      }
    });
  }
  
  sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;
    
    if (this.isOnline) {
      // En modo online, mostrar mensaje propio con nombre del jugador
      this.addPlayerMessage(this.playerName, message, true); // true = mensaje propio
      // TODO: Enviar al servidor cuando esté implementado
    } else {
      // En modo local, procesar comandos o agregar como nota
      this.processLocalMessage(message);
    }
    
    this.chatInput.value = '';
    this.cerrarChat();
  }
  
  abrirChat() {
    // Mostrar el chat (estaba oculto por defecto)
    this.chatContainer.style.display = 'flex';
    this.chatInput.focus();
    this.chatContainer.style.opacity = '1';
    this.chatActivo = true;
    this.notificarCambioEstado(true);
  }
  
  cerrarChat() {
    this.chatInput.blur();
    this.chatActivo = false;
    this.notificarCambioEstado(false);
    // Ocultar el chat completamente al cerrar
    setTimeout(() => {
      if (!this.chatActivo) {
        this.chatContainer.style.display = 'none';
      }
    }, 100);
  }
  
  notificarCambioEstado(activo) {
    if (this.onChatStateChange) {
      this.onChatStateChange(activo);
    }
  }
  
  // Método para verificar si el chat está activo (para uso externo)
  estaActivo() {
    return this.chatActivo;
  }
  
  processLocalMessage(message) {
    const command = message.toLowerCase();
    
    // Comandos especiales en modo local
    switch (command) {
      case 'help':
        this.addSystemMessage('Comandos disponibles:');
        this.addSystemMessage('• help - Muestra esta ayuda');
        this.addSystemMessage('• time - Muestra tiempo actual');
        this.addSystemMessage('• clear - Limpia el chat');
        this.addSystemMessage('• fps - Muestra FPS estimado');
        this.addSystemMessage('• ping - Test de latencia');
        this.addSystemMessage('• info - Información del juego');
        break;
        
      case 'time':
        const now = new Date();
        this.addSystemMessage(`Hora actual: ${now.toLocaleTimeString()}`);
        break;
        
      case 'clear':
        this.clearMessages();
        this.addSystemMessage('Chat limpiado');
        break;
        
      case 'fps':
        this.addSystemMessage('FPS: ~60 (estimado)');
        break;
        
      case 'ping':
        const start = performance.now();
        setTimeout(() => {
          const ping = Math.round(performance.now() - start);
          this.addSystemMessage(`Ping local: ${ping}ms`);
        }, Math.random() * 50 + 10);
        break;
        
      case 'info':
        this.addSystemMessage('Juego FPS Three.js');
        this.addSystemMessage('Modo: ' + (this.isOnline ? 'Multijugador' : 'Local'));
        this.addSystemMessage('Navegador: ' + navigator.userAgent.split(' ')[0]);
        this.addSystemMessage('Resolución: ' + window.innerWidth + 'x' + window.innerHeight);
        break;
        
      default:
        // Mensaje normal como nota
        this.addPlayerMessage('Nota', message);
        break;
    }
  }
  
  addPlayerMessage(playerName, message, isOwnMessage = false) {
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
      margin-bottom: 4px;
      word-wrap: break-word;
      padding: 2px 4px;
      border-radius: 4px;
      background: ${isOwnMessage ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)'};
    `;
    
    // Determinar si es mensaje propio
    const esMensajePropio = isOwnMessage || playerName === this.playerName || playerName === 'Nota';
    const nameColor = esMensajePropio ? '#4CAF50' : '#2196F3';
    
    // Usar el nombre real del jugador en lugar de emojis
    const nombreMostrar = playerName === 'Nota' ? this.playerName : playerName;
    
    messageElement.innerHTML = `
      <span style="color: #888; font-size: 10px;">[${timestamp}]</span>
      <span style="color: ${nameColor}; font-weight: bold; font-size: 12px;">${nombreMostrar}:</span>
      <span style="color: white; margin-left: 5px;">${this.escapeHtml(message)}</span>
    `;
    
    this.addMessageElement(messageElement);
  }
  
  addSystemMessage(message) {
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
      margin-bottom: 4px;
      color: #FFC107;
      font-style: italic;
      word-wrap: break-word;
    `;
    
    messageElement.innerHTML = `
      <span style="color: #888; font-size: 10px;">[${timestamp}]</span>
      <span>${this.escapeHtml(message)}</span>
    `;
    
    this.addMessageElement(messageElement);
  }
  
  addMessageElement(element) {
    this.messages.push(element);
    this.messagesArea.appendChild(element);
    
    // Limitar número de mensajes
    if (this.messages.length > this.maxMessages) {
      const oldMessage = this.messages.shift();
      this.messagesArea.removeChild(oldMessage);
    }
    
    // Scroll al final
    this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
    
    // Solo mostrar temporalmente si el chat ya está visible
    if (this.chatContainer.style.display !== 'none') {
      this.chatContainer.style.opacity = '1';
      setTimeout(() => {
        if (!this.chatInput.matches(':focus') && !this.chatActivo) {
          this.chatContainer.style.display = 'none';
        }
      }, 3000);
    }
  }
  
  clearMessages() {
    this.messages = [];
    this.messagesArea.innerHTML = '';
  }
  
  toggleChat() {
    const isHidden = this.messagesArea.style.display === 'none';
    const killFeed = document.getElementById('kill-feed');
    
    if (isHidden) {
      this.messagesArea.style.display = 'block';
      this.inputContainer.style.display = 'flex';
      this.chatContainer.style.maxHeight = '250px';
      this.chatHeader.querySelector('button').textContent = '−';
      // Kill feed vuelve a posición normal cuando chat está expandido
      if (killFeed) {
        killFeed.classList.remove('chat-minimized');
      }
    } else {
      this.messagesArea.style.display = 'none';
      this.inputContainer.style.display = 'none';
      this.chatContainer.style.maxHeight = 'none';
      this.chatHeader.querySelector('button').textContent = '+';
      // Kill feed sube cuando chat está minimizado
      if (killFeed) {
        killFeed.classList.add('chat-minimized');
      }
    }
  }
  
  // Recibir mensaje de otro jugador (para modo online)
  receiveMessage(playerName, message) {
    this.addPlayerMessage(playerName, message);
  }
  
  // Cambiar modo (local/online)
  setMode(isOnline, playerName = 'Jugador') {
    this.isOnline = isOnline;
    this.playerName = playerName;
    
    // Actualizar UI
    const title = this.chatHeader.querySelector('span');
    title.textContent = isOnline ? 'Chat Multijugador' : 'Chat de Batalla';
    
    this.chatInput.placeholder = isOnline ? 'Escribe un mensaje...' : 'Escribe una nota o comando...';
    
    // Mensaje de cambio de modo
    this.clearMessages();
    if (isOnline) {
      this.addSystemMessage('Modo multijugador activado');
    } else {
      this.addSystemMessage('Chat de batalla activado');
      this.addSystemMessage('Tip: Escribe "help" para ver comandos');
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Destruir chat
  destroy() {
    if (this.chatContainer && this.chatContainer.parentNode) {
      this.chatContainer.parentNode.removeChild(this.chatContainer);
    }
  }
}