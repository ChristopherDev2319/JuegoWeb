# Documento de Requisitos

## Introducción

Este documento especifica los requisitos para sincronizar el comportamiento de las armas entre el modo local (entrenamiento) y el modo online (multijugador). Actualmente existen discrepancias en valores como cadencia, cooldown, munición, daño y velocidad de balas entre ambos modos, lo que genera una experiencia inconsistente para el jugador. El objetivo es que el modo local refleje exactamente el mismo comportamiento que el modo online, permitiendo que los jugadores practiquen con las mismas mecánicas que encontrarán en partidas reales.

## Glosario

- **Sistema de Armas**: Módulo que gestiona el estado, disparo, recarga y comportamiento de las armas del jugador.
- **Sistema de Balas**: Módulo que gestiona la creación, movimiento, colisión y daño de los proyectiles.
- **Modo Local**: Modo de entrenamiento sin conexión a servidor, donde el jugador practica contra bots.
- **Modo Online**: Modo multijugador con arquitectura cliente-servidor donde el servidor es autoritativo.
- **Cadencia de Disparo (fireRate)**: Tiempo en milisegundos entre disparos consecutivos.
- **Cargador (magazineSize)**: Cantidad de balas/cartuchos que puede contener el arma antes de recargar.
- **Munición Total (totalAmmo)**: Cantidad de munición de reserva disponible.
- **Perdigones (projectiles)**: Número de proyectiles disparados simultáneamente (escopetas).
- **Velocidad de Bala (bulletSpeed)**: Velocidad a la que viaja el proyectil en unidades por segundo.
- **CONFIG Cliente**: Archivo `src/config.js` con configuración del lado del cliente.
- **WEAPON_CONFIG Servidor**: Archivo `server/config.js` con configuración autoritativa del servidor.

## Requisitos

### Requisito 1: Fuente Única de Verdad para Configuración de Armas

**User Story:** Como desarrollador, quiero que exista una única fuente de verdad para la configuración de armas, para que los valores sean consistentes entre modo local y online.

#### Criterios de Aceptación

1. WHEN el sistema de armas se inicializa THEN THE Sistema de Armas SHALL usar los mismos valores de cadencia, daño, cargador y munición tanto en modo local como en modo online.
2. WHEN se modifica la configuración de un arma THEN THE Sistema de Armas SHALL reflejar el cambio en ambos modos de juego.
3. WHEN el modo local carga una configuración de arma THEN THE Sistema de Armas SHALL aplicar los valores idénticos a los del servidor.

### Requisito 2: Sincronización del Sniper (AWP)

**User Story:** Como jugador, quiero que el sniper tenga el mismo comportamiento en modo local que en modo online, para poder practicar efectivamente.

#### Criterios de Aceptación

1. WHEN el jugador dispara el sniper THEN THE Sistema de Armas SHALL aplicar 200 puntos de daño por impacto.
2. WHEN el jugador equipa el sniper THEN THE Sistema de Armas SHALL mostrar un cargador de 1 bala.
3. WHEN el jugador recarga el sniper THEN THE Sistema de Armas SHALL completar la recarga en 3700 milisegundos.
4. WHEN el jugador dispara el sniper THEN THE Sistema de Armas SHALL aplicar una cadencia de 1333 milisegundos entre disparos.
5. WHEN el jugador equipa el sniper THEN THE Sistema de Armas SHALL mostrar 10 balas de munición total de reserva.

### Requisito 3: Sincronización de la Escopeta

**User Story:** Como jugador, quiero que la escopeta tenga el mismo comportamiento en modo local que en modo online, para poder practicar efectivamente.

#### Criterios de Aceptación

1. WHEN el jugador equipa la escopeta THEN THE Sistema de Armas SHALL mostrar un cargador de 3 cartuchos.
2. WHEN el jugador dispara la escopeta THEN THE Sistema de Armas SHALL disparar 8 perdigones simultáneamente.
3. WHEN el jugador dispara la escopeta THEN THE Sistema de Armas SHALL aplicar una cadencia de 857 milisegundos entre disparos.
4. WHEN el jugador dispara la escopeta THEN THE Sistema de Armas SHALL aplicar 24 puntos de daño por perdigón.

### Requisito 4: Sincronización de Rifles (M4A1, AK47)

**User Story:** Como jugador, quiero que los rifles tengan el mismo comportamiento en modo local que en modo online, para poder practicar efectivamente.

#### Criterios de Aceptación

1. WHEN el jugador dispara el M4A1 THEN THE Sistema de Armas SHALL aplicar una cadencia de 75 milisegundos entre disparos.
2. WHEN el jugador dispara el AK47 THEN THE Sistema de Armas SHALL aplicar una cadencia de 109 milisegundos entre disparos.
3. WHEN el jugador dispara el M4A1 THEN THE Sistema de Armas SHALL aplicar 30 puntos de daño por bala.
4. WHEN el jugador dispara el AK47 THEN THE Sistema de Armas SHALL aplicar 45 puntos de daño por bala.

### Requisito 5: Sincronización del MP5

**User Story:** Como jugador, quiero que el MP5 tenga el mismo comportamiento en modo local que en modo online, para poder practicar efectivamente.

#### Criterios de Aceptación

1. WHEN el jugador dispara el MP5 THEN THE Sistema de Armas SHALL aplicar una cadencia de 71 milisegundos entre disparos.
2. WHEN el jugador dispara el MP5 THEN THE Sistema de Armas SHALL aplicar 24 puntos de daño por bala.

### Requisito 6: Sincronización de la Pistola

**User Story:** Como jugador, quiero que la pistola tenga el mismo comportamiento en modo local que en modo online, para poder practicar efectivamente.

#### Criterios de Aceptación

1. WHEN el jugador dispara la pistola THEN THE Sistema de Armas SHALL aplicar una cadencia de 150 milisegundos entre disparos.
2. WHEN el jugador dispara la pistola THEN THE Sistema de Armas SHALL aplicar 20 puntos de daño por bala.

### Requisito 7: Conversión de Cadencia

**User Story:** Como desarrollador, quiero que la cadencia se maneje de forma consistente, para evitar confusiones entre RPM y milisegundos.

#### Criterios de Aceptación

1. WHEN el sistema calcula el tiempo entre disparos THEN THE Sistema de Armas SHALL usar el valor de fireRate en milisegundos directamente del servidor.
2. WHEN el cliente muestra información de cadencia THEN THE Sistema de Armas SHALL convertir correctamente entre milisegundos y RPM usando la fórmula: RPM = 60000 / fireRate_ms.

### Requisito 8: Comportamiento Idéntico de Armas en Modo Local y Online

**User Story:** Como jugador, quiero que las armas se comporten exactamente igual en modo local que en modo online, para que mi práctica sea efectiva y representativa.

#### Criterios de Aceptación

1. WHEN el jugador dispara un arma en modo local THEN THE Sistema de Armas SHALL aplicar la misma cadencia de disparo que en modo online.
2. WHEN el jugador dispara un arma en modo local THEN THE Sistema de Armas SHALL aplicar el mismo daño por impacto que en modo online.
3. WHEN el jugador recarga un arma en modo local THEN THE Sistema de Armas SHALL aplicar el mismo tiempo de recarga que en modo online.
4. WHEN el jugador equipa un arma en modo local THEN THE Sistema de Armas SHALL mostrar el mismo tamaño de cargador que en modo online.
5. WHEN el jugador dispara en modo local THEN THE Sistema de Armas SHALL respetar el mismo cooldown entre disparos que en modo online.

### Requisito 9: Sincronización de Balas y Proyectiles

**User Story:** Como jugador, quiero que las balas tengan el mismo comportamiento en modo local que en modo online, para que mi práctica de puntería sea precisa.

#### Criterios de Aceptación

1. WHEN una bala es disparada en modo local THEN THE Sistema de Balas SHALL aplicar la misma velocidad de proyectil que en modo online.
2. WHEN una bala impacta en modo local THEN THE Sistema de Balas SHALL aplicar el mismo daño que en modo online.
3. WHEN una bala es disparada en modo local THEN THE Sistema de Balas SHALL aplicar el mismo multiplicador de headshot que en modo online.
4. WHEN la escopeta dispara en modo local THEN THE Sistema de Balas SHALL crear el mismo número de perdigones que en modo online.
5. WHEN la escopeta dispara en modo local THEN THE Sistema de Balas SHALL aplicar la misma dispersión de perdigones que en modo online.

### Requisito 10: Prevención de Desincronización

**User Story:** Como desarrollador, quiero prevenir que los valores de armas se desincronicen entre cliente y servidor, para mantener la consistencia del juego.

#### Criterios de Aceptación

1. WHEN el modo local inicializa un arma THEN THE Sistema de Armas SHALL obtener los valores de configuración de la misma fuente que el modo online.
2. WHEN el sistema detecta una discrepancia de cadencia THEN THE Sistema de Armas SHALL usar el valor del servidor como autoritativo.
3. WHEN el sistema detecta una discrepancia de daño THEN THE Sistema de Armas SHALL usar el valor del servidor como autoritativo.
