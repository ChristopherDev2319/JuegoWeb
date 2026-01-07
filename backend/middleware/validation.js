// ============================================
// MIDDLEWARE DE VALIDACIÓN
// ============================================

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 * Retorna 400 Bad Request con errores específicos por campo
 * Requirements: 6.3
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Formatear errores para incluir campo y mensaje
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg
        }));
        
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: formattedErrors
        });
    }
    next();
};

// ============================================
// VALIDACIONES DE AUTENTICACIÓN
// ============================================

// Validaciones para registro
const validateRegister = [
    body('username')
        .exists({ checkFalsy: true })
        .withMessage('El nombre de usuario es requerido')
        .isLength({ min: 3, max: 50 })
        .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
    
    body('email')
        .exists({ checkFalsy: true })
        .withMessage('El email es requerido')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    
    body('password')
        .exists({ checkFalsy: true })
        .withMessage('La contraseña es requerida')
        .isLength({ min: 6, max: 100 })
        .withMessage('La contraseña debe tener entre 6 y 100 caracteres'),
    
    handleValidationErrors
];

// Validaciones para login
const validateLogin = [
    body('username')
        .exists({ checkFalsy: true })
        .withMessage('Nombre de usuario es requerido')
        .isString()
        .withMessage('Nombre de usuario debe ser texto'),
    
    body('password')
        .exists({ checkFalsy: true })
        .withMessage('Contraseña es requerida')
        .isString()
        .withMessage('Contraseña debe ser texto'),
    
    handleValidationErrors
];

// ============================================
// VALIDACIONES DE ESTADÍSTICAS
// ============================================

// Validaciones para actualizar stats
const validateStatsUpdate = [
    body('kills')
        .optional()
        .isInt({ min: 0 })
        .withMessage('kills debe ser un número entero no negativo'),
    
    body('deaths')
        .optional()
        .isInt({ min: 0 })
        .withMessage('deaths debe ser un número entero no negativo'),
    
    body('matches')
        .optional()
        .isInt({ min: 0 })
        .withMessage('matches debe ser un número entero no negativo'),
    
    // Validación personalizada: al menos un campo debe estar presente
    body().custom((value, { req }) => {
        const { kills, deaths, matches } = req.body;
        if (kills === undefined && deaths === undefined && matches === undefined) {
            throw new Error('Debe proporcionar al menos un campo para actualizar (kills, deaths, matches)');
        }
        return true;
    }),
    
    handleValidationErrors
];

// Validaciones para leaderboard
const validateLeaderboard = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit debe ser un número entre 1 y 100'),
    
    handleValidationErrors
];

// ============================================
// VALIDACIONES DE ADMINISTRACIÓN - BANS
// ============================================

// Validaciones para crear ban
const validateCreateBan = [
    body('user_id')
        .exists({ checkFalsy: true })
        .withMessage('El campo user_id es requerido')
        .isInt({ min: 1 })
        .withMessage('user_id debe ser un número entero positivo'),
    
    body('reason')
        .exists({ checkFalsy: true })
        .withMessage('El campo reason es requerido')
        .isString()
        .withMessage('reason debe ser texto')
        .isLength({ min: 1, max: 500 })
        .withMessage('reason debe tener entre 1 y 500 caracteres')
        .trim(),
    
    body('expires_at')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('expires_at debe ser una fecha válida en formato ISO8601')
        .custom((value) => {
            if (value && new Date(value) <= new Date()) {
                throw new Error('La fecha de expiración debe ser en el futuro');
            }
            return true;
        }),
    
    handleValidationErrors
];

// Validaciones para eliminar ban
const validateDeleteBan = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de ban debe ser un número entero positivo'),
    
    handleValidationErrors
];

// Validaciones para listar bans
const validateListBans = [
    query('include_expired')
        .optional()
        .isIn(['true', 'false'])
        .withMessage('include_expired debe ser "true" o "false"'),
    
    handleValidationErrors
];

// ============================================
// VALIDACIONES DE ADMINISTRACIÓN - USUARIOS
// ============================================

// Validaciones para listar usuarios
const validateListUsers = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page debe ser un número entero positivo'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit debe ser un número entre 1 y 100'),
    
    query('search')
        .optional()
        .isString()
        .withMessage('search debe ser texto')
        .isLength({ max: 100 })
        .withMessage('search no puede exceder 100 caracteres')
        .trim(),
    
    handleValidationErrors
];

// Validaciones para obtener detalle de usuario
const validateGetUser = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de usuario debe ser un número entero positivo'),
    
    handleValidationErrors
];

// ============================================
// VALIDACIONES DE PROGRESO
// ============================================

// Validaciones para guardar progreso
const validateProgress = [
    body('stats.kills')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Kills debe ser un número entero positivo'),
    
    body('stats.deaths')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Deaths debe ser un número entero positivo'),
    
    body('stats.shotsFired')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Shots fired debe ser un número entero positivo'),
    
    body('stats.shotsHit')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Shots hit debe ser un número entero positivo'),
    
    body('stats.playtime')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Playtime debe ser un número entero positivo'),
    
    body('config.mouseSensitivity')
        .optional()
        .isFloat({ min: 0.001, max: 0.1 })
        .withMessage('Mouse sensitivity debe estar entre 0.001 y 0.1'),
    
    body('config.volume')
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage('Volume debe estar entre 0 y 1'),
    
    body('config.fov')
        .optional()
        .isInt({ min: 60, max: 120 })
        .withMessage('FOV debe estar entre 60 y 120'),
    
    body('config.showFPS')
        .optional()
        .isBoolean()
        .withMessage('ShowFPS debe ser un booleano'),
    
    body('progress.level')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Level debe estar entre 1 y 100'),
    
    body('progress.experience')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Experience debe ser un número entero positivo'),
    
    body('progress.unlockedWeapons')
        .optional()
        .isArray()
        .withMessage('Unlocked weapons debe ser un array'),
    
    handleValidationErrors
];

module.exports = {
    // Auth validations
    validateRegister,
    validateLogin,
    // Stats validations
    validateStatsUpdate,
    validateLeaderboard,
    // Admin - Bans validations
    validateCreateBan,
    validateDeleteBan,
    validateListBans,
    // Admin - Users validations
    validateListUsers,
    validateGetUser,
    // Progress validations
    validateProgress,
    // Generic handler
    handleValidationErrors
};