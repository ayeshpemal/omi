#!/bin/bash
# Advanced troubleshooting script for persistent 502 Bad Gateway errors

echo "======================================================="
echo "🔍 COMPREHENSIVE 502 BAD GATEWAY TROUBLESHOOTER 🔍"
echo "======================================================="

# Function to print section headers
section() {
  echo ""
  echo "-------------------------------------------------------"
  echo "🔎 $1"
  echo "-------------------------------------------------------"
}

# Function to print success/failure messages
status() {
  if [ $1 -eq 0 ]; then
    echo "✅ $2"
  else
    echo "❌ $2"
  fi
}

section "CHECKING SYSTEM RESOURCES"
echo "Memory usage:"
free -h
echo ""
echo "Disk space:"
df -h /
echo ""
echo "CPU load:"
uptime

section "CHECKING NODE.JS APPLICATION"
# Check if Node.js is installed correctly
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  status 0 "Node.js is installed: $NODE_VERSION"
else
  status 1 "Node.js is not installed or not in PATH"
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Check if PM2 is installed correctly
if command -v pm2 &> /dev/null; then
  status 0 "PM2 is installed"
else
  status 1 "PM2 is not installed"
  echo "Installing PM2..."
  sudo npm install -g pm2
fi

# Check if app directory exists and has the right files
APP_DIR="$HOME/app"
if [ -d "$APP_DIR" ]; then
  status 0 "App directory exists at $APP_DIR"
  
  if [ -f "$APP_DIR/dist/index.js" ]; then
    status 0 "Application entry point exists"
  else
    status 1 "Application entry point is missing"
    ls -la "$APP_DIR/dist" || echo "dist directory might not exist"
  fi
  
  if [ -f "$APP_DIR/package.json" ]; then
    status 0 "package.json exists"
  else
    status 1 "package.json is missing"
  fi
else
  status 1 "App directory does not exist at $APP_DIR"
fi

# Check if the application is running
section "CHECKING APPLICATION PROCESS"
echo "PM2 process list:"
pm2 list

echo "Checking for Node processes:"
ps aux | grep node

# Check if the app is listening on port 5000
echo "Checking port 5000:"
if netstat -tulpn 2>/dev/null | grep -q ":5000"; then
  status 0 "Application is listening on port 5000"
  netstat -tulpn 2>/dev/null | grep ":5000"
elif ss -tulpn 2>/dev/null | grep -q ":5000"; then
  status 0 "Application is listening on port 5000"
  ss -tulpn 2>/dev/null | grep ":5000"
else
  status 1 "No process is listening on port 5000"
  
  # Try to start the application
  echo "Attempting to start the application with PM2..."
  if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    if [ -f "ecosystem.config.cjs" ]; then
      pm2 start ecosystem.config.cjs
    else
      # Create ecosystem file and start the app
      echo "Creating ecosystem file and starting app..."
      cat > ecosystem.config.cjs << 'ECOSYSTEM'
module.exports = {
  apps: [{
    name: "omi",
    script: "./dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 5000
    },
    instances: 1,
    exec_mode: "fork"
  }]
}
ECOSYSTEM
      pm2 start ecosystem.config.cjs
    fi
    pm2 save
    
    # Check again if the app is now running
    echo "Checking if app is now running:"
    if netstat -tulpn 2>/dev/null | grep -q ":5000" || ss -tulpn 2>/dev/null | grep -q ":5000"; then
      status 0 "Successfully started the application"
    else
      status 1 "Failed to start the application"
      echo "Checking application logs:"
      pm2 logs omi --lines 20 || echo "No logs available"
    fi
  fi
fi

# Check Nginx installation and configuration
section "CHECKING NGINX CONFIGURATION"
if command -v nginx &> /dev/null; then
  status 0 "Nginx is installed"
  nginx -v
else
  status 1 "Nginx is not installed"
  echo "Installing Nginx..."
  sudo apt update && sudo apt install -y nginx
  sudo systemctl enable nginx
  sudo systemctl start nginx
fi

echo "Nginx configuration file contents:"
if [ -f /etc/nginx/sites-available/default ]; then
  grep -A 20 "server {" /etc/nginx/sites-available/default
else
  status 1 "Nginx default site configuration not found"
fi

# Check if proxy_pass is correctly configured
if grep -q "proxy_pass http://localhost:5000" /etc/nginx/sites-available/default; then
  status 0 "Nginx is configured to proxy to port 5000"
else
  status 1 "Nginx is NOT configured to proxy to port 5000"
  echo "Creating backup and updating Nginx configuration..."
  sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak.$(date +%Y%m%d%H%M%S)
  
  # Create a completely new configuration to avoid any syntax issues
  sudo tee /etc/nginx/sites-available/default > /dev/null << 'NGINX_CONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
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
        proxy_connect_timeout 90;
        client_max_body_size 50M;
    }
}
NGINX_CONF
fi

# Test Nginx configuration
echo "Testing Nginx configuration:"
sudo nginx -t

# Check and restart Nginx service
section "CHECKING NGINX SERVICE"
echo "Nginx service status:"
sudo systemctl status nginx | head -n 10

echo "Restarting Nginx service:"
sudo systemctl restart nginx
status $? "Restarted Nginx service"

# Check if Nginx is accessible
echo "Checking if Nginx is accessible locally:"
curl -I http://localhost

section "CHECKING FIREWALL SETTINGS"
if command -v ufw &> /dev/null; then
  echo "UFW firewall status:"
  sudo ufw status
  
  # Check if port 80 is allowed
  if ! sudo ufw status | grep -q "80/tcp.*ALLOW"; then
    echo "Opening port 80 in UFW firewall..."
    sudo ufw allow 80/tcp
  fi
elif command -v firewalld &> /dev/null; then
  echo "Firewalld status:"
  sudo firewall-cmd --state
  sudo firewall-cmd --list-all
else
  echo "No common firewall detected"
fi

section "CHECKING LOGS FOR ERRORS"

echo "Nginx error log (last 20 lines):"
sudo tail -n 20 /var/log/nginx/error.log

echo "Nginx access log (recent 502 errors):"
sudo grep " 502 " /var/log/nginx/access.log | tail -n 10

if [ -d "$APP_DIR" ]; then
  echo "Application logs from PM2:"
  pm2 logs omi --lines 20 || echo "No application logs available from PM2"
fi

section "CHECKING NETWORK CONNECTIVITY"
echo "Testing internal connectivity to port 5000:"
curl -I http://localhost:5000 || echo "Could not connect to application on port 5000"

section "ADVANCED TROUBLESHOOTING"

echo "Checking SELinux status (if applicable):"
if command -v getenforce &> /dev/null; then
  getenforce
  if [ "$(getenforce)" = "Enforcing" ]; then
    echo "SELinux is enforcing, which might prevent Nginx from connecting to the Node.js app"
    echo "Consider running: sudo setsebool -P httpd_can_network_connect 1"
  fi
else
  echo "SELinux not detected"
fi

# Check for permission issues
echo "Checking for file permission issues in app directory:"
if [ -d "$APP_DIR" ]; then
  ls -la "$APP_DIR" | head -n 10
  ls -la "$APP_DIR/dist" 2>/dev/null || echo "dist directory not found"
fi

echo "Checking Nginx user and permissions:"
grep "user" /etc/nginx/nginx.conf

section "REPAIR ACTIONS"

echo "Performing repair actions..."

# Ensure correct ownership of app files
if [ -d "$APP_DIR" ]; then
  sudo chown -R $(whoami):$(whoami) "$APP_DIR"
  status $? "Updated ownership of application files"
fi

# Force restart the application
echo "Force restarting application:"
pm2 delete omi 2>/dev/null || true
cd "$APP_DIR" 2>/dev/null && pm2 start ecosystem.config.cjs && pm2 save
status $? "Restarted application"

# Force restart Nginx
echo "Force restarting Nginx:"
sudo systemctl restart nginx
status $? "Restarted Nginx service"

section "VERIFICATION"

echo "Verifying the application is running:"
if netstat -tulpn 2>/dev/null | grep -q ":5000" || ss -tulpn 2>/dev/null | grep -q ":5000"; then
  status 0 "Application is running on port 5000"
else
  status 1 "Application is NOT running on port 5000"
fi

echo "Verifying Nginx is running:"
if systemctl is-active --quiet nginx; then
  status 0 "Nginx service is running"
else
  status 1 "Nginx service is NOT running"
fi

echo "Testing full request chain:"
curl -I http://localhost || echo "Failed to connect to Nginx"

section "SUMMARY AND RECOMMENDATIONS"

echo "All troubleshooting steps have been completed."
echo "If you're still seeing a 502 Bad Gateway error, please check:"
echo "1. Ensure your EC2 security group allows inbound traffic on port 80"
echo "2. Check if your application has any specific requirements or environment variables"
echo "3. Review any error messages in the application logs that might indicate why it's not starting properly"
echo ""
echo "To manually check application logs, run: pm2 logs omi"
echo "To manually check Nginx error logs, run: sudo tail -f /var/log/nginx/error.log"

echo "======================================================="
echo "Troubleshooting completed!"
echo "======================================================="