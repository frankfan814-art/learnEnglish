/**
 * 调试工具管理
 * 开发环境自动加载 vConsole，生产环境可通过特殊方式启用
 */

class DebugManager {
  constructor() {
    this.vConsole = null
    this.isLoaded = false
    this.isEnabled = false
  }

  /**
   * 初始化调试工具
   */
  async init() {
    // 开发环境自动加载
    if (this.isDevelopment()) {
      await this.loadVConsole()
    }

    // 生产环境检查特殊启用条件
    if (!this.isDevelopment()) {
      this.checkProductionEnable()
    }
  }

  /**
   * 检查是否为开发环境
   */
  isDevelopment() {
    return import.meta.env.DEV || 
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('192.168.')
  }

  /**
   * 加载 vConsole
   */
  async loadVConsole() {
    if (this.isLoaded) return

    try {
      const { default: VConsole } = await import('vconsole')
      
      this.vConsole = new VConsole({
        target: document.body,
        defaultPlugins: ['system', 'network', 'element', 'storage'],
        theme: 'dark',
        log: {
          maxLogNumber: 1000
        },
        onReady: () => {
          console.log('🎉 vConsole 已初始化')
          console.log('📱 移动端可以查看控制台日志')
          console.log('💡 开发环境已自动启用调试工具')
          this.isLoaded = true
          this.isEnabled = true
        }
      })

      // 添加自定义插件
      this.addCustomPlugins()

    } catch (error) {
      console.error('vConsole 加载失败:', error)
    }
  }

  /**
   * 添加自定义插件
   */
  addCustomPlugins() {
    if (!this.vConsole) return

    // 添加语音测试插件
    const voicePlugin = {
      id: 'voice_test',
      name: 'Voice Test',
      render: () => {
        const panel = document.createElement('div')
        panel.innerHTML = `
          <div style="padding: 10px;">
            <h4>🔊 语音测试</h4>
            <input type="text" id="vc-voice-text" placeholder="输入测试文本" value="Hello world" style="width: 100%; margin: 5px 0; padding: 5px;">
            <button id="vc-voice-test" style="width: 100%; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px;">测试语音</button>
            <button id="vc-voice-info" style="width: 100%; padding: 8px; margin-top: 5px; background: #28a745; color: white; border: none; border-radius: 4px;">语音系统信息</button>
          </div>
        `
        
        // 绑定事件
        setTimeout(() => {
          const testBtn = document.getElementById('vc-voice-test')
          const infoBtn = document.getElementById('vc-voice-info')
          const textInput = document.getElementById('vc-voice-text')
          
          if (testBtn && infoBtn && textInput) {
            testBtn.onclick = () => this.testVoice(textInput.value)
            infoBtn.onclick = () => this.showVoiceInfo()
          }
        }, 100)

        return panel
      }
    }

    this.vConsole.addPlugin(voicePlugin)
  }

  /**
   * 测试语音播放
   */
  testVoice(text) {
    console.log('🔊 vConsole 语音测试:', text)
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1
      
      utterance.onstart = () => console.log('✅ 语音开始播放')
      utterance.onend = () => console.log('✅ 语音播放完成')
      utterance.onerror = (e) => console.error('❌ 语音播放失败:', e)
      
      window.speechSynthesis.speak(utterance)
    } else {
      console.error('❌ 浏览器不支持 Web Speech API')
    }
  }

  /**
   * 显示语音系统信息
   */
  showVoiceInfo() {
    const info = {
      speechSynthesis: 'speechSynthesis' in window,
      voices: window.speechSynthesis?.getVoices().length || 0,
      audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    }
    
    console.log('🎤 语音系统信息:', info)
    
    // 显示可用语音
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices()
      console.log('🔊 可用语音列表:')
      voices.forEach((voice, index) => {
        if (voice.lang.startsWith('en')) {
          console.log(`${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`)
        }
      })
    }
  }

  /**
   * 检查生产环境启用条件
   */
  checkProductionEnable() {
    // 检查 URL 参数
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('debug') || urlParams.has('vconsole')) {
      this.loadVConsole()
      return
    }

    // 检查本地存储
    const enableDebug = localStorage.getItem('app_debug_enabled')
    if (enableDebug === 'true') {
      this.loadVConsole()
      return
    }

    // 检查特殊手势（连续点击5次logo）
    this.setupDebugGesture()
  }

  /**
   * 设置调试手势（连续点击5次logo）
   */
  setupDebugGesture() {
    let clickCount = 0
    let lastClickTime = 0
    
    const handleLogoClick = () => {
      const now = Date.now()
      
      // 重置计数器（超过2秒）
      if (now - lastClickTime > 2000) {
        clickCount = 0
      }
      
      clickCount++
      lastClickTime = now
      
      console.log(`📱 Logo 点击次数: ${clickCount}`)
      
      if (clickCount >= 5) {
        console.log('🎉 触发调试模式')
        this.loadVConsole()
        localStorage.setItem('app_debug_enabled', 'true')
        clickCount = 0
      }
    }

    // 查找 logo 或标题元素
    setTimeout(() => {
      const logo = document.querySelector('h1, .logo, .app-title, .word-text')
      if (logo) {
        logo.style.cursor = 'pointer'
        logo.addEventListener('click', handleLogoClick)
        console.log('👆 已为标题添加调试手势，连续点击5次启用调试')
      }
    }, 1000)
  }

  /**
   * 手动启用调试
   */
  enable() {
    this.loadVConsole()
    localStorage.setItem('app_debug_enabled', 'true')
  }

  /**
   * 禁用调试
   */
  disable() {
    if (this.vConsole) {
      this.vConsole.destroy()
      this.vConsole = null
      this.isEnabled = false
    }
    localStorage.removeItem('app_debug_enabled')
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      isLoaded: this.isLoaded,
      isEnabled: this.isEnabled,
      isDevelopment: this.isDevelopment()
    }
  }
}

// 创建全局实例
const debugManager = new DebugManager()

export default debugManager