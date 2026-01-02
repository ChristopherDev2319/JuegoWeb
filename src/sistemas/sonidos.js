/**
 * Sistema de Sonidos - Con pool de audio para evitar interrupciones
 */

// Estado del sistema de sonidos
let sonidosHabilitados = true;

// Pool de audios precargados por arma
const audioPool = {};
const POOL_SIZE = 5; // Número de instancias por arma

/**
 * Inicializa el sistema de sonidos y precarga los sonidos de armas
 */
export function inicializarSonidos() {
  sonidosHabilitados = true;
  
  // Precargar sonidos de armas
  const sonidosArmas = {
    'M4A1': 'sonidos/M4A1.mp3',
    'AK47': 'sonidos/AK47.mp3',
    'PISTOLA': 'sonidos/pistola.mp3',
    'SNIPER': 'sonidos/SNIPER.mp3',
    'ESCOPETA': 'sonidos/ESCOPETA.mp3',
    'MP5': 'sonidos/MP5.mp3'
  };
  
  // Crear pool de audios para cada arma
  for (const [arma, ruta] of Object.entries(sonidosArmas)) {
    audioPool[arma] = {
      audios: [],
      indice: 0,
      volumen: getVolumenArma(arma)
    };
    
    // Crear múltiples instancias de audio
    for (let i = 0; i < POOL_SIZE; i++) {
      const audio = new Audio(ruta);
      audio.preload = 'auto';
      audio.volume = audioPool[arma].volumen;
      audioPool[arma].audios.push(audio);
    }
  }
  
  console.log('🔊 Sistema de sonidos inicializado con pool de audio');
}

/**
 * Obtiene el volumen para un tipo de arma
 */
function getVolumenArma(tipoArma) {
  switch (tipoArma) {
    case 'PISTOLA': return 0.4;
    case 'SNIPER': return 0.6;
    case 'ESCOPETA': return 0.5;
    case 'AK47': return 0.5;
    case 'M4A1': return 0.4;
    case 'MP5': return 0.4;
    default: return 0.3;
  }
}

/**
 * Reproduce el sonido de disparo de un arma usando el pool
 * @param {string} tipoArma - Tipo de arma (M4A1, PISTOLA, etc.)
 * @param {Object} configArma - Configuración del arma (opcional)
 */
export function reproducirSonidoDisparo(tipoArma, configArma = null) {
  if (!sonidosHabilitados) return;
  
  const pool = audioPool[tipoArma];
  
  if (pool && pool.audios.length > 0) {
    // Usar el siguiente audio del pool (round-robin)
    const audio = pool.audios[pool.indice];
    pool.indice = (pool.indice + 1) % pool.audios.length;
    
    // Reiniciar y reproducir
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Silenciar errores de autoplay
    });
  } else if (configArma && configArma.sonidoDisparo) {
    // Fallback: crear audio nuevo si no hay pool
    const audio = new Audio(configArma.sonidoDisparo);
    audio.volume = getVolumenArma(tipoArma);
    audio.play().catch(() => {});
  }
}

/**
 * Reproduce un sonido directamente
 * @param {string} ruta - Ruta del archivo de sonido
 * @param {Object} opciones - Opciones de reproducción
 */
export function reproducirSonido(ruta, opciones = {}) {
  if (!sonidosHabilitados) return;
  
  try {
    const audio = new Audio(ruta);
    audio.volume = opciones.volumen || 0.5;
    audio.playbackRate = opciones.velocidad || 1.0;
    audio.play().catch(() => {});
  } catch (error) {
    console.error(`Error reproduciendo sonido ${ruta}:`, error);
  }
}

/**
 * Habilita o deshabilita los sonidos
 */
export function setSonidosHabilitados(habilitado) {
  sonidosHabilitados = habilitado;
}
