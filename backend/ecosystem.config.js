// PM2 Ecosystem Configuration for Agro Bank Backend
// This file defines how PM2 should run the application

module.exports = {
  apps: [
    {
      name: 'agro-backend',
      script: './server.js',
      cwd: '/var/www/fin.agrobank.uz/backend',
      instances: 1, // Use 'max' for cluster mode or a specific number
      exec_mode: 'fork', // Use 'cluster' if instances > 1
      watch: false, // Set to true in development only
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/pm2/agro-backend-error.log',
      out_file: '/var/log/pm2/agro-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000,
      wait_ready: false,
      
      // Cron restart at 3 AM daily (optional)
      // cron_restart: '0 3 * * *',
      
      // Environment-specific settings
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'fin.agrobank.uz',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/agro-backend.git',
      path: '/var/www/fin.agrobank.uz/backend',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
