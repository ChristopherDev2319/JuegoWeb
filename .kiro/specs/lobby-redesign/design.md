# Documento de Diseño - Rediseño Visual del Lobby

## Visión General

Este documento describe el diseño técnico para transformar el lobby actual del juego FPS Arena de un contenedor centrado oscuro a una interfaz de pantalla completa con colores claros y modernos. El rediseño mantiene toda la funcionalidad existente mientras mejora significativamente la experiencia visual.

## Arquitectura

### Estructura de Archivos Afectados

```
css/
└── estilos.css          # Estilos principales (modificar sección LOBBY STYLES)

index.html               # Sin cambios estructurales, solo CSS
src/lobby/lobbyUI.js     # Sin cambios, la lógica permanece igual
```

### Enfoque de Implementación

El rediseño es puramente CSS. No se requieren cambios en JavaScript ni en la estructura HTML existente. Esto garantiza:
- Cero riesgo de romper funcionalidad existente
- Fácil reversión si es necesario
- Mantenimiento simplificado

## Componentes e Interfaces

### 1. Layout de Pantalla Completa

```
┌─────────────────────────────────────────────────────────────┐
│                     FONDO GRADIENTE CLARO                    │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │                     │    │                             │ │
│  │   PANEL IZQUIERDO   │    │      PANEL DERECHO          │ │
│  │   - Logo/Título     │    │      - Contenido dinámico   │ │
│  │   - Estadísticas    │    │      - Botones de acción    │ │
│  │   - Info jugador    │    │      - Formularios          │ │
│  │                     │    │                             │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Paleta de Colores Clara

| Elemento | Color Actual | Color Nuevo | Código |
|----------|-------------|-------------|--------|
| Fondo principal | #1a1a2e → #0f3460 | Gradiente claro | #f0f4f8 → #e2e8f0 |
| Contenedores | rgba(25,25,45,0.95) | Blanco semi-transparente | rgba(255,255,255,0.95) |
| Texto principal | #ffffff | Gris oscuro | #1a202c |
| Texto secundario | rgba(255,255,255,0.5) | Gris medio | #718096 |
| Acento primario | #4facfe | Azul moderno | #4299e1 |
| Acento secundario | #00f2fe | Verde menta | #48bb78 |
| Botón primario | rgba(79,172,254,0.25) | Azul sólido | #4299e1 |
| Botón secundario | rgba(255,255,255,0.06) | Gris claro | #edf2f7 |
| Error | #ff6b6b | Rojo suave | #fc8181 |
| Borde | rgba(255,255,255,0.1) | Gris claro | #e2e8f0 |

### 3. Componentes Visuales

#### Contenedor Principal (.lobby-container)
- Fondo: blanco con opacidad 0.95
- Borde-radius: 24px
- Sombra: 0 25px 50px rgba(0,0,0,0.1)
- Padding: 40px
- Ancho máximo: 500px por panel

#### Botones (.lobby-btn)
- Fondo: gradiente suave o color sólido
- Borde-radius: 16px
- Sombra: 0 4px 15px rgba(0,0,0,0.1)
- Transición: all 0.3s ease
- Hover: elevación con sombra más pronunciada

#### Inputs
- Fondo: #f7fafc
- Borde: 2px solid #e2e8f0
- Borde-radius: 12px
- Focus: borde azul #4299e1, sombra azul suave

#### Estadísticas (.lobby-stats)
- Tarjetas individuales con fondo blanco
- Iconos con colores de acento
- Valores en tamaño grande (32px)
- Etiquetas en gris medio (12px)

## Modelos de Datos

No aplica - Este rediseño es puramente visual y no afecta modelos de datos.



## Propiedades de Correctitud

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema - esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre especificaciones legibles por humanos y garantías de correctitud verificables por máquina.*

### Análisis de Testabilidad

Este rediseño es **puramente visual** y consiste únicamente en cambios de CSS. Todos los criterios de aceptación se refieren a:
- Colores y gradientes
- Layouts y distribución de elementos
- Estilos de hover y focus
- Animaciones y transiciones
- Tipografía y espaciado

**No hay propiedades lógicas testeables** porque:
1. No hay cambios en la lógica de JavaScript
2. No hay transformaciones de datos
3. No hay parsing ni serialización
4. No hay operaciones que puedan verificarse con property-based testing

La verificación de estos requisitos se realiza mediante:
- Revisión visual manual
- Tests de snapshot (opcional)
- Herramientas de accesibilidad para contraste de colores

## Manejo de Errores

No aplica - Los cambios son puramente CSS y no introducen nuevos puntos de fallo.

## Estrategia de Testing

### Verificación Visual

Dado que este es un rediseño puramente CSS, la estrategia de testing se basa en:

1. **Revisión Visual Manual**
   - Verificar que los colores coincidan con la paleta definida
   - Confirmar que el layout de dos columnas funciona en pantallas grandes
   - Verificar responsive design en viewports < 768px
   - Probar transiciones y animaciones

2. **Checklist de Verificación**
   - [ ] Fondo gradiente claro visible
   - [ ] Contenedores con fondo blanco/semi-transparente
   - [ ] Texto principal en color oscuro legible
   - [ ] Botones con hover y active states funcionando
   - [ ] Inputs con focus state visible
   - [ ] Transiciones suaves entre pantallas
   - [ ] Layout responsive funcionando

3. **Herramientas de Accesibilidad**
   - Verificar contraste de colores con herramientas como Lighthouse
   - Asegurar que el texto sea legible sobre fondos claros

### No se requieren tests automatizados

Este rediseño no requiere property-based testing ni unit tests porque:
- No hay lógica de negocio modificada
- No hay funciones JavaScript nuevas o modificadas
- Los cambios son exclusivamente de presentación visual
