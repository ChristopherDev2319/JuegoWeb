-- ============================================
-- Migration 003: Create bans table
-- Requirements: 3.1, 3.2
-- ============================================

-- Create bans table
CREATE TABLE IF NOT EXISTS bans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(500) NOT NULL,
    expires_at TIMESTAMPTZ NULL,  -- NULL means permanent ban
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bans_user_id ON bans(user_id);
CREATE INDEX IF NOT EXISTS idx_bans_expires_at ON bans(expires_at);
CREATE INDEX IF NOT EXISTS idx_bans_created_by ON bans(created_by);
