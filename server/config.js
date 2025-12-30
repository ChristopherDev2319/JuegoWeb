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
  spawnPoints: [            // Puntos de aparición en el mapa
    { x: -10, y: 1.7, z: -10 },
    { x: 10, y: 1.7, z: -10 },
    { x: -10, y: 1.7, z: 10 },
    { x: 10, y: 1.7, z: 10 }
  ],
  bounds: {                 // Límites del mapa
    min: -24,
    max: 24
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
  default: {
    damage: 30,              // Daño por bala
    fireRate: 75,            // Cadencia: 800 disparos por minuto (60000/75=800 RPM)
    magazineSize: 30,        // Balas por cargador
    totalAmmo: 120,          // Munición de reserva
    reloadTime: 2000,        // Tiempo de recarga: 2 segundos
    bulletSpeed: 35,         // Velocidad de bala para cálculos de hit
    headshotMultiplier: 2.0  // Daño x2 en headshot
  },

  // M4A1: Rifle de asalto versátil y fácil de controlar
  // Balas para matar: 7 (200 vida / 30 daño = 6.67 → 7 balas)
  // Tiempo para matar: ~525ms (7 balas × 75ms)
  M4A1: {
    damage: 30,              // Daño por bala
    fireRate: 75,            // Cadencia: 800 RPM (60000/75)
    magazineSize: 30,        // Balas por cargador
    totalAmmo: 120,          // Munición de reserva
    reloadTime: 2000,        // Tiempo de recarga: 2 segundos
    bulletSpeed: 35,         // Velocidad de bala para cálculos de hit
    headshotMultiplier: 2.0  // Daño x2 en headshot (60 daño)
  },

  // AK-47: Rifle de alto daño con retroceso pronunciado
  // Balas para matar: 5 (200 vida / 45 daño = 4.44 → 5 balas)
  // Tiempo para matar: ~545ms (5 balas × 109ms)
  AK47: {
    damage: 45,              // Daño por bala - alto
    fireRate: 109,           // Cadencia: 550 RPM (60000/109)
    magazineSize: 30,        // Balas por cargador
    totalAmmo: 90,           // Munición de reserva - menos que M4
    reloadTime: 2500,        // Tiempo de recarga: 2.5 segundos
    bulletSpeed: 35,         // Velocidad de bala para cálculos de hit
    headshotMultiplier: 2.0  // Daño x2 en headshot (90 daño)
  },

  // Pistola: Arma secundaria de último recurso
  // Balas para matar: 10 (200 vida / 20 daño = 10 balas)
  // Tiempo para matar: ~1500ms (10 balas × 150ms)
  PISTOLA: {
    damage: 20,              // Daño por bala - bajo
    fireRate: 150,           // Cadencia: 400 RPM (60000/150)
    magazineSize: 7,         // Balas por cargador - limitado
    totalAmmo: 35,           // Munición de reserva
    reloadTime: 1500,        // Tiempo de recarga: 1.5 segundos - rápido
    bulletSpeed: 25,         // Velocidad de bala - más lenta
    headshotMultiplier: 2.0  // Daño x2 en headshot (40 daño)
  },

  // Sniper (AWP): Rifle de francotirador de alto daño
  // Balas para matar: 2 al cuerpo (200 vida / 180 daño = 1.11 → 2 balas)
  // Un headshot mata instantáneamente (180 × 2.5 = 450 daño)
  SNIPER: {
    damage: 180,             // Daño por bala - muy alto
    fireRate: 1333,          // Cadencia: 45 RPM (60000/1333) - muy lento
    magazineSize: 5,         // Balas por cargador - muy limitado
    totalAmmo: 20,           // Munición de reserva - escasa
    reloadTime: 3500,        // Tiempo de recarga: 3.5 segundos - lento
    bulletSpeed: 80,         // Velocidad de bala - muy rápida
    headshotMultiplier: 2.5, // Daño x2.5 en headshot (450 daño - mata instantáneamente)
    hipfireSpread: 0.15,     // Dispersión sin apuntar - impreciso desde cadera
    aimSpreadReduction: 0.05 // Al apuntar es muy preciso (95% reducción dispersión)
  },

  // Escopeta: Arma de corto alcance con múltiples proyectiles
  // Daño máximo: 192 (12 perdigones × 16 daño)
  // Puede matar de un disparo a corta distancia si impactan todos los perdigones
  ESCOPETA: {
    damage: 16,              // Daño por perdigón
    fireRate: 857,           // Cadencia: 70 RPM (60000/857) - lento
    magazineSize: 8,         // Cartuchos por cargador
    totalAmmo: 32,           // Munición de reserva
    reloadTime: 3000,        // Tiempo de recarga: 3 segundos
    bulletSpeed: 18,         // Velocidad de perdigones - lenta
    projectiles: 12,         // Número de perdigones por disparo
    spread: 0.45,            // Dispersión de los perdigones
    headshotMultiplier: 1.5  // Daño x1.5 en headshot (24 daño por perdigón)
  },

  // MP5: Subfusil para combate cercano-medio
  // Balas para matar: 9 (200 vida / 24 daño = 8.33 → 9 balas)
  // Tiempo para matar: ~639ms (9 balas × 71ms)
  MP5: {
    damage: 24,              // Daño por bala - moderado
    fireRate: 71,            // Cadencia: 850 RPM (60000/71) - muy rápido
    magazineSize: 30,        // Balas por cargador
    totalAmmo: 120,          // Munición de reserva - abundante
    reloadTime: 2000,        // Tiempo de recarga: 2 segundos
    bulletSpeed: 28,         // Velocidad de bala - moderada
    headshotMultiplier: 2.0  // Daño x2 en headshot (48 daño)
  },

  // SCAR: Rifle de batalla - punto medio entre M4 y AK
  // Balas para matar: 6 (200 vida / 38 daño = 5.26 → 6 balas)
  // Tiempo para matar: ~552ms (6 balas × 92ms)
  SCAR: {
    damage: 38,              // Daño por bala - alto
    fireRate: 92,            // Cadencia: 650 RPM (60000/92)
    magazineSize: 20,        // Balas por cargador - menos que M4
    totalAmmo: 80,           // Munición de reserva
    reloadTime: 2300,        // Tiempo de recarga: 2.3 segundos
    bulletSpeed: 38,         // Velocidad de bala - rápida
    headshotMultiplier: 2.0  // Daño x2 en headshot (76 daño)
  },

  // SCP: Arma especial de alto daño
  // Balas para matar: 4 (200 vida / 52 daño = 3.85 → 4 balas)
  // Tiempo para matar: ~532ms (4 balas × 133ms)
  SCP: {
    damage: 52,              // Daño por bala - muy alto
    fireRate: 133,           // Cadencia: 450 RPM (60000/133) - moderado
    magazineSize: 25,        // Balas por cargador
    totalAmmo: 75,           // Munición de reserva
    reloadTime: 2800,        // Tiempo de recarga: 2.8 segundos
    bulletSpeed: 40,         // Velocidad de bala - rápida
    headshotMultiplier: 2.0  // Daño x2 en headshot (104 daño)
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
  duration: 200              // Duración del dash en milisegundos
};

// Configuración de balas/proyectiles
export const BULLET_CONFIG = {
  lifetime: 10000,           // Tiempo de vida máximo de una bala: 10 segundos
  maxDistance: 300           // Distancia máxima que puede recorrer una bala
};

// Configuración del servidor
export const SERVER_CONFIG = {
  port: 3000,                // Puerto del servidor
  tickRate: 20,              // Actualizaciones por segundo (optimizado para hosting en la nube)
  tickInterval: 1000 / 20    // Intervalo entre ticks: 50ms
};
