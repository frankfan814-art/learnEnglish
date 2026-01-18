#!/bin/bash
# LearnEnglish 项目 Nginx 部署脚本 - OpenCloudOS 版本
# 使用方法: sudo bash deploy-nginx-opencloudos.sh

set -e

echo "========================================="
echo "  LearnEnglish - Nginx 部署脚本"
echo "  OpenCloudOS 版本"
echo "========================================="
echo ""

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 root 权限运行此脚本"
    echo "   使用: sudo bash deploy-nginx-opencloudos.sh"
    exit 1
fi

echo "📦 步骤 1: 安装 Nginx..."
if command -v nginx &> /dev/null; then
    echo "✅ Nginx 已安装: $(nginx -v 2>&1)"
else
    echo "正在安装 Nginx (nginx-core + modules)..."
    yum install -y nginx-core nginx-all-modules
    echo "✅ Nginx 安装完成"
fi

echo ""
echo "📋 步骤 2: 配置 Nginx..."
# 备份原配置
if [ -f /etc/nginx/nginx.conf ]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# 复制站点配置
cp /opt/learnEnglish/nginx.conf /etc/nginx/conf.d/learn-english.conf

# 测试配置
if nginx -t; then
    echo "✅ Nginx 配置测试通过"
else
    echo "❌ Nginx 配置测试失败"
    exit 1
fi

echo ""
echo "🔥 步骤 3: 配置防火墙..."
# 开放 80 端口
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --zone=public --add-service=http --permanent 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo "✅ 防火墙已开放 HTTP (80) 端口"
fi

echo ""
echo "🚀 步骤 4: 启动 Nginx..."
systemctl enable nginx
systemctl restart nginx

sleep 2
systemctl status nginx --no-pager

echo ""
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo ""
echo "📍 访问地址: http://124.222.203.221"
echo "📍 或使用: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "📝 管理命令:"
echo "   重启 Nginx: sudo systemctl restart nginx"
echo "   查看状态:   sudo systemctl status nginx"
echo "   查看日志:   sudo tail -f /var/log/nginx/access.log"
echo "   查看错误:   sudo tail -f /var/log/nginx/error.log"
echo ""
