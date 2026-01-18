#!/bin/bash
# LearnEnglish 项目 OpenResty 部署脚本
# 使用方法: sudo bash deploy-openresty.sh

set -e

echo "========================================="
echo "  LearnEnglish - OpenResty 部署脚本"
echo "========================================="
echo ""

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 root 权限运行此脚本"
    echo "   使用: sudo bash deploy-openresty.sh"
    exit 1
fi

echo "📋 步骤 1: 配置 OpenResty..."
# 复制配置文件
cp /opt/learnEnglish/openresty-learn-english.conf /usr/local/openresty/nginx/conf/conf.d/learn-english.conf

# 测试配置
if /usr/local/openresty/nginx/sbin/nginx -t; then
    echo "✅ OpenResty 配置测试通过"
else
    echo "❌ OpenResty 配置测试失败"
    exit 1
fi

echo ""
echo "🔥 步骤 2: 配置防火墙..."
# 开放 8080 端口
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --zone=public --add-port=8080/tcp --permanent 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo "✅ 防火墙已开放 8080 端口"
fi

echo ""
echo "🚀 步骤 3: 重启 OpenResty..."
/usr/local/openresty/nginx/sbin/nginx -s reload

sleep 2
echo ""
echo "========================================="
echo "  ✅ 部署完成！"
echo "========================================="
echo ""
echo "📍 访问地址: http://124.222.203.221:8080"
echo "📍 或使用: http://$(hostname -I | awk '{print $1}'):8080"
echo ""
echo "📝 管理命令:"
echo "   重启服务: sudo /usr/local/openresty/nginx/sbin/nginx -s reload"
echo "   测试配置: sudo /usr/local/openresty/nginx/sbin/nginx -t"
echo "   查看日志: sudo tail -f /usr/local/openresty/nginx/logs/access.log"
echo ""
