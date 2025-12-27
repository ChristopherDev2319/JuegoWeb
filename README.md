# Juego FPS Three.js

Un juego de disparos en primera persona desarrollado con Three.js.

## Descripción

Juego FPS con mecánicas de disparo, sistema de dash y enemigos con IA básica. El proyecto utiliza una arquitectura modular con ES Modules para facilitar el mantenimiento y escalabilidad.

## Controles

| Tecla | Acción |
|-------|--------|
| W | Mover adelante |
| A | Mover izquierda |
| S | Mover atrás |
| D | Mover derecha |
| Espacio | Saltar |
| Shift | Dash |
| Click izquierdo | Disparar |
| R | Recargar |
| Mouse | Apuntar |

## Instrucciones de Uso

1. Abre `index.html` en un navegador web moderno
2. Haz clic en la pantalla para activar los controles del mouse (pointer lock)
3. Usa WASD para moverte y el mouse para apuntar
4. Dispara a los enemigos y usa el dash para esquivar

## Estructura del Proyecto

```
proyecto/
├── index.html          # Archivo principal HTML
├── css/
│   └── estilos.css     # Estilos del juego
├── src/
│   ├── main.js         # Punto de entrada
│   ├── config.js       # Configuración
│   ├── escena.js       # Escena Three.js
│   ├── entidades/      # Clases de entidades
│   ├── sistemas/       # Sistemas del juego
│   └── utils/          # Utilidades
└── modelos/            # Modelos 3D
```

## Requisitos

- Navegador web moderno con soporte para ES Modules
- WebGL habilitado
