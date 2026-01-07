// ============================================
// SISTEMA DE PROGRESO DEL JUGADOR
// ============================================

import { obtenerHeadersAuth, estaAutenticado } from './auth.js';

/**
 * Sistema de progreso para el juego FPS
 * Maneja guardado y carga de progreso del jugador
 */

// Configuración de la API - detectar entorno automáticamente
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : `${window.location.protocol}//${window.location.hostname}/api`;

// Estado del progreso local
let progresoLocal = {
    stats: {
        kills: 0,
        deaths: 0,
        shotsFired: 0,
        shotsHit: 0,
        playtime: 0
    },
    config: {
        mouseSensitivity: 0.002,
        volume: 0.5,
        fov: 75,
        showFPS: false
    },
    progress: {
        level: 1,
        experience: 0,
        unlockedWeapons: ['M4A1', 'PISTOLA']
    },
    additionalData: {}
};

// Callbacks para eventos de progreso
let progresoCallbacks = {
    onLoad: null,
    onSave: null,
    onError: null
};

/**
 * Inicializar sistema de progreso
 * @param {Object} callbacks - Callbacks para eventos
 */
export function inicializarProgreso(callbacks = {}) {
    progresoCallbacks = { ...progresoCallbacks, ...callbacks };
    
    // Cargar progreso desde localStorage como fallback
    const savedProgress = localStorage.getItem('fps_game_progress');
    if (savedProgress) {
        try {
            const parsed = JSON.parse(savedProgress);
            progresoLocal = { ...progresoLocal, ...parsed };
        } catch (error) {
            console.warn('Error cargando progreso local:', error);
        }
    }
    
    console.log('✅ Sistema de progreso inicializado');
}

/**
 * Cargar progreso del servidor
 * @returns {Promise<Object>} Progreso del jugador
 */
export async function cargarProgreso() {
    if (!estaAutenticado()) {
        console.log('⚠️ Usuario no autenticado, usando progreso local');
        return progresoLocal;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/progress/load`, {
            headers: obtenerHeadersAuth()
        });
        
        const data = await response.json();
        
        if (data.success) {
            progresoLocal = data.data;
            
            // Guardar también en localStorage como backup
            localStorage.setItem('fps_game_progress', JSON.stringify(progresoLocal));
            
            // Ejecutar callback
            if (progresoCallbacks.onLoad) {
                progresoCallbacks.onLoad(progresoLocal);
            }
            
            console.log('✅ Progreso cargado desde servidor');
            return progresoLocal;
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('Error cargando progreso:', error);
        
        if (progresoCallbacks.onError) {
            progresoCallbacks.onError(`Error cargando progreso: ${error.message}`);
        }
        
        // Usar progreso local como fallback
        return progresoLocal;
    }
}

/**
 * Guardar progreso en el servidor
 * @param {Object} nuevoProgreso - Datos de progreso a guardar
 * @returns {Promise<boolean>} True si se guardó exitosamente
 */
export async function guardarProgreso(nuevoProgreso = null) {
    // Usar progreso actual si no se proporciona uno nuevo
    const progresoAGuardar = nuevoProgreso || progresoLocal;
    
    // Guardar en localStorage siempre
    localStorage.setItem('fps_game_progress', JSON.stringify(progresoAGuardar));
    
    if (!estaAutenticado()) {
        console.log('⚠️ Usuario no autenticado, progreso guardado solo localmente');
        return true;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/progress/save`, {
            method: 'POST',
            headers: obtenerHeadersAuth(),
            body: JSON.stringify(progresoAGuardar)
        });
        
        const data = await response.json();
        
        if (data.success) {
            progresoLocal = data.data;
            
            // Ejecutar callback
            if (progresoCallbacks.onSave) {
                progresoCallbacks.onSave(progresoLocal);
            }
            
            console.log('✅ Progreso guardado en servidor');
            return true;
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('Error guardando progreso:', error);
        
        if (progresoCallbacks.onError) {
            progresoCallbacks.onError(`Error guardando progreso: ${error.message}`);
        }
        
        return false;
    }
}

/**
 * Actualizar estadísticas del jugador
 * @param {Object} stats - Nuevas estadísticas
 */
export async function actualizarEstadisticas(stats) {
    progresoLocal.stats = { ...progresoLocal.stats, ...stats };
    
    // Calcular precisión automáticamente
    if (progresoLocal.stats.shotsFired > 0) {
        progresoLocal.stats.accuracy = Math.round(
            (progresoLocal.stats.shotsHit / progresoLocal.stats.shotsFired) * 100
        );
    }
    
    // Guardar en localStorage siempre
    localStorage.setItem('fps_game_progress', JSON.stringify(progresoLocal));
    
    // Si está autenticado, guardar en el servidor usando la API de stats
    if (estaAutenticado()) {
        try {
            // Solo enviar kills, deaths, matches al servidor
            const statsToSend = {};
            if (stats.kills !== undefined) statsToSend.kills = 1; // Incrementar en 1
            if (stats.deaths !== undefined) statsToSend.deaths = 1; // Incrementar en 1
            if (stats.matches !== undefined) statsToSend.matches = 1; // Incrementar en 1
            
            if (Object.keys(statsToSend).length > 0) {
                const response = await fetch(`${API_BASE_URL}/stats/update`, {
                    method: 'PUT',
                    headers: obtenerHeadersAuth(),
                    body: JSON.stringify(statsToSend)
                });
                
                const data = await response.json();
                if (data.success) {
                    console.log('✅ Estadísticas actualizadas en servidor:', data.data);
                } else {
                    console.warn('⚠️ Error actualizando stats:', data.message);
                }
            }
        } catch (error) {
            console.error('Error actualizando estadísticas en servidor:', error);
        }
    }
}

/**
 * Actualizar configuración del jugador
 * @param {Object} config - Nueva configuración
 */
export function actualizarConfiguracion(config) {
    progresoLocal.config = { ...progresoLocal.config, ...config };
    
    // Guardar automáticamente
    guardarProgreso();
}

/**
 * Actualizar progreso del jugador (nivel, experiencia, armas)
 * @param {Object} progress - Nuevo progreso
 */
export function actualizarProgresoJugador(progress) {
    progresoLocal.progress = { ...progresoLocal.progress, ...progress };
    
    // Guardar automáticamente
    guardarProgreso();
}

/**
 * Agregar experiencia al jugador
 * @param {number} exp - Cantidad de experiencia a agregar
 */
export function agregarExperiencia(exp) {
    progresoLocal.progress.experience += exp;
    
    // Calcular si sube de nivel (ejemplo: 1000 exp por nivel)
    const expPorNivel = 1000;
    const nivelActual = progresoLocal.progress.level;
    const expRequerida = nivelActual * expPorNivel;
    
    if (progresoLocal.progress.experience >= expRequerida) {
        progresoLocal.progress.level++;
        progresoLocal.progress.experience -= expRequerida;
        
        console.log(`[NIVEL UP] ¡Subiste al nivel ${progresoLocal.progress.level}!`);
        
        // Aquí podrías desbloquear armas nuevas
        desbloquearArmasPorNivel(progresoLocal.progress.level);
    }
    
    guardarProgreso();
}

/**
 * Desbloquear armas por nivel
 * @param {number} nivel - Nivel actual del jugador
 */
function desbloquearArmasPorNivel(nivel) {
    const armasDesbloqueables = {
        1: ['M4A1', 'PISTOLA'],
        2: ['AK47'],
        3: ['MP5'],
        4: ['ESCOPETA'],
        5: ['SNIPER']
    };
    
    if (armasDesbloqueables[nivel]) {
        const nuevasArmas = armasDesbloqueables[nivel];
        for (const arma of nuevasArmas) {
            if (!progresoLocal.progress.unlockedWeapons.includes(arma)) {
                progresoLocal.progress.unlockedWeapons.push(arma);
                console.log(`[ARMA DESBLOQUEADA] ¡Arma desbloqueada: ${arma}!`);
            }
        }
    }
}

/**
 * Registrar kill (eliminar enemigo)
 */
export function registrarKill() {
    progresoLocal.stats.kills++;
    agregarExperiencia(100); // 100 exp por kill
    actualizarEstadisticas({ kills: progresoLocal.stats.kills });
}

/**
 * Registrar death (muerte del jugador)
 */
export function registrarDeath() {
    progresoLocal.stats.deaths++;
    actualizarEstadisticas({ deaths: progresoLocal.stats.deaths });
}

/**
 * Registrar disparo
 */
export function registrarDisparo() {
    progresoLocal.stats.shotsFired++;
    actualizarEstadisticas({ shotsFired: progresoLocal.stats.shotsFired });
}

/**
 * Registrar impacto
 */
export function registrarImpacto() {
    progresoLocal.stats.shotsHit++;
    agregarExperiencia(10); // 10 exp por impacto
    // No guardar en servidor, solo local
    localStorage.setItem('fps_game_progress', JSON.stringify(progresoLocal));
}

/**
 * Registrar partida jugada
 */
export async function registrarPartida() {
    progresoLocal.stats.matches = (progresoLocal.stats.matches || 0) + 1;
    
    // Guardar en localStorage
    localStorage.setItem('fps_game_progress', JSON.stringify(progresoLocal));
    
    // Si está autenticado, guardar en el servidor
    if (estaAutenticado()) {
        try {
            const response = await fetch(`${API_BASE_URL}/stats/update`, {
                method: 'PUT',
                headers: obtenerHeadersAuth(),
                body: JSON.stringify({ matches: 1 })
            });
            
            const data = await response.json();
            if (data.success) {
                console.log('✅ Partida registrada en servidor');
            }
        } catch (error) {
            console.error('Error registrando partida:', error);
        }
    }
}

/**
 * Actualizar tiempo jugado
 * @param {number} segundos - Segundos a agregar
 */
export function actualizarTiempoJugado(segundos) {
    progresoLocal.stats.playtime += segundos;
    actualizarEstadisticas({ playtime: progresoLocal.stats.playtime });
}

/**
 * Obtener progreso actual
 * @returns {Object} Progreso actual del jugador
 */
export function obtenerProgreso() {
    return { ...progresoLocal };
}

/**
 * Obtener estadísticas formateadas
 * @returns {Object} Estadísticas con cálculos adicionales
 */
export function obtenerEstadisticas() {
    const stats = progresoLocal.stats;
    return {
        ...stats,
        kdRatio: stats.deaths > 0 ? Math.round((stats.kills / stats.deaths) * 100) / 100 : stats.kills,
        accuracy: stats.shotsFired > 0 ? Math.round((stats.shotsHit / stats.shotsFired) * 100) : 0,
        playtimeFormatted: formatearTiempo(stats.playtime)
    };
}

/**
 * Formatear tiempo en formato legible
 * @param {number} segundos - Tiempo en segundos
 * @returns {string} Tiempo formateado
 */
function formatearTiempo(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
        return `${horas}h ${minutos}m ${segs}s`;
    } else if (minutos > 0) {
        return `${minutos}m ${segs}s`;
    } else {
        return `${segs}s`;
    }
}