/**
 * WebSocket Server Entry Point
 * Main server for multiplayer FPS game
 * 
 * Uses legacy single-process server for stability.
 * Cluster mode available in fix/new-features branch.
 */

import { startLegacyServer } from './legacyServer.js';

console.log('[SERVER] Starting BearStrike game server...');
startLegacyServer();
