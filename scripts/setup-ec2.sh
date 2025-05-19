#!/bin/bash

# Update system packages
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js and npm
echo "Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install NGINX
echo "Installing NGINX..."
sudo apt-get install -y nginx

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Create app directory if it doesn't exist
echo "Setting up application directory..."
mkdir -p ~/app

# Create NGINX configuration
echo "Configuring NGINX..."
sudo tee /etc/nginx/sites-available/omi > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    access_log /var/log/nginx/omi_access.log;
    error_log /var/log/nginx/omi_error.log;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable our site
sudo ln -sf /etc/nginx/sites-available/omi /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test NGINX config
sudo nginx -t

# Restart NGINX
sudo systemctl restart nginx
sudo systemctl enable nginx

# Create a PM2 ecosystem file for proper application management
cat > ~/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: "omi",
    script: "./dist/index.js",
    cwd: "/home/ubuntu/app",
    env: {
      NODE_ENV: "production",
      PORT: 5000
    },
    instances: 1,
    exec_mode: "fork",
    watch: false,
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "/home/ubuntu/.pm2/logs/omi-error.log",
    out_file: "/home/ubuntu/.pm2/logs/omi-out.log",
    max_memory_restart: "200M"
  }]
}
EOF

# Setup PM2 to start on system reboot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "Setup complete! The application will be deployed and started with PM2 during the deployment process."