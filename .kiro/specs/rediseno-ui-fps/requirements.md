# Requirements Document

## Introduction

Este documento define los requisitos para el rediseño de la interfaz de usuario (UI) del jugador en primera persona, tanto en modo local como en modo online (cliente). El objetivo es modernizar la apariencia visual, mejorar la usabilidad y optimizar el espacio en pantalla integrando elementos relacionados como la barra de vida y las cargas de dash.

## Glossary

- **HUD**: Heads-Up Display - Interfaz de usuario superpuesta durante el juego
- **FPS_UI**: Sistema de interfaz de usuario para el jugador en primera persona
- **Chat_Container**: Contenedor del sistema de chat del juego
- **Health_Bar**: Barra visual que muestra la vida actual del jugador
- **Dash_Charges**: Indicadores visuales de las cargas disponibles de dash
- **Weapon_Info**: Panel que muestra información del arma actual y munición
- **Kill_Feed**: Lista de eliminaciones recientes en la esquina superior derecha
- **Crosshair**: Punto de mira central del jugador

## Requirements

### Requirement 1

**User Story:** Como jugador, quiero que el chat esté posicionado en la esquina superior izquierda, para que no obstruya elementos importantes de la UI y sea más accesible visualmente.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL posicionar el Chat_Container en la esquina superior izquierda con un margen de 20px desde los bordes
2. WHEN el chat está minimizado THEN the FPS_UI SHALL mostrar solo el header del chat con opacidad reducida (0.7)
3. WHEN el chat está expandido THEN the FPS_UI SHALL mostrar el área de mensajes y el input con opacidad completa (1.0)
4. WHEN el jugador presiona la tecla T THEN the FPS_UI SHALL expandir el chat y enfocar el campo de entrada

### Requirement 2

**User Story:** Como jugador, quiero que la barra de vida esté en la esquina inferior izquierda junto con las cargas de dash integradas, para tener toda la información de estado del personaje en un solo lugar compacto.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL posicionar el contenedor integrado de vida y dash en la esquina inferior izquierda con un margen de 20px
2. WHEN la vida del jugador cambia THEN the Health_Bar SHALL actualizar su ancho con una transición suave de 150ms
3. WHEN la vida está por debajo del 25% THEN the Health_Bar SHALL mostrar un color rojo con efecto de pulso
4. WHEN la vida está entre 25% y 50% THEN the Health_Bar SHALL mostrar un color amarillo/naranja
5. WHEN la vida está por encima del 50% THEN the Health_Bar SHALL mostrar un color verde
6. WHEN el jugador usa una carga de dash THEN the Dash_Charges SHALL actualizar el indicador correspondiente con una animación de vaciado
7. WHEN una carga de dash se está recargando THEN the Dash_Charges SHALL mostrar un indicador de progreso circular o lineal
8. WHEN una carga de dash está disponible THEN the Dash_Charges SHALL mostrar el indicador con color verde brillante

### Requirement 3

**User Story:** Como jugador, quiero que la UI tenga un diseño moderno con efectos visuales atractivos, para mejorar la experiencia visual del juego.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL aplicar un estilo visual con bordes redondeados (8-12px), sombras suaves y fondos semi-transparentes con blur
2. WHEN el jugador recibe daño THEN the FPS_UI SHALL mostrar un efecto de flash rojo en los bordes de la pantalla
3. WHEN el jugador elimina a un enemigo THEN the Kill_Feed SHALL mostrar la entrada con una animación de deslizamiento desde la derecha
4. WHEN el jugador cambia de arma THEN the Weapon_Info SHALL mostrar una notificación temporal con animación de fade
5. WHEN el jugador apunta (ADS) THEN the Crosshair SHALL reducir su tamaño con una transición suave

### Requirement 4

**User Story:** Como jugador, quiero que el panel de información del arma esté posicionado en la esquina inferior derecha con un diseño compacto, para ver la munición y el arma actual sin distracciones.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL posicionar el Weapon_Info en la esquina inferior derecha con un margen de 20px
2. WHEN el jugador tiene un arma equipada THEN the Weapon_Info SHALL mostrar el nombre del arma, munición actual y munición de reserva
3. WHEN el jugador tiene el cuchillo equipado THEN the Weapon_Info SHALL ocultar el contador de munición
4. WHEN el jugador está recargando THEN the Weapon_Info SHALL mostrar el texto "RECARGANDO..." con color amarillo
5. WHEN la munición actual es menor o igual a 5 THEN the Weapon_Info SHALL mostrar el contador en color rojo

### Requirement 5

**User Story:** Como jugador, quiero que la UI sea consistente entre el modo local y el modo online, para tener la misma experiencia visual independientemente del modo de juego.

#### Acceptance Criteria

1. WHEN el juego inicia en modo local THEN the FPS_UI SHALL aplicar los mismos estilos visuales que en modo online
2. WHEN el juego inicia en modo online THEN the FPS_UI SHALL aplicar los mismos estilos visuales que en modo local
3. WHEN el jugador cambia entre modos THEN the FPS_UI SHALL mantener las posiciones y estilos de todos los elementos de UI

### Requirement 6

**User Story:** Como jugador, quiero que la UI sea responsive y se adapte a diferentes resoluciones de pantalla, para poder jugar cómodamente en cualquier dispositivo.

#### Acceptance Criteria

1. WHEN la ventana del juego cambia de tamaño THEN the FPS_UI SHALL reposicionar los elementos manteniendo los márgenes relativos
2. WHEN la resolución es menor a 768px de ancho THEN the FPS_UI SHALL reducir el tamaño de los elementos de UI proporcionalmente
3. WHEN la resolución es mayor a 1920px de ancho THEN the FPS_UI SHALL mantener los tamaños máximos definidos para evitar elementos excesivamente grandes
