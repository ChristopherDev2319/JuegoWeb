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

export const WEAPON_CONFIG = {
  damage: 20, // Requirement 5.3
  fireRate: 150, // ms between shots (400 RPM = 150ms)
  magazineSize: 30, // Requirement 6.4
  totalAmmo: 120,
  reloadTime: 2000, // 2 seconds (Requirement 6.4)
  bulletSpeed: 30
};

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
