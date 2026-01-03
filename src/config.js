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
    // M4A1: Rifle versátil, equilibrado - META para rondas completas
    "M4A1": {
      nombre: "M4A1",
      descripcion: "Rifle de asalto versátil con buen equilibrio entre daño y precisión",
      tipo: "rifle",
      cadenciaDisparo: 666, // 666 RPM (como CS:GO)
      daño: 33, // 4 balas al cuerpo, 1 headshot
      tamañoCargador: 30,
      municionTotal: 120,
      tiempoRecarga: 3.1, // Recarga lenta para balancear
      velocidadBala: 40.0,
      modelo: "modelos/FBX/Weapons/M4A1.fbx",
      sonidoDisparo: "sonidos/M4A1.mp3",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.06, // Retroceso moderado
        arriba: 0.03,
        duracion: 60
      },
      multiplicadorHeadshot: 4.0, // Headshot letal
      dispersion: 0.02, // Preciso pero no perfecto
      apuntado: {
        zoom: 1.5,
        reduccionRetroceso: 0.5,
        tiempoTransicion: 0.25,
        posicionArma: { x: 0, y: -0.1, z: -0.2 },
        reduccionDispersion: 0.3
      }
    },
    
    // AK-47: Alto daño, alto retroceso - Riesgo/Recompensa
    "AK47": {
      nombre: "AK-47",
      descripcion: "Rifle de asalto potente con alto retroceso pero gran daño",
      tipo: "rifle",
      cadenciaDisparo: 600, // 600 RPM (como CS:GO)
      daño: 36, // 3 balas al cuerpo, 1 headshot
      tamañoCargador: 30,
      municionTotal: 90,
      tiempoRecarga: 2.5,
      velocidadBala: 42.0,
      modelo: "modelos/FBX/Weapons/AK47.fbx",
      sonidoDisparo: "sonidos/AK47.mp3",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: 0, z: 0 },
      retroceso: {
        cantidad: 0.12, // Retroceso alto - difícil de controlar
        arriba: 0.08,
        duracion: 90
      },
      multiplicadorHeadshot: 4.0, // Headshot letal
      dispersion: 0.035, // Menos preciso que M4A1
      apuntado: {
        zoom: 1.4,
        reduccionRetroceso: 0.4, // Menos reducción que M4A1
        tiempoTransicion: 0.3,
        posicionArma: { x: 0, y: -0.12, z: -0.25 },
        reduccionDispersion: 0.4
      }
    },
    
    // Pistola: Eco rounds, precisión - Arma económica
    "PISTOLA": {
      nombre: "Colt 1911",
      descripcion: "Pistola semiautomática precisa y confiable para combate cercano",
      tipo: "pistola",
      cadenciaDisparo: 267, // 267 RPM (semi-auto realista)
      daño: 35, // 3 balas al cuerpo, 1 headshot de cerca
      tamañoCargador: 7,
      municionTotal: 35,
      tiempoRecarga: 2.2,
      velocidadBala: 30.0,
      modelo: "modelos/FBX/Weapons/1911.fbx",
      sonidoDisparo: "sonidos/pistola.mp3",
      posicion: { x: 0.2, y: -0.4, z: -0.3 },
      rotacion: { x: 0, y: 0, z: 0 },
      retroceso: {
        cantidad: 0.08, // Retroceso notable pero manejable
        arriba: 0.04,
        duracion: 70
      },
      multiplicadorHeadshot: 4.0, // Headshot letal de cerca
      semiAutomatica: true,
      dispersion: 0.015, // Muy precisa
      falloffDaño: { // Daño disminuye con distancia
        distanciaMinima: 10,
        distanciaMaxima: 30,
        dañoMinimo: 20
      },
      apuntado: {
        zoom: 1.25,
        reduccionRetroceso: 0.6,
        tiempoTransicion: 0.15,
        posicionArma: { x: 0, y: -0.25, z: -0.08 },
        reduccionDispersion: 0.5
      }
    },
    
    // Sniper: One-shot potential, lento - Arma de especialista
    "SNIPER": {
      nombre: "AWP",
      descripcion: "Rifle de francotirador de alta precisión con potencial letal",
      tipo: "francotirador",
      cadenciaDisparo: 41, // 41 RPM (muy lento como CS:GO)
      daño: 115, // 1 shot kill al cuerpo, siempre letal headshot
      tamañoCargador: 10,
      municionTotal: 30,
      tiempoRecarga: 3.7, // Recarga muy lenta
      velocidadBala: 85.0, // Muy rápida
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
      cadenciaDisparo: 68, // 68 RPM (lenta como debe ser)
      daño: 26, // Por perdigón (8 perdigones = 208 máximo)
      tamañoCargador: 7, // Menos munición
      municionTotal: 28,
      tiempoRecarga: 4.2, // Recarga muy lenta
      velocidadBala: 25.0, // Lenta
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
      dispersion: 0.08, // Dispersión moderada
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
      cadenciaDisparo: 800, // 800 RPM (alta cadencia)
      daño: 26, // 4 balas al cuerpo, 2 headshots
      tamañoCargador: 30,
      municionTotal: 120,
      tiempoRecarga: 2.6,
      velocidadBala: 32.0,
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
    
    // SCAR: Rifle de batalla pesado - Daño alto, cadencia media
    "SCAR": {
      nombre: "SCAR-H",
      descripcion: "Rifle de batalla pesado con gran poder de parada y alcance",
      tipo: "rifle",
      cadenciaDisparo: 625, // 625 RPM (entre M4A1 y AK47)
      daño: 40, // Más daño que M4A1 pero menos que AK47
      tamañoCargador: 20, // Cargador más pequeño
      municionTotal: 80,
      tiempoRecarga: 2.8,
      velocidadBala: 45.0,
      modelo: "modelos/FBX/Weapons/SCAR.fbx",
      sonidoDisparo: "sonidos/SCAR.mp3",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.09, // Retroceso moderado-alto
        arriba: 0.05,
        duracion: 75
      },
      multiplicadorHeadshot: 4.0, // Headshot letal
      dispersion: 0.025, // Precisión buena pero no perfecta
      apuntado: {
        zoom: 1.6,
        reduccionRetroceso: 0.45,
        tiempoTransicion: 0.28,
        posicionArma: { x: 0, y: -0.08, z: -0.18 },
        reduccionDispersion: 0.35
      }
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

  // Configuración de límites del mapa (paredes exteriores)
  // Requirements: 3.1, 3.2, 3.3
  limitesMapa: {
    minX: -122,              // Límite mínimo en X
    maxX: 122,               // Límite máximo en X
    minZ: -122,              // Límite mínimo en Z
    maxZ: 122,               // Límite máximo en Z
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
  // Requirements: 1.1, 2.1, 3.1, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3
  botsEntrenamiento: {
    // Bot estático: para práctica de puntería básica
    // Requirements: 1.1, 5.1
    estatico: {
      vida: 100,
      tiempoRespawn: 3000,      // ms antes de reaparecer
      color: 0xff0000,          // Rojo distintivo
      cantidad: 5               // Bots por zona
    },
    // Bot móvil: para práctica de tracking
    // Requirements: 2.1, 5.2
    movil: {
      vida: 100,
      tiempoRespawn: 3000,
      color: 0x0088ff,          // Azul distintivo
      velocidad: 2,             // Unidades por segundo
      rangoMovimiento: 8,       // Distancia máxima desde posición inicial
      cantidad: 4
    },
    // Bot tirador: para práctica de reacción
    // Requirements: 3.1, 5.3
    tirador: {
      vida: 150,
      tiempoRespawn: 5000,
      color: 0xff8800,          // Naranja distintivo
      cadenciaDisparo: 1500,    // ms entre disparos
      dañoReducido: 10,         // Daño de entrenamiento (menor que armas normales)
      rangoVision: 30,          // Distancia máxima de detección del jugador
      cantidad: 3
    },
    // Zonas de entrenamiento separadas
    // Requirements: 4.1, 4.2, 4.3
    zonas: {
      estaticos: { 
        centro: { x: -20, y: 1, z: 0 }, 
        radio: 15,
        nombre: 'Zona de Puntería'
      },
      moviles: { 
        centro: { x: 20, y: 1, z: 0 }, 
        radio: 15,
        nombre: 'Zona de Tracking'
      },
      tiradores: { 
        centro: { x: 0, y: 1, z: -30 }, 
        radio: 15,
        nombre: 'Zona de Reacción'
      }
    }
  }
};
