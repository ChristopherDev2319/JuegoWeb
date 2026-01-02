# Implementation Plan

- [x] 1. Configurar Rapier3D en el proyecto
  - [x] 1.1 Instalar dependencia @dimforge/rapier3d-compat
    - Agregar al package.json
    - Ejecutar npm install
    - _Requirements: 5.1_
  - [x] 1.2 Crear módulo de física `src/sistemas/fisica.js`
    - Implementar `inicializarFisica()` que carga el WASM de Rapier
    - Crear mundo de física con gravedad configurada
    - Exportar referencia a RAPIER para uso en otros módulos
    - _Requirements: 5.1, 5.2_

- [x] 2. Implementar colisiones del mapa con Rapier
  - [x] 2.1 Implementar carga de geometría de colisiones
    - Cargar `map_coll.glb` y extraer vértices/índices
    - Crear trimesh collider en Rapier
    - Escalar geometría para coincidir con mapa visual (5x)
    - _Requirements: 5.2_
  - [x] 2.2 Implementar character controller
    - Crear cápsula para el jugador con radio y altura configurados
    - Configurar altura máxima de escalón (0.5 unidades)
    - Configurar ángulo máximo de rampa (45 grados)
    - _Requirements: 2.1, 2.2, 5.3_
  - [ ]* 2.3 Write property test for terrain traversal
    - **Property 3: Terrain Traversal Consistency**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 3. Implementar movimiento del jugador con Rapier
  - [x] 3.1 Implementar función `moverJugador()`
    - Usar `computeColliderMovement()` del character controller
    - Aplicar desplazamiento y obtener posición corregida
    - Detectar estado de suelo desde el controller
    - _Requirements: 2.3, 2.4, 6.1_
  - [x] 3.2 Implementar detección de suelo mejorada
    - Raycast hacia abajo para detectar altura del suelo
    - Calcular normal del suelo para rampas
    - Detectar transición a caída cuando no hay suelo
    - _Requirements: 3.2, 3.3, 3.4_
  - [ ]* 3.3 Write property test for landing height
    - **Property 4: Landing Height Correctness**
    - **Validates: Requirements 3.2, 3.3**
  - [ ]* 3.4 Write property test for player position validity
    - **Property 2: Player Never Inside Geometry**
    - **Validates: Requirements 4.4, 6.3**

- [x] 4. Integrar física con el jugador existente
  - [x] 4.1 Refactorizar `src/sistemas/colisiones.js`
    - Mantener API existente (`resolverColision`, `verificarSuelo`)
    - Usar Rapier internamente en lugar de raycasting manual
    - Implementar fallback si Rapier no está disponible
    - _Requirements: 2.3, 2.4, 3.1_
  - [x] 4.2 Actualizar `src/entidades/Jugador.js`
    - Usar nueva función de movimiento con character controller
    - Actualizar lógica de gravedad para usar detección de suelo mejorada
    - Mantener compatibilidad con reconciliación de servidor
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 4.3 Write property test for wall sliding
    - **Property 5: Wall Sliding Preserves Parallel Movement**
    - **Validates: Requirements 6.1**

- [x] 5. Checkpoint - Verificar movimiento básico
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implementar colisiones de dash
  - [x] 6.1 Actualizar sistema de dash para usar Rapier
    - Usar shape cast para el movimiento del dash
    - Detectar colisiones durante el dash completo
    - Calcular posición final válida si hay colisión
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 6.2 Write property test for dash collision safety
    - **Property 6: Dash Collision Safety**
    - **Validates: Requirements 4.1, 4.2**

- [x] 7. Implementar raycast para balas
  - [x] 7.1 Implementar `raycastBala()` en módulo de física
    - Crear raycast desde origen en dirección dada
    - Retornar punto de impacto y distancia si hay colisión
    - Filtrar para solo colisionar con geometría del mapa
    - _Requirements: 1.1, 1.2_
  - [x] 7.2 Integrar raycast en sistema de balas del cliente
    - Verificar colisión con mapa antes de mover bala
    - Desactivar bala y crear efecto de impacto si colisiona
    - _Requirements: 1.3_
  - [ ]* 7.3 Write property test for bullet-wall occlusion
    - **Property 1: Bullet-Wall Occlusion**
    - **Validates: Requirements 1.4**

- [x] 8. Implementar colisiones de balas en servidor
  - [x] 8.1 Crear módulo `server/mapCollisions.js`
    - Cargar datos simplificados del mapa (AABBs de paredes)
    - Implementar raycast contra AABBs
    - _Requirements: 1.1, 1.2_
  - [x] 8.2 Integrar colisiones de mapa en `server/bulletSystem.js`
    - Verificar colisión con mapa antes de verificar jugadores
    - Desactivar bala si colisiona con mapa
    - _Requirements: 1.3, 1.4_

- [x] 9. Actualizar configuración
  - [x] 9.1 Agregar configuración de física a `src/config.js`
    - Agregar sección `fisica` con parámetros del character controller
    - Configurar gravedad, altura de escalón, ángulo de rampa
    - _Requirements: 2.1, 2.2, 5.4_

- [x] 10. Checkpoint final - Verificar sistema completo
  - Ensure all tests pass, ask the user if questions arise.

