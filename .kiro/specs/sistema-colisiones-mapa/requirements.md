# Requirements Document

## Introduction

Este documento especifica los requisitos para un sistema de colisiones robusto que resuelva los problemas actuales del juego FPS: balas que atraviesan paredes, bugs de gravedad/salto en superficies irregulares, y problemas con el dash. El sistema utilizará la librería Rapier3D para física determinista y eficiente, manteniendo la separación entre mapa visual (`map_visual.glb`) y geometría de colisiones (`map_coll.glb`).

## Glossary

- **Sistema de Colisiones**: Módulo que detecta y resuelve intersecciones entre entidades y la geometría del mapa
- **Rapier3D**: Librería de física determinista en WebAssembly, optimizada para juegos
- **Mapa Visual**: Modelo 3D (`map_visual.glb`) que se renderiza pero no participa en cálculos de colisión
- **Mapa de Colisiones**: Modelo 3D simplificado (`map_coll.glb`) usado exclusivamente para detección de colisiones
- **Trimesh Collider**: Colisionador basado en malla de triángulos para geometría compleja del mapa
- **Capsule Collider**: Colisionador en forma de cápsula usado para representar al jugador
- **Raycast**: Técnica que proyecta un rayo para detectar intersecciones con geometría
- **Shape Cast**: Técnica que proyecta una forma (no solo un punto) para detectar colisiones
- **Character Controller**: Controlador especializado para movimiento de personajes con manejo de escalones y rampas
- **Jugador**: Entidad controlada por el usuario que se mueve por el mapa
- **Bala**: Proyectil disparado por un arma que debe colisionar con el mapa y jugadores

## Requirements

### Requirement 1

**User Story:** As a player, I want bullets to stop when hitting walls so that I cannot shoot through obstacles.

#### Acceptance Criteria

1. WHEN a bullet is fired THEN the Sistema de Colisiones SHALL perform a raycast from the bullet origin to its maximum range
2. WHEN a raycast detects collision with map geometry THEN the Sistema de Colisiones SHALL calculate the exact impact point
3. WHEN a bullet reaches an impact point THEN the Sistema de Colisiones SHALL deactivate the bullet and create an impact effect
4. WHEN checking bullet collisions THEN the Sistema de Colisiones SHALL check map geometry before checking player hitboxes

### Requirement 2

**User Story:** As a player, I want to walk smoothly on irregular surfaces so that ramps and small steps do not interrupt my movement.

#### Acceptance Criteria

1. WHEN the player walks on a slope up to 45 degrees THEN the Sistema de Colisiones SHALL allow smooth movement along the slope
2. WHEN the player encounters a step up to 0.5 units high THEN the Sistema de Colisiones SHALL automatically step up without jumping
3. WHEN the player walks down a slope THEN the Sistema de Colisiones SHALL keep the player grounded without floating
4. WHEN the player is on uneven terrain THEN the Sistema de Colisiones SHALL maintain consistent ground detection

### Requirement 3

**User Story:** As a player, I want gravity and jumping to work correctly on all surfaces so that I can navigate the map reliably.

#### Acceptance Criteria

1. WHEN the player jumps THEN the Sistema de Colisiones SHALL apply upward velocity and detect ceiling collisions
2. WHEN the player is falling THEN the Sistema de Colisiones SHALL detect ground contact and stop vertical movement
3. WHEN the player lands on a platform THEN the Sistema de Colisiones SHALL set the player at the correct height
4. WHEN the player walks off an edge THEN the Sistema de Colisiones SHALL transition to falling state smoothly

### Requirement 4

**User Story:** As a player, I want the dash ability to work without getting stuck in walls so that I can use it reliably.

#### Acceptance Criteria

1. WHEN the player dashes toward a wall THEN the Sistema de Colisiones SHALL stop the dash at the wall surface
2. WHEN the player dashes at an angle to a wall THEN the Sistema de Colisiones SHALL allow sliding along the wall
3. WHEN the player dashes through a narrow gap THEN the Sistema de Colisiones SHALL allow passage if the gap is wider than the player
4. WHEN the dash would place the player inside geometry THEN the Sistema de Colisiones SHALL find the nearest valid position

### Requirement 5

**User Story:** As a developer, I want the collision system to use Rapier3D so that physics calculations are fast and deterministic.

#### Acceptance Criteria

1. WHEN the game initializes THEN the Sistema de Colisiones SHALL load and initialize the Rapier3D WASM module
2. WHEN the collision geometry loads THEN the Sistema de Colisiones SHALL create a trimesh collider from the mesh data
3. WHEN performing collision queries THEN the Sistema de Colisiones SHALL use Rapier3D shape casts and raycasts
4. WHEN the physics world updates THEN the Sistema de Colisiones SHALL maintain 30Hz synchronization with the game tick rate

### Requirement 6

**User Story:** As a player, I want wall collision to feel responsive so that I can navigate tight spaces without getting stuck.

#### Acceptance Criteria

1. WHEN the player collides with a wall at an angle THEN the Sistema de Colisiones SHALL allow sliding along the wall surface
2. WHEN the player is in a corner THEN the Sistema de Colisiones SHALL prevent movement into walls while allowing escape
3. WHEN the player pushes against a wall THEN the Sistema de Colisiones SHALL maintain a small separation distance
4. WHEN multiple collisions occur THEN the Sistema de Colisiones SHALL resolve them in order of penetration depth

