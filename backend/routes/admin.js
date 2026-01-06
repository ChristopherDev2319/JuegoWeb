// ============================================
// RUTAS DE ADMINISTRACIÓN
// ============================================

const express = require('express');
const { query, isDatabaseAvailable } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
    validateCreateBan, 
    validateDeleteBan, 
    validateListBans,
    validateListUsers,
    validateGetUser 
} = require('../middleware/validation');

const router = express.Router();

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(authenticateToken);
router.use(requireAdmin);

// Almacenamiento en memoria (referencia global desde auth.js)
let memoryBans = global.memoryBans || new Map();
let memoryUsers = global.memoryUsers || new Map();
global.memoryBans = memoryBans;
global.memoryUsers = memoryUsers;

let banIdCounter = global.banIdCounter || 1;

// ============================================
// RUTAS DE GESTIÓN DE BANS
// ============================================

/**
 * POST /api/admin/bans - Crear un nuevo ban
 * Body: { user_id, reason, expires_at? }
 * expires_at es opcional - si no se proporciona, el ban es permanente
 */
router.post('/bans', validateCreateBan, async (req, res) => {
    try {
        const { user_id, reason, expires_at } = req.body;
        const adminId = req.user.id;

        // Parsear fecha de expiración (validación ya hecha por middleware)
        let expiresAtDate = expires_at ? new Date(expires_at) : null;

        if (!isDatabaseAvailable()) {
            // Modo memoria
            // Verificar que el usuario existe
            const targetUser = memoryUsers.get(parseInt(user_id));
            if (!targetUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // No permitir banear a otros admins
            if (targetUser.role === 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'No se puede banear a un administrador'
                });
            }

            // Crear ban en memoria
            const banId = banIdCounter++;
            global.banIdCounter = banIdCounter;

            const newBan = {
                id: banId,
                user_id: parseInt(user_id),
                reason: reason.trim(),
                expires_at: expiresAtDate,
                created_by: adminId,
                created_at: new Date()
            };

            memoryBans.set(banId, newBan);

            return res.status(201).json({
                success: true,
                message: expiresAtDate ? 'Ban temporal creado exitosamente' : 'Ban permanente creado exitosamente',
                data: {
                    ban: newBan
                }
            });
        }

        // PostgreSQL: Verificar que el usuario existe
        const userResult = await query(
            'SELECT id, role FROM users WHERE id = $1',
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // No permitir banear a otros admins
        if (userResult.rows[0].role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No se puede banear a un administrador'
            });
        }

        // Crear ban en PostgreSQL
        const result = await query(
            `INSERT INTO bans (user_id, reason, expires_at, created_by)
             VALUES ($1, $2, $3, $4)
             RETURNING id, user_id, reason, expires_at, created_by, created_at`,
            [user_id, reason.trim(), expiresAtDate, adminId]
        );

        const newBan = result.rows[0];

        res.status(201).json({
            success: true,
            message: expiresAtDate ? 'Ban temporal creado exitosamente' : 'Ban permanente creado exitosamente',
            data: {
                ban: newBan
            }
        });

    } catch (error) {
        console.error('Error creando ban:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});


/**
 * DELETE /api/admin/bans/:id - Eliminar un ban
 */
router.delete('/bans/:id', validateDeleteBan, async (req, res) => {
    try {
        const banId = parseInt(req.params.id);

        if (!isDatabaseAvailable()) {
            // Modo memoria
            const ban = memoryBans.get(banId);
            if (!ban) {
                return res.status(404).json({
                    success: false,
                    message: 'Ban no encontrado'
                });
            }

            memoryBans.delete(banId);

            return res.json({
                success: true,
                message: 'Ban eliminado exitosamente',
                data: {
                    deleted_ban_id: banId
                }
            });
        }

        // PostgreSQL: Verificar que el ban existe
        const existingBan = await query(
            'SELECT id FROM bans WHERE id = $1',
            [banId]
        );

        if (existingBan.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ban no encontrado'
            });
        }

        // Eliminar ban
        await query('DELETE FROM bans WHERE id = $1', [banId]);

        res.json({
            success: true,
            message: 'Ban eliminado exitosamente',
            data: {
                deleted_ban_id: banId
            }
        });

    } catch (error) {
        console.error('Error eliminando ban:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});


/**
 * GET /api/admin/bans - Listar todos los bans activos
 * Query params: ?include_expired=true para incluir bans expirados
 */
router.get('/bans', validateListBans, async (req, res) => {
    try {
        const includeExpired = req.query.include_expired === 'true';

        if (!isDatabaseAvailable()) {
            // Modo memoria
            let bans = Array.from(memoryBans.values());
            
            if (!includeExpired) {
                // Filtrar solo bans activos (permanentes o no expirados)
                bans = bans.filter(ban => 
                    ban.expires_at === null || new Date(ban.expires_at) > new Date()
                );
            }

            // Ordenar por fecha de creación descendente
            bans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Agregar información del usuario baneado
            const bansWithUserInfo = bans.map(ban => {
                const user = memoryUsers.get(ban.user_id);
                return {
                    ...ban,
                    username: user ? user.username : 'Usuario eliminado'
                };
            });

            return res.json({
                success: true,
                data: {
                    bans: bansWithUserInfo,
                    total: bansWithUserInfo.length
                }
            });
        }

        // PostgreSQL: Obtener bans con información del usuario
        let queryText = `
            SELECT b.id, b.user_id, b.reason, b.expires_at, b.created_by, b.created_at,
                   u.username
            FROM bans b
            JOIN users u ON b.user_id = u.id
        `;

        if (!includeExpired) {
            queryText += ` WHERE b.expires_at IS NULL OR b.expires_at > NOW()`;
        }

        queryText += ` ORDER BY b.created_at DESC`;

        const result = await query(queryText);

        res.json({
            success: true,
            data: {
                bans: result.rows,
                total: result.rows.length
            }
        });

    } catch (error) {
        console.error('Error listando bans:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ============================================
// RUTAS DE GESTIÓN DE USUARIOS
// ============================================

/**
 * GET /api/admin/users - Listar usuarios con paginación y búsqueda
 * Query params: 
 *   - page: número de página (default: 1)
 *   - limit: usuarios por página (default: 20, max: 100)
 *   - search: búsqueda por username o email
 */
router.get('/users', validateListUsers, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const search = req.query.search ? req.query.search.trim() : '';
        const offset = (page - 1) * limit;

        if (!isDatabaseAvailable()) {
            // Modo memoria
            let users = Array.from(memoryUsers.values());
            
            // Aplicar búsqueda si existe
            if (search) {
                const searchLower = search.toLowerCase();
                users = users.filter(user => 
                    user.username.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower)
                );
            }

            // Ordenar por fecha de creación descendente
            users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            const total = users.length;
            const paginatedUsers = users.slice(offset, offset + limit);

            // Mapear a formato de respuesta (sin password_hash)
            const usersResponse = paginatedUsers.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }));

            return res.json({
                success: true,
                data: {
                    users: usersResponse,
                    pagination: {
                        page,
                        limit,
                        total,
                        total_pages: Math.ceil(total / limit)
                    }
                }
            });
        }

        // PostgreSQL: Construir query con búsqueda opcional
        let countQuery = 'SELECT COUNT(*) FROM users';
        let selectQuery = `
            SELECT id, username, email, role, created_at
            FROM users
        `;
        const queryParams = [];
        
        if (search) {
            const searchCondition = ` WHERE username ILIKE $1 OR email ILIKE $1`;
            countQuery += searchCondition;
            selectQuery += searchCondition;
            queryParams.push(`%${search}%`);
        }

        selectQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
        queryParams.push(limit, offset);

        // Ejecutar queries
        const countResult = await query(countQuery, search ? [`%${search}%`] : []);
        const usersResult = await query(selectQuery, queryParams);

        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            data: {
                users: usersResult.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error listando usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});


/**
 * GET /api/admin/users/:id - Detalle de usuario con stats e historial de bans
 */
router.get('/users/:id', validateGetUser, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        if (!isDatabaseAvailable()) {
            // Modo memoria
            const user = memoryUsers.get(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // Obtener stats del usuario (si existen)
            const stats = global.memoryStats ? global.memoryStats.get(userId) : null;

            // Obtener historial de bans del usuario
            const bans = Array.from(memoryBans.values())
                .filter(ban => ban.user_id === userId)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        created_at: user.created_at
                    },
                    stats: stats || {
                        kills: 0,
                        deaths: 0,
                        matches: 0
                    },
                    ban_history: bans
                }
            });
        }

        // PostgreSQL: Obtener usuario
        const userResult = await query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = userResult.rows[0];

        // Obtener stats del usuario
        const statsResult = await query(
            'SELECT kills, deaths, matches, created_at, updated_at FROM player_stats WHERE user_id = $1',
            [userId]
        );

        const stats = statsResult.rows.length > 0 
            ? statsResult.rows[0] 
            : { kills: 0, deaths: 0, matches: 0 };

        // Obtener historial de bans (incluyendo expirados)
        const bansResult = await query(
            `SELECT b.id, b.reason, b.expires_at, b.created_at, b.created_by,
                    admin.username as created_by_username
             FROM bans b
             LEFT JOIN users admin ON b.created_by = admin.id
             WHERE b.user_id = $1
             ORDER BY b.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: {
                user,
                stats,
                ban_history: bansResult.rows
            }
        });

    } catch (error) {
        console.error('Error obteniendo detalle de usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
