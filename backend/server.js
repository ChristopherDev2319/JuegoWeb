// ============================================
// SERVIDOR PRINCIPAL - EXPRESS.JS + POSTGRESQL
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ 
    path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`) 
});

// Importar configuración y rutas
const { testConnection } = require('./config/database');
const { runMigrations } = require('./migrations');
const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');
const { globalErrorHandler, attachResponseHelpers } = require('./middleware/responseHandler');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE DE SEGURIDAD
// ============================================

// Helmet para headers de seguridad
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS configurado
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:8080', 'http://127.0.0.1:8080'];

console.log('🔒 CORS - Orígenes permitidos:', allowedOrigins);

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Log para debug
        console.log('🔍 CORS - Origin recibido:', origin);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('❌ CORS - Origin rechazado:', origin);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // límite de requests por ventana
    message: {
        success: false,
        message: 'Demasiadas peticiones, intenta de nuevo más tarde'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================
// MIDDLEWARE GENERAL
// ============================================

// Parser de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Agregar helpers de respuesta estandarizada
app.use(attachResponseHelpers);

// ============================================
// RUTAS
// ============================================

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de progreso
app.use('/api/progress', progressRoutes);

// Rutas de estadísticas
app.use('/api/stats', statsRoutes);

// Rutas de administración
app.use('/api/admin', adminRoutes);

// Ruta 404 para API
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado'
    });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Middleware de manejo de errores global (estandarizado)
app.use(globalErrorHandler);

// ============================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================

async function startServer() {
    try {
        // Probar conexión a la base de datos
        console.log('🔄 Probando conexión a la base de datos...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.warn('⚠️ PostgreSQL no disponible - Funcionando en modo fallback');
            console.warn('⚠️ Los datos se guardarán solo en localStorage del cliente');
            console.warn('⚠️ Para habilitar persistencia, configurar PostgreSQL según SETUP-AUTH.md');
        } else {
            console.log('✅ Base de datos PostgreSQL conectada');
            
            // Ejecutar migraciones pendientes
            try {
                console.log('🔄 Verificando migraciones...');
                const migrationsRun = await runMigrations();
                if (migrationsRun > 0) {
                    console.log(`✅ ${migrationsRun} migraciones ejecutadas`);
                } else {
                    console.log('✅ Base de datos actualizada');
                }
            } catch (migrationError) {
                console.error('❌ Error ejecutando migraciones:', migrationError.message);
                // Continuar sin migraciones en caso de error
            }
        }

        // Iniciar servidor independientemente del estado de PostgreSQL
        app.listen(PORT, () => {
            console.log('🚀 ================================');
            console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
            console.log(`🚀 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🚀 API disponible en: http://localhost:${PORT}/api`);
            
            if (!dbConnected) {
                console.log('⚠️ MODO FALLBACK: Sin persistencia de datos');
            }
            
            console.log('🚀 ================================');
            
            // Mostrar endpoints disponibles
            console.log('📋 Endpoints disponibles:');
            console.log('   GET  /api/health');
            console.log('   POST /api/auth/register');
            console.log('   POST /api/auth/login');
            console.log('   POST /api/auth/logout');
            console.log('   GET  /api/progress/load');
            console.log('   POST /api/progress/save');
            console.log('   GET  /api/progress/stats');
            console.log('   GET  /api/stats/me');
            console.log('   PUT  /api/stats/update');
            console.log('   GET  /api/stats/leaderboard');
            console.log('   GET  /api/admin/users');
            console.log('   GET  /api/admin/users/:id');
            console.log('   POST /api/admin/bans');
            console.log('   DELETE /api/admin/bans/:id');
            console.log('   GET  /api/admin/bans');
        });

    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('🔄 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Cerrando servidor...');
    process.exit(0);
});

// Iniciar servidor
startServer();