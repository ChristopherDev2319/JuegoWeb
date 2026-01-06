# Requirements Document

## Introduction

Sistema completo de gestión de usuarios para el juego FPS BearStrike. El sistema incluye registro y autenticación de usuarios con roles (player/admin), seguimiento de estadísticas de jugador (kills, deaths, partidas jugadas), sistema de baneos temporales y permanentes, y un panel de administración para gestionar usuarios y baneos. La base de datos utiliza PostgreSQL con migraciones para control de versiones del schema, soportando configuración dual para entornos de desarrollo (local) y producción (VPS). Expone una API REST para todas las operaciones.

## Glossary

- **User**: Entidad que representa a un jugador o administrador registrado en el sistema
- **Player Stats**: Estadísticas de juego asociadas a un usuario (kills, deaths, matches)
- **Ban**: Restricción de acceso aplicada a un usuario, puede ser temporal o permanente
- **Migration**: Script SQL versionado que modifica el schema de la base de datos
- **Admin Panel**: Interfaz web para que administradores gestionen usuarios y baneos
- **API REST**: Interfaz de programación basada en HTTP para operaciones CRUD
- **JWT**: JSON Web Token usado para autenticación de sesiones
- **VPS**: Servidor privado virtual donde se despliega el sistema en producción
- **PostgreSQL**: Sistema de gestión de base de datos relacional usado para persistencia
- **Environment Config**: Sistema de configuración basado en archivos .env para separar desarrollo y producción

## Requirements

### Requirement 1

**User Story:** As a player, I want to register and login to the game, so that my progress and statistics are saved across sessions.

#### Acceptance Criteria

1. WHEN a user submits valid registration data (username, email, password) THEN the System SHALL create a new user record with role "player" and return a JWT token
2. WHEN a user submits registration with an existing username or email THEN the System SHALL reject the registration and return a specific error message
3. WHEN a user submits valid login credentials THEN the System SHALL verify the password hash and return a JWT token with user data
4. WHEN a user submits invalid login credentials THEN the System SHALL reject the login and return an authentication error
5. WHEN a user's JWT token expires THEN the System SHALL require re-authentication

### Requirement 2

**User Story:** As a player, I want my game statistics tracked automatically, so that I can see my performance over time.

#### Acceptance Criteria

1. WHEN a player kills another player THEN the System SHALL increment the killer's kills count by 1
2. WHEN a player dies THEN the System SHALL increment that player's deaths count by 1
3. WHEN a player completes a match THEN the System SHALL increment that player's matches count by 1
4. WHEN a user requests their statistics THEN the System SHALL return kills, deaths, and matches played
5. WHEN statistics are updated THEN the System SHALL persist changes to the database immediately

### Requirement 3

**User Story:** As an administrator, I want to ban players who violate rules, so that I can maintain a fair gaming environment.

#### Acceptance Criteria

1. WHEN an admin creates a ban with an expiration date THEN the System SHALL store the ban as temporary and enforce it until expiration
2. WHEN an admin creates a ban without an expiration date THEN the System SHALL store the ban as permanent
3. WHEN a banned user attempts to login THEN the System SHALL reject the login and return the ban reason and expiration
4. WHEN a temporary ban expires THEN the System SHALL allow the user to login normally
5. WHEN an admin removes a ban THEN the System SHALL delete the ban record and restore user access

### Requirement 4

**User Story:** As an administrator, I want an admin panel to manage users and bans, so that I can efficiently moderate the game.

#### Acceptance Criteria

1. WHEN an admin accesses the admin panel THEN the System SHALL verify the user has admin role before displaying content
2. WHEN an admin views the users list THEN the System SHALL display all users with their username, email, role, and creation date
3. WHEN an admin views a user's details THEN the System SHALL display the user's statistics and ban history
4. WHEN an admin searches for a user THEN the System SHALL filter results by username or email
5. WHEN a non-admin user attempts to access admin endpoints THEN the System SHALL reject the request with a 403 Forbidden error

### Requirement 5

**User Story:** As a developer, I want database changes managed through migrations, so that schema changes are versioned and reproducible.

#### Acceptance Criteria

1. WHEN a migration is executed THEN the System SHALL apply SQL changes in version order
2. WHEN a migration completes successfully THEN the System SHALL record the migration version in a migrations table
3. WHEN a migration fails THEN the System SHALL rollback changes and report the error
4. WHEN the application starts THEN the System SHALL check for pending migrations and apply them automatically
5. WHEN a migration has already been applied THEN the System SHALL skip that migration

### Requirement 6

**User Story:** As a developer, I want a REST API for all user operations, so that the frontend can interact with the backend consistently.

#### Acceptance Criteria

1. WHEN a client sends a request to the API THEN the System SHALL respond with JSON format including success status and data or error message
2. WHEN a client sends an authenticated request THEN the System SHALL validate the JWT token before processing
3. WHEN a client sends a request with invalid data THEN the System SHALL return a 400 Bad Request with validation errors
4. WHEN a client sends a request to a protected endpoint without authentication THEN the System SHALL return a 401 Unauthorized error
5. WHEN the API encounters an internal error THEN the System SHALL return a 500 error without exposing sensitive details

### Requirement 7

**User Story:** As a developer, I want separate configuration for development and production environments, so that I can work locally and deploy to VPS without code changes.

#### Acceptance Criteria

1. WHEN the application starts in development mode THEN the System SHALL load configuration from `.env.development` file
2. WHEN the application starts in production mode THEN the System SHALL load configuration from `.env.production` file
3. WHEN NODE_ENV is set to "development" THEN the System SHALL connect to the local PostgreSQL database
4. WHEN NODE_ENV is set to "production" THEN the System SHALL connect to the VPS PostgreSQL database
5. WHEN a required environment variable is missing THEN the System SHALL fail startup with a clear error message

### Requirement 8

**User Story:** As a developer, I want to use PostgreSQL as the database, so that I have a robust and scalable data store.

#### Acceptance Criteria

1. WHEN the application connects to the database THEN the System SHALL use PostgreSQL connection protocol
2. WHEN executing queries THEN the System SHALL use PostgreSQL-compatible SQL syntax
3. WHEN creating tables THEN the System SHALL use PostgreSQL data types (SERIAL, TIMESTAMPTZ, etc.)
4. WHEN the database connection fails THEN the System SHALL retry connection with exponential backoff
5. WHEN the connection pool is exhausted THEN the System SHALL queue requests until a connection is available
