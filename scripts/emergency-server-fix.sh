#!/bin/bash
# Emergency fix script for 502 Bad Gateway errors - takes more aggressive measures

echo "======================================================="
echo "🚨 EMERGENCY SERVER FIX FOR 502 BAD GATEWAY 🚨"
echo "======================================================="

# Make sure we're running as sudo
if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root. Please use sudo."
  exit 1
fi

echo "Step 1: Completely reinstalling Nginx..."
apt-get remove --purge nginx nginx-common nginx-full -y
apt-get autoremove -y
apt-get update
apt-get install nginx -y

echo "Step 2: Creating a clean Nginx configuration..."
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log debug;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        client_max_body_size 50M;
    }
}
EOF

echo "Step 3: Testing and restarting Nginx..."
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "Step 4: Setting proper permissions on Nginx directories..."
chown -R www-data:www-data /var/www
chmod -R 755 /var/www

echo "Step 5: Finding and forcing kill any existing Node processes..."
pkill -f node || true

echo "Step 6: Finding the user's home directory and app location..."
# Find the user who deployed the app (non-root user)
APP_USER=$(grep -v "root\|nobody\|daemon\|www-data" /etc/passwd | grep "/home" | head -1 | cut -d: -f1)
if [ -z "$APP_USER" ]; then
  echo "Could not identify app user, assuming ubuntu..."
  APP_USER="ubuntu"
fi
echo "Identified app user as: $APP_USER"

# Define app directory
APP_DIR="/home/$APP_USER/app"
echo "Assuming app directory is: $APP_DIR"

echo "Step 7: Ensuring application directory has proper permissions..."
if [ -d "$APP_DIR" ]; then
  chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
  chmod -R 755 "$APP_DIR"
else
  echo "Error: App directory $APP_DIR not found"
fi

echo "Step 8: Setting up PM2 for the correct user..."
su - "$APP_USER" -c "npm install -g pm2"

echo "Step 9: Creating a systemd service for PM2..."
cat > /etc/systemd/system/pm2-$APP_USER.service << EOF
[Unit]
Description=PM2 process manager for Node.js
After=network.target

[Service]
Type=forking
User=$APP_USER
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/bin:/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
Environment=PM2_HOME=/home/$APP_USER/.pm2
PIDFile=/home/$APP_USER/.pm2/pm2.pid
WorkingDirectory=/home/$APP_USER

ExecStart=/usr/local/bin/pm2 resurrect
ExecReload=/usr/local/bin/pm2 reload all
ExecStop=/usr/local/bin/pm2 kill

[Install]
WantedBy=multi-user.target
EOF

echo "Step 10: Enabling and starting PM2 service..."
systemctl enable pm2-$APP_USER
systemctl start pm2-$APP_USER

echo "Step 11: Restarting the application as the correct user..."
if [ -d "$APP_DIR" ]; then
  su - "$APP_USER" -c "cd $APP_DIR && pm2 delete all || true"
  su - "$APP_USER" -c "cd $APP_DIR && NODE_ENV=production PORT=5000 pm2 start ./dist/index.js --name omi"
  su - "$APP_USER" -c "pm2 save"
fi

echo "Step 12: Opening required ports in firewall..."
if command -v ufw &> /dev/null; then
  ufw allow 80/tcp
  ufw allow 443/tcp
fi

echo "Step 13: Checking if application is running properly..."
sleep 3  # Give it a moment to start up

if su - "$APP_USER" -c "pm2 list | grep -q online"; then
  echo "✅ Application is running via PM2"
else
  echo "❌ Application is NOT running properly"
  echo "Checking application logs:"
  su - "$APP_USER" -c "pm2 logs --lines 20" || echo "No logs available"

  echo "Trying direct node start as a test..."
  cd "$APP_DIR" && su - "$APP_USER" -c "cd $APP_DIR && NODE_ENV=production PORT=5000 node ./dist/index.js" &
  sleep 5
  kill $! || true
fi

echo "Step 14: Testing application connectivity..."
curl -I http://localhost:5000 || echo "Could not connect to application on port 5000"

echo "Step 15: Final Nginx restart to ensure all changes are applied..."
systemctl restart nginx

echo "======================================================="
echo "Emergency fix completed!"
echo "If you're still seeing a 502 error, please try one more approach:"
echo "1. SSH into your server"
echo "2. Run these commands:"
echo "   cd ~/app"
echo "   PORT=5000 NODE_ENV=production node ./dist/index.js"
echo "3. Watch for any specific errors that might help diagnose the issue"
echo "======================================================="