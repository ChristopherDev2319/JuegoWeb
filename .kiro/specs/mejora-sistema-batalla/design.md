# Documento de Diseño - Mejora del Sistema de Batalla

## Visión General

Este diseño detalla las mejoras al sistema de batalla del juego FPS, incluyendo optimización de velocidad de balas, balanceo de armas, implementación del cuchillo como arma cuerpo a cuerpo, sistema de spawns de munición, y mejoras al sistema de dash para respetar colisiones.

## Arquitectura

```mermaid
graph TB
    subgraph "Sistema de Batalla"
        CONFIG[config.js<br/>Configuración de Armas]
        ARMAS[armas.js<br/>Sistema de Armas]
        BULLET[bulletSystem.js<br/>Sistema de Balas]
        DASH[dash.js<br/>Sistema de Dash]
        COLISIONES[colisiones.js<br/>Sistema de Colisiones]
    end
    
    subgraph "Nuevos Componentes"
        KNIFE[Knife System<br/>Ataque Cuerpo a Cuerpo]
        AMMO_SPAWN[AmmoSpawn System<br/>Spawns de Munición]
    end
    
    CONFIG --> ARMAS
    CONFIG --> BULLET
    CONFIG --> DASH
    ARMAS --> KNIFE
    ARMAS --> AMMO_SPAWN
    DASH --> COLISIONES
    BULLET --> COLISIONES
end
```

## Componentes e Interfaces

### 1. Configuración de Armas Actualizada (config.js)

Modificaciones a la configuración existente:
- Incrementar `velocidadBala` en 50% para todas las armas
- Sniper: `velocidadBala: 120`, `daño: 150`, `municionTotal: 10`, `tamañoCargador: 1`
- Rifles (M4A1, AK47): `municionTotal: 210`
- Subfusiles (MP5): `municionTotal: 240`
- Escopeta: `tamañoCargador: 3`
- Eliminar configuración de SCAR
- Agregar configuración del cuchillo (KNIFE)


### 2. Sistema de Cuchillo (Knife)

```javascript
// Nueva configuración en CONFIG.armas
"KNIFE": {
  nombre: "Knife",
  descripcion: "Cuchillo táctico para combate cuerpo a cuerpo",
  tipo: "melee",
  daño: 30,
  rangoAtaque: 2,           // Unidades de distancia
  cadenciaAtaque: 500,      // ms entre ataques
  modelo: "modelos/valorants_knife_low_poly.glb",
  animacionAtaque: "modelos/animaciones/knife_attack_tps.glb",
  posicion: { x: 0.3, y: -0.3, z: -0.3 },
  rotacion: { x: 0, y: Math.PI / 2, z: 0 }
}
```

**Interfaz de ataque melee:**
```javascript
function atacarConCuchillo(camera, enemigos, scene, onImpacto)
// Retorna: { impacto: boolean, enemigosGolpeados: Array }
```

### 3. Sistema de Spawns de Munición

```javascript
// Nueva configuración en CONFIG
spawnsAmmo: {
  porcentajeMunicion: 0.35,    // 35% de munición máxima
  tiempoRecarga: 10000,        // 10 segundos en ms
  modelo: "modelos/low-poly_ammo_can.glb",
  escala: 0.5,
  radioRecoleccion: 1.5,       // Distancia para recoger
  posiciones: [
    { x: 10, y: 0.5, z: 10 },
    { x: -10, y: 0.5, z: 10 },
    { x: 10, y: 0.5, z: -10 },
    { x: -10, y: 0.5, z: -10 },
    { x: 0, y: 0.5, z: 20 },
    { x: 0, y: 0.5, z: -20 }
  ]
}
```

**Clase AmmoSpawn:**
```javascript
class AmmoSpawn {
  constructor(scene, posicion, config)
  recoger(jugador)           // Otorga munición al jugador
  actualizar(deltaTime)      // Actualiza timer de recarga
  estaActivo()               // Retorna si el spawn está disponible
}
```


### 4. Sistema de Dash Mejorado

Modificar `ejecutarDash()` y `ejecutarDashInterpolado()` para:
- Usar `shapeCastDash()` que detecta colisiones en el trayecto
- Detener el dash en el punto de colisión más cercano
- NO atravesar estructuras bajo ninguna circunstancia
- Eliminar la lógica de "extensión automática" que permite atravesar

**Cambios en dash.js:**
```javascript
// Eliminar: calcularPosicionFinalConExtension()
// Modificar: ejecutarDashInterpolado() para usar shapeCastDash directamente
// El dash termina donde hay colisión, sin extensión
```

## Modelos de Datos

### Configuración de Arma Actualizada
```javascript
{
  nombre: string,
  tipo: "rifle" | "pistola" | "francotirador" | "escopeta" | "subfusil" | "melee",
  daño: number,
  velocidadBala: number,      // Incrementado 50%
  tamañoCargador: number,
  municionTotal: number,
  // ... resto de propiedades existentes
}
```

### Estado de Spawn de Munición
```javascript
{
  id: string,
  posicion: { x: number, y: number, z: number },
  activo: boolean,
  tiempoDesactivacion: number,
  modelo: THREE.Object3D
}
```


## Propiedades de Correctitud

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de correctitud verificables por máquina.*

### Propiedad 1: Incremento de velocidad de balas
*Para cualquier* arma en el sistema (excepto melee), la velocidad de bala configurada debe ser al menos 1.5 veces mayor que la velocidad original base definida.
**Valida: Requisito 1.1**

### Propiedad 2: Dash no atraviesa estructuras
*Para cualquier* posición inicial válida y dirección de dash, la posición final del jugador después del dash debe estar fuera de cualquier geometría de colisión del mapa.
**Valida: Requisito 3.1**

### Propiedad 3: Cuchillo siempre puede atacar
*Para cualquier* estado del juego donde el jugador tiene el cuchillo equipado, el sistema debe permitir ejecutar un ataque sin requerir munición.
**Valida: Requisito 4.4**

### Propiedad 4: Detección de rango del cuchillo
*Para cualquier* enemigo posicionado a una distancia D del jugador, el ataque del cuchillo debe impactar si y solo si D <= 2 unidades.
**Valida: Requisito 4.5**


### Propiedad 5: Cálculo de munición de spawn
*Para cualquier* arma equipada por el jugador, la munición otorgada por un spawn debe ser exactamente el 35% (redondeado) de la munición máxima de esa arma.
**Valida: Requisito 5.1**

### Propiedad 6: Munición de rifles
*Para cualquier* arma de tipo "rifle" (M4A1, AK47), la munición máxima configurada debe ser exactamente 210 balas.
**Valida: Requisito 6.1**

### Propiedad 7: Round-trip de configuración de armas
*Para cualquier* configuración de arma válida, serializar a JSON y luego deserializar debe producir una configuración equivalente a la original.
**Valida: Requisitos 7.1, 7.2**

## Manejo de Errores

| Escenario | Manejo |
|-----------|--------|
| Modelo de cuchillo no carga | Usar modelo placeholder, log de error |
| Modelo de ammo spawn no carga | Usar geometría básica (caja), log de error |
| Spawn de munición en posición inválida | Ajustar a posición válida más cercana |
| Ataque de cuchillo sin enemigos en rango | No aplicar daño, continuar normalmente |
| Jugador intenta recoger spawn inactivo | Ignorar interacción |

## Estrategia de Testing

### Testing Unitario
- Verificar valores de configuración de armas actualizados
- Verificar cálculo de munición de spawn (35%)
- Verificar detección de rango del cuchillo
- Verificar que SCAR fue eliminada de la configuración


### Testing Basado en Propiedades

Se utilizará **fast-check** como librería de property-based testing para JavaScript.

Cada test de propiedad debe:
- Ejecutar mínimo 100 iteraciones
- Estar etiquetado con el formato: `**Feature: mejora-sistema-batalla, Property {number}: {property_text}**`
- Referenciar el requisito que valida

**Tests de Propiedad a Implementar:**

1. **Velocidad de balas incrementada**: Generar armas aleatorias, verificar velocidadBala >= velocidadOriginal * 1.5
2. **Dash respeta colisiones**: Generar posiciones y direcciones, verificar posición final fuera de geometría
3. **Cuchillo sin munición**: Verificar que el cuchillo siempre puede atacar independiente del estado
4. **Rango del cuchillo**: Generar enemigos a distancias aleatorias, verificar detección correcta
5. **Munición de spawn**: Generar armas, verificar munición = Math.round(municionMaxima * 0.35)
6. **Rifles con 210 balas**: Verificar que M4A1 y AK47 tienen municionTotal = 210
7. **Round-trip configuración**: Serializar/deserializar configuraciones, verificar igualdad

### Configuración de fast-check

```javascript
import fc from 'fast-check';

// Configuración base para todos los tests
const fcConfig = {
  numRuns: 100,
  verbose: true
};
```
