// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

const express = require('express');
const bcrypt = require('bcrypt');
const { executeQuery, isDatabaseAvailable } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();

// Almacenamiento en memoria cuando MySQL no está disponible
let memoryUsers = global.memoryUsers || new Map();
let memoryProgress = global.memoryProgress || new Map();
global.memoryUsers = memoryUsers;
global.memoryProgress = memoryProgress;

let userIdCounter = global.userIdCounter || 1;

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
            
            // Crear usuario en memoria
            const userId = userIdCounter++;
            global.userIdCounter = userIdCounter;
            
            const newUser = {
                id: userId,
                username,
                email,
                password_hash: passwordHash,
                created_at: new Date(),
                is_active: true
            };
            
            memoryUsers.set(userId, newUser);
            
            // Crear progreso inicial en memoria
            memoryProgress.set(userId, {
                user_id: userId,
                kills: 0,
                deaths: 0,
                shots_fired: 0,
                shots_hit: 0,
                playtime_seconds: 0,
                mouse_sensitivity: 0.002,
                volume: 0.5,
                fov: 75,
                show_fps: false,
                level: 1,
                experience: 0,
                unlocked_weapons: ['M4A1', 'PISTOLA'],
                additional_data: {},
                updated_at: new Date()
            });
            
            // Generar token
            const token = generateToken(userId);
            
            return res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente (modo memoria)',
                data: {
                    user: {
                        id: userId,
                        username,
                        email
                    },
                    token
                }
            });
        }

        // Código original para MySQL
        const existingUser = await executeQuery(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El nombre de usuario o email ya está en uso'
            });
        }

        // Hashear contraseña
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Crear usuario
        const result = await executeQuery(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        const userId = result.insertId;

        // Crear progreso inicial
        await executeQuery(`
            INSERT INTO user_progress (
                user_id, kills, deaths, shots_fired, shots_hit, playtime_seconds,
                mouse_sensitivity, volume, fov, show_fps, level, experience, unlocked_weapons
            ) VALUES (?, 0, 0, 0, 0, 0, 0.002, 0.5, 75, FALSE, 1, 0, ?)
        `, [userId, JSON.stringify(['M4A1', 'PISTOLA'])]);

        // Generar token
        const token = generateToken(userId);

        // Actualizar último login
        await executeQuery(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
        );

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: userId,
                    username,
                    email
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
            
            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            
            // Generar token
            const token = generateToken(user.id);
            
            return res.json({
                success: true,
                message: 'Inicio de sesión exitoso (modo memoria)',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    },
                    token
                }
            });
        }

        // Código original para MySQL
        const users = await executeQuery(
            'SELECT id, username, email, password_hash, is_active FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const user = users[0];

        // Verificar si está activo
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Cuenta desactivada'
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

        // Generar token
        const token = generateToken(user.id);

        // Actualizar último login
        await executeQuery(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
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