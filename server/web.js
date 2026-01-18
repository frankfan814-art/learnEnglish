import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8080

// 静态文件目录
const distPath = path.resolve(__dirname, '../dist')

// API 反向代理
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true
})

app.use('/api', apiProxy)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', frontend: 'running' })
})

// 静态文件服务
app.use(express.static(distPath, {
  maxAge: '1y',
  immutable: true
}))

// SPA 路由支持
app.use('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`)
  console.log(`  LearnEnglish Frontend Server`)
  console.log(`=========================================`)
  console.log(`  运行在: http://0.0.0.0:${PORT}`)
  console.log(`  静态文件: ${distPath}`)
  console.log(`  后端代理: http://localhost:3001/api`)
  console.log(`=========================================`)
})
