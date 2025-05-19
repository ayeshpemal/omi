#!/bin/bash
# Troubleshooting script to fix 502 Bad Gateway errors with Nginx

echo "==== Nginx 502 Bad Gateway Troubleshooting Script ===="
echo "Checking if Node.js application is running..."

# Check if app is listening on port 5000
if netstat -tulpn 2>/dev/null | grep -q ":5000"; then
  echo "✅ Application is listening on port 5000"
elif ss -tulpn 2>/dev/null | grep -q ":5000"; then
  echo "✅ Application is listening on port 5000"
else
  echo "❌ Application is NOT listening on port 5000"
  echo "Attempting to start the application with PM2..."
  
  # Check if PM2 is installed
  if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing..."
    npm install -g pm2
  fi
  
  # Check if app directory exists
  if [ -d "$HOME/app" ]; then
    cd "$HOME/app"
    echo "Starting application with PM2..."
    pm2 start ecosystem.config.cjs || pm2 start "NODE_ENV=production PORT=5000 node ./dist/index.js" --name "omi"
    pm2 save
    echo "Application started. PM2 status:"
    pm2 status
  else
    echo "❌ App directory not found at $HOME/app"
    echo "Please ensure the application is properly deployed."
  fi
fi

# Check Nginx configuration
echo "Checking Nginx configuration..."
if grep -q "proxy_pass http://localhost:5000" /etc/nginx/sites-available/default; then
  echo "✅ Nginx configuration contains proper proxy_pass setting"
else
  echo "❌ Nginx configuration is NOT properly set up to proxy to port 5000"
  echo "Creating backup of current Nginx configuration..."
  sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d%H%M%S)
  
  echo "Updating Nginx configuration..."
  sudo tee /etc/nginx/sites-available/default > /dev/null << 'NGINX_CONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 90;
    }
}
NGINX_CONF

  echo "Testing Nginx configuration..."
  sudo nginx -t
  
  if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    echo "Restarting Nginx..."
    sudo systemctl restart nginx
    echo "Nginx restarted"
  else
    echo "❌ Nginx configuration test failed. Please check the error above."
  fi
fi

# Check Nginx service status
echo "Checking Nginx service status..."
systemctl status nginx | head -n 10

# Check Nginx error logs
echo "Last 10 lines of Nginx error log:"
sudo tail -n 10 /var/log/nginx/error.log

# Check Nginx access logs for recent 502 errors
echo "Recent 502 errors in access log:"
sudo grep " 502 " /var/log/nginx/access.log | tail -n 5

# Check if firewall might be blocking
echo "Checking firewall status..."
if command -v ufw &> /dev/null; then
  ufw status
elif command -v firewalld &> /dev/null; then
  firewall-cmd --list-all
else
  echo "No known firewall detected"
fi

echo "==== Troubleshooting complete ===="
echo "If you can access your application now, the issue has been resolved!"
echo "If you're still experiencing problems, please check the application logs:"
echo "  pm2 logs omi"