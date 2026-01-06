// ============================================
// INTERFAZ DE USUARIO DE AUTENTICACIÓN
// ============================================

import { inicializarAuth, registrarUsuario, iniciarSesion, cerrarSesion, obtenerEstadoAuth } from './auth.js';
import { inicializarProgreso, cargarProgreso, obtenerProgreso } from './progreso.js';

/**
 * Sistema de UI para autenticación
 * Maneja la interfaz de login/registro integrada en el juego
 */

// Referencias a elementos DOM
let elementos = {};

// Estado de la UI
let uiState = {
    isVisible: false,
    currentForm: 'login' // 'login' o 'register'
};

/**
 * Inicializar UI de autenticación
 */
export function inicializarAuthUI() {
    // Obtener referencias a elementos DOM
    obtenerElementosDOM();
    
    // Configurar event listeners
    configurarEventListeners();
    
    // Inicializar sistema de autenticación
    inicializarAuth({
        onLogin: manejarLogin,
        onLogout: manejarLogout,
        onError: mostrarError
    });
    
    // Inicializar sistema de progreso
    inicializarProgreso({
        onLoad: manejarProgresoCargar,
        onSave: manejarProgresoGuardar,
        onError: mostrarError
    });
    
    // Verificar estado inicial
    actualizarUIAuth();
    
    console.log('✅ UI de autenticación inicializada');
}

/**
 * Obtener referencias a elementos DOM
 */
function obtenerElementosDOM() {
    elementos = {
        // Overlay y contenedor
        authOverlay: document.getElementById('auth-overlay'),
        authTitle: document.getElementById('auth-title'),
        authClose: document.getElementById('auth-close'),
        
        // Formularios
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        
        // Campos de login
        loginUsername: document.getElementById('login-username'),
        loginPassword: document.getElementById('login-password'),
        
        // Campos de registro
        registerUsername: document.getElementById('register-username'),
        registerEmail: document.getElementById('register-email'),
        registerPassword: document.getElementById('register-password'),
        registerConfirm: document.getElementById('register-confirm'),
        
        // Botones de cambio
        showRegister: document.getElementById('show-register'),
        showLogin: document.getElementById('show-login'),
        
        // Estados
        authError: document.getElementById('auth-error'),
        authLoading: document.getElementById('auth-loading')
    };
    
    // Debug: verificar si los elementos existen
    console.log('🔍 Debug elementos DOM:');
    console.log('- authOverlay:', elementos.authOverlay);
}

/**
 * Configurar event listeners
 */
function configurarEventListeners() {
    // Solo botón de login en el lobby (no hay botón en esquina superior derecha)
    const lobbyLoginBtn = document.getElementById('lobby-login-btn');
    lobbyLoginBtn?.addEventListener('click', () => mostrarAuth('login'));
    
    // Cerrar overlay
    elementos.authClose?.addEventListener('click', ocultarAuth);
    elementos.authOverlay?.addEventListener('click', (e) => {
        // Solo cerrar si se hace clic exactamente en el overlay (fondo), no en el contenedor
        if (e.target === elementos.authOverlay) {
            ocultarAuth();
        }
    });
    
    // Prevenir que clics en el contenedor cierren el modal
    const authContainer = document.querySelector('.auth-container');
    authContainer?.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Cambiar entre formularios
    elementos.showRegister?.addEventListener('click', (e) => {
        e.preventDefault();
        cambiarFormulario('register');
    });
    
    elementos.showLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        cambiarFormulario('login');
    });
    
    // Envío de formularios
    elementos.loginForm?.addEventListener('submit', manejarSubmitLogin);
    elementos.registerForm?.addEventListener('submit', manejarSubmitRegister);
    
    // Tecla ESC para cerrar
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' && uiState.isVisible) {
            ocultarAuth();
        }
    });
}

/**
 * Mostrar overlay de autenticación
 * @param {string} form - 'login' o 'register'
 */
function mostrarAuth(form = 'login') {
    uiState.isVisible = true;
    uiState.currentForm = form;
    
    elementos.authOverlay?.classList.remove('hidden');
    cambiarFormulario(form);
    limpiarFormularios();
    ocultarError();
    ocultarLoading();
    
    // Enfocar primer campo
    setTimeout(() => {
        if (form === 'login') {
            elementos.loginUsername?.focus();
        } else {
            elementos.registerUsername?.focus();
        }
    }, 100);
}

/**
 * Ocultar overlay de autenticación
 */
function ocultarAuth() {
    uiState.isVisible = false;
    elementos.authOverlay?.classList.add('hidden');
    limpiarFormularios();
    ocultarError();
    ocultarLoading();
}

/**
 * Cambiar entre formularios de login y registro
 * @param {string} form - 'login' o 'register'
 */
function cambiarFormulario(form) {
    uiState.currentForm = form;
    
    if (form === 'login') {
        elementos.authTitle.textContent = 'Iniciar Sesión';
        elementos.loginForm?.classList.remove('hidden');
        elementos.registerForm?.classList.add('hidden');
    } else {
        elementos.authTitle.textContent = 'Registrarse';
        elementos.loginForm?.classList.add('hidden');
        elementos.registerForm?.classList.remove('hidden');
    }
    
    ocultarError();
}

/**
 * Manejar envío del formulario de login
 */
async function manejarSubmitLogin(e) {
    e.preventDefault();
    
    const username = elementos.loginUsername.value.trim();
    const password = elementos.loginPassword.value;
    
    if (!username || !password) {
        mostrarError('Por favor completa todos los campos');
        return;
    }
    
    mostrarLoading();
    ocultarError();
    
    try {
        const resultado = await iniciarSesion(username, password);
        
        ocultarLoading();
        
        if (resultado.success) {
            // Login exitoso, el callback onLogin se encarga del resto
            console.log('✅ Login exitoso');
        } else {
            // Mostrar error específico del servidor
            mostrarError(resultado.message || 'Error en el login');
        }
    } catch (error) {
        ocultarLoading();
        console.error('Error en login:', error);
        mostrarError('Error de conexión con el servidor');
    }
}

/**
 * Manejar envío del formulario de registro
 */
async function manejarSubmitRegister(e) {
    e.preventDefault();
    
    const username = elementos.registerUsername.value.trim();
    const email = elementos.registerEmail.value.trim();
    const password = elementos.registerPassword.value;
    const confirm = elementos.registerConfirm.value;
    
    // Validaciones del frontend
    if (!username || !email || !password || !confirm) {
        mostrarError('Por favor completa todos los campos');
        return;
    }
    
    if (username.length < 3) {
        mostrarError('El nombre de usuario debe tener al menos 3 caracteres');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        mostrarError('El nombre de usuario solo puede contener letras, números y guiones bajos');
        return;
    }
    
    if (password !== confirm) {
        mostrarError('Las contraseñas no coinciden');
        return;
    }
    
    if (password.length < 6) {
        mostrarError('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
        mostrarError('Por favor ingresa un email válido');
        return;
    }
    
    mostrarLoading();
    ocultarError();
    
    try {
        const resultado = await registrarUsuario(username, email, password);
        
        ocultarLoading();
        
        if (resultado.success) {
            // Registro exitoso, el callback onLogin se encarga del resto
            console.log('✅ Registro exitoso');
        } else {
            // Mostrar error específico del servidor
            mostrarError(resultado.message || 'Error en el registro');
        }
    } catch (error) {
        ocultarLoading();
        console.error('Error en registro:', error);
        mostrarError('Error de conexión con el servidor');
    }
}

/**
 * Manejar login exitoso
 */
function manejarLogin(user) {
    console.log('✅ Usuario logueado:', user.username);
    actualizarUIAuth();
    
    // Cargar progreso del usuario
    cargarProgreso();
    
    // Mostrar notificación
    mostrarNotificacion(`¡Bienvenido, ${user.username}!`, 'success');
    
    // Ocultar overlay de autenticación
    ocultarAuth();
}

/**
 * Manejar logout
 */
function manejarLogout() {
    console.log('✅ Usuario deslogueado');
    actualizarUIAuth();
    
    // Mostrar notificación
    mostrarNotificacion('Sesión cerrada', 'info');
}

/**
 * Manejar carga de progreso
 */
function manejarProgresoCargar(progreso) {
    console.log('✅ Progreso cargado:', progreso);
    
    // Aplicar configuración al juego
    aplicarConfiguracionAlJuego(progreso.config);
    
    // Actualizar UI con nivel del usuario
    actualizarInfoUsuario(progreso);
}

/**
 * Manejar guardado de progreso
 */
function manejarProgresoGuardar(progreso) {
    console.log('✅ Progreso guardado:', progreso);
    
    // Actualizar UI con nueva información
    actualizarInfoUsuario(progreso);
}

/**
 * Actualizar UI según estado de autenticación
 */
function actualizarUIAuth() {
    const authState = obtenerEstadoAuth();
    
    console.log('🔍 Debug actualizarUIAuth:');
    console.log('- authState:', authState);
    
    // Botón del lobby
    const lobbyLoginBtn = document.getElementById('lobby-login-btn');
    const authHint = document.querySelector('.auth-hint');
    
    if (authState.isAuthenticated) {
        console.log('✅ Usuario autenticado, actualizando UI');
        
        // Ocultar botón del lobby y mostrar info del usuario
        if (lobbyLoginBtn) {
            lobbyLoginBtn.style.display = 'none';
        }
        if (authHint) {
            // Crear botón de perfil clickeable
            authHint.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" id="user-profile-btn">
                    <span><i data-lucide="check-circle"></i> Conectado como <strong>${authState.user.username}</strong></span>
                    <button style="background: rgba(79, 195, 247, 0.2); border: 1px solid #4FC3F7; border-radius: 6px; padding: 4px 8px; color: #4FC3F7; font-size: 12px; cursor: pointer;">
                        <i data-lucide="user"></i> Perfil
                    </button>
                </div>
            `;
            authHint.style.color = '#00ff00';
            authHint.style.fontSize = '14px';
            
            // Reinicializar iconos Lucide después de agregar el HTML
            if (typeof window.reinicializarIconos === 'function') {
                window.reinicializarIconos();
            }
            
            // Agregar event listener al botón de perfil
            const profileBtn = document.getElementById('user-profile-btn');
            if (profileBtn) {
                profileBtn.addEventListener('click', () => {
                    // Usar función global para abrir menú de usuario
                    if (window.abrirMenuUsuario) {
                        window.abrirMenuUsuario();
                    } else {
                        console.warn('Función abrirMenuUsuario no disponible');
                    }
                });
            }
        }
    } else {
        console.log('❌ Usuario NO autenticado, mostrando botón de login solo en lobby');
        
        // Solo mostrar botón si estamos en el lobby (no en partida)
        const lobbyScreen = document.getElementById('lobby-screen');
        const isInLobby = lobbyScreen && !lobbyScreen.classList.contains('hidden');
        
        if (isInLobby) {
            // Mostrar botón del lobby
            if (lobbyLoginBtn) {
                lobbyLoginBtn.style.display = 'flex';
            }
            if (authHint) {
                authHint.textContent = 'Opcional: Guarda tu progreso en la nube';
                authHint.style.color = 'rgba(255, 255, 255, 0.6)';
                authHint.style.fontSize = '12px';
            }
        } else {
            // Ocultar botón si no estamos en el lobby
            if (lobbyLoginBtn) {
                lobbyLoginBtn.style.display = 'none';
            }
            
            // Agregar botón de perfil para usuarios no autenticados también
            if (authHint) {
                authHint.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
                        <span style="color: rgba(255, 255, 255, 0.6); font-size: 12px;">Modo Local</span>
                        <button style="background: rgba(79, 195, 247, 0.2); border: 1px solid #4FC3F7; border-radius: 6px; padding: 4px 8px; color: #4FC3F7; font-size: 12px; cursor: pointer;" onclick="window.abrirMenuUsuario()">
                            <i data-lucide="user"></i> Mi Personaje
                        </button>
                    </div>
                `;
                
                // Reinicializar iconos Lucide después de agregar el HTML
                if (typeof window.reinicializarIconos === 'function') {
                    window.reinicializarIconos();
                }
            }
        }
    }
}

/**
 * Actualizar información del usuario
 */
function actualizarInfoUsuario(progreso) {
    if (elementos.userLevel && progreso.progress) {
        elementos.userLevel.textContent = progreso.progress.level;
    }
}

/**
 * Aplicar configuración del usuario al juego
 */
function aplicarConfiguracionAlJuego(config) {
    // Aquí aplicarías la configuración al juego existente
    // Por ejemplo, actualizar CONFIG del juego
    if (window.CONFIG && config) {
        if (config.mouseSensitivity !== undefined) {
            window.CONFIG.controles.sensibilidadMouse = config.mouseSensitivity;
        }
        if (config.fov !== undefined && window.camera) {
            window.camera.fov = config.fov;
            window.camera.updateProjectionMatrix();
        }
    }
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear notificación temporal
    const notif = document.createElement('div');
    notif.className = `notification ${tipo}`;
    notif.textContent = mensaje;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${tipo === 'success' ? '#00ff00' : tipo === 'error' ? '#ff0000' : '#0088ff'};
        color: black;
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 3000;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

/**
 * Funciones de utilidad para UI
 */
function limpiarFormularios() {
    elementos.loginUsername.value = '';
    elementos.loginPassword.value = '';
    elementos.registerUsername.value = '';
    elementos.registerEmail.value = '';
    elementos.registerPassword.value = '';
    elementos.registerConfirm.value = '';
}

function mostrarError(mensaje) {
    elementos.authError.textContent = mensaje;
    elementos.authError.classList.remove('hidden');
}

function ocultarError() {
    elementos.authError.classList.add('hidden');
}

function mostrarLoading() {
    elementos.authLoading.classList.remove('hidden');
}

function ocultarLoading() {
    elementos.authLoading.classList.add('hidden');
}