# Requirements Document

## Introduction

Este documento especifica los requisitos para mejorar el sistema de servidores del juego multijugador. El sistema actual tiene varios bugs críticos: el matchmaking no conecta jugadores correctamente (incluso cuando hay un solo jugador esperando), el código de sala no se muestra en partidas privadas, y se necesita asegurar que cada servidor soporte máximo 8 jugadores en partidas completamente separadas.

## Glossary

- **Sistema_Matchmaking**: Componente del servidor que busca y asigna jugadores a partidas públicas disponibles
- **Sistema_Salas**: Componente que gestiona la creación, unión y eliminación de salas de juego
- **Sala_Publica**: Partida accesible mediante matchmaking automático sin necesidad de código
- **Sala_Privada**: Partida accesible únicamente mediante código de 6 caracteres alfanuméricos
- **Codigo_Sala**: Identificador único de 6 caracteres alfanuméricos para acceder a una sala privada
- **GameManager**: Instancia que gestiona el estado del juego para una sala específica
- **Cliente**: Aplicación del navegador que se conecta al servidor mediante WebSocket

## Requirements

### Requirement 1: Matchmaking Funcional

**User Story:** Como jugador, quiero que el matchmaking me conecte automáticamente a una partida pública, para poder jugar sin esperar indefinidamente.

#### Acceptance Criteria

1. WHEN un jugador solicita matchmaking AND existen salas públicas con espacio disponible THEN el Sistema_Matchmaking SHALL conectar al jugador a la sala pública con más jugadores activos
2. WHEN un jugador solicita matchmaking AND no existen salas públicas disponibles THEN el Sistema_Matchmaking SHALL crear una nueva sala pública y conectar al jugador a ella
3. WHEN un jugador es conectado a una sala mediante matchmaking THEN el Sistema_Matchmaking SHALL enviar confirmación con roomId, roomCode, cantidad de jugadores y máximo de jugadores
4. WHEN un jugador es el único en una sala pública THEN el Sistema_Salas SHALL mantener la sala disponible para que otros jugadores puedan unirse mediante matchmaking

### Requirement 2: Visualización de Código de Sala Privada

**User Story:** Como jugador que crea una partida privada, quiero ver el código de la sala claramente, para poder compartirlo con mis amigos.

#### Acceptance Criteria

1. WHEN un jugador crea una sala privada exitosamente THEN el Cliente SHALL mostrar el código de 6 caracteres en la pantalla de espera
2. WHEN el servidor responde a la creación de sala privada THEN el Sistema_Salas SHALL incluir el campo roomCode en la respuesta
3. WHEN el Cliente recibe la respuesta de creación exitosa THEN el Cliente SHALL navegar automáticamente a la pantalla de espera mostrando el código
4. WHEN el código de sala se muestra en pantalla THEN el Cliente SHALL permitir copiar el código al portapapeles mediante un botón

### Requirement 3: Separación de Partidas

**User Story:** Como jugador, quiero que mi partida esté completamente separada de otras partidas, para que las acciones de otros jugadores en otras salas no me afecten.

#### Acceptance Criteria

1. WHEN se crea una nueva sala THEN el Sistema_Salas SHALL instanciar un GameManager independiente para esa sala
2. WHEN un jugador envía un input de juego THEN el Sistema_Salas SHALL procesar el input únicamente en el GameManager de la sala del jugador
3. WHEN el servidor transmite el estado del juego THEN el Sistema_Salas SHALL enviar el estado únicamente a los jugadores de la misma sala
4. WHEN un jugador dispara THEN el Sistema_Salas SHALL crear la bala únicamente en el GameManager de la sala del jugador

### Requirement 4: Límite de Jugadores por Sala

**User Story:** Como administrador del servidor, quiero que cada sala tenga un máximo de 8 jugadores, para mantener el rendimiento óptimo del juego.

#### Acceptance Criteria

1. WHEN una sala alcanza 8 jugadores THEN el Sistema_Salas SHALL rechazar nuevas conexiones a esa sala con mensaje de error "Partida llena"
2. WHEN el matchmaking busca salas disponibles THEN el Sistema_Matchmaking SHALL excluir salas que tengan 8 jugadores
3. WHEN un jugador intenta unirse a una sala privada llena THEN el Sistema_Salas SHALL responder con error indicando que la sala está llena
4. WHEN se muestra información de una sala THEN el Sistema_Salas SHALL incluir el conteo actual de jugadores y el máximo permitido

### Requirement 5: Sincronización de Estado de Sala

**User Story:** Como jugador en una sala de espera, quiero ver la lista actualizada de jugadores, para saber quién está en mi partida.

#### Acceptance Criteria

1. WHEN un jugador se une a una sala THEN el Sistema_Salas SHALL notificar a todos los jugadores de la sala sobre el nuevo jugador
2. WHEN un jugador abandona una sala THEN el Sistema_Salas SHALL notificar a todos los jugadores restantes sobre la salida
3. WHEN un jugador se conecta a una sala THEN el Sistema_Salas SHALL enviar la lista completa de jugadores actuales al nuevo jugador
4. WHEN el Cliente recibe actualización de jugadores THEN el Cliente SHALL actualizar la lista visual de jugadores en la pantalla de espera

### Requirement 6: Manejo de Errores de Conexión

**User Story:** Como jugador, quiero recibir mensajes de error claros cuando algo falla, para entender qué sucedió y qué puedo hacer.

#### Acceptance Criteria

1. WHEN el matchmaking falla por cualquier razón THEN el Sistema_Matchmaking SHALL enviar un mensaje de error descriptivo al Cliente
2. WHEN un jugador intenta unirse a una sala inexistente THEN el Sistema_Salas SHALL responder con error "Sala no encontrada"
3. WHEN un jugador intenta unirse con contraseña incorrecta THEN el Sistema_Salas SHALL responder con error "Contraseña incorrecta"
4. WHEN el Cliente recibe un error del servidor THEN el Cliente SHALL mostrar el mensaje de error en la interfaz de usuario

