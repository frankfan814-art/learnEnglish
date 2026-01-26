/**
 * 小米浏览器音频诊断和备选方案
 * 当 Web Speech API 调用成功但不发声时使用
 */

class XiaomiAudioTest {
  constructor() {
    this.isXiaomi = this.detectXiaomi()
    this.testResults = []
  }

  detectXiaomi() {
    const ua = navigator.userAgent || ''
    return /xiaomi|redmi|mi\s+/i.test(ua) ||
           ua.includes('MIUI') ||
           ua.includes('MiuiBrowser')
  }

  /**
   * 运行完整诊断
   */
  async runFullDiagnostic() {
    console.log('=== 小米音频诊断开始 ===')
    this.testResults = []

    // 测试1: Web Audio API 基础
    await this.testWebAudioBasic()

    // 测试2: Web Audio 振荡器
    await this.testWebAudioOscillator()

    // 测试3: HTML5 Audio (Data URL)
    await this.testHTML5AudioDataURL()

    // 测试4: HTML5 Audio (静音)
    await this.testHTML5AudioSilent()

    // 测试5: Web Speech API
    await this.testWebSpeechAPI()

    // 测试6: 震动
    this.testVibration()

    console.log('=== 诊断结果 ===')
    this.testResults.forEach(r => {
      console.log(`${r.name}: ${r.success ? '✅' : '❌'} ${r.message}`)
    })

    return this.testResults
  }

  /**
   * 测试1: Web Audio API 基础功能
   */
  async testWebAudioBasic() {
    const testName = 'Web Audio API 基础'
    console.log(`\n🔍 测试: ${testName}`)

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext

      if (!AudioContext) {
        this.testResults.push({ name: testName, success: false, message: 'AudioContext 不存在' })
        return
      }

      const ctx = new AudioContext()
      console.log(`  AudioContext 状态: ${ctx.state}`)

      if (ctx.state === 'suspended') {
        await ctx.resume()
        console.log(`  AudioContext 已恢复: ${ctx.state}`)
      }

      this.testResults.push({ name: testName, success: true, message: `AudioContext 可用, 状态: ${ctx.state}` })

      if (ctx.state !== 'closed') {
        await ctx.close()
      }
    } catch (error) {
      this.testResults.push({ name: testName, success: false, message: error.message })
    }
  }

  /**
   * 测试2: Web Audio 振荡器（发声测试）
   */
  async testWebAudioOscillator() {
    const testName = 'Web Audio 振荡器'
    console.log(`\n🔍 测试: ${testName}`)

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioContext()

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      // 创建一个明显的测试音
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.setValueAtTime(440, ctx.currentTime) // A4 音符
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)

      console.log('  播放 440Hz 测试音 (0.5秒)')

      this.testResults.push({ name: testName, success: true, message: '已播放 440Hz 测试音' })

      setTimeout(() => {
        if (ctx.state !== 'closed') {
          ctx.close()
        }
      }, 600)
    } catch (error) {
      this.testResults.push({ name: testName, success: false, message: error.message })
    }
  }

  /**
   * 测试3: HTML5 Audio (Data URL)
   */
  async testHTML5AudioDataURL() {
    const testName = 'HTML5 Audio (Data URL)'
    console.log(`\n🔍 测试: ${testName}`)

    try {
      // 生成一个简单的 WAV 文件（1秒 440Hz 正弦波）
      const audio = new Audio()
      const wavData = this.generateWavData(440, 1)
      audio.src = `data:audio/wav;base64,${btoa(String.fromCharCode(...wavData))}`

      audio.volume = 0.5

      await audio.play()
      console.log('  播放 Data URL 音频')

      this.testResults.push({ name: testName, success: true, message: 'Data URL 音频播放成功' })
    } catch (error) {
      this.testResults.push({ name: testName, success: false, message: error.message })
    }
  }

  /**
   * 测试4: HTML5 Audio (静音解锁)
   */
  async testHTML5AudioSilent() {
    const testName = 'HTML5 Audio (静音解锁)'
    console.log(`\n🔍 测试: ${testName}`)

    try {
      const audio = new Audio()
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAKGF0YQAAAAA='
      audio.volume = 0.01

      await audio.play()
      audio.pause()

      this.testResults.push({ name: testName, success: true, message: '静音音频解锁成功' })
    } catch (error) {
      this.testResults.push({ name: testName, success: false, message: error.message })
    }
  }

  /**
   * 测试5: Web Speech API
   */
  async testWebSpeechAPI() {
    const testName = 'Web Speech API'
    console.log(`\n🔍 测试: ${testName}`)

    if (!('speechSynthesis' in window)) {
      this.testResults.push({ name: testName, success: false, message: 'speechSynthesis 不存在' })
      return
    }

    try {
      const voices = window.speechSynthesis.getVoices()
      console.log(`  可用语音数量: ${voices.length}`)

      const englishVoices = voices.filter(v => v.lang.startsWith('en'))
      console.log(`  英文语音数量: ${englishVoices.length}`)

      const utterance = new SpeechSynthesisUtterance('test')

      if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0]
        console.log(`  使用语音: ${utterance.voice.name}`)
      }

      utterance.lang = 'en-US'
      utterance.rate = 0.8
      utterance.volume = 1.0

      let started = false
      let ended = false

      utterance.onstart = () => {
        started = true
        console.log('  onstart 事件触发')
      }

      utterance.onend = () => {
        ended = true
        console.log('  onend 事件触发')
      }

      utterance.onerror = (e) => {
        console.error(`  onerror 事件: ${e.error}`)
      }

      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)

      // 等待 3 秒检查状态
      await new Promise(resolve => setTimeout(resolve, 3000))

      if (started && ended) {
        this.testResults.push({ name: testName, success: true, message: 'API 调用成功但可能没有实际发声' })
      } else if (!started) {
        this.testResults.push({ name: testName, success: false, message: 'onstart 未触发，语音未开始' })
      } else {
        this.testResults.push({ name: testName, success: true, message: 'onstart 触发但 onend 未触发' })
      }
    } catch (error) {
      this.testResults.push({ name: testName, success: false, message: error.message })
    }
  }

  /**
   * 测试6: 震动 API
   */
  testVibration() {
    const testName = '振动 API'
    console.log(`\n🔍 测试: ${testName}`)

    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
      this.testResults.push({ name: testName, success: true, message: '已触发振动模式' })
    } else {
      this.testResults.push({ name: testName, success: false, message: 'vibrate API 不存在' })
    }
  }

  /**
   * 生成 WAV 音频数据
   */
  generateWavData(frequency = 440, duration = 1) {
    const sampleRate = 44100
    const numSamples = sampleRate * duration
    const buffer = new Uint8Array(44 + numSamples * 2)

    // WAV 头
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        buffer[offset + i] = string.charCodeAt(i)
      }
    }

    writeString(0, 'RIFF')
    buffer[4] = (36 + numSamples * 2) & 0xff
    buffer[5] = ((36 + numSamples * 2) >> 8) & 0xff
    buffer[6] = ((36 + numSamples * 2) >> 16) & 0xff
    buffer[7] = ((36 + numSamples * 2) >> 24) & 0xff
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    buffer[16] = 16
    buffer[20] = 1
    buffer[22] = 1
    buffer[24] = sampleRate & 0xff
    buffer[25] = (sampleRate >> 8) & 0xff
    buffer[26] = (sampleRate >> 16) & 0xff
    buffer[27] = (sampleRate >> 24) & 0xff
    buffer[28] = (sampleRate * 2) & 0xff
    buffer[29] = ((sampleRate * 2) >> 8) & 0xff
    buffer[30] = ((sampleRate * 2) >> 16) & 0xff
    buffer[31] = ((sampleRate * 2) >> 24) & 0xff
    buffer[32] = 2
    buffer[34] = 16
    writeString(36, 'data')
    buffer[40] = (numSamples * 2) & 0xff
    buffer[41] = ((numSamples * 2) >> 8) & 0xff
    buffer[42] = ((numSamples * 2) >> 16) & 0xff
    buffer[43] = ((numSamples * 2) >> 24) & 0xff

    // 音频数据（正弦波）
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate
      const sample = Math.sin(2 * Math.PI * frequency * t)
      const value = Math.max(-1, Math.min(1, sample)) * 0.3
      const intSample = Math.floor(value * 32767)
      buffer[44 + i * 2] = intSample & 0xff
      buffer[44 + i * 2 + 1] = (intSample >> 8) & 0xff
    }

    return buffer
  }

  /**
   * 播放备选音频（使用 Web Audio）
   */
  async playFallbackAudio(word) {
    console.log(`[备选方案] 播放: ${word}`)

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioContext()

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      // 为每个字母生成不同频率
      const now = ctx.currentTime
      const letters = word.toLowerCase().split('')
      const frequencies = letters.map((letter, i) => {
        const baseFreq = 300 + (letter.charCodeAt(0) - 97) * 20
        return baseFreq + i * 50
      })

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.frequency.setValueAtTime(freq, now + i * 0.15)
        osc.type = 'sine'

        gain.gain.setValueAtTime(0, now + i * 0.15)
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.15 + 0.02)
        gain.gain.setValueAtTime(0.2, now + i * 0.15 + 0.1)
        gain.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.15)

        osc.start(now + i * 0.15)
        osc.stop(now + i * 0.15 + 0.15)
      })

      console.log(`[备选方案] 已播放 ${letters.length} 个音调`)

      setTimeout(() => {
        if (ctx.state !== 'closed') {
          ctx.close()
        }
      }, (letters.length * 150) + 500)

      // 同时触发振动
      if ('vibrate' in navigator) {
        navigator.vibrate(100)
      }

      return true
    } catch (error) {
      console.error('[备选方案] 播放失败:', error)
      return false
    }
  }

  /**
   * 显示可视化反馈（当音频无法播放时）
   */
  showVisualFeedback(word) {
    // 移除旧的反馈
    const old = document.getElementById('audio-feedback')
    if (old) old.remove()

    const feedback = document.createElement('div')
    feedback.id = 'audio-feedback'
    feedback.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 30px 40px;
        border-radius: 20px;
        font-size: 32px;
        font-weight: bold;
        z-index: 99999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        animation: pulse 0.5s ease-in-out 3;
      ">
        ${word.toUpperCase()}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }
      </style>
    `

    document.body.appendChild(feedback)

    setTimeout(() => {
      feedback.remove()
    }, 2000)

    // 同时触发振动
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100])
    }
  }
}

export default XiaomiAudioTest
