/**
 * Server Configuration Module
 * Contains all server-side game configuration constants
 * 
 * Requirements: 5.3, 5.5, 6.4, 7.4
 */

export const PLAYER_CONFIG = {
  maxHealth: 200,
  speed: 0.15,
  jumpPower: 0.25,
  eyeHeight: 1.7,
  gravity: 0.015,
  respawnTime: 5000, // 5 seconds (Requirement 5.5)
  spawnPoints: [
    { x: -10, y: 1.7, z: -10 },
    { x: 10, y: 1.7, z: -10 },
    { x: -10, y: 1.7, z: 10 },
    { x: 10, y: 1.7, z: 10 }
  ],
  bounds: {
    min: -24,
    max: 24
  }
};

// Configuración de armas por tipo (Requirement 5.3, 6.4)
export const WEAPON_CONFIG = {
  // Arma por defecto (fallback)
  default: {
    damage: 35,
    fireRate: 75, // 800 RPM = 75ms
    magazineSize: 30,
    totalAmmo: 120,
    reloadTime: 2000,
    bulletSpeed: 35,
    headshotMultiplier: 2.0
  },
  // M4A1: Versátil, fácil de controlar - 6 balas para matar
  M4A1: {
    damage: 35,
    fireRate: 75, // 800 RPM
    magazineSize: 30,
    totalAmmo: 120,
    reloadTime: 2000,
    bulletSpeed: 35,
    headshotMultiplier: 2.0
  },
  // AK-47: Mucho daño, retroceso alto - 4 balas para matar
  AK47: {
    damage: 50,
    fireRate: 109, // 550 RPM
    magazineSize: 30,
    totalAmmo: 90,
    reloadTime: 2500,
    bulletSpeed: 35,
    headshotMultiplier: 2.0
  },
  // Pistola: Último recurso - 10 balas para matar (200/20=10)
  PISTOLA: {
    damage: 20,
    fireRate: 150, // 400 RPM
    magazineSize: 7,
    totalAmmo: 35,
    reloadTime: 1500,
    bulletSpeed: 25,
    headshotMultiplier: 2.0
  },
  // Sniper: 2 tiros al cuerpo, 1 headshot
  SNIPER: {
    damage: 180,
    fireRate: 1333, // 45 RPM
    magazineSize: 5,
    totalAmmo: 20,
    reloadTime: 3500,
    bulletSpeed: 60,
    headshotMultiplier: 2.5
  },
  // Escopeta: 12 perdigones x 15 daño = 180 máx
  ESCOPETA: {
    damage: 15, // Por perdigón
    fireRate: 857, // 70 RPM
    magazineSize: 8,
    totalAmmo: 32,
    reloadTime: 3000,
    bulletSpeed: 18,
    projectiles: 12,
    spread: 0.55, // Dispersión muy alta
    headshotMultiplier: 1.5
  },
  // MP5: Combate cercano - 8 balas para matar
  MP5: {
    damage: 28,
    fireRate: 71, // 850 RPM
    magazineSize: 30,
    totalAmmo: 120,
    reloadTime: 2000,
    bulletSpeed: 28,
    headshotMultiplier: 2.0
  },
  // SCAR: Punto medio M4/AK - 5 balas para matar
  SCAR: {
    damage: 42,
    fireRate: 92, // 650 RPM
    magazineSize: 20,
    totalAmmo: 80,
    reloadTime: 2300,
    bulletSpeed: 38,
    headshotMultiplier: 2.0
  },
  // SCP: Arma especial - 4 balas para matar
  SCP: {
    damage: 60,
    fireRate: 133, // 450 RPM
    magazineSize: 25,
    totalAmmo: 75,
    reloadTime: 2800,
    bulletSpeed: 40,
    headshotMultiplier: 2.0
  }
};

/**
 * Obtiene la configuración de un arma específica
 * @param {string} weaponType - Tipo de arma
 * @returns {Object} - Configuración del arma
 */
export function getWeaponConfig(weaponType) {
  return WEAPON_CONFIG[weaponType] || WEAPON_CONFIG.default;
}

export const DASH_CONFIG = {
  maxCharges: 3, // Requirement 7.4
  rechargeTime: 3000, // 3 seconds (Requirement 7.4)
  power: 5,
  duration: 200 // ms
};

export const BULLET_CONFIG = {
  lifetime: 10000, // ms
  maxDistance: 300
};

export const SERVER_CONFIG = {
  port: 3000,
  tickRate: 20, // 20 updates per second (optimized for cloud hosting)
  tickInterval: 1000 / 20 // 50ms
};
