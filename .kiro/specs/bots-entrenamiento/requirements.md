# Requirements Document

## Introduction

Este documento define los requisitos para un sistema de bots de entrenamiento en el modo local del juego FPS. El sistema proporcionará diferentes tipos de bots ubicados en secciones específicas del mapa para que los jugadores puedan practicar diferentes habilidades: puntería estática, seguimiento de objetivos móviles, y reacción ante disparos enemigos.

## Glossary

- **Bot de Entrenamiento**: Entidad controlada por IA que simula un enemigo para práctica del jugador
- **Bot Estático**: Bot que permanece inmóvil, usado para practicar puntería básica y daño
- **Bot Móvil**: Bot que se mueve en patrones predefinidos (lateral, circular, aleatorio)
- **Bot Tirador**: Bot que dispara al jugador cuando está en su línea de visión
- **Zona de Entrenamiento**: Área específica del mapa donde se ubican los bots
- **Sistema de Bots**: Módulo que gestiona la creación, actualización y comportamiento de todos los bots
- **Patrón de Movimiento**: Trayectoria predefinida que sigue un bot móvil
- **Línea de Visión**: Rayo directo entre el bot tirador y el jugador sin obstrucciones

## Requirements

### Requirement 1

**User Story:** Como jugador, quiero tener bots estáticos en el modo local, para poder practicar mi puntería y testear el daño de mis armas.

#### Acceptance Criteria

1. WHEN el jugador inicia el modo local THEN el Sistema de Bots SHALL crear bots estáticos en posiciones predefinidas del mapa
2. WHEN un bot estático recibe daño THEN el Sistema de Bots SHALL mostrar la cantidad de daño recibido visualmente
3. WHEN un bot estático es eliminado THEN el Sistema de Bots SHALL reaparecer el bot después de un tiempo configurable
4. WHEN el jugador dispara a un bot estático THEN el Sistema de Bots SHALL registrar el impacto y actualizar la barra de vida del bot

### Requirement 2

**User Story:** Como jugador, quiero tener bots que se muevan de izquierda a derecha, para poder practicar el seguimiento de objetivos móviles.

#### Acceptance Criteria

1. WHEN el jugador inicia el modo local THEN el Sistema de Bots SHALL crear bots móviles laterales en zonas designadas
2. WHILE un bot móvil lateral está activo THEN el Sistema de Bots SHALL mover el bot en un patrón de ida y vuelta horizontal
3. WHEN un bot móvil lateral alcanza el límite de su rango THEN el Sistema de Bots SHALL invertir la dirección del movimiento
4. WHEN un bot móvil lateral es eliminado THEN el Sistema de Bots SHALL detener el movimiento y reaparecer el bot en su posición inicial

### Requirement 3

**User Story:** Como jugador, quiero tener bots que disparen en línea recta cuando estoy en su posición, para poder practicar esquivar y reaccionar ante fuego enemigo.

#### Acceptance Criteria

1. WHEN el jugador entra en la línea de visión de un bot tirador THEN el Sistema de Bots SHALL iniciar disparos hacia el jugador
2. WHILE el jugador permanece en la línea de visión del bot tirador THEN el Sistema de Bots SHALL continuar disparando a intervalos regulares
3. WHEN el jugador sale de la línea de visión del bot tirador THEN el Sistema de Bots SHALL detener los disparos
4. WHEN un disparo del bot tirador impacta al jugador THEN el Sistema de Bots SHALL aplicar daño reducido al jugador para entrenamiento
5. IF el bot tirador es eliminado THEN el Sistema de Bots SHALL detener los disparos y reaparecer el bot después del tiempo de respawn

### Requirement 4

**User Story:** Como jugador, quiero que los bots estén organizados en zonas específicas del mapa, para poder elegir qué tipo de entrenamiento practicar.

#### Acceptance Criteria

1. WHEN el modo local se inicializa THEN el Sistema de Bots SHALL crear una zona de bots estáticos separada de otras zonas
2. WHEN el modo local se inicializa THEN el Sistema de Bots SHALL crear una zona de bots móviles separada de otras zonas
3. WHEN el modo local se inicializa THEN el Sistema de Bots SHALL crear una zona de bots tiradores separada de otras zonas
4. WHEN el jugador se acerca a una zona de entrenamiento THEN el Sistema de Bots SHALL activar los bots de esa zona

### Requirement 5

**User Story:** Como jugador, quiero indicadores visuales que distingan los diferentes tipos de bots, para poder identificarlos fácilmente durante el entrenamiento.

#### Acceptance Criteria

1. WHEN un bot estático es creado THEN el Sistema de Bots SHALL asignar un color distintivo rojo al bot
2. WHEN un bot móvil es creado THEN el Sistema de Bots SHALL asignar un color distintivo azul al bot
3. WHEN un bot tirador es creado THEN el Sistema de Bots SHALL asignar un color distintivo naranja al bot
4. WHEN cualquier bot muestra su barra de vida THEN el Sistema de Bots SHALL incluir un indicador del tipo de bot

### Requirement 6

**User Story:** Como jugador, quiero poder ver estadísticas de mi entrenamiento, para poder medir mi progreso.

#### Acceptance Criteria

1. WHILE el jugador está en modo local THEN el Sistema de Bots SHALL mostrar un contador de bots eliminados
2. WHEN el jugador elimina un bot THEN el Sistema de Bots SHALL incrementar el contador correspondiente al tipo de bot
3. WHEN el jugador recibe daño de un bot tirador THEN el Sistema de Bots SHALL registrar el impacto recibido
4. WHEN el jugador solicita ver estadísticas THEN el Sistema de Bots SHALL mostrar precisión y tiempo de reacción promedio
