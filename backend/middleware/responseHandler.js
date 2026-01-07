// ============================================
// MIDDLEWARE DE RESPUESTAS ESTANDARIZADAS
// ============================================

/**
 * Middleware para estandarizar formato de respuestas API
 * Todas las respuestas tendrán estructura: { success, data/message, ... }
 * Requirements: 6.1, 6.5
 */

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Helper para crear respuestas exitosas
 * @param {Object} res - Express response object
 * @param {Object} data - Datos a enviar
 * @param {string} message - Mensaje opcional
 * @param {number} statusCode - Código HTTP (default: 200)
 */
function sendSuccess(res, data = null, message = null, statusCode = 200) {
    const response = {
        success: true
    };
    
    if (data !== null) {
        response.data = data;
    }
    
    if (message) {
        response.message = message;
    }
    
    return res.status(statusCode).json(response);
}

/**
 * Helper para crear respuestas de error
 * @param {Object} res - Express response object
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código HTTP (default: 400)
 * @param {Array} errors - Errores de validación opcionales
 */
function sendError(res, message, statusCode = 400, errors = null) {
    const response = {
        success: false,
        message: sanitizeErrorMessage(message, statusCode)
    };
    
    if (errors && !isProduction()) {
        response.errors = errors;
    } else if (errors && isProduction() && statusCode === 400) {
        // En producción, solo mostrar errores de validación (400)
        response.errors = errors;
    }
    
    return res.status(statusCode).json(response);
}

/**
 * Sanitiza mensajes de error en producción
 * @param {string} message - Mensaje original
 * @param {number} statusCode - Código HTTP
 * @returns {string} Mensaje sanitizado
 */
function sanitizeErrorMessage(message, statusCode) {
    // En desarrollo, mostrar mensaje completo
    if (!isProduction()) {
        return message;
    }
    
    // En producción, sanitizar mensajes de errores internos
    if (statusCode >= 500) {
        return 'Error interno del servidor';
    }
    
    // Para errores de cliente (4xx), mantener mensaje pero sin detalles técnicos
    const sensitivePatterns = [
        /sql/i,
        /query/i,
        /database/i,
        /postgres/i,
        /connection/i,
        /ECONNREFUSED/i,
        /timeout/i,
        /stack/i,
        /at\s+\w+\s+\(/i  // Stack trace patterns
    ];
    
    for (const pattern of sensitivePatterns) {
        if (pattern.test(message)) {
            return 'Error procesando la solicitud';
        }
    }
    
    return message;
}

/**
 * Middleware de manejo de errores global mejorado
 * Captura todos los errores no manejados y los formatea consistentemente
 */
function globalErrorHandler(error, req, res, next) {
    // Log del error (siempre en servidor)
    console.error('Error no manejado:', {
        message: error.message,
        stack: isProduction() ? undefined : error.stack,
        path: req.path,
        method: req.method
    });
    
    // Error de CORS
    if (error.message === 'No permitido por CORS') {
        return sendError(res, 'Acceso no permitido desde este origen', 403);
    }
    
    // Error de JSON malformado
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return sendError(res, 'JSON malformado en la petición', 400);
    }
    
    // Error de payload muy grande
    if (error.type === 'entity.too.large') {
        return sendError(res, 'El tamaño de la petición excede el límite permitido', 413);
    }
    
    // Error de JWT
    if (error.name === 'JsonWebTokenError') {
        return sendError(res, 'Token inválido', 401);
    }
    
    if (error.name === 'TokenExpiredError') {
        return sendError(res, 'Token expirado', 401);
    }
    
    // Error de base de datos
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return sendError(res, 'Servicio temporalmente no disponible', 503);
    }
    
    // Error genérico
    const statusCode = error.statusCode || error.status || 500;
    const message = isProduction() && statusCode >= 500 
        ? 'Error interno del servidor' 
        : error.message || 'Error desconocido';
    
    return sendError(res, message, statusCode);
}

/**
 * Middleware para agregar helpers de respuesta al objeto res
 * Uso: res.success(data, message) o res.error(message, statusCode)
 */
function attachResponseHelpers(req, res, next) {
    res.success = (data, message, statusCode = 200) => sendSuccess(res, data, message, statusCode);
    res.error = (message, statusCode = 400, errors = null) => sendError(res, message, statusCode, errors);
    next();
}

/**
 * Wrapper para async handlers que captura errores automáticamente
 * @param {Function} fn - Función async del handler
 * @returns {Function} Handler con manejo de errores
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    sendSuccess,
    sendError,
    sanitizeErrorMessage,
    globalErrorHandler,
    attachResponseHelpers,
    asyncHandler
};
