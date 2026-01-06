/**
 * Módulo de efectos visuales del juego (OPTIMIZADO)
 * Contiene funciones para crear partículas y efectos visuales
 * 
 * @requires THREE - Three.js debe estar disponible globalmente
 */

// ============================================
// Pool de recursos compartidos para optimización
// ============================================

// Geometría compartida única para todas las partículas
let geoParticulaCompartida = null;

/**
 * Obtiene la geometría compartida para partículas.
 * Crea una única instancia que se reutiliza en todos los efectos.
 * @returns {THREE.SphereGeometry} Geometría compartida
 */
function obtenerGeoParticula() {
  if (!geoParticulaCompartida) {
    geoParticulaCompartida = new THREE.SphereGeometry(0.08, 4, 4);
  }
  return geoParticulaCompartida;
}

// Colores predefinidos para cada tipo de efecto
const COLORES_EFECTO = {
  impacto: 0xff4444,
  dash: 0x00ffff,
  respawn: 0x00ff00
};

// Opacidades iniciales para cada tipo de efecto
const OPACIDAD_INICIAL = {
  impacto: 0.7,
  dash: 0.6,
  respawn: 0.6
};

/**
 * Crea un material para partículas con el color y opacidad especificados.
 * Cada partícula necesita su propio material para animar la opacidad independientemente.
 * @param {number} color - Color hexadecimal
 * @param {number} opacidad - Opacidad inicial (0-1)
 * @returns {THREE.MeshBasicMaterial} Material creado
 */
function crearMaterialParticula(color, opacidad) {
  return new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: opacidad
  });
}

/**
 * Crea efecto de impacto de bala (optimizado - menos partículas)
 * Usa geometría compartida y limpia materiales apropiadamente.
 * @param {THREE.Vector3} posicion - Posición donde crear el efecto
 * @param {THREE.Scene} scene - Escena de Three.js
 */
export function crearEfectoImpacto(posicion, scene) {
  // Límite de 3 partículas por impacto (Requirements 2.3)
  const particulas = 3;
  const geo = obtenerGeoParticula();
  
  for (let i = 0; i < particulas; i++) {
    const material = crearMaterialParticula(COLORES_EFECTO.impacto, OPACIDAD_INICIAL.impacto);
    const particula = new THREE.Mesh(geo, material);
    particula.position.copy(posicion);

    const velocidad = new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5
    );

    scene.add(particula);

    let frame = 0;
    const intervalo = setInterval(() => {
      frame++;
      particula.position.add(velocidad.clone().multiplyScalar(0.04));
      material.opacity -= 0.15;
      
      if (frame >= 5) {
        clearInterval(intervalo);
        scene.remove(particula);
        // Dispose del material al completar el efecto (Requirements 2.2, 6.2)
        material.dispose();
      }
    }, 33);
  }
}

/**
 * Crea efecto visual de dash (optimizado - menos partículas)
 * Usa geometría compartida y limpia materiales apropiadamente.
 * @param {THREE.Vector3} posicion - Posición del jugador
 * @param {THREE.Scene} scene - Escena de Three.js
 */
export function crearEfectoDash(posicion, scene) {
  // Límite de 5 partículas por dash (Requirements 2.4)
  const particulas = 5;
  const geo = obtenerGeoParticula();
  
  for (let i = 0; i < particulas; i++) {
    const material = crearMaterialParticula(COLORES_EFECTO.dash, OPACIDAD_INICIAL.dash);
    const particula = new THREE.Mesh(geo, material);
    particula.position.copy(posicion);
    particula.position.y -= 1;

    scene.add(particula);

    let frame = 0;
    const intervalo = setInterval(() => {
      frame++;
      particula.position.y += 0.05;
      material.opacity -= 0.12;
      
      if (frame >= 5) {
        clearInterval(intervalo);
        scene.remove(particula);
        // Dispose del material al completar el efecto (Requirements 2.2, 6.2)
        material.dispose();
      }
    }, 33);
  }
}

/**
 * Crea efecto de respawn de enemigo (optimizado - menos partículas)
 * Usa geometría compartida y limpia materiales apropiadamente.
 * @param {THREE.Vector3} posicion - Posición del enemigo
 * @param {THREE.Scene} scene - Escena de Three.js
 */
export function crearEfectoRespawn(posicion, scene) {
  // Límite de 6 partículas por respawn (Requirements 2.5)
  const particulas = 6;
  const geo = obtenerGeoParticula();
  
  for (let i = 0; i < particulas; i++) {
    const material = crearMaterialParticula(COLORES_EFECTO.respawn, OPACIDAD_INICIAL.respawn);
    const particula = new THREE.Mesh(geo, material);
    particula.position.copy(posicion);
    particula.position.y += Math.random() * 2;

    scene.add(particula);

    let frame = 0;
    const intervalo = setInterval(() => {
      frame++;
      particula.position.y += 0.08;
      material.opacity -= 0.1;
      
      if (frame >= 6) {
        clearInterval(intervalo);
        scene.remove(particula);
        // Dispose del material al completar el efecto (Requirements 2.2, 6.2)
        material.dispose();
      }
    }, 33);
  }
}

// ============================================
// Funciones de utilidad para testing
// ============================================

/**
 * Obtiene la referencia a la geometría compartida (para testing)
 * @returns {THREE.SphereGeometry|null} La geometría compartida o null si no existe
 */
export function _getSharedGeometry() {
  return geoParticulaCompartida;
}

/**
 * Resetea el pool de recursos (para testing)
 */
export function _resetPool() {
  if (geoParticulaCompartida) {
    geoParticulaCompartida.dispose();
    geoParticulaCompartida = null;
  }
}
