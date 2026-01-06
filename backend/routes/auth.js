// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

const express = require('express');
const bcrypt = require('bcrypt');
const { query, executeTransaction, isDatabaseAvailable } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();

// Almacenamiento en memoria cuando PostgreSQL no está disponible
let memoryUsers = global.memoryUsers || new Map();
let memoryStats = global.memoryStats || new Map();
let memoryBans = global.memoryBans || new Map();
global.memoryUsers = memoryUsers;
global.memoryStats = memoryStats;
global.memoryBans = memoryBans;

let userIdCounter = global.userIdCounter || 1;

/**
 * Verifica si un usuario tiene un ban activo
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object|null>} Ban activo o null
 */
async function getActiveBan(userId) {
    if (!isDatabaseAvailable()) {
        // Buscar en memoria
        const bans = Array.from(memoryBans.values()).filter(
            ban => ban.user_id === userId && 
            (ban.expires_at === null || new Date(ban.expires_at) > new Date())
        );
        return bans.length > 0 ? bans[0] : null;
    }
    
    // Buscar ban activo en PostgreSQL
    // Un ban está activo si expires_at es NULL (permanente) o expires_at > NOW()
    const result = await query(
        `SELECT id, user_id, reason, expires_at, created_at 
         FROM bans 
         WHERE user_id = $1 
         AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
    );
    
    return result.rows.length > 0 ? result.rows[0] : null;
}

// POST /api/auth/register - Registro de usuario
router.post('/register', validateRegister, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Verificar si la base de datos está disponible
        if (!isDatabaseAvailable()) {
            console.log('🔄 Usando almacenamiento en memoria para registro');
            
            // Verificar si el usuario ya existe en memoria
            const existingUser = Array.from(memoryUsers.values()).find(
                user => user.username === username || user.email === email
            );
            
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'El nombre de usuario o email ya está en uso'
                });
            }
            
            // Hashear contraseña
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            // Crear usuario en memoria con role 'player'
            const userId = userIdCounter++;
            global.userIdCounter = userIdCounter;
            
            const newUser = {
                id: userId,
                username,
                email,
                password_hash: passwordHash,
                role: 'player',
                created_at: new Date(),
                is_active: true
            };
            
            memoryUsers.set(userId, newUser);
            
            // Crear player_stats inicial en memoria
            memoryStats.set(userId, {
                user_id: userId,
                kills: 0,
                deaths: 0,
                matches: 0,
                created_at: new Date(),
                updated_at: new Date()
            });
            
            // Generar token con role incluido
            const token = generateToken(userId, username, email, 'player');
            
            return res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente (modo memoria)',
                data: {
                    user: {
                        id: userId,
                        username,
                        email,
                        role: 'player'
                    },
                    token
                }
            });
        }

        // PostgreSQL: Verificar si el usuario ya existe
        const existingUser = await query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El nombre de usuario o email ya está en uso'
            });
        }

        // Hashear contraseña
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Crear usuario y player_stats en una transacción
        const results = await executeTransaction([
            {
                text: `INSERT INTO users (username, email, password_hash, role) 
                       VALUES ($1, $2, $3, 'player') 
                       RETURNING id, username, email, role`,
                params: [username, email, passwordHash]
            }
        ]);

        const newUser = results[0].rows[0];
        const userId = newUser.id;

        // Crear player_stats para el nuevo usuario
        await query(
            'INSERT INTO player_stats (user_id, kills, deaths, matches) VALUES ($1, 0, 0, 0)',
            [userId]
        );

        // Actualizar último login
        await query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [userId]
        );

        // Generar token con role incluido
        const token = generateToken(userId, newUser.username, newUser.email, newUser.role);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: userId,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role
                },
                token
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// POST /api/auth/login - Inicio de sesión
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Verificar si la base de datos está disponible
        if (!isDatabaseAvailable()) {
            console.log('🔄 Usando almacenamiento en memoria para login');
            
            // Buscar usuario en memoria
            const user = Array.from(memoryUsers.values()).find(
                u => u.username === username || u.email === username
            );
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            
            // Verificar si está activo
            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Cuenta desactivada'
                });
            }
            
            // Verificar ban activo en memoria
            const activeBan = await getActiveBan(user.id);
            if (activeBan) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuario baneado',
                    ban: {
                        reason: activeBan.reason,
                        expires_at: activeBan.expires_at
                    }
                });
            }
            
            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            
            // Generar token con role incluido
            const token = generateToken(user.id, user.username, user.email, user.role || 'player');
            
            return res.json({
                success: true,
                message: 'Inicio de sesión exitoso (modo memoria)',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role || 'player'
                    },
                    token
                }
            });
        }

        // PostgreSQL: Buscar usuario
        const result = await query(
            'SELECT id, username, email, password_hash, role, is_active FROM users WHERE username = $1 OR email = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const user = result.rows[0];

        // Verificar si está activo
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Cuenta desactivada'
            });
        }

        // Verificar ban activo antes de permitir login
        const activeBan = await getActiveBan(user.id);
        if (activeBan) {
            return res.status(403).json({
                success: false,
                message: 'Usuario baneado',
                ban: {
                    reason: activeBan.reason,
                    expires_at: activeBan.expires_at
                }
            });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token con role incluido
        const token = generateToken(user.id, user.username, user.email, user.role);

        // Actualizar último login
        await query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// POST /api/auth/logout - Cerrar sesión (opcional)
router.post('/logout', (req, res) => {
    // Con JWT stateless, el logout se maneja en el frontend eliminando el token
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
});

module.exports = router;
