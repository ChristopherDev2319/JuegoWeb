# Requirements Document

## Introduction

Este documento define los requisitos para el rediseño de la interfaz de usuario (UI) del jugador en primera persona. El objetivo es crear una UI moderna, limpia y funcional con elementos visuales distintivos: barra de vida prominente, indicadores de dash y curación con iconos profesionales (Lucide Icons), y una distribución optimizada de los elementos en pantalla.

## Glossary

- **HUD**: Heads-Up Display - Interfaz de usuario superpuesta durante el juego
- **FPS_UI**: Sistema de interfaz de usuario para el jugador en primera persona
- **Chat_Container**: Contenedor del sistema de chat del juego (oculto por defecto)
- **Scoreboard**: Panel que muestra estadísticas de jugadores (kills, deaths)
- **Health_Bar**: Barra visual grande que muestra la vida actual del jugador (sin contenedor negro)
- **Dash_Box**: Cuadro pequeño con icono de correr, tecla "E" y circunferencia de cargas
- **Dash_Circle**: Circunferencia pequeña encima del Dash_Box que muestra cargas (3,2,1,0)
- **Heal_Box**: Cuadro con icono de curación y tecla "C" para el botiquín
- **Weapon_Info**: Panel que muestra información del arma actual y munición
- **Kill_Feed**: Lista de eliminaciones recientes en la esquina superior derecha
- **Lucide_Icons**: Librería de iconos SVG utilizada para los indicadores visuales

## Requirements

### Requirement 1

**User Story:** Como jugador, quiero que el chat esté oculto por defecto pero disponible cuando lo necesite, para tener una vista limpia del juego sin perder la funcionalidad de comunicación.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL ocultar el Chat_Container con `display: none` o `visibility: hidden`
2. WHEN el jugador presiona la tecla T THEN the FPS_UI SHALL mostrar el Chat_Container y enfocar el campo de entrada
3. WHEN el jugador envía un mensaje o presiona Escape THEN the FPS_UI SHALL ocultar el Chat_Container nuevamente
4. WHEN el chat está oculto THEN the FPS_UI SHALL mantener el Chat_Container en el DOM sin eliminarlo

### Requirement 2

**User Story:** Como jugador, quiero ver el scoreboard en la esquina superior izquierda, para tener acceso rápido a las estadísticas de la partida.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL posicionar el Scoreboard en la esquina superior izquierda con un margen de 20px desde los bordes
2. WHEN el scoreboard se muestra THEN the FPS_UI SHALL mostrar las estadísticas de kills y deaths de los jugadores
3. WHEN el jugador presiona Tab THEN the FPS_UI SHALL mostrar el scoreboard expandido con más detalles

### Requirement 3

**User Story:** Como jugador, quiero que la barra de vida sea más grande y esté fuera de cualquier contenedor negro, para tener una visualización clara y prominente de mi estado de salud.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL posicionar la Health_Bar en la esquina inferior izquierda sin contenedor de fondo negro
2. WHEN el juego inicia THEN the Health_Bar SHALL tener un ancho mínimo de 250px y altura de 25px
3. WHEN la vida del jugador cambia THEN the Health_Bar SHALL actualizar su ancho con una transición suave de 150ms
4. WHEN la vida está por debajo del 25% THEN the Health_Bar SHALL mostrar un color rojo con efecto de pulso
5. WHEN la vida está entre 25% y 50% THEN the Health_Bar SHALL mostrar un color amarillo/naranja
6. WHEN la vida está por encima del 50% THEN the Health_Bar SHALL mostrar un color verde

### Requirement 4

**User Story:** Como jugador, quiero que el indicador de dash sea un cuadro pequeño con un icono de personaje corriendo, la tecla E debajo, y una circunferencia arriba mostrando las cargas disponibles, para tener una visualización intuitiva y moderna del sistema de dash.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL posicionar el Dash_Box a la izquierda del Weapon_Info en la esquina inferior derecha
2. WHEN el juego inicia THEN the Dash_Box SHALL mostrar un icono de personaje corriendo usando Lucide_Icons (icono "zap" o "person-standing")
3. WHEN el juego inicia THEN the Dash_Box SHALL mostrar la letra "E" debajo del icono indicando la tecla de activación
4. WHEN el juego inicia THEN the Dash_Circle SHALL posicionarse encima del Dash_Box como una circunferencia pequeña
5. WHEN el jugador tiene cargas de dash disponibles THEN the Dash_Circle SHALL mostrar el número de cargas (3, 2, 1 o 0) dentro de la circunferencia
6. WHEN el jugador tiene cargas disponibles THEN the Dash_Circle SHALL mostrar la circunferencia con borde verde no muy delgado
7. WHEN el jugador usa una carga de dash THEN the Dash_Circle SHALL cambiar el borde a gris y comenzar a llenarse sincronizado con el tiempo de recarga
8. WHEN una carga de dash se está recargando THEN the Dash_Circle SHALL mostrar un indicador de progreso circular que se llena gradualmente
9. WHEN la recarga de dash se completa THEN the Dash_Circle SHALL volver a mostrar el borde verde y actualizar el número de cargas

### Requirement 5

**User Story:** Como jugador, quiero tener un cuadro de botiquín a la izquierda del cuadro de dash con un icono de curación y la tecla C, para saber rápidamente cómo activar la curación.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL posicionar el Heal_Box a la izquierda del Dash_Box
2. WHEN el juego inicia THEN the Heal_Box SHALL mostrar un icono de curación (cruz o corazón) usando Lucide_Icons
3. WHEN el juego inicia THEN the Heal_Box SHALL mostrar la letra "C" debajo del icono indicando la tecla de activación
4. WHEN el jugador puede curarse THEN the Heal_Box SHALL mostrar el icono con color verde o blanco brillante
5. WHEN el jugador no puede curarse (cooldown o vida llena) THEN the Heal_Box SHALL mostrar el icono con color gris atenuado
6. WHEN la curación está en cooldown THEN the Heal_Box SHALL mostrar un indicador de progreso circular

### Requirement 6

**User Story:** Como jugador, quiero que la UI utilice una librería de iconos profesional compatible con todos los sistemas en lugar de emojis, para tener una apariencia visual consistente y de alta calidad.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL cargar la librería Lucide_Icons para todos los iconos de la interfaz
2. WHEN se muestra el icono de correr en el Dash_Box THEN the FPS_UI SHALL usar el icono "zap" o "person-standing" de Lucide_Icons
3. WHEN se muestra el icono de curación en el Heal_Box THEN the FPS_UI SHALL usar el icono "heart" o "plus" de Lucide_Icons
4. WHEN se renderizan iconos THEN the FPS_UI SHALL aplicar estilos SVG consistentes con el tema visual del juego
5. WHEN se renderizan iconos THEN the FPS_UI SHALL garantizar compatibilidad con todos los navegadores y sistemas operativos

### Requirement 7

**User Story:** Como jugador, quiero que el panel de información del arma esté posicionado en la esquina inferior derecha con un diseño compacto, para ver la munición y el arma actual sin distracciones.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL posicionar el Weapon_Info en la esquina inferior derecha con un margen de 20px
2. WHEN el jugador tiene un arma equipada THEN the Weapon_Info SHALL mostrar el nombre del arma, munición actual y munición de reserva
3. WHEN el jugador tiene el cuchillo equipado THEN the Weapon_Info SHALL ocultar el contador de munición
4. WHEN el jugador está recargando THEN the Weapon_Info SHALL mostrar el texto "RECARGANDO..." con color amarillo
5. WHEN la munición actual es menor o igual a 5 THEN the Weapon_Info SHALL mostrar el contador en color rojo

### Requirement 8

**User Story:** Como jugador, quiero que la UI tenga un diseño moderno con efectos visuales atractivos, para mejorar la experiencia visual del juego.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL aplicar un estilo visual con bordes redondeados, sombras suaves y fondos semi-transparentes
2. WHEN el jugador recibe daño THEN the FPS_UI SHALL mostrar un efecto de flash rojo en los bordes de la pantalla
3. WHEN el jugador elimina a un enemigo THEN the Kill_Feed SHALL mostrar la entrada con una animación de deslizamiento desde la derecha
4. WHEN el jugador cambia de arma THEN the Weapon_Info SHALL mostrar una notificación temporal con animación de fade

### Requirement 9

**User Story:** Como jugador, quiero que la distribución de elementos en la parte inferior de la pantalla sea: Heal_Box | Dash_Box | Weapon_Info (de izquierda a derecha en la esquina inferior derecha), para tener una organización lógica y accesible.

#### Acceptance Criteria

1. WHEN el juego inicia THEN the FPS_UI SHALL organizar los elementos inferiores derechos en el orden: Heal_Box, Dash_Box, Weapon_Info
2. WHEN el juego inicia THEN the FPS_UI SHALL mantener un espaciado consistente de 10px entre Heal_Box, Dash_Box y Weapon_Info
3. WHEN la ventana cambia de tamaño THEN the FPS_UI SHALL mantener la alineación y espaciado de los elementos

### Requirement 10

**User Story:** Como jugador, quiero que la UI sea responsive y se adapte a diferentes resoluciones de pantalla, para poder jugar cómodamente en cualquier dispositivo.

#### Acceptance Criteria

1. WHEN la ventana del juego cambia de tamaño THEN the FPS_UI SHALL reposicionar los elementos manteniendo los márgenes relativos
2. WHEN la resolución es menor a 768px de ancho THEN the FPS_UI SHALL reducir el tamaño de los elementos de UI proporcionalmente
3. WHEN la resolución es mayor a 1920px de ancho THEN the FPS_UI SHALL mantener los tamaños máximos definidos para evitar elementos excesivamente grandes
