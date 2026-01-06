# Implementation Plan

- [x] 1. Optimizar carga de Lucide Icons en index.html
  - [x] 1.1 Eliminar script duplicado de Lucide Icons
    - Remover la segunda etiqueta `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js">` 
    - Mantener solo `lucide.min.js` con defer
    - _Requirements: 1.1_
  - [x] 1.2 Consolidar inicialización de Lucide Icons
    - Eliminar llamadas duplicadas a lucide.createIcons()
    - Mantener solo una inicialización en DOMContentLoaded
    - Crear función debounced para reinicializaciones dinámicas
    - _Requirements: 1.2, 1.3_
  - [ ]* 1.3 Write property test for debounced icon reinitialization
    - **Property 1: Debounced Icon Reinitialization**
    - **Validates: Requirements 1.3**

- [x] 2. Optimizar sistema de efectos de partículas
  - [x] 2.1 Implementar pool de geometrías compartidas en efectos.js
    - Crear geometría compartida única para todas las partículas
    - Modificar crearEfectoImpacto, crearEfectoDash, crearEfectoRespawn para usar geometría compartida
    - _Requirements: 2.1_
  - [x] 2.2 Optimizar creación y limpieza de materiales
    - Asegurar que dispose() se llame en todos los materiales al completar efectos
    - Usar setInterval con clearInterval apropiado
    - _Requirements: 2.2, 6.2_
  - [ ]* 2.3 Write property test for material disposal
    - **Property 3: Material Disposal on Effect Completion**
    - **Validates: Requirements 2.2**
  - [ ]* 2.4 Write property test for interval cleanup
    - **Property 8: Interval Cleanup**
    - **Validates: Requirements 6.2**

- [x] 3. Optimizar CSS del lobby
  - [x] 3.1 Simplificar animación floatBubbles
    - Reducir complejidad de keyframes
    - Usar solo transform y opacity para GPU acceleration
    - _Requirements: 3.1, 3.2_
  - [x] 3.2 Agregar pausa de animaciones cuando lobby está oculto
    - Agregar regla CSS para pausar animaciones en #lobby-screen.hidden
    - _Requirements: 3.4_
  - [ ]* 3.3 Write property test for animation pause
    - **Property 4: Animation Pause on Lobby Hide**
    - **Validates: Requirements 3.4**

- [x] 4. Limpiar CSS duplicado y no utilizado
  - [x] 4.1 Eliminar estilos duplicados de configuración del lobby
    - Consolidar reglas duplicadas de #lobby-config .config-item
    - Eliminar estilos comentados obsoletos
    - _Requirements: 4.1, 4.4_
  - [x] 4.2 Consolidar animaciones similares
    - Unificar animaciones de pulse similares
    - Reducir keyframes redundantes
    - _Requirements: 4.2_

- [x] 5. Optimizar actualizaciones de UI
  - [x] 5.1 Verificar y mejorar cache de DOM en ui.js
    - Asegurar que todas las funciones de actualización usen cache
    - Agregar cache faltante si es necesario
    - _Requirements: 5.1_
  - [x] 5.2 Optimizar actualizaciones condicionales
    - Verificar que actualizarDashBox solo actualice cuando cambie el estado
    - Verificar que actualizarBarraVida use interpolación eficiente
    - _Requirements: 5.2_
  - [ ]* 5.3 Write property test for DOM cache consistency
    - **Property 5: DOM Cache Consistency**
    - **Validates: Requirements 5.1**
  - [ ]* 5.4 Write property test for conditional DOM updates
    - **Property 6: Conditional DOM Updates**
    - **Validates: Requirements 5.2**

- [x] 6. Optimizar kill feed
  - [x] 6.1 Verificar límite de 5 entradas en kill feed
    - Asegurar que agregarEntradaKillFeed mantenga máximo 5 entradas
    - Optimizar eliminación de entradas antiguas
    - _Requirements: 5.4_
  - [ ]* 6.2 Write property test for kill feed limit
    - **Property 7: Kill Feed Entry Limit**
    - **Validates: Requirements 5.4**

- [x] 7. Checkpoint - Verificar optimizaciones
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Limpieza final y verificación
  - [x] 8.1 Eliminar console.logs innecesarios de producción
    - Revisar y eliminar logs de debug excesivos
    - Mantener solo logs de errores importantes
    - _Requirements: 6.4_
  - [x] 8.2 Verificar que no hay memory leaks
    - Revisar que todos los listeners se limpien apropiadamente
    - Verificar dispose() en objetos Three.js
    - _Requirements: 6.1, 6.3_

- [x] 9. Final Checkpoint - Verificar todas las optimizaciones
  - Ensure all tests pass, ask the user if questions arise.
