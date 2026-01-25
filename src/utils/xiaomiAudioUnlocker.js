/**
 * 小米设备音频解锁工具
 * 专门解决小米浏览器音频权限问题
 */

class XiaomiAudioUnlocker {
  constructor() {
    this.unlocked = false
    this.audioContext = null
    this.testAudio = null
  }

  /**
   * 检测是否为小米设备
   */
  isXiaomiDevice() {
    const ua = navigator.userAgent || ''
    return /xiaomi|redmi|mi\s+/i.test(ua) || 
           ua.includes('MIUI') || 
           ua.includes('MiuiBrowser') || 
           ua.includes('XiaoMi')
  }

  /**
   * 创建用户交互按钮
   */
  createUnlockButton() {
    const button = document.createElement('button')
    button.id = 'xiaomi-audio-unlock'
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
        🎵 点击启用语音功能
        <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">
          小米设备需要手动激活音频权限
        </div>
      </div>
    `
    return button
  }

  /**
   * 强制解锁音频权限
   */
  async forceUnlock() {
    if (this.unlocked) {
      return true
    }

    console.log('[XiaomiAudioUnlocker] 开始强制解锁音频权限')

    // 方法1: 创建 AudioContext 并播放
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioContext()
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
        console.log('[XiaomiAudioUnlocker] AudioContext 已恢复')
      }

      // 创建测试音频
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
      
      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + 0.1)
      
      this.unlocked = true
      console.log('[XiaomiAudioUnlocker] 方法1 成功')
      return true
    } catch (error) {
      console.warn('[XiaomiAudioUnlocker] 方法1 失败:', error)
    }

    // 方法2: 使用 HTML5 Audio
    try {
      const testAudio = new Audio()
      testAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAKGF0YQAAAAA='
      testAudio.volume = 0.01
      
      await testAudio.play()
      testAudio.pause()
      
      this.unlocked = true
      console.log('[XiaomiAudioUnlocker] 方法2 成功')
      return true
    } catch (error) {
      console.warn('[XiaomiAudioUnlocker] 方法2 失败:', error)
    }

    // 方法3: 多个音频并行解锁
    try {
      const audioPromises = []
      
      for (let i = 0; i < 3; i++) {
        const audio = new Audio()
        audio.src = `data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAKGF0YQAAAAA=${i}`
        audio.volume = 0.01
        audioPromises.push(audio.play().catch(() => {}))
      }
      
      await Promise.all(audioPromises)
      this.unlocked = true
      console.log('[XiaomiAudioUnlocker] 方法3 成功')
      return true
    } catch (error) {
      console.warn('[XiaomiAudioUnlocker] 方法3 失败:', error)
    }

    return false
  }

  /**
   * 显示解锁提示（需要用户点击）
   */
  async showUnlockPrompt() {
    if (this.unlocked) {
      return true
    }

    return new Promise((resolve) => {
      const button = this.createUnlockButton()
      
      const handleClick = async () => {
        button.remove()
        document.removeEventListener('click', handleClick)
        
        // 尝试解锁
        const success = await this.forceUnlock()
        
        if (success) {
          // 显示成功提示
          this.showSuccessMessage()
          resolve(true)
        } else {
          // 显示失败提示
          this.showFailureMessage()
          resolve(false)
        }
      }

      button.addEventListener('click', handleClick)
      document.body.appendChild(button)

      // 5秒后自动隐藏
      setTimeout(() => {
        if (document.body.contains(button)) {
          button.remove()
          document.removeEventListener('click', handleClick)
          resolve(false)
        }
      }, 5000)
    })
  }

  /**
   * 显示成功消息
   */
  showSuccessMessage() {
    const message = document.createElement('div')
    message.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        font-weight: bold;
        box-shadow: 0 5px 20px rgba(76, 175, 80, 0.3);
      ">
        ✅ 音频权限已激活，现在可以正常播放语音了！
      </div>
    `
    document.body.appendChild(message)
    setTimeout(() => message.remove(), 3000)
  }

  /**
   * 显示失败消息
   */
  showFailureMessage() {
    const message = document.createElement('div')
    message.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ff5722;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        font-weight: bold;
        box-shadow: 0 5px 20px rgba(255, 87, 34, 0.3);
      ">
        ⚠️ 音频权限激活失败，将使用备选方案
      </div>
    `
    document.body.appendChild(message)
    setTimeout(() => message.remove(), 3000)
  }

  /**
   * 自动尝试解锁（在页面加载时调用）
   */
  async autoUnlock() {
    if (!this.isXiaomiDevice()) {
      return true // 非小米设备不需要特殊处理
    }

    console.log('[XiaomiAudioUnlocker] 检测到小米设备，尝试自动解锁音频')

    // 延迟执行，确保页面加载完成
    setTimeout(async () => {
      const success = await this.forceUnlock()
      if (!success) {
        console.warn('[XiaomiAudioUnlocker] 自动解锁失败，可能需要用户交互')
      }
    }, 1000)

    return this.unlocked
  }

  /**
   * 检查解锁状态
   */
  isUnlocked() {
    return this.unlocked
  }

  /**
   * 获取解锁器状态
   */
  getStatus() {
    return {
      isXiaomi: this.isXiaomiDevice(),
      unlocked: this.unlocked,
      audioContext: this.audioContext?.state || 'unavailable',
      webAudioSupported: 'AudioContext' in window || 'webkitAudioContext' in window
    }
  }
}

export default XiaomiAudioUnlocker