# Plan de Implementación

- [x] 1. Configurar repositorio Git y estructura base
  - [x] 1.1 Inicializar repositorio Git con `git init`
    - Crear archivo `.gitignore` para excluir node_modules, .DS_Store, etc.
    - _Requisitos: 4.1, 4.2_
  - [x] 1.2 Crear archivo README.md con instrucciones del proyecto
    - Incluir descripción, controles del juego e instrucciones de uso
    - _Requisitos: 4.3_
  - [x] 1.3 Crear estructura de carpetas vacía
    - Crear carpetas: `src/`, `src/entidades/`, `src/sistemas/`, `src/utils/`, `css/`
    - _Requisitos: 2.1, 2.2, 2.3_

- [x] 2. Extraer configuración y estilos
  - [x] 2.1 Crear archivo `css/estilos.css` con todos los estilos
    - Mover todos los estilos del tag `<style>` al archivo CSS externo
    - _Requisitos: 3.1_
  - [x] 2.2 Crear archivo `src/config.js` con constantes del juego
    - Extraer configuración de jugador, arma, dash y enemigo
    - _Requisitos: 2.4_

- [x] 3. Crear módulo de escena Three.js
  - [x] 3.1 Crear archivo `src/escena.js`
    - Exportar scene, camera, renderer y función de inicialización
    - Incluir configuración de luces y suelo
    - _Requisitos: 1.1_

- [x] 4. Crear entidades del juego
  - [x] 4.1 Crear archivo `src/entidades/Enemigo.js`
    - Migrar clase Enemy completa con barra de vida y respawn
    - _Requisitos: 2.1, 5.3_
  - [ ]* 4.2 Escribir test de propiedad para muerte de enemigo
    - **Propiedad 3: Enemigo muerto programa respawn**
    - **Valida: Requisito 5.3**
  - [x] 4.3 Crear archivo `src/entidades/Bala.js`
    - Migrar clase Bullet con detección de colisiones
    - _Requisitos: 2.1, 5.1_
  - [ ]* 4.4 Escribir test de propiedad para creación de bala
    - **Propiedad 1: Disparo crea bala con dirección correcta**
    - **Valida: Requisito 5.1**
  - [x] 4.5 Crear archivo `src/entidades/Jugador.js`
    - Exportar estado del jugador y funciones de movimiento
    - _Requisitos: 2.1, 5.4_
  - [ ]* 4.6 Escribir test de propiedad para movimiento del jugador
    - **Propiedad 4: Movimiento WASD produce desplazamiento correcto**
    - **Valida: Requisito 5.4**

- [x] 5. Crear sistemas del juego
  - [x] 5.1 Crear archivo `src/sistemas/armas.js`
    - Exportar estado del arma, funciones disparar y recargar
    - _Requisitos: 2.2, 5.1_
  - [x] 5.2 Crear archivo `src/sistemas/dash.js`
    - Exportar sistema dash con cargas y recarga
    - _Requisitos: 2.2, 5.2_
  - [ ]* 5.3 Escribir test de propiedad para sistema dash
    - **Propiedad 2: Dash consume exactamente una carga**
    - **Valida: Requisito 5.2**
  - [x] 5.4 Crear archivo `src/sistemas/controles.js`
    - Exportar manejo de teclado y mouse
    - _Requisitos: 2.2_

- [x] 6. Crear utilidades
  - [x] 6.1 Crear archivo `src/utils/efectos.js`
    - Exportar funciones de efectos visuales (impacto, dash, respawn)
    - _Requisitos: 2.3_
  - [x] 6.2 Crear archivo `src/utils/ui.js`
    - Exportar funciones de actualización de interfaz
    - _Requisitos: 2.3_

- [x] 7. Crear punto de entrada y actualizar HTML
  - [x] 7.1 Crear archivo `src/main.js`
    - Importar todos los módulos y crear bucle principal del juego
    - _Requisitos: 2.5, 1.1_
  - [x] 7.2 Actualizar `index.html`
    - Eliminar código JavaScript inline
    - Añadir referencia al CSS externo
    - Añadir script type="module" apuntando a main.js
    - _Requisitos: 1.1, 3.1_

- [x] 8. Checkpoint - Verificar que todo funciona
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.
