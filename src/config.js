/**
 * Configuración del juego FPS Three.js
 * Contiene todas las constantes configurables del juego
 */

export const CONFIG = {
  jugador: {
    velocidad: 0.15,
    poderSalto: 0.25,
    alturaOjos: 1.7,
    limites: {
      min: -24,
      max: 24
    },
    gravedad: 0.015
  },

  armas: {
    "M4A1": {
      nombre: "M4A1",
      tipo: "rifle",
      cadenciaDisparo: 400,
      daño: 20,
      tamañoCargador: 30,
      municionTotal: 120,
      tiempoRecarga: 2.0,
      velocidadBala: 30.0,
      modelo: "modelos/FBX/Weapons/M4A1.fbx",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.05,
        arriba: 0.02,
        duracion: 60
      },
      apuntado: {
        zoom: 1.5,
        reduccionRetroceso: 0.6,
        tiempoTransicion: 0.2,
        posicionArma: { x: 0, y: -0.1, z: -0.2 }
      }
    },
    "AK47": {
      nombre: "AK-47",
      tipo: "rifle",
      cadenciaDisparo: 600,
      daño: 30,
      tamañoCargador: 30,
      municionTotal: 90,
      tiempoRecarga: 2.5,
      velocidadBala: 35.0,
      modelo: "modelos/FBX/Weapons/AK47.fbx",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: 0, z: 0 }, // AK47 al derecho
      retroceso: {
        cantidad: 0.08,
        arriba: 0.04,
        duracion: 80
      },
      apuntado: {
        zoom: 1.4,
        reduccionRetroceso: 0.5,
        tiempoTransicion: 0.25,
        posicionArma: { x: 0, y: -0.12, z: -0.25 }
      }
    },
    "PISTOLA": {
      nombre: "Colt 1911",
      tipo: "pistola",
      cadenciaDisparo: 300,
      daño: 15,
      tamañoCargador: 7,
      municionTotal: 35,
      tiempoRecarga: 1.5,
      velocidadBala: 25.0,
      modelo: "modelos/FBX/Weapons/1911.fbx",
      posicion: { x: 0.2, y: -0.4, z: -0.3 },
      rotacion: { x: 0, y: 0, z: 0 }, // 1911 al derecho
      retroceso: {
        cantidad: 0.03,
        arriba: 0.01,
        duracion: 40
      },
      apuntado: {
        zoom: 1.2,
        reduccionRetroceso: 0.7,
        tiempoTransicion: 0.15,
        posicionArma: { x: 0, y: -0.05, z: -0.1 }
      }
    },
    "SNIPER": {
      nombre: "AWP",
      tipo: "francotirador",
      cadenciaDisparo: 60,
      daño: 100,
      tamañoCargador: 5,
      municionTotal: 20,
      tiempoRecarga: 3.0,
      velocidadBala: 50.0,
      modelo: "modelos/FBX/Weapons/AWP.fbx",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.15,
        arriba: 0.08,
        duracion: 150
      },
      apuntado: {
        zoom: 4.0,
        reduccionRetroceso: 0.3,
        tiempoTransicion: 0.4,
        posicionArma: { x: 0, y: -0.15, z: -0.3 },
        miraTelescopica: true
      }
    },
    "ESCOPETA": {
      nombre: "Pump Shotgun",
      tipo: "escopeta",
      cadenciaDisparo: 120,
      daño: 80,
      tamañoCargador: 8,
      municionTotal: 32,
      tiempoRecarga: 2.8,
      velocidadBala: 20.0,
      modelo: "modelos/FBX/Weapons/Pump Shotgun.fbx",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.12,
        arriba: 0.06,
        duracion: 120
      },
      proyectiles: 8, // Múltiples proyectiles por disparo
      dispersion: 0.1, // Dispersión de los proyectiles
      apuntado: {
        zoom: 1.3,
        reduccionRetroceso: 0.4,
        tiempoTransicion: 0.3,
        posicionArma: { x: 0, y: -0.1, z: -0.2 },
        reduccionDispersion: 0.6
      }
    },
    "MP5": {
      nombre: "MP5",
      tipo: "subfusil",
      cadenciaDisparo: 800,
      daño: 18,
      tamañoCargador: 30,
      municionTotal: 120,
      tiempoRecarga: 2.2,
      velocidadBala: 28.0,
      modelo: "modelos/FBX/Weapons/MP5.fbx",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.04,
        arriba: 0.02,
        duracion: 50
      },
      apuntado: {
        zoom: 1.3,
        reduccionRetroceso: 0.6,
        tiempoTransicion: 0.18,
        posicionArma: { x: 0, y: -0.08, z: -0.15 }
      }
    },
    "SCAR": {
      nombre: "SCAR-H",
      tipo: "rifle",
      cadenciaDisparo: 500,
      daño: 35,
      tamañoCargador: 20,
      municionTotal: 80,
      tiempoRecarga: 2.3,
      velocidadBala: 38.0,
      modelo: "modelos/FBX/Weapons/SCAR.fbx",
      posicion: { x: 0.3, y: -0.3, z: -0.5 },
      rotacion: { x: 0, y: Math.PI, z: 0 },
      retroceso: {
        cantidad: 0.09,
        arriba: 0.05,
        duracion: 90
      },
      apuntado: {
        zoom: 1.6,
        reduccionRetroceso: 0.5,
        tiempoTransicion: 0.28,
        posicionArma: { x: 0, y: -0.13, z: -0.28 }
      }
    },
    "USP": {
      nombre: "USP .45",
      tipo: "pistola",
      cadenciaDisparo: 250,
      daño: 22,
      tamañoCargador: 12,
      municionTotal: 48,
      tiempoRecarga: 1.8,
      velocidadBala: 27.0,
      modelo: "modelos/FBX/Weapons/USP.fbx",
      posicion: { x: 0.2, y: -0.4, z: -0.3 },
      rotacion: { x: 0, y: 0, z: 0 }, // USP al derecho
      retroceso: {
        cantidad: 0.04,
        arriba: 0.02,
        duracion: 50
      },
      apuntado: {
        zoom: 1.25,
        reduccionRetroceso: 0.65,
        tiempoTransicion: 0.16,
        posicionArma: { x: 0, y: -0.06, z: -0.12 }
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
  }
};
