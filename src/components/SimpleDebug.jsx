/**
 * 简单的调试信息显示组件（vConsole 备用方案）
 */
import React, { useState, useEffect } from 'react'
import '../styles/SimpleDebug.css'

const SimpleDebug = ({ visible }) => {
  const [logs, setLogs] = useState([])
  const [isExpanded, setIsExpanded] = useState(false)
  const maxLogs = 50

  // 拦截 console 方法
  useEffect(() => {
    if (!visible) return

    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn
    }

    const addLog = (type, ...args) => {
      const timestamp = new Date().toLocaleTimeString()
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')
      
      setLogs(prev => [message, ...prev].slice(0, maxLogs))
    }

    console.log = (...args) => {
      originalConsole.log(...args)
      addLog('log', ...args)
    }

    console.error = (...args) => {
      originalConsole.error(...args)
      addLog('error', ...args)
    }

    console.warn = (...args) => {
      originalConsole.warn(...args)
      addLog('warn', ...args)
    }

    return () => {
      console.log = originalConsole.log
      console.error = originalConsole.error
      console.warn = originalConsole.warn
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="simple-debug">
      <div className="simple-debug-header">
        <span>📱 调试信息 ({logs.length})</span>
        <button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? '收起 ▲' : '展开 ▼'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="simple-debug-content">
          {logs.map((log, index) => (
            <div key={index} className="simple-debug-log">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SimpleDebug