/**
 * Módulo de Configuración del Servidor
 * Contiene todas las constantes de configuración del juego del lado del servidor
 * 
 * IMPORTANTE: Este archivo es la ÚNICA fuente de verdad para valores de gameplay.
 * El cliente NO debe tener estos valores - solo recibe confirmaciones del servidor.
 * 
 * Requisitos: 5.2, 5.3, 5.5, 6.4, 7.4
 */

// Configuración del jugador
export const PLAYER_CONFIG = {
  maxHealth: 200,           // Vida máxima del jugador
  speed: 0.15,              // Velocidad de movimiento base
  jumpPower: 0.25,          // Fuerza del salto
  eyeHeight: 1.7,           // Altura de los ojos (para cámara en primera persona)
  gravity: 0.015,           // Gravedad aplicada al jugador
  respawnTime: 5000,        // Tiempo de reaparición en milisegundos (Requisito 5.5)
  spawnPoints: [            // Puntos de aparición en el mapa (dentro del área jugable)
    { x: -15, y: 1.7, z: -15 },
    { x: 15, y: 1.7, z: -15 },
    { x: -15, y: 1.7, z: 15 },
    { x: 15, y: 1.7, z: 15 },
    { x: 0, y: 1.7, z: 0 }
  ],
  bounds: {                 // Límites del mapa (escalado 5x)
    min: -125,
    max: 125
  }
};

/**
 * Configuración de armas - VALORES AUTORITATIVOS DE GAMEPLAY
 * 
 * Cada arma debe tener las siguientes propiedades obligatorias:
 * - damage: Daño por bala/proyectil
 * - fireRate: Milisegundos entre disparos (menor = más rápido)
 * - magazineSize: Cantidad de balas por cargador
 * - totalAmmo: Munición total disponible (sin contar cargador actual)
 * - reloadTime: Tiempo de recarga en milisegundos
 * - bulletSpeed: Velocidad de la bala para cálculos de impacto
 * - headshotMultiplier: Multiplicador de daño por tiro a la cabeza
 * 
 * Propiedades opcionales:
 * - projectiles: Número de proyectiles por disparo (escopetas)
 * - spread: Dispersión de los proyectiles (escopetas)
 * - hipfireSpread: Dispersión al disparar sin apuntar (francotiradores)
 * - aimSpreadReduction: Reducción de dispersión al apuntar
 * 
 * Requisitos: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 5.2, 5.3, 6.4
 */
export const WEAPON_CONFIG = {
  // Arma por defecto - se usa como fallback si no se encuentra el arma solicitada
  // Requisitos: 1.1 - Velocidad incrementada 50%
  default: {
    damage: 30,              // Daño por bala
    fireRate: 75,            // Cadencia: 800 disparos por minuto (60000/75=800 RPM)
    magazineSize: 30,        // Balas por cargador
    totalAmmo: 210,          // Munición de reserva - Actualizado
    reloadTime: 2000,        // Tiempo de recarga: 2 segundos
    bulletSpeed: 60,         // Velocidad de bala - Actualizado: 35 → 60 (incremento 50%)
    headshotMultiplier: 2.0  // Daño x2 en headshot
  },

  // M4A1: Rifle de asalto versátil y fácil de controlar
  // Balas para matar: 7 (200 vida / 30 daño = 6.67 → 7 balas)
  // Tiempo para matar: ~525ms (7 balas × 75ms)
  // Requisitos: 1.1, 6.1 - Velocidad incrementada 50%, munición 210
  M4A1: {
    damage: 30,              // Daño por bala
    fireRate: 75,            // Cadencia: 800 RPM (60000/75)
    magazineSize: 30,        // Balas por cargador
    totalAmmo: 210,          // Munición de reserva - Actualizado (Requisito 6.1)
    reloadTime: 2000,        // Tiempo de recarga: 2 segundos
    bulletSpeed: 60,         // Velocidad de bala - Actualizado: 35 → 60 (incremento 50%, Requisito 1.1)
    headshotMultiplier: 2.0  // Daño x2 en headshot (60 daño)
  },

  // AK-47: Rifle de alto daño con retroceso pronunciado
  // Balas para matar: 5 (200 vida / 45 daño = 4.44 → 5 balas)
  // Tiempo para matar: ~545ms (5 balas × 109ms)
  // Requisitos: 1.1, 6.1 - Velocidad incrementada 50%, munición 210
  AK47: {
    damage: 45,              // Daño por bala - alto
    fireRate: 109,           // Cadencia: 550 RPM (60000/109)
    magazineSize: 30,        // Balas por cargador
    totalAmmo: 210,          // Munición de reserva - Actualizado (Requisito 6.1)
    reloadTime: 2500,        // Tiempo de recarga: 2.5 segundos
    bulletSpeed: 63,         // Velocidad de bala - Actualizado: 35 → 63 (incremento 50%, Requisito 1.1)
    headshotMultiplier: 2.0  // Daño x2 en headshot (90 daño)
  },

  // Pistola: Arma secundaria de último recurso
  // Balas para matar: 10 (200 vida / 20 daño = 10 balas)
  // Tiempo para matar: ~1500ms (10 balas × 150ms)
  // Requisitos: 1.1, 6.6 - Velocidad incrementada 50%
  PISTOLA: {
    damage: 20,              // Daño por bala - bajo
    fireRate: 150,           // Cadencia: 400 RPM (60000/150)
    magazineSize: 7,         // Balas por cargador - limitado
    totalAmmo: 35,           // Munición de reserva
    reloadTime: 1500,        // Tiempo de recarga: 1.5 segundos - rápido
    bulletSpeed: 45,         // Velocidad de bala - Actualizado: 25 → 45 (incremento 50%, Requisito 1.1)
    headshotMultiplier: 2.0  // Daño x2 en headshot (40 daño)
  },

  // Sniper (AWP): Rifle de francotirador de alto daño - ONE SHOT KILL
  // Mata de un disparo al cuerpo (150 daño > 100 vida típica)
  // Requisitos: 1.1, 1.3, 2.1, 2.2, 6.5 - Daño 150, velocidad 120, munición 10, cargador 1
  SNIPER: {
    damage: 150,             // Daño por bala - Actualizado: mata de un disparo (Requisito 2.1)
    fireRate: 1333,          // Cadencia: 45 RPM (60000/1333) - muy lento
    magazineSize: 1,         // Balas por cargador - Actualizado: 1 bala (Requisito 6.5)
    totalAmmo: 10,           // Munición de reserva - Actualizado: 10 balas (Requisito 2.2)
    reloadTime: 3700,        // Tiempo de recarga: 3.7 segundos (Requisito 2.3)
    bulletSpeed: 120,        // Velocidad de bala - Actualizado: 120 (Requisito 1.3)
    headshotMultiplier: 2.5, // Daño x2.5 en headshot (375 daño - mata instantáneamente)
    hipfireSpread: 0.15,     // Dispersión sin apuntar - impreciso desde cadera
    aimSpreadReduction: 0.05 // Al apuntar es muy preciso (95% reducción dispersión)
  },

  // Escopeta: Arma de corto alcance con múltiples proyectiles
  // Daño máximo: 192 (8 perdigones × 24 daño)
  // NO mata de un disparo - requiere 2 disparos mínimo
  // Requisitos: 1.1, 6.3, 6.4 - Velocidad incrementada 50%, cargador 3, daño 24
  ESCOPETA: {
    damage: 24,              // Daño por perdigón - Actualizado (no mata de un disparo)
    fireRate: 857,           // Cadencia: 70 RPM (60000/857) - lento
    magazineSize: 3,         // Cartuchos por cargador
    totalAmmo: 28,           // Munición de reserva
    reloadTime: 3000,        // Tiempo de recarga: 3 segundos
    bulletSpeed: 38,         // Velocidad de perdigones
    projectiles: 8,          // Número de perdigones por disparo
    spread: 0.45,            // Dispersión de los perdigones
    headshotMultiplier: 1.5  // Daño x1.5 en headshot (36 daño por perdigón)
  },

  // MP5: Subfusil para combate cercano-medio
  // Balas para matar: 9 (200 vida / 24 daño = 8.33 → 9 balas)
  // Tiempo para matar: ~639ms (9 balas × 71ms)
  // Requisitos: 1.1, 6.2 - Velocidad incrementada 50%, munición 240
  MP5: {
    damage: 24,              // Daño por bala - moderado
    fireRate: 71,            // Cadencia: 850 RPM (60000/71) - muy rápido
    magazineSize: 30,        // Balas por cargador
    totalAmmo: 240,          // Munición de reserva - Actualizado (Requisito 6.2)
    reloadTime: 2000,        // Tiempo de recarga: 2 segundos
    bulletSpeed: 48,         // Velocidad de bala - Actualizado: 28 → 48 (incremento 50%, Requisito 1.1)
    headshotMultiplier: 2.0  // Daño x2 en headshot (48 daño)
  },

  // KNIFE: Cuchillo táctico para combate cuerpo a cuerpo
  // Requisitos: 4.1, 4.4 - Daño 30, sin munición requerida
  KNIFE: {
    damage: 30,              // Daño por ataque (balanceado)
    fireRate: 350,           // Cadencia de ataque: 350ms entre ataques
    magazineSize: 0,         // Sin cargador - arma melee
    totalAmmo: 0,            // Sin munición - ataques ilimitados (Requisito 4.4)
    reloadTime: 0,           // Sin recarga
    bulletSpeed: 0,          // Sin proyectil - ataque melee
    headshotMultiplier: 1.0, // Sin multiplicador de headshot
    type: 'melee',           // Tipo de arma
    attackRange: 3           // Rango de ataque: 3 unidades (aumentado)
  },

  // JUICEBOX: Item de curación (no es un arma, pero necesita estar en la config)
  // Se usa para sincronizar el estado de curación entre jugadores
  JUICEBOX: {
    damage: 0,               // Sin daño
    fireRate: 0,             // Sin cadencia
    magazineSize: 0,         // Sin cargador
    totalAmmo: 0,            // Sin munición
    reloadTime: 0,           // Sin recarga
    bulletSpeed: 0,          // Sin proyectil
    headshotMultiplier: 0,   // Sin multiplicador
    type: 'healing',         // Tipo de item
    healAmount: 50,          // Cantidad de vida que restaura
    healTime: 2000           // Tiempo de curación en ms
  }
};

/**
 * Obtiene la configuración de un arma específica
 * Si el arma no existe, retorna la configuración por defecto
 * 
 * @param {string} weaponType - Tipo/nombre del arma
 * @returns {Object} - Configuración del arma con todos los valores de gameplay
 */
export function getWeaponConfig(weaponType) {
  return WEAPON_CONFIG[weaponType] || WEAPON_CONFIG.default;
}

// Configuración del dash (movimiento rápido)
// Requisito 7.4
export const DASH_CONFIG = {
  maxCharges: 3,             // Cargas máximas de dash disponibles
  rechargeTime: 3000,        // Tiempo de recarga por carga: 3 segundos
  power: 5,                  // Potencia/distancia del dash
  duration: 200,             // Duración del dash en milisegundos
  maxDistance: 5.5           // Distancia máxima permitida (5 + 10% margen)
};

// Configuración de límites del mapa (paredes exteriores)
// Sincronizado con cliente - Requirements: 5.2, 5.3
export const MAP_LIMITS = {
  minX: -122,                // Límite mínimo en X
  maxX: 122,                 // Límite máximo en X
  minZ: -122,                // Límite mínimo en Z
  maxZ: 122,                 // Límite máximo en Z
  margenSeguridad: 0.5       // Margen de separación del límite
};

// Configuración de balas/proyectiles
export const BULLET_CONFIG = {
  lifetime: 10000,           // Tiempo de vida máximo de una bala: 10 segundos
  maxDistance: 300           // Distancia máxima que puede recorrer una bala
};

// Configuración del servidor
export const SERVER_CONFIG = {
  port: 3000,                // Puerto del servidor
  tickRate: 30,              // Actualizaciones por segundo
  tickInterval: 1000 / 30    // Intervalo entre ticks: ~33.33ms
};
