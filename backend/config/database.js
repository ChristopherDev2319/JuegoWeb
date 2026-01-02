// ============================================
// CONFIGURACIÓN DE BASE DE DATOS MYSQL
// ============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de conexión
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: 'utf8mb4'
};

// Crear pool de conexiones
let pool = null;
let isConnected = false;

try {
    pool = mysql.createPool(dbConfig);
} catch (error) {
    console.warn('⚠️ No se pudo crear pool de MySQL:', error.message);
}

// Función para probar la conexión
async function testConnection() {
    if (!pool) {
        console.warn('⚠️ Pool de MySQL no disponible');
        return false;
    }
    
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
        connection.release();
        isConnected = true;
        return true;
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
        isConnected = false;
        return false;
    }
}

// Función helper para ejecutar queries
async function executeQuery(query, params = []) {
    if (!isConnected || !pool) {
        throw new Error('Base de datos no disponible');
    }
    
    try {
        const [results] = await pool.execute(query, params);
        return results;
    } catch (error) {
        console.error('❌ Error ejecutando query:', error.message);
        throw error;
    }
}

// Función helper para transacciones
async function executeTransaction(queries) {
    if (!isConnected || !pool) {
        throw new Error('Base de datos no disponible');
    }
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const { query, params } of queries) {
            const [result] = await connection.execute(query, params);
            results.push(result);
        }
        
        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// Función para verificar si la base de datos está disponible
function isDatabaseAvailable() {
    return isConnected && pool !== null;
}

module.exports = {
    pool,
    testConnection,
    executeQuery,
    executeTransaction,
    isDatabaseAvailable
};