// ============================================
// MIDDLEWARE DE VALIDACIÓN
// ============================================

const { body, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors.array()
        });
    }
    next();
};

// Validaciones para registro
const validateRegister = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
    
    body('email')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 6, max: 100 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),
    
    handleValidationErrors
];

// Validaciones para login
const validateLogin = [
    body('username')
        .notEmpty()
        .withMessage('Nombre de usuario requerido'),
    
    body('password')
        .notEmpty()
        .withMessage('Contraseña requerida'),
    
    handleValidationErrors
];

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
    validateRegister,
    validateLogin,
    validateProgress,
    handleValidationErrors
};