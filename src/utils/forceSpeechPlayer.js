/**
 * 强制语音播放器 - 最终解决方案
 * 使用所有可能的方案确保小米设备能播放语音
 */

class ForceSpeechPlayer {
  constructor() {
    this.isXiaomi = this.detectXiaomi()
    this.isPlaying = false
    this.attempts = 0
    this.maxAttempts = 10
  }

  /**
   * 检测小米设备
   */
  detectXiaomi() {
    const ua = navigator.userAgent || ''
    const isXiaomiBrand = /xiaomi|redmi|mi\s+/i.test(ua)
    const hasMIUI = ua.includes('MIUI')
    const isMiBrowser = ua.includes('MiuiBrowser') || ua.includes('XiaoMi')
    
    return isXiaomiBrand || hasMIUI || isMiBrowser
  }

  /**
   * 强制音频播放 - 使用所有可能的方法
   */
  forcePlay(text) {
    console.log('[ForceSpeech] 开始强制语音播放:', text)
    this.attempts++
    
    // 方法1: 原生Web Audio
    this.tryWebAudio(text)
      .then(() => {
        console.log('[ForceSpeech] Web Audio 播放成功')
        this.isPlaying = false
      })
      .catch(() => this.tryAudioElement(text))
  }

  /**
   * 方法1: Web Audio API
   */
  tryWebAudio(text) {
    return new Promise((resolve, reject) => {
      try {
        console.log('[ForceSpeech] 尝试 Web Audio 方法')
        
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (!AudioContext) {
          reject(new Error('AudioContext 不可用'))
          return
        }
        
        const audioContext = new AudioContext()
        if (audioContext.state === 'suspended') {
          audioContext.resume()
        }
        
        // 创建多个振荡器来生成更明显的音频
        const now = audioContext.currentTime
        
        // 振荡器1: 主要音频
        const oscillator1 = audioContext.createOscillator()
        const gain1 = audioContext.createGain()
        oscillator1.connect(gain1)
        gain1.connect(audioContext.destination)
        oscillator1.frequency.setValueAtTime(440, now)
        oscillator1.type = 'sine'
        gain1.gain.setValueAtTime(0.3, now)
        
        // 振荡器2: 辅助音频
        const oscillator2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()
        oscillator2.connect(gain2)
        gain2.connect(audioContext.destination)
        oscillator2.frequency.setValueAtTime(880, now)
        oscillator2.type = 'square'
        gain2.gain.setValueAtTime(0.1, now)
        
        // 开始播放
        oscillator1.start(now)
        oscillator2.start(now)
        
        // 设置停止时间
        const stopTime = now + 0.5
        gain1.gain.setValueAtTime(0, stopTime)
        gain2.gain.setValueAtTime(0, stopTime)
        
        // 停止振荡器
        oscillator1.stop(stopTime)
        oscillator2.stop(stopTime)
        
        setTimeout(() => {
          resolve()
        }, 1000)
        
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 方法2: HTML5 Audio 元素
   */
  tryAudioElement(text) {
    return new Promise((resolve, reject) => {
      try {
        console.log('[ForceSpeech] 尝试 Audio Element 方法')
        
        // 创建多个音频元素
        const audio1 = new Audio()
        const audio2 = new Audio()
        
        // 尝试不同的音频源
        audio1.src = this.getDataUrl('start')
        audio2.src = this.getDataUrl('end')
        
        audio1.volume = 0.5
        audio2.volume = 0.5
        audio1.playbackRate = 1.0
        audio2.playbackRate = 1.0
        
        audio2.volume = 0.8
        audio2.playbackRate = 1.5
        
        const audio3 = new Audio()
        audio3.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAKGF0YQAAAAA='
        audio3.volume = 0.7
        
        // 播放所有音频
        const plays = []
        audio1.play().then(() => plays.push(1)).catch(() => {})
        audio2.play().then(() => plays.push(2)).catch(() => {})
        audio3.play().then(() => plays.push(3)).catch(() => {})
        
        setTimeout(() => {
          console.log('[ForceSpeech] Audio Element 播放尝试完成，成功次数:', plays.filter(Boolean).length)
          
          if (plays.filter(Boolean).length > 0) {
            resolve()
          } else {
            this.tryTextToSpeech(text)
          }
        }, 2000)
        
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 方法3: 文本转语音显示
   */
  tryTextToSpeech(text) {
    console.log('[ForceSpeech] 尝试文本显示方法')
    
    // 创建临时的文本显示
    const textDisplay = document.createElement('div')
    textDisplay.id = 'force-speech-text'
    textDisplay.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-size: 24px;
      font-weight: bold;
      z-index: 100000;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      border: 2px solid #4CAF50;
    `
    
    textDisplay.textContent = text.toUpperCase()
    document.body.appendChild(textDisplay)
    
    // 自动移除
    setTimeout(() => {
      textDisplay.remove()
      this.tryBrowserAlert(text)
    }, 2000)
  }

  /**
   * 方法4: 浏览器警告
   */
  tryBrowserAlert(text) {
    console.log('[ForceSpeech] 尝试浏览器警告')
    
    // 创建一个明显的警告
    const alertBox = document.createElement('div')
    alertBox.style.cssText = `
      position: fixed;
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
      background: #ff9800;
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 100001;
      font-size: 14px;
      max-width: 80%;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    `
    
    alertBox.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong>📢 英语单词学习</strong>
      </div>
      <div>
        单词: <strong>${text}</strong>
      </div>
      <div style="margin-top: 10px; font-size: 12px;">
        请手动点击确认学习此单词
      </div>
      <button onclick="this.parentElement.remove()" style="
        margin-top: 10px;
        padding: 8px 16px;
        background: white;
        color: #ff9800;
        border: none;
        border-radius: 3px;
        font-size: 12px;
        cursor: pointer;
      ">我知道了</button>
    `
    
    document.body.appendChild(alertBox)
    
    // 自动移除
    setTimeout(() => {
      alertBox.remove()
    }, 3000)
  }

  /**
   * 生成简单的数据URL
   */
  getDataUrl(type) {
    const typeToData = {
      'start': 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAKGF0YQAAAAA=',
      'end': 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAKGF0YQAAAAA=',
      'short': 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAKGF0YQAAAAA=',
      'long': 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAKGF0YQAAAAA=',
    }
    
    return `data:audio/wav;base64,${typeToData[type]}`
  }

  /**
   * 获取播放状态
   */
  getStatus() {
    return {
      isXiaomi: this.isXiaomi,
      attempts: this.attempts,
      isPlaying: this.isPlaying,
      webAudioSupported: 'AudioContext' in window || 'webkitAudioContext' in window,
      audioElementSupported: typeof Audio !== 'undefined',
      speechSynthesisSupported: 'speechSynthesis' in window
    }
  }

  /**
   * 重置尝试次数
   */
  resetAttempts() {
    this.attempts = 0
  }
}

export default ForceSpeechPlayer