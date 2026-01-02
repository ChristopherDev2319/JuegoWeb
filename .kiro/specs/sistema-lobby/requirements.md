# Documento de Requisitos - Sistema de Lobby

## Introducción

Este documento define los requisitos para implementar un sistema de lobby/sala de espera para el juego FPS multijugador. El sistema permitirá a los jugadores configurar su nombre, elegir entre modo local u online, y en caso de online, seleccionar entre partidas públicas o privadas con sistema de matchmaking.

## Glosario

- **Lobby**: Pantalla principal de entrada al juego donde el jugador configura opciones antes de entrar a una partida
- **Sistema_Lobby**: Módulo que gestiona la interfaz de lobby y la lógica de conexión a partidas
- **Matchmaking**: Sistema automático que empareja jugadores en partidas públicas según disponibilidad
- **Partida_Privada**: Sala de juego protegida por contraseña donde solo pueden entrar jugadores con el código correcto
- **Partida_Pública**: Sala de juego abierta donde cualquier jugador puede unirse mediante matchmaking
- **Modo_Local**: Modo de juego sin conexión a servidor, para práctica individual
- **Servidor_Juego**: Instancia del servidor WebSocket que gestiona una partida activa

## Requisitos

### Requisito 1

**User Story:** Como jugador, quiero ver una pantalla de lobby al entrar al juego, para poder configurar mi experiencia antes de jugar.

#### Criterios de Aceptación

1. WHEN el jugador accede a index.html THEN el Sistema_Lobby SHALL mostrar la pantalla de lobby en lugar de iniciar el juego directamente
2. WHEN la pantalla de lobby se muestra THEN el Sistema_Lobby SHALL presentar un campo de texto para ingresar el nombre del jugador
3. WHEN la pantalla de lobby se muestra THEN el Sistema_Lobby SHALL presentar botones para seleccionar modo local u online
4. WHEN el jugador no ingresa un nombre THEN el Sistema_Lobby SHALL generar un nombre aleatorio con formato "Jugador_XXXX"
5. WHEN el jugador ingresa un nombre THEN el Sistema_Lobby SHALL validar que tenga entre 3 y 16 caracteres alfanuméricos

### Requisito 2

**User Story:** Como jugador, quiero poder jugar en modo local sin conexión, para practicar o jugar sin internet.

#### Criterios de Aceptación

1. WHEN el jugador selecciona modo local THEN el Sistema_Lobby SHALL iniciar el juego sin intentar conexión al servidor
2. WHEN el modo local está activo THEN el Sistema_Lobby SHALL almacenar la configuración en localStorage
3. WHEN el juego inicia en modo local THEN el Sistema_Lobby SHALL mostrar indicador de "Modo Local" en la interfaz

### Requisito 3

**User Story:** Como jugador, quiero elegir entre partidas públicas y privadas cuando juego online, para tener control sobre con quién juego.

#### Criterios de Aceptación

1. WHEN el jugador selecciona modo online THEN el Sistema_Lobby SHALL mostrar opciones de partida pública y partida privada
2. WHEN el jugador selecciona partida pública THEN el Sistema_Lobby SHALL iniciar el proceso de matchmaking
3. WHEN el jugador selecciona partida privada THEN el Sistema_Lobby SHALL mostrar opciones para crear o unirse a una partida

### Requisito 4

**User Story:** Como jugador, quiero crear partidas privadas con contraseña, para jugar solo con mis amigos.

#### Criterios de Aceptación

1. WHEN el jugador selecciona crear partida privada THEN el Sistema_Lobby SHALL mostrar un formulario para ingresar contraseña
2. WHEN el jugador crea una partida privada THEN el Sistema_Lobby SHALL generar un código de sala único de 6 caracteres
3. WHEN la partida privada se crea exitosamente THEN el Sistema_Lobby SHALL mostrar el código de sala para compartir con otros jugadores
4. WHEN el jugador ingresa una contraseña THEN el Sistema_Lobby SHALL validar que tenga entre 4 y 20 caracteres
5. IF la creación de partida falla THEN el Sistema_Lobby SHALL mostrar mensaje de error descriptivo

### Requisito 5

**User Story:** Como jugador, quiero unirme a partidas privadas de mis amigos, para jugar juntos.

#### Criterios de Aceptación

1. WHEN el jugador selecciona unirse a partida privada THEN el Sistema_Lobby SHALL mostrar campos para código de sala y contraseña
2. WHEN el jugador ingresa código y contraseña correctos THEN el Sistema_Lobby SHALL conectar al jugador a la partida
3. IF el código de sala no existe THEN el Sistema_Lobby SHALL mostrar mensaje "Sala no encontrada"
4. IF la contraseña es incorrecta THEN el Sistema_Lobby SHALL mostrar mensaje "Contraseña incorrecta"
5. IF la partida está llena THEN el Sistema_Lobby SHALL mostrar mensaje "Partida llena"

### Requisito 6

**User Story:** Como jugador, quiero que el matchmaking me conecte automáticamente a partidas con jugadores, para encontrar partidas rápidamente.

#### Criterios de Aceptación

1. WHEN el matchmaking inicia THEN el Sistema_Lobby SHALL buscar partidas públicas con espacio disponible
2. WHEN existen múltiples partidas disponibles THEN el Sistema_Lobby SHALL conectar al jugador a la partida con más jugadores activos
3. IF no existen partidas públicas disponibles THEN el Sistema_Lobby SHALL crear una nueva partida pública
4. WHILE el matchmaking busca partida THEN el Sistema_Lobby SHALL mostrar indicador de "Buscando partida..."
5. WHEN el matchmaking encuentra partida THEN el Sistema_Lobby SHALL conectar al jugador en menos de 5 segundos

### Requisito 7

**User Story:** Como jugador, quiero acceder a configuraciones desde el lobby, para ajustar el juego antes de entrar.

#### Criterios de Aceptación

1. WHEN la pantalla de lobby se muestra THEN el Sistema_Lobby SHALL presentar un botón de configuración
2. WHEN el jugador abre configuración THEN el Sistema_Lobby SHALL mostrar opciones de sensibilidad, volumen y gráficos
3. WHEN el jugador modifica configuración THEN el Sistema_Lobby SHALL guardar los cambios en localStorage
4. WHEN el jugador cierra configuración THEN el Sistema_Lobby SHALL volver a la pantalla principal del lobby

### Requisito 8

**User Story:** Como jugador, quiero ver información de mi perfil en el lobby, para conocer mis estadísticas.

#### Criterios de Aceptación

1. WHEN la pantalla de lobby se muestra THEN el Sistema_Lobby SHALL mostrar el nombre del jugador actual
2. WHEN la pantalla de lobby se muestra THEN el Sistema_Lobby SHALL mostrar estadísticas básicas del jugador (kills, muertes, K/D)
3. WHEN las estadísticas no existen THEN el Sistema_Lobby SHALL mostrar valores iniciales en cero

### Requisito 9

**User Story:** Como jugador, quiero que el lobby tenga una interfaz visual atractiva, para una mejor experiencia de usuario.

#### Criterios de Aceptación

1. WHEN la pantalla de lobby se muestra THEN el Sistema_Lobby SHALL aplicar estilos consistentes con el tema del juego
2. WHEN el jugador interactúa con botones THEN el Sistema_Lobby SHALL proporcionar feedback visual mediante animaciones
3. WHEN hay transiciones entre pantallas THEN el Sistema_Lobby SHALL aplicar animaciones suaves de entrada y salida

### Requisito 10

**User Story:** Como desarrollador del servidor, quiero gestionar múltiples salas de juego, para soportar partidas públicas y privadas simultáneas.

#### Criterios de Aceptación

1. WHEN un jugador crea partida privada THEN el Servidor_Juego SHALL crear una nueva instancia de sala con ID único
2. WHEN un jugador solicita matchmaking THEN el Servidor_Juego SHALL retornar la sala pública con más jugadores
3. WHEN una sala queda vacía por más de 60 segundos THEN el Servidor_Juego SHALL eliminar la sala automáticamente
4. WHEN el servidor recibe solicitud de unirse a sala THEN el Servidor_Juego SHALL validar código y contraseña antes de permitir acceso
5. WHEN el servidor gestiona salas THEN el Servidor_Juego SHALL mantener un máximo de 8 jugadores por sala
