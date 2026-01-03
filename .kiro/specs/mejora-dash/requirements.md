# Requirements Document

## Introduction

Este documento especifica los requisitos para mejorar el sistema de dash del juego FPS. El sistema actual tiene dos problemas principales: el movimiento no se siente fluido cuando se juega en línea (el dash es instantáneo en lugar de animado), y el dash se detiene al colisionar con objetos internos del mapa. La mejora permitirá que el dash atraviese colisiones internas del mapa (como cajas, paredes internas, etc.) pero respete las 4 paredes exteriores que delimitan el área jugable.

## Glossary

- **Dash**: Habilidad de movimiento rápido que permite al jugador desplazarse una distancia fija en una dirección
- **Sistema de Dash**: Módulo que gestiona las cargas, ejecución y recarga del dash
- **Paredes Exteriores**: Las 4 paredes que delimitan el área jugable del mapa (norte, sur, este, oeste)
- **Colisiones Internas**: Cualquier geometría de colisión dentro del área jugable (cajas, edificios, obstáculos)
- **Interpolación**: Técnica de suavizado que calcula posiciones intermedias entre dos puntos
- **Dash Fantasma**: Mecánica donde el jugador atraviesa colisiones internas durante el dash
- **Límites del Mapa**: Coordenadas que definen el área jugable (actualmente -125 a 125 en X y Z)

## Requirements

### Requirement 1

**User Story:** Como jugador, quiero que el dash se sienta fluido y suave cuando juego en línea, para que la experiencia de movimiento sea satisfactoria.

#### Acceptance Criteria

1. WHEN el jugador ejecuta un dash THEN el Sistema de Dash SHALL interpolar la posición del jugador desde el punto inicial hasta el punto final durante la duración del dash (200ms)
2. WHEN el dash está en progreso THEN el Sistema de Dash SHALL actualizar la posición del jugador en cada frame usando interpolación lineal
3. WHEN el servidor recibe una actualización de posición durante un dash THEN el Sistema de Dash SHALL aceptar posiciones intermedias sin corrección brusca
4. WHEN el dash termina THEN el Sistema de Dash SHALL garantizar que el jugador esté exactamente en la posición final calculada

### Requirement 2

**User Story:** Como jugador, quiero que el dash atraviese obstáculos internos del mapa completamente, para poder usar el dash como mecánica de evasión sin quedarme atrapado dentro de estructuras.

#### Acceptance Criteria

1. WHEN el jugador ejecuta un dash hacia una colisión interna THEN el Sistema de Dash SHALL detectar la estructura y calcular la distancia necesaria para atravesarla completamente
2. WHEN el dash colisiona con una estructura THEN el Sistema de Dash SHALL extender automáticamente la distancia del dash para posicionar al jugador al final de la estructura (lado opuesto)
3. WHEN el dash atraviesa una colisión interna THEN el Sistema de Dash SHALL garantizar que la posición final esté fuera de cualquier geometría de colisión
4. WHEN el jugador termina un dash THEN el Sistema de Dash SHALL verificar que la posición final sea válida y no esté dentro de ninguna estructura

### Requirement 3

**User Story:** Como jugador, quiero que el dash respete las paredes exteriores del mapa, para no poder salir del área jugable.

#### Acceptance Criteria

1. WHEN el jugador ejecuta un dash hacia una pared exterior THEN el Sistema de Dash SHALL detener el dash en el límite del mapa
2. WHEN el dash alcanza un límite del mapa THEN el Sistema de Dash SHALL posicionar al jugador a una distancia segura (0.5 unidades) del límite
3. WHEN el jugador intenta hacer dash fuera del mapa THEN el Sistema de Dash SHALL limitar la posición final a las coordenadas máximas permitidas (-122 a 122 en X y Z)

### Requirement 4

**User Story:** Como jugador, quiero que el dash siempre me deje en una posición válida, para poder continuar jugando sin problemas después de usar el dash.

#### Acceptance Criteria

1. WHEN el dash detecta una colisión THEN el Sistema de Dash SHALL usar raycasting para encontrar el punto de salida al otro lado de la estructura
2. WHEN se calcula el punto de salida THEN el Sistema de Dash SHALL posicionar al jugador justo después del final de la estructura con un margen de seguridad (0.5 unidades)
3. IF la estructura es demasiado gruesa para atravesar THEN el Sistema de Dash SHALL buscar la posición válida más cercana en la dirección del dash
4. IF no se encuentra posición válida en la dirección del dash THEN el Sistema de Dash SHALL buscar en 8 direcciones horizontales alternativas

### Requirement 5

**User Story:** Como desarrollador, quiero que el sistema de dash sea consistente entre cliente y servidor, para evitar desincronización y correcciones bruscas.

#### Acceptance Criteria

1. WHEN el cliente ejecuta un dash THEN el Sistema de Dash SHALL enviar la posición final calculada al servidor
2. WHEN el servidor recibe un dash THEN el Sistema de Dash SHALL validar que la distancia del dash no exceda el máximo permitido (distancia base + extensión por atravesar estructura + margen de 10%)
3. WHEN el servidor valida un dash THEN el Sistema de Dash SHALL aceptar la posición del cliente si está dentro de los límites del mapa
4. WHEN hay discrepancia entre cliente y servidor THEN el Sistema de Dash SHALL priorizar la posición del servidor solo si la diferencia excede 1 unidad

### Requirement 6

**User Story:** Como jugador, quiero que el dash extienda su distancia automáticamente cuando colisiona con una estructura, para siempre aparecer al otro lado sin quedarme atrapado.

#### Acceptance Criteria

1. WHEN el dash colisiona con una estructura THEN el Sistema de Dash SHALL lanzar un raycast en la dirección del dash para detectar el punto de entrada y salida de la estructura
2. WHEN se detecta el punto de salida THEN el Sistema de Dash SHALL calcular la nueva posición final como el punto de salida más un margen de seguridad (0.5 unidades)
3. WHEN la estructura tiene múltiples capas THEN el Sistema de Dash SHALL continuar el raycast hasta encontrar espacio libre válido
4. WHEN el dash se extiende THEN el Sistema de Dash SHALL limitar la extensión máxima a 3 veces la distancia base del dash para evitar atravesar el mapa completo

