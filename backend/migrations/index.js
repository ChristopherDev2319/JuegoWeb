// ============================================
// MÓDULO DE MIGRACIONES - PUNTO DE ENTRADA
// ============================================

const { MigrationRunner } = require('./runner');
const db = require('../config/database');

/**
 * Crea una instancia del MigrationRunner con la conexión de BD
 * @returns {MigrationRunner}
 */
function createMigrationRunner() {
    return new MigrationRunner(db);
}

/**
 * Ejecuta las migraciones pendientes
 * Útil para llamar desde el servidor al iniciar
 * @returns {Promise<number>} Número de migraciones ejecutadas
 */
async function runMigrations() {
    const runner = createMigrationRunner();
    return await runner.runPending();
}

/**
 * Obtiene el estado de las migraciones
 * @returns {Promise<{applied: string[], pending: string[]}>}
 */
async function getMigrationStatus() {
    const runner = createMigrationRunner();
    return await runner.getStatus();
}

module.exports = {
    MigrationRunner,
    createMigrationRunner,
    runMigrations,
    getMigrationStatus
};
