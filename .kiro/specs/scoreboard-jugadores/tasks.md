# Implementation Plan

- [-] 1. Implementar tracking de kills en el servidor
  - [x] 1.1 Agregar Map de kills por jugador en GameRoom
    - Agregar propiedad `killsPorJugador` como Map<string, number> en el constructor de GameRoom
    - Implementar método `registrarKill(killerId)` que incrementa el contador
    - Implementar método `obtenerScoreboard()` que retorna array ordenado de jugadores con kills
    - Inicializar kills a 0 cuando un jugador se une con `agregarJugador()`
    - _Requirements: 2.2, 2.3, 2.4_
  - [ ]* 1.2 Write property test para tracking de kills
    - **Property 3: Incremento de kills es correcto**
    - **Property 4: Jugadores nuevos inician con cero kills**
    - **Validates: Requirements 2.2, 2.3, 2.4**

- [x] 2. Modificar eventos de muerte en el servidor
  - [x] 2.1 Actualizar gameLoop para incluir nombres y scoreboard en eventos de muerte
    - Modificar el manejo de `events.deaths` en `server/index.js`
    - Llamar a `sala.registrarKill(death.killerId)` para cada muerte
    - Obtener nombres de lobby de killer y victim desde `sala.jugadores`
    - Incluir `killerName`, `victimName` y `scoreboard` en el mensaje de muerte
    - _Requirements: 4.1, 4.2, 4.3, 5.1_

- [x] 3. Crear módulo de UI del scoreboard en el cliente
  - [x] 3.1 Crear archivo scoreboardUI.js con estado y funciones básicas
    - Crear `src/ui/scoreboardUI.js`
    - Implementar estado `estadoScoreboard` con array de jugadores
    - Implementar `actualizarScoreboard(jugadores)` para actualizar estado
    - Implementar `obtenerMaxKills()` para calcular el máximo
    - Implementar `esLider(kills)` para verificar si tiene corona
    - _Requirements: 1.1, 3.1, 3.3_
  - [ ]* 3.2 Write property test para lógica del scoreboard
    - **Property 5: Corona para todos los líderes**
    - **Property 7: Scoreboard ordenado correctamente**
    - **Validates: Requirements 3.1, 3.3, 6.1, 6.2**
  - [x] 3.3 Implementar renderizado del scoreboard
    - Implementar `renderizarScoreboard()` que genera el HTML del panel
    - Mostrar nombre, kills y corona (si aplica) para cada jugador
    - Aplicar estilos CSS para el panel del scoreboard
    - _Requirements: 1.4, 2.1, 3.1_

- [x] 4. Integrar scoreboard con el sistema de red del cliente
  - [x] 4.1 Actualizar manejo de eventos de muerte en el cliente
    - Modificar `src/main.js` para procesar el nuevo formato de eventos de muerte
    - Extraer `killerName`, `victimName` y `scoreboard` del mensaje
    - Llamar a `actualizarScoreboard()` con los datos recibidos
    - _Requirements: 5.2_
  - [x] 4.2 Actualizar kill feed para usar nombres de lobby
    - Modificar `agregarEntradaKillFeed()` en `src/utils/ui.js`
    - Usar `killerName` y `victimName` en lugar de IDs
    - Actualizar comparación con jugador local para usar nombre
    - _Requirements: 4.1, 4.3_
  - [x] 4.3 Actualizar pantalla de muerte para usar nombre de lobby
    - Modificar `mostrarPantallaMuerte()` para recibir nombre del asesino
    - Mostrar el nombre de lobby en lugar del ID
    - _Requirements: 4.2_

- [x] 5. Agregar estilos CSS para el scoreboard
  - [x] 5.1 Crear estilos para el panel del scoreboard
    - Agregar estilos en `css/estilos.css` para `.scoreboard-panel`
    - Estilizar entradas de jugador con `.scoreboard-entry`
    - Estilizar corona con `.scoreboard-crown`
    - Posicionar el panel en la esquina superior derecha
    - _Requirements: 1.1, 3.1_

- [x] 6. Checkpoint - Asegurar que todos los tests pasan
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Incluir scoreboard en estado del juego
  - [x] 7.1 Agregar scoreboard al estado enviado periódicamente
    - Modificar `obtenerEstado()` en GameRoom para incluir scoreboard
    - Actualizar el mensaje 'state' en gameLoop para incluir scoreboard
    - Procesar scoreboard en el cliente al recibir estado
    - _Requirements: 5.1, 5.2_
  - [ ]* 7.2 Write property test para sincronización de scoreboard
    - **Property 1: Scoreboard refleja jugadores en sala**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 8. Final Checkpoint - Asegurar que todos los tests pasan
  - Ensure all tests pass, ask the user if questions arise.

