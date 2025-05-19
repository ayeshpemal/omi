# CI/CD Setup for OMI Project

This document outlines the Continuous Integration and Continuous Deployment setup for the OMI project using GitHub Actions and AWS EC2.

## Overview

The CI/CD pipeline consists of two main workflows:
1. **CI (Continuous Integration)**: Builds and tests the application
2. **CD (Continuous Deployment)**: Deploys the application to the AWS EC2 instance

## GitHub Repository Setup

Before the CI/CD pipeline can work, you need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:

- `SSH_PRIVATE_KEY`: The private SSH key to connect to your EC2 instance (contents of your .pem file)
- `SSH_KNOWN_HOSTS`: The SSH known hosts entry for your EC2 instance
- `EC2_HOST`: The public IP address or DNS of your EC2 instance
- `EC2_USER`: The username to use when connecting to your EC2 instance (typically `ubuntu` for Ubuntu 24.04 LTS)

## Setting Up SSH Keys for Deployment

Since you already have a .pem file for your EC2 instance, you can use it for deployment:

1. Convert and use your existing .pem file:
   ```
   # Make sure your .pem file has the right permissions
   chmod 400 your-key-file.pem
   
   # Get the content of your .pem file (this is what you'll add to SSH_PRIVATE_KEY secret)
   cat your-key-file.pem
   ```

2. Get the SSH known hosts entry by connecting to your EC2 instance once:
   ```
   # Connect to your EC2 instance to verify the connection (you may need to approve the fingerprint)
   ssh -i your-key-file.pem ubuntu@your-ec2-instance-ip
   
   # Exit the connection
   exit
   
   # Get the known hosts entry
   ssh-keyscan -H your-ec2-instance-ip >> ~/.ssh/known_hosts
   cat ~/.ssh/known_hosts
   ```
   Copy the line with your EC2 instance details for the SSH_KNOWN_HOSTS secret.

3. Add these values to your GitHub repository secrets as described above.

## EC2 Instance Setup

1. Connect to your EC2 instance via SSH using your .pem file:
   ```
   ssh -i your-key-file.pem ubuntu@your-ec2-instance-ip
   ```

2. Copy the `scripts/setup-ec2.sh` script to your EC2 instance:
   ```
   scp -i your-key-file.pem scripts/setup-ec2.sh ubuntu@your-ec2-instance-ip:~/
   ```

3. Make the script executable and run it:
   ```
   chmod +x setup-ec2.sh
   ./setup-ec2.sh
   ```

This script will:
- Update your system
- Install Node.js, npm, and PM2
- Set up NGINX as a reverse proxy for port 5000 (the port your application runs on)
- Configure PM2 to restart your application on system reboot

## How the Pipeline Works

1. When you push to the `main` branch, the CI workflow runs:
   - Checks out the code
   - Sets up Node.js
   - Installs dependencies
   - Runs type checking
   - Builds the application
   - Uploads the build artifacts

2. If the CI workflow succeeds, the CD workflow runs:
   - Downloads the build artifacts
   - Packages them into a tarball
   - Transfers the package to your EC2 instance
   - Extracts the files on the server
   - Restarts your application with PM2, making sure it runs on port 5000

## Troubleshooting

If the deployment fails, check the GitHub Actions logs for error messages. Common issues include:

- SSH connectivity problems (check your SSH secrets)
- Permission issues on the EC2 instance
- Missing dependencies on the EC2 instance

## Manual Deployment

If needed, you can manually deploy by running:

```bash
# Build the application locally
npm run build

# Create a tarball of the build
tar -czf app.tar.gz dist/

# Copy it to the EC2 instance
scp -i your-key-file.pem app.tar.gz ubuntu@your-ec2-instance-ip:~/

# SSH into the instance and deploy
ssh -i your-key-file.pem ubuntu@your-ec2-instance-ip

# On the EC2 instance:
mkdir -p ~/app
tar -xzf app.tar.gz -C ~/app
cd ~/app
npm ci --only=production
export NODE_ENV=production
pm2 restart omi || pm2 start dist/index.js --name omi -- --port 5000
```