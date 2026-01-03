# Requirements Document

## Introduction

Este documento especifica los requisitos para implementar un sistema de scoreboard (tabla de puntuación) en el modo multijugador online del juego FPS. El sistema mostrará una lista de jugadores conectados en la sala actual con sus nombres (elegidos en el lobby) y el número de kills que llevan. Además, incluirá un indicador visual (corona) para el jugador con más kills en la sala, y mostrará el nombre correcto del asesino en el kill feed cuando un jugador es eliminado.

## Glossary

- **Scoreboard**: Panel de interfaz que muestra la lista de jugadores conectados y sus estadísticas de kills
- **Kill**: Eliminación de un jugador enemigo
- **Corona**: Indicador visual (👑) que aparece junto al nombre del jugador líder en kills
- **Sala**: Instancia de partida multijugador donde los jugadores compiten
- **Kill Feed**: Notificaciones que aparecen cuando un jugador elimina a otro
- **Nombre de Lobby**: Nombre elegido por el jugador al entrar al lobby antes de unirse a una partida

## Requirements

### Requirement 1

**User Story:** Como jugador, quiero ver una lista de todos los jugadores conectados en mi sala actual, para saber contra quién estoy jugando.

#### Acceptance Criteria

1. WHEN el jugador está en una partida multijugador online THEN el Sistema de Scoreboard SHALL mostrar un panel con la lista de todos los jugadores conectados en la sala actual
2. WHEN un nuevo jugador se une a la sala THEN el Sistema de Scoreboard SHALL agregar automáticamente ese jugador a la lista visible
3. WHEN un jugador abandona la sala THEN el Sistema de Scoreboard SHALL remover automáticamente ese jugador de la lista visible
4. WHEN se muestra la lista de jugadores THEN el Sistema de Scoreboard SHALL mostrar el nombre que cada jugador eligió en el lobby

### Requirement 2

**User Story:** Como jugador, quiero ver el número de kills de cada jugador en la sala, para conocer el rendimiento de todos durante la partida.

#### Acceptance Criteria

1. WHEN se muestra la lista de jugadores THEN el Sistema de Scoreboard SHALL mostrar el contador de kills junto al nombre de cada jugador
2. WHEN un jugador elimina a otro THEN el Sistema de Scoreboard SHALL incrementar el contador de kills del jugador que realizó la eliminación
3. WHEN un jugador se une a la sala THEN el Sistema de Scoreboard SHALL inicializar su contador de kills en cero
4. WHEN la partida continúa en la misma sala THEN el Sistema de Scoreboard SHALL mantener los contadores de kills persistentes durante toda la sesión de la sala

### Requirement 3

**User Story:** Como jugador, quiero identificar fácilmente al jugador con más kills, para saber quién lidera la partida.

#### Acceptance Criteria

1. WHEN un jugador tiene el mayor número de kills en la sala THEN el Sistema de Scoreboard SHALL mostrar un icono de corona (👑) junto a su nombre
2. WHEN otro jugador supera al líder actual en kills THEN el Sistema de Scoreboard SHALL mover la corona al nuevo líder
3. WHEN dos o más jugadores empatan con el mayor número de kills THEN el Sistema de Scoreboard SHALL mostrar la corona en todos los jugadores empatados
4. WHEN ningún jugador tiene kills THEN el Sistema de Scoreboard SHALL no mostrar corona en ningún jugador

### Requirement 4

**User Story:** Como jugador, quiero ver el nombre correcto del jugador que me eliminó, para saber quién fue mi asesino.

#### Acceptance Criteria

1. WHEN un jugador es eliminado THEN el Sistema de Scoreboard SHALL mostrar en el kill feed el nombre de lobby del jugador que realizó la eliminación
2. WHEN un jugador es eliminado THEN el Sistema de Scoreboard SHALL mostrar en la pantalla de muerte el nombre de lobby del asesino
3. WHEN se muestra una notificación de kill THEN el Sistema de Scoreboard SHALL usar los nombres de lobby tanto para el asesino como para la víctima

### Requirement 5

**User Story:** Como jugador, quiero que el scoreboard se actualice en tiempo real, para tener información precisa del estado de la partida.

#### Acceptance Criteria

1. WHEN ocurre un evento de kill en el servidor THEN el Sistema de Scoreboard SHALL sincronizar los datos de kills con todos los clientes en la sala dentro de 100 milisegundos
2. WHEN el cliente recibe una actualización de estado THEN el Sistema de Scoreboard SHALL actualizar la interfaz inmediatamente
3. WHEN el jugador local realiza una kill THEN el Sistema de Scoreboard SHALL reflejar el incremento sin esperar confirmación del servidor para feedback inmediato

### Requirement 6

**User Story:** Como jugador, quiero que la lista de jugadores esté ordenada por kills, para ver rápidamente la clasificación.

#### Acceptance Criteria

1. WHEN se muestra la lista de jugadores THEN el Sistema de Scoreboard SHALL ordenar los jugadores de mayor a menor número de kills
2. WHEN dos jugadores tienen el mismo número de kills THEN el Sistema de Scoreboard SHALL mantener el orden alfabético por nombre como criterio secundario
3. WHEN cambia el número de kills de un jugador THEN el Sistema de Scoreboard SHALL reordenar la lista automáticamente

