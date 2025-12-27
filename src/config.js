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

  arma: {
    nombre: "M4A1",
    cadenciaDisparo: 400,
    daño: 20,
    tamañoCargador: 30,
    municionTotal: 120,
    tiempoRecarga: 2.0,
    velocidadBala: 15.0,
    retroceso: {
      cantidad: 0.15,
      arriba: 0.05,
      duracion: 80
    }
  },

  dash: {
    cargasMaximas: 3,
    tiempoRecarga: 3000,
    poder: 2.5,
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
  }
};
