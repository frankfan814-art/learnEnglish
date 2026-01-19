#!/bin/bash
# LearnEnglish 项目完整部署脚本（包含后端 API 服务器）
# 使用方法: sudo bash deploy-backend.sh

set -e

echo "========================================="
echo "  LearnEnglish - 完整部署（前端+后端）"
echo "========================================="
echo ""

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 root 权限运行此脚本"
    echo "   使用: sudo bash deploy-backend.sh"
    exit 1
fi

DEPLOY_DIR="/opt/learnEnglish"
BACKUP_DIR="/opt/learnEnglish/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 步骤 1: 检查系统环境${NC}"
echo "Node.js 版本: $(node -v 2>/dev/null || echo '未安装')"
echo "npm 版本: $(npm -v 2>/dev/null || echo '未安装')"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}正在安装 Node.js 18...${NC}"
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
    echo -e "${GREEN}✅ Node.js 安装完成: $(node -v)${NC}"
else
    echo -e "${GREEN}✅ Node.js 已安装: $(node -v)${NC}"
fi

echo ""
echo -e "${YELLOW}📋 步骤 2: 安装 PM2 进程管理器${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 安装完成${NC}"
else
    echo -e "${GREEN}✅ PM2 已安装: $(pm2 -v)${NC}"
fi

echo ""
echo -e "${YELLOW}📋 步骤 3: 安装 Nginx${NC}"
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✅ Nginx 已安装: $(nginx -v 2>&1)${NC}"
else
    echo -e "${YELLOW}正在安装 Nginx...${NC}"
    yum install -y nginx
    echo -e "${GREEN}✅ Nginx 安装完成${NC}"
fi

echo ""
echo -e "${YELLOW}📦 步骤 4: 备份当前版本${NC}"
mkdir -p $BACKUP_DIR

if [ -f "$DEPLOY_DIR/server/index.js" ]; then
    echo -e "${YELLOW}备份后端代码...${NC}"
    cp -r $DEPLOY_DIR/server $BACKUP_DIR/server_$TIMESTAMP 2>/dev/null || true
fi

if [ -f "$DEPLOY_DIR/database/learning_progress.db" ]; then
    echo -e "${YELLOW}备份数据库...${NC}"
    cp $DEPLOY_DIR/database/learning_progress.db $BACKUP_DIR/database_$TIMESTAMP.db 2>/dev/null || true
fi

echo ""
echo -e "${YELLOW}🔨 步骤 5: 安装后端依赖${NC}"
cd $DEPLOY_DIR

if [ -f "package.json" ]; then
    echo -e "${YELLOW}安装 npm 依赖（包含 better-sqlite3）...${NC}"
    # 设置 npm 镜像加速
    npm config set registry https://registry.npmmirror.com

    # 安装依赖，better-sqlite3 会自动编译
    npm install --production=false
    echo -e "${GREEN}✅ 依赖安装完成${NC}"

    # 验证 better-sqlite3
    echo -e "${YELLOW}验证 better-sqlite3...${NC}"
    node -e "const sqlite = require('better-sqlite3'); console.log('✅ better-sqlite3 可以正常使用');"
fi

echo ""
echo -e "${YELLOW}🗄️  步骤 6: 初始化数据库${NC}"
if [ ! -f "$DEPLOY_DIR/database/learning_progress.db" ]; then
    echo -e "${YELLOW}初始化数据库...${NC}"
    cd $DEPLOY_DIR
    npm run db:init
    echo -e "${GREEN}✅ 数据库初始化完成${NC}"
else
    echo -e "${GREEN}✅ 数据库已存在${NC}"
fi

echo ""
echo -e "${YELLOW}🔥 步骤 7: 配置防火墙${NC}"
# 开放端口
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --zone=public --add-service=http --permanent
    firewall-cmd --zone=public --add-service=https --permanent
    firewall-cmd --zone=public --add-port=3001/tcp --permanent
    firewall-cmd --reload
    echo -e "${GREEN}✅ 防火墙已开放 HTTP(80)、HTTPS(443)、API(3001) 端口${NC}"
fi

echo ""
echo -e "${YELLOW}⚙️  步骤 8: 配置 Nginx${NC}"
# 复制前端配置
cp $DEPLOY_DIR/nginx.conf /etc/nginx/conf.d/learn-english.conf

# 添加后端 API 代理配置
cat > /etc/nginx/conf.d/learn-english-api.conf << 'EOF'
# API 服务器反向代理
upstream backend {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name _;

    # API 请求转发到后端
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 数据库备份文件访问（可选，需要密码保护）
    location /database-backups/ {
        alias /opt/learnEnglish/database/backups/;
        autoindex off;
        # 建议添加密码保护
        # auth_basic "Restricted";
        # auth_basic_user_file /etc/nginx/.htpasswd;
    }
}
EOF

# 测试配置
if nginx -t; then
    echo -e "${GREEN}✅ Nginx 配置测试通过${NC}"
else
    echo -e "❌ Nginx 配置测试失败"
    exit 1
fi

echo ""
echo -e "${YELLOW}🚀 步骤 9: 启动后端服务${NC}"
cd $DEPLOY_DIR

# 停止旧的 PM2 进程
if pm2 list | grep -q "learnenglish-api"; then
    echo -e "${YELLOW}停止旧的后端服务...${NC}"
    pm2 stop learnenglish-api
    pm2 delete learnenglish-api
fi

# 启动新的后端服务
echo -e "${YELLOW}启动后端 API 服务器...${NC}"
pm2 start server/index.js --name learnenglish-api

# 保存 PM2 配置
pm2 save
pm2 startup | grep -v "sudo" || true

echo -e "${GREEN}✅ 后端服务已启动${NC}"

echo ""
echo -e "${YELLOW}🌐 步骤 10: 启动 Nginx${NC}"
systemctl enable nginx
systemctl restart nginx

echo -e "${GREEN}✅ Nginx 已启动${NC}"

# 等待服务启动
sleep 3

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  ✅ 部署完成！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "📍 前端访问地址: ${YELLOW}http://124.222.203.221${NC}"
echo -e "📍 API 健康检查: ${YELLOW}http://124.222.203.221/api/health${NC}"
echo ""
echo -e "📝 管理命令:"
echo -e "   查看 API 状态:   ${YELLOW}pm2 status${NC}"
echo -e "   查看 API 日志:   ${YELLOW}pm2 logs learnenglish-api${NC}"
echo -e "   重启 API 服务:   ${YELLOW}pm2 restart learnenglish-api${NC}"
echo -e "   重启 Nginx:      ${YELLOW}sudo systemctl restart nginx${NC}"
echo -e "   查看 Nginx 日志: ${YELLOW}sudo tail -f /var/log/nginx/access.log${NC}"
echo -e "   备份数据库:     ${YELLOW}cd /opt/learnEnglish && npm run db:backup${NC}"
echo ""
echo -e "📊 数据库位置: ${YELLOW}/opt/learnEnglish/database/learning_progress.db${NC}"
echo -e "📁 备份位置:   ${YELLOW}/opt/learnEnglish/database/backups/${NC}"
echo ""
