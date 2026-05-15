import paramiko
import time
import sys

HOST = "198.23.135.164"
USER = "root"
PASS = "nHv0N3sT3w6VM6rdZ5"

SCRIPT = r"""
export DEBIAN_FRONTEND=noninteractive
set -e

echo "========== [1/6] 安装 Node.js =========="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "========== [2/6] 安装 PM2 =========="
npm install -g pm2

echo "========== [3/6] 拉取代码 =========="
rm -rf /opt/bookkeeping
git clone https://github.com/abdaziz902019287273-sketch/bookkeeping.git /opt/bookkeeping

echo "========== [4/6] 安装依赖 + 打包 =========="
cd /opt/bookkeeping/server && npm install --production
cd /opt/bookkeeping/client && npm install && npm run build

echo "========== [5/6] 启动后端 =========="
cd /opt/bookkeeping/server
pm2 delete bookkeeping-api 2>/dev/null || true
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
    }
}
NGINX
ln -sf /etc/nginx/sites-available/bookkeeping /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
systemctl enable nginx

echo ""
echo "============ 部署完成！访问: http://jiatongshang.xyz ============"
"""

def main():
    print(f"连接 {HOST}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=10)
    print("连接成功！开始部署...\n")

    stdin, stdout, stderr = client.exec_command(SCRIPT, get_pty=True, timeout=600)

    # Stream output in real time
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            chunk = stdout.channel.recv(4096).decode("utf-8", errors="replace")
            print(chunk, end="", flush=True)
        time.sleep(0.1)

    # Read remaining
    remaining = stdout.read().decode("utf-8", errors="replace")
    if remaining:
        print(remaining, end="", flush=True)

    exit_code = stdout.channel.recv_exit_status()
    err = stderr.read().decode("utf-8", errors="replace")
    if err:
        print(f"\n[stderr]\n{err}")

    client.close()

    if exit_code == 0:
        print("\n✅ 部署成功！访问 http://jiatongshang.xyz")
    else:
        print(f"\n❌ 部署失败，退出码: {exit_code}")

if __name__ == "__main__":
    main()
