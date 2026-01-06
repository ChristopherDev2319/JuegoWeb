-- ============================================
-- Migration 001: Add role column to users table
-- Requirements: 1.1, 4.1
-- ============================================

-- Add role column with CHECK constraint
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'player' 
CHECK (role IN ('player', 'admin'));

-- Create index on role column for efficient filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have 'player' role (in case any have NULL)
UPDATE users SET role = 'player' WHERE role IS NULL;

-- Ensure role column is NOT NULL after update
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
