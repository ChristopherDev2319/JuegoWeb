# Design Document

## Overview

Este diseño extiende el sistema de autenticación existente en BearStrike para incluir roles de usuario, estadísticas de jugador, sistema de baneos y panel de administración. Se mantiene la arquitectura actual de Express.js + MySQL, añadiendo un sistema de migraciones para gestionar cambios en el schema de base de datos.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Lobby UI   │  │   Auth UI    │  │    Admin Panel UI    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼─────────────────────┼───────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API REST (Express.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ /api/auth    │  │ /api/stats   │  │    /api/admin        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                     │               │
│         ▼                 ▼                     ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Middleware (Auth, Validation, Admin)        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MySQL Database                           │
│  ┌────────┐  ┌──────────────┐  ┌──────┐  ┌────────────────┐    │
│  │ users  │  │ player_stats │  │ bans │  │   migrations   │    │
│  └────────┘  └──────────────┘  └──────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Schema

```sql
-- Tabla users (modificada)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('player', 'admin') DEFAULT 'player',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Tabla player_stats
CREATE TABLE player_stats (
    user_id INT PRIMARY KEY,
    kills INT DEFAULT 0,
    deaths INT DEFAULT 0,
    matches INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla bans
CREATE TABLE bans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    reason VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Tabla migrations
CREATE TABLE migrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    version VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

#### Auth Routes (`/api/auth`)
- `POST /register` - Registro de usuario (crea player_stats automáticamente)
- `POST /login` - Login con verificación de ban
- `POST /logout` - Cerrar sesión

#### Stats Routes (`/api/stats`)
- `GET /me` - Obtener estadísticas del usuario autenticado
- `PUT /update` - Actualizar estadísticas (kills, deaths, matches)
- `GET /leaderboard` - Top jugadores por kills

#### Admin Routes (`/api/admin`) - Requiere rol admin
- `GET /users` - Listar usuarios con paginación y búsqueda
- `GET /users/:id` - Detalle de usuario con stats y bans
- `POST /bans` - Crear ban
- `DELETE /bans/:id` - Eliminar ban
- `GET /bans` - Listar todos los bans activos

### Middleware

```javascript
// adminMiddleware.js
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Acceso denegado' });
    }
    next();
}

// banCheckMiddleware.js
async function checkBan(req, res, next) {
    const activeBan = await getActiveBan(req.user.id);
    if (activeBan) {
        return res.status(403).json({
            success: false,
            message: 'Usuario baneado',
            ban: { reason: activeBan.reason, expires_at: activeBan.expires_at }
        });
    }
    next();
}
```

### Migration System

```javascript
// migrations/runner.js
class MigrationRunner {
    async runPending() {
        const applied = await getAppliedMigrations();
        const pending = getMigrationFiles().filter(m => !applied.includes(m.version));
        
        for (const migration of pending) {
            await this.executeMigration(migration);
        }
    }
    
    async executeMigration(migration) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute(migration.sql);
            await connection.execute(
                'INSERT INTO migrations (version, name) VALUES (?, ?)',
                [migration.version, migration.name]
            );
            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
```

## Data Models

### User Model
```javascript
{
    id: number,
    username: string,
    email: string,
    password_hash: string,
    role: 'player' | 'admin',
    created_at: Date,
    updated_at: Date
}
```

### PlayerStats Model
```javascript
{
    user_id: number,
    kills: number,
    deaths: number,
    matches: number,
    created_at: Date,
    updated_at: Date
}
```

### Ban Model
```javascript
{
    id: number,
    user_id: number,
    reason: string,
    expires_at: Date | null,  // null = permanente
    created_by: number,
    created_at: Date
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Registration creates user with correct role and stats
*For any* valid registration data (username, email, password), registering a new user SHALL create a user record with role "player" AND create an associated player_stats record with all counters at 0.
**Validates: Requirements 1.1**

### Property 2: Username and email uniqueness
*For any* existing user, attempting to register with the same username OR email SHALL be rejected with an appropriate error message.
**Validates: Requirements 1.2**

### Property 3: Login returns valid JWT with user data
*For any* registered user with valid credentials, logging in SHALL return a JWT token that contains the correct user id, username, and role.
**Validates: Requirements 1.3**

### Property 4: Invalid credentials are rejected
*For any* login attempt with incorrect password or non-existent username, the System SHALL reject the login with an authentication error.
**Validates: Requirements 1.4**

### Property 5: Stats increment correctly
*For any* player with initial stats (k, d, m), incrementing kills SHALL result in (k+1, d, m), incrementing deaths SHALL result in (k, d+1, m), and incrementing matches SHALL result in (k, d, m+1).
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 6: Stats retrieval returns all fields
*For any* user with player_stats, requesting stats SHALL return an object containing kills, deaths, and matches fields with correct values.
**Validates: Requirements 2.4**

### Property 7: Stats persistence
*For any* stats update operation, querying the database immediately after SHALL return the updated values.
**Validates: Requirements 2.5**

### Property 8: Ban creation and storage
*For any* ban created by an admin, if expires_at is provided the ban SHALL be stored as temporary, if expires_at is null the ban SHALL be stored as permanent.
**Validates: Requirements 3.1, 3.2**

### Property 9: Banned user login rejection
*For any* user with an active ban (not expired), attempting to login SHALL be rejected with a response containing the ban reason and expiration date.
**Validates: Requirements 3.3**

### Property 10: Expired ban allows login
*For any* user with only expired bans, attempting to login with valid credentials SHALL succeed.
**Validates: Requirements 3.4**

### Property 11: Ban removal restores access (round-trip)
*For any* user, banning then unbanning SHALL restore the user's ability to login.
**Validates: Requirements 3.5**

### Property 12: Admin role authorization
*For any* request to admin endpoints, if the user role is "admin" the request SHALL be processed, if the user role is "player" the request SHALL be rejected with 403.
**Validates: Requirements 4.1, 4.5**

### Property 13: User list contains required fields
*For any* admin request to list users, each user in the response SHALL contain username, email, role, and created_at fields.
**Validates: Requirements 4.2**

### Property 14: User search filters correctly
*For any* search query, the returned users SHALL have username OR email containing the search term.
**Validates: Requirements 4.4**

### Property 15: Migration idempotence
*For any* set of migrations, running the migration system twice SHALL produce the same database state as running it once.
**Validates: Requirements 5.5**

### Property 16: Migration rollback on failure
*For any* migration that fails during execution, the database state SHALL remain unchanged from before the migration attempt.
**Validates: Requirements 5.3**

### Property 17: API response format consistency
*For any* API request, the response SHALL be valid JSON containing a "success" boolean field and either "data" or "message" field.
**Validates: Requirements 6.1**

### Property 18: Protected endpoints require authentication
*For any* request to a protected endpoint without a valid JWT token, the System SHALL return 401 Unauthorized.
**Validates: Requirements 6.4**

### Property 19: Invalid input returns 400
*For any* request with invalid input data (missing required fields, wrong types), the System SHALL return 400 Bad Request with validation errors.
**Validates: Requirements 6.3**

## Error Handling

### Authentication Errors
- `401 Unauthorized`: Token missing, invalid, or expired
- `403 Forbidden`: User banned or insufficient permissions

### Validation Errors
- `400 Bad Request`: Invalid input data with specific field errors
```javascript
{
    success: false,
    message: 'Validation error',
    errors: [
        { field: 'email', message: 'Email format invalid' },
        { field: 'password', message: 'Password must be at least 8 characters' }
    ]
}
```

### Database Errors
- `500 Internal Server Error`: Database connection or query failures
- Errors are logged server-side but not exposed to client

### Ban Response Format
```javascript
{
    success: false,
    message: 'Usuario baneado',
    ban: {
        reason: 'Uso de hacks',
        expires_at: '2026-02-01T00:00:00Z' // null si permanente
    }
}
```

## Testing Strategy

### Unit Tests
- Validation functions for user input
- Password hashing and verification
- JWT token generation and validation
- Ban expiration checking logic

### Property-Based Tests
Using **fast-check** library for JavaScript property-based testing.

Each property test will:
- Run minimum 100 iterations
- Generate random valid inputs within constraints
- Tag with format: `**Feature: sistema-usuarios-admin, Property {number}: {property_text}**`

Key properties to test:
1. Registration creates correct user structure
2. Stats increment operations are atomic
3. Ban enforcement is consistent
4. Admin authorization is properly enforced
5. Migration idempotence

### Integration Tests
- Full registration → login → stats update flow
- Admin ban → user login rejection → unban → login success flow
- Migration execution with rollback scenarios

### Test Database
- Use separate test database for integration tests
- Reset database state before each test suite
- Use transactions for test isolation where possible
