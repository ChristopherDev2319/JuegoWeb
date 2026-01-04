/**
 * Indicador visual del estado de los bots en el juego
 * Muestra información en tiempo real sobre los bots cargados
 */

export class IndicadorBots {
    constructor() {
        this.elemento = null;
        this.visible = false;
        this.bots = [];
        this.ultimaActualizacion = 0;
        this.crearElemento();
    }

    crearElemento() {
        this.elemento = document.createElement('div');
        this.elemento.id = 'indicador-bots';
        this.elemento.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            z-index: 1000;
            min-width: 200px;
            border: 1px solid #333;
            display: none;
        `;
        
        document.body.appendChild(this.elemento);
    }

    mostrar() {
        if (this.elemento) {
            this.elemento.style.display = 'block';
            this.visible = true;
        }
    }

    ocultar() {
        if (this.elemento) {
            this.elemento.style.display = 'none';
            this.visible = false;
        }
    }

    alternar() {
        if (this.visible) {
            this.ocultar();
        } else {
            this.mostrar();
        }
    }

    actualizar(botManager) {
        if (!this.visible || !botManager) return;

        const ahora = Date.now();
        if (ahora - this.ultimaActualizacion < 1000) return; // Actualizar cada segundo
        this.ultimaActualizacion = ahora;

        const todosBots = botManager.obtenerTodosBots();
        const stats = botManager.obtenerEstadisticas();

        let html = `
            <div style="color: #00aaff; font-weight: bold; margin-bottom: 8px;">
                🤖 ESTADO DE BOTS
            </div>
            <div style="margin-bottom: 5px;">
                Total: <span style="color: #00ff00;">${todosBots.length}</span>
            </div>
            <div style="margin-bottom: 5px;">
                Vivos: <span style="color: #00ff00;">${stats.botsVivos}</span> | 
                Muertos: <span style="color: #ff0000;">${stats.botsMuertos}</span>
            </div>
            <div style="margin-bottom: 8px;">
                Eliminaciones: <span style="color: #ffaa00;">${stats.eliminaciones}</span>
            </div>
        `;

        // Información por tipo
        const tipos = ['estatico', 'movil', 'tirador'];
        tipos.forEach(tipo => {
            const botsTipo = todosBots.filter(bot => bot.obtenerTipo() === tipo);
            if (botsTipo.length > 0) {
                const vivos = botsTipo.filter(bot => bot.estaVivo()).length;
                const color = vivos > 0 ? '#00ff00' : '#ff0000';
                html += `
                    <div style="font-size: 10px; margin-bottom: 2px;">
                        ${tipo.toUpperCase()}: <span style="color: ${color};">${vivos}/${botsTipo.length}</span>
                    </div>
                `;
            }
        });

        // Información de tamaño (solo para el primer bot de cada tipo)
        let infoTamaño = '';
        tipos.forEach(tipo => {
            const bot = todosBots.find(bot => bot.obtenerTipo() === tipo);
            if (bot && bot.mesh) {
                const box = new THREE.Box3().setFromObject(bot.mesh);
                const size = box.getSize(new THREE.Vector3());
                const altura = size.y.toFixed(1);
                const color = size.y < 2 ? '#ff0000' : size.y > 6 ? '#ffaa00' : '#00ff00';
                infoTamaño += `
                    <div style="font-size: 9px; color: #888; margin-bottom: 1px;">
                        ${tipo}: <span style="color: ${color};">${altura}u</span>
                    </div>
                `;
            }
        });

        if (infoTamaño) {
            html += `
                <div style="border-top: 1px solid #333; margin-top: 5px; padding-top: 5px;">
                    <div style="color: #888; font-size: 9px; margin-bottom: 3px;">ALTURAS:</div>
                    ${infoTamaño}
                </div>
            `;
        }

        // Controles
        html += `
            <div style="border-top: 1px solid #333; margin-top: 5px; padding-top: 5px; font-size: 9px; color: #888;">
                F1: Ocultar | F2: Verificar | F3: Recrear
            </div>
        `;

        this.elemento.innerHTML = html;
    }

    destruir() {
        if (this.elemento && this.elemento.parentNode) {
            this.elemento.parentNode.removeChild(this.elemento);
        }
    }
}

// Crear instancia global
let indicadorBots = null;

// Función para inicializar el indicador
export function inicializarIndicadorBots() {
    if (!indicadorBots) {
        indicadorBots = new IndicadorBots();
        
        // Controles de teclado
        document.addEventListener('keydown', (event) => {
            if (event.code === 'F1') {
                event.preventDefault();
                indicadorBots.alternar();
            } else if (event.code === 'F2') {
                event.preventDefault();
                if (typeof verificarBotsJuego === 'function') {
                    verificarBotsJuego();
                }
            } else if (event.code === 'F3') {
                event.preventDefault();
                if (typeof recrearBotsJuego === 'function') {
                    recrearBotsJuego();
                }
            }
        });
        
        console.log('🔧 Indicador de bots inicializado');
        console.log('   F1: Mostrar/Ocultar indicador');
        console.log('   F2: Verificar bots en consola');
        console.log('   F3: Recrear bots');
    }
    
    return indicadorBots;
}

// Función para actualizar el indicador
export function actualizarIndicadorBots(botManager) {
    if (indicadorBots) {
        indicadorBots.actualizar(botManager);
    }
}

// Función para mostrar el indicador automáticamente en modo local
export function mostrarIndicadorEnModoLocal() {
    if (indicadorBots) {
        indicadorBots.mostrar();
    }
}