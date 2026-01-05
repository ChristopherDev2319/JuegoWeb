# Plan de Implementación

- [x] 1. Actualizar configuración del cliente (src/config.js)
  - [x] 1.1 Cambiar cadenciaDisparo de RPM a milisegundos para todas las armas
    - M4A1: 666 → 75
    - AK47: 600 → 109
    - PISTOLA: 267 → 150
    - SNIPER: 41 → 1333
    - ESCOPETA: 68 → 857
    - MP5: 850 → 71
    - _Requirements: 4.1, 4.2, 5.1, 6.1, 7.1_
  - [x] 1.2 Actualizar valores del Sniper
    - daño: 150 → 200
    - tamañoCargador: 5 → 1
    - municionTotal: 30 → 10
    - _Requirements: 2.1, 2.2, 2.5_
  - [x] 1.3 Actualizar valores de la Escopeta
    - tamañoCargador: 8 → 3
    - Mantener proyectiles: 8
    - _Requirements: 3.1, 3.2_

- [x] 2. Modificar sistema de disparo (src/sistemas/armas.js)
  - [x] 2.1 Cambiar cálculo de tiempo entre disparos
    - Eliminar conversión `(60 / cadenciaDisparo) * 1000`
    - Usar `cadenciaDisparo` directamente como milisegundos
    - _Requirements: 7.1, 8.1, 8.5_
  - [x] 2.2 Verificar que puedeDisparar() use el nuevo cálculo
    - _Requirements: 8.5_

- [x] 3. Actualizar configuración del servidor (server/config.js)
  - [x] 3.1 Cambiar daño del Sniper a 200
    - damage: 150 → 200
    - _Requirements: 2.1, 9.2_

- [x] 4. Checkpoint - Verificar sincronización
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 5. Property-based tests para sincronización
  - [ ]* 5.1 Escribir property test para sincronización cliente-servidor
    - **Property 1: Sincronización de Configuración Cliente-Servidor**
    - **Validates: Requirements 1.1, 1.3, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 10.1**
  - [ ]* 5.2 Escribir property test para cálculo de tiempo entre disparos
    - **Property 2: Cálculo Correcto de Tiempo Entre Disparos**
    - **Validates: Requirements 7.1, 8.5**
  - [ ]* 5.3 Escribir property test para conversión RPM-milisegundos
    - **Property 3: Conversión RPM-Milisegundos**
    - **Validates: Requirements 7.2**

- [ ]* 6. Unit tests para valores específicos
  - [ ]* 6.1 Test de valores del Sniper (daño=200, cargador=1, munición=10)
    - _Requirements: 2.1, 2.2, 2.5_
  - [ ]* 6.2 Test de valores de la Escopeta (cargador=3, perdigones=8)
    - _Requirements: 3.1, 3.2_
  - [ ]* 6.3 Test de cadencias de todas las armas
    - _Requirements: 4.1, 4.2, 5.1, 6.1_

- [x] 7. Final Checkpoint - Verificar que todo funcione
  - Ensure all tests pass, ask the user if questions arise.
