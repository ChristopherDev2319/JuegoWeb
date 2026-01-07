/**
 * Módulo de efectos visuales del juego
 * Contiene funciones para crear partículas y efectos visuales
 * 
 * @requires THREE - Three.js debe estar disponible globalmente
 */

/**
 * Crea efecto de impacto de bala
 * @param {THREE.Vector3} posicion - Posición donde crear el efecto
 * @param {THREE.Scene} scene - Escena de Three.js
 */
export function crearEfectoImpacto(posicion, scene) {
  const particulas = 8;
  for (let i = 0; i < particulas; i++) {
    const geometry = new THREE.SphereGeometry(0.05, 4, 4);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const particula = new THREE.Mesh(geometry, material);

    particula.position.copy(posicion);

    const velocidad = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );

    scene.add(particula);

    let vida = 0;
    const animar = () => {
      vida += 0.016;
      particula.position.add(velocidad.clone().multiplyScalar(0.05));

      if (vida > 0.5) {
        scene.remove(particula);
        geometry.dispose();
        material.dispose();
      } else {
        requestAnimationFrame(animar);
      }
    };
    animar();
  }
}


