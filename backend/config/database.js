// ============================================
// CONFIGURACIÓN DE BASE DE DATOS PostgreSQL
// ============================================

const { Pool } = require('pg');
const { loadEnvConfig } = require('./env');

let config;
let pool = null;
let isConnected = false;

// Configuración de reintentos con backoff exponencial
const RETRY_CONFIG = {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2
};

/**
 * Inicializa el pool de conexiones PostgreSQL
 */
function initializePool() {
    if (pool) return pool;
    
    try {
        config = loadEnvConfig();
        
        pool = new Pool({
            connectionString: config.databaseUrl,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });
        
        // Manejar errores del pool
        pool.on('error', (err) => {
            console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
            isConnected = false;
        });
        
        return pool;
    } catch (error) {
        console.error('❌ Error inicializando pool de PostgreSQL:', error.message);
        throw error;
    }
}

/**
 * Calcula el delay para el siguiente reintento usando backoff exponencial
 * @param {number} attempt - Número de intento actual (0-indexed)
 * @returns {number} Delay en milisegundos
 */
function calculateBackoffDelay(attempt) {
    const delay = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
    return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

/**
 * Espera un tiempo determinado
 * @param {number} ms - Milisegundos a esperar
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Prueba la conexión a la base de datos con reintentos
 * @param {number} maxRetries - Número máximo de reintentos (opcional)
 * @returns {Promise<boolean>} true si la conexión fue exitosa
 */
async function testConnection(maxRetries = RETRY_CONFIG.maxRetries) {
    initializePool();
    
    if (!pool) {
        console.warn('⚠️ Pool de PostgreSQL no disponible');
        return false;
    }
    
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();
            
            console.log(`✅ PostgreSQL conectado (${config.nodeEnv})`);
            console.log(`📊 Base de datos: ${config.databaseUrl.split('/').pop()}`);
            isConnected = true;
            return true;
        } catch (error) {
            lastError = error;
            isConnected = false;
            
            if (attempt < maxRetries - 1) {
                const delay = calculateBackoffDelay(attempt);
                console.warn(`⚠️ Intento ${attempt + 1}/${maxRetries} fallido. Reintentando en ${delay}ms...`);
                await sleep(delay);
            }
        }
    }
    
    console.error('❌ Error conectando a PostgreSQL después de', maxRetries, 'intentos:', lastError?.message);
    return false;
}

/**
 * Ejecuta una query SQL
 * @param {string} text - Query SQL con placeholders $1, $2, etc.
 * @param {Array} params - Parámetros para la query
 * @returns {Promise<Object>} Resultado de la query
 */
async function query(text, params = []) {
    initializePool();
    
    if (!pool) {
        throw new Error('Base de datos no disponible');
    }
    
    const start = Date.now();
    
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        if (config?.nodeEnv === 'development') {
            console.log('Query ejecutada', { 
                text: text.substring(0, 100), 
                duration: `${duration}ms`, 
                rows: result.rowCount 
            });
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error ejecutando query:', error.message);
        throw error;
    }
}

/**
 * Ejecuta múltiples queries en una transacción
 * @param {Array<{text: string, params: Array}>} queries - Array de queries
 * @returns {Promise<Array>} Resultados de las queries
 */
async function executeTransaction(queries) {
    initializePool();
    
    if (!pool) {
        throw new Error('Base de datos no disponible');
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const results = [];
        for (const { text, params } of queries) {
            const result = await client.query(text, params);
            results.push(result);
        }
        
        await client.query('COMMIT');
        return results;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en transacción, rollback ejecutado:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Verifica si la base de datos está disponible
 * @returns {boolean}
 */
function isDatabaseAvailable() {
    return isConnected && pool !== null;
}

/**
 * Obtiene el pool de conexiones
 * @returns {Pool|null}
 */
function getPool() {
    return pool;
}

/**
 * Cierra el pool de conexiones
 */
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
        isConnected = false;
        console.log('🔌 Pool de PostgreSQL cerrado');
    }
}

module.exports = {
    pool,
    getPool,
    query,
    executeQuery: query, // Alias para compatibilidad con código existente
    testConnection,
    executeTransaction,
    isDatabaseAvailable,
    closePool,
    initializePool,
    // Exportar para testing
    calculateBackoffDelay,
    RETRY_CONFIG
};
