# Requirements Document

## Introduction

Este documento especifica los requisitos para mejorar el sistema de cuchillo en el juego FPS. El cuchillo es un arma cuerpo a cuerpo que el jugador siempre tiene disponible y puede equipar/desequipar con la tecla Q. Las mejoras incluyen: visualización del cuchillo en TPS (parentado al hueso de la mano), animación de ataque TPS, intercambio rápido con Q, UI mejorada con indicadores de arma secundaria, y ajustes de posición/escala en FPS.

## Glossary

- **Sistema_Cuchillo**: Módulo que gestiona el arma cuerpo a cuerpo del jugador
- **TPS (Third Person Shooter)**: Vista en tercera persona donde se ve el modelo del jugador
- **FPS (First Person Shooter)**: Vista en primera persona donde se ve el arma
- **Hueso_Mano**: Bone del esqueleto del modelo 3D donde se adjunta el cuchillo
- **Arma_Principal**: El arma de fuego seleccionada por el jugador (rifle, pistola, etc.)
- **Arma_Secundaria**: El cuchillo, siempre disponible como alternativa
- **UI_Municion**: Interfaz que muestra información del arma equipada y munición
- **Slot_Superior**: Cuadro superior en la UI que muestra el arma no equipada
- **Slot_Inferior**: Cuadro inferior en la UI que muestra el arma equipada actualmente

## Requirements

### Requirement 1

**User Story:** As a player, I want to see the knife attached to my character's hand in TPS view, so that other players can see what weapon I have equipped.

#### Acceptance Criteria

1. WHEN the game loads the player model THEN the Sistema_Cuchillo SHALL parent the knife model to the Hueso_Mano bone of the character skeleton
2. WHEN the player has the knife NOT selected THEN the Sistema_Cuchillo SHALL hide the knife model in TPS view
3. WHEN the player selects the knife THEN the Sistema_Cuchillo SHALL show the knife model in TPS view
4. WHILE the player performs any TPS animation THEN the knife model SHALL follow the hand bone position and rotation

### Requirement 2

**User Story:** As a player, I want to quickly switch between my main weapon and the knife by pressing Q, so that I can engage in melee combat when needed.

#### Acceptance Criteria

1. WHEN the player presses Q while holding the Arma_Principal THEN the Sistema_Cuchillo SHALL unequip the Arma_Principal and equip the knife
2. WHEN the player presses Q while holding the knife THEN the Sistema_Cuchillo SHALL unequip the knife and equip the previously held Arma_Principal
3. WHEN the player switches weapons with Q THEN the Sistema_Cuchillo SHALL remember the Arma_Principal for subsequent switches
4. WHEN the game starts THEN the Sistema_Cuchillo SHALL NOT include the knife in weapon selection screens or lobby

### Requirement 3

**User Story:** As a player, I want to see a knife attack animation in TPS when I attack, so that other players can see my melee attacks.

#### Acceptance Criteria

1. WHEN the player attacks with the knife THEN the Sistema_Cuchillo SHALL play the knife_attack_tps animation from modelos/animaciones/knife_attack_tps.glb
2. WHEN the knife attack animation plays THEN the animation SHALL complete before allowing another attack
3. WHEN the knife attack animation is not loaded THEN the Sistema_Cuchillo SHALL use a fallback procedural animation

### Requirement 4

**User Story:** As a player, I want the ammo UI to show relevant information when I have the knife equipped, so that I understand my current weapon state.

#### Acceptance Criteria

1. WHEN the player has the knife equipped THEN the UI_Municion SHALL hide the ammo counter (not show 0/0)
2. WHEN the player has the knife equipped THEN the UI_Municion SHALL display only the knife name
3. WHEN the player has the Arma_Principal equipped THEN the Slot_Superior SHALL display "Cuchillo [Q]"
4. WHEN the player has the knife equipped THEN the Slot_Superior SHALL display the Arma_Principal name and "[Q]"
5. WHEN the player switches weapons THEN the UI_Municion SHALL swap the content between Slot_Superior and Slot_Inferior

### Requirement 5

**User Story:** As a player, I want the knife to look properly positioned and sized in FPS view, so that it feels natural to use.

#### Acceptance Criteria

1. WHEN the knife is equipped in FPS view THEN the Sistema_Cuchillo SHALL position the knife at an angled grip position (not pointing straight forward)
2. WHEN the knife is equipped in FPS view THEN the Sistema_Cuchillo SHALL scale the knife model to an appropriate size relative to the screen
3. WHEN the knife configuration is updated THEN the Sistema_Cuchillo SHALL use the new position, rotation, and scale values from CONFIG.armas.KNIFE
