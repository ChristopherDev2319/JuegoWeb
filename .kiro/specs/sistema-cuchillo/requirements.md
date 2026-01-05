# Requirements Document

## Introduction

Este documento especifica los requisitos para corregir los bugs del sistema de cuchillo en el juego FPS. El cuchillo es un arma cuerpo a cuerpo que el jugador siempre tiene disponible y puede equipar/desequipar con la tecla Q. Los bugs a corregir incluyen: daño excesivo (mata de un golpe cuando debería hacer 30 de daño), crashes ocasionales, falta de animación TPS visible para otros jugadores, indicador de daño no visible, y la capacidad de apuntar cuando no debería ser posible con el cuchillo.

## Glossary

- **Sistema_Cuchillo**: Módulo que gestiona el arma cuerpo a cuerpo del jugador
- **TPS (Third Person Shooter)**: Vista en tercera persona donde se ve el modelo del jugador
- **FPS (First Person Shooter)**: Vista en primera persona donde se ve el arma
- **Hueso_Mano**: Bone del esqueleto del modelo 3D donde se adjunta el cuchillo
- **Arma_Principal**: El arma de fuego seleccionada por el jugador (rifle, pistola, etc.)
- **Arma_Secundaria**: El cuchillo, siempre disponible como alternativa
- **UI_Municion**: Interfaz que muestra información del arma equipada y munición
- **Indicador_Daño**: Elemento visual que muestra el daño causado al enemigo
- **Apuntado_ADS**: Sistema de apuntado (Aim Down Sights) que no aplica al cuchillo

## Requirements

### Requirement 1: Corrección de Daño

**User Story:** As a player, I want the knife to deal 30 damage per hit instead of killing in one hit, so that combat is balanced and fair.

#### Acceptance Criteria

1. WHEN the player attacks with the knife THEN the Sistema_Cuchillo SHALL apply exactly 30 points of damage to the target
2. WHEN the knife damage is configured THEN the server config SHALL use 30 as the damage value
3. WHEN the knife damage is configured THEN the client config SHALL use 30 as the damage value
4. WHEN a player has 100 health and is hit by the knife THEN the player SHALL have 70 health remaining

### Requirement 2: Prevención de Crashes

**User Story:** As a player, I want the knife system to be stable and not crash, so that I can play without interruptions.

#### Acceptance Criteria

1. WHEN the knife attack function is called with null enemies array THEN the Sistema_Cuchillo SHALL handle it gracefully without crashing
2. WHEN the knife attack function encounters an enemy without valid position THEN the Sistema_Cuchillo SHALL skip that enemy and continue processing
3. WHEN the knife model fails to load THEN the Sistema_Cuchillo SHALL log a warning and continue without the visual model
4. WHEN the knife animation fails to load THEN the Sistema_Cuchillo SHALL use a fallback animation without crashing

### Requirement 3: Animación TPS Visible

**User Story:** As a player, I want to see other players' knife attack animations in TPS view, so that I can react to their attacks.

#### Acceptance Criteria

1. WHEN a remote player attacks with the knife THEN the Sistema_Cuchillo SHALL broadcast the attack event to all other players
2. WHEN a melee attack event is received THEN the JugadorRemoto SHALL play the knife_attack_tps animation
3. WHEN the knife_attack_tps animation is not loaded THEN the JugadorRemoto SHALL use a fallback procedural animation
4. WHILE the knife attack animation plays THEN the animation SHALL be visible to all players in the room

### Requirement 4: Indicador de Daño Visible

**User Story:** As a player, I want to see visual feedback when my knife hits an enemy, so that I know my attack was successful.

#### Acceptance Criteria

1. WHEN the knife hits an enemy THEN the Sistema_Cuchillo SHALL display a damage indicator showing the damage dealt
2. WHEN the knife hits an enemy in multiplayer THEN the server SHALL send a damage confirmation to the attacker
3. WHEN damage confirmation is received THEN the UI SHALL display the damage amount visually
4. WHEN the knife misses all enemies THEN the Sistema_Cuchillo SHALL NOT display any damage indicator

### Requirement 5: Bloqueo de Apuntado

**User Story:** As a player, I want the knife to not allow aiming (ADS), so that the weapon behaves realistically as a melee weapon.

#### Acceptance Criteria

1. WHEN the player has the knife equipped THEN the Sistema_Cuchillo SHALL block all aiming attempts
2. WHEN the player presses the aim button with knife equipped THEN the Sistema_Cuchillo SHALL ignore the input
3. WHEN the player switches from knife to main weapon THEN the Sistema_Cuchillo SHALL restore normal aiming functionality
4. WHILE the knife is equipped THEN the camera zoom SHALL remain at default FOV

### Requirement 6: Sincronización de Estado

**User Story:** As a player, I want the knife state to be properly synchronized between client and server, so that attacks are processed correctly.

#### Acceptance Criteria

1. WHEN the player equips the knife THEN the client SHALL send a weapon change event to the server
2. WHEN the server receives a melee attack THEN the server SHALL verify the player has KNIFE equipped
3. WHEN the player switches weapons THEN the server state SHALL match the client state
4. WHEN a melee attack is processed THEN the server SHALL broadcast the result to all players in the room
