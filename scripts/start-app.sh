#!/bin/bash
# Script to manually start the application on the server
# Usage: bash start-app.sh <username> <hostname>

if [ "$#" -ne 2 ]; then
  echo "Usage: bash start-app.sh <username> <hostname>"
  echo "Example: bash start-app.sh ubuntu 13.234.31.226"
  exit 1
fi

USERNAME=$1
HOSTNAME=$2

echo "Connecting to $USERNAME@$HOSTNAME to start the application..."
ssh -i ../../test-key.pem $USERNAME@$HOSTNAME "
  echo '=== Current Directory ==='
  pwd
  
  echo -e '\n=== Checking App Directory ==='
  if [ -d ~/app ]; then
    echo 'App directory exists'
    ls -la ~/app
  else
    echo 'App directory does not exist'
    mkdir -p ~/app
    echo 'Created app directory'
  fi
  
  echo -e '\n=== Checking for build files ==='
  if [ -d ~/app/dist ]; then
    echo 'Build directory exists'
    ls -la ~/app/dist
  else
    echo 'Build directory does not exist'
  fi
  
  echo -e '\n=== Creating proper ecosystem.config.cjs file ==='
  cat > ~/app/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'omi',
    script: './dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M'
  }]
}
EOF
  
  echo -e '\n=== Starting Application with PM2 ==='
  cd ~/app
  echo 'Current directory: ' $(pwd)
  echo 'Stopping any existing instances...'
  pm2 delete omi 2>/dev/null || true
  echo 'Starting application...'
  NODE_ENV=production PORT=5000 pm2 start ecosystem.config.cjs
  pm2 save
  
  echo -e '\n=== PM2 Status ==='
  pm2 status
  
  echo -e '\n=== Checking if application is running on port 5000 ==='
  sleep 5 # Give the app a moment to start
  netstat -tulpn 2>/dev/null | grep :5000 || ss -tulpn 2>/dev/null | grep :5000 || echo 'No process found on port 5000'
  
  echo -e '\n=== Restarting NGINX ==='
  sudo systemctl daemon-reload
  sudo systemctl restart nginx
  
  echo -e '\n=== NGINX Status ==='
  sudo systemctl status nginx | head -n 10
  
  echo -e '\n=== Application Logs ==='
  pm2 logs omi --lines 20 --nostream
"