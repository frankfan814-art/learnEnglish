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
    addLog('info', '开始测试强制语音播放...')
    
    try {
      // 动态导入强制播放器
      const { default: ForceSpeechPlayer } = await import('../utils/forceSpeechPlayer.js')
      const forcePlayer = new ForceSpeechPlayer()
      
      // 显示设备信息
      const deviceInfo = forcePlayer.getStatus()
      addLog('info', '强制播放器设备信息', deviceInfo)
      
      // 测试强制播放器
      await forcePlayer.forcePlay('HELLO')
      addLog('info', '强制播放器测试完成')
      
      // 重置尝试次数
      forcePlayer.resetAttempts()
      
      // 测试不同的播放方法
      await forcePlayer.tryWebAudio('test')
      addLog('info', 'Web Audio 测试完成')
      
      await forcePlayer.tryAudioElement('test')
      addLog('info', 'Audio Element 测试完成')
      
    } catch (error) {
      addLog('error', '强制播放器测试失败', error)
    }
  }

  // 小米设备专项测试
  const testXiaomiSpeech = async () => {
    addLog('info', '开始小米设备专项语音测试...')
    
    try {
      // 动态导入小米播放器
      const { default: XiaomiSpeechPlayer } = await import('../utils/xiaomiSpeechPlayer.js')
      const xiaomiPlayer = new XiaomiSpeechPlayer()
      
      // 显示小米设备检测信息
      const status = xiaomiPlayer.getStatus()
      addLog('info', '小米播放器状态', status)
      
      if (!status.isXiaomi) {
        addLog('warn', '当前不是小米设备，但可以进行兼容性测试')
      }
      
      // 测试1: Web Speech API
      addLog('info', '测试1: Web Speech API')
      try {
        await xiaomiPlayer.tryWebSpeech('hello')
        addLog('info', 'Web Speech API 测试成功')
      } catch (error) {
        addLog('error', 'Web Speech API 测试失败', error)
      }
      
      // 等待一下再测试下一个
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 测试2: 音频提示
      addLog('info', '测试2: 音频提示')
      const audioResult = xiaomiPlayer.createAudioBeep('test')
      addLog('info', audioResult ? '音频提示创建成功' : '音频提示创建失败')
      
      // 测试3: 震动提示
      addLog('info', '测试3: 震动提示')
      const vibrationResult = xiaomiPlayer.createVibration()
      addLog('info', vibrationResult ? '震动提示成功' : '震动提示不支持')
      
      // 测试4: 强制解锁音频
      addLog('info', '测试4: 强制解锁音频')
      xiaomiPlayer.forceUnlockAudio()
      
      // 测试5: 完整播放流程
      addLog('info', '测试5: 完整播放流程（使用备选方案）')
      xiaomiPlayer.enableFallbackMode()
      await xiaomiPlayer.play('xiaomi')
      addLog('info', '小米播放器完整测试完成')
      
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
          <button onClick={testXiaomiSpeech}>📱 小米测试</button>
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