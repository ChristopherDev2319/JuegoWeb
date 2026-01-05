# Requirements Document

## Introduction

Este documento especifica los requisitos para mejorar el sistema de bots de entrenamiento. Los cambios principales incluyen:
1. Reemplazar los cubos actuales por el modelo del personaje (bear) usado por los jugadores
2. Eliminar el sistema de zonas y mensajes al entrar en ellas
3. Distribuir los bots por todo el mapa con comportamientos variados (estáticos, tiradores hacia adelante, movimiento lateral)

## Glossary

- **Sistema_Bots**: Módulo que gestiona los bots de entrenamiento en el juego
- **Bot_Estático**: Bot que permanece inmóvil en su posición
- **Bot_Tirador**: Bot que dispara hacia adelante de forma continua
- **Bot_Móvil**: Bot que se mueve lateralmente (izquierda-derecha o derecha-izquierda)
- **Modelo_Bear**: Modelo 3D del personaje ubicado en `modelos/animaciones/idle_tps.glb`
- **Mapa**: Área de juego completa definida por los límites en CONFIG.limitesMapa

## Requirements

### Requirement 1

**User Story:** Como jugador, quiero que los bots de entrenamiento tengan el mismo modelo que los jugadores, para que la práctica sea más realista.

#### Acceptance Criteria

1. WHEN el sistema crea un bot de entrenamiento THEN el Sistema_Bots SHALL cargar el Modelo_Bear (`modelos/animaciones/idle_tps.glb`) en lugar de un cubo
2. WHEN el Modelo_Bear se carga para un bot THEN el Sistema_Bots SHALL aplicar la misma escala y configuración que los jugadores remotos (scale: 7.0)
3. WHEN un bot recibe daño THEN el Sistema_Bots SHALL mostrar el efecto visual de daño en el Modelo_Bear
4. WHEN un bot muere THEN el Sistema_Bots SHALL reproducir una animación de muerte o efecto visual apropiado

### Requirement 2

**User Story:** Como jugador, quiero que los bots estén distribuidos por todo el mapa, para poder practicar en diferentes ubicaciones.

#### Acceptance Criteria

1. WHEN el sistema inicializa los bots THEN el Sistema_Bots SHALL distribuir los bots en posiciones aleatorias dentro de los límites del mapa
2. WHEN el sistema genera posiciones para bots THEN el Sistema_Bots SHALL evitar posiciones que colisionen con estructuras del mapa
3. WHEN el sistema distribuye bots THEN el Sistema_Bots SHALL mantener una distancia mínima entre bots para evitar superposición

### Requirement 3

**User Story:** Como jugador, quiero que algunos bots permanezcan estáticos, para practicar puntería básica.

#### Acceptance Criteria

1. WHEN el sistema crea un Bot_Estático THEN el Sistema_Bots SHALL mantener al bot inmóvil en su posición inicial
2. WHEN un Bot_Estático está activo THEN el Sistema_Bots SHALL reproducir la animación idle del Modelo_Bear
3. WHEN un Bot_Estático muere y reaparece THEN el Sistema_Bots SHALL restaurar al bot en su posición inicial

### Requirement 4

**User Story:** Como jugador, quiero que algunos bots disparen hacia adelante, para practicar esquivar y reaccionar.

#### Acceptance Criteria

1. WHEN el sistema crea un Bot_Tirador THEN el Sistema_Bots SHALL configurar al bot para disparar en la dirección que está mirando
2. WHEN un Bot_Tirador dispara THEN el Sistema_Bots SHALL crear un proyectil visual que viaja hacia adelante
3. WHEN un Bot_Tirador está activo THEN el Sistema_Bots SHALL disparar a intervalos regulares configurables
4. WHEN un Bot_Tirador muere THEN el Sistema_Bots SHALL detener los disparos hasta que reaparezca

### Requirement 5

**User Story:** Como jugador, quiero que algunos bots se muevan lateralmente, para practicar tracking de objetivos en movimiento.

#### Acceptance Criteria

1. WHEN el sistema crea un Bot_Móvil THEN el Sistema_Bots SHALL configurar una dirección inicial de movimiento (izquierda o derecha)
2. WHEN un Bot_Móvil se mueve THEN el Sistema_Bots SHALL desplazar al bot horizontalmente a velocidad constante
3. WHEN un Bot_Móvil alcanza el límite de su rango de movimiento THEN el Sistema_Bots SHALL invertir la dirección del movimiento
4. WHEN un Bot_Móvil está en movimiento THEN el Sistema_Bots SHALL reproducir la animación walk del Modelo_Bear

### Requirement 6

**User Story:** Como jugador, quiero que el sistema no muestre mensajes de zona al acercarme a los bots, para una experiencia más fluida.

#### Acceptance Criteria

1. WHEN el jugador se mueve por el mapa THEN el Sistema_Bots SHALL NO mostrar mensajes de entrada a zonas de entrenamiento
2. WHEN el sistema inicializa THEN el Sistema_Bots SHALL NO crear zonas de entrenamiento delimitadas
3. WHEN el jugador está cerca de un bot THEN el Sistema_Bots SHALL NO activar o desactivar comportamientos basados en proximidad a zonas

### Requirement 7

**User Story:** Como jugador, quiero que los bots tengan barras de vida visibles, para saber cuánto daño les he hecho.

#### Acceptance Criteria

1. WHEN un bot está activo THEN el Sistema_Bots SHALL mostrar una barra de vida sobre el Modelo_Bear
2. WHEN un bot recibe daño THEN el Sistema_Bots SHALL actualizar la barra de vida para reflejar la vida restante
3. WHEN un bot reaparece THEN el Sistema_Bots SHALL restaurar la barra de vida al máximo
