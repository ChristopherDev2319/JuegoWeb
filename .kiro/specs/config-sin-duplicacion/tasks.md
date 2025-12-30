# Plan de Implementación

- [x] 1. Limpiar configuración del cliente
  - [x] 1.1 Eliminar propiedades de gameplay de src/config.js
    - Remover: daño, cadenciaDisparo, tamañoCargador, municionTotal, tiempoRecarga, velocidadBala, multiplicadorHeadshot, proyectiles, dispersion
    - Mantener solo: nombre, tipo, modelo, posicion, rotacion, retroceso, apuntado, semiAutomatica, dispersionSinMira
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 3.4_

  - [ ]* 1.2 Escribir property test para exclusividad de valores de gameplay
    - **Property 1: Valores de gameplay exclusivos del servidor**
    - **Valida: Requisitos 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4**

- [x] 2. Verificar configuración del servidor
  - [x] 2.1 Asegurar que server/config.js tiene todos los valores de gameplay
    - Verificar que todas las armas tienen: damage, fireRate, magazineSize, totalAmmo, reloadTime, bulletSpeed, headshotMultiplier
    - Añadir comentarios en español explicando cada valor
    - _Requisitos: 5.2_

  - [ ]* 2.2 Escribir property test para exclusividad de valores visuales
    - **Property 2: Valores visuales exclusivos del cliente**
    - **Valida: Requisitos 2.1, 2.2, 2.3**

- [x] 3. Actualizar código que usa la configuración
  - [x] 3.1 Actualizar src/sistemas/armas.js para usar solo config visual
    - Remover cualquier referencia a daño, cadencia, munición desde config del cliente
    - Usar solo propiedades visuales para renderizado
    - _Requisitos: 2.1, 2.2, 2.3_

  - [x] 3.2 Actualizar src/utils/ui.js para recibir estado de munición del servidor
    - La UI debe mostrar valores recibidos del servidor, no calculados localmente
    - _Requisitos: 2.4_

- [x] 4. Checkpoint - Asegurar que todo funciona
  - Asegurar que todos los tests pasan, preguntar al usuario si hay dudas.

- [ ]* 5. Tests de nomenclatura
  - [ ]* 5.1 Escribir property test para nomenclatura en español
    - **Property 3: Nomenclatura en español para cliente**
    - **Valida: Requisitos 5.1**

- [x] 6. Checkpoint Final
  - Asegurar que todos los tests pasan, preguntar al usuario si hay dudas.
