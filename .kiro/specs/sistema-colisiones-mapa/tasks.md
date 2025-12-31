# Implementation Plan

- [x] 1. Actualizar carga del mapa visual
  - [x] 1.1 Modificar `src/escena.js` para cargar `map_visual.glb` en lugar del mapa antiguo
    - Cambiar la ruta del modelo en `cargarMapa()`
    - Ajustar escala si es necesario para el nuevo mapa
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Eliminar referencia al mapa antiguo y actualizar fallback
    - Actualizar `crearSueloFallback()` para el nuevo tamaño de mapa (50x50)
    - _Requirements: 1.3_

- [x] 2. Crear sistema de colisiones
  - [x] 2.1 Crear módulo `src/sistemas/colisiones.js` con estructura base
    - Implementar función `inicializarColisiones()` que carga `map_coll.glb`
    - Crear estructura para almacenar mesh de colisiones y raycaster
    - _Requirements: 2.1, 2.2_
  - [x] 2.2 Implementar construcción de BVH para optimización
    - Usar three-mesh-bvh o implementar BVH básico con Three.js
    - Pre-computar estructura al cargar geometría
    - _Requirements: 4.1, 4.2_
  - [x] 2.3 Implementar función `resolverColision()` con raycasting
    - Proyectar rayos en direcciones horizontales desde posición del jugador
    - Detectar intersecciones con geometría de colisiones
    - Retornar posición corregida si hay colisión
    - _Requirements: 2.3, 2.4, 4.3_
  - [ ]* 2.4 Write property test for collision prevention
    - **Property 1: Collision Prevention**
    - **Validates: Requirements 2.4**
  - [x] 2.5 Implementar función `verificarSuelo()` para detección de altura
    - Raycast hacia abajo para detectar suelo
    - Retornar altura del suelo y estado enSuelo
    - _Requirements: 5.3_
  - [ ]* 2.6 Write property test for ground height consistency
    - **Property 4: Ground Height Consistency**
    - **Validates: Requirements 5.3**

- [x] 3. Implementar respuesta de colisión con sliding
  - [x] 3.1 Implementar sliding en paredes
    - Calcular componente de velocidad paralelo a la pared
    - Aplicar movimiento de deslizamiento cuando hay colisión angular
    - _Requirements: 5.1_
  - [ ]* 3.2 Write property test for wall sliding
    - **Property 3: Wall Sliding Preserves Parallel Movement**
    - **Validates: Requirements 5.1**

- [x] 4. Integrar colisiones con el jugador
  - [x] 4.1 Modificar `src/config.js` para agregar configuración de colisiones
    - Agregar `colisiones.radioJugador`, `colisiones.alturaJugador`, etc.
    - Eliminar `jugador.limites` (ya no se necesitan límites fijos)
    - _Requirements: 3.1_
  - [x] 4.2 Modificar `src/entidades/Jugador.js` para usar sistema de colisiones
    - Importar módulo de colisiones
    - Reemplazar límites fijos por llamadas a `resolverColision()`
    - Usar `verificarSuelo()` para detección de suelo
    - _Requirements: 2.3, 3.2, 3.3_
  - [ ]* 4.3 Write property test for free movement in open areas
    - **Property 2: Free Movement in Open Areas**
    - **Validates: Requirements 3.3**

- [x] 5. Integrar inicialización en el flujo principal
  - [x] 5.1 Modificar `src/main.js` para inicializar colisiones
    - Llamar `inicializarColisiones()` después de cargar el mapa visual
    - Manejar errores de carga con fallback apropiado
    - _Requirements: 2.1_

- [x] 6. Checkpoint - Verificar funcionamiento
  - Ensure all tests pass, ask the user if questions arise.

