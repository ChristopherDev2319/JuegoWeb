# Requirements Document

## Introduction

Este documento especifica los requisitos para implementar la sincronización completa entre workers del cluster del servidor de juego FPS multijugador. Actualmente el sistema tiene implementado clustering con 7 workers y matchmaking con Redis, pero existe un problema crítico: cuando nginx balancea un jugador a un worker diferente al que hospeda la sala, el jugador no puede unirse correctamente porque cada worker mantiene sus propias salas locales.

El objetivo es implementar un sistema donde todos los jugadores que soliciten matchmaking sean asignados a la misma sala, independientemente del worker al que se conecten inicialmente.

## Glossary

- **Worker**: Proceso del servidor que maneja conexiones WebSocket de jugadores
- **Sala (Room)**: Instancia de juego donde los jugadores interactúan
- **Redis**: Base de datos en memoria que sirve como fuente única de verdad para el estado de salas
- **Matchmaking**: Proceso de encontrar y asignar jugadores a salas apropiadas
- **Worker_Owner**: Worker que hospeda físicamente una sala y ejecuta su GameManager
- **Worker_Proxy**: Worker que recibe la conexión inicial de un jugador pero debe redirigirlo al Worker_Owner
- **IPC**: Inter-Process Communication entre master y workers
- **Heartbeat**: Señal periódica que indica que un worker/sala sigue activo

## Requirements

### Requirement 1: Matchmaking Centralizado Funcional

**User Story:** Como jugador, quiero que el matchmaking me conecte con otros jugadores reales en la misma sala, para poder jugar partidas multijugador sin importar a qué worker me conecte nginx.

#### Acceptance Criteria

1. WHEN un jugador solicita matchmaking THEN el Sistema de Matchmaking SHALL consultar Redis para obtener la sala pública con más jugadores
2. WHEN existe una sala pública con espacio disponible THEN el Sistema de Matchmaking SHALL asignar al jugador a esa sala específica
3. WHEN la sala está en un worker diferente al de la conexión THEN el Sistema de Matchmaking SHALL redirigir al jugador al worker correcto mediante IPC
4. WHEN no existen salas públicas disponibles THEN el Sistema de Matchmaking SHALL crear una nueva sala en el worker actual y registrarla en Redis
5. WHEN se serializa el estado de una sala a JSON THEN el Sistema de Matchmaking SHALL poder deserializar ese JSON y obtener un estado equivalente

### Requirement 2: Comunicación Inter-Worker para Jugadores

**User Story:** Como desarrollador, quiero que los workers puedan transferir jugadores entre sí, para que un jugador pueda unirse a una sala hospedada en otro worker.

#### Acceptance Criteria

1. WHEN un jugador necesita unirse a una sala en otro worker THEN el Worker_Proxy SHALL enviar solicitud de transferencia al Master
2. WHEN el Master recibe solicitud de transferencia THEN el Master SHALL reenviar la solicitud al Worker_Owner correspondiente
3. WHEN el Worker_Owner recibe solicitud de transferencia THEN el Worker_Owner SHALL crear una conexión virtual para el jugador
4. WHEN la transferencia es exitosa THEN el Worker_Proxy SHALL actuar como proxy de mensajes entre el cliente y el Worker_Owner
5. WHEN un mensaje de juego llega al Worker_Proxy THEN el Worker_Proxy SHALL reenviar el mensaje al Worker_Owner vía IPC

### Requirement 3: Sincronización de Estado de Salas

**User Story:** Como administrador, quiero que el estado de salas esté sincronizado entre Redis y los workers, para garantizar consistencia en el matchmaking.

#### Acceptance Criteria

1. WHEN se crea una sala THEN el Worker_Owner SHALL registrar la sala en Redis con workerId, roomId, código, jugadores y maxJugadores
2. WHEN un jugador se une a una sala THEN el Worker_Owner SHALL actualizar el contador de jugadores en Redis atómicamente
3. WHEN un jugador abandona una sala THEN el Worker_Owner SHALL decrementar el contador de jugadores en Redis
4. WHEN una sala queda vacía por más de 60 segundos THEN el Worker_Owner SHALL eliminar la sala de Redis
5. WHEN el Worker_Owner envía heartbeat THEN el Sistema SHALL renovar el TTL de la sala en Redis

### Requirement 4: Proxy de Mensajes WebSocket

**User Story:** Como jugador, quiero que mis acciones de juego lleguen correctamente a la sala, aunque esté conectado a un worker diferente al que hospeda la sala.

#### Acceptance Criteria

1. WHEN el Worker_Proxy recibe un mensaje de juego THEN el Worker_Proxy SHALL reenviar el mensaje al Worker_Owner sin modificación
2. WHEN el Worker_Owner genera un mensaje de broadcast THEN el Worker_Owner SHALL enviar el mensaje a todos los Worker_Proxy con jugadores en esa sala
3. WHEN el Worker_Proxy recibe un mensaje de broadcast THEN el Worker_Proxy SHALL enviar el mensaje al cliente WebSocket correspondiente
4. WHEN la conexión WebSocket del cliente se cierra THEN el Worker_Proxy SHALL notificar al Worker_Owner para remover al jugador

### Requirement 5: Resiliencia y Fallback

**User Story:** Como operador del sistema, quiero que el matchmaking funcione incluso si Redis no está disponible, para mantener el servicio operativo.

#### Acceptance Criteria

1. WHEN Redis no está disponible THEN el Worker SHALL usar matchmaking local como fallback
2. WHEN Redis se recupera THEN el Worker SHALL sincronizar sus salas locales con Redis
3. WHEN un Worker_Owner falla THEN el Master SHALL notificar a los Worker_Proxy para desconectar a los jugadores afectados
4. WHEN la comunicación IPC falla THEN el Worker_Proxy SHALL informar al cliente del error y permitir reconexión

