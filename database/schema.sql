-- ============================================
-- SCHEMA PARA SISTEMA DE USUARIOS Y PROGRESO
-- ============================================

-- Crear base de datos (opcional)
-- CREATE DATABASE fps_game_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE fps_game_db;

-- Tabla de usuarios
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Índices para optimización
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- Tabla de progreso del usuario
CREATE TABLE user_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Estadísticas del jugador
    kills INT DEFAULT 0,
    deaths INT DEFAULT 0,
    shots_fired INT DEFAULT 0,
    shots_hit INT DEFAULT 0,
    playtime_seconds INT DEFAULT 0,
    
    -- Configuración personal
    mouse_sensitivity DECIMAL(6,4) DEFAULT 0.0020,
    volume DECIMAL(3,2) DEFAULT 0.50,
    fov INT DEFAULT 75,
    show_fps BOOLEAN DEFAULT FALSE,
    
    -- Progreso del jugador
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    unlocked_weapons JSON DEFAULT ('["M4A1", "PISTOLA"]'),
    
    -- Datos adicionales como JSON para flexibilidad
    additional_data JSON DEFAULT ('{}'),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Relaciones
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Índices
    UNIQUE KEY unique_user_progress (user_id),
    INDEX idx_level (level),
    INDEX idx_updated_at (updated_at)
);

-- Tabla de sesiones activas (opcional, para invalidar tokens)
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id)
);

-- Insertar usuario de prueba (opcional)
-- Contraseña: "test123" (será hasheada en el backend)
INSERT INTO users (username, email, password_hash) VALUES 
('testuser', 'test@example.com', '$2b$10$placeholder_hash_will_be_generated');

-- Insertar progreso inicial para usuario de prueba
INSERT INTO user_progress (user_id, kills, deaths, shots_fired, shots_hit, playtime_seconds) VALUES 
(1, 0, 0, 0, 0, 0);