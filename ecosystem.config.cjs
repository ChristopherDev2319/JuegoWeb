module.exports = {
  apps: [{
    name: 'bearstrike-game',
    script: 'server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      CLUSTER_WORKERS: 1  // Usar 1 worker hasta implementar sincronización completa
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      CLUSTER_WORKERS: 1
    },
    max_memory_restart: '1G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false
  }]
};
