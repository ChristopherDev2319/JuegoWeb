// ============================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// ============================================

const jwt = require('jsonwebtoken');
const { query, isDatabaseAvailable } = require('../config/database');

// Middleware para verificar JWT
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Si la base de datos no está disponible, usar datos del token
        if (!isDatabaseAvailable()) {
            req.user = {
                id: decoded.userId,
                username: decoded.username || 'unknown',
                email: decoded.email || '',
                role: decoded.role || 'player'
            };
            return next();
        }
        
        // Verificar que el usuario existe y está activo (PostgreSQL syntax)
        const result = await query(
            'SELECT id, username, email, role, is_active FROM users WHERE id = $1 AND is_active = TRUE',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no válido o inactivo'
            });
        }

        const user = result.rows[0];

        // Agregar información del usuario al request
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        } else {
            console.error('Error en autenticación:', error);
            return res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
};

// Middleware opcional (no requiere autenticación pero la procesa si existe)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (!isDatabaseAvailable()) {
                req.user = {
                    id: decoded.userId,
                    username: decoded.username || 'unknown',
                    email: decoded.email || '',
                    role: decoded.role || 'player'
                };
                return next();
            }
            
            const result = await query(
                'SELECT id, username, email, role FROM users WHERE id = $1 AND is_active = TRUE',
                [decoded.userId]
            );

            if (result.rows.length > 0) {
                const user = result.rows[0];
                req.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                };
            }
        }

        next();
    } catch (error) {
        // En modo opcional, continuamos sin autenticación
        next();
    }
};

// Función para generar JWT (incluye role en el payload)
const generateToken = (userId, username, email, role = 'player') => {
    return jwt.sign(
        { userId, username, email, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Middleware para verificar rol de administrador
// Debe usarse DESPUÉS de authenticateToken
const requireAdmin = (req, res, next) => {
    // Verificar que el usuario está autenticado
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Autenticación requerida'
        });
    }

    // Verificar que el usuario tiene rol de admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de administrador.'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    optionalAuth,
    generateToken,
    requireAdmin
};