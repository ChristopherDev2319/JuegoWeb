# Design Document: Sistema de Bots de Entrenamiento

## Overview

El sistema de bots de entrenamiento proporciona entidades controladas por IA para el modo local del juego FPS. El sistema incluye tres tipos de bots: estáticos (para práctica de puntería), móviles (para tracking) y tiradores (para práctica de reacción). Los bots se organizan en zonas específicas del mapa y proporcionan feedback visual y estadísticas al jugador.

## Architecture

```mermaid
graph TB
    subgraph "Sistema de Bots"
        BM[BotManager] --> BS[BotStatico]
        BM --> BMov[BotMovil]
        BM --> BT[BotTirador]
        BM --> ZE[ZonasEntrenamiento]
        BM --> EST[EstadisticasEntrenamiento]
    end
    
    subgraph "Entidades Base"
        BB[BotBase] --> BS
        BB --> BMov
        BB --> BT
    end
    
    subgraph "Sistemas Existentes"
        MAIN[main.js] --> BM
        BALAS[bulletSystem] --> BB
        JUGADOR[Jugador] --> BT
    end
    
    subgraph "UI"
        EST --> UI[UI Estadísticas]
        BB --> BV[Barra Vida Bot]
    end
```

## Components and Interfaces

### BotBase (Clase Base)

Clase abstracta que define la funcionalidad común para todos los tipos de bots.

```javascript
class BotBase {
  constructor(scene, config) {
    this.scene = scene;
    this.mesh = null;
    this.tipo = 'base';
    this.color = 0xffffff;
    this.datos = {
      vidaMaxima: 100,
      vidaActual: 100,
      estaVivo: true,
      tiempoRespawn: 5000,
      tiempoMuerte: 0
    };
    this.posicionInicial = { x: 0, y: 0, z: 0 };
  }
  
  // Métodos comunes
  recibirDaño(cantidad): void
  morir(): void
  reaparecer(): void
  actualizar(deltaTime): void
  crearBarraVida(): void
  actualizarBarraVida(): void
  estaVivo(): boolean
  obtenerPosicion(): Vector3
}
```

### BotEstatico

Bot que permanece inmóvil para práctica de puntería.

```javascript
class BotEstatico extends BotBase {
  constructor(scene, x, y, z) {
    super(scene, { tipo: 'estatico', color: 0xff0000 });
    // Posición fija, sin movimiento
  }
  
  actualizar(deltaTime): void // Solo verifica respawn
}
```

### BotMovil

Bot que se mueve en patrones predefinidos.

```javascript
class BotMovil extends BotBase {
  constructor(scene, x, y, z, config) {
    super(scene, { tipo: 'movil', color: 0x0088ff });
    this.rangoMovimiento = config.rango || 8;
    this.velocidad = config.velocidad || 2;
    this.direccion = 1;
  }
  
  actualizar(deltaTime): void // Movimiento lateral + respawn
  invertirDireccion(): void
}
```

### BotTirador

Bot que dispara al jugador cuando está en línea de visión.

```javascript
class BotTirador extends BotBase {
  constructor(scene, x, y, z, config) {
    super(scene, { tipo: 'tirador', color: 0xff8800 });
    this.cadenciaDisparo = config.cadencia || 1000; // ms entre disparos
    this.dañoReducido = config.daño || 10; // Daño de entrenamiento
    this.rangoVision = config.rango || 30;
    this.ultimoDisparo = 0;
    this.jugadorEnVision = false;
  }
  
  actualizar(deltaTime, jugadorPos): void
  verificarLineaVision(jugadorPos): boolean
  disparar(jugadorPos): void
}
```

### BotManager

Gestor central que coordina todos los bots y zonas.

```javascript
class BotManager {
  constructor(scene) {
    this.scene = scene;
    this.bots = {
      estaticos: [],
      moviles: [],
      tiradores: []
    };
    this.zonas = [];
    this.estadisticas = new EstadisticasEntrenamiento();
    this.activo = false;
  }
  
  inicializar(): void
  crearZonas(): void
  crearBotsEnZona(zona, tipo, cantidad): void
  actualizar(deltaTime, jugadorPos): void
  registrarEliminacion(tipoBot): void
  registrarImpactoRecibido(): void
  obtenerEstadisticas(): Object
  destruir(): void
}
```

### ZonaEntrenamiento

Define un área del mapa para un tipo específico de bots.

```javascript
class ZonaEntrenamiento {
  constructor(config) {
    this.nombre = config.nombre;
    this.tipo = config.tipo; // 'estatico' | 'movil' | 'tirador'
    this.centro = config.centro; // Vector3
    this.radio = config.radio;
    this.activa = false;
  }
  
  contienePunto(punto): boolean
  activar(): void
  desactivar(): void
}
```

### EstadisticasEntrenamiento

Rastrea el progreso del jugador.

```javascript
class EstadisticasEntrenamiento {
  constructor() {
    this.eliminaciones = { estaticos: 0, moviles: 0, tiradores: 0 };
    this.impactosRecibidos = 0;
    this.disparosRealizados = 0;
    this.impactosAcertados = 0;
  }
  
  registrarEliminacion(tipo): void
  registrarImpactoRecibido(): void
  registrarDisparo(): void
  registrarAcierto(): void
  obtenerPrecision(): number
  reiniciar(): void
}
```

## Data Models

### Configuración de Bots

```javascript
// Agregar a CONFIG en src/config.js
botsEntrenamiento: {
  estatico: {
    vida: 100,
    tiempoRespawn: 3000,
    color: 0xff0000 // Rojo
  },
  movil: {
    vida: 100,
    tiempoRespawn: 3000,
    color: 0x0088ff, // Azul
    velocidad: 2,
    rangoMovimiento: 8
  },
  tirador: {
    vida: 150,
    tiempoRespawn: 5000,
    color: 0xff8800, // Naranja
    cadenciaDisparo: 1500,
    dañoReducido: 10,
    rangoVision: 30
  },
  zonas: {
    estaticos: { centro: { x: -20, y: 1, z: 0 }, radio: 15 },
    moviles: { centro: { x: 20, y: 1, z: 0 }, radio: 15 },
    tiradores: { centro: { x: 0, y: 1, z: -30 }, radio: 15 }
  }
}
```

### Estado de Bot

```javascript
{
  id: string,
  tipo: 'estatico' | 'movil' | 'tirador',
  posicion: { x: number, y: number, z: number },
  posicionInicial: { x: number, y: number, z: number },
  vida: number,
  vidaMaxima: number,
  estaVivo: boolean,
  tiempoMuerte: number | null,
  // Solo para móviles
  direccion?: 1 | -1,
  velocidad?: number,
  // Solo para tiradores
  ultimoDisparo?: number,
  jugadorEnVision?: boolean
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Inicialización correcta del sistema de bots

*For any* inicialización del modo local, el BotManager SHALL crear bots de cada tipo en sus zonas correspondientes, donde cada bot estático está en la zona de estáticos, cada bot móvil está en la zona de móviles, y cada bot tirador está en la zona de tiradores.

**Validates: Requirements 1.1, 2.1, 4.1, 4.2, 4.3**

### Property 2: Daño reduce vida correctamente

*For any* bot con vida V > 0 y cualquier cantidad de daño D > 0, después de recibir daño, la vida del bot SHALL ser max(0, V - D).

**Validates: Requirements 1.2, 1.4**

### Property 3: Respawn restaura estado inicial

*For any* bot eliminado, después del tiempo de respawn, el bot SHALL reaparecer en su posición inicial con vida completa (vidaActual === vidaMaxima) y estado vivo (estaVivo === true).

**Validates: Requirements 1.3, 2.4, 3.5**

### Property 4: Movimiento lateral dentro de rango

*For any* bot móvil con posición inicial X y rango R, en cualquier momento t, la posición X del bot SHALL estar en el intervalo [X - R, X + R].

**Validates: Requirements 2.2, 2.3**

### Property 5: Línea de visión determina disparo

*For any* bot tirador y posición del jugador, el bot SHALL disparar si y solo si el jugador está dentro del rango de visión Y no hay obstrucciones entre el bot y el jugador.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Daño de bot tirador es reducido

*For any* disparo de bot tirador que impacta al jugador, el daño aplicado SHALL ser igual al dañoReducido configurado (menor que el daño normal de armas).

**Validates: Requirements 3.4**

### Property 7: Contador de eliminaciones incrementa correctamente

*For any* eliminación de bot de tipo T, el contador de eliminaciones para el tipo T SHALL incrementar en exactamente 1.

**Validates: Requirements 6.2**

### Property 8: Colores distintivos por tipo

*For any* bot creado, el color del material del mesh SHALL corresponder al color configurado para su tipo (rojo para estático, azul para móvil, naranja para tirador).

**Validates: Requirements 5.1, 5.2, 5.3**

## Error Handling

| Escenario | Manejo |
|-----------|--------|
| Posición de spawn inválida | Usar posición por defecto del centro de zona |
| Bot fuera de límites del mapa | Reposicionar al centro de su zona |
| Raycast de línea de visión falla | Asumir sin obstrucción |
| Jugador no disponible para bot tirador | Desactivar disparos temporalmente |
| Memoria insuficiente para crear bots | Reducir cantidad de bots y mostrar advertencia |

## Testing Strategy

### Unit Tests

- Verificar creación correcta de cada tipo de bot
- Verificar cálculo de daño y reducción de vida
- Verificar lógica de respawn
- Verificar movimiento lateral de bots móviles
- Verificar detección de línea de visión

### Property-Based Tests

Se utilizará **fast-check** como biblioteca de property-based testing para JavaScript.

Cada test de propiedad debe:
- Ejecutar un mínimo de 100 iteraciones
- Estar etiquetado con el formato: `**Feature: bots-entrenamiento, Property {number}: {property_text}**`
- Implementar exactamente una propiedad del documento de diseño

Tests a implementar:
1. Property 1: Generador de configuraciones de zonas → verificar bots en zonas correctas
2. Property 2: Generador de (vida, daño) → verificar vida resultante
3. Property 3: Generador de bots eliminados → verificar estado post-respawn
4. Property 4: Generador de (posición inicial, rango, tiempo) → verificar posición dentro de rango
5. Property 5: Generador de (posición bot, posición jugador, obstrucciones) → verificar decisión de disparo
6. Property 6: Generador de impactos → verificar daño reducido
7. Property 7: Generador de secuencias de eliminaciones → verificar contadores
8. Property 8: Generador de tipos de bot → verificar colores

### Integration Tests

- Verificar integración con sistema de balas existente
- Verificar integración con UI de estadísticas
- Verificar comportamiento en modo local completo
