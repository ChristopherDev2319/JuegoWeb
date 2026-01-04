#!/usr/bin/env node

/**
 * 🚀 SERVIDOR DE DESARROLLO PARA SOLUCIONAR CORS
 * 
 * Este servidor sirve archivos estáticos y soluciona los errores:
 * - Access to XMLHttpRequest blocked by CORS policy
 * - file:/// URLs no funcionan en navegadores
 * 
 * USO:
 * 1. node servidor-desarrollo.js
 * 2. Abrir http://localhost:3000
 * 3. Navegar a los archivos de test
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Configurar CORS para permitir carga de archivos
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(__dirname));

// Ruta específica para modelos (por si acaso)
app.use('/modelos', express.static(path.join(__dirname, 'modelos')));

// Ruta de inicio que muestra archivos de test disponibles
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>🚀 Servidor de Desarrollo - Juego FPS</title>
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    background: #1a1a1a;
                    color: #00ff00;
                    padding: 20px;
                    line-height: 1.6;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                }
                h1 { color: #00aaff; }
                h2 { color: #ffaa00; }
                .success { color: #00ff00; }
                .warning { color: #ffaa00; }
                .error { color: #ff0000; }
                .link {
                    display: block;
                    color: #00aaff;
                    text-decoration: none;
                    padding: 8px 12px;
                    margin: 5px 0;
                    background: rgba(0, 170, 255, 0.1);
                    border-radius: 4px;
                    border-left: 4px solid #00aaff;
                }
                .link:hover {
                    background: rgba(0, 170, 255, 0.2);
                }
                .status {
                    background: rgba(0, 255, 0, 0.1);
                    border: 1px solid #00ff00;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Servidor de Desarrollo Activo</h1>
                
                <div class="status">
                    <h2 class="success">✅ CORS Solucionado</h2>
                    <p>El servidor HTTP está corriendo correctamente en <strong>http://localhost:${PORT}</strong></p>
                    <p>Los modelos 3D ahora se cargarán sin errores de CORS.</p>
                </div>

                <h2>🧪 Archivos de Test Disponibles:</h2>
                
                <h3>🐻 Tests de Bots y Modelos:</h3>
                <a href="/test-osos-grandes.html" class="link">
                    🐻 Test Osos GRANDES - RECOMENDADO
                </a>
                <a href="/test-oso-diagnostico.html" class="link">
                    🔍 Diagnóstico Modelo de Oso
                </a>
                <a href="/test-bots-skin-original.html" class="link">
                    🐻 Test Bots con Skin Original
                </a>
                <a href="/test-bot-skin.html" class="link">
                    🤖 Test Bot Skin - Diagnóstico
                </a>
                <a href="/test-bot-diagnostico.html" class="link">
                    🔧 Test Bot Diagnóstico
                </a>
                
                <h3>🎮 Tests del Juego:</h3>
                <a href="/index.html" class="link">
                    🎮 Juego Principal
                </a>
                <a href="/test-simple.html" class="link">
                    🎯 Test Simple
                </a>
                <a href="/test-menu-pausa.html" class="link">
                    ⏸️ Test Menú Pausa
                </a>
                
                <h3>🔧 Tests Técnicos:</h3>
                <a href="/test-clicks-urgente.html" class="link">
                    🚨 TEST CLICKS URGENTE - PROBAR PRIMERO
                </a>
                <a href="/test-clicks-simple.html" class="link">
                    🔧 Test Clicks Simple - DIAGNÓSTICO
                </a>
                <a href="/test-modelos.html" class="link">
                    📦 Test Modelos
                </a>
                <a href="/test-armas.html" class="link">
                    🔫 Test Armas
                </a>
                <a href="/test-todos-sonidos.html" class="link">
                    🔊 Test Todos los Sonidos
                </a>
                
                <h3>📁 Verificar Archivos:</h3>
                <a href="/modelos/cubed_bear.glb" class="link">
                    🐻 Verificar cubed_bear.glb (debe descargar)
                </a>
                
                <div class="status">
                    <h3 class="warning">⚠️ Importante:</h3>
                    <ul>
                        <li><strong>NUNCA</strong> abras los archivos HTML con doble click</li>
                        <li><strong>SIEMPRE</strong> usa este servidor (http://localhost:${PORT})</li>
                        <li>Si ves errores de CORS, verifica que estés usando HTTP, no file:///</li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
🚀 ===== SERVIDOR DE DESARROLLO INICIADO =====

✅ Servidor corriendo en: http://localhost:${PORT}
✅ CORS configurado correctamente
✅ Archivos estáticos servidos desde: ${__dirname}

🐻 PARA PROBAR LOS BOTS:
   👉 http://localhost:${PORT}/test-bots-skin-original.html

🎮 PARA EL JUEGO PRINCIPAL:
   👉 http://localhost:${PORT}/index.html

📁 PARA VERIFICAR EL MODELO:
   👉 http://localhost:${PORT}/modelos/cubed_bear.glb

⚠️  IMPORTANTE: 
   - NO abras archivos HTML con doble click
   - SIEMPRE usa http://localhost:${PORT}
   - Si cambias archivos, recarga la página

🛑 Para detener: Ctrl+C
`);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor de desarrollo...');
    process.exit(0);
});