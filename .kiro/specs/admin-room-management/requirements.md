# Requirements Document

## Introduction

Esta funcionalidad extiende el panel de administración de BearStrike para incluir gestión de partidas en tiempo real. Los administradores podrán visualizar todas las salas activas del juego, ver información detallada de cada una (jugadores, estado), y ejecutar acciones como expulsar (kick) jugadores de partidas específicas.

## Glossary

- **Admin Panel**: Interfaz web de administración accesible solo para usuarios con rol 'admin'
- **Room/Sala**: Instancia de partida del juego que contiene jugadores
- **Kick**: Acción de expulsar a un jugador de una sala activa
- **Room State/Estado de Sala**: Estado actual de la partida ('esperando', 'jugando', 'cerrando')
- **Socket**: Conexión WebSocket entre cliente y servidor para comunicación en tiempo real

## Requirements

### Requirement 1

**User Story:** As an administrator, I want to view all active game rooms, so that I can monitor the current state of the game server.

#### Acceptance Criteria

1. WHEN an administrator navigates to the rooms management section THEN the Admin Panel SHALL display a list of all active rooms with their IDs and codes
2. WHEN displaying room information THEN the Admin Panel SHALL show the current player count for each room
3. WHEN displaying room information THEN the Admin Panel SHALL show the room state (esperando/jugando/cerrando)
4. WHEN the room list is empty THEN the Admin Panel SHALL display a message indicating no active rooms exist

### Requirement 2

**User Story:** As an administrator, I want to see detailed information about a specific room, so that I can understand what is happening in that game session.

#### Acceptance Criteria

1. WHEN an administrator selects a room THEN the Admin Panel SHALL display the list of players currently in that room
2. WHEN displaying player information THEN the Admin Panel SHALL show each player's name and ID
3. WHEN displaying room details THEN the Admin Panel SHALL show the room creation timestamp
4. WHEN displaying room details THEN the Admin Panel SHALL show whether the room is public or private

### Requirement 3

**User Story:** As an administrator, I want to kick a player from a room, so that I can remove disruptive players from active games.

#### Acceptance Criteria

1. WHEN an administrator initiates a kick action on a player THEN the Admin Panel SHALL request confirmation before executing
2. WHEN a kick is confirmed THEN the Server SHALL remove the player from the room immediately
3. WHEN a player is kicked THEN the Server SHALL notify the kicked player with a disconnect message
4. WHEN a kick is successful THEN the Admin Panel SHALL display a success notification
5. IF a kick fails THEN the Admin Panel SHALL display an error message with the failure reason

### Requirement 4

**User Story:** As an administrator, I want the room list to update automatically, so that I can see real-time changes without manual refresh.

#### Acceptance Criteria

1. WHEN a new room is created THEN the Admin Panel SHALL add the room to the list within 5 seconds
2. WHEN a room is deleted THEN the Admin Panel SHALL remove the room from the list within 5 seconds
3. WHEN room state changes THEN the Admin Panel SHALL update the displayed state within 5 seconds
4. WHEN player count changes in a room THEN the Admin Panel SHALL update the displayed count within 5 seconds
