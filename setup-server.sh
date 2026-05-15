#!/bin/bash
set -e

# 首次部署：服务器初始化脚本
# 用法：scp setup-server.sh user@服务器IP:/tmp/ && ssh user@服务器IP 'bash /tmp/setup-server.sh'

APP_DIR="/opt/bookkeeping"
DOMAIN="你的域名.com"  # ← 改成你的域名

echo ">>> 安装 Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo ">>> 安装 PM2..."
npm install -g pm2

echo ">>> 克隆项目..."
mkdir -p $APP_DIR
git clone https://github.com/abdaziz902019287273-sketch/bookkeeping.git $APP_DIR

echo ">>> 安装后端依赖..."
cd $APP_DIR/server
npm install --production

echo ">>> 安装前端依赖并打包..."
cd $APP_DIR/client
npm install
npm run build

echo ">>> 配置 Nginx..."
cat > /etc/nginx/sites-available/bookkeeping << 'NGINX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    location / {
        root /opt/bookkeeping/client/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/" /etc/nginx/sites-available/bookkeeping

ln -sf /etc/nginx/sites-available/bookkeeping /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ">>> 启动后端服务..."
cd $APP_DIR/server
pm2 start index.js --name bookkeeping-api
pm2 save
pm2 startup

echo ">>> 安装 HTTPS 证书..."
apt install -y certbot python3-certbot-nginx
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email abdaziz902019287273@gmail.com

echo ""
echo "=============================="
echo "  部署完成！"
echo "  访问: https://$DOMAIN"
echo "=============================="
