/**
 * 生产环境调试提示组件
 */
import React, { useState, useEffect } from 'react'
import '../styles/DebugHint.css'

const DebugHint = () => {
  const [showHint, setShowHint] = useState(false)
  const [hintType, setHintType] = useState('')

  useEffect(() => {
    // 检查是否在生产环境
    const isProduction = !import.meta.env.DEV
    
    // 检查是否已经有 vConsole
    const hasVConsole = document.querySelector('.vc-switch') || 
                       document.querySelector('.vc-panel')
    
    if (isProduction && !hasVConsole) {
      setShowHint(true)
      setHintType('production')
    } else if (isProduction && hasVConsole) {
      setShowHint(false) // 已有 vConsole，不显示提示
    }
  }, [])

  if (!showHint) return null

  return (
    <div className="debug-hint">
      <div className="debug-hint-content">
        {hintType === 'production' && (
          <>
            <h4>🎛️ 开启调试模式</h4>
            <p>生产环境已预加载 vConsole，点击下方按钮显示：</p>
            <div className="debug-hint-actions">
              <button 
                onClick={() => window.showVConsole?.()}
                className="debug-hint-btn primary"
              >
                🎛️ 显示 vConsole
              </button>
              <button 
                onClick={() => window.location.href += (window.location.search ? '&' : '?') + 'debug=true'}
                className="debug-hint-btn"
              >
                🔄 刷新并启用
              </button>
            </div>
            <div className="debug-hint-tips">
              <h5>💡 其他方式：</h5>
              <ul>
                <li><strong>URL参数：</strong>在网址后加 <code>?debug=true</code></li>
                <li><strong>手势激活：</strong>连续点击页面标题 5 次</li>
                <li><strong>快捷键：</strong>点击设置页面的 🎛️ vConsole 按钮</li>
              </ul>
            </div>
          </>
        )}
      </div>
      <button 
        className="debug-hint-close" 
        onClick={() => setShowHint(false)}
      >
        ✕
      </button>
    </div>
  )
}

export default DebugHint