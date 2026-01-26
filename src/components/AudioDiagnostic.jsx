import { useState } from 'react'
import '../styles/AudioDiagnostic.css'

const AudioDiagnostic = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([])
  const [isRunning, setIsRunning] = useState(false)

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { message, type, timestamp }])
    console.log(`[${type}] ${message}`)
  }

  const detectDevice = () => {
    const ua = navigator.userAgent
    const isXiaomi = /xiaomi|redmi|mi\s+/i.test(ua) ||
                     ua.includes('MIUI') ||
                     ua.includes('MiuiBrowser')
    return { isXiaomi, ua }
  }

  // 测试 Web Audio
  const testWebAudio = async () => {
    addLog('🔍 测试 Web Audio API...', 'info')
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) {
        addLog('❌ AudioContext 不存在', 'error')
        return false
      }

      const ctx = new AudioContext()
      addLog(`AudioContext 状态: ${ctx.state}`, 'info')

      if (ctx.state === 'suspended') {
        await ctx.resume()
        addLog(`AudioContext 已恢复: ${ctx.state}`, 'success')
      }

      // 播放测试音
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)

      addLog('✅ 播放 440Hz 测试音（应该听到"滴"声）', 'success')

      setTimeout(() => {
        if (ctx.state !== 'closed') ctx.close()
      }, 400)
      return true
    } catch (error) {
      addLog(`❌ Web Audio 失败: ${error.message}`, 'error')
      return false
    }
  }

  // 测试 Web Speech
  const testWebSpeech = async () => {
    addLog('🔍 测试 Web Speech API...', 'info')
    if (!('speechSynthesis' in window)) {
      addLog('❌ speechSynthesis 不存在', 'error')
      return false
    }

    const voices = window.speechSynthesis.getVoices()
    addLog(`可用语音: ${voices.length} 个`, 'info')

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance('test')
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      utterance.volume = 1.0

      utterance.onstart = () => {
        addLog('✅ onstart 触发（注意：可能没声音）', 'success')
      }
      utterance.onend = () => {
        addLog('✅ onend 触发', 'success')
        resolve(true)
      }
      utterance.onerror = (e) => {
        addLog(`❌ onerror: ${e.error}`, 'error')
        resolve(false)
      }

      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)

      // 超时
      setTimeout(() => resolve(false), 3000)
    })
  }

  // 备选音频方案
  const testFallbackAudio = async (word = 'hello') => {
    addLog(`🔄 测试备选音频: "${word}"`, 'info')
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioContext()
      if (ctx.state === 'suspended') await ctx.resume()

      const letters = word.split('')
      letters.forEach((letter, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(
          300 + (letter.charCodeAt(0) % 26) * 20 + i * 50,
          ctx.currentTime + i * 0.1
        )
        osc.type = 'sine'
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1)
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.1 + 0.02)
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.1 + 0.08)
        osc.start(ctx.currentTime + i * 0.1)
        osc.stop(ctx.currentTime + i * 0.1 + 0.08)
      })

      addLog(`✅ 备选音频播放完成 (${letters.length} 个音调)`, 'success')

      setTimeout(() => {
        if (ctx.state !== 'closed') ctx.close()
      }, (letters.length * 100) + 300)
      return true
    } catch (error) {
      addLog(`❌ 备选方案失败: ${error.message}`, 'error')
      return false
    }
  }

  // 测试振动
  const testVibration = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
      addLog('✅ 振动模式: [200, 100, 200]', 'success')
      return true
    } else {
      addLog('❌ 振动 API 不存在', 'error')
      return false
    }
  }

  // 运行完整诊断
  const runFullDiagnostic = async () => {
    setIsRunning(true)
    setLogs([])

    const { isXiaomi } = detectDevice()
    addLog(`设备检测: ${isXiaomi ? '🔴 小米设备' : '🟢 其他设备'}`, 'info')
    addLog(navigator.userAgent.substring(0, 80), 'info')
    addLog('', 'info')

    // 测试 Web Audio
    await testWebAudio()
    await new Promise(r => setTimeout(r, 500))
    addLog('', 'info')

    // 测试 Web Speech
    await testWebSpeech()
    await new Promise(r => setTimeout(r, 1000))
    addLog('', 'info')

    // 测试备选方案
    await testFallbackAudio('test')
    await new Promise(r => setTimeout(r, 800))
    addLog('', 'info')

    // 测试振动
    testVibration()
    addLog('', 'info')

    addLog('========== 诊断完成 ==========', 'success')
    addLog('请检查哪些测试有声音输出', 'info')

    setIsRunning(false)
  }

  if (!isOpen) return null

  return (
    <div className="audio-diagnostic-overlay" onClick={onClose}>
      <div className="audio-diagnostic-modal" onClick={e => e.stopPropagation()}>
        <div className="audio-diagnostic-header">
          <h2>🔊 音频诊断工具</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="audio-diagnostic-body">
          <div className="diagnostic-buttons">
            <button
              className="diag-btn primary"
              onClick={runFullDiagnostic}
              disabled={isRunning}
            >
              {isRunning ? '⏳ 诊断中...' : '🔍 运行完整诊断'}
            </button>
            <button className="diag-btn" onClick={testWebAudio}>
              🔊 测试 Web Audio
            </button>
            <button className="diag-btn" onClick={testWebSpeech}>
              🗣️ 测试语音合成
            </button>
            <button className="diag-btn" onClick={() => testFallbackAudio('hello')}>
              🔄 测试备选方案
            </button>
            <button className="diag-btn" onClick={testVibration}>
              📳 测试振动
            </button>
          </div>

          <div className="diagnostic-logs">
            {logs.length === 0 ? (
              <div className="log-placeholder">点击上方按钮开始测试...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-entry log-${log.type}`}>
                  <span className="log-time">[{log.timestamp}]</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>

          <div className="diagnostic-help">
            <p>💡 <strong>预期结果：</strong></p>
            <ul>
              <li>Web Audio: 应该听到"滴"声 ✅</li>
              <li>语音合成: 可能显示成功但没声音 ❌</li>
              <li>备选方案: 应该听到音调序列 ✅</li>
              <li>振动: 手机应该震动 ✅</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioDiagnostic
