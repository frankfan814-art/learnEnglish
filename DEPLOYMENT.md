# 部署指南（包含数据库）

本文档说明如何部署 LearnEnglish 应用（包含 SQLite 数据库功能）。

## 部署架构

### 生产环境（推荐）

**完整部署：静态前端 + 后端 API + 数据库**

```
┌─────────┐      ┌──────────┐      ┌─────────┐
│ 前端    │─────▶│ Nginx    │─────▶│ 浏览器  │
│ (dist/) │      │ 反向代理 │      │         │
└─────────┘      └──────────┘      └─────────┘
                       │
                       ├─────────▶ ┌──────────┐
                       │           │ 后端 API │
                       │           │ (PM2)    │
                       │           └──────────┘
                       │                │
                       │           ┌────▼────┐
                       │           │ SQLite  │
                       │           │ 数据库  │
                       │           └─────────┘
                       └─────────────────────▶
                              3001 端口
```

**组件说明：**
- **前端**: React 静态文件（由 Vite 构建）
- **Nginx**: Web 服务器，提供静态文件和 API 反向代理
- **后端 API**: Express.js 服务器，提供 AI 生成和数据库 API
- **数据库**: SQLite 文件，存储学习进度、收藏等
- **PM2**: Node.js 进程管理器，保持后端服务运行

### 简单部署（仅前端）

如果不需要数据库功能，可以只部署前端，继续使用 localStorage：

- ✅ 适合不需要持久化存储的场景
- ✅ 部署更简单，无需后端服务
- ❌ 数据会因浏览器清理而丢失

## 部署前准备

### 服务器要求

- **操作系统**: Linux (CentOS 7+, Ubuntu 18.04+, OpenCloudOS)
- **Node.js**: 18.x 或更高版本
- **内存**: 最低 512MB，推荐 1GB+
- **磁盘**: 最低 1GB 可用空间
- **权限**: root 或 sudo 权限

### 安装 Node.js (CentOS/OpenCloudOS)

```bash
# 安装 Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 验证安装
node -v
npm -v
```

### 安装 PM2

```bash
npm install -g pm2
```

### 安装 Nginx

```bash
# CentOS/OpenCloudOS
yum install -y nginx

# Ubuntu/Debian
apt-get install -y nginx

# 启动 Nginx
systemctl enable nginx
systemctl start nginx
```

## 部署方式

### 方式 A: 使用自动化脚本部署（推荐）

适用于**完整部署（前端 + 后端 + 数据库）**：

```bash
# 1. 克隆代码到服务器
git clone <your-repo-url> /opt/learnEnglish
cd /opt/learnEnglish

# 2. 运行部署脚本
sudo bash deploy-backend.sh
```

**脚本功能：**
- ✅ 自动检查并安装 Node.js、PM2、Nginx
- ✅ 安装依赖（包括 better-sqlite3 原生模块）
- ✅ 初始化数据库
- ✅ 配置 Nginx 反向代理
- ✅ 启动后端服务（PM2）
- ✅ 配置防火墙规则

### 方式 B: 使用 GitHub Actions 自动部署

已在 `.github/workflows/deploy.yml` 配置，每次推送到 `master` 分支自动部署。

**配置 Secrets：**

在 GitHub 仓库设置中添加以下 Secrets：

```
SERVER_HOST         # 服务器 IP 地址
SERVER_USER        # SSH 用户名（通常为 root）
SSH_PRIVATE_KEY    # SSH 私钥
SSH_PORT           # SSH 端口（默认 22）
```

**工作流程：**
1. 推送代码到 GitHub
2. GitHub Actions 自动构建前端
3. 打包前端、后端、数据库代码
4. 上传到服务器并自动部署
5. 备份现有数据库
6. 重启后端服务

### 方式 C: 手动部署（静态前端仅）

如果**不需要数据库**，使用现有的 `deploy-nginx.sh` 脚本：

```bash
# 1. 本地构建前端
npm run build

# 2. 上传 dist/ 目录到服务器
scp -r dist/* user@server:/opt/learnEnglish/dist/

# 3. 在服务器上配置 Nginx
sudo bash deploy-nginx.sh
```

## 部署后验证

### 1. 检查前端访问

```bash
curl -I http://your-server-ip
```

应返回 `200 OK`

### 2. 检查后端 API

```bash
curl http://your-server-ip/api/health
```

应返回：
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-19T..."
}
```

### 3. 检查 PM2 进程

```bash
pm2 status
```

应显示 `learnenglish-api` 正在运行。

### 4. 检查 Nginx 日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 5. 检查后端日志

```bash
pm2 logs learnenglish-api
```

## 数据库管理

### 初始化数据库

```bash
cd /opt/learnEnglish
npm run db:init
```

### 备份数据库

```bash
cd /opt/learnEnglish
npm run db:backup
```

备份文件保存在 `database/backups/` 目录。

### 恢复数据库

```bash
# 1. 停止后端服务
pm2 stop learnenglish-api

# 2. 恢复备份
cp backup/database_20260119_120000.db database/learning_progress.db

# 3. 重启后端服务
pm2 restart learnenglish-api
```

### 查看数据库内容

使用 SQLite 客户端工具：

```bash
# 安装 sqlite3 命令行工具
yum install -y sqlite

# 打开数据库
sqlite3 /opt/learnEnglish/database/learning_progress.db

# 查看表
.tables

# 查看进度数据
SELECT * FROM user_progress;

# 退出
.quit
```

## 常见问题

### Q1: better-sqlite3 编译失败

**错误**: `Error: Cannot find module 'better-sqlite3'`

**解决方案**:
```bash
# 安装编译工具
yum install -y make python3

# 重新安装依赖
cd /opt/learnEnglish
npm install

# 验证
node -e "const sqlite = require('better-sqlite3'); console.log('OK');"
```

### Q2: PM2 服务未开机启动

**解决方案**:
```bash
# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
# 按照提示执行输出的命令
```

### Q3: Nginx 502 Bad Gateway

**可能原因**:
1. 后端服务未启动
2. 端口 3001 被占用
3. 防火墙未开放端口

**解决方案**:
```bash
# 检查后端服务
pm2 status

# 检查端口
netstat -tlnp | grep 3001

# 重启后端
pm2 restart learnenglish-api

# 检查防火墙
firewall-cmd --list-all
```

### Q4: 数据库文件权限错误

**解决方案**:
```bash
# 修改数据库文件所有者
chown -R node:node /opt/learnEnglish/database/

# 或给予写权限
chmod 664 /opt/learnEnglish/database/learning_progress.db
```

### Q5: 部署后数据库数据丢失

**原因**: CI/CD 部署时会保留数据库文件，但需确保配置正确。

**检查**:
```bash
# 部署脚本会自动备份数据库
ls -lh /opt/learnEnglish/backup/
```

## 维护操作

### 日常维护

```bash
# 查看系统状态
pm2 status
pm2 logs
systemctl status nginx

# 定期备份数据库
cd /opt/learnEnglish
npm run db:backup

# 清理旧备份（保留最近 5 个）
ls -t database/backups/*.json | tail -n +6 | xargs rm -f
```

### 更新应用

**自动更新**（使用 GitHub Actions）:
```bash
git push origin master
```

**手动更新**:
```bash
cd /opt/learnEnglish
git pull origin master

# 重启后端
pm2 restart learnenglish-api

# 重新加载 Nginx
sudo systemctl reload nginx
```

### 监控性能

```bash
# PM2 监控
pm2 monit

# 系统资源
htop

# 磁盘使用
df -h

# 数据库大小
ls -lh database/learning_progress.db
```

## 安全建议

### 1. 配置 HTTPS

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
yum install -y certbot python2-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加: 0 0 * * * certbot renew --quiet
```

### 2. 配置防火墙

```bash
# 仅开放必要端口
firewall-cmd --zone=public --add-service=http --permanent
firewall-cmd --zone=public --add-service=https --permanent
firewall-cmd --zone=public --add-port=3001/tcp --permanent  # 后端 API（可选，建议通过内网访问）
firewall-cmd --reload
```

### 3. 保护 API 端点

在 Nginx 配置中添加 API 访问限制：

```nginx
# 仅允许本地访问 API
location /api/ {
    proxy_pass http://backend;
    access_log off;
    # 仅允许内网访问
    # allow 127.0.0.1;
    # allow 10.0.0.0/8;
    # deny all;
}
```

### 4. 定期更新依赖

```bash
cd /opt/learnEnglish
npm audit
npm audit fix
```

## 环境变量配置

在服务器上创建 `.env.local` 文件：

```bash
cd /opt/learnEnglish
cat > .env.local << EOF
# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_ENDPOINT=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat

# 豆包 API
DOUBAO_API_KEY=your_doubao_api_key
DOUBAO_MODEL=doubao-1.5-pro-32k

# Ollama (本地)
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
EOF
```

**重启后端服务使配置生效**:
```bash
pm2 restart learnenglish-api
```

## 性能优化

### 1. 启用 Nginx 缓存

```nginx
# 在 nginx.conf 中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache my_cache;
    proxy_cache_valid 200 10m;
    proxy_pass http://backend;
}
```

### 2. PM2 集群模式

如果服务器有多核 CPU，可以使用集群模式：

```bash
pm2 delete learnenglish-api
pm2 start server/index.js --name learnenglish-api -i max
pm2 save
```

### 3. 数据库优化

SQLite 已经是轻量级数据库，但可以进一步优化：

```bash
# 定期执行 VACUUM 优化数据库
sqlite3 /opt/learnEnglish/database/learning_progress.db "VACUUM;"
```

## 总结

- **首次部署**: 使用 `deploy-backend.sh` 自动化脚本
- **日常更新**: 使用 GitHub Actions 自动部署
- **简单部署**: 使用 `deploy-nginx.sh`（仅前端）
- **数据库**: 自动备份，定期检查
- **监控**: 使用 `pm2 monit` 和 `pm2 logs`

如有问题，请查看日志文件：
- Nginx: `/var/log/nginx/`
- PM2: `~/.pm2/logs/`
- 应用日志: `pm2 logs learnenglish-api`
