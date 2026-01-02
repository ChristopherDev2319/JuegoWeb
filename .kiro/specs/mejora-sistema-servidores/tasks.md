# Implementation Plan

- [-] 1. Corregir el sistema de matchmaking
  - [x] 1.1 Verificar que salas con un jugador aparezcan como disponibles
    - Modificar `obtenerSalasPublicasDisponibles()` para incluir salas con 1+ jugadores
    - Asegurar que `tieneEspacio()` retorna true cuando jugadores < maxJugadores
    - _Requirements: 1.1, 1.4_
  - [ ]* 1.2 Write property test para matchmaking selecciona sala con más jugadores
    - **Property 1: Matchmaking selecciona sala con más jugadores**
    - **Validates: Requirements 1.1**
  - [ ]* 1.3 Write property test para salas con un jugador permanecen disponibles
    - **Property 3: Salas con un jugador permanecen disponibles**
    - **Validates: Requirements 1.4**

- [x] 2. Corregir visualización de código de sala privada
  - [x] 2.1 Asegurar que el servidor envía roomCode en respuesta de creación
    - Verificar que `handleLobbyMessage` incluye `roomCode` en la respuesta de `createPrivate`
    - _Requirements: 2.2_
  - [x] 2.2 Corregir el cliente para mostrar el código de sala
    - Modificar el callback `onCreateSuccess` en main.js para llamar `mostrarSalaCreada(roomCode)`
    - Asegurar que la pantalla de espera se muestra correctamente
    - _Requirements: 2.1, 2.3_
  - [ ]* 2.3 Write property test para respuesta de creación contiene roomCode
    - **Property 4: Respuesta de creación de sala privada contiene roomCode**
    - **Validates: Requirements 2.2**

- [x] 3. Verificar separación de partidas
  - [x] 3.1 Confirmar que cada sala tiene GameManager independiente
    - Revisar constructor de GameRoom para asegurar nueva instancia de GameManager
    - _Requirements: 3.1_
  - [x] 3.2 Verificar que inputs se procesan solo en la sala correcta
    - Revisar `handleMessage` para usar el GameManager de la sala del jugador
    - _Requirements: 3.2, 3.4_
  - [x] 3.3 Verificar que broadcast va solo a jugadores de la misma sala
    - Revisar `broadcastToRoom` para enviar solo a jugadores de esa sala
    - _Requirements: 3.3_
  - [ ]* 3.4 Write property test para GameManager independiente por sala
    - **Property 5: Cada sala tiene GameManager independiente**
    - **Validates: Requirements 3.1**
  - [ ]* 3.5 Write property test para aislamiento de inputs
    - **Property 6: Inputs se procesan solo en la sala del jugador**
    - **Validates: Requirements 3.2**

- [x] 4. Verificar límite de 8 jugadores por sala
  - [x] 4.1 Confirmar validación de límite en agregarJugador
    - Verificar que `tieneEspacio()` compara correctamente con maxJugadores (8)
    - _Requirements: 4.1_
  - [x] 4.2 Confirmar que matchmaking excluye salas llenas
    - Verificar que `obtenerSalasPublicasDisponibles()` filtra salas sin espacio
    - _Requirements: 4.2_
  - [ ]* 4.3 Write property test para sala llena rechaza jugadores
    - **Property 8: Sala llena rechaza nuevos jugadores**
    - **Validates: Requirements 4.1**
  - [ ]* 4.4 Write property test para matchmaking excluye salas llenas
    - **Property 9: Matchmaking excluye salas llenas**
    - **Validates: Requirements 4.2**

- [x] 5. Mejorar sincronización de estado de sala
  - [x] 5.1 Agregar notificación de jugadores actuales al unirse
    - Modificar respuesta de `joinPrivate` y `matchmaking` para incluir lista de jugadores
    - _Requirements: 5.3_
  - [x] 5.2 Verificar notificaciones de entrada/salida de jugadores
    - Confirmar que `playerJoined` y `playerLeft` se envían correctamente
    - _Requirements: 5.1, 5.2_
  - [x] 5.3 Actualizar cliente para manejar lista de jugadores
    - Modificar callbacks para actualizar UI con lista de jugadores
    - _Requirements: 5.4_
  - [ ]* 5.4 Write property test para notificación de cambios en jugadores
    - **Property 11: Notificación de cambios en jugadores**
    - **Validates: Requirements 5.1, 5.2**

- [x] 6. Mejorar manejo de errores
  - [x] 6.1 Estandarizar mensajes de error en servidor
    - Verificar mensajes consistentes: "Sala no encontrada", "Contraseña incorrecta", "Partida llena"
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 6.2 Mejorar visualización de errores en cliente
    - Asegurar que errores se muestran en la pantalla correcta
    - _Requirements: 6.4_

- [x] 7. Checkpoint - Asegurar que todo funciona
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Pruebas de integración manual
  - [x] 8.1 Probar flujo completo de matchmaking
    - Verificar que un jugador solo puede unirse y otros se conectan a su sala
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 8.2 Probar flujo de partida privada
    - Crear sala, verificar código visible, unirse con código
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 8.3 Probar límite de jugadores
    - Intentar unir más de 8 jugadores a una sala
    - _Requirements: 4.1, 4.2, 4.3_

