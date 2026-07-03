/** PM2 — run from repo root: pm2 start deploy/aws/ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: 'constituency-api',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
    },
    {
      name: 'constituency-web',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      instances: 1,
      autorestart: true,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
