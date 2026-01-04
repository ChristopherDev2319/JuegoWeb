/**
 * Herramientas de verificación para bots en el juego principal
 * Ejecutar en la consola del navegador para diagnosticar problemas
 */

/**
 * Función principal de verificación de bots
 * Ejecutar: verificarBotsJuego()
 */
window.verificarBotsJuego = function() {
    console.log('🔍 === VERIFICACIÓN DE BOTS EN JUEGO PRINCIPAL ===');
    
    // Verificar variables globales
    if (typeof botManager === 'undefined' || !botManager) {
        console.error('❌ botManager no está definido');
        console.log('💡 Asegúrate de estar en modo local');
        return;
    }
    
    console.log('✅ botManager encontrado');
    console.log(`📊 Estado: ${botManager.estaActivo() ? 'Activo' : 'Inactivo'}`);
    console.log(`🔧 Inicializado: ${botManager.estaInicializado() ? 'Sí' : 'No'}`);
    
    // Obtener estadísticas
    const stats = botManager.obtenerEstadisticas();
    console.log('📊 Estadísticas:', stats);
    
    // Verificar bots por tipo
    const todosBots = botManager.obtenerTodosBots();
    console.log(`🤖 Total de bots: ${todosBots.length}`);
    
    if (todosBots.length === 0) {
        console.warn('⚠️ No hay bots creados');
        console.log('💡 Espera unos segundos o camina hacia las zonas de entrenamiento');
        return;
    }
    
    // Analizar cada bot
    todosBots.forEach((bot, index) => {
        console.log(`\n🤖 Bot ${index + 1}:`);
        console.log(`   Tipo: ${bot.obtenerTipo()}`);
        console.log(`   Vivo: ${bot.estaVivo() ? '✅' : '❌'}`);
        console.log(`   Vida: ${bot.obtenerVida()}/${bot.obtenerVidaMaxima()}`);
        
        if (bot.mesh) {
            console.log(`   Mesh: ✅ Presente`);
            console.log(`   Posición: (${bot.mesh.position.x.toFixed(2)}, ${bot.mesh.position.y.toFixed(2)}, ${bot.mesh.position.z.toFixed(2)})`);
            console.log(`   Visible: ${bot.mesh.visible ? '✅' : '❌'}`);
            console.log(`   En escena: ${bot.mesh.parent ? '✅' : '❌'}`);
            console.log(`   Escala: (${bot.mesh.scale.x.toFixed(2)}, ${bot.mesh.scale.y.toFixed(2)}, ${bot.mesh.scale.z.toFixed(2)})`);
            
            // Verificar tamaño real
            const box = new THREE.Box3().setFromObject(bot.mesh);
            const size = box.getSize(new THREE.Vector3());
            console.log(`   Tamaño real: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
            
            if (size.y < 2) {
                console.warn(`   ⚠️ Bot pequeño (altura ${size.y.toFixed(2)})`);
            } else if (size.y > 6) {
                console.warn(`   ⚠️ Bot muy grande (altura ${size.y.toFixed(2)})`);
            } else {
                console.log(`   ✅ Tamaño apropiado (altura ${size.y.toFixed(2)})`);
            }
            
            // Verificar si es fallback
            if (bot.mesh.userData.esFallback) {
                console.warn(`   ⚠️ USANDO CUBO FALLBACK (modelo de oso no cargó)`);
            } else {
                console.log(`   🐻 Usando modelo de oso`);
            }
            
            // Verificar materiales
            let materialesVisibles = 0;
            let materialesInvisibles = 0;
            bot.mesh.traverse((child) => {
                if (child.isMesh) {
                    if (child.visible && child.material && child.material.visible && child.material.opacity > 0) {
                        materialesVisibles++;
                    } else {
                        materialesInvisibles++;
                    }
                }
            });
            console.log(`   Materiales: ${materialesVisibles} visibles, ${materialesInvisibles} invisibles`);
            
        } else {
            console.error(`   ❌ Mesh no existe`);
        }
    });
    
    // Verificar zonas
    console.log('\n🏟️ === ZONAS DE ENTRENAMIENTO ===');
    const zonas = botManager.obtenerZonas();
    zonas.forEach((zona, index) => {
        console.log(`Zona ${index + 1}: ${zona.obtenerNombre()}`);
        console.log(`   Tipo: ${zona.obtenerTipo()}`);
        console.log(`   Activa: ${zona.estaActiva() ? '✅' : '❌'}`);
        console.log(`   Centro: (${zona.centro.x}, ${zona.centro.y}, ${zona.centro.z})`);
        console.log(`   Radio: ${zona.radio}`);
    });
    
    // Verificar posición del jugador
    if (typeof jugador !== 'undefined' && jugador.posicion) {
        console.log('\n👤 === POSICIÓN DEL JUGADOR ===');
        const pos = jugador.posicion;
        console.log(`📍 Posición: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
        
        // Calcular distancia a cada zona
        zonas.forEach((zona) => {
            const distancia = Math.sqrt(
                Math.pow(pos.x - zona.centro.x, 2) + 
                Math.pow(pos.z - zona.centro.z, 2)
            );
            const dentroZona = distancia <= zona.radio;
            console.log(`🏟️ ${zona.obtenerNombre()}: ${distancia.toFixed(2)}m ${dentroZona ? '(DENTRO)' : '(FUERA)'}`);
        });
    }
    
    console.log('\n✅ Verificación completada');
};

/**
 * Función para forzar recreación de bots
 * Ejecutar: recrearBotsJuego()
 */
window.recrearBotsJuego = function() {
    console.log('🔄 === RECREANDO BOTS ===');
    
    if (!botManager) {
        console.error('❌ botManager no disponible');
        return;
    }
    
    console.log('🗑️ Destruyendo bots existentes...');
    botManager.destruir();
    
    console.log('🔄 Reinicializando sistema...');
    setTimeout(() => {
        botManager.inicializar();
        console.log('✅ Bots recreados');
        
        // Verificar después de 3 segundos
        setTimeout(() => {
            verificarBotsJuego();
        }, 3000);
    }, 1000);
};

/**
 * Función para verificar carga del modelo de oso
 * Ejecutar: verificarModeloOso()
 */
window.verificarModeloOso = function() {
    console.log('🐻 === VERIFICACIÓN DEL MODELO DE OSO ===');
    
    const loader = new THREE.GLTFLoader();
    
    console.log('🔄 Intentando cargar /modelos/cubed_bear.glb...');
    
    loader.load('/modelos/cubed_bear.glb', 
        (gltf) => {
            console.log('✅ Modelo cargado exitosamente');
            
            const scene = gltf.scene;
            const box = new THREE.Box3().setFromObject(scene);
            const size = box.getSize(new THREE.Vector3());
            
            console.log(`📏 Tamaño original: ${size.x.toFixed(3)} x ${size.y.toFixed(3)} x ${size.z.toFixed(3)}`);
            
            if (size.x < 0.5 || size.y < 0.5 || size.z < 0.5) {
                console.warn('⚠️ Modelo muy pequeño - Se aplicará escala x4.0');
            } else if (size.x < 1.5 || size.y < 1.5 || size.z < 1.5) {
                console.warn('⚠️ Modelo pequeño - Se aplicará escala x2.5');
            } else {
                console.log('✅ Modelo tamaño normal - Se aplicará escala x2.0');
            }
            
            let meshCount = 0;
            scene.traverse((child) => {
                if (child.isMesh) {
                    meshCount++;
                    console.log(`   Mesh ${meshCount}: ${child.name || 'Sin nombre'}`);
                    if (child.material) {
                        console.log(`     └ Material: ${child.material.type}`);
                        console.log(`     └ Color: #${child.material.color ? child.material.color.getHexString() : 'N/A'}`);
                        console.log(`     └ Textura: ${child.material.map ? '✅' : '❌'}`);
                    }
                }
            });
            
            console.log(`📊 Total: ${meshCount} meshes`);
            
        },
        (progress) => {
            if (progress.total > 0) {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                console.log(`🔄 Progreso: ${percent}%`);
            }
        },
        (error) => {
            console.error('❌ Error cargando modelo:', error);
            console.log('💡 Posibles soluciones:');
            console.log('   1. Verificar que el servidor HTTP esté corriendo');
            console.log('   2. Abrir http://localhost:3000/modelos/cubed_bear.glb directamente');
            console.log('   3. Verificar permisos del archivo');
        }
    );
};

/**
 * Función para mostrar información de la escena
 * Ejecutar: verificarEscenaJuego()
 */
window.verificarEscenaJuego = function() {
    console.log('🎬 === VERIFICACIÓN DE ESCENA ===');
    
    if (typeof scene === 'undefined') {
        console.error('❌ Variable scene no disponible');
        return;
    }
    
    console.log(`📊 Objetos en escena: ${scene.children.length}`);
    
    // Buscar bots en la escena
    let botsEncontrados = 0;
    let objetosPorTipo = {};
    
    scene.traverse((child) => {
        const tipo = child.type || 'Unknown';
        objetosPorTipo[tipo] = (objetosPorTipo[tipo] || 0) + 1;
        
        if (child.userData && child.userData.bot) {
            botsEncontrados++;
            console.log(`🤖 Bot encontrado: ${child.userData.tipo} en (${child.position.x.toFixed(2)}, ${child.position.y.toFixed(2)}, ${child.position.z.toFixed(2)})`);
        }
    });
    
    console.log(`🤖 Total bots en escena: ${botsEncontrados}`);
    console.log('📊 Objetos por tipo:', objetosPorTipo);
    
    if (botsEncontrados === 0) {
        console.warn('⚠️ No se encontraron bots en la escena');
        console.log('💡 Los bots pueden no haberse creado o estar fuera del rango de visión');
    }
};

// Mostrar funciones disponibles
console.log('🔧 === HERRAMIENTAS DE VERIFICACIÓN CARGADAS ===');
console.log('Funciones disponibles:');
console.log('  verificarBotsJuego() - Verificación completa de bots');
console.log('  recrearBotsJuego() - Forzar recreación de bots');
console.log('  verificarModeloOso() - Verificar carga del modelo');
console.log('  verificarEscenaJuego() - Verificar objetos en escena');

/**
 * Sistema de notificaciones visuales para desarrollo
 */
window.mostrarNotificacionBot = function(mensaje, tipo = 'info') {
    // Solo mostrar en desarrollo (cuando hay consola abierta)
    if (!window.console || !console.log) return;
    
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 165, 0, 0.9)'};
        color: black;
        padding: 10px 15px;
        border-radius: 5px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transition: opacity 0.3s ease;
    `;
    notificacion.textContent = mensaje;
    
    document.body.appendChild(notificacion);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notificacion.style.opacity = '0';
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.parentNode.removeChild(notificacion);
            }
        }, 300);
    }, 3000);
};