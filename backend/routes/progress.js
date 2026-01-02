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

        // Código original para MySQL
        const progress = await executeQuery(`
            SELECT 
                kills, deaths, shots_fired, shots_hit, playtime_seconds,
                mouse_sensitivity, volume, fov, show_fps,
                level, experience, unlocked_weapons, additional_data,
                updated_at
            FROM user_progress 
            WHERE user_id = ?
        `, [userId]);

        if (progress.length === 0) {
            // Crear progreso inicial si no existe
            await executeQuery(`
                INSERT INTO user_progress (
                    user_id, kills, deaths, shots_fired, shots_hit, playtime_seconds,
                    mouse_sensitivity, volume, fov, show_fps, level, experience, unlocked_weapons
                ) VALUES (?, 0, 0, 0, 0, 0, 0.002, 0.5, 75, FALSE, 1, 0, ?)
            `, [userId, JSON.stringify(['M4A1', 'PISTOLA'])]);

            // Obtener el progreso recién creado
            const newProgress = await executeQuery(`
                SELECT 
                    kills, deaths, shots_fired, shots_hit, playtime_seconds,
                    mouse_sensitivity, volume, fov, show_fps,
                    level, experience, unlocked_weapons, additional_data,
                    updated_at
                FROM user_progress 
                WHERE user_id = ?
            `, [userId]);

            return res.json({
                success: true,
                message: 'Progreso inicial creado',
                data: formatProgressData(newProgress[0])
            });
        }

        res.json({
            success: true,
            message: 'Progreso cargado exitosamente',
            data: formatProgressData(progress[0])
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
        const { stats, config, progress, additionalData } = req.body;

        // Verificar si la base de datos está disponible
        if (!isDatabaseAvailable()) {
            console.log('🔄 Usando almacenamiento en memoria para guardar progreso');
            
            // Obtener progreso actual de memoria
            let currentProgress = memoryProgress.get(userId) || {
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
            };
            
            // Actualizar campos
            if (stats) {
                if (stats.kills !== undefined) currentProgress.kills = stats.kills;
                if (stats.deaths !== undefined) currentProgress.deaths = stats.deaths;
                if (stats.shotsFired !== undefined) currentProgress.shots_fired = stats.shotsFired;
                if (stats.shotsHit !== undefined) currentProgress.shots_hit = stats.shotsHit;
                if (stats.playtime !== undefined) currentProgress.playtime_seconds = stats.playtime;
            }
            
            if (config) {
                if (config.mouseSensitivity !== undefined) currentProgress.mouse_sensitivity = config.mouseSensitivity;
                if (config.volume !== undefined) currentProgress.volume = config.volume;
                if (config.fov !== undefined) currentProgress.fov = config.fov;
                if (config.showFPS !== undefined) currentProgress.show_fps = config.showFPS;
            }
            
            if (progress) {
                if (progress.level !== undefined) currentProgress.level = progress.level;
                if (progress.experience !== undefined) currentProgress.experience = progress.experience;
                if (progress.unlockedWeapons !== undefined) currentProgress.unlocked_weapons = progress.unlockedWeapons;
            }
            
            if (additionalData !== undefined) {
                currentProgress.additional_data = additionalData;
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

        // Código original para MySQL
        const updates = [];
        const values = [];

        // Estadísticas
        if (stats) {
            if (stats.kills !== undefined) {
                updates.push('kills = ?');
                values.push(stats.kills);
            }
            if (stats.deaths !== undefined) {
                updates.push('deaths = ?');
                values.push(stats.deaths);
            }
            if (stats.shotsFired !== undefined) {
                updates.push('shots_fired = ?');
                values.push(stats.shotsFired);
            }
            if (stats.shotsHit !== undefined) {
                updates.push('shots_hit = ?');
                values.push(stats.shotsHit);
            }
            if (stats.playtime !== undefined) {
                updates.push('playtime_seconds = ?');
                values.push(stats.playtime);
            }
        }

        // Configuración
        if (config) {
            if (config.mouseSensitivity !== undefined) {
                updates.push('mouse_sensitivity = ?');
                values.push(config.mouseSensitivity);
            }
            if (config.volume !== undefined) {
                updates.push('volume = ?');
                values.push(config.volume);
            }
            if (config.fov !== undefined) {
                updates.push('fov = ?');
                values.push(config.fov);
            }
            if (config.showFPS !== undefined) {
                updates.push('show_fps = ?');
                values.push(config.showFPS);
            }
        }

        // Progreso
        if (progress) {
            if (progress.level !== undefined) {
                updates.push('level = ?');
                values.push(progress.level);
            }
            if (progress.experience !== undefined) {
                updates.push('experience = ?');
                values.push(progress.experience);
            }
            if (progress.unlockedWeapons !== undefined) {
                updates.push('unlocked_weapons = ?');
                values.push(JSON.stringify(progress.unlockedWeapons));
            }
        }

        // Datos adicionales
        if (additionalData !== undefined) {
            updates.push('additional_data = ?');
            values.push(JSON.stringify(additionalData));
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay datos para actualizar'
            });
        }

        // Agregar timestamp y user_id
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(userId);

        // Ejecutar actualización
        const query = `UPDATE user_progress SET ${updates.join(', ')} WHERE user_id = ?`;
        const result = await executeQuery(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Progreso del usuario no encontrado'
            });
        }

        // Obtener progreso actualizado
        const updatedProgress = await executeQuery(`
            SELECT 
                kills, deaths, shots_fired, shots_hit, playtime_seconds,
                mouse_sensitivity, volume, fov, show_fps,
                level, experience, unlocked_weapons, additional_data,
                updated_at
            FROM user_progress 
            WHERE user_id = ?
        `, [userId]);

        res.json({
            success: true,
            message: 'Progreso guardado exitosamente',
            data: formatProgressData(updatedProgress[0])
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
                shots_fired: progressData.shots_fired || 0,
                shots_hit: progressData.shots_hit || 0,
                playtime_seconds: progressData.playtime_seconds || 0,
                level: progressData.level || 1,
                experience: progressData.experience || 0,
                kd_ratio: (progressData.deaths || 0) > 0 ? 
                    Math.round(((progressData.kills || 0) / progressData.deaths) * 100) / 100 : 
                    (progressData.kills || 0),
                accuracy_percentage: (progressData.shots_fired || 0) > 0 ? 
                    Math.round(((progressData.shots_hit || 0) / progressData.shots_fired) * 100) : 0
            };
            
            return res.json({
                success: true,
                message: 'Estadísticas obtenidas exitosamente (modo memoria)',
                data: stats
            });
        }

        const stats = await executeQuery(`
            SELECT 
                u.username,
                up.kills, up.deaths, up.shots_fired, up.shots_hit, up.playtime_seconds,
                up.level, up.experience,
                CASE 
                    WHEN up.deaths > 0 THEN ROUND(up.kills / up.deaths, 2)
                    ELSE up.kills
                END as kd_ratio,
                CASE 
                    WHEN up.shots_fired > 0 THEN ROUND((up.shots_hit / up.shots_fired) * 100, 2)
                    ELSE 0
                END as accuracy_percentage
            FROM users u
            JOIN user_progress up ON u.id = up.user_id
            WHERE u.id = ?
        `, [userId]);

        if (stats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Estadísticas no encontradas'
            });
        }

        res.json({
            success: true,
            message: 'Estadísticas obtenidas exitosamente',
            data: stats[0]
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
    // Manejar tanto formato de MySQL como formato de memoria
    const unlocked_weapons = typeof dbRow.unlocked_weapons === 'string' 
        ? JSON.parse(dbRow.unlocked_weapons) 
        : dbRow.unlocked_weapons || ['M4A1', 'PISTOLA'];
        
    const additional_data = typeof dbRow.additional_data === 'string'
        ? JSON.parse(dbRow.additional_data)
        : dbRow.additional_data || {};
    
    return {
        stats: {
            kills: dbRow.kills || 0,
            deaths: dbRow.deaths || 0,
            shotsFired: dbRow.shots_fired || 0,
            shotsHit: dbRow.shots_hit || 0,
            playtime: dbRow.playtime_seconds || 0,
            accuracy: (dbRow.shots_fired || 0) > 0 ? 
                Math.round(((dbRow.shots_hit || 0) / dbRow.shots_fired) * 100) : 0,
            kdRatio: (dbRow.deaths || 0) > 0 ? 
                Math.round(((dbRow.kills || 0) / dbRow.deaths) * 100) / 100 : (dbRow.kills || 0)
        },
        config: {
            mouseSensitivity: parseFloat(dbRow.mouse_sensitivity || 0.002),
            volume: parseFloat(dbRow.volume || 0.5),
            fov: dbRow.fov || 75,
            showFPS: dbRow.show_fps || false
        },
        progress: {
            level: dbRow.level || 1,
            experience: dbRow.experience || 0,
            unlockedWeapons: unlocked_weapons
        },
        additionalData: additional_data,
        lastUpdated: dbRow.updated_at
    };
}

module.exports = router;