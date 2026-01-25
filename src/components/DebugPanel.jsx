/**
 * 调试面板组件
 */
import React, { useState, useEffect, useRef } from 'react'
import '../styles/DebugPanel.css'

const DebugPanel = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([])
  const [isExpanded, setIsExpanded] = useState(false)
  const logContainerRef = useRef(null)
  const maxLogs = 100

  // 日志函数
  const addLog = (type, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString()
    const newLog = {
      id: Date.now(),
      timestamp,
      type,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    }
    
    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, maxLogs)
      return updated
    })
  }

  // 拦截 console 方法
  useEffect(() => {
    if (!isOpen) return

    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    }

    // 重写 console 方法来捕获日志
    console.log = (...args) => {
      originalConsole.log(...args)
      addLog('log', args.join(' '), args.length > 1 ? args : args[0])
    }

    console.error = (...args) => {
      originalConsole.error(...args)
      addLog('error', args.join(' '), args.length > 1 ? args : args[0])
    }

    console.warn = (...args) => {
      originalConsole.warn(...args)
      addLog('warn', args.join(' '), args.length > 1 ? args : args[0])
    }

    console.info = (...args) => {
      originalConsole.info(...args)
      addLog('info', args.join(' '), args.length > 1 ? args : args[0])
    }

    // 监听错误事件
    const handleError = (event) => {
      addLog('error', '全局错误', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    }

    const handleUnhandledRejection = (event) => {
      addLog('error', '未处理的Promise拒绝', {
        reason: event.reason
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // 添加初始化日志
    addLog('info', '调试面板已启动')
    
    return () => {
      // 恢复原始 console 方法
      console.log = originalConsole.log
      console.error = originalConsole.error
      console.warn = originalConsole.warn
      console.info = originalConsole.info
      
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [isOpen, addLog])

  // 自动滚动到底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  // 清空日志
  const clearLogs = () => {
    setLogs([])
  }

  // 测试语音播放
  const testSpeech = async () => {
    addLog('info', '开始测试语音播放...')
    
    try {
      // 动态导入小米专用播放器
      const { default: XiaomiSpeechPlayer } = await import('../utils/xiaomiSpeechPlayer.js')
      const xiaomiPlayer = new XiaomiSpeechPlayer()
      
      // 显示设备信息
      const deviceInfo = xiaomiPlayer.getStatus()
      addLog('info', '小米设备信息', deviceInfo)
      
      // 测试小米专用播放器
      await xiaomiPlayer.play('Hello, this is a test from Xiaomi player')
      addLog('info', '小米专用播放器测试完成')
      
      // 同时测试基础 Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        
        const utterance = new SpeechSynthesisUtterance('Hello, this is a basic test')
        utterance.lang = 'en-US'
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 1
        
        utterance.onstart = () => addLog('info', '基础语音播放开始')
        utterance.onend = () => addLog('info', '基础语音播放结束')
        utterance.onerror = (e) => addLog('error', '基础语音播放失败', e)
        
        window.speechSynthesis.speak(utterance)
      } else {
        addLog('error', 'Web Speech API 不可用')
      }
      
    } catch (error) {
      addLog('error', '小米播放器测试失败', error)
    }
  }

  // 获取系统信息
  const getSystemInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight
      },
      window: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
      webSpeech: 'speechSynthesis' in window
    }
    addLog('info', '系统信息', info)
  }

  if (!isOpen) return null

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h3>🔧 调试面板</h3>
        <div className="debug-controls">
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? '收起' : '展开'} {isExpanded ? '▲' : '▼'}
          </button>
          <button onClick={testSpeech}>🔊 测试语音</button>
          <button onClick={getSystemInfo}>📱 系统信息</button>
          <button onClick={clearLogs}>🗑️ 清空</button>
          <button onClick={onClose}>❌ 关闭</button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="debug-content">
          <div className="debug-stats">
            <span>日志数量: {logs.length}</span>
            <span>错误: {logs.filter(l => l.type === 'error').length}</span>
            <span>警告: {logs.filter(l => l.type === 'warn').length}</span>
          </div>
          
          <div className="debug-logs" ref={logContainerRef}>
            {logs.map(log => (
              <div key={log.id} className={`log-entry log-${log.type}`}>
                <span className="log-time">{log.timestamp}</span>
                <span className="log-type">[{log.type.toUpperCase()}]</span>
                <span className="log-message">{log.message}</span>
                {log.data && (
                  <details className="log-data">
                    <summary>详情</summary>
                    <pre>{log.data}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DebugPanel