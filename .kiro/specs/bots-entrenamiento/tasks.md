# Implementation Plan

- [x] 1. Configuración base del sistema de bots
  - [x] 1.1 Agregar configuración de bots de entrenamiento a src/config.js
    - Añadir sección `botsEntrenamiento` con configuración para cada tipo de bot
    - Definir colores, vida, tiempos de respawn, velocidades y zonas
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

- [x] 2. Implementar clase base BotBase
  - [x] 2.1 Crear archivo src/entidades/BotBase.js con clase base
    - Implementar constructor con mesh, barra de vida y datos básicos
    - Implementar métodos: recibirDaño, morir, reaparecer, actualizar
    - Implementar sistema de barra de vida con indicador de tipo
    - _Requirements: 1.2, 1.3, 1.4, 5.4_
  - [ ]* 2.2 Write property test for damage calculation
    - **Property 2: Daño reduce vida correctamente**
    - **Validates: Requirements 1.2, 1.4**
  - [ ]* 2.3 Write property test for respawn
    - **Property 3: Respawn restaura estado inicial**
    - **Validates: Requirements 1.3, 2.4, 3.5**

- [x] 3. Implementar BotEstatico
  - [x] 3.1 Crear archivo src/entidades/BotEstatico.js
    - Extender BotBase con tipo 'estatico' y color rojo
    - Implementar actualizar() solo para verificar respawn
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1_
  - [ ]* 3.2 Write property test for bot color
    - **Property 8: Colores distintivos por tipo** (para estático)
    - **Validates: Requirements 5.1**

- [x] 4. Implementar BotMovil
  - [x] 4.1 Crear archivo src/entidades/BotMovil.js
    - Extender BotBase con tipo 'movil' y color azul
    - Implementar movimiento lateral con inversión de dirección
    - Implementar actualizar() con lógica de movimiento
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.2_
  - [ ]* 4.2 Write property test for lateral movement bounds
    - **Property 4: Movimiento lateral dentro de rango**
    - **Validates: Requirements 2.2, 2.3**

- [x] 5. Implementar BotTirador
  - [x] 5.1 Crear archivo src/entidades/BotTirador.js
    - Extender BotBase con tipo 'tirador' y color naranja
    - Implementar verificarLineaVision() con raycast
    - Implementar disparar() con daño reducido
    - Implementar actualizar() con lógica de disparo
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.3_
  - [ ]* 5.2 Write property test for line of sight
    - **Property 5: Línea de visión determina disparo**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  - [ ]* 5.3 Write property test for reduced damage
    - **Property 6: Daño de bot tirador es reducido**
    - **Validates: Requirements 3.4**

- [x] 6. Checkpoint - Verificar clases de bots
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implementar sistema de zonas y estadísticas
  - [x] 7.1 Crear archivo src/entidades/ZonaEntrenamiento.js
    - Implementar clase ZonaEntrenamiento con centro, radio y tipo
    - Implementar contienePunto() para verificar si un punto está en la zona
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 7.2 Crear archivo src/entidades/EstadisticasEntrenamiento.js
    - Implementar contadores por tipo de bot
    - Implementar registrarEliminacion(), registrarImpactoRecibido()
    - Implementar obtenerPrecision() y reiniciar()
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 7.3 Write property test for elimination counter
    - **Property 7: Contador de eliminaciones incrementa correctamente**
    - **Validates: Requirements 6.2**

- [x] 8. Implementar BotManager
  - [x] 8.1 Crear archivo src/sistemas/botManager.js
    - Implementar inicializar() que crea zonas y bots
    - Implementar crearBotsEnZona() para poblar cada zona
    - Implementar actualizar() que actualiza todos los bots
    - Implementar registrarEliminacion() y obtenerEstadisticas()
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.2, 4.3, 4.4, 6.2_
  - [ ]* 8.2 Write property test for system initialization
    - **Property 1: Inicialización correcta del sistema de bots**
    - **Validates: Requirements 1.1, 2.1, 4.1, 4.2, 4.3**

- [x] 9. Integrar con sistema principal
  - [x] 9.1 Modificar src/main.js para inicializar BotManager en modo local
    - Importar BotManager
    - Crear instancia cuando modoJuegoActual === 'local'
    - Llamar botManager.actualizar() en el bucle del juego
    - _Requirements: 1.1, 2.1, 3.1, 4.4_
  - [x] 9.2 Integrar con sistema de balas para detectar impactos en bots
    - Modificar lógica de impacto para verificar bots de entrenamiento
    - Llamar recibirDaño() cuando una bala impacta un bot
    - _Requirements: 1.4_

- [x] 10. Implementar UI de estadísticas
  - [x] 10.1 Crear UI para mostrar estadísticas de entrenamiento
    - Agregar elemento HTML para contador de eliminaciones
    - Agregar estilos CSS para el panel de estadísticas
    - Actualizar UI cuando se elimina un bot
    - _Requirements: 6.1, 6.2_
  - [x] 10.2 Agregar indicador de zona actual
    - Mostrar nombre de la zona cuando el jugador entra
    - _Requirements: 4.4_

- [x] 11. Checkpoint Final - Verificar integración completa
  - Ensure all tests pass, ask the user if questions arise.
