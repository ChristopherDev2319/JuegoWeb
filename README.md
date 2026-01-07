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
├── index.html              # Archivo principal HTML
├── configuracion-juego.js  # Configuración global del juego
├── servidor-local.js       # Servidor de desarrollo local
├── public/                 # Recursos estáticos
│   ├── css/               # Estilos
│   ├── logo/              # Logo del juego
│   ├── modelos/           # Modelos 3D y animaciones
│   ├── sonidos/           # Efectos de sonido
│   └── pages/             # Páginas secundarias (admin, config)
├── src/                    # Código fuente del cliente
│   ├── main.js            # Punto de entrada
│   ├── config.js          # Configuración del juego
│   ├── escena.js          # Escena Three.js
│   ├── entidades/         # Clases de entidades (jugador, bots, etc.)
│   ├── sistemas/          # Sistemas del juego (armas, colisiones, etc.)
│   ├── lobby/             # Sistema de lobby
│   ├── network/           # Comunicación con servidor
│   ├── ui/                # Componentes de interfaz
│   └── utils/             # Utilidades
├── server/                 # Servidor de juego (WebSocket)
└── backend/                # API REST (autenticación, stats)
```

## Requisitos

- Navegador web moderno con soporte para ES Modules
- WebGL habilitado
