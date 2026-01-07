/**
 * Ban Service Module
 * Handles ban verification for game connections
 * 
 * Requirement 3.3: WHEN a banned user attempts to login THEN the System SHALL reject the login
 */

import jwt from 'jsonwebtoken';

/**
 * Configuration for the ban service
 */
const config = {
    // Backend API URL - defaults to localhost in development
    apiUrl: process.env.BACKEND_API_URL || 'http://localhost:3001',
    // JWT secret for token verification (should match backend)
    jwtSecret: process.env.JWT_SECRET || 'dev_secret_key_min_32_chars_here',
    // Timeout for API requests in milliseconds
    timeout: 5000,
    // Whether to log debug information
    debug: process.env.NODE_ENV === 'development'
};

/**
 * Verify a JWT token and extract user information
 * @param {string} token - JWT token to verify
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
function verifyToken(token) {
    if (!token) return null;
    
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        return {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role || 'player'
        };
    } catch (error) {
        if (config.debug) {
            console.log(`[BanService] Token verification failed: ${error.message}`);
        }
        return null;
    }
}

/**
 * Check if a user is banned by making a request to the backend
 * Requirement 3.3: Verify user is not banned when joining game
 * 
 * @param {string} token - JWT token of the user
 * @returns {Promise<Object>} - Result with ban status
 *   - success: boolean - Whether the check was successful
 *   - banned: boolean - Whether the user is banned
 *   - ban: Object|null - Ban details if banned (reason, expires_at)
 */
async function checkBan(token) {
    if (!token) {
        return { success: false, banned: false, message: 'No token provided' };
    }
    
    // First verify the token locally
    const user = verifyToken(token);
    if (!user) {
        return { success: false, banned: false, message: 'Invalid token' };
    }
    
    try {
        // Make a request to verify the user can access protected resources
        // If the user is banned, the backend will return 403
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        const response = await fetch(`${config.apiUrl}/api/stats/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // If we get a 403, the user might be banned
        if (response.status === 403) {
            const data = await response.json();
            
            // Check if it's a ban response
            if (data.ban) {
                if (config.debug) {
                    console.log(`[BanService] User ${user.username} is banned:`, data.ban.reason);
                }
                return {
                    success: true,
                    banned: true,
                    ban: {
                        reason: data.ban.reason,
                        expires_at: data.ban.expires_at
                    },
                    user
                };
            }
        }
        
        // If we get 200 or any other status, user is not banned
        if (response.ok) {
            if (config.debug) {
                console.log(`[BanService] User ${user.username} is not banned`);
            }
            return {
                success: true,
                banned: false,
                user
            };
        }
        
        // Handle other error statuses
        if (response.status === 401) {
            return { success: false, banned: false, message: 'Token expired or invalid' };
        }
        
        return { success: true, banned: false, user };
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('[BanService] Request timeout');
        } else {
            console.error('[BanService] Request error:', error.message);
        }
        
        // On error, allow connection but log the issue
        // This prevents the game from being unplayable if the backend is down
        return {
            success: false,
            banned: false,
            message: error.message,
            user
        };
    }
}

/**
 * Validate a connection attempt with token and ban check
 * Combines token verification and ban checking
 * 
 * @param {string} token - JWT token from the client
 * @returns {Promise<Object>} - Validation result
 *   - valid: boolean - Whether the connection is allowed
 *   - user: Object|null - User info if valid
 *   - reason: string - Reason if not valid
 *   - ban: Object|null - Ban details if banned
 */
async function validateConnection(token) {
    // No token means guest/anonymous connection (allowed)
    if (!token) {
        return {
            valid: true,
            user: null,
            reason: 'guest'
        };
    }
    
    // Verify token
    const user = verifyToken(token);
    if (!user) {
        return {
            valid: false,
            user: null,
            reason: 'invalid_token'
        };
    }
    
    // Check ban status
    const banResult = await checkBan(token);
    
    if (banResult.banned) {
        return {
            valid: false,
            user,
            reason: 'banned',
            ban: banResult.ban
        };
    }
    
    // Connection is valid
    return {
        valid: true,
        user,
        reason: 'authenticated'
    };
}

export {
    verifyToken,
    checkBan,
    validateConnection,
    config as banServiceConfig
};
