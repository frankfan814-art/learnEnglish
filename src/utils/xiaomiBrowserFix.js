/**
 * 小米浏览器语音播放修复方案
 * 核心问题：小米浏览器需要用户明确交互才能播放音频
 *
 * 解决方案：
 * 1. 在页面加载时显示"启用语音"按钮
 * 2. 用户点击后解锁音频权限
 * 3. 使用多种备选方案确保能听到声音
 */

class XiaomiBrowserFix {
  constructor() {
    this.isXiaomi = this.detectXiaomi()
    this.audioUnlocked = false
    this.userInteracted = false
    this.initAttempted = false
  }

  /**
   * 检测小米设备
   */
  detectXiaomi() {
    const ua = navigator.userAgent || ''
    return /xiaomi|redmi|mi\s+/i.test(ua) ||
           ua.includes('MIUI') ||
           ua.includes('MiuiBrowser') ||
           ua.includes('XiaoMi')
  }

  /**
   * 检测是否需要修复
   */
  needsFix() {
    return this.isXiaomi
  }

  /**
   * 初始化修复（在页面加载时调用）
   */
  async init() {
    if (this.initAttempted) return
    this.initAttempted = true

    if (!this.isXiaomi) {
      console.log('[XiaomiFix] 非小米设备，跳过修复')
      return true
    }

    console.log('[XiaomiFix] 检测到小米设备，初始化语音修复')

    // 监听用户交互
    this.setupInteractionListeners()

    // 延迟显示启用按钮（给用户1秒时间看页面）
    setTimeout(() => {
      if (!this.userInteracted) {
        this.showEnableButton()
      }
    }, 1500)

    return true
  }

  /**
   * 设置用户交互监听器
   */
  setupInteractionListeners() {
    const events = ['click', 'touchstart', 'keydown', 'scroll']

    const handleInteraction = async () => {
      if (!this.userInteracted) {
        this.userInteracted = true
        console.log('[XiaomiFix] 检测到用户交互')

        // 尝试解锁音频
        if (!this.audioUnlocked) {
          await this.unlockAudio()
        }

        // 移除启用按钮（如果存在）
        this.removeEnableButton()
      }

      // 移除事件监听器
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction)
      })
    }

    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true })
    })
  }

  /**
   * 解锁音频权限
   */
  async unlockAudio() {
    if (this.audioUnlocked) return true

    console.log('[XiaomiFix] 开始解锁音频权限')

    try {
      // 方法1: AudioContext 解锁
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        const ctx = new AudioContext()

        if (ctx.state === 'suspended') {
          await ctx.resume()
          console.log('[XiaomiFix] AudioContext 已恢复')
        }

        // 播放一个微弱的测试音来激活音频
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.type = 'sine'

        gain.gain.setValueAtTime(0.001, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1)

        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.1)

        // 等待音频播放完成
        await new Promise(resolve => setTimeout(resolve, 150))

        if (ctx.state !== 'closed') {
          await ctx.close()
        }

        console.log('[XiaomiFix] 测试音频播放成功')
      }

      // 方法2: HTML5 Audio 解锁
      const testAudio = new Audio()
      testAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAKGF0YQAAAAA='
      testAudio.volume = 0.001

      try {
        await testAudio.play()
        testAudio.pause()
        console.log('[XiaomiFix] HTML5 Audio 解锁成功')
      } catch (e) {
        console.warn('[XiaomiFix] HTML5 Audio 解锁失败:', e)
      }

      this.audioUnlocked = true
      console.log('[XiaomiFix] 音频权限解锁成功')

      // 显示成功提示
      this.showSuccessToast()

      return true
    } catch (error) {
      console.error('[XiaomiFix] 音频解锁失败:', error)
      return false
    }
  }

  /**
   * 显示启用语音按钮
   */
  showEnableButton() {
    // 移除已存在的按钮
    this.removeEnableButton()

    const button = document.createElement('div')
    button.id = 'xiaomi-audio-enable-btn'
    button.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 25px 35px;
        border-radius: 20px;
        text-align: center;
        z-index: 99999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        animation: xiaomiPulse 2s ease-in-out infinite;
      ">
        <div style="font-size: 32px; margin-bottom: 10px;">🎵</div>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">点击启用语音播放</div>
        <div style="font-size: 13px; opacity: 0.9;">小米浏览器需要您手动激活音频权限</div>
      </div>
      <style>
        @keyframes xiaomiPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
        }
      </style>
    `

    button.addEventListener('click', async () => {
      this.userInteracted = true
      await this.unlockAudio()
      this.removeEnableButton()
    })

    document.body.appendChild(button)

    // 10秒后自动消失
    setTimeout(() => {
      if (document.body.contains(button)) {
        button.remove()
      }
    }, 10000)
  }

  /**
   * 移除启用按钮
   */
  removeEnableButton() {
    const existingBtn = document.getElementById('xiaomi-audio-enable-btn')
    if (existingBtn) {
      existingBtn.remove()
    }
  }

  /**
   * 显示成功提示
   */
  showSuccessToast() {
    const toast = document.createElement('div')
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        z-index: 99999;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
        animation: slideDown 0.3s ease-out;
      ">
        ✅ 语音功能已启用
      </div>
      <style>
        @keyframes slideDown {
          from { top: -50px; opacity: 0; }
          to { top: 20px; opacity: 1; }
        }
      </style>
    `

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 2500)
  }

  /**
   * 播放测试音频（用于验证）
   */
  async playTest() {
    console.log('[XiaomiFix] 播放测试音频')

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioContext()

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      // 创建一个明显的提示音
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
      osc.type = 'sine'

      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05)
      gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.2)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)

      return new Promise((resolve) => {
        setTimeout(() => {
          if (ctx.state !== 'closed') {
            ctx.close()
          }
          resolve(true)
        }, 500)
      })
    } catch (error) {
      console.error('[XiaomiFix] 测试音频播放失败:', error)
      return false
    }
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      isXiaomi: this.isXiaomi,
      audioUnlocked: this.audioUnlocked,
      userInteracted: this.userInteracted,
      initAttempted: this.initAttempted,
      needsFix: this.needsFix()
    }
  }
}

// 导出单例
const xiaomiBrowserFix = new XiaomiBrowserFix()

export default xiaomiBrowserFix
