# Documento de Requisitos

## Introducción

Este documento define los requisitos para reestructurar un juego FPS desarrollado con Three.js. El código actual está contenido en un único archivo HTML (~900 líneas) y necesita ser dividido en módulos organizados siguiendo buenas prácticas de desarrollo. Además, se configurará un repositorio Git para control de versiones.

## Glosario

- **Sistema**: El proyecto del juego FPS en Three.js
- **Módulo**: Archivo JavaScript independiente con responsabilidad específica
- **ES Modules**: Sistema de módulos nativo de JavaScript (import/export)
- **Repositorio Git**: Sistema de control de versiones para el proyecto

## Requisitos

### Requisito 1

**Historia de Usuario:** Como desarrollador, quiero que el código esté dividido en módulos separados, para que sea más fácil de mantener y escalar.

#### Criterios de Aceptación

1. CUANDO el sistema se inicializa ENTONCES el Sistema DEBERÁ cargar todos los módulos JavaScript desde archivos separados usando ES Modules
2. CUANDO se modifica un componente del juego ENTONCES el Sistema DEBERÁ permitir editar solo el archivo correspondiente sin afectar otros módulos
3. CUANDO se añade nueva funcionalidad ENTONCES el Sistema DEBERÁ permitir crear nuevos módulos sin modificar la estructura existente

### Requisito 2

**Historia de Usuario:** Como desarrollador, quiero una estructura de carpetas organizada, para que pueda encontrar fácilmente cada componente del proyecto.

#### Criterios de Aceptación

1. CUANDO se busca código relacionado con entidades del juego ENTONCES el Sistema DEBERÁ tener una carpeta `src/entidades/` con clases de Enemigo, Jugador y Bala
2. CUANDO se busca código de sistemas del juego ENTONCES el Sistema DEBERÁ tener una carpeta `src/sistemas/` con módulos de Armas, Dash y Controles
3. CUANDO se busca código de utilidades ENTONCES el Sistema DEBERÁ tener una carpeta `src/utils/` con funciones auxiliares y efectos visuales
4. CUANDO se busca la configuración del juego ENTONCES el Sistema DEBERÁ tener un archivo `src/config.js` con todas las constantes configurables
5. CUANDO se busca el punto de entrada ENTONCES el Sistema DEBERÁ tener un archivo `src/main.js` que inicializa el juego

### Requisito 3

**Historia de Usuario:** Como desarrollador, quiero que los estilos CSS estén separados del HTML, para mantener una separación clara de responsabilidades.

#### Criterios de Aceptación

1. CUANDO se carga la página ENTONCES el Sistema DEBERÁ cargar los estilos desde un archivo `css/estilos.css` externo
2. CUANDO se modifica la apariencia visual ENTONCES el Sistema DEBERÁ permitir editar solo el archivo CSS sin tocar el HTML

### Requisito 4

**Historia de Usuario:** Como desarrollador, quiero tener un repositorio Git configurado, para poder versionar el código y subirlo a GitHub.

#### Criterios de Aceptación

1. CUANDO se inicializa el proyecto ENTONCES el Sistema DEBERÁ tener un repositorio Git inicializado con `git init`
2. CUANDO se revisa el repositorio ENTONCES el Sistema DEBERÁ tener un archivo `.gitignore` que excluya archivos innecesarios
3. CUANDO se revisa el repositorio ENTONCES el Sistema DEBERÁ tener un archivo `README.md` con instrucciones del proyecto

### Requisito 5

**Historia de Usuario:** Como desarrollador, quiero que el juego funcione igual después de la reestructuración, para asegurar que no se pierda funcionalidad.

#### Criterios de Aceptación

1. CUANDO el jugador dispara ENTONCES el Sistema DEBERÁ crear balas y detectar colisiones con enemigos igual que antes
2. CUANDO el jugador usa dash ENTONCES el Sistema DEBERÁ aplicar el impulso y gestionar las cargas correctamente
3. CUANDO un enemigo muere ENTONCES el Sistema DEBERÁ mostrar la animación de muerte y reaparecer después del tiempo configurado
4. CUANDO el jugador se mueve ENTONCES el Sistema DEBERÁ responder a los controles WASD y mouse igual que antes
