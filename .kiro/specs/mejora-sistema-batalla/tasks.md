# Plan de Implementación - Mejora del Sistema de Batalla

- [x] 1. Actualizar configuración de armas y balanceo
  - [x] 1.1 Modificar velocidades de bala (incremento 50%)
    - Actualizar `velocidadBala` en todas las armas de config.js
    - M4A1: 40 → 60, AK47: 42 → 63, Pistola: 30 → 45, MP5: 32 → 48, Escopeta: 25 → 38
    - Sniper: establecer a 120
    - _Requisitos: 1.1, 1.3_
  - [x] 1.2 Actualizar configuración del sniper
    - Cambiar `daño` a 150 (mata de un disparo)
    - Cambiar `municionTotal` a 10
    - Cambiar `tamañoCargador` a 1
    - _Requisitos: 2.1, 2.2_
  - [x] 1.3 Actualizar munición de rifles y subfusiles
    - M4A1: `municionTotal` a 210
    - AK47: `municionTotal` a 210
    - MP5: `municionTotal` a 240
    - _Requisitos: 6.1, 6.2_
  - [x] 1.4 Actualizar configuración de escopeta
    - Cambiar `tamañoCargador` a 3
    - Mantener `daño` en 26
    - _Requisitos: 6.3, 6.4_
  - [x] 1.5 Eliminar SCAR de la configuración
    - Remover entrada "SCAR" de CONFIG.armas
    - _Requisitos: 6.1_
  - [ ]* 1.6 Property test: Velocidad de balas incrementada
    - **Property 1: Incremento de velocidad de balas**
    - **Valida: Requisito 1.1**
  - [ ]* 1.7 Property test: Munición de rifles
    - **Property 6: Munición de rifles**
    - **Valida: Requisito 6.1**


- [x] 2. Implementar sistema de cuchillo (Knife)
  - [x] 2.1 Agregar configuración del cuchillo en config.js
    - Crear entrada "KNIFE" con tipo "melee", daño 30, rangoAtaque 2
    - Configurar modelo, posición y rotación
    - _Requisitos: 4.1, 4.2, 4.5_
  - [x] 2.2 Implementar función de ataque melee en armas.js
    - Crear función `atacarConCuchillo(camera, enemigos, scene, onImpacto)`
    - Detectar enemigos en rango de 2 unidades
    - Aplicar 30 de daño a enemigos detectados
    - _Requisitos: 4.1, 4.5_
  - [x] 2.3 Cargar modelo GLB del cuchillo
    - Usar GLTFLoader para cargar valorants_knife_low_poly.glb
    - Configurar escala y posición en primera persona
    - _Requisitos: 4.2_
  - [x] 2.4 Integrar animación de ataque
    - Cargar animación knife_attack_tps.glb
    - Reproducir al atacar
    - _Requisitos: 4.3_
  - [ ]* 2.5 Property test: Cuchillo siempre puede atacar
    - **Property 3: Cuchillo siempre puede atacar**
    - **Valida: Requisito 4.4**
  - [ ]* 2.6 Property test: Detección de rango del cuchillo
    - **Property 4: Detección de rango del cuchillo**
    - **Valida: Requisito 4.5**

- [x] 3. Checkpoint - Verificar configuración y cuchillo
  - Ensure all tests pass, ask the user if questions arise.


- [x] 4. Mejorar sistema de dash para respetar colisiones
  - [x] 4.1 Modificar ejecutarDashInterpolado en dash.js
    - Eliminar lógica de extensión automática (calcularPosicionFinalConExtension)
    - Usar shapeCastDash directamente para detectar colisiones
    - Detener dash en punto de colisión, no atravesar
    - _Requisitos: 3.1, 3.2_
  - [x] 4.2 Actualizar shapeCastDashFallback en colisiones.js
    - Asegurar que retorna posición antes de la colisión
    - No permitir atravesar estructuras bajo ninguna circunstancia
    - _Requisitos: 3.1, 3.3, 3.4_
  - [ ]* 4.3 Property test: Dash no atraviesa estructuras
    - **Property 2: Dash no atraviesa estructuras**
    - **Valida: Requisito 3.1**

- [x] 5. Implementar sistema de spawns de munición
  - [x] 5.1 Crear clase AmmoSpawn en src/entidades/AmmoSpawn.js
    - Constructor con posición, modelo y configuración
    - Método recoger() que otorga 35% de munición máxima
    - Método actualizar() para timer de recarga (10 segundos)
    - Método estaActivo() para verificar disponibilidad
    - _Requisitos: 5.1, 5.2, 5.3_
  - [x] 5.2 Agregar configuración de spawns en config.js
    - Definir posiciones de spawns en el mapa
    - Configurar porcentaje (0.35), tiempo recarga (10000ms)
    - _Requisitos: 5.4_

  - [x] 5.3 Cargar modelo de caja de munición
    - Usar GLTFLoader para cargar low-poly_ammo_can.glb
    - Configurar escala y posición
    - _Requisitos: 5.5_
  - [x] 5.4 Integrar spawns en el sistema principal
    - Crear instancias de AmmoSpawn en las posiciones configuradas
    - Agregar detección de proximidad del jugador
    - Actualizar spawns en el loop del juego
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 5.5 Property test: Cálculo de munición de spawn
    - **Property 5: Cálculo de munición de spawn**
    - **Valida: Requisito 5.1**

- [x] 6. Checkpoint - Verificar dash y spawns
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integración y sincronización con servidor
  - [x] 7.1 Actualizar bulletSystem.js del servidor
    - Sincronizar nuevas velocidades de bala
    - Actualizar daño del sniper a 150
    - _Requisitos: 1.1, 2.1_
  - [x] 7.2 Actualizar config.js del servidor
    - Sincronizar configuración de armas con cliente
    - _Requisitos: 6.1, 6.2, 6.3, 6.5_
  - [ ]* 7.3 Property test: Round-trip de configuración
    - **Property 7: Round-trip de configuración de armas**
    - **Valida: Requisitos 7.1, 7.2**

- [x] 8. Final Checkpoint - Verificar todo el sistema
  - Ensure all tests pass, ask the user if questions arise.
