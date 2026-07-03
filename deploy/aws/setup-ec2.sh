#!/usr/bin/env bash
# One-time setup on a fresh Ubuntu 22.04/24.04 EC2 instance.
# Usage: bash deploy/aws/setup-ec2.sh
set -euo pipefail

echo "==> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

echo "==> Installing PM2..."
sudo npm install -g pm2

echo "==> Installing dependencies & building..."
npm ci --prefix backend
npm ci --prefix frontend
npm run build --prefix frontend

if [ ! -f backend/.env ]; then
  cp deploy/aws/env.template backend/.env
  echo ""
  echo "IMPORTANT: Edit backend/.env with your Supabase DATABASE_URL and admin credentials:"
  echo "  nano backend/.env"
  echo ""
fi

echo "==> Starting apps with PM2..."
pm2 start deploy/aws/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | bash || true

echo "==> Configuring Nginx..."
sudo cp deploy/aws/nginx.conf /etc/nginx/sites-available/constituency
sudo ln -sf /etc/nginx/sites-available/constituency /etc/nginx/sites-enabled/constituency
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx

echo ""
echo "Done. Open http://YOUR_EC2_PUBLIC_IP in a browser."
echo "Test API: curl http://localhost/api/health"
echo "PM2 status: pm2 status"
echo "Logs: pm2 logs"
