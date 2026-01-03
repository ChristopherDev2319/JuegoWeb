# Implementation Plan

- [x] 1. Configurar dependencias y estructura base
  - [x] 1.1 Instalar dependencia de Redis (ioredis)
    - Agregar ioredis al package.json del servidor
    - _Requirements: 5.1_
  - [x] 1.2 Crear archivo de configuración de Redis
    - Crear `server/cluster/redisConfig.js` con host, puerto, credenciales desde env vars
    - _Requirements: 5.1, 4.1_

- [x] 2. Implementar RedisConnection con resiliencia
  - [x] 2.1 Crear clase RedisConnection base
    - Implementar connect(), disconnect(), isConnected()
    - Implementar operaciones básicas: get, set, del, exists, expire
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 2.2 Implementar reconexión automática
    - Agregar lógica de retry con backoff exponencial
    - Manejar eventos de conexión/desconexión
    - _Requirements: 4.1, 4.2_
  - [x] 2.3 Implementar timeout en operaciones
    - Agregar timeout de 1 segundo a todas las operaciones
    - _Requirements: 4.3_
  - [ ]* 2.4 Write unit tests for RedisConnection
    - Test conexión exitosa
    - Test reconexión después de fallo
    - Test timeout en operaciones
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 3. Implementar serialización de salas
  - [x] 3.1 Crear funciones serializeRoom y deserializeRoom
    - Serializar RoomInfo a JSON string
    - Deserializar JSON string a RoomInfo
    - _Requirements: 1.5, 2.5_

  - [ ]* 3.2 Write property test for serialization round-trip
    - **Property 2: Round-trip de serialización**
    - **Validates: Requirements 1.5**

- [x] 4. Implementar RedisMatchmaking - Operaciones de sala
  - [x] 4.1 Crear clase RedisMatchmaking con constructor
    - Aceptar RedisConnection como dependencia
    - Definir keys de Redis (room:{id}, rooms:public)
    - _Requirements: 5.1_
  - [x] 4.2 Implementar registerRoom
    - Almacenar sala en Redis con TTL de 5 minutos
    - Agregar a índice rooms:public si es pública
    - _Requirements: 2.1, 5.3_
  - [ ]* 4.3 Write property test for required fields
    - **Property 5: Campos requeridos en almacenamiento**
    - **Validates: Requirements 2.5**
  - [x] 4.4 Implementar unregisterRoom
    - Eliminar sala de Redis
    - Remover de índice rooms:public
    - _Requirements: 5.5_
  - [ ]* 4.5 Write property test for effective removal
    - **Property 8: Eliminación efectiva**
    - **Validates: Requirements 5.5**
  - [x] 4.6 Implementar updateRoomPlayers
    - Actualizar contador atómicamente con HINCRBY
    - Actualizar score en índice rooms:public
    - _Requirements: 1.4, 5.4_
  - [ ]* 4.7 Write property test for atomic counter update
    - **Property 3: Actualización atómica de contador**
    - **Validates: Requirements 1.4, 5.4**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implementar RedisMatchmaking - Búsqueda y matchmaking
  - [x] 6.1 Implementar findAvailableRooms
    - Consultar índice rooms:public ordenado por jugadores
    - Filtrar salas con heartbeat válido (últimos 60s)
    - _Requirements: 1.1, 2.4_
  - [ ]* 6.2 Write property test for heartbeat filtering
    - **Property 4: Filtrado por heartbeat válido**
    - **Validates: Requirements 2.4**
  - [x] 6.3 Implementar findBestRoom
    - Obtener sala con más jugadores del índice
    - Retornar null si no hay salas disponibles
    - _Requirements: 1.2_
  - [ ]* 6.4 Write property test for optimal room selection
    - **Property 1: Selección de sala óptima**
    - **Validates: Requirements 1.2**
  - [x] 6.5 Implementar findOrCreateRoom
    - Buscar mejor sala disponible
    - Si no hay, crear nueva sala
    - Retornar info con workerId
    - _Requirements: 1.1, 1.2, 1.3, 5.2_
  - [ ]* 6.6 Write property test for workerId in result
    - **Property 7: Retorno incluye workerId**
    - **Validates: Requirements 5.2**

- [x] 7. Implementar locking distribuido
  - [x] 7.1 Implementar acquireLock
    - Usar SET NX EX para lock atómico con TTL de 5s
    - Implementar retry con backoff exponencial (100ms, 200ms, 400ms)
    - _Requirements: 3.1, 3.2, 3.4_
  - [x] 7.2 Implementar releaseLock
    - Verificar ownership antes de liberar
    - Usar script Lua para atomicidad
    - _Requirements: 3.3_
  - [x] 7.3 Implementar assignPlayerWithLock
    - Adquirir lock, verificar espacio, actualizar contador, liberar lock
    - _Requirements: 3.1, 3.5_
  - [ ]* 7.4 Write property test for full room rejection
    - **Property 6: Verificación de espacio con lock**
    - **Validates: Requirements 3.5**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implementar heartbeat y limpieza
  - [x] 9.1 Implementar sendHeartbeat
    - Actualizar lastHeartbeat en sala
    - Renovar TTL de la sala
    - _Requirements: 2.2_
  - [x] 9.2 Implementar cleanupStaleRooms
    - Eliminar salas sin heartbeat válido
    - _Requirements: 2.3_

- [x] 10. Implementar fallback local
  - [x] 10.1 Crear wrapper con fallback
    - Detectar cuando Redis no está disponible
    - Usar RoomManager local como fallback
    - _Requirements: 4.3, 4.4_
  - [x] 10.2 Implementar sincronización al reconectar
    - Re-registrar salas locales en Redis al reconectar
    - _Requirements: 4.4_

- [x] 11. Integrar con WorkerServer
  - [x] 11.1 Modificar WorkerServer para usar RedisMatchmaking
    - Inicializar RedisMatchmaking en start()
    - Modificar _handleLobbyMessage para matchmaking centralizado
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 11.2 Agregar heartbeat periódico de salas
    - Enviar heartbeat cada 30 segundos para salas activas
    - _Requirements: 2.2_
  - [x] 11.3 Actualizar eventos de jugador join/leave
    - Llamar updateRoomPlayers en Redis al unirse/salir
    - _Requirements: 1.4_

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 13. Tests de integración
  - [ ]* 13.1 Write integration test for multi-worker matchmaking
    - Simular múltiples workers compartiendo estado en Redis
    - Verificar que jugadores se encuentran en misma sala
    - _Requirements: 1.1, 1.2_

- [x] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
