/**
 * Script de diagnóstico para bots
 * Ejecutar en la consola del navegador cuando el juego esté corriendo
 */

// Función principal de diagnóstico
function diagnosticarBots() {
    console.log('🤖 === DIAGNÓSTICO DE BOTS ===');
    
    // Verificar si el botManager existe
    if (typeof botManager === 'undefined' || !botManager) {
        console.error('❌ botManager no está definido o es null');
        console.log('💡 Asegúrate de estar en modo local y que el juego haya iniciado');
        return;
    }
    
    console.log('✅ botManager encontrado');
    console.log(`📊 Estado: ${botManager.estaActivo() ? 'Activo' : 'Inactivo'}`);
    console.log(`🔧 Inicializado: ${botManager.estaInicializado() ? 'Sí' : 'No'}`);
    
    // Obtener todos los bots
    const todosBots = botManager.obtenerTodosBots();
    console.log(`🤖 Total de bots: ${todosBots.length}`);
    
    if (todosBots.length === 0) {
        console.warn('⚠️ No hay bots creados');
        console.log('💡 Verifica que estés en modo local y cerca de las zonas de entrenamiento');
        return;
    }
    
    // Analizar cada bot
    todosBots.forEach((bot, index) => {
        console.log(`\n🤖 Bot ${index + 1}:`);
        console.log(`   Tipo: ${bot.obtenerTipo()}`);
        console.log(`   Vivo: ${bot.estaVivo() ? '✅' : '❌'}`);
        console.log(`   Vida: ${bot.obtenerVida()}/${bot.obtenerVidaMaxima()}`);
        
        // Verificar mesh
        if (bot.mesh) {
            console.log(`   Mesh: ✅ Presente`);
            console.log(`   Posición: (${bot.mesh.position.x.toFixed(2)}, ${bot.mesh.position.y.toFixed(2)}, ${bot.mesh.position.z.toFixed(2)})`);
            console.log(`   Visible: ${bot.mesh.visible ? '✅' : '❌'}`);
            console.log(`   En escena: ${bot.mesh.parent ? '✅' : '❌'}`);
            
            // Verificar si es fallback
            if (bot.mesh.userData.esFallback) {
                console.warn(`   ⚠️ USANDO CUBO FALLBACK (modelo de oso no cargó)`);
            } else {
                console.log(`   🐻 Usando modelo de oso`);
            }
            
            // Analizar materiales
            let materialesCount = 0;
            bot.mesh.traverse((child) => {
                if (child.isMesh) {
                    materialesCount++;
                    const material = child.material;
                    console.log(`   Material ${materialesCount}:`);
                    console.log(`     └ Tipo: ${material.type}`);
                    console.log(`     └ Color: #${material.color.getHexString()}`);
                    console.log(`     └ Textura: ${material.map ? '✅' : '❌'}`);
                    console.log(`     └ Visible: ${material.visible ? '✅' : '❌'}`);
                }
            });
            
        } else {
            console.error(`   ❌ Mesh no existe`);
        }
        
        // Verificar barra de vida
        if (bot.spriteBarraVida) {
            console.log(`   Barra de vida: ✅ Presente`);
            console.log(`   Barra visible: ${bot.spriteBarraVida.visible ? '✅' : '❌'}`);
        } else {
            console.warn(`   ⚠️ Barra de vida no existe`);
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
    
    // Estadísticas
    console.log('\n📊 === ESTADÍSTICAS ===');
    const stats = botManager.obtenerEstadisticas();
    console.log('Estadísticas:', stats);
    
    console.log('\n✅ Diagnóstico completado');
}

// Función para verificar el modelo de oso específicamente
function verificarModeloOso() {
    console.log('🐻 === VERIFICACIÓN DEL MODELO DE OSO ===');
    
    const loader = new THREE.GLTFLoader();
    
    console.log('🔄 Intentando cargar /modelos/cubed_bear.glb...');
    
    loader.load('/modelos/cubed_bear.glb', 
        (gltf) => {
            console.log('✅ Modelo cargado exitosamente');
            console.log('📊 Análisis del modelo:');
            
            const scene = gltf.scene;
            let meshCount = 0;
            let materialCount = 0;
            
            scene.traverse((child) => {
                if (child.isMesh) {
                    meshCount++;
                    console.log(`   Mesh ${meshCount}: ${child.name || 'Sin nombre'}`);
                    console.log(`     └ Geometría: ${child.geometry.type}`);
                    console.log(`     └ Vértices: ${child.geometry.attributes.position?.count || 0}`);
                    
                    if (child.material) {
                        materialCount++;
                        const mat = child.material;
                        console.log(`     └ Material: ${mat.type}`);
                        console.log(`     └ Color: #${mat.color ? mat.color.getHexString() : 'N/A'}`);
                        console.log(`     └ Textura: ${mat.map ? '✅ Sí' : '❌ No'}`);
                        if (mat.map && mat.map.image) {
                            console.log(`     └ Textura URL: ${mat.map.image.src || 'Blob/DataURL'}`);
                        }
                    }
                }
            });
            
            console.log(`📊 Total: ${meshCount} meshes, ${materialCount} materiales`);
            
            // Probar clonación (como hace BotBase)
            console.log('🔄 Probando clonación...');
            try {
                const clon = scene.clone();
                console.log('✅ Clonación exitosa');
                
                // Probar modificación de materiales
                clon.traverse((child) => {
                    if (child.isMesh && child.material) {
                        try {
                            child.material = child.material.clone();
                            child.material.color.setHex(0xff0000);
                            child.material.needsUpdate = true;
                            console.log('✅ Modificación de material exitosa');
                        } catch (error) {
                            console.error('❌ Error modificando material:', error);
                        }
                    }
                });
                
            } catch (error) {
                console.error('❌ Error en clonación:', error);
            }
            
        },
        (progress) => {
            if (progress.total > 0) {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                console.log(`🔄 Progreso: ${percent}%`);
            }
        },
        (error) => {
            console.error('❌ Error cargando modelo:', error);
            console.error('📋 Detalles:', error.message);
            
            // Sugerencias de solución
            console.log('💡 Posibles soluciones:');
            console.log('   1. Verificar que el archivo /modelos/cubed_bear.glb existe');
            console.log('   2. Verificar permisos del archivo');
            console.log('   3. Verificar que el servidor HTTP está corriendo');
            console.log('   4. Abrir /modelos/cubed_bear.glb directamente en el navegador');
        }
    );
}

// Función para forzar recreación de bots
function recrearBots() {
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
    }, 1000);
}

// Función para verificar la escena Three.js
function verificarEscena() {
    console.log('🎬 === VERIFICACIÓN DE ESCENA ===');
    
    if (typeof scene === 'undefined') {
        console.error('❌ Variable scene no disponible');
        return;
    }
    
    console.log(`📊 Objetos en escena: ${scene.children.length}`);
    
    // Buscar bots en la escena
    let botsEncontrados = 0;
    scene.traverse((child) => {
        if (child.userData && child.userData.bot) {
            botsEncontrados++;
            console.log(`🤖 Bot encontrado: ${child.userData.tipo} en (${child.position.x.toFixed(2)}, ${child.position.y.toFixed(2)}, ${child.position.z.toFixed(2)})`);
        }
    });
    
    console.log(`🤖 Total bots en escena: ${botsEncontrados}`);
    
    if (botsEncontrados === 0) {
        console.warn('⚠️ No se encontraron bots en la escena');
        console.log('💡 Los bots pueden no haberse creado o estar fuera del rango de visión');
    }
}

// Función para mostrar información de posición del jugador
function verificarPosicionJugador() {
    console.log('👤 === POSICIÓN DEL JUGADOR ===');
    
    if (typeof jugador === 'undefined') {
        console.error('❌ Variable jugador no disponible');
        return;
    }
    
    const pos = jugador.posicion;
    console.log(`📍 Posición: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
    
    // Verificar distancia a zonas de entrenamiento
    if (botManager) {
        const zonas = botManager.obtenerZonas();
        zonas.forEach((zona) => {
            const distancia = Math.sqrt(
                Math.pow(pos.x - zona.centro.x, 2) + 
                Math.pow(pos.z - zona.centro.z, 2)
            );
            const dentroZona = distancia <= zona.radio;
            console.log(`🏟️ ${zona.obtenerNombre()}: ${distancia.toFixed(2)}m ${dentroZona ? '(DENTRO)' : '(FUERA)'}`);
        });
    }
}

// Exportar funciones para uso en consola
window.diagnosticarBots = diagnosticarBots;
window.verificarModeloOso = verificarModeloOso;
window.recrearBots = recrearBots;
window.verificarEscena = verificarEscena;
window.verificarPosicionJugador = verificarPosicionJugador;

console.log('🔧 === HERRAMIENTAS DE DIAGNÓSTICO CARGADAS ===');
console.log('Funciones disponibles:');
console.log('  diagnosticarBots() - Diagnóstico completo de bots');
console.log('  verificarModeloOso() - Verificar carga del modelo de oso');
console.log('  recrearBots() - Forzar recreación de bots');
console.log('  verificarEscena() - Verificar objetos en la escena');
console.log('  verificarPosicionJugador() - Ver posición y distancia a zonas');