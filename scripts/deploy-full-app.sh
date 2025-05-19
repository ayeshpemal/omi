#!/bin/bash
# Full deployment script for OMI card game
# Builds and deploys both client and server components
# Usage: bash deploy-full-app.sh <username> <hostname>

if [ "$#" -ne 2 ]; then
  echo "Usage: bash deploy-full-app.sh <username> <hostname>"
  echo "Example: bash deploy-full-app.sh ubuntu 13.234.31.226"
  exit 1
fi

USERNAME=$1
HOSTNAME=$2

echo "=== Building client application ==="
# Navigate to project root and install dependencies
npm install 

# Build the client application
echo "Building client application..."
cd client
npm install
npm run build

# Return to project root
cd ..

echo "=== Preparing deployment package ==="
# Create a deployment directory
rm -rf deploy
mkdir -p deploy

# Copy client build files
echo "Copying client build files..."
cp -r client/dist deploy/client

# Copy server files
echo "Copying server files..."
mkdir -p deploy/server
cp server/*.ts deploy/server/

# Create a production server entry point
echo "Creating production server entry point..."
cat > deploy/server.js << 'EOF'
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static assets from the client build directory
app.use(express.static(path.join(__dirname, 'client')));

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// For any other route, serve the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# Create a production package.json
echo "Creating production package.json..."
cat > deploy/package.json << EOF
{
  "name": "omi-card-game",
  "version": "1.0.0",
  "description": "OMI Card Game - Sri Lankan 4-player trick-taking game",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF

# Create ecosystem config for PM2
echo "Creating PM2 ecosystem config..."
cat > deploy/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'omi',
    script: './server.js',
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

echo "=== Creating tar archive for deployment ==="
tar -czf omi-deploy.tar.gz -C deploy .

echo "=== Deploying to $USERNAME@$HOSTNAME ==="
# Copy the archive to server
scp omi-deploy.tar.gz $USERNAME@$HOSTNAME:~/

# SSH into the server and deploy
ssh -i ../../test-key.pem $USERNAME@$HOSTNAME << EOF
  echo "=== Setting up application on server ==="
  
  # Clean up previous deployment
  rm -rf ~/omi
  mkdir -p ~/omi
  
  # Extract the deployment archive
  tar -xzf omi-deploy.tar.gz -C ~/omi
  
  # Install dependencies
  cd ~/omi
  npm install --production
  
  # Stop any existing PM2 processes
  pm2 delete omi 2>/dev/null || true
  
  # Start the application with PM2
  pm2 start ecosystem.config.js
  pm2 save
  
  # Check status
  echo "=== PM2 Status ==="
  pm2 status
  
  # Check if the app is running on port 5000
  echo "=== Checking port 5000 ==="
  sleep 5 # Give it time to start
  netstat -tulpn 2>/dev/null | grep :5000 || ss -tulpn 2>/dev/null | grep :5000 || echo "No process found on port 5000"
  
  # Restart NGINX
  echo "=== Restarting NGINX ==="
  sudo systemctl restart nginx
  
  # Clean up
  rm ~/omi-deploy.tar.gz
  
  echo "=== Deployment complete ==="
  echo "Your OMI card game is now available at http://$(hostname -I | awk '{print \$1}')"
EOF

echo "Cleaning up local deployment files..."
rm -rf deploy
rm -f omi-deploy.tar.gz

echo "Deployment process complete!"