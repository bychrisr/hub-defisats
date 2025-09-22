module.exports = {
  apps: [
    {
      name: 'axisor-bot-backend',
      script: 'npx',
      args: 'ts-node --transpile-only backend/src/index.ts',
      cwd: '/home/ubuntu/apps/axisor-bot',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3010
      },
      env_file: './backend/.env.production',
      log_file: './logs/backend.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'axisor-bot-frontend',
      script: 'serve',
      args: ['-s', './frontend/dist', '-l', '3001'],
      cwd: '/home/ubuntu/apps/axisor-bot',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      log_file: './logs/frontend.log',
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
