import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import debugManager from './utils/debugManager'

// 初始化调试管理器
debugManager.init()

// 小米浏览器：在页面加载时初始化音频修复
const initXiaomiFix = async () => {
  const ua = navigator.userAgent || ''
  const isXiaomi = /xiaomi|redmi|mi\s+/i.test(ua) ||
                   ua.includes('MIUI') ||
                   ua.includes('MiuiBrowser') ||
                   ua.includes('XiaoMi')

  if (isXiaomi) {
    console.log('[App] 检测到小米设备，初始化音频修复')
    try {
      const { default: xiaomiBrowserFix } = await import('./utils/xiaomiBrowserFix.js')
      await xiaomiBrowserFix.init()
    } catch (error) {
      console.warn('[App] 小米音频修复初始化失败:', error)
    }
  }
}

// 启动应用
initXiaomiFix()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
