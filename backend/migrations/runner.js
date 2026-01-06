// ============================================
// SISTEMA DE MIGRACIONES DE BASE DE DATOS
// ============================================

const fs = require('fs');
const path = require('path');

/**
 * MigrationRunner - Gestiona la ejecución de migraciones SQL
 * 
 * Las migraciones se ejecutan en orden de versión y se registran
 * en una tabla de control para evitar re-ejecuciones.
 * 
 * Formato de archivos: {version}_{name}.sql
 * Ejemplo: 001_create_users_table.sql
 */
class MigrationRunner {
    /**
     * @param {Object} db - Módulo de base de datos con query() y getPool()
     */
    constructor(db) {
        this.db = db;
        this.migrationsDir = path.join(__dirname, 'sql');
    }

    /**
     * Crea la tabla de migraciones si no existe
     * Esta tabla registra qué migraciones ya fueron aplicadas
     */
    async ensureMigrationsTable() {
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                version VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    /**
     * Obtiene las versiones de migraciones ya aplicadas
     * @returns {Promise<string[]>} Array de versiones aplicadas
     */
    async getAppliedMigrations() {
        const result = await this.db.query(
            'SELECT version FROM migrations ORDER BY version'
        );
        return result.rows.map(r => r.version);
    }

    /**
     * Lee los archivos de migración del directorio sql/
     * @returns {Array<{version: string, name: string, file: string, sql: string}>}
     */
    getMigrationFiles() {
        // Verificar que el directorio existe
        if (!fs.existsSync(this.migrationsDir)) {
            console.warn(`⚠️ Directorio de migraciones no encontrado: ${this.migrationsDir}`);
            return [];
        }

        const files = fs.readdirSync(this.migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        return files.map(file => {
            const [version, ...nameParts] = file.replace('.sql', '').split('_');
            return {
                version,
                name: nameParts.join('_'),
                file,
                sql: fs.readFileSync(path.join(this.migrationsDir, file), 'utf8')
            };
        });
    }

    /**
     * Ejecuta todas las migraciones pendientes
     * @returns {Promise<number>} Número de migraciones ejecutadas
     */
    async runPending() {
        await this.ensureMigrationsTable();
        
        const applied = await this.getAppliedMigrations();
        const migrations = this.getMigrationFiles();
        const pending = migrations.filter(m => !applied.includes(m.version));

        console.log(`📦 ${pending.length} migraciones pendientes`);

        for (const migration of pending) {
            await this.executeMigration(migration);
        }

        return pending.length;
    }

    /**
     * Ejecuta una migración individual dentro de una transacción
     * Si falla, hace rollback automático
     * 
     * @param {{version: string, name: string, sql: string}} migration
     * @throws {Error} Si la migración falla
     */
    async executeMigration(migration) {
        const pool = this.db.getPool();
        
        if (!pool) {
            throw new Error('Pool de base de datos no disponible');
        }

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Ejecutar el SQL de la migración
            await client.query(migration.sql);
            
            // Registrar la migración como aplicada
            await client.query(
                'INSERT INTO migrations (version, name) VALUES ($1, $2)',
                [migration.version, migration.name]
            );
            
            await client.query('COMMIT');
            console.log(`✅ Migración ${migration.version}: ${migration.name}`);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Error en migración ${migration.version}:`, error.message);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtiene el estado actual de las migraciones
     * @returns {Promise<{applied: string[], pending: string[]}>}
     */
    async getStatus() {
        await this.ensureMigrationsTable();
        
        const applied = await this.getAppliedMigrations();
        const migrations = this.getMigrationFiles();
        const pending = migrations
            .filter(m => !applied.includes(m.version))
            .map(m => m.version);

        return { applied, pending };
    }
}

module.exports = { MigrationRunner };
