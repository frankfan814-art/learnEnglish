# 手动部署 Nginx 步骤

## 1. 安装 Nginx
```bash
sudo yum install -y nginx
```

## 2. 配置文件已准备好
配置文件位置: /opt/learnEnglish/nginx.conf

## 3. 复制配置文件
```bash
sudo cp /opt/learnEnglish/nginx.conf /etc/nginx/conf.d/learn-english.conf
```

## 4. 测试配置
```bash
sudo nginx -t
```

## 5. 启动服务
```bash
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

## 6. 配置防火墙
```bash
sudo firewall-cmd --zone=public --add-service=http --permanent
sudo firewall-cmd --reload
```

## 7. 访问测试
```bash
curl -I http://localhost/
```

完成后访问: http://124.222.203.221
