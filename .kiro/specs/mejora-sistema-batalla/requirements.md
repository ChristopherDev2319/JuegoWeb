# Documento de Requisitos - Mejora del Sistema de Batalla

## Introducción

Este documento especifica las mejoras al sistema de batalla del juego FPS, incluyendo balanceo de armas, velocidad de balas, sistema de dash mejorado, implementación del cuchillo como arma cuerpo a cuerpo, y sistema de spawns de munición en el mapa.

## Glosario

- **Sistema de Batalla**: Conjunto de mecánicas que gestionan el combate entre jugadores
- **Bala**: Proyectil disparado por las armas que causa daño al impactar
- **Dash**: Habilidad de movimiento rápido que permite al jugador desplazarse instantáneamente
- **Colisión**: Detección de contacto entre objetos del juego (jugador, paredes, balas)
- **Spawn de Munición**: Punto en el mapa donde aparece munición que los jugadores pueden recoger
- **Cuchillo (Knife)**: Arma cuerpo a cuerpo para combate cercano
- **Munición Máxima**: Cantidad total de balas que un arma puede almacenar en reserva
- **Tamaño de Cargador**: Cantidad de balas que caben en un cargador del arma

## Requisitos

### Requisito 1

**User Story:** Como jugador, quiero que las balas viajen más rápido, para que el combate se sienta más responsivo y las balas lleguen a tiempo al enemigo.

#### Criterios de Aceptación

1. WHEN el jugador dispara un arma THEN el Sistema de Batalla SHALL incrementar la velocidad de la bala en un 50% respecto al valor actual
2. WHEN una bala viaja hacia un enemigo THEN el Sistema de Batalla SHALL mantener la detección de colisiones precisa a pesar de la mayor velocidad
3. WHEN el jugador dispara el sniper THEN el Sistema de Batalla SHALL aplicar una velocidad de bala de 120 unidades por segundo


### Requisito 2

**User Story:** Como jugador, quiero que el sniper mate de un disparo al cuerpo, para que sea un arma de alto riesgo y alta recompensa.

#### Criterios de Aceptación

1. WHEN el jugador dispara el sniper y la bala impacta al cuerpo de un enemigo THEN el Sistema de Batalla SHALL aplicar 150 puntos de daño
2. WHEN el sniper tiene munición máxima THEN el Sistema de Batalla SHALL limitar la munición total a 10 balas
3. WHEN el jugador recarga el sniper THEN el Sistema de Batalla SHALL mantener el tiempo de recarga actual de 3.7 segundos

### Requisito 3

**User Story:** Como jugador, quiero que el dash no atraviese estructuras ni colisiones, para que el movimiento sea más táctico y predecible.

#### Criterios de Aceptación

1. WHEN el jugador ejecuta un dash hacia una pared THEN el Sistema de Dash SHALL detener al jugador antes de atravesar la estructura
2. WHEN el jugador ejecuta un dash y detecta una colisión THEN el Sistema de Dash SHALL posicionar al jugador en el punto más cercano válido antes de la colisión
3. WHEN el jugador ejecuta un dash en diagonal hacia una esquina THEN el Sistema de Dash SHALL respetar ambas superficies de colisión
4. WHEN el jugador está cerca de una pared y ejecuta dash THEN el Sistema de Dash SHALL calcular la distancia disponible antes de la colisión


### Requisito 4

**User Story:** Como jugador, quiero usar un cuchillo como arma cuerpo a cuerpo, para tener una opción de combate cercano silenciosa.

#### Criterios de Aceptación

1. WHEN el jugador ataca con el cuchillo THEN el Sistema de Batalla SHALL aplicar 30 puntos de daño al enemigo en rango
2. WHEN el jugador equipa el cuchillo THEN el Sistema de Armas SHALL cargar el modelo valorants_knife_low_poly.glb
3. WHEN el jugador ataca con el cuchillo THEN el Sistema de Armas SHALL reproducir la animación de ataque knife_attack_tps.glb
4. WHEN el jugador tiene el cuchillo equipado THEN el Sistema de Armas SHALL permitir ataques ilimitados sin necesidad de munición
5. WHEN el jugador ataca con el cuchillo THEN el Sistema de Batalla SHALL detectar enemigos en un rango de 2 unidades frente al jugador

### Requisito 5

**User Story:** Como jugador, quiero recoger munición de spawns en el mapa, para poder reabastecer mi arma durante la partida.

#### Criterios de Aceptación

1. WHEN el jugador se acerca a un spawn de munición activo THEN el Sistema de Spawns SHALL otorgar munición equivalente al 35% de la munición máxima del arma equipada
2. WHEN un jugador recoge munición de un spawn THEN el Sistema de Spawns SHALL desactivar el spawn por 10 segundos
3. WHEN transcurren 10 segundos desde que se recogió munición THEN el Sistema de Spawns SHALL reactivar el spawn con el modelo visible
4. WHEN el sistema carga el mapa THEN el Sistema de Spawns SHALL posicionar múltiples spawns de munición en ubicaciones estratégicas del mapa
5. WHEN el sistema renderiza un spawn activo THEN el Sistema de Spawns SHALL mostrar el modelo low-poly_ammo_can.glb


### Requisito 6

**User Story:** Como jugador, quiero que las armas estén balanceadas, para que cada arma tenga un rol específico en el combate.

#### Criterios de Aceptación

1. WHEN el jugador usa un rifle (M4A1, AK47) THEN el Sistema de Armas SHALL proporcionar munición máxima de 210 balas
2. WHEN el jugador usa un subfusil (MP5) THEN el Sistema de Armas SHALL proporcionar munición máxima de 240 balas
3. WHEN el jugador usa la escopeta THEN el Sistema de Armas SHALL limitar el tamaño del cargador a 3 cartuchos
4. WHEN el jugador usa la escopeta THEN el Sistema de Armas SHALL mantener el daño actual de 26 por perdigón
5. WHEN el jugador usa el sniper THEN el Sistema de Armas SHALL limitar la munición máxima a 10 balas con cargador de 1 bala
6. WHEN el jugador usa la pistola THEN el Sistema de Armas SHALL mantener la configuración actual de munición

### Requisito 7

**User Story:** Como desarrollador, quiero que el sistema de serialización de configuración de armas sea consistente, para mantener la integridad de los datos.

#### Criterios de Aceptación

1. WHEN el sistema guarda la configuración de un arma THEN el Sistema de Configuración SHALL serializar todos los atributos del arma en formato JSON
2. WHEN el sistema carga la configuración de un arma THEN el Sistema de Configuración SHALL deserializar y restaurar todos los atributos correctamente
