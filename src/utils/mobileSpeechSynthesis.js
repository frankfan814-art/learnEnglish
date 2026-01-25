/**
 * 移动端语音合成终极解决方案
 * 专门解决 Android/小米 浏览器 getVoices() 空数组问题
 */

class MobileSpeechSynthesis {
  constructor() {
    this.voices = []
    this.voicesLoaded = false
    this.loadingPromise = null
    this.isMobile = this.detectMobile()
    this.fallbackMode = false
    this.utteranceQueue = []
    this.isProcessing = false
  }

  /**
   * 检测移动设备
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  /**
   * 检测小米设备
   */
  isXiaomi() {
    const ua = navigator.userAgent || ''
    return /xiaomi|redmi|mi\s+/i.test(ua) || ua.includes('MIUI') || ua.includes('MiuiBrowser')
  }

  /**
   * 强制加载语音列表 - 多种方法组合
   */
  async loadVoices() {
    if (this.voicesLoaded) {
      return this.voices
    }

    if (this.loadingPromise) {
      return this.loadingPromise
    }

    this.loadingPromise = new Promise((resolve) => {
      console.log('[MobileSpeech] 开始加载语音列表...')

      // 方法1: 直接获取
      let voices = window.speechSynthesis.getVoices()
      if (voices && voices.length > 0) {
        this.voices = voices
        this.voicesLoaded = true
        console.log('[MobileSpeech] 方法1成功，语音数量:', voices.length)
        resolve(voices)
        return
      }

      // 方法2: 监听 voiceschanged 事件
      const handleVoicesChanged = () => {
        voices = window.speechSynthesis.getVoices()
        console.log('[MobileSpeech] voiceschanged 触发，语音数量:', voices.length)
        
        if (voices && voices.length > 0) {
          this.voices = voices
          this.voicesLoaded = true
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
          clearTimeout(voiceLoadTimeout)
          resolve(voices)
        }
      }

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)

      // 方法3: 强制触发语音加载（针对移动端）
      this.forceVoiceLoading()

      // 设置超时，即使没有语音也继续
      const voiceLoadTimeout = setTimeout(() => {
        voices = window.speechSynthesis.getVoices()
        
        if (voices.length === 0 && this.isMobile) {
          console.warn('[MobileSpeech] 移动端语音加载超时，使用备选方案')
          this.fallbackMode = true
        } else {
          this.voices = voices
          this.voicesLoaded = voices.length > 0
        }
        
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
        resolve(this.voices)
      }, this.isXiaomi() ? 3000 : 2000) // 小米设备给更长时间
    })

    return this.loadingPromise
  }

  /**
   * 强制触发语音加载
   */
  forceVoiceLoading() {
    console.log('[MobileSpeech] 尝试强制触发语音加载')

    // 创建一个静音的语音合成请求来触发语音引擎
    try {
      const silentUtterance = new SpeechSynthesisUtterance('')
      silentUtterance.volume = 0
      silentUtterance.rate = 0.1
      
      window.speechSynthesis.speak(silentUtterance)
      
      // 立即取消
      setTimeout(() => {
        window.speechSynthesis.cancel()
      }, 100)
      
    } catch (error) {
      console.warn('[MobileSpeech] 强制触发失败:', error)
    }

    // 尝试多次获取语音列表
    let attempts = 0
    const maxAttempts = 5
    const checkInterval = setInterval(() => {
      attempts++
      const voices = window.speechSynthesis.getVoices()
      
      if (voices.length > 0) {
        console.log(`[MobileSpeech] 第${attempts}次尝试成功，语音数量:`, voices.length)
        clearInterval(checkInterval)
        return
      }
      
      if (attempts >= maxAttempts) {
        console.warn('[MobileSpeech] 多次尝试仍无语音，可能需要用户交互')
        clearInterval(checkInterval)
      }
    }, 200)
  }

  /**
   * 创建语音合成请求
   */
  createUtterance(text, options = {}) {
    const utterance = new SpeechSynthesisUtterance(text)
    
    // 基础参数
    utterance.lang = options.lang || 'en-US'
    utterance.rate = options.rate || (this.isXiaomi() ? 0.9 : 0.8)
    utterance.pitch = options.pitch || 1
    utterance.volume = options.volume || 1

    // 如果有可用语音，选择合适的
    if (this.voices.length > 0) {
      const englishVoices = this.voices.filter(voice => 
        voice.lang.startsWith('en-') || voice.lang.startsWith('en_')
      )
      
      if (englishVoices.length > 0) {
        const usVoice = englishVoices.find(voice => voice.lang.startsWith('en-US')) || englishVoices[0]
        utterance.voice = usVoice
        utterance.lang = usVoice.lang
        console.log('[MobileSpeech] 选择语音:', usVoice.name, usVoice.lang)
      }
    }

    return utterance
  }

  /**
   * 播放语音 - 移动端优化版
   */
  async speak(text, options = {}) {
    console.log('[MobileSpeech] 开始播放:', text)

    if (!('speechSynthesis' in window)) {
      throw new Error('浏览器不支持 Web Speech API')
    }

    // 确保语音列表已加载
    await this.loadVoices()

    return new Promise((resolve, reject) => {
      // 如果在备选模式，使用音频提示
      if (this.fallbackMode && this.voices.length === 0) {
        console.log('[MobileSpeech] 使用备选音频提示')
        this.playFallbackAudio(text)
        setTimeout(resolve, 1000)
        return
      }

      // 创建语音合成请求
      const utterance = this.createUtterance(text, options)

      // 设置超时（移动端需要更长时间）
      const timeout = setTimeout(() => {
        console.warn('[MobileSpeech] 播放超时，可能需要用户交互')
        window.speechSynthesis.cancel()
        
        // 降级到音频提示
        this.playFallbackAudio(text)
        setTimeout(resolve, 1000)
      }, this.isXiaomi() ? 5000 : 3000)

      utterance.onstart = () => {
        console.log('[MobileSpeech] 开始播放语音')
        clearTimeout(timeout)
      }

      utterance.onend = () => {
        clearTimeout(timeout)
        console.log('[MobileSpeech] 语音播放完成')
        resolve()
      }

      utterance.onerror = (error) => {
        clearTimeout(timeout)
        console.error('[MobileSpeech] 语音播放错误:', error)
        
        // 降级到音频提示
        this.playFallbackAudio(text)
        setTimeout(resolve, 1000)
        reject(error)
      }

      // 移动端特殊处理：添加用户交互检测
      if (this.isMobile && !this.hasUserInteracted()) {
        console.warn('[MobileSpeech] 移动端需要用户交互才能播放语音')
        this.requestUserInteraction(() => {
          this.doSpeak(utterance, resolve, reject, timeout)
        })
      } else {
        this.doSpeak(utterance, resolve, reject, timeout)
      }
    })
  }

  /**
   * 实际执行语音播放
   */
  doSpeak(utterance, resolve, reject, timeout) {
    try {
      // 清理之前的语音
      window.speechSynthesis.cancel()
      
      // 添加短暂延迟确保清理完成
      setTimeout(() => {
        window.speechSynthesis.speak(utterance)
      }, this.isXiaomi() ? 200 : 50)
      
    } catch (error) {
      clearTimeout(timeout)
      console.error('[MobileSpeech] speak 调用失败:', error)
      
      // 降级到音频提示
      this.playFallbackAudio(utterance.text)
      setTimeout(resolve, 1000)
      reject(error)
    }
  }

  /**
   * 检测用户是否已交互
   */
  hasUserInteracted() {
    // 检查是否有用户交互事件
    return window.userInteractionDetected === true
  }

  /**
   * 请求用户交互
   */
  requestUserInteraction(callback) {
    console.log('[MobileSpeech] 请求用户交互以启用语音')

    // 创建交互按钮
    const button = document.createElement('button')
    button.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 15px;
        border: none;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        text-align: center;
        line-height: 1.4;
      ">
        🎵 启用语音播放
        <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">
          移动设备需要用户交互才能播放语音
        </div>
      </div>
    `

    const handleClick = () => {
      window.userInteractionDetected = true
      button.remove()
      callback()
    }

    button.addEventListener('click', handleClick)
    document.body.appendChild(button)

    // 5秒后自动隐藏
    setTimeout(() => {
      if (document.body.contains(button)) {
        button.remove()
      }
    }, 5000)
  }

  /**
   * 备选音频播放
   */
  playFallbackAudio(text) {
    console.log('[MobileSpeech] 播放备选音频提示:', text)
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        const audioContext = new AudioContext()
        if (audioContext.state === 'suspended') {
          audioContext.resume()
        }
        
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // 根据文本长度生成不同频率
        const frequency = 600 + (text.length * 20)
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)
        
        setTimeout(() => {
          if (audioContext.state !== 'closed') {
            audioContext.close()
          }
        }, 1000)
      }
    } catch (error) {
      console.error('[MobileSpeech] 备选音频播放失败:', error)
    }
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      isMobile: this.isMobile,
      isXiaomi: this.isXiaomi(),
      voicesLoaded: this.voicesLoaded,
      voicesCount: this.voices.length,
      fallbackMode: this.fallbackMode,
      supported: 'speechSynthesis' in window
    }
  }

  /**
   * 停止播放
   */
  cancel() {
    window.speechSynthesis.cancel()
  }

  /**
   * 暂停播放
   */
  pause() {
    window.speechSynthesis.pause()
  }

  /**
   * 恢复播放
   */
  resume() {
    window.speechSynthesis.resume()
  }
}

export default MobileSpeechSynthesis