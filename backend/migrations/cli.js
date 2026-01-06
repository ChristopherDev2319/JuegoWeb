#!/usr/bin/env node
// ============================================
// CLI PARA EJECUTAR MIGRACIONES
// ============================================

const { MigrationRunner } = require('./runner');
const db = require('../config/database');

async function main() {
    console.log('🚀 Iniciando migraciones...\n');
    
    try {
        // Probar conexión
        const connected = await db.testConnection(3);
        
        if (!connected) {
            console.error('❌ No se pudo conectar a PostgreSQL');
            console.log('\nVerifica que:');
            console.log('1. PostgreSQL esté corriendo');
            console.log('2. Las credenciales en .env.development sean correctas');
            console.log('3. La base de datos exista');
            process.exit(1);
        }
        
        // Ejecutar migraciones
        const runner = new MigrationRunner(db);
        const count = await runner.runPending();
        
        if (count === 0) {
            console.log('\n✅ Base de datos actualizada, no hay migraciones pendientes');
        } else {
            console.log(`\n✅ ${count} migraciones ejecutadas exitosamente`);
        }
        
        await db.closePool();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error ejecutando migraciones:', error.message);
        await db.closePool();
        process.exit(1);
    }
}

main();
