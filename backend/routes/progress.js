// ============================================
// RUTAS DE PROGRESO DEL JUGADOR
// ============================================

const express = require('express');
const { executeQuery, isDatabaseAvailable } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateProgress } = require('../middleware/validation');

const router = express.Router();

// Almacenamiento en memoria (compartido con auth.js)
let memoryProgress = global.memoryProgress || new Map();
global.memoryProgress = memoryProgress;

// GET /api/progress/load - Cargar progreso del jugador
router.get('/load', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Verificar si la base de datos está disponible
        if (!isDatabaseAvailable()) {
            console.log('🔄 Usando almacenamiento en memoria para cargar progreso');
            
            // Obtener progreso de memoria
            let progressData = memoryProgress.get(userId);
            
            if (!progressData) {
                // Crear progreso inicial si no existe
                progressData = {
                    user_id: userId,
                    kills: 0,
                    deaths: 0,
                    matches: 0,
                    updated_at: new Date()
                };
                
                memoryProgress.set(userId, progressData);
                
                return res.json({
                    success: true,
                    message: 'Progreso inicial creado (modo memoria)',
                    data: formatProgressData(progressData)
                });
            }
            
            return res.json({
                success: true,
                message: 'Progreso cargado exitosamente (modo memoria)',
                data: formatProgressData(progressData)
            });
        }

        // Código para PostgreSQL - usando tabla player_stats
        const progress = await executeQuery(`
            SELECT kills, deaths, matches, updated_at
            FROM player_stats 
            WHERE user_id = $1
        `, [userId]);

        if (progress.rows.length === 0) {
            // Crear progreso inicial si no existe
            await executeQuery(`
                INSERT INTO player_stats (user_id, kills, deaths, matches)
                VALUES ($1, 0, 0, 0)
            `, [userId]);

            // Obtener el progreso recién creado
            const newProgress = await executeQuery(`
                SELECT kills, deaths, matches, updated_at
                FROM player_stats 
                WHERE user_id = $1
            `, [userId]);

            return res.json({
                success: true,
                message: 'Progreso inicial creado',
                data: formatProgressData(newProgress.rows[0])
            });
        }

        res.json({
            success: true,
            message: 'Progreso cargado exitosamente',
            data: formatProgressData(progress.rows[0])
        });

    } catch (error) {
        console.error('Error cargando progreso:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// POST /api/progress/save - Guardar progreso del jugador
router.post('/save', authenticateToken, validateProgress, async (req, res) => {
    try {
        const userId = req.user.id;
        const { stats } = req.body;

        // Verificar si la base de datos está disponible
        if (!isDatabaseAvailable()) {
            console.log('🔄 Usando almacenamiento en memoria para guardar progreso');
            
            // Obtener progreso actual de memoria
            let currentProgress = memoryProgress.get(userId) || {
                user_id: userId,
                kills: 0,
                deaths: 0,
                matches: 0,
                updated_at: new Date()
            };
            
            // Actualizar campos
            if (stats) {
                if (stats.kills !== undefined) currentProgress.kills = stats.kills;
                if (stats.deaths !== undefined) currentProgress.deaths = stats.deaths;
                if (stats.matches !== undefined) currentProgress.matches = stats.matches;
            }
            
            currentProgress.updated_at = new Date();
            
            // Guardar en memoria
            memoryProgress.set(userId, currentProgress);
            
            return res.json({
                success: true,
                message: 'Progreso guardado exitosamente (modo memoria)',
                data: formatProgressData(currentProgress)
            });
        }

        // Código para PostgreSQL - usando tabla player_stats
        const updates = [];
        const values = [];
        let paramIndex = 1;

        // Estadísticas
        if (stats) {
            if (stats.kills !== undefined) {
                updates.push(`kills = $${paramIndex++}`);
                values.push(stats.kills);
            }
            if (stats.deaths !== undefined) {
                updates.push(`deaths = $${paramIndex++}`);
                values.push(stats.deaths);
            }
            if (stats.matches !== undefined) {
                updates.push(`matches = $${paramIndex++}`);
                values.push(stats.matches);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay datos para actualizar'
            });
        }

        // Agregar user_id al final
        values.push(userId);

        // Ejecutar actualización
        const query = `UPDATE player_stats SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`;
        const result = await executeQuery(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Progreso del usuario no encontrado'
            });
        }

        // Obtener progreso actualizado
        const updatedProgress = await executeQuery(`
            SELECT kills, deaths, matches, updated_at
            FROM player_stats 
            WHERE user_id = $1
        `, [userId]);

        res.json({
            success: true,
            message: 'Progreso guardado exitosamente',
            data: formatProgressData(updatedProgress.rows[0])
        });

    } catch (error) {
        console.error('Error guardando progreso:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// GET /api/progress/stats - Obtener estadísticas del jugador
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Verificar si la base de datos está disponible
        if (!isDatabaseAvailable()) {
            console.log('🔄 Usando almacenamiento en memoria para estadísticas');
            
            const progressData = memoryProgress.get(userId);
            if (!progressData) {
                return res.status(404).json({
                    success: false,
                    message: 'Estadísticas no encontradas'
                });
            }
            
            const memoryUsers = global.memoryUsers || new Map();
            const user = memoryUsers.get(userId);
            
            const stats = {
                username: user ? user.username : 'Usuario',
                kills: progressData.kills || 0,
                deaths: progressData.deaths || 0,
                matches: progressData.matches || 0,
                kd_ratio: (progressData.deaths || 0) > 0 ? 
                    Math.round(((progressData.kills || 0) / progressData.deaths) * 100) / 100 : 
                    (progressData.kills || 0)
            };
            
            return res.json({
                success: true,
                message: 'Estadísticas obtenidas exitosamente (modo memoria)',
                data: stats
            });
        }

        // Código para PostgreSQL - usando tabla player_stats
        const stats = await executeQuery(`
            SELECT 
                u.username,
                ps.kills, ps.deaths, ps.matches,
                CASE 
                    WHEN ps.deaths > 0 THEN ROUND(ps.kills::numeric / ps.deaths, 2)
                    ELSE ps.kills
                END as kd_ratio
            FROM users u
            JOIN player_stats ps ON u.id = ps.user_id
            WHERE u.id = $1
        `, [userId]);

        if (stats.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Estadísticas no encontradas'
            });
        }

        res.json({
            success: true,
            message: 'Estadísticas obtenidas exitosamente',
            data: stats.rows[0]
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Función helper para formatear datos de progreso
function formatProgressData(dbRow) {
    return {
        stats: {
            kills: dbRow.kills || 0,
            deaths: dbRow.deaths || 0,
            matches: dbRow.matches || 0,
            kdRatio: (dbRow.deaths || 0) > 0 ? 
                Math.round(((dbRow.kills || 0) / dbRow.deaths) * 100) / 100 : (dbRow.kills || 0)
        },
        lastUpdated: dbRow.updated_at
    };
}

module.exports = router;
