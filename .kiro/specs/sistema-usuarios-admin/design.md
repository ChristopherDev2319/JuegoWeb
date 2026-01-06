# Design Document

## Overview

Este diseño extiende el sistema de autenticación existente en BearStrike para incluir roles de usuario, estadísticas de jugador, sistema de baneos y panel de administración. Se migra de MySQL a PostgreSQL y se implementa un sistema de configuración dual para desarrollo local y producción en VPS. Se añade un sistema de migraciones para gestionar cambios en el schema de base de datos.

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
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Environment Config Loader                      │   │
│  │    .env.development (local) | .env.production (VPS)     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
│  ┌────────┐  ┌──────────────┐  ┌──────┐  ┌────────────────┐    │
│  │ users  │  │ player_stats │  │ bans │  │   migrations   │    │
│  └────────┘  └──────────────┘  └──────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Environment Configuration

```
backend/
├── .env.development      # Configuración para desarrollo local
├── .env.production       # Configuración para VPS
├── config/
│   ├── database.js       # Conexión PostgreSQL
│   └── env.js            # Cargador de configuración por entorno
```

#### .env.development
```env
NODE_ENV=development
PORT=3001

# PostgreSQL Local
DATABASE_URL=postgresql://postgres:password@localhost:5432/bearstrike_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bearstrike_dev
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=dev_secret_key_min_32_chars_here
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

#### .env.production
```env
NODE_ENV=production
PORT=3001

# PostgreSQL VPS
DATABASE_URL=postgresql://bearstrike:secure_password@localhost:5432/bearstrike_prod
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bearstrike_prod
DB_USER=bearstrike
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=production_secret_very_secure_min_64_chars
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://bearstrike.com.mx
```

### Database Schema (PostgreSQL)

```sql
-- Tabla users (modificada)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'player' CHECK (role IN ('player', 'admin')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Tabla player_stats
CREATE TABLE player_stats (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    matches INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabla bans
CREATE TABLE bans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(500) NOT NULL,
    expires_at TIMESTAMPTZ NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bans_user_id ON bans(user_id);
CREATE INDEX idx_bans_expires_at ON bans(expires_at);

-- Tabla migrations
CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
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
// backend/config/env.js
const path = require('path');
const dotenv = require('dotenv');

function loadEnvConfig() {
    const env = process.env.NODE_ENV || 'development';
    const envFile = `.env.${env}`;
    
    const result = dotenv.config({ path: path.resolve(__dirname, '..', envFile) });
    
    if (result.error) {
        // Fallback to .env if specific file not found
        dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
    }
    
    // Validate required variables
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    for (const key of required) {
        if (!process.env[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
        }
    }
    
    return {
        nodeEnv: env,
        port: process.env.PORT || 3001,
        databaseUrl: process.env.DATABASE_URL,
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
        allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',')
    };
}

module.exports = { loadEnvConfig };
```

```javascript
// backend/config/database.js
const { Pool } = require('pg');
const { loadEnvConfig } = require('./env');

const config = loadEnvConfig();

const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
async function testConnection() {
    try {
        const client = await pool.connect();
        console.log(`✅ PostgreSQL conectado (${config.nodeEnv})`);
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a PostgreSQL:', error.message);
        return false;
    }
}

// Query helper
async function query(text, params) {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development') {
        console.log('Query ejecutada', { text, duration, rows: result.rowCount });
    }
    return result;
}

module.exports = { pool, query, testConnection };
```

```javascript
// backend/migrations/runner.js
const fs = require('fs');
const path = require('path');
const { pool, query } = require('../config/database');

class MigrationRunner {
    constructor() {
        this.migrationsDir = path.join(__dirname, 'sql');
    }
    
    async ensureMigrationsTable() {
        await query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                version VARCHAR(50) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
    
    async getAppliedMigrations() {
        const result = await query('SELECT version FROM migrations ORDER BY version');
        return result.rows.map(r => r.version);
    }
    
    getMigrationFiles() {
        const files = fs.readdirSync(this.migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();
        
        return files.map(file => {
            const [version, ...nameParts] = file.replace('.sql', '').split('_');
            return {
                version,
                name: nameParts.join('_'),
                file,
                sql: fs.readFileSync(path.join(this.migrationsDir, file), 'utf8')
            };
        });
    }
    
    async runPending() {
        await this.ensureMigrationsTable();
        const applied = await this.getAppliedMigrations();
        const migrations = this.getMigrationFiles();
        const pending = migrations.filter(m => !applied.includes(m.version));
        
        console.log(`📦 ${pending.length} migraciones pendientes`);
        
        for (const migration of pending) {
            await this.executeMigration(migration);
        }
        
        return pending.length;
    }
    
    async executeMigration(migration) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(migration.sql);
            await client.query(
                'INSERT INTO migrations (version, name) VALUES ($1, $2)',
                [migration.version, migration.name]
            );
            await client.query('COMMIT');
            console.log(`✅ Migración ${migration.version}: ${migration.name}`);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Error en migración ${migration.version}:`, error.message);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = { MigrationRunner };
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

### Property 20: Environment-specific config loading
*For any* NODE_ENV value ("development" or "production"), the System SHALL load configuration from the corresponding `.env.{NODE_ENV}` file and use the correct database connection string.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 21: Missing required env variable fails startup
*For any* required environment variable (DATABASE_URL, JWT_SECRET), if it is missing, the System SHALL throw an error with a message identifying the missing variable.
**Validates: Requirements 7.5**

### Property 22: Database connection retry with backoff
*For any* database connection failure, the System SHALL retry with exponential backoff, with each retry delay being greater than the previous.
**Validates: Requirements 8.4**

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
- Environment config loading

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
6. Environment-specific config loading
7. Missing env variable detection

### Integration Tests
- Full registration → login → stats update flow
- Admin ban → user login rejection → unban → login success flow
- Migration execution with rollback scenarios
- Environment switching (dev → prod config)

### Test Database
- Use separate PostgreSQL test database for integration tests
- Reset database state before each test suite
- Use transactions for test isolation where possible
- Connection string: `postgresql://postgres:password@localhost:5432/bearstrike_test`
