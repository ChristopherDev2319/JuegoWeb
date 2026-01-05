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
      daño: 30, // Igual que servidor (200 vida / 30 daño = 7 balas para matar)
      tamañoCargador: 30,
      municionTotal: 210,
      tiempoRecarga: 2.0, // 2 segundos como servidor
      velocidadBala: 60.0,
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
      daño: 45, // Igual que servidor (200 vida / 45 daño = 5 balas para matar)
      tamañoCargador: 30,
      municionTotal: 210,
      tiempoRecarga: 2.5,
      velocidadBala: 63.0,
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
      daño: 20, // Igual que servidor (200 vida / 20 daño = 10 balas para matar)
      tamañoCargador: 7,
      municionTotal: 35,
      tiempoRecarga: 1.5, // 1.5 segundos como servidor
      velocidadBala: 45.0,
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
      daño: 150, // Actualizado: mata de un disparo al cuerpo
      tamañoCargador: 1, // Actualizado: 1 bala por cargador
      municionTotal: 10, // Actualizado: 10 balas máximo
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
      cadenciaDisparo: 68, // 68 RPM (lenta como debe ser)
      daño: 24, // Por perdigón (8 perdigones = 192 máximo, no mata de un disparo)
      tamañoCargador: 3,
      municionTotal: 28,
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
      cadenciaDisparo: 850, // 850 RPM como servidor
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
      nombre: "Knife",
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
