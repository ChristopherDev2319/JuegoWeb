# Requirements Document

## Introduction

Este documento especifica los requisitos para corregir los bugs del sistema TPS (Third Person Shooter) que afectan la sincronización del estado visual de los jugadores remotos. Los problemas incluyen: arma incorrecta al iniciar, animaciones idle/walk visibles cuando el juego no está seleccionado, arma que no desaparece al elegir el JuiceBox, y animación de curación (healt) que no funciona correctamente.

## Glossary

- **TPS (Third Person Shooter)**: Vista en tercera persona del modelo del jugador remoto
- **JugadorRemoto**: Clase que representa a otros jugadores en el juego
- **JuiceBox**: Objeto de curación que el jugador puede usar para recuperar vida
- **Animación healt**: Animación de curación que se reproduce cuando un jugador usa el JuiceBox
- **currentWeapon**: Arma actualmente equipada por el jugador
- **RemotePlayerManager**: Sistema que gestiona todos los jugadores remotos

## Requirements

### Requirement 1

**User Story:** Como jugador, quiero que los jugadores remotos muestren el arma correcta que seleccionaron al iniciar la partida, para que la representación visual sea precisa.

#### Acceptance Criteria

1. WHEN un jugador remoto se une a la partida THEN el sistema TPS SHALL mostrar el arma que el jugador seleccionó en el menú de selección
2. WHEN el servidor envía el estado inicial del jugador THEN el sistema TPS SHALL actualizar el arma visible inmediatamente después de cargar el modelo
3. WHEN el modelo del personaje termina de cargar THEN el sistema TPS SHALL sincronizar el arma con el estado del servidor antes de mostrar el modelo

### Requirement 2

**User Story:** Como jugador, quiero que el modelo TPS solo sea visible cuando el juego está activo, para evitar ver animaciones superpuestas en el menú.

#### Acceptance Criteria

1. WHEN el juego no está en modo activo (menú de selección visible) THEN el sistema TPS SHALL ocultar todos los modelos de jugadores remotos
2. WHEN el jugador inicia la partida desde el menú THEN el sistema TPS SHALL mostrar los modelos de jugadores remotos
3. WHEN el jugador vuelve al menú de pausa THEN el sistema TPS SHALL mantener los modelos visibles pero pausar las animaciones

### Requirement 3

**User Story:** Como jugador, quiero que cuando un jugador remoto use el JuiceBox, su arma desaparezca y aparezca el JuiceBox correctamente, para que la representación visual sea coherente.

#### Acceptance Criteria

1. WHEN un jugador remoto inicia curación THEN el sistema TPS SHALL ocultar el arma actual del jugador remoto
2. WHEN un jugador remoto inicia curación THEN el sistema TPS SHALL mostrar el modelo del JuiceBox en la mano del jugador
3. WHEN un jugador remoto termina o cancela la curación THEN el sistema TPS SHALL ocultar el JuiceBox y restaurar el arma previa

### Requirement 4

**User Story:** Como jugador, quiero que la animación de curación (healt) se reproduzca correctamente en los jugadores remotos, para ver claramente cuando están curándose.

#### Acceptance Criteria

1. WHEN un jugador remoto inicia curación THEN el sistema TPS SHALL reproducir la animación healt_tps.glb
2. WHEN la animación healt no está disponible THEN el sistema TPS SHALL usar una animación de fallback (idle) sin interrumpir el flujo
3. WHEN la curación termina THEN el sistema TPS SHALL transicionar suavemente a la animación idle o walk según el estado de movimiento

### Requirement 5

**User Story:** Como jugador, quiero que el estado del TPS se actualice correctamente cuando recibo actualizaciones del servidor, para que la sincronización sea precisa.

#### Acceptance Criteria

1. WHEN el servidor envía un cambio de arma THEN el sistema TPS SHALL actualizar el arma visible del jugador remoto inmediatamente
2. WHEN el servidor envía un evento de curación THEN el sistema TPS SHALL procesar el evento y actualizar el estado visual
3. WHEN el modelo del personaje aún no está cargado THEN el sistema TPS SHALL encolar los cambios de estado y aplicarlos cuando el modelo esté listo
