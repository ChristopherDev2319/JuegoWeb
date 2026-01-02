# Documento de Requisitos - Rediseño Visual del Lobby

## Introducción

Este documento especifica los requisitos para rediseñar la interfaz visual del lobby del juego FPS Arena. El objetivo es transformar el diseño actual (contenedor centrado de 450px con colores oscuros) a una interfaz de pantalla completa con una paleta de colores más clara, moderna y agradable visualmente.

## Glosario

- **Lobby**: Pantalla principal del juego donde el jugador configura su nombre, ve estadísticas y selecciona el modo de juego
- **Sistema de UI del Lobby**: Conjunto de pantallas y componentes visuales que conforman la experiencia pre-partida
- **Paleta Clara**: Esquema de colores basado en tonos claros, blancos y acentos suaves
- **Pantalla Completa**: Diseño que ocupa el 100% del viewport sin contenedores centrados limitados

## Requisitos

### Requisito 1

**User Story:** Como jugador, quiero ver el lobby en pantalla completa, para tener una experiencia más inmersiva y moderna.

#### Criterios de Aceptación

1. WHEN el jugador accede al lobby THEN el Sistema de UI del Lobby SHALL mostrar el contenido ocupando el 100% del ancho y alto de la pantalla
2. WHEN el lobby se muestra en pantalla completa THEN el Sistema de UI del Lobby SHALL distribuir los elementos de forma equilibrada usando un layout de dos columnas en pantallas grandes
3. WHEN el viewport es menor a 768px THEN el Sistema de UI del Lobby SHALL adaptar el layout a una sola columna manteniendo la usabilidad

### Requisito 2

**User Story:** Como jugador, quiero ver colores más claros y agradables en el lobby, para tener una experiencia visual más cómoda y moderna.

#### Criterios de Aceptación

1. WHEN el lobby se renderiza THEN el Sistema de UI del Lobby SHALL usar un fondo con gradiente de tonos claros (blancos, grises suaves, azules pastel)
2. WHEN se muestran los contenedores y tarjetas THEN el Sistema de UI del Lobby SHALL aplicar fondos blancos o semi-transparentes con sombras suaves
3. WHEN se muestran textos principales THEN el Sistema de UI del Lobby SHALL usar colores oscuros (gris oscuro o negro) para garantizar legibilidad
4. WHEN se muestran elementos de acento (botones primarios, estadísticas) THEN el Sistema de UI del Lobby SHALL usar una paleta de colores vibrantes pero suaves (azul claro, verde menta, coral suave)

### Requisito 3

**User Story:** Como jugador, quiero que los botones y elementos interactivos sean visualmente atractivos, para tener una experiencia de navegación agradable.

#### Criterios de Aceptación

1. WHEN el jugador ve los botones del lobby THEN el Sistema de UI del Lobby SHALL mostrar botones con bordes redondeados, sombras suaves y colores de fondo claros
2. WHEN el jugador pasa el cursor sobre un botón THEN el Sistema de UI del Lobby SHALL aplicar una transición suave de color y elevación (sombra más pronunciada)
3. WHEN el jugador hace clic en un botón THEN el Sistema de UI del Lobby SHALL mostrar feedback visual inmediato (cambio de escala o color)

### Requisito 4

**User Story:** Como jugador, quiero que las estadísticas y la información se muestren de forma clara y organizada, para entender rápidamente mi progreso.

#### Criterios de Aceptación

1. WHEN se muestran las estadísticas del jugador THEN el Sistema de UI del Lobby SHALL presentarlas en tarjetas individuales con iconos representativos
2. WHEN se muestra el panel de estadísticas THEN el Sistema de UI del Lobby SHALL usar tipografía clara con jerarquía visual (valores grandes, etiquetas pequeñas)
3. WHEN se muestran valores numéricos importantes THEN el Sistema de UI del Lobby SHALL destacarlos con colores de acento y tamaño de fuente mayor

### Requisito 5

**User Story:** Como jugador, quiero que el campo de nombre y los inputs sean fáciles de usar, para configurar mi perfil sin dificultad.

#### Criterios de Aceptación

1. WHEN el jugador ve los campos de entrada THEN el Sistema de UI del Lobby SHALL mostrar inputs con bordes suaves, fondo claro y placeholder visible
2. WHEN el jugador enfoca un campo de entrada THEN el Sistema de UI del Lobby SHALL aplicar un borde de color de acento y sombra sutil
3. WHEN hay un error de validación THEN el Sistema de UI del Lobby SHALL mostrar el mensaje de error en color rojo suave sin ser agresivo visualmente

### Requisito 6

**User Story:** Como jugador, quiero que las transiciones entre pantallas sean fluidas, para tener una experiencia de navegación agradable.

#### Criterios de Aceptación

1. WHEN el jugador navega entre pantallas del lobby THEN el Sistema de UI del Lobby SHALL aplicar transiciones de fade y slide con duración de 300ms
2. WHEN una pantalla se oculta THEN el Sistema de UI del Lobby SHALL aplicar una animación de salida suave antes de mostrar la siguiente
