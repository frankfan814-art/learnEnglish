# CI/CD 部署文档

本文档详细说明如何配置和使用 GitHub Actions 自动部署到服务器。

## 目录

- [前置要求](#前置要求)
- [服务器配置](#服务器配置)
- [GitHub 配置](#github-配置)
- [部署流程](#部署流程)
- [故障排查](#故障排查)
- [回滚操作](#回滚操作)

## 前置要求

### 本地环境

- Git
- Node.js 18+
- GitHub 账号

### 服务器环境

- CentOS / Rocky Linux / OpenCloudOS
- Nginx
- SSH 访问权限
- sudo 权限

## 服务器配置

### 1. 安装 Nginx

```bash
# CentOS/Rocky Linux
sudo yum install -y nginx

# 启动并设置开机自启
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. 创建部署目录

```bash
# 创建应用目录
sudo mkdir -p /opt/learnEnglish
sudo mkdir -p /opt/learnEnglish/backup

# 设置权限
sudo chown -R $USER:$USER /opt/learnEnglish
```

### 3. 配置防火墙

```bash
# 开放 HTTP 端口
sudo firewall-cmd --zone=public --add-service=http --permanent
sudo firewall-cmd --reload

# 或直接开放 80 端口
sudo firewall-cmd --zone=public --add-port=80/tcp --permanent
sudo firewall-cmd --reload
```

### 4. 配置 sudo 权限

创建专用部署用户（推荐）：

```bash
# 创建部署用户
sudo useradd -m -s /bin/bash deploy

# 添加到 sudo 组
sudo usermod -aG wheel deploy

# 配置 sudo 免密
sudo visudo
```

在 sudoers 文件中添加：

```
deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/cp, /bin/rm, /bin/mkdir, /bin/tar, /usr/bin/systemctl
```

## GitHub 配置

### 1. 生成 SSH 密钥

在本地机器上生成密钥对：

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key
```

### 2. 添加公钥到服务器

```bash
# 复制公钥到服务器
ssh-copy-id -i ~/.ssh/github_deploy_key.pub deploy@your-server-ip

# 或手动添加
cat ~/.ssh/github_deploy_key.pub | ssh deploy@your-server-ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 3. 配置 GitHub Secrets

进入 GitHub 仓库：Settings → Secrets and variables → Actions → New repository secret

添加以下 Secrets：

| Secret 名称 | 值 | 说明 |
|------------|---|------|
| `SERVER_HOST` | `124.222.203.221` | 服务器 IP 地址 |
| `SERVER_USER` | `deploy` | 服务器用户名 |
| `SSH_PRIVATE_KEY` | *(私钥内容)* | `~/.ssh/github_deploy_key` 的内容 |
| `SSH_PORT` | `22` | SSH 端口（可选，默认 22） |

**获取私钥内容**：

```bash
cat ~/.ssh/github_deploy_key
```

复制完整输出（包括 `-----BEGIN` 和 `-----END` 行）粘贴到 Secret 值中。

### 4. 测试 SSH 连接

```bash
ssh -i ~/.ssh/github_deploy_key deploy@your-server-ip
```

如果能成功登录，说明配置正确。

## 部署流程

### 自动部署

推送代码到 `master` 分支将自动触发部署：

```bash
git add .
git commit -m "feat: new feature"
git push origin master
```

### 手动部署

1. 进入 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择 "Deploy to Server" workflow
4. 点击 "Run workflow" 按钮
5. 选择分支并点击 "Run workflow"

### 部署步骤说明

workflow 执行以下步骤：

1. **Checkout code** - 检出代码
2. **Setup Node.js** - 安装 Node.js 18
3. **Install dependencies** - 安装依赖 (`npm ci`)
4. **Build project** - 构建项目 (`npm run build`)
5. **Create deployment package** - 打包为 `deploy.tar.gz`
6. **Copy files to server** - 通过 SCP 上传到服务器 `/tmp/`
7. **Deploy on server** - 在服务器上执行部署脚本

部署脚本会：
- 备份当前版本到 `/opt/learnEnglish/backup/`
- 解压新版本
- 更新 Nginx 配置
- 测试 Nginx 配置
- 重启 Nginx
- 清理旧备份（保留最近 5 个）

## 故障排查

### 查看部署日志

在 GitHub Actions 页面查看详细日志：

1. 进入 Actions 标签
2. 点击失败的 workflow run
3. 展开失败的步骤查看错误信息

### 常见问题

#### 1. SSH 连接失败

```
Error: Connect to server failed
```

**解决方案**：
- 检查 `SERVER_HOST` 和 `SSH_PORT` 是否正确
- 确认服务器防火墙开放 SSH 端口
- 验证 SSH 密钥是否正确配置

#### 2. Permission denied (sudo)

```
sudo: no tty present and no askpass program specified
```

**解决方案**：
- 确认 sudoers 配置正确
- 确保用户在 wheel 或 sudo 组中

#### 3. Nginx 配置测试失败

```
nginx: [emerg] invalid parameter
```

**解决方案**：
- 检查 `nginx.conf` 文件语法
- 在服务器上手动测试：`sudo nginx -t`

#### 4. 端口被占用

```
nginx: [emerg] bind() to 0.0.0.0:80 failed
```

**解决方案**：
```bash
# 查看占用端口的进程
sudo netstat -tulpn | grep :80

# 停止占用端口的服务
sudo systemctl stop <service-name>
```

## 回滚操作

### 自动回滚

如果部署失败，workflow 会自动停止，旧版本保持不变。

### 手动回滚

```bash
# SSH 登录服务器
ssh deploy@your-server-ip

# 查看备份
ls -lh /opt/learnEnglish/backup/

# 恢复备份
sudo rm -rf /opt/learnEnglish/dist
sudo cp -r /opt/learnEnglish/backup/dist_<timestamp> /opt/learnEnglish/dist

# 重启 Nginx
sudo systemctl reload nginx
```

## 服务器管理命令

### 查看 Nginx 状态

```bash
sudo systemctl status nginx
```

### 查看 Nginx 日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 重启 Nginx

```bash
# 优雅重启（推荐）
sudo systemctl reload nginx

# 完全重启
sudo systemctl restart nginx
```

### 测试 Nginx 配置

```bash
sudo nginx -t
```

## 安全建议

1. **使用专用部署用户** - 不要使用 root 用户进行部署
2. **限制 SSH 访问** - 仅允许特定 IP 访问 SSH
3. **定期更新** - 保持系统和 Nginx 更新
4. **备份重要数据** - 定期备份用户数据和配置
5. **监控日志** - 定期检查访问和错误日志

## 性能优化

### 启用 gzip 压缩

已在 `nginx.conf` 中配置：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### 静态资源缓存

已在 `nginx.conf` 中配置：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 监控和告警

建议配置以下监控：

1. **服务器可用性** - 使用 Uptime Robot 或类似服务
2. **磁盘空间** - 设置告警阈值
3. **Nginx 错误** - 监控错误日志
4. **部署状态** - GitHub 通知

## 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Nginx 文档](https://nginx.org/en/docs/)
- [项目 README](README.md)
