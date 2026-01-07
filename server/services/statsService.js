/**
 * Stats Service Module
 * Handles communication with the backend API for player statistics
 * 
 * Requirements: 2.1, 2.2, 2.3 - Send kill/death/match events to stats API
 */

/**
 * Configuration for the stats service
 */
const config = {
    // Backend API URL - defaults to localhost in development
    apiUrl: process.env.BACKEND_API_URL || 'http://localhost:3001',
    // Timeout for API requests in milliseconds
    timeout: 5000,
    // Whether to log debug information
    debug: process.env.NODE_ENV === 'development'
};

/**
 * Make an authenticated request to the stats API
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {string} token - JWT token for authentication
 * @param {Object} [body] - Request body
 * @returns {Promise<Object>} - API response
 */
async function makeRequest(endpoint, method, token, body = null) {
    const url = `${config.apiUrl}${endpoint}`;
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        options.signal = controller.signal;
        
        const response = await fetch(url, options);
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (config.debug) {
            console.log(`[StatsService] ${method} ${endpoint}:`, data.success ? 'OK' : data.message);
        }
        
        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`[StatsService] Request timeout: ${endpoint}`);
        } else {
            console.error(`[StatsService] Request error: ${endpoint}`, error.message);
        }
        return { success: false, message: error.message };
    }
}

/**
 * Increment kill count for a player
 * Requirement 2.1: WHEN a player kills another player THEN the System SHALL increment the killer's kills count by 1
 * 
 * @param {string} token - JWT token of the player
 * @param {number} [count=1] - Number of kills to add
 * @returns {Promise<Object>} - Result with updated stats
 */
async function incrementKills(token, count = 1) {
    if (!token) {
        console.warn('[StatsService] No token provided for incrementKills');
        return { success: false, message: 'No token provided' };
    }
    
    return makeRequest('/api/stats/update', 'PUT', token, { kills: count });
}

/**
 * Increment death count for a player
 * Requirement 2.2: WHEN a player dies THEN the System SHALL increment that player's deaths count by 1
 * 
 * @param {string} token - JWT token of the player
 * @param {number} [count=1] - Number of deaths to add
 * @returns {Promise<Object>} - Result with updated stats
 */
async function incrementDeaths(token, count = 1) {
    if (!token) {
        console.warn('[StatsService] No token provided for incrementDeaths');
        return { success: false, message: 'No token provided' };
    }
    
    return makeRequest('/api/stats/update', 'PUT', token, { deaths: count });
}

/**
 * Increment match count for a player
 * Requirement 2.3: WHEN a player completes a match THEN the System SHALL increment that player's matches count by 1
 * 
 * @param {string} token - JWT token of the player
 * @param {number} [count=1] - Number of matches to add
 * @returns {Promise<Object>} - Result with updated stats
 */
async function incrementMatches(token, count = 1) {
    if (!token) {
        console.warn('[StatsService] No token provided for incrementMatches');
        return { success: false, message: 'No token provided' };
    }
    
    return makeRequest('/api/stats/update', 'PUT', token, { matches: count });
}

/**
 * Update multiple stats at once
 * @param {string} token - JWT token of the player
 * @param {Object} stats - Stats to update
 * @param {number} [stats.kills] - Kills to add
 * @param {number} [stats.deaths] - Deaths to add
 * @param {number} [stats.matches] - Matches to add
 * @returns {Promise<Object>} - Result with updated stats
 */
async function updateStats(token, stats) {
    if (!token) {
        console.warn('[StatsService] No token provided for updateStats');
        return { success: false, message: 'No token provided' };
    }
    
    // Filter out undefined values
    const body = {};
    if (stats.kills !== undefined) body.kills = stats.kills;
    if (stats.deaths !== undefined) body.deaths = stats.deaths;
    if (stats.matches !== undefined) body.matches = stats.matches;
    
    if (Object.keys(body).length === 0) {
        return { success: false, message: 'No stats to update' };
    }
    
    return makeRequest('/api/stats/update', 'PUT', token, body);
}

/**
 * Get current stats for a player
 * @param {string} token - JWT token of the player
 * @returns {Promise<Object>} - Result with player stats
 */
async function getStats(token) {
    if (!token) {
        console.warn('[StatsService] No token provided for getStats');
        return { success: false, message: 'No token provided' };
    }
    
    return makeRequest('/api/stats/me', 'GET', token);
}

export {
    incrementKills,
    incrementDeaths,
    incrementMatches,
    updateStats,
    getStats,
    config as statsServiceConfig
};
