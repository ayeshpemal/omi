#!/bin/bash

# Update the system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js and npm (for Ubuntu 24.04 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build essentials (might be needed for some npm packages)
sudo apt-get install -y build-essential

# Install PM2 globally
sudo npm install -g pm2

# Create app directory
mkdir -p ~/app

# Set up PM2 to restart on server reboot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Install nginx for reverse proxy
sudo apt-get install -y nginx

# Configure nginx to proxy requests to our Node.js app
sudo tee /etc/nginx/sites-available/omi <<EOF
server {
    listen 80;
    server_name _;  # Replace with your domain if you have one

    location / {
        proxy_pass http://localhost:5000;  # App runs on port 5000 as seen in server/index.ts
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the nginx config
sudo ln -s /etc/nginx/sites-available/omi /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # Remove default config

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Configure firewall to allow HTTP, HTTPS, and SSH
sudo apt-get install -y ufw
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw --force enable

echo "Server setup complete!"