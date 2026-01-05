# Implementation Plan

- [x] 1. Refactorizar estado de equipamiento en armas.js
  - [x] 1.1 Crear estado unificado `estadoEquipamiento` con `itemEquipado`, `armaPrincipal`, `itemPrevioAJuiceBox`
    - Reemplazar los estados fragmentados `estadoCuchillo.equipado` y `estadoCuracion.juiceBoxEquipado`
    - Inicializar `itemEquipado` como `'ARMA'` por defecto
    - _Requirements: 3.4_
  - [x] 1.2 Crear función `actualizarVisibilidadModelos()` centralizada
    - Ocultar todos los modelos primero
    - Mostrar solo el modelo correspondiente al `itemEquipado`
    - _Requirements: 3.1, 3.2_
  - [ ]* 1.3 Write property test for invariante de exclusividad
    - **Property 1: Invariante de Exclusividad**
    - **Validates: Requirements 1.4, 3.1, 3.2**

- [x] 2. Refactorizar función `alternarCuchillo()`
  - [x] 2.1 Modificar lógica para usar `estadoEquipamiento.itemEquipado`
    - Si `itemEquipado === 'ARMA'`: cambiar a `'CUCHILLO'`, cargar modelo cuchillo
    - Si `itemEquipado === 'CUCHILLO'`: cambiar a `'ARMA'`, cargar modelo arma principal
    - Si `itemEquipado === 'JUICEBOX'`: cambiar a `'ARMA'`, ocultar JuiceBox, cargar modelo arma
    - Llamar `actualizarVisibilidadModelos()` al final
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ]* 2.2 Write property test for transiciones Q
    - **Property 2: Transiciones Q Correctas**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 3. Refactorizar función `alternarJuiceBox()`
  - [x] 3.1 Modificar lógica para usar `estadoEquipamiento.itemEquipado`
    - Si `itemEquipado !== 'JUICEBOX'`: guardar item actual en `itemPrevioAJuiceBox`, cambiar a `'JUICEBOX'`
    - Si `itemEquipado === 'JUICEBOX'`: restaurar `itemPrevioAJuiceBox`, limpiar memoria
    - Llamar `actualizarVisibilidadModelos()` al final
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 3.2 Write property test for transiciones C
    - **Property 3: Transiciones C Correctas**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 4. Actualizar funciones auxiliares
  - [x] 4.1 Actualizar `esCuchilloEquipado()` para usar `estadoEquipamiento.itemEquipado === 'CUCHILLO'`
    - _Requirements: 1.4_
  - [x] 4.2 Actualizar `esJuiceBoxEquipado()` para usar `estadoEquipamiento.itemEquipado === 'JUICEBOX'`
    - _Requirements: 1.4_
  - [x] 4.3 Actualizar `obtenerEstado()` para incluir `itemEquipado` en el retorno
    - _Requirements: 3.3_
  - [x] 4.4 Actualizar `establecerArmaUnica()` para inicializar `estadoEquipamiento` correctamente
    - _Requirements: 3.4_

- [x] 5. Checkpoint - Verificar funcionamiento
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 6. Write property test for consistencia de secuencias
  - [ ]* 6.1 Implementar test con secuencias aleatorias de Q y C
    - **Property 4: Consistencia de Secuencias**
    - **Validates: Requirements 3.3**

- [x] 7. Final Checkpoint - Verificar todo funciona
  - Ensure all tests pass, ask the user if questions arise.
