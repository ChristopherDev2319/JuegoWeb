# Requirements Document

## Introduction

Este documento define los requisitos para el Sistema de Curación del juego FPS. El sistema permite a los jugadores curarse usando un item de curación (JuiceBox) que se equipa con la tecla C. El JuiceBox es un item separado de las armas y el cuchillo, y cuando está equipado permite al jugador curarse 50 puntos de vida en 2 segundos al hacer clic. Durante la curación, el jugador no puede atacar ni apuntar, y los jugadores remotos ven la animación de curación (healt_tps).

## Glossary

- **JuiceBox**: Item de curación representado por el modelo `stylized_juicebox.glb` que permite recuperar vida
- **Sistema de Curación**: Módulo que gestiona el equipamiento del JuiceBox y el proceso de curación
- **FPS (First Person Shooter)**: Vista en primera persona del jugador local
- **TPS (Third Person Shooter)**: Vista en tercera persona de jugadores remotos
- **Animación healt_tps**: Animación de curación ubicada en `modelos/animaciones/healt_tps.glb`
- **Slot de Equipamiento**: Posición del item actualmente equipado (arma, cuchillo o JuiceBox)

## Requirements

### Requirement 1

**User Story:** Como jugador, quiero equipar el JuiceBox presionando la tecla C, para poder prepararme para curarme.

#### Acceptance Criteria

1. WHEN el jugador presiona la tecla C THEN el Sistema de Curación SHALL equipar el JuiceBox y hacerlo visible en la vista FPS
2. WHEN el jugador tiene un arma o cuchillo equipado y presiona C THEN el Sistema de Curación SHALL ocultar el arma/cuchillo actual y mostrar el JuiceBox
3. WHEN el jugador tiene el JuiceBox equipado y presiona C THEN el Sistema de Curación SHALL desequipar el JuiceBox y restaurar el arma anterior
4. WHEN el JuiceBox se equipa THEN el Sistema de Curación SHALL cargar y mostrar el modelo `stylized_juicebox.glb` en la posición FPS

### Requirement 2

**User Story:** Como jugador, quiero que el JuiceBox sea mutuamente excluyente con armas y cuchillo, para tener un sistema de equipamiento claro.

#### Acceptance Criteria

1. WHILE el JuiceBox está equipado THEN el Sistema de Curación SHALL ocultar todas las armas y el cuchillo en la vista FPS
2. WHILE un arma está equipada THEN el Sistema de Curación SHALL mantener el JuiceBox oculto en la vista FPS
3. WHILE el cuchillo está equipado THEN el Sistema de Curación SHALL mantener el JuiceBox oculto en la vista FPS
4. WHEN el jugador cambia de arma con teclas numéricas o rueda del mouse THEN el Sistema de Curación SHALL desequipar el JuiceBox si estaba equipado

### Requirement 3

**User Story:** Como jugador, quiero curarme 50 puntos de vida al hacer clic con el JuiceBox equipado, para recuperar salud durante la partida.

#### Acceptance Criteria

1. WHEN el jugador hace clic izquierdo con el JuiceBox equipado THEN el Sistema de Curación SHALL iniciar el proceso de curación de 2 segundos
2. WHEN el proceso de curación completa los 2 segundos THEN el Sistema de Curación SHALL restaurar 50 puntos de vida al jugador
3. IF el jugador interrumpe la curación antes de completar los 2 segundos THEN el Sistema de Curación SHALL cancelar la curación sin restaurar vida
4. WHILE el proceso de curación está activo THEN el Sistema de Curación SHALL bloquear el cambio de arma y movimiento de cámara con clic derecho
5. WHEN la vida del jugador está al máximo THEN el Sistema de Curación SHALL permitir iniciar la curación pero no exceder la vida máxima

### Requirement 4

**User Story:** Como jugador, quiero que no pueda apuntar mientras tengo el JuiceBox equipado, para mantener el balance del juego.

#### Acceptance Criteria

1. WHILE el JuiceBox está equipado THEN el Sistema de Curación SHALL bloquear la funcionalidad de apuntado (clic derecho)
2. WHEN el jugador intenta apuntar con el JuiceBox equipado THEN el Sistema de Curación SHALL ignorar el input de apuntado

### Requirement 5

**User Story:** Como jugador remoto, quiero ver cuando otro jugador está curándose, para tener información visual del estado de otros jugadores.

#### Acceptance Criteria

1. WHEN un jugador inicia la curación THEN el Sistema de Curación SHALL mostrar el modelo JuiceBox en la mano del jugador remoto (TPS)
2. WHEN un jugador inicia la curación THEN el Sistema de Curación SHALL reproducir la animación `healt_tps` en el jugador remoto
3. WHEN la animación de curación termina THEN el Sistema de Curación SHALL restaurar la animación idle o walk según el estado del jugador
4. WHILE un jugador está curándose THEN el Sistema de Curación SHALL mantener visible el JuiceBox en TPS durante los 2 segundos

### Requirement 6

**User Story:** Como desarrollador, quiero que el JuiceBox se cargue y parentee correctamente en las animaciones, para una integración visual consistente.

#### Acceptance Criteria

1. WHEN el modelo del personaje se carga THEN el Sistema de Curación SHALL cargar el modelo JuiceBox y parentearlo al hueso de la mano
2. WHEN el JuiceBox se parenta THEN el Sistema de Curación SHALL aplicar la escala y rotación apropiadas para verse natural
3. WHEN el JuiceBox no está equipado THEN el Sistema de Curación SHALL mantener el modelo oculto pero cargado para cambios rápidos
