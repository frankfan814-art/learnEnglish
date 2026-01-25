/**
 * 移动端语音修复器 - 专门解决 iOS Safari 和 Android 问题
 */

class MobileSpeechFixer {
  constructor() {
    this.isMobile = this.detectMobile()
    this.isIOS = this.detectIOS()
    this.isAndroid = this.detectAndroid()
    this.speechQueue = []
    this.isSpeaking = false
    this.retryCount = 0
    this.maxRetries = 5 // 增加重试次数
  }

  /**
   * 检测是否为移动设备
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  /**
   * 检测 iOS 设备
   */
  detectIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  }

  /**
   * 检测 Android 设备
   */
  detectAndroid() {
    const isAndroid = /Android/.test(navigator.userAgent)
    const isXiaomi = /xiaomi|redmi|mi\s+/i.test(navigator.userAgent)
    return { isAndroid, isXiaomi }
  }

  /**
   * 获取设备环境信息
   */
  getDeviceInfo() {
    return {
      isMobile: this.isMobile,
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      speechSynthesisSupported: 'speechSynthesis' in window,
      audioContextSupported: 'AudioContext' in window || 'webkitAudioContext' in window
    }
  }

  /**
   * 修复 iOS Safari 语音问题
   */
  fixIOSSpeech() {
    if (!this.isIOS) return true

    // iOS Safari 需要特殊处理
    console.log('[MobileSpeechFixer] 检测到 iOS 设备，启用特殊修复')

    // 1. 创建一个临时的音频上下文来唤醒音频系统
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        const audioContext = new AudioContext()
        if (audioContext.state === 'suspended') {
          audioContext.resume()
          console.log('[MobileSpeechFixer] 已唤醒 AudioContext')
        }

        // 创建一个空的音频源来保持音频上下文活跃
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.start(0)
        oscillator.stop(0.001)
        console.log('[MobileSpeechFixer] 已创建音频占位符')
      }
    } catch (error) {
      console.warn('[MobileSpeechFixer] AudioContext 创建失败:', error)
    }

    return true
  }

  /**
   * 修复 Android 语音问题
   */
  fixAndroidSpeech() {
    if (!this.isAndroid.isAndroid) return true

    console.log('[MobileSpeechFixer] 检测到 Android 设备，启用特殊修复')
    
    if (this.isAndroid.isXiaomi) {
      console.log('[MobileSpeechFixer] 检测到小米设备，启用小米专用修复')
      this.fixXiaomiSpeech()
      return true
    }

    // Android 需要确保在用户交互后调用
    // 添加用户交互监听器
    const enableSpeech = () => {
      document.removeEventListener('touchstart', enableSpeech)
      document.removeEventListener('click', enableSpeech)
      console.log('[MobileSpeechFixer] 已检测到用户交互，启用语音')
    }

    document.addEventListener('touchstart', enableSpeech, { once: true })
    document.addEventListener('click', enableSpeech, { once: true })

    return true
  }

  /**
   * 修复小米设备语音问题
   */
  fixXiaomiSpeech() {
    console.log('[MobileSpeechFixer] 启用小米设备语音修复')
    
    // 小米浏览器有特殊的音频限制
    // 1. 强制创建 AudioContext
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      
      // 2. 创建静音音频来预加载
      const silentOscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0
      silentOscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      silentOscillator.start()
      silentOscillator.stop(audioContext.currentTime + 0.01)
      
      console.log('[MobileSpeechFixer] 小米音频预加载完成')
    } catch (error) {
      console.warn('[MobileSpeechFixer] 小米音频预加载失败:', error)
    }

    // 3. 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && 'speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices()
        console.log('[MobileSpeechFixer] 页面重新可见，语音数量:', voices.length)
      }
    })
  }

  /**
   * 智能语音播放 - 包含多种修复策略
   */
  async speak(text, options = {}) {
    console.log('[MobileSpeechFixer] 开始语音播放:', text)

    const {
      lang = 'en-US',
      rate = 0.9,
      pitch = 1,
      volume = 1,
      voice = null
    } = options

    // 应用设备特定修复
    if (this.isIOS) {
      await this.fixIOSSpeech()
    } else if (this.isAndroid) {
      await this.fixAndroidSpeech()
    }

    // 等待一小段时间让修复生效
    await this.sleep(100)

    // 尝试播放语音
    return this.attemptSpeech(text, { lang, rate, pitch, volume, voice })
  }

  /**
   * 尝试语音播放（带重试机制）
   */
  async attemptSpeech(text, options) {
    if (!('speechSynthesis' in window)) {
      throw new Error('浏览器不支持 Web Speech API')
    }

    return new Promise((resolve, reject) => {
      // 获取可用语音
      const voices = window.speechSynthesis.getVoices()
      console.log('[MobileSpeechFixer] 可用语音数量:', voices.length)

      // 清理之前的语音
      window.speechSynthesis.cancel()

      // 等待清理完成
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text)

        // 设置语音参数
        utterance.lang = options.lang
        utterance.rate = options.rate
        utterance.pitch = options.pitch
        utterance.volume = options.volume

        // 选择合适的语音
        if (options.voice) {
          utterance.voice = options.voice
        } else {
          const englishVoices = voices.filter(v => 
            v.lang.startsWith('en-') || v.lang.startsWith('en_')
          )
          if (englishVoices.length > 0) {
            const usVoice = englishVoices.find(v => v.lang.startsWith('en-US')) || englishVoices[0]
            utterance.voice = usVoice
            console.log('[MobileSpeechFixer] 选择语音:', usVoice.name, usVoice.lang)
          }
        }

        // iOS 特殊设置
        if (this.isIOS) {
          utterance.rate = Math.max(0.5, Math.min(1.0, utterance.rate))
          utterance.pitch = Math.max(0.5, Math.min(1.5, utterance.pitch))
        }

        // Android 特殊设置
        if (this.isAndroid.isAndroid) {
          utterance.rate = Math.max(0.8, Math.min(1.2, utterance.rate))
          
          // 小米设备额外优化
          if (this.isAndroid.isXiaomi) {
            utterance.rate = Math.max(0.7, Math.min(1.0, utterance.rate))
            utterance.pitch = Math.max(0.8, Math.min(1.2, utterance.pitch))
            utterance.volume = Math.max(0.9, Math.min(1.0, utterance.volume))
            console.log('[MobileSpeechFixer] 小米设备语音参数已优化')
          }
        }

        // 事件处理
        utterance.onstart = () => {
          console.log('[MobileSpeechFixer] 语音开始播放')
          this.isSpeaking = true
          this.retryCount = 0
        }

        utterance.onend = () => {
          console.log('[MobileSpeechFixer] 语音播放完成')
          this.isSpeaking = false
          resolve()
        }

        utterance.onerror = (e) => {
          console.error('[MobileSpeechFixer] 语音播放失败:', e)
          this.isSpeaking = false
          
          // 重试机制
          if (this.retryCount < this.maxRetries) {
            this.retryCount++
            console.log(`[MobileSpeechFixer] 重试第 ${this.retryCount} 次`)
            
            setTimeout(() => {
              this.attemptSpeech(text, options).then(resolve).catch(reject)
            }, this.getRetryDelay())
          } else {
            reject(new Error(`语音播放失败，已重试 ${this.maxRetries} 次`))
          }
        }

        // 等待一小段时间再开始播放
        const delay = this.isIOS ? 200 : 
                      this.isAndroid.isXiaomi ? 300 : 50
                      
        setTimeout(() => {
          try {
            window.speechSynthesis.speak(utterance)
          } catch (error) {
            console.error('[MobileSpeechFixer] speak 调用失败:', error)
            reject(error)
          }
        }, delay)

      }, 100)
    })
  }

  /**
   * 获取重试延迟
   */
  getRetryDelay() {
    // 小米需要更长的重试间隔
    if (this.isAndroid.isXiaomi) return 1200
    if (this.isIOS) return 800
    return 500
  }

  /**
   * 睡眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 停止语音播放
   */
  stop() {
    if (this.isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      this.isSpeaking = false
      console.log('[MobileSpeechFixer] 语音已停止')
    }
  }

  /**
   * 获取语音支持状态
   */
  getSpeechStatus() {
    if (!('speechSynthesis' in window)) {
      return {
        supported: false,
        message: '浏览器不支持 Web Speech API'
      }
    }

    const voices = window.speechSynthesis.getVoices()
    const englishVoices = voices.filter(v => 
      v.lang.startsWith('en-') || v.lang.startsWith('en_')
    )

    return {
      supported: true,
      isSpeaking: this.isSpeaking,
      availableVoices: voices.length,
      englishVoices: englishVoices.length,
      deviceInfo: this.getDeviceInfo()
    }
  }
}

export default MobileSpeechFixer