/**
 * Configuración del juego FPS Three.js
 * Contiene todas las constantes configurables del juego
 */

export const CONFIG = {
  jugador: {
    velocidad: 0.15,
    poderSalto: 0.25,
    alturaOjos: 1.7,
    gravedad: 0.015
  },

  // Configuración del sistema de colisiones
  colisiones: {
    radioJugador: 0.5,      // Radio del jugador para colisiones horizontales
    alturaJugador: 1.7,     // Altura del jugador
    margenPared: 0.1,       // Margen de separación de paredes
    rayosHorizontales: 8,   // Número de rayos para detección horizontal
    distanciaRayo: 0.6      // Distancia máxima de detección
  },

  armas: {
    // M4A1: Rifle versátil, fácil de controlar - Similar al Phantom de Valorant / M4A4 de CS2
    // Características: Alta cadencia, daño moderado, fácil control, buena precisión
    "M4A1": {
      nombre: "M4A1",
      descripcion: "Rifle de asalto versátil con alta cadencia y fácil control de retroceso",
      tipo: "rifle",
      cadenciaDisparo: 500, // 500 RPM - Cadencia reducida
      daño: 28, // 8 balas para matar (200/28 = 7.14)
      tamañoCargador: 30,
      municionTotal: 120, // 4 cargadores extra
      tiempoRecarga: 2.2, // Recarga moderada
      velocidadBala: 65.0,
      modelo: "modelos/FBX/Weapons/M4A1.fbx",
      sonidoDisparo: "sonidos/M4A1.mp3",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.04, // Retroceso bajo - fácil de controlar
        arriba: 0.025,
        duracion: 50
      },
      multiplicadorHeadshot: 3.5, // Headshot: 98 daño (2 headshots matan)
      dispersion: 0.015, // Muy preciso
      apuntado: {
        zoom: 1.4,
        reduccionRetroceso: 0.6, // Gran reducción al apuntar
        tiempoTransicion: 0.2, // Rápido para apuntar
        posicionArma: { x: 0, y: -0.1, z: -0.2 },
        reduccionDispersion: 0.4
      }
    },
    
    // AK-47: Alto daño, difícil control - Similar al Vandal de Valorant / AK-47 de CS2
    // Características: Daño alto, cadencia media, retroceso fuerte, recompensa skill
    "AK47": {
      nombre: "AK-47",
      descripcion: "Rifle de asalto potente con alto daño pero difícil de controlar",
      tipo: "rifle",
      cadenciaDisparo: 450, // 450 RPM - Cadencia reducida
      daño: 38, // 6 balas para matar (200/38 = 5.26)
      tamañoCargador: 30,
      municionTotal: 90, // 3 cargadores extra
      tiempoRecarga: 2.5, // Recarga más lenta
      velocidadBala: 60.0,
      modelo: "modelos/FBX/Weapons/AK47.fbx",
      sonidoDisparo: "sonidos/AK47.mp3",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: 0, z: 0 },
      retroceso: {
        cantidad: 0.09, // Retroceso alto - requiere control
        arriba: 0.06,
        duracion: 80
      },
      multiplicadorHeadshot: 4.0, // Headshot: 152 daño (1 headshot + 2 body = kill)
      dispersion: 0.025, // Menos preciso que M4A1
      apuntado: {
        zoom: 1.35,
        reduccionRetroceso: 0.45, // Menos reducción que M4A1
        tiempoTransicion: 0.28, // Más lento para apuntar
        posicionArma: { x: 0, y: -0.12, z: -0.25 },
        reduccionDispersion: 0.35
      }
    },
    
    // Desert Eagle: Pistola de alto calibre - 3 disparos para matar
    "PISTOLA": {
      nombre: "Desert Eagle",
      descripcion: "Pistola de alto calibre con daño devastador pero alto retroceso",
      tipo: "pistola",
      cadenciaDisparo: 100, // 100 RPM - Cadencia reducida, más lenta
      daño: 90, // 3 balas para matar (200/90 = 2.22 → 3 balas)
      tamañoCargador: 7,
      municionTotal: 28, // 4 cargadores extra
      tiempoRecarga: 1.8,
      velocidadBala: 50.0,
      modelo: "modelos/FBX/Weapons/1911.fbx",
      sonidoDisparo: "sonidos/pistola.mp3",
      posicion: { x: 0.2, y: -0.4, z: -0.3 },
      rotacion: { x: 0, y: 0, z: 0 },
      retroceso: {
        cantidad: 0.15, // Retroceso alto - pistola potente
        arriba: 0.1,
        duracion: 100
      },
      multiplicadorHeadshot: 2.5, // Headshot: 225 daño (1 shot kill)
      semiAutomatica: true,
      dispersion: 0.02, // Precisa pero no perfecta
      apuntado: {
        zoom: 1.3,
        reduccionRetroceso: 0.5,
        tiempoTransicion: 0.18,
        posicionArma: { x: 0, y: -0.25, z: -0.08 },
        reduccionDispersion: 0.5
      }
    },
    
    // Sniper: One-shot potential, lento - Arma de especialista
    "SNIPER": {
      nombre: "AWP",
      descripcion: "Rifle de francotirador de alta precisión con potencial letal",
      tipo: "francotirador",
      cadenciaDisparo: 45, // 45 RPM (sincronizado con servidor: 60000/1333ms)
      daño: 200, // Actualizado: 200 de daño - mata de un disparo
      tamañoCargador: 1, // Solo 1 bala por cargador
      municionTotal: 10, // 10 balas máximo
      tiempoRecarga: 3.7, // Recarga muy lenta
      velocidadBala: 120.0, // Actualizado: velocidad máxima de 120
      modelo: "modelos/FBX/Weapons/AWP.fbx",
      sonidoDisparo: "sonidos/SNIPER.mp3",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.35, // Retroceso extremo
        arriba: 0.25,
        duracion: 300
      },
      multiplicadorHeadshot: 4.0, // Siempre letal
      semiAutomatica: true,
      dispersion: 0.001, // Perfectamente precisa con mira
      dispersionSinMira: 0.15, // Inútil sin mira
      penetracion: true, // Puede atravesar múltiples enemigos
      apuntado: {
        zoom: 6.0, // Zoom alto
        reduccionRetroceso: 0.2,
        tiempoTransicion: 0.5, // Lento para apuntar
        posicionArma: { x: 0, y: -0.05, z: -0.15 },
        reduccionDispersion: 0.05,
        miraTelescopica: true
      }
    },
    
    // Escopeta: Devastadora de cerca, inútil de lejos
    "ESCOPETA": {
      nombre: "Pump Shotgun",
      descripcion: "Escopeta devastadora en combate cercano con múltiples perdigones",
      tipo: "escopeta",
      cadenciaDisparo: 70, // 70 RPM (sincronizado con servidor: 60000/857ms)
      daño: 24, // Por perdigón (8 perdigones = 192 máximo)
      tamañoCargador: 3, // Solo 3 cartuchos por cargador
      municionTotal: 24, // 24 cartuchos máximo
      tiempoRecarga: 3.0, // 3 segundos
      velocidadBala: 38.0,
      modelo: "modelos/FBX/Weapons/Pump Shotgun.fbx",
      sonidoDisparo: "sonidos/ESCOPETA.mp3",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.25, // Retroceso fuerte
        arriba: 0.15,
        duracion: 200
      },
      proyectiles: 8, // 8 perdigones
      dispersion: 0.4, // Dispersión extrema - perdigones muy esparcidos
      falloffDaño: { // Daño cae drásticamente con distancia
        distanciaMinima: 8,
        distanciaMaxima: 25,
        dañoMinimo: 8
      },
      multiplicadorHeadshot: 1.5, // Menos multiplicador
      semiAutomatica: true,
      apuntado: {
        zoom: 1.2,
        reduccionRetroceso: 0.3,
        tiempoTransicion: 0.35,
        posicionArma: { x: 0, y: -0.1, z: -0.2 },
        reduccionDispersion: 0.6
      }
    },
    
    // MP5: SMG para rushes y eco - Movilidad y cadencia
    "MP5": {
      nombre: "MP5",
      descripcion: "Subfusil de alta cadencia ideal para combate rápido y móvil",
      tipo: "subfusil",
      cadenciaDisparo: 600, // 600 RPM - Cadencia reducida
      daño: 24, // Igual que servidor (200 vida / 24 daño = 9 balas para matar)
      tamañoCargador: 30,
      municionTotal: 240,
      tiempoRecarga: 2.0, // 2 segundos como servidor
      velocidadBala: 48.0,
      modelo: "modelos/FBX/Weapons/MP5.fbx",
      sonidoDisparo: "sonidos/MP5.mp3",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.045, // Retroceso bajo - fácil de controlar
        arriba: 0.025,
        duracion: 50
      },
      multiplicadorHeadshot: 2.0, // Headshot no letal
      dispersion: 0.04, // Menos precisa que rifles
      movilidadRapida: true, // Movimiento más rápido
      falloffDaño: { // Efectiva solo de cerca/medio
        distanciaMinima: 15,
        distanciaMaxima: 35,
        dañoMinimo: 18
      },
      apuntado: {
        zoom: 1.3,
        reduccionRetroceso: 0.7,
        tiempoTransicion: 0.18,
        posicionArma: { x: 0, y: -0.14, z: -0.15 },
        reduccionDispersion: 0.4
      }
    },

    // KNIFE: Cuchillo táctico para combate cuerpo a cuerpo
    // Requirements: 4.1, 4.2, 4.5, 5.1, 5.2, 5.3
    "KNIFE": {
      nombre: "Cuchillo",
      descripcion: "Cuchillo táctico para combate cuerpo a cuerpo",
      tipo: "melee",
      semiAutomatica: true,        // Solo un ataque por click (evita ataques múltiples)
      daño: 30,                    // 30 puntos de daño por ataque (balanceado)
      rangoAtaque: 3.0,            // 3 unidades de distancia (aumentado para mejor alcance)
      cadenciaAtaque: 350,         // ms entre ataques (más rápido)
      modelo: "modelos/valorants_knife_low_poly.glb",
      animacionAtaque: "modelos/animaciones/knife_attack_tps.glb",
      animacionAtaqueTPS: "modelos/animaciones/knife_attack_tps.glb",
      // Posición FPS: más alejado y a la derecha para verse bien
      posicion: { x: 0.35, y: -0.4, z: -0.5 },
      // Rotación FPS: agarre natural diagonal
      rotacion: { x: -0.2, y: Math.PI * 0.7, z: 0.15 },
      // Escala para tamaño apropiado en pantalla
      escala: { x: 0.6, y: 0.6, z: 0.6 }
    }
  },

  // Arma por defecto
  armaActual: "M4A1",

  dash: {
    cargasMaximas: 3,
    tiempoRecarga: 3000,
    poder: 5,
    duracion: 200,
    extensionMaxima: 3,        // Multiplicador máximo de extensión (3x distancia base)
    margenSalida: 0.5          // Margen después de salir de estructura (unidades)
  },

  enemigo: {
    vidaMaxima: 200,
    tiempoRespawn: 10000
  },

  bala: {
    tiempoVida: 10,
    distanciaMaxima: 300
  },

  controles: {
    sensibilidadMouse: 0.002
  },

  escena: {
    colorFondo: 0x87ceeb,
    tamañoSuelo: 50
  },

  // Configuración de red
  red: {
    habilitarMultijugador: true, // Cambiar a false para jugar sin servidor
    puertoServidor: 3000,
    reintentos: 3,
    tiempoEspera: 5000
  },

  // Configuración de límites del mapa (paredes invisibles)
  // Unidades de malla: X=4, Z=8 (escalado 5x = X=20, Z=40 en mundo)
  // Requirements: 3.1, 3.2, 3.3
  limitesMapa: {
    minX: -20,               // Límite mínimo en X (-4 unidades de malla * 5)
    maxX: 20,                // Límite máximo en X (4 unidades de malla * 5)
    minZ: -40,               // Límite mínimo en Z (-8 unidades de malla * 5)
    maxZ: 40,                // Límite máximo en Z (8 unidades de malla * 5)
    margenSeguridad: 0.5     // Margen de separación del límite
  },

  // Configuración del sistema de física Rapier3D
  // Requirements: 2.1, 2.2, 5.4
  fisica: {
    gravedad: -9.81,           // Gravedad del mundo (m/s²)
    alturaMaxEscalon: 0.8,     // Altura máxima de escalón automático (unidades) - aumentado para cajas/autos
    anguloMaxRampa: 50,        // Ángulo máximo de rampa caminable (grados) - aumentado para rampas empinadas
    offsetSuelo: 0.01,         // Offset para detección de suelo
    radioJugador: 0.4,         // Radio de la cápsula del jugador
    alturaJugador: 1.7,        // Altura de la cápsula del jugador (igual a alturaOjos)
    margenColision: 0.02       // Margen de separación de superficies
  },

  // Configuración del sistema de bots de entrenamiento
  // Requirements: 1.1, 2.1, 2.3, 3.1, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3
  // NOTA: Sistema sin zonas - bots distribuidos aleatoriamente por todo el mapa
  botsEntrenamiento: {
    // Bot estático: para práctica de puntería básica
    // Requirements: 1.1, 3.1, 3.2, 3.3
    estatico: {
      vida: 200,
      tiempoRespawn: 3000,      // ms antes de reaparecer
      color: 0xff0000,          // Rojo distintivo (fallback si modelo no carga)
      cantidad: 5               // Cantidad de bots estáticos en el mapa
    },
    // Bot móvil: para práctica de tracking
    // Requirements: 5.1, 5.2, 5.3, 5.4
    movil: {
      vida: 200,
      tiempoRespawn: 3000,
      color: 0x0088ff,          // Azul distintivo (fallback si modelo no carga)
      velocidad: 2,             // Unidades por segundo
      rangoMovimiento: 4,       // Distancia máxima desde posición inicial (reducido para evitar colisiones)
      cantidad: 4               // Cantidad de bots móviles en el mapa
    },
    // Bot tirador: para práctica de reacción
    // Requirements: 4.1, 4.2, 4.3, 4.4
    tirador: {
      vida: 200,
      tiempoRespawn: 5000,
      color: 0xff8800,          // Naranja distintivo (fallback si modelo no carga)
      cadenciaDisparo: 2000,    // ms entre disparos (Requirement 4.3)
      dañoReducido: 10,         // Daño de entrenamiento (menor que armas normales)
      velocidadBala: 30,        // Velocidad del proyectil (unidades/segundo)
      cantidad: 3               // Cantidad de bots tiradores en el mapa
    },
    // Configuración de distribución por el mapa (sin zonas)
    // Requirements: 2.1, 2.3, 6.1, 6.2, 6.3
    distribucion: {
      distanciaMinima: 5,       // Distancia mínima entre bots (evita superposición)
      margenBorde: 10           // Margen desde los límites del mapa (CONFIG.limitesMapa)
    }
  },

  // Configuración del sistema de curación (JuiceBox)
  // Requirements: 6.1, 6.2
  curacion: {
    modelo: "modelos/stylized_juicebox.glb",
    vidaCurada: 50,              // HP restaurados al completar curación
    tiempoCuracion: 2000,        // 2 segundos en ms
    // Posición FPS (primera persona)
    posicion: { x: 0.25, y: -0.35, z: -0.4 },
    rotacion: { x: 0, y: Math.PI * 0.3, z: 0.1 },
    escala: { x: 0.15, y: 0.15, z: 0.15 },
    // Configuración TPS (tercera persona para jugadores remotos)
    tps: {
      escala: 0.15,
      posicionOffset: { x: 0.02, y: 0.01, z: 0.03 },
      rotacionOffset: { x: 0, y: Math.PI * 0.5, z: 0 },
      nombresHuesoMano: ['hand_r', 'Hand_R', 'RightHand', 'mixamorigRightHand', 'hand.R']
    }
  },

  // Configuración del sistema de spawns de munición
  // Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
  spawnsAmmo: {
    porcentajeMunicion: 0.35,      // 35% de munición máxima del arma equipada
    tiempoRecarga: 10000,          // 10 segundos en ms para reactivar
    modelo: "modelos/ammo_pack.glb",
    escala: 0.04,
    radioRecoleccion: 1.5,         // Distancia para recoger (unidades)
    // Posiciones estratégicas de spawns en el mapa
    posiciones: [
      { x: 10, y: 0, z: 10 },
      { x: -10, y: 0, z: 10 },
      { x: 10, y: 0, z: -10 },
      { x: -10, y: 0, z: -10 },
      { x: 0, y: 0, z: 20 },
      { x: 0, y: 0, z: -20 }
    ]
  }
};
