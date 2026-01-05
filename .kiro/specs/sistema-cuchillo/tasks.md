# Implementation Plan

- [x] 1. Corregir daño del cuchillo
  - [x] 1.1 Actualizar daño en configuración del cliente
    - Modificar CONFIG.armas.KNIFE.daño de 50 a 30 en src/config.js
    - _Requirements: 1.2, 1.3_
  - [x] 1.2 Actualizar daño en configuración del servidor
    - Modificar WEAPON_CONFIG.KNIFE.damage de 50 a 30 en server/config.js
    - _Requirements: 1.1, 1.2_
  - [ ]* 1.3 Write property test for knife damage consistency
    - **Property 1: Knife damage consistency**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 2. Implementar bloqueo de apuntado con cuchillo
  - [x] 2.1 Modificar función alternarApuntado en armas.js
    - Agregar verificación al inicio: si arma.tipoActual === 'KNIFE', retornar temprano
    - No modificar estado de apuntado ni FOV cuando cuchillo está equipado
    - _Requirements: 5.1, 5.2, 5.4_
  - [x] 2.2 Verificar restauración de apuntado al cambiar arma
    - Asegurar que al cambiar de cuchillo a arma principal, el apuntado funcione normalmente
    - _Requirements: 5.3_
  - [ ]* 2.3 Write property test for aim blocking
    - **Property 2: Aim blocking when knife equipped**
    - **Validates: Requirements 5.1, 5.2, 5.4**

- [x] 3. Mejorar manejo de errores en ataque con cuchillo
  - [x] 3.1 Validar array de enemigos en atacarConCuchillo
    - Convertir null/undefined a array vacío al inicio de la función
    - Agregar try-catch alrededor del procesamiento de cada enemigo
    - _Requirements: 2.1, 2.2_
  - [x] 3.2 Validar posición de enemigos
    - Verificar que posicionEnemigo no sea null antes de usar
    - Saltar enemigos con posición inválida sin crashear
    - _Requirements: 2.2_

- [x] 4. Checkpoint - Verificar correcciones básicas
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Corregir animación TPS para otros jugadores
  - [x] 5.1 Verificar broadcast de evento melee en servidor
    - Revisar que legacyServer.js y workerServer.js envíen el evento meleeAttack correctamente
    - _Requirements: 3.1, 6.4_
  - [x] 5.2 Corregir procesamiento de evento en JugadorRemoto
    - Verificar que procesarAtaqueCuchillo se llame cuando se recibe el evento
    - Agregar logs para debug si la animación no se reproduce
    - _Requirements: 3.2, 3.3_
  - [x] 5.3 Verificar conexión del evento en main.js
    - Asegurar que connection.onMeleeAttack llame a procesarAtaqueCuchillo del jugador remoto correcto
    - _Requirements: 3.1, 3.4_
  - [ ]* 5.4 Write property test for melee attack broadcast
    - **Property 5: Melee attack broadcast**
    - **Validates: Requirements 3.1, 6.4**

- [x] 6. Mejorar indicador de daño visual
  - [x] 6.1 Verificar callback de impacto en atacarConCuchillo
    - Asegurar que onImpacto se llame con el daño correcto (30)
    - _Requirements: 4.1_
  - [x] 6.2 Verificar mostrarDañoCausado en main.js
    - Asegurar que la función muestre el indicador visual correctamente
    - _Requirements: 4.1, 4.3_
  - [ ]* 6.3 Write property test for damage indicator
    - **Property 4: Damage indicator consistency**
    - **Validates: Requirements 4.1, 4.4**

- [x] 7. Verificar sincronización de estado cliente-servidor
  - [x] 7.1 Verificar envío de weaponChange al equipar cuchillo
    - Asegurar que alternarCuchillo envíe el evento de cambio de arma al servidor
    - _Requirements: 6.1_
  - [x] 7.2 Verificar validación de arma en servidor
    - Confirmar que processMeleeAttackInput rechaza ataques si currentWeapon !== 'KNIFE'
    - _Requirements: 6.2_
  - [ ]* 7.3 Write property test for weapon state sync
    - **Property 6: Weapon state synchronization**
    - **Validates: Requirements 6.1, 6.3**
  - [ ]* 7.4 Write property test for server weapon validation
    - **Property 7: Server weapon validation**
    - **Validates: Requirements 6.2**

- [x] 8. Final Checkpoint - Verificar todas las correcciones
  - Ensure all tests pass, ask the user if questions arise.
