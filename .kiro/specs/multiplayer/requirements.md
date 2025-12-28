# Requirements Document

## Introduction

Este documento especifica los requisitos para transformar el juego FPS single-player existente en un juego multijugador con arquitectura cliente-servidor. El sistema permitirá que múltiples jugadores se conecten a un servidor local, cada uno controlando su propio personaje (cubo con arma), pudiendo disparar, recargar, hacer dash y combatir entre sí. Cada jugador tendrá 200 puntos de vida.

## Glossary

- **Server**: Proceso Node.js que gestiona el estado autoritativo del juego, sincroniza jugadores y procesa la lógica de combate
- **Client**: Aplicación del navegador que renderiza el juego, captura inputs del jugador y se comunica con el Server
- **Player**: Entidad del juego representada por un cubo con arma, controlada por un Client conectado
- **WebSocket**: Protocolo de comunicación bidireccional en tiempo real entre Client y Server
- **Game State**: Estructura de datos que contiene posiciones, rotaciones, vida y estado de todos los Players
- **Input**: Acciones del jugador (movimiento, disparo, recarga, dash) enviadas del Client al Server
- **Tick**: Ciclo de actualización del Server donde se procesa la lógica del juego
- **Interpolation**: Técnica del Client para suavizar el movimiento de otros Players entre actualizaciones del Server

## Requirements

### Requirement 1: Server Setup

**User Story:** As a developer, I want to set up a local game server, so that multiple clients can connect and play together.

#### Acceptance Criteria

1. WHEN the server starts THEN the Server SHALL listen for WebSocket connections on a configurable port (default 3000)
2. WHEN a Client connects THEN the Server SHALL assign a unique player ID and add the Player to the Game State
3. WHEN a Client disconnects THEN the Server SHALL remove the Player from the Game State and notify remaining Clients
4. WHILE the Server is running THEN the Server SHALL execute game logic at a fixed Tick rate of 60 updates per second
5. WHEN the Server broadcasts Game State THEN the Server SHALL serialize the state to JSON format

### Requirement 2: Client Connection

**User Story:** As a player, I want my browser to connect to the game server, so that I can join the multiplayer game.

#### Acceptance Criteria

1. WHEN the Client loads THEN the Client SHALL attempt to establish a WebSocket connection to the Server
2. WHEN the connection succeeds THEN the Client SHALL receive its assigned player ID and initial Game State
3. WHEN the connection fails THEN the Client SHALL display an error message and provide a retry option
4. WHILE connected THEN the Client SHALL send player Inputs to the Server at a rate of 60 times per second
5. WHEN the Client receives Game State updates THEN the Client SHALL apply Interpolation to smooth remote Player movements

### Requirement 3: Player Representation

**User Story:** As a player, I want to see myself and other players as cubes with weapons, so that I can identify all participants in the game.

#### Acceptance Criteria

1. WHEN a new Player joins THEN the Client SHALL render a cube mesh with the M4A1 weapon model for that Player
2. WHEN a Player moves THEN the Client SHALL update the cube position and rotation based on Game State
3. WHEN the local Player moves THEN the Client SHALL send position and rotation data to the Server
4. WHILE a Player is alive THEN the Client SHALL display a health bar above the Player's cube showing current health out of 200
5. WHEN a Player dies THEN the Client SHALL play a death animation and hide the Player temporarily

### Requirement 4: Movement Synchronization

**User Story:** As a player, I want my movement to be synchronized with other players, so that everyone sees consistent positions.

#### Acceptance Criteria

1. WHEN the local Player presses movement keys (WASD) THEN the Client SHALL send movement Input to the Server
2. WHEN the Server receives movement Input THEN the Server SHALL validate and update the Player position in Game State
3. WHEN the Server updates Game State THEN the Server SHALL broadcast new positions to all connected Clients
4. WHILE receiving position updates THEN the Client SHALL interpolate remote Player positions for smooth rendering
5. WHEN the local Player jumps THEN the Server SHALL process gravity and ground collision for that Player

### Requirement 5: Combat System

**User Story:** As a player, I want to shoot and damage other players, so that I can engage in combat.

#### Acceptance Criteria

1. WHEN the local Player fires THEN the Client SHALL send a shoot Input with position and direction to the Server
2. WHEN the Server receives a shoot Input THEN the Server SHALL create a bullet entity and check for collisions with other Players
3. WHEN a bullet hits a Player THEN the Server SHALL reduce the target Player's health by the weapon damage (20 points)
4. WHEN a Player's health reaches zero THEN the Server SHALL mark the Player as dead and broadcast the death event
5. WHEN a Player dies THEN the Server SHALL respawn the Player after 5 seconds with full health (200 points) at a spawn point

### Requirement 6: Weapon System

**User Story:** As a player, I want to reload my weapon and see ammunition status, so that I can manage my combat resources.

#### Acceptance Criteria

1. WHEN the local Player presses R THEN the Client SHALL send a reload Input to the Server
2. WHEN the Server receives a reload Input THEN the Server SHALL start a 2-second reload timer for that Player
3. WHILE a Player is reloading THEN the Server SHALL prevent that Player from firing
4. WHEN reload completes THEN the Server SHALL restore the Player's magazine to 30 rounds
5. WHEN ammunition state changes THEN the Server SHALL broadcast the updated ammunition count to the owning Client

### Requirement 7: Dash System

**User Story:** As a player, I want to use dash abilities, so that I can move quickly in combat.

#### Acceptance Criteria

1. WHEN the local Player presses E THEN the Client SHALL send a dash Input with direction to the Server
2. WHEN the Server receives a dash Input THEN the Server SHALL verify the Player has available dash charges
3. WHEN a dash executes THEN the Server SHALL move the Player instantly in the specified direction
4. WHILE dash charges are below maximum (3) THEN the Server SHALL regenerate one charge every 3 seconds
5. WHEN dash state changes THEN the Server SHALL broadcast the updated dash charges to the owning Client

### Requirement 8: Project Structure

**User Story:** As a developer, I want a clean client-server project structure, so that the codebase is maintainable and organized.

#### Acceptance Criteria

1. WHEN organizing the project THEN the codebase SHALL separate server code into a `/server` directory
2. WHEN organizing the project THEN the codebase SHALL keep client code in the existing `/src` directory with network modules
3. WHEN the server starts THEN the Server SHALL serve static client files in addition to WebSocket handling
4. WHEN adding dependencies THEN the project SHALL use a package.json with npm scripts for starting server and client
5. WHEN implementing network code THEN the codebase SHALL create dedicated modules for serialization and message handling

### Requirement 9: Game State Serialization

**User Story:** As a developer, I want efficient game state serialization, so that network communication is fast and reliable.

#### Acceptance Criteria

1. WHEN serializing Game State THEN the Server SHALL convert player data to a JSON string
2. WHEN deserializing Game State THEN the Client SHALL parse the JSON string back to player objects
3. WHEN serializing then deserializing Game State THEN the resulting data SHALL be equivalent to the original Game State
4. WHEN sending updates THEN the Server SHALL include only changed data when possible to reduce bandwidth
5. WHEN receiving malformed data THEN the receiving party SHALL log an error and discard the message without crashing

