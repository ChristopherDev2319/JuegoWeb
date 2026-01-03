# Requirements Document

## Introduction

Este documento especifica los requisitos para implementar un sistema de matchmaking centralizado usando Redis. El problema actual es que el cluster de servidores tiene múltiples workers, cada uno con su propio estado de salas local. Cuando nginx balancea conexiones a diferentes workers, los jugadores terminan en salas diferentes y nunca se ven entre sí.

La solución implementará Redis como fuente única de verdad para el estado de salas y matchmaking, con mecanismos de locking distribuido para garantizar consistencia.

## Glossary

- **Redis**: Base de datos en memoria que servirá como almacén centralizado del estado de matchmaking
- **Worker**: Proceso del servidor que maneja conexiones WebSocket de jugadores
- **Sala (Room)**: Instancia de juego donde los jugadores interactúan
- **Matchmaking**: Proceso de encontrar y asignar jugadores a salas apropiadas
- **Lock Distribuido**: Mecanismo para garantizar que solo un proceso modifique un recurso a la vez
- **TTL (Time To Live)**: Tiempo de expiración automática de datos en Redis
- **Heartbeat**: Señal periódica que indica que un worker/sala sigue activo

## Requirements

### Requirement 1

**User Story:** Como jugador, quiero que el matchmaking me conecte con otros jugadores reales, para poder jugar partidas multijugador sin importar a qué worker me conecte nginx.

#### Acceptance Criteria

1. WHEN un jugador solicita matchmaking THEN el Sistema de Matchmaking SHALL consultar Redis para obtener todas las salas públicas disponibles en el cluster
2. WHEN existen salas públicas con espacio disponible THEN el Sistema de Matchmaking SHALL seleccionar la sala con más jugadores activos
3. WHEN no existen salas públicas disponibles THEN el Sistema de Matchmaking SHALL crear una nueva sala y registrarla en Redis
4. WHEN un jugador es asignado a una sala THEN el Sistema de Matchmaking SHALL actualizar el contador de jugadores en Redis atómicamente
5. WHEN se serializa el estado de una sala a JSON THEN el Sistema de Matchmaking SHALL poder deserializar ese JSON y obtener un estado equivalente

### Requirement 2

**User Story:** Como desarrollador, quiero que el estado de salas esté centralizado en Redis, para que todos los workers tengan una vista consistente del cluster.

#### Acceptance Criteria

1. WHEN se crea una sala THEN el Sistema de Matchmaking SHALL almacenar la información de la sala en Redis con un TTL de 5 minutos
2. WHEN una sala tiene jugadores activos THEN el Worker SHALL renovar el TTL de la sala cada 30 segundos mediante heartbeat
3. WHEN una sala queda vacía por más de 60 segundos THEN el Sistema de Matchmaking SHALL eliminar la sala de Redis
4. WHEN se consulta el estado de salas THEN el Sistema de Matchmaking SHALL retornar solo salas con heartbeat válido de los últimos 60 segundos
5. WHEN se almacena información de sala en Redis THEN el Sistema de Matchmaking SHALL incluir workerId, roomId, código, tipo, jugadores actuales y máximos

### Requirement 3

**User Story:** Como desarrollador, quiero mecanismos de locking distribuido, para evitar condiciones de carrera cuando múltiples workers intentan modificar el mismo recurso.

#### Acceptance Criteria

1. WHEN un worker intenta asignar un jugador a una sala THEN el Sistema de Matchmaking SHALL adquirir un lock distribuido para esa sala
2. WHEN el lock no puede ser adquirido en 100ms THEN el Sistema de Matchmaking SHALL reintentar hasta 3 veces con backoff exponencial
3. WHEN se completa la operación de asignación THEN el Sistema de Matchmaking SHALL liberar el lock inmediatamente
4. WHEN un lock no es liberado por crash del worker THEN el lock SHALL expirar automáticamente después de 5 segundos
5. WHEN se adquiere un lock THEN el Sistema de Matchmaking SHALL verificar que la sala aún tiene espacio antes de asignar

### Requirement 4

**User Story:** Como operador del sistema, quiero que el matchmaking sea resiliente a fallos de Redis, para mantener el servicio disponible.

#### Acceptance Criteria

1. WHEN Redis no está disponible al iniciar THEN el Worker SHALL reintentar la conexión cada 5 segundos hasta 10 intentos
2. WHEN la conexión a Redis se pierde durante operación THEN el Worker SHALL intentar reconectar automáticamente
3. WHEN Redis no responde en 1 segundo THEN la operación SHALL fallar con timeout y el worker SHALL usar fallback local
4. WHEN se recupera la conexión a Redis THEN el Worker SHALL re-sincronizar sus salas locales con Redis
5. WHEN ocurre un error de Redis THEN el Sistema de Matchmaking SHALL registrar el error con detalles para diagnóstico

### Requirement 5

**User Story:** Como desarrollador, quiero una API clara para interactuar con el matchmaking centralizado, para integrar fácilmente con el código existente.

#### Acceptance Criteria

1. WHEN se inicializa el RedisMatchmaking THEN el Sistema SHALL aceptar configuración de host, puerto y credenciales de Redis
2. WHEN se llama findOrCreateRoom THEN el Sistema SHALL retornar información de sala incluyendo workerId del owner
3. WHEN se llama registerRoom THEN el Sistema SHALL almacenar la sala y retornar confirmación de éxito
4. WHEN se llama updateRoomPlayers THEN el Sistema SHALL actualizar el contador atómicamente y retornar el nuevo valor
5. WHEN se llama removeRoom THEN el Sistema SHALL eliminar la sala de Redis y retornar confirmación

