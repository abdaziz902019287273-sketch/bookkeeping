#!/bin/bash
set -e

echo ">>> 拉取最新代码..."
cd /opt/bookkeeping
git pull origin main

echo ">>> 更新后端依赖..."
cd server
npm install --production
pm2 restart bookkeeping-api || pm2 start index.js --name bookkeeping-api

echo ">>> 打包前端..."
cd ../client
npm install
npm run build

echo ">>> 重载 Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ">>> 部署完成！"
