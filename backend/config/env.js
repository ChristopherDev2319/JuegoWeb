// ============================================
// CARGADOR DE CONFIGURACIÓN POR ENTORNO
// ============================================

const path = require('path');
const dotenv = require('dotenv');

/**
 * Carga la configuración del entorno basado en NODE_ENV
 * - development: carga .env.development
 * - production: carga .env.production
 * - Fallback a .env si el archivo específico no existe
 * 
 * @returns {Object} Configuración del entorno
 * @throws {Error} Si faltan variables requeridas
 */
function loadEnvConfig() {
    const env = process.env.NODE_ENV || 'development';
    const envFile = `.env.${env}`;
    const envPath = path.resolve(__dirname, '..', envFile);
    
    // Intentar cargar archivo específico del entorno
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
        // Fallback a .env si el archivo específico no existe
        const fallbackPath = path.resolve(__dirname, '..', '.env');
        const fallbackResult = dotenv.config({ path: fallbackPath });
        
        if (fallbackResult.error) {
            console.warn(`⚠️ No se encontró archivo de configuración: ${envFile} ni .env`);
        }
    }
    
    // Variables requeridas
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    const missing = [];
    
    for (const key of required) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
    }
    
    // Construir y retornar configuración
    const config = {
        nodeEnv: env,
        port: parseInt(process.env.PORT, 10) || 3001,
        databaseUrl: process.env.DATABASE_URL,
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
        allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
        }
    };
    
    return config;
}

/**
 * Valida que todas las variables requeridas estén presentes
 * @param {string[]} requiredVars - Lista de variables requeridas
 * @throws {Error} Si falta alguna variable
 */
function validateRequiredEnvVars(requiredVars) {
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
    }
}

module.exports = { loadEnvConfig, validateRequiredEnvVars };
