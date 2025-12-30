# Documento de Requisitos

## Introducción

Este documento define los requisitos para eliminar la duplicación de valores entre los archivos de configuración del cliente (`src/config.js`) y del servidor (`server/config.js`). Actualmente, valores críticos como daño, cadencia de disparo, munición y otros parámetros de armas están duplicados en ambos archivos, lo que genera problemas de mantenimiento y riesgo de inconsistencias.

La regla de oro es: **"El servidor manda, el cliente refleja"**. El servidor es la fuente de verdad para todos los valores que afectan la lógica del juego (daño, cadencia real, etc.), mientras que el cliente solo mantiene configuración visual y de presentación.

## Glosario

- **Sistema**: El proyecto del juego FPS multijugador con Three.js
- **Servidor**: Componente Node.js que ejecuta la lógica autoritativa del juego
- **Cliente**: Aplicación web que renderiza el juego y envía inputs al servidor
- **Configuración Autoritativa**: Valores que solo el servidor conoce y controla (daño, cadencia real, etc.)
- **Configuración Visual**: Valores que el cliente necesita para renderizado (modelos, posiciones, retroceso visual, etc.)

## Requisitos

### Requisito 1

**Historia de Usuario:** Como desarrollador, quiero que el servidor sea la única fuente de verdad para valores de gameplay, para evitar inconsistencias y trampas.

#### Criterios de Aceptación

1. CUANDO se define el daño de un arma ENTONCES el Sistema DEBERÁ mantener ese valor únicamente en `server/config.js`
2. CUANDO se define la cadencia de disparo real ENTONCES el Sistema DEBERÁ mantener ese valor únicamente en `server/config.js`
3. CUANDO se define el multiplicador de headshot ENTONCES el Sistema DEBERÁ mantener ese valor únicamente en `server/config.js`
4. CUANDO se define la velocidad de bala para cálculos de hit ENTONCES el Sistema DEBERÁ mantener ese valor únicamente en `server/config.js`

### Requisito 2

**Historia de Usuario:** Como desarrollador, quiero que el cliente solo tenga configuración visual y de presentación, para que no pueda manipular valores de gameplay.

#### Criterios de Aceptación

1. CUANDO el cliente necesita mostrar un arma ENTONCES el Sistema DEBERÁ usar configuración local para modelo 3D, posición y rotación
2. CUANDO el cliente necesita mostrar retroceso visual ENTONCES el Sistema DEBERÁ usar configuración local para animación de retroceso
3. CUANDO el cliente necesita mostrar el apuntado ENTONCES el Sistema DEBERÁ usar configuración local para zoom, posición de arma y transiciones
4. CUANDO el cliente necesita mostrar la UI de munición ENTONCES el Sistema DEBERÁ recibir los valores actuales desde el servidor

### Requisito 3

**Historia de Usuario:** Como desarrollador, quiero eliminar toda duplicación de valores entre cliente y servidor, para facilitar el mantenimiento.

#### Criterios de Aceptación

1. CUANDO se modifica el daño de un arma ENTONCES el Sistema DEBERÁ requerir cambio en un solo archivo
2. CUANDO se modifica la cadencia de disparo ENTONCES el Sistema DEBERÁ requerir cambio en un solo archivo
3. CUANDO se modifica el tamaño de cargador ENTONCES el Sistema DEBERÁ requerir cambio en un solo archivo
4. CUANDO se revisa el código ENTONCES el Sistema DEBERÁ tener cero valores duplicados entre `src/config.js` y `server/config.js`

### Requisito 4

**Historia de Usuario:** Como desarrollador, quiero que el cliente reciba confirmaciones del servidor para acciones de gameplay, para mantener la integridad del juego.

#### Criterios de Aceptación

1. CUANDO el jugador dispara ENTONCES el Sistema DEBERÁ enviar el input al servidor y esperar confirmación de hit
2. CUANDO el jugador recarga ENTONCES el Sistema DEBERÁ recibir del servidor el estado actualizado de munición
3. CUANDO el jugador cambia de arma ENTONCES el Sistema DEBERÁ sincronizar el estado con el servidor
4. CUANDO el servidor procesa un disparo ENTONCES el Sistema DEBERÁ usar exclusivamente los valores de `server/config.js`

### Requisito 5

**Historia de Usuario:** Como desarrollador, quiero mantener la configuración en español y bien documentada, para facilitar la comprensión del código.

#### Criterios de Aceptación

1. CUANDO se lee la configuración del cliente ENTONCES el Sistema DEBERÁ tener nombres de propiedades en español
2. CUANDO se lee la configuración del servidor ENTONCES el Sistema DEBERÁ tener comentarios explicativos en español
3. CUANDO se añade una nueva arma ENTONCES el Sistema DEBERÁ seguir el mismo patrón de nomenclatura existente
