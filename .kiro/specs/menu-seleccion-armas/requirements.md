# Documento de Requisitos

## Introducción

Este documento especifica los requisitos para el sistema de menú de selección de armas. El sistema permite a los jugadores elegir un arma antes de entrar a la partida y al reaparecer después de morir. El jugador solo puede usar el arma seleccionada hasta ser eliminado, momento en el cual puede elegir una nueva arma o reaparecer con la anterior.

## Glosario

- **Sistema de Selección de Armas**: Componente de UI que muestra las armas disponibles y permite al jugador elegir una antes de jugar
- **Arma Equipada**: El arma actualmente seleccionada por el jugador que usará durante la partida
- **Pointer Lock**: API del navegador que captura el cursor del mouse para controles de primera persona
- **Pantalla de Muerte**: Overlay que aparece cuando el jugador es eliminado
- **Botón Reaparecer**: Control que permite al jugador volver a la partida con su arma actual después de 5 segundos

## Requisitos

### Requisito 1

**User Story:** Como jugador, quiero ver un menú de selección de armas al entrar a una partida, para poder elegir con qué arma jugar.

#### Criterios de Aceptación

1. WHEN el jugador entra a una partida (después del matchmaking o modo local) THEN el Sistema de Selección de Armas SHALL mostrar un menú con todas las armas disponibles (M4A1, AK47, Pistola, Sniper, Escopeta, MP5)
2. WHEN el menú de selección de armas está visible THEN el Sistema de Selección de Armas SHALL mostrar el nombre, tipo e icono/modelo de cada arma
3. WHEN el menú de selección de armas está visible THEN el Sistema de Selección de Armas SHALL mantener el pointer lock desactivado
4. WHEN el jugador hace click en una tarjeta de arma THEN el Sistema de Selección de Armas SHALL marcar esa arma como seleccionada visualmente sin activar el pointer lock

### Requisito 2

**User Story:** Como jugador, quiero iniciar la partida con el arma que elegí, para poder jugar con mi arma preferida.

#### Criterios de Aceptación

1. WHEN el jugador tiene un arma seleccionada y hace click en el botón "Jugar" THEN el Sistema de Selección de Armas SHALL ocultar el menú, equipar el arma seleccionada y activar el pointer lock
2. WHEN el jugador inicia la partida THEN el Sistema de Selección de Armas SHALL establecer el arma seleccionada como la única arma en el inventario del jugador
3. WHEN el jugador está en partida THEN el Sistema de Selección de Armas SHALL deshabilitar el cambio de arma (teclas 1-6 y rueda del mouse)

### Requisito 3

**User Story:** Como jugador, quiero ver el menú de selección de armas cuando muero, para poder elegir una nueva arma al reaparecer.

#### Criterios de Aceptación

1. WHEN el jugador es eliminado THEN el Sistema de Selección de Armas SHALL mostrar la pantalla de muerte con el menú de selección de armas integrado
2. WHEN la pantalla de muerte con selección de armas está visible THEN el Sistema de Selección de Armas SHALL desactivar el pointer lock
3. WHEN el jugador selecciona un arma diferente en la pantalla de muerte THEN el Sistema de Selección de Armas SHALL actualizar el arma equipada para el próximo respawn
4. WHEN han pasado 5 segundos desde la muerte del jugador THEN el Sistema de Selección de Armas SHALL mostrar un botón "Reaparecer"

### Requisito 4

**User Story:** Como jugador, quiero poder reaparecer rápidamente con mi arma anterior si no quiero cambiar, para volver al juego sin demora.

#### Criterios de Aceptación

1. WHEN el botón "Reaparecer" está visible y el jugador hace click en él THEN el Sistema de Selección de Armas SHALL ocultar la pantalla de muerte, reaparecer al jugador con el arma actualmente equipada y activar el pointer lock
2. WHEN el jugador selecciona una nueva arma y hace click en "Jugar" (en pantalla de muerte) THEN el Sistema de Selección de Armas SHALL reaparecer al jugador con la nueva arma seleccionada y activar el pointer lock
3. IF el jugador no interactúa con el menú de muerte durante 5 segundos THEN el Sistema de Selección de Armas SHALL mantener el arma previamente equipada como selección por defecto

### Requisito 5

**User Story:** Como jugador, quiero que el control del mouse funcione correctamente según el contexto, para tener una experiencia fluida entre menús y juego.

#### Criterios de Aceptación

1. WHILE el menú de selección de armas está visible THEN el Sistema de Selección de Armas SHALL permitir clicks normales del mouse sin capturar el cursor
2. WHEN el jugador hace click en cualquier elemento del menú de selección THEN el Sistema de Selección de Armas SHALL procesar el click sin activar el pointer lock
3. WHEN el jugador presiona el botón "Jugar" o "Reaparecer" THEN el Sistema de Selección de Armas SHALL activar el pointer lock e iniciar/reanudar el juego
