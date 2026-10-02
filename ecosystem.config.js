module.exports = {
  apps: [
    {
      name: 'cashin-tap',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/cashin-tap',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      error_file: '/var/log/cashin-tap/error.log',
      out_file: '/var/log/cashin-tap/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'cashin-tap-worker',
      script: 'node_modules/.bin/ts-node',
      args: "--compiler-options '{\"module\":\"CommonJS\"}' src/workers/worker.ts",
      cwd: '/var/www/cashin-tap',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      error_file: '/var/log/cashin-tap/worker-error.log',
      out_file: '/var/log/cashin-tap/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
