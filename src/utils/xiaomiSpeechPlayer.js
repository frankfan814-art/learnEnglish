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
    const ua = navigator.userAgent || ''
    const isXiaomiBrand = /xiaomi|redmi|mi\s+/i.test(ua)
    const hasMIUI = ua.includes('MIUI')
    const isMiBrowser = ua.includes('MiuiBrowser') || ua.includes('XiaoMi')
    
    // 更全面的小米设备检测
    return isXiaomiBrand || hasMIUI || isMiBrowser
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
    console.log(`[XiaomiSpeech] 开始播放单词: ${word} (设备检测: ${this.isXiaomi})`)
    this.isPlaying = true
    
    // 首先强制解锁音频权限
    this.forceUnlockAudio()
    
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

    // 方案2: 尝试服务器端 TTS (小米设备专用)
    if (this.isXiaomi && !this.useFallback) {
      try {
        console.log('[XiaomiSpeech] 尝试服务器端 TTS 方案')
        await this.tryServerTTS(word)
        this.isPlaying = false
        return true
      } catch (error) {
        console.warn('[XiaomiSpeech] 服务器端 TTS 失败:', error)
      }
    }

    // 方案3: 音频提示
    console.log('[XiaomiSpeech] 使用音频提示方案')
    const audioResult = this.createAudioBeep(word)
    
    // 方案4: 震动提示（立即执行）
    this.createVibration()
    
    // 方案5: 系统通知（延迟执行避免打扰）
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
   * 尝试服务器端 TTS 播放
   */
  async tryServerTTS(word) {
    try {
      console.log('[XiaomiSpeech] 请求服务器端 TTS:', word)
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Xiaomi-Optimization': 'true'
        },
        body: JSON.stringify({ 
          text: word, 
          voice: 'en-US-GuyNeural',
          optimizeForMobile: true
        })
      })

      if (!response.ok) {
        throw new Error(`服务器 TTS 请求失败: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      
      // 使用特殊的音频播放方法
      await this.playXiaomiAudio(arrayBuffer)
      console.log('[XiaomiSpeech] 服务器端 TTS 播放成功')
      
    } catch (error) {
      console.error('[XiaomiSpeech] 服务器端 TTS 播放失败:', error)
      throw error
    }
  }

  /**
   * 小米设备专用音频播放方法
   */
  async playXiaomiAudio(audioBuffer) {
    return new Promise((resolve, reject) => {
      try {
        // 清理之前的音频
        this.cleanupXiaomiAudio()
        
        // 使用 Data URL 方式（小米设备兼容性更好）
        const uint8Array = new Uint8Array(audioBuffer)
        let binary = ''
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i])
        }
        const base64 = btoa(binary)
        const dataUrl = `data:audio/mpeg;base64,${base64}`
        
        // 创建多个音频元素尝试播放
        const audio1 = new Audio(dataUrl)
        const audio2 = new Audio()
        
        audio2.src = dataUrl
        audio1.preload = 'auto'
        audio2.preload = 'auto'
        
        // 设置小米设备专用属性
        audio1.setAttribute('webkit-playsinline', 'true')
        audio1.setAttribute('playsinline', 'true')
        audio2.setAttribute('webkit-playsinline', 'true')
        audio2.setAttribute('playsinline', 'true')
        
        audio1.volume = 1.0
        audio2.volume = 1.0
        
        // 立即尝试播放
        const plays = []
        
        audio1.play().then(() => {
          plays.push(1)
          console.log('[XiaomiSpeech] 音频1 播放成功')
        }).catch(err => {
          console.warn('[XiaomiSpeech] 音频1 播放失败:', err)
        })
        
        // 延迟播放第二个音频
        setTimeout(() => {
          audio2.play().then(() => {
            plays.push(2)
            console.log('[XiaomiSpeech] 音频2 播放成功')
          }).catch(err => {
            console.warn('[XiaomiSpeech] 音频2 播放失败:', err)
          })
        }, 100)
        
        // 设置结束事件
        audio1.onended = () => {
          console.log('[XiaomiSpeech] 音频播放结束')
          this.cleanupXiaomiAudio()
          resolve()
        }
        
        audio1.onerror = () => {
          console.warn('[XiaomiSpeech] 音频播放错误')
          this.cleanupXiaomiAudio()
          // 即使失败也继续，因为有备选方案
          setTimeout(resolve, 500)
        }
        
        // 保存引用以便清理
        this.xiaomiAudioElements = [audio1, audio2]
        
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 清理小米音频元素
   */
  cleanupXiaomiAudio() {
    if (this.xiaomiAudioElements) {
      this.xiaomiAudioElements.forEach(audio => {
        try {
          audio.pause()
          audio.src = ''
        } catch (e) {}
      })
      this.xiaomiAudioElements = null
    }
  }

  /**
   * 尝试 Web Speech API（小米设备优化版）
   */
  async tryWebSpeech(word) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('浏览器不支持 Web Speech API'))
        return
      }

      console.log('[XiaomiSpeech] 开始 Web Speech API 尝试播放:', word)
      
      // 清理之前的语音
      window.speechSynthesis.cancel()
      
      // 确保语音列表已加载
      const voices = window.speechSynthesis.getVoices()
      console.log('[XiaomiSpeech] 可用语音数量:', voices.length)
      
      if (voices.length === 0) {
        // 小米浏览器可能需要等待语音加载
        console.warn('[XiaomiSpeech] 语音列表为空，尝试等待加载...')
        setTimeout(() => {
          const retryVoices = window.speechSynthesis.getVoices()
          console.log('[XiaomiSpeech] 重试后语音数量:', retryVoices.length)
          this.speakWithVoices(word, retryVoices, resolve, reject)
        }, 200)
        return
      }
      
      this.speakWithVoices(word, voices, resolve, reject)
    })
  }

  /**
   * 使用指定语音列表进行播放
   */
  speakWithVoices(word, voices, resolve, reject) {
    const utterance = new SpeechSynthesisUtterance(word)
    
    // 尝试选择合适的英文语音
    const englishVoices = voices.filter(voice => 
      voice.lang.startsWith('en-') || voice.lang.startsWith('en_')
    )
    
    if (englishVoices.length > 0) {
      const usVoice = englishVoices.find(voice => voice.lang.startsWith('en-US')) || englishVoices[0]
      utterance.voice = usVoice
      utterance.lang = usVoice.lang
      console.log('[XiaomiSpeech] 选择语音:', usVoice.name, usVoice.lang)
    } else {
      utterance.lang = 'en-US'
      console.warn('[XiaomiSpeech] 未找到英文语音，使用默认设置')
    }
    
    // 小米设备特殊参数
    utterance.rate = this.isXiaomi ? 0.9 : 0.8
    utterance.pitch = this.isXiaomi ? 1.1 : 1
    utterance.volume = 1
    
    // 小米设备使用更长的超时时间，因为可能需要更多时间来启动
    const timeout = setTimeout(() => {
      console.warn('[XiaomiSpeech] Web Speech API 超时，小米浏览器可能需要用户交互权限')
      reject(new Error('Web Speech API 超时'))
    }, this.isXiaomi ? 2000 : 1000)
    
    utterance.onstart = () => {
      console.log('[XiaomiSpeech] Web Speech API 开始播放')
    }
    
    utterance.onend = () => {
      clearTimeout(timeout)
      console.log('[XiaomiSpeech] Web Speech API 播放成功')
      resolve(true)
    }
    
    utterance.onerror = (error) => {
      clearTimeout(timeout)
      console.error('[XiaomiSpeech] Web Speech API 错误:', error.error, error.message)
      reject(error)
    }
    
    // 小米设备需要特殊处理
    if (this.isXiaomi) {
      // 尝试创建一个用户交互事件来触发语音
      this.simulateUserInteraction(() => {
        try {
          window.speechSynthesis.speak(utterance)
        } catch (error) {
          clearTimeout(timeout)
          console.error('[XiaomiSpeech] speak 调用失败:', error)
          reject(error)
        }
      })
    } else {
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance)
        } catch (error) {
          clearTimeout(timeout)
          reject(error)
        }
      }, 0)
    }
  }

  /**
   * 模拟用户交互来触发音频权限（小米浏览器需要）
   */
  simulateUserInteraction(callback) {
    console.log('[XiaomiSpeech] 模拟用户交互以激活音频权限')
    
    // 创建一个隐藏的按钮来模拟点击
    const hiddenButton = document.createElement('button')
    hiddenButton.style.cssText = `
      position: absolute;
      top: -100px;
      left: -100px;
      opacity: 0;
      pointer-events: none;
    `
    hiddenButton.textContent = 'Activate Audio'
    document.body.appendChild(hiddenButton)
    
    // 模拟点击事件
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
    
    hiddenButton.dispatchEvent(clickEvent)
    
    // 立即移除按钮并执行回调
    setTimeout(() => {
      hiddenButton.remove()
      callback()
    }, 10)
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