# Implementation Plan

- [x] 1. Agregar constantes de configuración
  - [x] 1.1 Agregar configuración de límites y extensión en src/config.js
    - Agregar objeto `limitesMapa` con minX, maxX, minZ, maxZ y margenSeguridad
    - Agregar `extensionMaxima` y `margenSalida` en configuración de dash
    - _Requirements: 3.1, 3.2, 3.3, 6.4_
  - [x] 1.2 Agregar configuración de límites en server/config.js
    - Sincronizar constantes de límites con el cliente
    - _Requirements: 5.2, 5.3_

- [x] 2. Implementar sistema de detección de estructuras
  - [x] 2.1 Implementar función detectarColisionYSalida en colisiones.js
    - Lanzar raycast en dirección del dash
    - Si hay colisión, lanzar raycast inverso para encontrar punto de salida
    - Retornar objeto con puntoEntrada, puntoSalida y grosorEstructura
    - _Requirements: 2.1, 4.1, 6.1_
  - [x] 2.2 Implementar función raycastInverso en colisiones.js
    - Lanzar raycast desde punto lejano hacia atrás
    - Encontrar el punto de salida de la estructura
    - _Requirements: 4.1, 6.1_
  - [ ]* 2.3 Write property test para extensión automática
    - **Property 2: Extensión Automática Atraviesa Estructuras**
    - **Validates: Requirements 2.1, 2.2, 6.1, 6.2**

- [x] 3. Implementar cálculo de posición final con extensión
  - [x] 3.1 Implementar función calcularPosicionFinalConExtension en dash.js
    - Usar detectarColisionYSalida para detectar estructuras
    - Si hay colisión, extender distancia hasta punto de salida + margen
    - Limitar extensión máxima a 3x distancia base
    - Aplicar límites del mapa
    - _Requirements: 2.1, 2.2, 6.2, 6.4_
  - [x] 3.2 Modificar ejecutarDashInterpolado para usar extensión automática
    - Reemplazar calcularPosicionFinalDash por calcularPosicionFinalConExtension
    - Guardar si el dash fue extendido en sistemaDash.atravesoEstructura
    - _Requirements: 2.1, 2.2, 2.3_
  - [ ]* 3.3 Write property test para límite de extensión
    - **Property 8: Límite de Extensión Máxima**
    - **Validates: Requirements 6.4**

- [x] 4. Checkpoint - Verificar detección y extensión
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Mejorar sistema de desatorar
  - [x] 5.1 Mejorar función desatorarDespuesDash para buscar en dirección del dash primero
    - Buscar posición válida primero en la dirección del dash
    - Si no encuentra, buscar en 8 direcciones horizontales
    - _Requirements: 4.2, 4.3, 4.4_
  - [x] 5.2 Modificar actualizarDashInterpolacion para pasar dirección del dash
    - Pasar dirección del dash a desatorarDespuesDash
    - _Requirements: 4.2_
  - [ ]* 5.3 Write property test para desatorar
    - **Property 5: Desatorar Encuentra Posición Válida**
    - **Validates: Requirements 4.1, 4.2, 4.4**
  - [ ]* 5.4 Write property test para posición final válida
    - **Property 3: Posición Final Siempre Válida**
    - **Validates: Requirements 2.3, 2.4**

- [x] 6. Implementar interpolación suave (ya implementado)
  - [x] 6.1 Estado del dash con campos de interpolación
    - _Requirements: 1.1, 1.2_
  - [x] 6.2 Función ejecutarDashInterpolado
    - _Requirements: 1.1, 1.4_
  - [x] 6.3 Función actualizarDashInterpolacion
    - _Requirements: 1.2_
  - [ ]* 6.4 Write property test para interpolación lineal
    - **Property 1: Interpolación Lineal Correcta**
    - **Validates: Requirements 1.1, 1.2, 1.4**
  - [ ]* 6.5 Write property test para límites del mapa
    - **Property 4: Límites del Mapa Respetados**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 7. Checkpoint - Verificar interpolación y desatorar
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Actualizar validación del servidor
  - [x] 8.1 Modificar método dash en PlayerState para aceptar distancia extendida
    - Validar distancia máxima como 3x distancia base + 10% margen (16.5 unidades)
    - _Requirements: 5.2, 6.4_
  - [x] 8.2 Implementar tolerancia de discrepancia
    - Aceptar posición del cliente si diferencia < 1 unidad
    - _Requirements: 1.3, 5.4_
  - [ ]* 8.3 Write property test para validación del servidor
    - **Property 6: Validación de Distancia del Servidor**
    - **Validates: Requirements 5.2, 5.3**
  - [ ]* 8.4 Write property test para tolerancia de discrepancia
    - **Property 7: Tolerancia de Discrepancia Cliente-Servidor**
    - **Validates: Requirements 1.3, 5.4**

- [x] 9. Integrar en el flujo del juego (ya implementado)
  - [x] 9.1 Modificar main.js para llamar actualizarDashInterpolacion
    - _Requirements: 1.2_
  - [x] 9.2 Actualizar envío de posición al servidor durante dash
    - _Requirements: 5.1_
  - [x] 9.3 Modificar procesamiento de dash en gameManager
    - _Requirements: 5.2, 5.3_

- [ ] 10. Final Checkpoint - Verificar todos los tests
  - Ensure all tests pass, ask the user if questions arise.
