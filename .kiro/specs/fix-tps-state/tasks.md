# Implementation Plan

- [x] 1. Agregar sistema de estados pendientes en JugadorRemoto
  - [x] 1.1 Agregar propiedades para estados pendientes en el constructor
    - Agregar `estadoPendiente` objeto con `currentWeapon`, `isHealing`, `isAiming`
    - Agregar `tieneEstadosPendientes` flag
    - Agregar `armaAlCargar` para guardar el arma del estado inicial
    - _Requirements: 1.3, 5.3_

  - [x] 1.2 Crear método `aplicarEstadosPendientes()`
    - Aplicar arma pendiente con `actualizarArmaVisible()`
    - Aplicar estado de curación con `procesarCuracion()`
    - Limpiar estados pendientes después de aplicar
    - _Requirements: 1.3, 5.3_

  - [x] 1.3 Modificar `loadCharacterModel()` para aplicar estados pendientes
    - Después de cargar el modelo y animaciones, llamar `aplicarEstadosPendientes()`
    - Usar el arma del estado inicial (`armaAlCargar`) en lugar de default
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Corregir sincronización de arma al cargar
  - [x] 2.1 Modificar constructor para guardar arma del estado inicial
    - Guardar `state.currentWeapon` en `armaAlCargar`
    - No usar default 'M4A1' si el estado tiene arma
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Modificar `updateFromState()` para encolar estados si modelo no cargado
    - Si `!modeloCargado`, guardar estado en `estadoPendiente`
    - Marcar `tieneEstadosPendientes = true`
    - _Requirements: 5.3_

  - [x] 2.3 Asegurar que `actualizarArmaVisible()` se llame después de cargar modelo
    - Llamar con el arma correcta del estado, no default
    - _Requirements: 1.2, 5.1_

- [x] 3. Corregir visibilidad de armas durante curación
  - [x] 3.1 Modificar `procesarCuracion()` para manejar modelo no cargado
    - Si modelo no cargado, encolar estado de curación
    - Si modelo cargado, procesar normalmente
    - _Requirements: 5.2, 5.3_

  - [x] 3.2 Corregir `actualizarVisibilidadJuiceBox()` para ocultar todas las armas
    - Asegurar que TODAS las armas se oculten, no solo algunas
    - Verificar que el cuchillo también se oculte
    - _Requirements: 3.1, 3.2_

  - [x] 3.3 Corregir `finalizarCuracion()` para restaurar arma correcta
    - Usar `currentWeapon` actual, no arma previa incorrecta
    - Asegurar que JuiceBox se oculte completamente
    - _Requirements: 3.3, 4.3_

- [x] 4. Corregir animación de curación
  - [x] 4.1 Verificar carga de animación healt en `inicializarAnimaciones()`
    - Asegurar que el log de carga sea correcto
    - Verificar que `animacionCuracionCargada` se establezca correctamente
    - _Requirements: 4.1_

  - [x] 4.2 Mejorar fallback cuando animación healt no está disponible
    - Usar idle como fallback sin errores
    - Mantener el flujo de curación aunque no haya animación
    - _Requirements: 4.2_

  - [x] 4.3 Corregir transición de animación al finalizar curación
    - Verificar estado de movimiento (`estaMoviendose`) para elegir idle o walk
    - Usar transición suave
    - _Requirements: 4.3_

- [x] 5. Checkpoint - Verificar que todos los tests pasen
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 6. Agregar tests de propiedades (opcional)
  - [ ]* 6.1 Configurar fast-check para tests de propiedades
    - Instalar fast-check si no está instalado
    - Crear archivo de tests para JugadorRemoto
    - _Requirements: Testing Strategy_

  - [ ]* 6.2 Implementar Property 1: Arma visible coincide con estado
    - **Property 1: Arma visible coincide con estado del servidor**
    - **Validates: Requirements 1.1, 1.2, 5.1**

  - [ ]* 6.3 Implementar Property 3: Curación oculta armas y muestra JuiceBox
    - **Property 3: Curación oculta armas y muestra JuiceBox**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 6.4 Implementar Property 4: Fin de curación restaura arma correcta
    - **Property 4: Fin de curación restaura arma correcta**
    - **Validates: Requirements 3.3, 4.3**
