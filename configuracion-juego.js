/**
 * Configuración rápida del juego
 * Cambia estos valores para personalizar tu experiencia
 */

// ¿Quieres jugar con multijugador?
const HABILITAR_MULTIJUGADOR = true; // Cambiar a false para jugar solo

// Puerto del servidor (normalmente 3000)
const PUERTO_SERVIDOR = 3000;

// Aplicar configuración
if (typeof window !== 'undefined') {
  // Ejecutar cuando la página cargue
  window.addEventListener('DOMContentLoaded', () => {
    // Importar y modificar la configuración
    import('./src/config.js').then(({ CONFIG }) => {
      CONFIG.red.habilitarMultijugador = HABILITAR_MULTIJUGADOR;
      CONFIG.red.puertoServidor = PUERTO_SERVIDOR;
      
      console.log('🎮 Configuración aplicada:');
      console.log(`   Multijugador: ${HABILITAR_MULTIJUGADOR ? 'Habilitado' : 'Deshabilitado'}`);
      console.log(`   Puerto servidor: ${PUERTO_SERVIDOR}`);
      
      if (!HABILITAR_MULTIJUGADOR) {
        console.log('🎯 Modo local: Puedes jugar sin servidor');
      }
    });
  });
}

export { HABILITAR_MULTIJUGADOR, PUERTO_SERVIDOR };