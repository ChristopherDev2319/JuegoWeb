/**
 * Sistema de Sonidos - Versión Simplificada
 * Usa el método directo que funciona
 */

/**
 * Reproduce el sonido de disparo de un arma (método directo)
 * @param {string} tipoArma - Tipo de arma (M4A1, PISTOLA, etc.)
 * @param {Object} configArma - Configuración del arma
 */
export function reproducirSonidoDisparo(tipoArma, configArma) {
  if (!configArma.sonidoDisparo) {
    console.log(`No hay sonido configurado para ${tipoArma}`);
    return;
  }

  try {
    // Usar el método directo que funciona
    const audio = new Audio(configArma.sonidoDisparo);
    
    // Configurar volumen según el tipo de arma
    switch (tipoArma) {
      case 'PISTOLA':
        audio.volume = 0.4;
        break;
      case 'SNIPER':
        audio.volume = 0.6;
        break;
      case 'ESCOPETA':
        audio.volume = 0.5;
        break;
      case 'AK47':
        audio.volume = 0.5;
        break;
      case 'M4A1':
        audio.volume = 0.4;
        break;
      default:
        audio.volume = 0.3;
    }

    console.log(`🔫 Reproduciendo sonido: ${configArma.sonidoDisparo} (${tipoArma})`);
    
    // Reproducir inmediatamente (método que funciona)
    audio.play().catch(error => {
      console.warn(`Error reproduciendo sonido de ${tipoArma}:`, error);
    });
    
  } catch (error) {
    console.error(`Error creando audio para ${tipoArma}:`, error);
  }
}

/**
 * Reproduce un sonido directamente (para tests)
 * @param {string} ruta - Ruta del archivo de sonido
 * @param {Object} opciones - Opciones de reproducción
 */
export function reproducirSonido(ruta, opciones = {}) {
  try {
    const audio = new Audio(ruta);
    audio.volume = opciones.volumen || 0.5;
    audio.playbackRate = opciones.velocidad || 1.0;
    
    return audio.play().catch(error => {
      console.warn('Error reproduciendo sonido:', error);
    });
    
  } catch (error) {
    console.error(`Error reproduciendo sonido ${ruta}:`, error);
  }
}

/**
 * Carga un sonido (simplificado)
 * @param {string} ruta - Ruta del archivo de sonido
 * @returns {Promise<HTMLAudioElement>} Audio element cargado
 */
export function cargarSonido(ruta) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(ruta);
    
    audio.addEventListener('canplaythrough', () => {
      console.log(`🔊 Sonido cargado: ${ruta}`);
      resolve(audio);
    });

    audio.addEventListener('error', (error) => {
      console.error(`❌ Error cargando sonido ${ruta}:`, error);
      reject(error);
    });

    audio.load();
  });
}

/**
 * Precarga sonidos (simplificado)
 * @param {Array<string>} rutas - Array de rutas de sonidos a precargar
 */
export async function precargarSonidos(rutas) {
  console.log('🔊 Precargando sonidos...');
  
  for (const ruta of rutas) {
    try {
      await cargarSonido(ruta);
    } catch (error) {
      console.warn(`No se pudo precargar ${ruta}:`, error);
    }
  }
  
  console.log(`✅ Sonidos procesados`);
}