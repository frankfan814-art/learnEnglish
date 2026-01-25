import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import debugManager from './utils/debugManager'

// 初始化调试管理器
debugManager.init()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
