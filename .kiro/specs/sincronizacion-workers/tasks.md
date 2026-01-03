# Implementation Plan

- [ ] 1. Extender tipos de mensajes IPC
  - [ ] 1.1 Agregar nuevos tipos de mensajes IPC para transferencia y proxy
    - Agregar TRANSFER_PLAYER, ACCEPT_PLAYER, PLAYER_ACCEPTED, PLAYER_REJECTED
    - Agregar PROXY_GAME_MESSAGE, PROXY_BROADCAST, PROXY_DISCONNECT
    - Actualizar validación de mensajes IPC
    - _Requirements: 2.1, 2.2, 2.5_

- [ ] 2. Implementar ProxyManager
  - [ ] 2.1 Crear clase ProxyManager base
    - Crear `server/cluster/proxyManager.js`
    - Implementar registerProxy(), removeProxy(), isProxied()
    - Implementar forwardGameMessage() para reenviar mensajes al owner
    - _Requirements: 2.4, 2.5, 4.1_
  - [ ]* 2.2 Write property test para integridad de mensajes proxy
    - **Property 5: Integridad de mensajes proxy**
    - **Validates: Requirements 2.5, 4.1**
  - [ ] 2.3 Implementar handleBroadcast() para recibir mensajes del owner
    - Recibir mensaje de broadcast vía IPC
    - Enviar al cliente WebSocket correspondiente
    - _Requirements: 4.2, 4.3_

- [ ] 3. Implementar VirtualPlayerManager
  - [ ] 3.1 Crear clase VirtualPlayerManager base
    - Crear `server/cluster/virtualPlayerManager.js`
    - Implementar acceptPlayer(), removePlayer(), isVirtual()
    - Implementar handleGameMessage() para procesar inputs
    - _Requirements: 2.3, 2.4_
  - [ ] 3.2 Implementar sendToPlayer() y broadcastToRoom()
    - Enviar mensajes a jugadores virtuales vía IPC
    - Broadcast a todos los jugadores virtuales de una sala
    - _Requirements: 4.2_
  - [ ]* 3.3 Write property test para broadcast a todos los proxies
    - **Property 8: Broadcast a todos los proxies**
    - **Validates: Requirements 4.2**

- [ ] 4. Checkpoint - Verificar componentes base
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Modificar ClusterManager para routing de mensajes
  - [ ] 5.1 Implementar handlers de transferencia en ClusterManager
    - Agregar _handleTransferPlayer() para reenviar al worker owner
    - Agregar _forwardToWorker() para routing genérico
    - Manejar PLAYER_ACCEPTED y PLAYER_REJECTED
    - _Requirements: 2.2_
  - [ ]* 5.2 Write property test para routing de mensajes IPC
    - **Property 4: Routing de mensajes IPC**
    - **Validates: Requirements 2.2**
  - [ ] 5.3 Implementar handlers de proxy de mensajes de juego
    - Manejar PROXY_GAME_MESSAGE para reenviar al owner
    - Manejar PROXY_BROADCAST para reenviar al proxy
    - Manejar PROXY_DISCONNECT para notificar desconexión
    - _Requirements: 4.1, 4.2, 4.4_

- [ ] 6. Modificar WorkerServer para soportar proxy
  - [ ] 6.1 Integrar ProxyManager y VirtualPlayerManager en WorkerServer
    - Inicializar managers en start()
    - Configurar listeners IPC para mensajes de proxy
    - _Requirements: 2.3, 2.4_
  - [ ] 6.2 Implementar _setupProxyIPCListeners()
    - Handler para ACCEPT_PLAYER (aceptar jugador transferido)
    - Handler para PROXY_GAME_MESSAGE (procesar input de jugador virtual)
    - Handler para PROXY_BROADCAST (enviar a cliente proxy)
    - Handler para PROXY_DISCONNECT (remover jugador virtual)
    - Handler para PLAYER_ACCEPTED (confirmar transferencia)
    - _Requirements: 2.3, 2.4, 2.5, 4.1, 4.2, 4.4_
  - [ ]* 6.3 Write property test para notificación de desconexión
    - **Property 9: Notificación de desconexión**
    - **Validates: Requirements 4.4**

- [ ] 7. Modificar matchmaking para transferencia entre workers
  - [ ] 7.1 Modificar _handleMatchmaking() para detectar sala en otro worker
    - Verificar si roomInfo.workerId !== this.workerId
    - Si es diferente, llamar _initiateTransfer()
    - Si es igual, unir directamente (código existente)
    - _Requirements: 1.3, 2.1_
  - [ ]* 7.2 Write property test para redirección a worker correcto
    - **Property 3: Redirección a worker correcto**
    - **Validates: Requirements 1.3, 2.1**
  - [ ] 7.3 Implementar _initiateTransfer()
    - Enviar mensaje TRANSFER_PLAYER al master
    - Guardar pendingTransfer en ws
    - Implementar timeout de 5 segundos
    - _Requirements: 2.1_
  - [ ] 7.4 Implementar _handlePlayerAccepted()
    - Registrar jugador en ProxyManager
    - Enviar lobbyResponse al cliente
    - Limpiar pendingTransfer
    - _Requirements: 2.4_
  - [ ] 7.5 Implementar _handlePlayerRejected()
    - Crear sala local como fallback
    - Notificar al cliente
    - _Requirements: 5.1_

- [ ] 8. Checkpoint - Verificar flujo de transferencia
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Modificar game loop para soportar jugadores virtuales
  - [ ] 9.1 Modificar _gameLoop() para incluir jugadores virtuales en broadcast
    - Obtener jugadores virtuales de VirtualPlayerManager
    - Incluir en broadcast de estado
    - _Requirements: 4.2_
  - [ ] 9.2 Modificar _handleMessage() para detectar jugadores proxy
    - Si es jugador proxy, reenviar vía ProxyManager
    - Si es jugador local, procesar directamente
    - _Requirements: 4.1_
  - [ ] 9.3 Modificar _handleDisconnection() para jugadores proxy/virtuales
    - Si es proxy, notificar al owner vía ProxyManager.removeProxy()
    - Si es virtual, limpiar de VirtualPlayerManager
    - _Requirements: 4.4_

- [ ] 10. Verificar sincronización con Redis
  - [ ] 10.1 Asegurar que updateRoomPlayers se llama para jugadores virtuales
    - Incrementar al aceptar jugador virtual
    - Decrementar al remover jugador virtual
    - _Requirements: 3.2, 3.3_
  - [ ]* 10.2 Write property test para actualización atómica de contador
    - **Property 7: Actualización atómica de contador**
    - **Validates: Requirements 3.2, 3.3**
  - [ ]* 10.3 Write property test para campos requeridos en Redis
    - **Property 6: Campos requeridos en Redis**
    - **Validates: Requirements 3.1**

- [ ] 11. Checkpoint - Verificar sincronización Redis
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implementar manejo de errores y fallback
  - [ ] 12.1 Implementar timeout de transferencia
    - Si no hay respuesta en 5 segundos, crear sala local
    - Limpiar pendingTransfer
    - _Requirements: 5.1_
  - [ ] 12.2 Implementar manejo de worker owner no disponible
    - Verificar estado del worker antes de transferir
    - Enviar PLAYER_REJECTED si no está disponible
    - _Requirements: 5.3_
  - [ ] 12.3 Implementar manejo de desconexión durante transferencia
    - Cancelar transferencia pendiente
    - Limpiar recursos
    - _Requirements: 5.4_

- [ ] 13. Verificar propiedades de matchmaking existentes
  - [ ]* 13.1 Write property test para selección de sala óptima
    - **Property 1: Selección de sala óptima**
    - **Validates: Requirements 1.1, 1.2**
  - [ ]* 13.2 Write property test para round-trip de serialización
    - **Property 2: Round-trip de serialización**
    - **Validates: Requirements 1.5**

- [ ] 14. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

