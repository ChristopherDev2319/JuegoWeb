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
    // M4A1: Versátil, fácil de controlar - 6 balas para matar (200/35=5.7)
    "M4A1": {
      nombre: "M4A1",
      tipo: "rifle",
      cadenciaDisparo: 800, // 800 RPM
      daño: 35,
      tamañoCargador: 30,
      municionTotal: 120,
      tiempoRecarga: 2.0,
      velocidadBala: 35.0,
      modelo: "modelos/FBX/Weapons/M4A1.fbx",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.04,
        arriba: 0.02,
        duracion: 50
      },
      multiplicadorHeadshot: 2.0,
      apuntado: {
        zoom: 1.5,
        reduccionRetroceso: 0.6,
        tiempoTransicion: 0.2,
        posicionArma: { x: 0, y: -0.1, z: -0.2 }
      }
    },
    // AK-47: Mucho daño, retroceso alto - 4 balas para matar (200/50=4)
    "AK47": {
      nombre: "AK-47",
      tipo: "rifle",
      cadenciaDisparo: 550, // 550 RPM
      daño: 50,
      tamañoCargador: 30,
      municionTotal: 90,
      tiempoRecarga: 2.5,
      velocidadBala: 35.0,
      modelo: "modelos/FBX/Weapons/AK47.fbx",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: 0, z: 0 },
      retroceso: {
        cantidad: 0.10,
        arriba: 0.06,
        duracion: 80
      },
      multiplicadorHeadshot: 2.0,
      apuntado: {
        zoom: 1.4,
        reduccionRetroceso: 0.5,
        tiempoTransicion: 0.25,
        posicionArma: { x: 0, y: -0.12, z: -0.25 }
      }
    },
    // Pistola: Último recurso, precisa - 10 balas para matar (200/20=10)
    "PISTOLA": {
      nombre: "Colt 1911",
      tipo: "pistola",
      cadenciaDisparo: 400, // 400 RPM
      daño: 20,
      tamañoCargador: 7,
      municionTotal: 35,
      tiempoRecarga: 1.5,
      velocidadBala: 25.0,
      modelo: "modelos/FBX/Weapons/1911.fbx",
      posicion: { x: 0.2, y: -0.4, z: -0.3 },
      rotacion: { x: 0, y: 0, z: 0 },
      retroceso: {
        cantidad: 0.03,
        arriba: 0.015,
        duracion: 40
      },
      multiplicadorHeadshot: 2.0,
      semiAutomatica: true, // No dispara manteniendo click
      apuntado: {
        zoom: 1.2,
        reduccionRetroceso: 0.7,
        tiempoTransicion: 0.15,
        posicionArma: { x: 0, y: -0.25, z: -0.08 }
      }
    },
    // Sniper: 2 tiros al cuerpo, 1 headshot - (200/180=1.1, headshot=360)
    "SNIPER": {
      nombre: "AWP",
      tipo: "francotirador",
      cadenciaDisparo: 45, // 45 RPM
      daño: 180,
      tamañoCargador: 5,
      municionTotal: 20,
      tiempoRecarga: 3.5,
      velocidadBala: 60.0,
      modelo: "modelos/FBX/Weapons/AWP.fbx",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.20,
        arriba: 0.12,
        duracion: 200
      },
      multiplicadorHeadshot: 2.5,
      semiAutomatica: true, // No dispara manteniendo click
      apuntado: {
        zoom: 4.0,
        reduccionRetroceso: 0.3,
        tiempoTransicion: 0.4,
        posicionArma: { x: 0, y: -0.15, z: -0.3 },
        miraTelescopica: true
      }
    },
    // Escopeta: One-shot de cerca, 12 perdigones x 15 daño = 180 máx
    "ESCOPETA": {
      nombre: "Pump Shotgun",
      tipo: "escopeta",
      cadenciaDisparo: 70, // 70 RPM
      daño: 15, // Por perdigón
      tamañoCargador: 8,
      municionTotal: 32,
      tiempoRecarga: 3.0,
      velocidadBala: 18.0,
      modelo: "modelos/FBX/Weapons/Pump Shotgun.fbx",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.15,
        arriba: 0.08,
        duracion: 150
      },
      proyectiles: 12, // 12 perdigones
      dispersion: 0.55, // Dispersión muy alta
      multiplicadorHeadshot: 1.5,
      semiAutomatica: true,
      apuntado: {
        zoom: 1.3,
        reduccionRetroceso: 0.4,
        tiempoTransicion: 0.3,
        posicionArma: { x: 0, y: -0.1, z: -0.2 },
        reduccionDispersion: 0.5
      }
    },
    // MP5: Combate cercano, alta cadencia - 8 balas para matar (200/28=7.1)
    "MP5": {
      nombre: "MP5",
      tipo: "subfusil",
      cadenciaDisparo: 850, // 850 RPM
      daño: 28,
      tamañoCargador: 30,
      municionTotal: 120,
      tiempoRecarga: 2.0,
      velocidadBala: 28.0,
      modelo: "modelos/FBX/Weapons/MP5.fbx",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.035,
        arriba: 0.018,
        duracion: 45
      },
      multiplicadorHeadshot: 2.0,
      apuntado: {
        zoom: 1.3,
        reduccionRetroceso: 0.6,
        tiempoTransicion: 0.18,
        posicionArma: { x: 0, y: -0.14, z: -0.15 }
      }
    }
  },

  // Arma por defecto
  armaActual: "M4A1",

  dash: {
    cargasMaximas: 3,
    tiempoRecarga: 3000,
    poder: 5,
    duracion: 200
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
  }
};
