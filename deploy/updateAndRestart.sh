# any future command that fails will exit the script
set -e
cd /home/ubuntu/gen-ai-builder-backend
pm2 kill
rm -rf node_modules
git checkout staging
git pull origin staging
node -v
npm install --loglevel verbose
pm2 start server.js
pm2 status