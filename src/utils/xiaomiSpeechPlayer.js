/**
 * 小米设备专用语音播放器
 * 使用多种备选方案确保语音播放成功
 */

class XiaomiSpeechPlayer {
  constructor() {
    this.isXiaomi = this.detectXiaomi()
    this.audioQueue = []
    this.isPlaying = false
    this.currentAudio = null
    this.useFallback = false
  }

  /**
   * 检测小米设备
   */
  detectXiaomi() {
    return /xiaomi|redmi|mi\s+/i.test(navigator.userAgent) ||
           navigator.userAgent.includes('MIUI')
  }

  /**
   * 创建简单的音频提示（替代方案1）
   */
  createAudioBeep(word) {
    console.log('[XiaomiSpeech] 创建音频提示:', word)
    
    try {
      // 使用 Web Audio API 生成简单的提示音
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return null
      
      const audioContext = new AudioContext()
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      
      // 根据单词长度生成不同频率的提示音
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // 使用不同的频率表示不同单词长度
      const frequency = 800 + (word.length * 50)
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
      
      return true
    } catch (error) {
      console.error('[XiaomiSpeech] 音频提示失败:', error)
      return false
    }
  }

  /**
   * 使用震动提示（替代方案2）
   */
  createVibration() {
    console.log('[XiaomiSpeech] 使用震动提示')
    
    if ('vibrate' in navigator) {
      // 短震动模式表示单词发音
      navigator.vibrate([100, 50, 100])
      return true
    }
    return false
  }

  /**
   * 使用系统通知（替代方案3）
   */
  createNotification(word) {
    console.log('[XiaomiSpeech] 创建系统通知:', word)
    
    if ('Notification' in window) {
      // 请求通知权限
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.showNotification(word)
          }
        })
      } else if (Notification.permission === 'granted') {
        this.showNotification(word)
      }
    }
    return false
  }

  /**
   * 显示通知
   */
  showNotification(word) {
    try {
      const notification = new Notification(`英语单词学习`, {
        body: `正在学习: ${word}`,
        icon: '/favicon.ico',
        tag: 'word-learning',
        requireInteraction: false
      })
      
      // 3秒后自动关闭
      setTimeout(() => {
        notification.close()
      }, 3000)
    } catch (error) {
      console.error('[XiaomiSpeech] 通知显示失败:', error)
    }
  }

  /**
   * 强制解锁音频权限
   */
  forceUnlockAudio() {
    console.log('[XiaomiSpeech] 强制解锁音频权限')
    
    // 创建多个音频上下文来强制唤醒
    for (let i = 0; i < 3; i++) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        const audioContext = new AudioContext()
        if (audioContext.state === 'suspended') {
          audioContext.resume()
        }
        
        // 创建持续的音频流
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        gainNode.gain.value = 0.001
        oscillator.start()
        
        setTimeout(() => {
          oscillator.stop()
          if (audioContext.state !== 'closed') {
            audioContext.close()
          }
        }, 100)
      } catch (error) {
        console.warn(`[XiaomiSpeech] 音频解锁尝试 ${i + 1} 失败:`, error)
      }
    }
  }

  /**
   * 主要播放函数 - 使用多种备选方案
   */
  async play(word) {
    console.log(`[XiaomiSpeech] 开始播放单词: ${word}`)
    this.isPlaying = true
    
    // 方案1: 尝试基础 Web Speech API（快速失败立即使用备选方案）
    if (!this.useFallback) {
      try {
        const result = await this.tryWebSpeech(word)
        if (result) {
          this.isPlaying = false
          return true
        }
      } catch (error) {
        console.warn('[XiaomiSpeech] Web Speech API 失败:', error)
      }
    }

    // 方案2: 音频提示
    console.log('[XiaomiSpeech] 使用音频提示方案')
    const audioResult = this.createAudioBeep(word)
    
    // 方案3: 震动提示
    setTimeout(() => {
      this.createVibration()
    }, 200)
    
    // 方案4: 系统通知
    setTimeout(() => {
      this.createNotification(word)
    }, 500)
    
    // 标记播放完成
    setTimeout(() => {
      console.log('[XiaomiSpeech] 播放完成 (使用备选方案)')
      this.isPlaying = false
    }, 1000)
    
    return true
  }

  /**
   * 尝试 Web Speech API（简化版本）
   */
  async tryWebSpeech(word) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('浏览器不支持 Web Speech API'))
        return
      }

      // 清理之前的语音
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 1
      
      // 设置短超时，快速失败以便使用备选方案
      const timeout = setTimeout(() => {
        console.warn('[XiaomiSpeech] Web Speech API 超时，使用备选方案')
        reject(new Error('Web Speech API 超时'))
      }, 1000)
      
      utterance.onend = () => {
        clearTimeout(timeout)
        console.log('[XiaomiSpeech] Web Speech API 播放成功')
        resolve(true)
      }
      
      utterance.onerror = (error) => {
        clearTimeout(timeout)
        console.error('[XiaomiSpeech] Web Speech API 错误:', error)
        reject(error)
      }
      
      // 开始播放
      try {
        window.speechSynthesis.speak(utterance)
      } catch (error) {
        clearTimeout(timeout)
        reject(error)
      }
    })
  }

  /**
   * 切换到备选模式
   */
  enableFallbackMode() {
    console.log('[XiaomiSpeech] 启用备选模式（使用音频+震动+通知）')
    this.useFallback = true
  }

  /**
   * 获取播放状态
   */
  getStatus() {
    return {
      isXiaomi: this.isXiaomi,
      isPlaying: this.isPlaying,
      useFallback: this.useFallback,
      speechSynthesisSupported: 'speechSynthesis' in window,
      audioContextSupported: 'AudioContext' in window || 'webkitAudioContext' in window,
      vibrateSupported: 'vibrate' in navigator,
      notificationSupported: 'Notification' in window
    }
  }

  /**
   * 停止播放
   */
  stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    this.isPlaying = false
  }
}

export default XiaomiSpeechPlayer