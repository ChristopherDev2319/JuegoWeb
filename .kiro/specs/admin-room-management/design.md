# Design Document: Admin Room Management

## Overview

Esta funcionalidad extiende el panel de administración de BearStrike para incluir gestión de partidas en tiempo real. Se añadirá una nueva sección "Partidas" en la navegación del admin panel que permitirá visualizar todas las salas activas, ver detalles de cada una, y ejecutar acciones como kick de jugadores.

La arquitectura sigue el patrón existente del admin panel: frontend en vanilla JS que consume APIs REST del backend, con la adición de polling para actualizaciones en tiempo real de las salas.

## Architecture

```mermaid
flowchart TB
    subgraph Frontend["Admin Panel (Browser)"]
        UI[adminPanel.js]
        RoomsView[Rooms View Component]
    end
    
    subgraph Backend["Backend Server (Express)"]
        AdminRoutes[/api/admin/rooms]
        KickRoute[/api/admin/rooms/:id/kick]
    end
    
    subgraph GameServer["Game Server (WebSocket)"]
        RoomManager[RoomManager]
        GameRoom[GameRoom instances]
        Connections[WebSocket Connections]
    end
    
    UI --> RoomsView
    RoomsView -->|GET /rooms| AdminRoutes
    RoomsView -->|POST /kick| KickRoute
    AdminRoutes -->|Query| RoomManager
    KickRoute -->|Kick player| GameRoom
    KickRoute -->|Close connection| Connections
```

### Communication Flow

1. El admin panel hace polling cada 5 segundos a `GET /api/admin/rooms`
2. El backend consulta el `RoomManager` del servidor de juego para obtener estado actual
3. Para kick: `POST /api/admin/rooms/:roomId/kick` con `{ playerId }` en body
4. El backend localiza la conexión WebSocket del jugador y la cierra con código de error

## Components and Interfaces

### Backend API Endpoints

#### GET /api/admin/rooms
Retorna lista de todas las salas activas.

```typescript
interface RoomListResponse {
  success: boolean;
  data: {
    rooms: RoomInfo[];
    total: number;
  };
}

interface RoomInfo {
  id: string;
  codigo: string;
  tipo: 'publica' | 'privada';
  estado: 'esperando' | 'jugando' | 'cerrando';
  jugadores: number;
  maxJugadores: number;
  creadaEn: string; // ISO date
}
```

#### GET /api/admin/rooms/:id
Retorna detalles de una sala específica.

```typescript
interface RoomDetailResponse {
  success: boolean;
  data: {
    room: RoomInfo;
    players: PlayerInfo[];
  };
}

interface PlayerInfo {
  id: string;
  nombre: string;
  listo: boolean;
}
```

#### POST /api/admin/rooms/:id/kick
Expulsa un jugador de una sala.

```typescript
interface KickRequest {
  playerId: string;
  reason?: string;
}

interface KickResponse {
  success: boolean;
  message: string;
}
```

### Frontend Components

#### State Extension
```javascript
// Añadir a state existente
state.rooms = {
  data: [],
  selectedRoom: null,
  pollingInterval: null
};
```

#### New Functions
- `loadRooms()` - Carga lista de salas desde API
- `renderRoomsView()` - Renderiza la vista de salas
- `viewRoomDetail(roomId)` - Muestra modal con detalles de sala
- `kickPlayer(roomId, playerId)` - Ejecuta kick con confirmación
- `startRoomsPolling()` / `stopRoomsPolling()` - Control de actualización automática

## Data Models

### Room State (from GameRoom)
El modelo de sala ya existe en `server/rooms/gameRoom.js`. Se expondrá a través de la API:

```javascript
{
  id: string,           // Unique room ID
  codigo: string,       // 6-char room code
  tipo: 'publica' | 'privada',
  estado: 'esperando' | 'jugando',
  jugadores: Map<string, {id, nombre, listo}>,
  maxJugadores: number,
  creadaEn: Date
}
```

### Kick Event
Cuando un jugador es expulsado, el servidor enviará un mensaje WebSocket antes de cerrar la conexión:

```javascript
{
  type: 'kicked',
  data: {
    reason: string,
    kickedBy: 'admin'
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. 
Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Room list completeness
*For any* set of active rooms in the RoomManager, the API response SHALL include all rooms with their IDs, codes, accurate player counts, and correct states (esperando/jugando).
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Room detail accuracy
*For any* room ID that exists in the RoomManager, the detail endpoint SHALL return the complete list of players (with name and ID), room type (public/private), and creation timestamp.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 3: Kick removes player from room
*For any* valid kick request (existing room and player), after the kick operation completes, the player SHALL no longer appear in the room's player list.
**Validates: Requirements 3.2**

### Property 4: Kick notifies player
*For any* successful kick operation, the kicked player's WebSocket connection SHALL receive a 'kicked' message before disconnection.
**Validates: Requirements 3.3**

## Error Handling

### API Errors
| Error | HTTP Code | Message |
|-------|-----------|---------|
| Room not found | 404 | "Sala no encontrada" |
| Player not in room | 404 | "Jugador no encontrado en la sala" |
| Invalid room ID | 400 | "ID de sala inválido" |
| Server communication error | 500 | "Error de comunicación con servidor de juego" |

### Frontend Error Handling
- Mostrar toast de error cuando falla una operación
- Reintentar polling si falla la conexión (máximo 3 intentos)
- Mostrar estado "desconectado" si el servidor no responde

## Testing Strategy

### Property-Based Testing
Se utilizará **fast-check** para property-based testing en JavaScript.

Cada test de propiedad debe:
- Ejecutar mínimo 100 iteraciones
- Estar etiquetado con el formato: `**Feature: admin-room-management, Property {number}: {property_text}**`

### Unit Tests
- Test de endpoints API con mocks del RoomManager
- Test de funciones de renderizado del frontend
- Test de lógica de kick (verificar que se cierra conexión correctamente)

### Integration Tests
- Test end-to-end: crear sala → añadir jugador → kick → verificar que jugador fue removido
- Test de polling: verificar que la UI se actualiza cuando cambia el estado de las salas
