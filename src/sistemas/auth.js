// ============================================
// SISTEMA DE AUTENTICACIÓN FRONTEND
// ============================================

/**
 * Sistema de autenticación para el juego FPS
 * Maneja login, registro y gestión de tokens JWT
 */

// Configuración de la API - detectar entorno automáticamente
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.');

const API_BASE_URL = isLocalhost
    ? 'http://localhost:3001/api'
    : `${window.location.protocol}//${window.location.host}/api`;

console.log('🔗 API URL configurada:', API_BASE_URL);

// Estado de autenticación
let authState = {
    isAuthenticated: false,
    user: null,
    token: null
};

// Callbacks para eventos de autenticación
let authCallbacks = {
    onLogin: null,
    onLogout: null,
    onError: null
};

/**
 * Inicializar sistema de autenticación
 * Requirements: 1.4 - Session persistence on page load
 * @param {Object} callbacks - Callbacks para eventos
 * @returns {Promise<void>} Promise that resolves when initialization is complete
 */
export async function inicializarAuth(callbacks = {}) {
    authCallbacks = { ...authCallbacks, ...callbacks };
    
    // Verificar si hay token guardado
    const savedToken = localStorage.getItem('fps_game_token');
    const savedUser = localStorage.getItem('fps_game_user');
    
    if (savedToken && savedUser) {
        try {
            authState.token = savedToken;
            authState.user = JSON.parse(savedUser);
            authState.isAuthenticated = true;
            
            // Verificar si el token sigue siendo válido
            // Wait for verification to complete before returning
            await verificarToken();
        } catch (error) {
            console.warn('Error cargando datos de autenticación guardados:', error);
            limpiarAuth();
        }
    }
}

/**
 * Registrar nuevo usuario
 * @param {string} username - Nombre de usuario
 * @param {string} email - Email
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} Resultado del registro
 */
export async function registrarUsuario(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Guardar datos de autenticación
            authState.isAuthenticated = true;
            authState.user = data.data.user;
            authState.token = data.data.token;
            
            localStorage.setItem('fps_game_token', data.data.token);
            localStorage.setItem('fps_game_user', JSON.stringify(data.data.user));
            
            // Ejecutar callback
            if (authCallbacks.onLogin) {
                authCallbacks.onLogin(authState.user);
            }
        } else {
            console.error('Error en registro:', data.message);
            if (authCallbacks.onError) {
                authCallbacks.onError(data.message);
            }
        }
        
        return data;
        
    } catch (error) {
        console.error('Error en registro:', error);
        const errorMsg = 'Error de conexión con el servidor';
        if (authCallbacks.onError) {
            authCallbacks.onError(errorMsg);
        }
        return { success: false, message: errorMsg };
    }
}

/**
 * Iniciar sesión
 * @param {string} username - Nombre de usuario o email
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} Resultado del login
 */
export async function iniciarSesion(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Guardar datos de autenticación
            authState.isAuthenticated = true;
            authState.user = data.data.user;
            authState.token = data.data.token;
            
            localStorage.setItem('fps_game_token', data.data.token);
            localStorage.setItem('fps_game_user', JSON.stringify(data.data.user));
            
            // Ejecutar callback
            if (authCallbacks.onLogin) {
                authCallbacks.onLogin(authState.user);
            }
        } else {
            if (authCallbacks.onError) {
                authCallbacks.onError(data.message);
            }
        }
        
        return data;
        
    } catch (error) {
        console.error('Error en login:', error);
        const errorMsg = 'Error de conexión con el servidor';
        if (authCallbacks.onError) {
            authCallbacks.onError(errorMsg);
        }
        return { success: false, message: errorMsg };
    }
}

/**
 * Cerrar sesión
 */
export function cerrarSesion() {
    // Limpiar estado local
    limpiarAuth();
    
    // Ejecutar callback
    if (authCallbacks.onLogout) {
        authCallbacks.onLogout();
    }
}

/**
 * Verificar si el token sigue siendo válido
 */
async function verificarToken() {
    if (!authState.token) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/progress/load`, {
            headers: {
                'Authorization': `Bearer ${authState.token}`
            }
        });
        
        if (response.status === 401) {
            // Token expirado o inválido
            limpiarAuth();
            if (authCallbacks.onLogout) {
                authCallbacks.onLogout();
            }
            return false;
        }
        
        return response.ok;
        
    } catch (error) {
        console.warn('Error verificando token:', error);
        return false;
    }
}

/**
 * Limpiar datos de autenticación
 */
function limpiarAuth() {
    authState.isAuthenticated = false;
    authState.user = null;
    authState.token = null;
    
    localStorage.removeItem('fps_game_token');
    localStorage.removeItem('fps_game_user');
}

/**
 * Obtener estado de autenticación
 * @returns {Object} Estado actual de autenticación
 */
export function obtenerEstadoAuth() {
    return { ...authState };
}

/**
 * Obtener token de autenticación
 * @returns {string|null} Token JWT
 */
export function obtenerToken() {
    return authState.token;
}

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean} True si está autenticado
 */
export function estaAutenticado() {
    return authState.isAuthenticated && authState.token;
}

/**
 * Obtener headers de autenticación para requests
 * @returns {Object} Headers con Authorization
 */
export function obtenerHeadersAuth() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (authState.token) {
        headers['Authorization'] = `Bearer ${authState.token}`;
    }
    
    return headers;
}