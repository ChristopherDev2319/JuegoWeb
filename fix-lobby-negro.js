// 🔧 SOLUCIÓN INMEDIATA PARA PANTALLA NEGRA
// Este script fuerza la ocultación del lobby inmediatamente

console.log('🔧 Aplicando fix para pantalla negra...');

// Función para ocultar lobby inmediatamente
function ocultarLobbyInmediato() {
    const lobbyScreen = document.getElementById('lobby-screen');
    if (lobbyScreen) {
        // Aplicar ambas clases inmediatamente
        lobbyScreen.classList.add('hidden');
        lobbyScreen.classList.add('hidden-immediate');
        lobbyScreen.style.display = 'none'; // Forzar display none
        console.log('✅ Lobby ocultado inmediatamente');
        return true;
    }
    return false;
}

// Función para verificar si el canvas está visible
function verificarCanvas() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
        console.log('✅ Canvas encontrado:', {
            display: getComputedStyle(canvas).display,
            visibility: getComputedStyle(canvas).visibility,
            opacity: getComputedStyle(canvas).opacity,
            zIndex: getComputedStyle(canvas).zIndex
        });
        return true;
    } else {
        console.log('❌ Canvas no encontrado');
        return false;
    }
}

// Función para verificar el estado del juego
function diagnosticarEstado() {
    console.log('🔍 Diagnóstico del estado actual:');
    
    const lobby = document.getElementById('lobby-screen');
    const loadingScreen = document.getElementById('loading-screen');
    const canvas = document.querySelector('canvas');
    
    console.log('📊 Estados:');
    console.log('  Lobby:', lobby ? {
        display: getComputedStyle(lobby).display,
        opacity: getComputedStyle(lobby).opacity,
        classes: lobby.className
    } : 'No encontrado');
    
    console.log('  Loading Screen:', loadingScreen ? {
        display: getComputedStyle(loadingScreen).display,
        opacity: getComputedStyle(loadingScreen).opacity,
        classes: loadingScreen.className
    } : 'No encontrado');
    
    console.log('  Canvas:', canvas ? {
        display: getComputedStyle(canvas).display,
        visibility: getComputedStyle(canvas).visibility,
        opacity: getComputedStyle(canvas).opacity
    } : 'No encontrado');
}

// Función principal de fix
function aplicarFix() {
    console.log('🚀 Iniciando fix de pantalla negra...');
    
    // Paso 1: Diagnosticar
    diagnosticarEstado();
    
    // Paso 2: Ocultar lobby inmediatamente
    if (ocultarLobbyInmediato()) {
        console.log('✅ Lobby ocultado');
    }
    
    // Paso 3: Verificar canvas
    setTimeout(() => {
        if (verificarCanvas()) {
            console.log('✅ Canvas verificado');
        }
        
        // Diagnóstico final
        setTimeout(() => {
            console.log('🔍 Estado final:');
            diagnosticarEstado();
        }, 1000);
    }, 500);
}

// Aplicar fix cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicarFix);
} else {
    aplicarFix();
}

// También aplicar fix cuando se haga click en "Modo Local"
document.addEventListener('click', (event) => {
    if (event.target.id === 'btn-modo-local' || event.target.closest('#btn-modo-local')) {
        console.log('🎮 Click en Modo Local detectado');
        setTimeout(() => {
            aplicarFix();
        }, 100);
    }
});

// Exponer funciones globalmente para debug manual
window.fixPantallaNegra = {
    ocultarLobby: ocultarLobbyInmediato,
    verificarCanvas: verificarCanvas,
    diagnosticar: diagnosticarEstado,
    aplicarFix: aplicarFix
};

console.log('🔧 Fix cargado. Usa window.fixPantallaNegra para debug manual.');