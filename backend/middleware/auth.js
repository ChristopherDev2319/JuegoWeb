// ============================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// ============================================

const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

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
        
        // Verificar que el usuario existe y está activo
        const user = await executeQuery(
            'SELECT id, username, email, is_active FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.userId]
        );

        if (user.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no válido o inactivo'
            });
        }

        // Agregar información del usuario al request
        req.user = {
            id: decoded.userId,
            username: user[0].username,
            email: user[0].email
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
            const user = await executeQuery(
                'SELECT id, username, email FROM users WHERE id = ? AND is_active = TRUE',
                [decoded.userId]
            );

            if (user.length > 0) {
                req.user = {
                    id: decoded.userId,
                    username: user[0].username,
                    email: user[0].email
                };
            }
        }

        next();
    } catch (error) {
        // En modo opcional, continuamos sin autenticación
        next();
    }
};

// Función para generar JWT
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

module.exports = {
    authenticateToken,
    optionalAuth,
    generateToken
};