/**
 * WebSocket Server Entry Point
 * Main server for multiplayer FPS game with cluster support
 * 
 * This module detects if running as master or worker and initializes
 * the appropriate component:
 * - Master: ClusterManager for coordinating workers
 * - Worker: WorkerServer for handling game connections
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3
 */

import cluster from 'cluster';
import { CLUSTER_CONFIG, getSystemInfo } from './cluster/config.js';
import { ClusterManager } from './cluster/clusterManager.js';
import { WorkerServer } from './cluster/workerServer.js';

// Check if cluster mode is enabled via environment variable
// Default to cluster mode in production, single mode in development
const CLUSTER_ENABLED = process.env.CLUSTER_ENABLED !== 'false' && 
                        process.env.NODE_ENV !== 'development';

/**
 * Starts the server in the appropriate mode
 * Requirement 1.1: Master creates workers, workers run game server
 */
function startServer() {
  // If cluster is disabled, run in single-process mode (legacy)
  if (!CLUSTER_ENABLED) {
    console.log('[SERVER] Cluster mode disabled, running in single-process mode');
    startSingleProcessMode();
    return;
  }

  // Cluster mode: detect if master or worker
  if (cluster.isPrimary || cluster.isMaster) {
    startMasterProcess();
  } else {
    startWorkerProcess();
  }
}

/**
 * Starts the master process
 * Requirement 1.1: Create 7 worker processes
 * Requirements 5.1, 5.2, 5.3: Logging of metrics, memory warnings, and restarts
 */
function startMasterProcess() {
  const systemInfo = getSystemInfo();
  
  console.log('='.repeat(60));
  console.log('[MASTER] Starting cluster master process');
  console.log(`[MASTER] PID: ${process.pid}`);
  console.log(`[MASTER] Node.js: ${systemInfo.nodeVersion}`);
  console.log(`[MASTER] Platform: ${systemInfo.platform}`);
  console.log(`[MASTER] Total CPUs: ${systemInfo.totalCPUs}`);
  console.log(`[MASTER] Configured workers: ${systemInfo.configuredWorkers}`);
  console.log(`[MASTER] Total memory: ${(systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log('='.repeat(60));

  // Create and initialize cluster manager
  const clusterManager = new ClusterManager();
  
  try {
    clusterManager.initialize();
    console.log('[MASTER] Cluster initialized successfully');
  } catch (error) {
    console.error('[MASTER] Failed to initialize cluster:', error.message);
    process.exit(1);
  }
}

/**
 * Starts a worker process
 * Requirement 3.1: Worker runs independent game server instance
 */
function startWorkerProcess() {
  const workerId = cluster.worker?.id || 0;
  
  console.log(`[WORKER ${workerId}] Starting worker process (PID: ${process.pid})`);
  
  // Create and start worker server
  const workerServer = new WorkerServer();
  
  try {
    workerServer.start();
  } catch (error) {
    console.error(`[WORKER ${workerId}] Failed to start:`, error.message);
    process.exit(1);
  }
}

/**
 * Starts the server in single-process mode (legacy/development)
 * This imports and runs the original server code without clustering
 */
async function startSingleProcessMode() {
  // Dynamic import to avoid loading unnecessary modules in cluster mode
  const { startLegacyServer } = await import('./legacyServer.js');
  startLegacyServer();
}

// Start the server
startServer();

// Export for testing
export { startServer, CLUSTER_ENABLED };
