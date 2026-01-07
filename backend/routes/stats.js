// ============================================
// RUTAS DE ESTADÍSTICAS DE JUGADOR
// ============================================

const express = require('express');
const { query, isDatabaseAvailable } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateStatsUpdate, validateLeaderboard } = require('../middleware/validation');

const router = express.Router();

// Acceso al almacenamiento en memoria (compartido con auth.js)
const getMemoryStats = () => global.memoryStats || new Map();

/**
 * GET /api/stats/me - Obtener estadísticas del usuario autenticado
 * Requirements: 2.4
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        if (!isDatabaseAvailable()) {
            // Modo memoria
            const memoryStats = getMemoryStats();
            const stats = memoryStats.get(userId);
            
            if (!stats) {
                return res.status(404).json({
                    success: false,
                    message: 'Estadísticas no encontradas'
                });
            }

            return res.json({
                success: true,
                data: {
                    kills: stats.kills,
                    deaths: stats.deaths,
                    matches: stats.matches
                }
            });
        }

        // PostgreSQL
        const result = await query(
            'SELECT kills, deaths, matches FROM player_stats WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Estadísticas no encontradas'
            });
        }

        const stats = result.rows[0];

        res.json({
            success: true,
            data: {
                kills: stats.kills,
                deaths: stats.deaths,
                matches: stats.matches
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

/**
 * PUT /api/stats/update - Actualizar estadísticas (kills, deaths, matches)
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */
router.put('/update', authenticateToken, validateStatsUpdate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { kills, deaths, matches } = req.body;

        // Construir objeto de actualizaciones (validación ya hecha por middleware)
        const updates = {};
        if (kills !== undefined) updates.kills = kills;
        if (deaths !== undefined) updates.deaths = deaths;
        if (matches !== undefined) updates.matches = matches;

        if (!isDatabaseAvailable()) {
            // Modo memoria
            const memoryStats = getMemoryStats();
            let stats = memoryStats.get(userId);
            
            if (!stats) {
                // Crear stats si no existen
                stats = {
                    user_id: userId,
                    kills: 0,
                    deaths: 0,
                    matches: 0,
                    created_at: new Date(),
                    updated_at: new Date()
                };
            }

            // Incrementar valores
            if (updates.kills !== undefined) {
                stats.kills += updates.kills;
            }
            if (updates.deaths !== undefined) {
                stats.deaths += updates.deaths;
            }
            if (updates.matches !== undefined) {
                stats.matches += updates.matches;
            }
            stats.updated_at = new Date();

            memoryStats.set(userId, stats);

            return res.json({
                success: true,
                message: 'Estadísticas actualizadas (modo memoria)',
                data: {
                    kills: stats.kills,
                    deaths: stats.deaths,
                    matches: stats.matches
                }
            });
        }

        // PostgreSQL - Construir query dinámica para incrementar valores
        const setClauses = [];
        const params = [userId];
        let paramIndex = 2;

        if (updates.kills !== undefined) {
            setClauses.push(`kills = kills + $${paramIndex}`);
            params.push(updates.kills);
            paramIndex++;
        }
        if (updates.deaths !== undefined) {
            setClauses.push(`deaths = deaths + $${paramIndex}`);
            params.push(updates.deaths);
            paramIndex++;
        }
        if (updates.matches !== undefined) {
            setClauses.push(`matches = matches + $${paramIndex}`);
            params.push(updates.matches);
            paramIndex++;
        }

        const updateQuery = `
            UPDATE player_stats 
            SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
            RETURNING kills, deaths, matches
        `;

        const result = await query(updateQuery, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Estadísticas no encontradas para este usuario'
            });
        }

        const updatedStats = result.rows[0];

        res.json({
            success: true,
            message: 'Estadísticas actualizadas',
            data: {
                kills: updatedStats.kills,
                deaths: updatedStats.deaths,
                matches: updatedStats.matches
            }
        });

    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/stats/leaderboard - Top jugadores por kills
 * Requirements: 2.4
 */
router.get('/leaderboard', validateLeaderboard, async (req, res) => {
    try {
        // Parámetro opcional para limitar resultados (default 10)
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

        if (!isDatabaseAvailable()) {
            // Modo memoria
            const memoryStats = getMemoryStats();
            const memoryUsers = global.memoryUsers || new Map();
            
            const leaderboard = Array.from(memoryStats.values())
                .map(stats => {
                    const user = memoryUsers.get(stats.user_id);
                    return {
                        username: user ? user.username : 'Unknown',
                        kills: stats.kills,
                        deaths: stats.deaths,
                        matches: stats.matches
                    };
                })
                .sort((a, b) => b.kills - a.kills)
                .slice(0, limit);

            return res.json({
                success: true,
                data: leaderboard
            });
        }

        // PostgreSQL
        const result = await query(
            `SELECT u.username, ps.kills, ps.deaths, ps.matches
             FROM player_stats ps
             JOIN users u ON ps.user_id = u.id
             WHERE u.is_active = TRUE
             ORDER BY ps.kills DESC
             LIMIT $1`,
            [limit]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error obteniendo leaderboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
