/**
 * Sistema de debugging para bots
 * Proporciona herramientas para diagnosticar problemas con los bots de entrenamiento
 */

export class BotDebugger {
    constructor() {
        this.logs = [];
        this.habilitado = true;
    }

    log(mensaje, tipo = 'info') {
        if (!this.habilitado) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            mensaje,
            tipo
        };
        
        this.logs.push(logEntry);
        
        // Mantener solo los últimos 100 logs
        if (this.logs.length > 100) {
            this.logs.shift();
        }
        
        // Mostrar en consola con colores
        const styles = {
            info: 'color: #00aaff',
            success: 'color: #00ff00',
            warning: 'color: #ffaa00',
            error: 'color: #ff0000'
        };
        
        console.log(`%c[${timestamp}] 🤖 ${mensaje}`, styles[tipo] || styles.info);
    }

    verificarModelo(callback) {
        this.log('Verificando modelo cubed_bear.glb...', 'info');
        
        const loader = new THREE.GLTFLoader();
        
        loader.load('/modelos/cubed_bear.glb',
            (gltf) => {
                this.log('✅ Modelo cargado exitosamente', 'success');
                
                // Analizar modelo
                const analisis = this.analizarModelo(gltf.scene);
                this.log(`📊 Modelo analizado: ${analisis.meshes} meshes, ${analisis.materiales} materiales`, 'info');
                
                if (callback) callback(true, gltf, analisis);
            },
            (progress) => {
                if (progress.total > 0) {
                    const percent = Math.round((progress.loaded / progress.total) * 100);
                    this.log(`🔄 Cargando: ${percent}%`, 'info');
                }
            },
            (error) => {
                this.log(`❌ Error cargando modelo: ${error.message}`, 'error');
                if (callback) callback(false, null, error);
            }
        );
    }

    analizarModelo(scene) {
        let meshes = 0;
        let materiales = 0;
        let texturas = 0;
        const detalles = [];

        scene.traverse((child) => {
            if (child.isMesh) {
                meshes++;
                const material = child.material;
                
                if (material) {
                    materiales++;
                    if (material.map) texturas++;
                    
                    detalles.push({
                        nombre: child.name || `Mesh_${meshes}`,
                        tipoMaterial: material.type,
                        tieneTextura: !!material.map,
                        color: material.color ? material.color.getHexString() : 'N/A'
                    });
                }
            }
        });

        return {
            meshes,
            materiales,
            texturas,
            detalles
        };
    }

    crearBotPrueba(scene, x = 0, y = 1, z = 0, color = 0xff0000) {
        this.log(`Creando bot de prueba en (${x}, ${y}, ${z}) con color ${color.toString(16)}`, 'info');
        
        return new Promise((resolve, reject) => {
            this.verificarModelo((exito, gltf, analisis) => {
                if (!exito) {
                    this.log('❌ No se puede crear bot: modelo no disponible', 'error');
                    reject(analisis);
                    return;
                }

                try {
                    // Clonar modelo
                    const bot = gltf.scene.clone();
                    
                    // Configurar posición
                    bot.position.set(x, y, z);
                    bot.scale.set(1.0, 1.0, 1.0);
                    
                    // Aplicar color
                    let materialesProcesados = 0;
                    bot.traverse((child) => {
                        if (child.isMesh && child.material) {
                            materialesProcesados++;
                            child.material = child.material.clone();
                            child.material.color.setHex(color);
                            child.material.needsUpdate = true;
                        }
                    });
                    
                    // Agregar a escena
                    scene.add(bot);
                    
                    this.log(`✅ Bot de prueba creado (${materialesProcesados} materiales procesados)`, 'success');
                    resolve(bot);
                    
                } catch (error) {
                    this.log(`❌ Error creando bot de prueba: ${error.message}`, 'error');
                    reject(error);
                }
            });
        });
    }

    diagnosticarBotManager(botManager) {
        this.log('=== DIAGNÓSTICO DE BOT MANAGER ===', 'info');
        
        if (!botManager) {
            this.log('❌ BotManager no disponible', 'error');
            return;
        }

        this.log(`Estado: ${botManager.estaActivo() ? 'Activo' : 'Inactivo'}`, 'info');
        this.log(`Inicializado: ${botManager.estaInicializado() ? 'Sí' : 'No'}`, 'info');
        
        const bots = botManager.obtenerTodosBots();
        this.log(`Total de bots: ${bots.length}`, 'info');
        
        bots.forEach((bot, index) => {
            this.log(`Bot ${index + 1}: ${bot.obtenerTipo()} - ${bot.estaVivo() ? 'Vivo' : 'Muerto'}`, 'info');
            
            if (bot.mesh) {
                const pos = bot.mesh.position;
                this.log(`  Posición: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`, 'info');
                this.log(`  Visible: ${bot.mesh.visible ? 'Sí' : 'No'}`, bot.mesh.visible ? 'success' : 'warning');
                
                if (bot.mesh.userData.esFallback) {
                    this.log('  ⚠️ Usando cubo fallback', 'warning');
                } else {
                    this.log('  🐻 Usando modelo de oso', 'success');
                }
            } else {
                this.log('  ❌ Sin mesh', 'error');
            }
        });
        
        // Verificar zonas
        const zonas = botManager.obtenerZonas();
        this.log(`Zonas: ${zonas.length}`, 'info');
        zonas.forEach((zona, index) => {
            this.log(`  Zona ${index + 1}: ${zona.obtenerNombre()} - ${zona.estaActiva() ? 'Activa' : 'Inactiva'}`, 'info');
        });
    }

    obtenerLogs() {
        return this.logs;
    }

    limpiarLogs() {
        this.logs = [];
        this.log('Logs limpiados', 'info');
    }

    habilitar() {
        this.habilitado = true;
        this.log('Debugger habilitado', 'success');
    }

    deshabilitar() {
        this.habilitado = false;
    }
}

// Crear instancia global
export const botDebugger = new BotDebugger();

// Exponer en window para uso en consola
if (typeof window !== 'undefined') {
    window.botDebugger = botDebugger;
}