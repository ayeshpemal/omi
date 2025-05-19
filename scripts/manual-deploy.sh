#!/bin/bash
# Script for manual deployment from local machine when GitHub Actions deployment isn't working

# Set these variables before running
EC2_USER="ubuntu"  # Change this to your EC2 user
EC2_HOST="13.234.31.226"  # Change this to your EC2 IP address
SSH_KEY_PATH="../../test-key.pem"  # Change this to your SSH key path

# Check if required commands are available
if ! command -v npm &> /dev/null || ! command -v scp &> /dev/null || ! command -v ssh &> /dev/null; then
    echo "Error: This script requires npm, scp, and ssh to be installed."
    exit 1
fi

echo "==== Manual Deployment to EC2 ===="
echo "This script will build and deploy your application to EC2."
echo "Host: $EC2_HOST"
echo "User: $EC2_USER"
echo ""

# Confirm before proceeding
read -p "Continue with deployment? (y/n): " confirm
if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Build the application
echo "Building application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Build failed! Aborting deployment."
    exit 1
fi

echo "Build successful!"

# Create ecosystem.config.js
echo "Creating ecosystem.config.js..."
cat > ecosystem.config.js << EOF
export default {
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
EOF

# Create deployment archive
echo "Creating deployment archive..."
tar -czf app.tar.gz dist/ package.json package-lock.json ecosystem.config.js

# Upload to server
echo "Copying files to server..."
scp -i "$SSH_KEY_PATH" app.tar.gz "$EC2_USER@$EC2_HOST":~/

# Deploy on server
echo "Deploying on server..."
ssh -i "$SSH_KEY_PATH" "$EC2_USER@$EC2_HOST" << 'EOF'
  echo "Starting deployment process..."
  
  # Stop existing application if running
  pm2 stop omi 2>/dev/null || true
  pm2 delete omi 2>/dev/null || true
  
  # Clean up old deployment and prepare for new one
  rm -rf ~/app/*
  mkdir -p ~/app
  
  # Extract the new build to app directory
  tar -xzf app.tar.gz -C ~/app
  
  # Display the contents to verify
  echo "Verifying extracted files:"
  ls -la ~/app
  ls -la ~/app/dist
  
  # Install production dependencies
  cd ~/app
  npm ci --omit=dev
  
  # Set environment to production
  export NODE_ENV=production
  export PORT=5000
  
  # Create a simpler ecosystem file directly on the server
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
  
  # Start the application with PM2 using the ecosystem file
  cd ~/app
  pm2 start ecosystem.config.cjs
  
  # Save PM2 configuration to persist across reboots
  pm2 save
  
  # Show running processes
  pm2 status
  
  # Check the logs for errors
  echo "Application logs (last 20 lines):"
  pm2 logs omi --lines 20 || echo "No logs available yet"
  
  # Check if the application is listening on port 5000
  echo "Checking port 5000:"
  netstat -tulpn | grep :5000 || ss -tulpn | grep :5000 || echo "Port 5000 not in use?"
  
  # Fix Nginx configuration if needed
  echo "Checking Nginx configuration for omi app..."
  if ! grep -q "proxy_pass http://localhost:5000" /etc/nginx/sites-available/default; then
    echo "Updating Nginx configuration to proxy to port 5000..."
    sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak
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
    echo "Restarting Nginx..."
    sudo systemctl restart nginx
  else
    echo "Nginx configuration already contains proxy to port 5000"
    echo "Restarting Nginx anyway to ensure configuration is applied..."
    sudo systemctl restart nginx
  fi
  
  # Check NGINX status
  echo "NGINX status:"
  sudo systemctl status nginx | head -n 10
  
  # Clean up
  rm ~/app.tar.gz
  
  echo "Deployment complete!"
EOF

# Cleanup local files
rm app.tar.gz ecosystem.config.js

echo "==== Manual deployment completed ===="
echo "Your application should now be accessible at http://$EC2_HOST"