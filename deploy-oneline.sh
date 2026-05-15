#!/bin/bash
set -e

# ====== 一键部署记账本 ======
# 在服务器终端执行：bash /tmp/deploy-oneline.sh

export DEBIAN_FRONTEND=noninteractive

echo "========== [1/6] 安装 Node.js =========="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "========== [2/6] 安装 PM2 =========="
npm install -g pm2

echo "========== [3/6] 拉取代码 =========="
git clone https://github.com/abdaziz902019287273-sketch/bookkeeping.git /opt/bookkeeping

echo "========== [4/6] 安装依赖 + 打包 =========="
cd /opt/bookkeeping/server && npm install --production
cd /opt/bookkeeping/client && npm install && npm run build

echo "========== [5/6] 启动后端 =========="
cd /opt/bookkeeping/server
pm2 start index.js --name bookkeeping-api
pm2 save
pm2 startup systemd -u root --hp /root

echo "========== [6/6] 配置 Nginx =========="
apt install -y nginx

cat > /etc/nginx/sites-available/bookkeeping << 'NGINX'
server {
    listen 80;
    server_name jiatongshang.xyz www.jiatongshang.xyz;

    location / {
        root /opt/bookkeeping/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/bookkeeping /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
systemctl enable nginx

echo ""
echo "============================================"
echo "  部署完成！"
echo "  HTTP:  http://jiatongshang.xyz"
echo "============================================"
echo ""
echo "  如需 HTTPS，稍后执行："
echo "  apt install -y certbot python3-certbot-nginx"
echo "  certbot --nginx -d jiatongshang.xyz -d www.jiatongshang.xyz"
echo ""
