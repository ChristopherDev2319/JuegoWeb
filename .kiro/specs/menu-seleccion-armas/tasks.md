# Plan de Implementación

- [x] 1. Crear módulo de estado de selección de armas
  - [x] 1.1 Crear archivo `src/sistemas/seleccionArmas.js` con estado y funciones básicas
    - Implementar `estadoSeleccion` con armaSeleccionada, menuVisible, enPantallaMuerte, tiempoMuerte, puedeReaparecer
    - Implementar `seleccionarArma(tipoArma)` para actualizar selección
    - Implementar `obtenerArmasDisponibles()` que lee de CONFIG.armas
    - Implementar `cambioArmaPermitido()` que retorna false cuando está en partida
    - _Requirements: 1.1, 2.2, 2.3_
  - [ ]* 1.2 Escribir property test para estado de selección
    - **Property 6: Menú muestra todas las armas configuradas**
    - **Validates: Requirements 1.1, 1.2**
  - [ ]* 1.3 Escribir property test para cambio de arma deshabilitado
    - **Property 5: Cambio de arma deshabilitado en partida**
    - **Validates: Requirements 2.3**

- [x] 2. Crear componente UI del menú de selección de armas
  - [x] 2.1 Crear archivo `src/lobby/seleccionArmasUI.js` con estructura HTML/CSS del menú
    - Crear contenedor principal con grid de tarjetas de armas
    - Crear tarjeta de arma con nombre, tipo, stats básicos
    - Crear botón "Jugar" deshabilitado hasta seleccionar arma
    - Agregar estilos CSS en `css/estilos.css`
    - _Requirements: 1.1, 1.2_
  - [x] 2.2 Implementar funciones de mostrar/ocultar menú y actualización visual
    - Implementar `mostrarMenuArmas(opciones)` 
    - Implementar `ocultarMenuArmas()`
    - Implementar `actualizarSeleccionVisual(tipoArma)` para highlight de tarjeta seleccionada
    - _Requirements: 1.4, 3.1_
  - [ ]* 2.3 Escribir property test para selección visual
    - **Property 2: Selección de arma no activa pointer lock**
    - **Validates: Requirements 1.4**

- [x] 3. Integrar menú con flujo de entrada a partida
  - [x] 3.1 Modificar `src/main.js` para mostrar menú de selección después del lobby
    - Interceptar flujo en `onIniciarJuego()` para mostrar menú de selección primero
    - Pasar callback para cuando el jugador presione "Jugar"
    - _Requirements: 1.1, 2.1_
  - [x] 3.2 Implementar lógica de iniciar juego con arma seleccionada
    - Implementar `iniciarJuego()` que oculta menú, equipa arma, activa pointer lock
    - Modificar `inicializarArmaInicial()` para usar arma seleccionada en lugar de M4A1
    - Limpiar inventario para contener solo arma seleccionada
    - _Requirements: 2.1, 2.2_
  - [ ]* 3.3 Escribir property test para inventario único
    - **Property 4: Inventario contiene solo arma seleccionada**
    - **Validates: Requirements 2.2**

- [x] 4. Checkpoint - Asegurar que todos los tests pasan
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Integrar control de pointer lock con menú de selección
  - [x] 5.1 Modificar `src/sistemas/controles.js` para respetar estado del menú
    - Agregar verificación de `estadoSeleccion.menuVisible` antes de activar pointer lock
    - Prevenir activación de pointer lock en clicks dentro del menú
    - _Requirements: 1.3, 5.1, 5.2_
  - [ ]* 5.2 Escribir property test para pointer lock durante menús
    - **Property 1: Pointer lock desactivado durante menús**
    - **Validates: Requirements 1.3, 3.2, 5.1, 5.2**

- [x] 6. Deshabilitar cambio de arma durante partida
  - [x] 6.1 Modificar handlers de cambio de arma en `src/sistemas/controles.js`
    - Agregar verificación de `cambioArmaPermitido()` en handler de teclas 1-6
    - Agregar verificación en handler de rueda del mouse
    - _Requirements: 2.3_

- [x] 7. Integrar menú de selección con pantalla de muerte
  - [x] 7.1 Modificar `src/utils/ui.js` para incluir selector de armas en pantalla de muerte
    - Modificar `mostrarPantallaMuerte()` para incluir menú de selección de armas
    - Agregar timer de 5 segundos para mostrar botón "Reaparecer"
    - Desactivar pointer lock al mostrar pantalla de muerte
    - _Requirements: 3.1, 3.2, 3.4_
  - [x] 7.2 Implementar lógica de reaparecer con arma seleccionada
    - Implementar `reaparecer()` que oculta pantalla, equipa arma, activa pointer lock
    - Mantener arma previa como selección por defecto si no hay cambio
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ]* 7.3 Escribir property test para transición al juego
    - **Property 3: Transición al juego activa pointer lock**
    - **Validates: Requirements 2.1, 4.1, 4.2, 5.3**
  - [ ]* 7.4 Escribir property test para arma por defecto
    - **Property 7: Arma por defecto se mantiene sin interacción**
    - **Validates: Requirements 4.3**

- [x] 8. Checkpoint final - Asegurar que todos los tests pasan
  - Ensure all tests pass, ask the user if questions arise.
