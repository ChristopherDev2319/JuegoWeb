# Requirements Document

## Introduction

Este documento especifica los requisitos para implementar un sistema de colisiones optimizado utilizando un nuevo mapa visual (`map_visual.glb`) y su geometría de colisiones separada (`map_coll.glb`). El sistema reemplazará el mapa actual y los límites de rango fijos por colisiones basadas en la geometría del mapa, donde las paredes actúan como límites naturales. El mapa tiene dimensiones de 50x50 unidades.

## Glossary

- **Sistema de Colisiones**: Módulo que detecta y resuelve intersecciones entre el jugador y la geometría del mapa
- **Mapa Visual**: Modelo 3D (`map_visual.glb`) que se renderiza pero no participa en cálculos de colisión
- **Mapa de Colisiones**: Modelo 3D simplificado (`map_coll.glb`) usado exclusivamente para detección de colisiones
- **Raycasting**: Técnica de detección de colisiones que proyecta rayos desde un punto para detectar intersecciones
- **BVH (Bounding Volume Hierarchy)**: Estructura de datos jerárquica que acelera las consultas de colisión
- **Jugador**: Entidad controlada por el usuario que se mueve por el mapa

## Requirements

### Requirement 1

**User Story:** As a player, I want the game to load the new visual map so that I can see the updated environment.

#### Acceptance Criteria

1. WHEN the game initializes THEN the Sistema de Escena SHALL load `map_visual.glb` as the visual representation of the map
2. WHEN the visual map loads successfully THEN the Sistema de Escena SHALL remove the old map model (`lowpoly__fps__tdm__game__map_by_resoforge.glb`) from the scene
3. WHEN the visual map fails to load THEN the Sistema de Escena SHALL display an error message and create a fallback floor

### Requirement 2

**User Story:** As a player, I want the game to use collision geometry so that I cannot walk through walls.

#### Acceptance Criteria

1. WHEN the game initializes THEN the Sistema de Colisiones SHALL load `map_coll.glb` as the collision geometry
2. WHEN the collision geometry loads THEN the Sistema de Colisiones SHALL build a BVH structure for optimized collision queries
3. WHEN the player moves THEN the Sistema de Colisiones SHALL check for collisions against the collision geometry
4. WHEN a collision is detected THEN the Sistema de Colisiones SHALL prevent the player from moving through the colliding surface

### Requirement 3

**User Story:** As a player, I want the map boundaries to be defined by the walls instead of arbitrary limits so that the playable area feels natural.

#### Acceptance Criteria

1. WHEN the collision system initializes THEN the Sistema de Colisiones SHALL remove the fixed position limits (-24 to 24)
2. WHEN the player reaches a wall THEN the Sistema de Colisiones SHALL stop the player movement at the wall surface
3. WHEN the player moves within the map THEN the Sistema de Colisiones SHALL allow free movement in areas without collision geometry

### Requirement 4

**User Story:** As a developer, I want the collision system to be optimized so that the game maintains good performance.

#### Acceptance Criteria

1. WHEN checking collisions THEN the Sistema de Colisiones SHALL use spatial partitioning (BVH) to minimize collision checks
2. WHEN the collision geometry loads THEN the Sistema de Colisiones SHALL pre-compute the BVH structure once
3. WHEN performing collision detection THEN the Sistema de Colisiones SHALL use raycasting with a player capsule approximation

### Requirement 5

**User Story:** As a player, I want smooth collision response so that movement feels natural when touching walls.

#### Acceptance Criteria

1. WHEN the player collides with a wall at an angle THEN the Sistema de Colisiones SHALL allow sliding along the wall surface
2. WHEN the player collides with multiple surfaces THEN the Sistema de Colisiones SHALL resolve collisions in order of proximity
3. WHEN the player is on the ground THEN the Sistema de Colisiones SHALL maintain the player at the correct height above the floor

