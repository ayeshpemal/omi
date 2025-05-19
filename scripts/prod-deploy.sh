#!/bin/bash
# Script to properly deploy the application in production mode
# Usage: bash prod-deploy.sh <username> <hostname>

if [ "$#" -ne 2 ]; then
  echo "Usage: bash prod-deploy.sh <username> <hostname>"
  echo "Example: bash prod-deploy.sh ubuntu 13.234.31.226"
  exit 1
fi

USERNAME=$1
HOSTNAME=$2

echo "Connecting to $USERNAME@$HOSTNAME to deploy production build..."
ssh -i ../../test-key.pem $USERNAME@$HOSTNAME "
  echo '=== Setting up production environment ==='
  mkdir -p ~/app-prod
  
  echo -e '\n=== Installing production dependencies ==='
  cd ~/app-prod
  npm init -y
  npm install express
  
  echo -e '\n=== Creating server directory structure ==='
  mkdir -p dist/public
  
  echo -e '\n=== Creating production server file ==='
  cat > dist/index.js << 'EOF'
// Simple Express server for production
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Basic HTML response for the root route
app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html lang='en'>
    <head>
      <meta charset='UTF-8'>
      <meta name='viewport' content='width=device-width, initial-scale=1.0'>
      <title>OMI Card Game</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #eee;
          padding-bottom: 10px;
        }
        .status {
          background: #f8f9fa;
          border-left: 4px solid #28a745;
          padding: 15px;
        }
      </style>
    </head>
    <body>
      <h1>OMI Card Game Server</h1>
      <div class='status'>
        <p>✅ Server is running successfully!</p>
        <p>Server Time: \${new Date().toLocaleString()}</p>
      </div>
      <p>The application server is operational. The full game client will be deployed soon.</p>
      <p>For server health information, check the <a href='/api/health'>API health endpoint</a>.</p>
    </body>
    </html>
  \`);
});

// Start the server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
EOF
  
  echo -e '\n=== Creating ecosystem config for PM2 ==='
  cat > ecosystem.config.js << 'EOF'
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

  echo -e '\n=== Starting application with PM2 ==='
  cd ~/app-prod
  pm2 delete omi 2>/dev/null || true
  pm2 start ecosystem.config.js
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