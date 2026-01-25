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
    addLog('info', '开始小米设备终极语音测试...')
    
    try {
      // 动态导入所有相关模块
      const { default: XiaomiSpeechPlayer } = await import('../utils/xiaomiSpeechPlayer.js')
      const { default: XiaomiAudioUnlocker } = await import('../utils/xiaomiAudioUnlocker.js')
      const { default: MobileSpeechSynthesis } = await import('../utils/mobileSpeechSynthesis.js')
      const { default: OfflineWordPlayer } = await import('../utils/offlineWordPlayer.js')
      const { default: SimpleSpeechSynthesizer } = await import('../utils/simpleSpeechSynthesizer.js')
      
      const xiaomiPlayer = new XiaomiSpeechPlayer()
      const audioUnlocker = new XiaomiAudioUnlocker()
      const mobileSpeech = new MobileSpeechSynthesis()
      const offlinePlayer = new OfflineWordPlayer()
      const simpleSynthesizer = new SimpleSpeechSynthesizer()
      
      // 显示设备检测信息
      const status = xiaomiPlayer.getStatus()
      const unlockerStatus = audioUnlocker.getStatus()
      const mobileStatus = mobileSpeech.getStatus()
      const offlineStatus = offlinePlayer.getStatus()
      const simpleStatus = simpleSynthesizer.getStatus()
      
      addLog('info', '小米播放器状态', status)
      addLog('info', '音频解锁器状态', unlockerStatus)
      addLog('info', '移动端语音合成状态', mobileStatus)
      addLog('info', '离线单词播放器状态', offlineStatus)
      addLog('info', '简易语音合成器状态', simpleStatus)
      
      if (!status.isXiaomi) {
        addLog('warn', '当前不是小米设备，但可以进行兼容性测试')
      }
      
      // 测试1: 离线单词播放器 (Google TTS)
      addLog('info', '测试1: 离线单词播放器 (Google TTS)')
      try {
        await offlinePlayer.playWord('hello')
        addLog('info', '离线播放器 Google TTS 成功')
      } catch (error) {
        addLog('error', '离线播放器 Google TTS 失败', error)
      }
      
      // 等待一下再测试下一个
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // 测试2: 简易语音合成器
      addLog('info', '测试2: 简易语音合成器 (Web Audio)')
      try {
        await simpleSynthesizer.speakWord('world')
        addLog('info', '简易语音合成器成功')
      } catch (error) {
        addLog('error', '简易语音合成器失败', error)
      }
      
      // 等待一下再测试下一个
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 测试3: 移动端语音合成
      addLog('info', '测试3: 移动端语音合成')
      try {
        await mobileSpeech.speak('test mobile')
        addLog('info', '移动端语音合成成功')
      } catch (error) {
        addLog('error', '移动端语音合成失败', error)
      }
      
      // 等待一下再测试下一个
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 测试4: 小米播放器初始化
      addLog('info', '测试4: 小米播放器初始化')
      await xiaomiPlayer.initialize()
      addLog('info', '小米播放器初始化完成')
      
      // 测试5: 音频解锁
      addLog('info', '测试5: 音频解锁')
      const unlockSuccess = await audioUnlocker.forceUnlock()
      addLog('info', unlockSuccess ? '音频解锁成功' : '音频解锁失败')
      
      // 测试6: 小米播放器完整流程
      addLog('info', '测试6: 小米播放器完整流程')
      try {
        await xiaomiPlayer.play('xiaomi')
        addLog('info', '小米播放器完整流程成功')
      } catch (error) {
        addLog('error', '小米播放器完整流程失败', error)
      }
      
      // 等待一下再测试下一个
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // 测试7: 测试多个不同单词
      addLog('info', '测试7: 测试多个不同单词')
      const testWords = ['apple', 'banana', 'computer', 'phone', 'english']
      
      for (const word of testWords) {
        addLog('info', `播放单词: ${word}`)
        try {
          await xiaomiPlayer.play(word)
          addLog('info', `单词 "${word}" 播放成功`)
        } catch (error) {
          addLog('error', `单词 "${word}" 播放失败`, error)
        }
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      // 测试8: 音频提示
      addLog('info', '测试8: 音频提示')
      const audioResult = xiaomiPlayer.createXiaomiAudioBeep('test')
      addLog('info', audioResult ? '音频提示创建成功' : '音频提示创建失败')
      
      // 测试9: 震动提示
      addLog('info', '测试9: 震动提示')
      const vibrationResult = xiaomiPlayer.createVibration()
      addLog('info', vibrationResult ? '震动提示成功' : '震动提示不支持')
      
      // 测试10: 预加载常用单词
      addLog('info', '测试10: 预加载常用单词')
      const commonWords = ['hello', 'world', 'thank', 'you', 'please']
      await offlinePlayer.preloadWords(commonWords)
      addLog('info', '常用单词预加载完成')
      
      addLog('info', '终极语音测试完成！')
      
    } catch (error) {
      addLog('error', '终极语音测试失败', error)
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