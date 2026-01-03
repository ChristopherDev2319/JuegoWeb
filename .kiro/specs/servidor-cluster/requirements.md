# Requirements Document

## Introduction

Este documento especifica los requisitos para implementar un sistema de clustering en el servidor del juego multijugador FPS. Actualmente el servidor utiliza un solo núcleo de CPU, desperdiciando los 7 núcleos restantes disponibles en el servidor de producción (8 núcleos, 16GB RAM). El objetivo es distribuir las salas de juego entre múltiples procesos worker para maximizar la capacidad del servidor y mejorar el rendimiento.

## Glossary

- **Proceso_Master**: Proceso principal de Node.js que gestiona la creación de workers y el balanceo de carga
- **Proceso_Worker**: Proceso hijo de Node.js que ejecuta una instancia del servidor de juego y maneja múltiples salas
- **Sistema_Cluster**: Módulo nativo de Node.js que permite crear procesos hijos que comparten el puerto del servidor
- **Sala_Juego**: Instancia de partida con hasta 8 jugadores y su propio GameManager
- **Balanceador_Carga**: Componente del Proceso_Master que distribuye nuevas conexiones entre workers
- **IPC**: Inter-Process Communication, mecanismo para comunicación entre Proceso_Master y Proceso_Worker
- **Sticky_Sessions**: Técnica que asegura que un cliente siempre se conecte al mismo worker

## Requirements

### Requirement 1: Arquitectura de Clustering

**User Story:** Como administrador del servidor, quiero que el servidor utilice todos los núcleos de CPU disponibles, para maximizar la capacidad de jugadores simultáneos.

#### Acceptance Criteria

1. WHEN el servidor inicia THEN el Proceso_Master SHALL crear 7 procesos worker (reservando 1 núcleo para el master)
2. WHEN un Proceso_Worker falla THEN el Proceso_Master SHALL crear un nuevo worker de reemplazo en menos de 5 segundos
3. WHEN el servidor recibe SIGINT o SIGTERM THEN el Proceso_Master SHALL enviar señal de cierre graceful a todos los workers antes de terminar
4. WHEN un worker recibe señal de cierre THEN el Proceso_Worker SHALL completar las operaciones pendientes y cerrar conexiones activas

### Requirement 2: Distribución de Salas por Worker

**User Story:** Como administrador del servidor, quiero que las salas se distribuyan equitativamente entre workers, para balancear la carga de CPU y memoria.

#### Acceptance Criteria

1. WHEN se crea una nueva sala THEN el Balanceador_Carga SHALL asignarla al worker con menos salas activas
2. WHEN un worker tiene 15 salas activas THEN el Balanceador_Carga SHALL evitar asignar nuevas salas a ese worker
3. WHEN se solicita información del cluster THEN el Sistema_Cluster SHALL reportar el número de salas y jugadores por worker
4. WHEN todas las salas de un worker están vacías por más de 60 segundos THEN el Proceso_Worker SHALL limpiar las salas inactivas

### Requirement 3: Comunicación Inter-Proceso

**User Story:** Como desarrollador, quiero que los workers puedan comunicarse con el master, para coordinar el estado global del cluster.

#### Acceptance Criteria

1. WHEN un worker necesita reportar métricas THEN el Proceso_Worker SHALL enviar mensaje IPC al Proceso_Master con conteo de salas y jugadores
2. WHEN el master necesita información de un worker THEN el Proceso_Master SHALL enviar solicitud IPC y recibir respuesta en menos de 100ms
3. WHEN un jugador busca sala mediante matchmaking THEN el Proceso_Master SHALL consultar disponibilidad en todos los workers antes de responder
4. WHEN se serializa un mensaje IPC THEN el Sistema_Cluster SHALL usar formato JSON para compatibilidad

### Requirement 4: Sticky Sessions para WebSocket

**User Story:** Como jugador, quiero mantener mi conexión estable durante toda la partida, para no perder mi progreso por reconexiones.

#### Acceptance Criteria

1. WHEN un cliente establece conexión WebSocket THEN el Sistema_Cluster SHALL dirigir todas las solicitudes de ese cliente al mismo worker
2. WHEN un cliente se reconecta después de desconexión temporal THEN el Sistema_Cluster SHALL intentar reconectar al mismo worker donde estaba su sala
3. WHEN el worker asignado no está disponible THEN el Sistema_Cluster SHALL redirigir al cliente a otro worker y notificar la pérdida de sesión
4. WHEN se asigna un cliente a un worker THEN el Sistema_Cluster SHALL usar hash del ID de conexión para determinar el worker

### Requirement 5: Monitoreo y Logging del Cluster

**User Story:** Como administrador, quiero ver el estado de cada worker en tiempo real, para identificar problemas de rendimiento.

#### Acceptance Criteria

1. WHEN el cluster está activo THEN el Proceso_Master SHALL escribir métricas de cada worker al log cada 30 segundos
2. WHEN un worker excede 80% de uso de memoria THEN el Sistema_Cluster SHALL registrar advertencia en el log
3. WHEN un worker se reinicia THEN el Sistema_Cluster SHALL registrar el evento con timestamp y razón del reinicio
4. WHEN se solicita estado del cluster THEN el Sistema_Cluster SHALL retornar JSON con workers activos, salas totales y jugadores totales

### Requirement 6: Límites de Recursos por Worker

**User Story:** Como administrador, quiero establecer límites de recursos por worker, para prevenir que un worker afecte a los demás.

#### Acceptance Criteria

1. WHEN un worker alcanza 15 salas activas THEN el Balanceador_Carga SHALL marcar ese worker como no disponible para nuevas salas
2. WHEN un worker tiene 120 jugadores conectados THEN el Balanceador_Carga SHALL rechazar nuevas conexiones a ese worker
3. WHEN se configura el cluster THEN el Sistema_Cluster SHALL permitir ajustar límites de salas y jugadores por worker mediante variables de entorno
4. WHEN un worker excede límites configurados THEN el Sistema_Cluster SHALL registrar el evento y continuar operando sin crear nuevas salas en ese worker
