# Documento de Diseño

## Visión General

Este diseño describe la reestructuración de un juego FPS en Three.js desde un archivo HTML monolítico hacia una arquitectura modular usando ES Modules. La estructura seguirá el patrón de separación por responsabilidades, organizando el código en entidades, sistemas y utilidades.

## Arquitectura

```
proyecto/
├── index.html              # HTML mínimo con referencias a módulos
├── css/
│   └── estilos.css         # Estilos separados
├── src/
│   ├── main.js             # Punto de entrada principal
│   ├── config.js           # Configuración y constantes
│   ├── escena.js           # Configuración de Three.js (escena, cámara, renderer)
│   ├── entidades/
│   │   ├── Enemigo.js      # Clase Enemy
│   │   ├── Bala.js         # Clase Bullet
│   │   └── Jugador.js      # Objeto player y lógica de movimiento
│   ├── sistemas/
│   │   ├── armas.js        # Sistema de disparo y recarga
│   │   ├── dash.js         # Sistema de dash
│   │   └── controles.js    # Manejo de teclado y mouse
│   └── utils/
│       ├── efectos.js      # Efectos visuales (partículas, impactos)
│       └── ui.js           # Actualización de interfaz (munición, dash)
├── modelos/                # Modelos 3D existentes (sin cambios)
├── .gitignore
└── README.md
```

## Componentes e Interfaces

### 1. Módulo de Configuración (`src/config.js`)

Exporta todas las constantes configurables del juego:

```javascript
export const CONFIG = {
  jugador: {
    velocidad: 0.15,
    poderSalto: 0.25,
    alturaOjos: 1.7
  },
  arma: {
    nombre: "M4A1",
    cadenciaDisparo: 400,
    daño: 20,
    tamañoCargador: 30,
    municionTotal: 120,
    tiempoRecarga: 2.0,
    velocidadBala: 15.0
  },
  dash: {
    cargasMaximas: 3,
    tiempoRecarga: 3000,
    poder: 2.5,
    duracion: 200
  },
  enemigo: {
    vidaMaxima: 200,
    tiempoRespawn: 10000
  }
};
```

### 2. Módulo de Escena (`src/escena.js`)

Inicializa y exporta los objetos principales de Three.js:

```javascript
export const scene;      // THREE.Scene
export const camera;     // THREE.PerspectiveCamera
export const renderer;   // THREE.WebGLRenderer
export function inicializarEscena();
```

### 3. Entidad Enemigo (`src/entidades/Enemigo.js`)

```javascript
export class Enemigo {
  constructor(x, z, color);
  crearBarraVida();
  actualizarBarraVida();
  recibirDaño(cantidad);
  morir();
  reaparecer();
  actualizar();
}
```

### 4. Entidad Bala (`src/entidades/Bala.js`)

```javascript
export class Bala {
  constructor(posicion, direccion);
  crearDestelloDisparo(posicion);
  verificarColision(enemigos);
  alImpactar(enemigo);
  actualizar(deltaTime);
  destruir();
}
```

### 5. Módulo Jugador (`src/entidades/Jugador.js`)

```javascript
export const jugador;  // Estado del jugador
export function actualizarMovimiento(teclas, deltaTime);
export function aplicarGravedad();
```

### 6. Sistema de Armas (`src/sistemas/armas.js`)

```javascript
export const arma;     // Estado del arma
export function disparar(camera, enemigos, balas);
export function recargar();
export function animarRetroceso(modeloArma);
```

### 7. Sistema de Dash (`src/sistemas/dash.js`)

```javascript
export const sistemaDash;  // Estado del dash
export function ejecutarDash(jugador, teclas);
export function actualizarRecargaDash();
```

### 8. Sistema de Controles (`src/sistemas/controles.js`)

```javascript
export const teclas;   // Estado de teclas presionadas
export function inicializarControles(callbacks);
export function manejarMovimientoMouse(evento, jugador);
```

### 9. Utilidades de Efectos (`src/utils/efectos.js`)

```javascript
export function crearEfectoImpacto(posicion, scene);
export function crearEfectoDash(posicion, scene);
export function crearEfectoRespawn(posicion, scene);
```

### 10. Utilidades de UI (`src/utils/ui.js`)

```javascript
export function actualizarMunicion(arma);
export function actualizarCargasDash(sistemaDash);
export function mostrarIndicadorDaño(cantidad);
```

## Modelos de Datos

### Estado del Jugador
```javascript
{
  posicion: THREE.Vector3,
  velocidad: THREE.Vector3,
  rotacion: THREE.Euler,
  enSuelo: boolean
}
```

### Estado del Arma
```javascript
{
  municionActual: number,
  municionTotal: number,
  estaRecargando: boolean,
  puedeDisparar: boolean,
  ultimoDisparo: number
}
```

### Estado del Sistema Dash
```javascript
{
  cargasActuales: number,
  estaEnDash: boolean,
  cargasRecargando: boolean[],
  inicioRecarga: number[]
}
```

## Propiedades de Corrección

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema—esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de corrección verificables por máquina.*

### Propiedad 1: Disparo crea bala con dirección correcta
*Para cualquier* posición y orientación válida de la cámara, cuando se ejecuta un disparo, debe crearse una bala cuya dirección coincida con el vector forward de la cámara.
**Valida: Requisito 5.1**

### Propiedad 2: Dash consume exactamente una carga
*Para cualquier* estado del sistema dash con cargas > 0, ejecutar dash debe resultar en exactamente una carga menos y el jugador debe moverse en la dirección esperada.
**Valida: Requisito 5.2**

### Propiedad 3: Enemigo muerto programa respawn
*Para cualquier* enemigo que recibe daño suficiente para reducir su vida a 0 o menos, el enemigo debe marcarse como no vivo y su tiempo de muerte debe registrarse para el respawn.
**Valida: Requisito 5.3**

### Propiedad 4: Movimiento WASD produce desplazamiento correcto
*Para cualquier* combinación de teclas WASD presionadas y rotación del jugador, la posición del jugador debe cambiar en la dirección correspondiente relativa a su orientación.
**Valida: Requisito 5.4**

## Manejo de Errores

1. **Carga de módulos fallida**: Si un módulo no carga, mostrar error en consola y detener inicialización
2. **Modelo 3D no encontrado**: Si el modelo del arma no carga, continuar sin modelo visual
3. **Pérdida de pointer lock**: Pausar controles de disparo hasta recuperar el lock

## Estrategia de Testing

### Tests Unitarios
- Verificar que cada módulo exporta las funciones/clases esperadas
- Verificar que la configuración contiene todos los valores necesarios
- Verificar existencia de archivos en la estructura esperada

### Tests Basados en Propiedades
Se utilizará una librería de property-based testing (como fast-check para JavaScript) para verificar las propiedades de corrección:

1. **Propiedad 1**: Generar posiciones y rotaciones aleatorias de cámara, verificar que la bala creada tiene la dirección correcta
2. **Propiedad 2**: Generar estados aleatorios del sistema dash con cargas variables, verificar consumo correcto
3. **Propiedad 3**: Generar enemigos con vida aleatoria, aplicar daño aleatorio, verificar estado de muerte
4. **Propiedad 4**: Generar combinaciones aleatorias de teclas WASD, verificar dirección de movimiento

Cada test basado en propiedades debe ejecutar mínimo 100 iteraciones y estar etiquetado con el formato: `**Feature: reestructuracion-codigo, Property {número}: {descripción}**`

