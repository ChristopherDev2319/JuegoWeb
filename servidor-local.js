/**
 * Servidor HTTP simple para servir archivos estáticos
 * Úsalo para probar el juego localmente
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Servir archivos estáticos
app.use(express.static(__dirname));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎮 Servidor web corriendo en http://localhost:${PORT}`);
  console.log(`🔫 Servidor de juego corriendo en puerto 3000`);
  console.log(`\n🔧 CONFIGURACIÓN:`);
  console.log(`   📋 Configurar juego: http://localhost:${PORT}/configurar.html`);
  console.log(`   🎯 Jugar directamente: http://localhost:${PORT}`);
  console.log(`   🧪 Test armas: http://localhost:${PORT}/test-armas.html`);
  console.log(`   🎯 Test apuntado: http://localhost:${PORT}/test-apuntado.html`);
  console.log(`\n📋 CONTROLES DEL NUEVO SISTEMA DE ARMAS:`);
  console.log(`   WASD - Movimiento`);
  console.log(`   Mouse - Mirar alrededor`);
  console.log(`   Clic Izquierdo - Disparar`);
  console.log(`   Clic Derecho - Apuntar (NUEVO)`);
  console.log(`   R - Recargar`);
  console.log(`   E - Dash`);
  console.log(`   Q / Rueda Mouse - Cambiar arma`);
  console.log(`   1-8 - Seleccionar arma directamente`);
  console.log(`\n🔫 ARMAS DISPONIBLES (con modelos 3D reales):`);
  console.log(`   1. M4A1 (Rifle de Asalto) - Zoom 1.5x`);
  console.log(`   2. Colt 1911 (Pistola) - Zoom 1.2x`);
  console.log(`   3. AK-47 (Rifle Pesado) - Zoom 1.4x`);
  console.log(`   4. AWP (Francotirador) - Zoom 4.0x`);
  console.log(`   5. Pump Shotgun (Escopeta) - Zoom 1.3x`);
  console.log(`   6. MP5 (Subfusil) - Zoom 1.3x`);
  console.log(`   7. SCAR-H (Rifle Pesado) - Zoom 1.6x`);
  console.log(`   8. USP .45 (Pistola) - Zoom 1.25x`);
  console.log(`\n🎯 ¡Empieza en http://localhost:${PORT}/configurar.html para elegir tu modo de juego!`);
});