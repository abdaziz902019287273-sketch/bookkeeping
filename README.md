# 记账本

情侣记账小工具，支持小李 & 小尚双人记账。

## 本地开发

```bash
# 后端
cd server && npm install && npm run dev

# 前端
cd client && npm install && npm run dev
```

访问 http://localhost:5173

## 部署

```bash
# 首次部署：把项目传到服务器 /opt/bookkeeping
scp -r ./ user@服务器IP:/opt/bookkeeping/

# 服务器上执行
bash /opt/bookkeeping/deploy.sh
```

后续更新：本地 git push，服务器 bash deploy.sh
