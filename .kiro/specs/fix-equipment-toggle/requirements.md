# Requirements Document

## Introduction

Este documento especifica los requisitos para corregir el bug en el sistema de equipamiento del jugador. Actualmente, al alternar entre arma (Q), cuchillo (C) y de vuelta al arma (Q), el sistema no muestra correctamente el item equipado porque los estados de arma, cuchillo y jugo no se manejan de forma independiente y mutuamente excluyente.

El sistema debe garantizar que en todo momento solo uno de los tres items esté equipado y visible: el arma principal, el cuchillo, o el JuiceBox (jugo de curación).

## Glossary

- **Sistema_Equipamiento**: Módulo que gestiona qué item tiene equipado el jugador en primera persona (FPS)
- **Arma_Principal**: El arma de fuego seleccionada por el jugador (M4A1, AK47, etc.)
- **Cuchillo**: Arma cuerpo a cuerpo que el jugador puede equipar con la tecla Q
- **JuiceBox**: Item de curación que el jugador puede equipar con la tecla C (mesh: Straw_lambert1_0)
- **Item_Equipado**: El item actualmente visible y usable por el jugador (arma, cuchillo o jugo)
- **Modelo_FPS**: El modelo 3D visible en primera persona del item equipado

## Requirements

### Requirement 1

**User Story:** Como jugador, quiero que al presionar Q se alterne correctamente entre mi arma principal y el cuchillo, sin importar qué item tenía equipado antes, para poder cambiar de arma de forma predecible.

#### Acceptance Criteria

1. WHEN el jugador presiona Q y tiene el arma principal equipada THEN el Sistema_Equipamiento SHALL ocultar el modelo del arma principal y mostrar el modelo del cuchillo
2. WHEN el jugador presiona Q y tiene el cuchillo equipado THEN el Sistema_Equipamiento SHALL ocultar el modelo del cuchillo y mostrar el modelo del arma principal
3. WHEN el jugador presiona Q y tiene el JuiceBox equipado THEN el Sistema_Equipamiento SHALL ocultar el modelo del JuiceBox y mostrar el modelo del arma principal
4. WHEN el jugador cambia de item equipado THEN el Sistema_Equipamiento SHALL actualizar el estado interno para reflejar exactamente un item equipado

### Requirement 2

**User Story:** Como jugador, quiero que al presionar C se alterne correctamente entre el JuiceBox y mi item anterior, para poder curarme cuando lo necesite.

#### Acceptance Criteria

1. WHEN el jugador presiona C y tiene el arma principal equipada THEN el Sistema_Equipamiento SHALL ocultar el modelo del arma principal y mostrar el modelo del JuiceBox
2. WHEN el jugador presiona C y tiene el cuchillo equipado THEN el Sistema_Equipamiento SHALL ocultar el modelo del cuchillo y mostrar el modelo del JuiceBox
3. WHEN el jugador presiona C y tiene el JuiceBox equipado THEN el Sistema_Equipamiento SHALL ocultar el modelo del JuiceBox y mostrar el modelo del item que tenía equipado antes de equipar el JuiceBox
4. WHEN el jugador equipa el JuiceBox THEN el Sistema_Equipamiento SHALL recordar qué item tenía equipado previamente para restaurarlo después

### Requirement 3

**User Story:** Como jugador, quiero que el sistema de equipamiento sea consistente y predecible, para no confundirme sobre qué item tengo equipado.

#### Acceptance Criteria

1. WHILE el jugador tiene un item equipado THEN el Sistema_Equipamiento SHALL mantener visible exactamente un modelo FPS (arma, cuchillo o JuiceBox)
2. WHEN el jugador cambia de item THEN el Sistema_Equipamiento SHALL ocultar completamente el modelo anterior antes de mostrar el nuevo
3. WHEN el jugador realiza cualquier secuencia de cambios de item (Q, C, Q, C, etc.) THEN el Sistema_Equipamiento SHALL mantener un estado consistente donde solo un item está equipado
4. WHEN el Sistema_Equipamiento inicializa THEN el Sistema_Equipamiento SHALL establecer el arma principal como item equipado por defecto
