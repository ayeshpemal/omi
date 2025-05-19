#!/bin/bash
# Script to check PM2 logs on the EC2 instance
# Usage: bash check-logs.sh <username> <hostname>

if [ "$#" -ne 2 ]; then
  echo "Usage: bash check-logs.sh <username> <hostname>"
  echo "Example: bash check-logs.sh ubuntu 13.234.31.226"
  exit 1
fi

USERNAME=$1
HOSTNAME=$2

echo "Connecting to $USERNAME@$HOSTNAME to check logs..."
ssh -i ../../test-key.pem $USERNAME@$HOSTNAME "
  echo '=== System Information ==='
  date
  uptime
  
  echo -e '\n=== PM2 Status ==='
  pm2 status
  
  echo -e '\n=== Application Logs (omi) ==='
  pm2 logs omi --lines 50 --nostream
  
  echo -e '\n=== Checking if application is running on port 5000 ==='
  netstat -tulpn 2>/dev/null | grep :5000 || ss -tulpn 2>/dev/null | grep :5000 || echo 'No process found on port 5000'
  
  echo -e '\n=== NGINX Error Logs (last 20 lines) ==='
  sudo tail -n 20 /var/log/nginx/error.log
  
  echo -e '\n=== Process Environment ==='
  pm2 env omi
"