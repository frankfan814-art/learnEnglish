/**
 * 语音合成工具
 * 使用浏览器原生 Web Speech API，优化参数提升发音质量
 */

export class SpeechManager {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null
    this.voiceType = 'US' // 'US' for American, 'UK' for British
    this.rate = 0.9 // 稍慢一点，更清晰
    this.pitch = 1.0
    this.voices = []

    // 加载可用语音
    if (this.synth) {
      this.loadVoices()
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices()
      }
    }
  }

  /**
   * 加载可用语音列表
   */
  loadVoices() {
    if (!this.synth) return
    this.voices = this.synth.getVoices()
  }

  /**
   * 等待语音列表加载完成
   */
  async ensureVoicesLoaded(timeout = 1000) {
    if (!this.synth) return
    if (this.voices.length > 0) return

    await new Promise((resolve) => {
      let settled = false

      const finish = () => {
        if (settled) return
        settled = true
        if (this.synth && this.synth.removeEventListener) {
          this.synth.removeEventListener('voiceschanged', handleChange)
        }
        resolve()
      }

      const handleChange = () => {
        this.loadVoices()
        finish()
      }

      this.loadVoices()

      if (this.voices.length > 0) {
        finish()
        return
      }

      if (this.synth && this.synth.addEventListener) {
        this.synth.addEventListener('voiceschanged', handleChange)
      }

      setTimeout(finish, timeout)
    })
  }

  /**
   * 获取最佳语音（优先选择高质量语音）
   */
  getBestVoice(type = 'US') {
    const langCode = type === 'US' ? 'en-US' : 'en-GB'

    // 高质量语音列表（按优先级排序）
    const preferredVoices = [
      // Google 高质量语音
      'Google US English',
      'Google UK English Male',
      'Google UK English Female',
      // Microsoft 高质量语音
      'Microsoft David',
      'Microsoft Zira',
      'Microsoft Hazel',
      'Apple 高质量语音',
      'Samantha',
      'Daniel',
      'Karen',
      'Moira',
    ]

    // 首先尝试精确匹配语言
    let voices = this.voices.filter(v => v.lang === langCode)

    // 按首选列表排序
    for (const preferred of preferredVoices) {
      const found = voices.find(v => v.name.includes(preferred))
      if (found) return found
    }

    // 如果没有精确匹配，使用任何英语语音
    if (voices.length === 0) {
      voices = this.voices.filter(v => v.lang && v.lang.startsWith('en'))
    }

    // 返回第一个可用的
    return voices[0] || this.voices[0]
  }

  /**
   * 通用发音方法
   */
  async speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('当前浏览器不支持语音合成'))
        return
      }

      // 取消当前正在播放的语音
      this.synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)

      // 优化参数设置
      utterance.rate = options.rate || this.rate
      utterance.pitch = options.pitch || this.pitch
      utterance.volume = 1.0

      // 设置语音
      const setVoice = () => {
        const voice = this.getBestVoice(options.voiceType || this.voiceType)
        if (voice) {
          utterance.voice = voice
          console.log('使用语音:', voice.name, voice.lang)
        }
      }

      utterance.onend = () => resolve()
      utterance.onerror = (event) => {
        console.error('语音播放错误:', event.error)
        reject(new Error(event.error))
      }

      // 确保语音列表已加载
      this.ensureVoicesLoaded()
        .catch(() => {})
        .finally(() => {
          setVoice()
          this.synth.speak(utterance)
        })
    })
  }

  /**
   * 播放单个单词
   */
  speakWord(word) {
    return this.speak(word)
  }

  /**
   * 播放句子
   */
  speakSentence(sentence) {
    // 句子使用稍慢的语速，更清晰
    return this.speak(sentence, { rate: 0.85 })
  }

  /**
   * 设置语音类型
   */
  setVoiceType(type) {
    this.voiceType = type
  }

  /**
   * 设置语速
   */
  setRate(rate) {
    this.rate = Math.max(0.1, Math.min(2, rate))
  }

  /**
   * 设置音调
   */
  setPitch(pitch) {
    this.pitch = Math.max(0, Math.min(2, pitch))
  }

  /**
   * 停止播放
   */
  stop() {
    if (this.synth) this.synth.cancel()
  }

  /**
   * 暂停播放
   */
  pause() {
    if (this.synth) this.synth.pause()
  }

  /**
   * 恢复播放
   */
  resume() {
    if (this.synth) this.synth.resume()
  }

  /**
   * 检查是否正在播放
   */
  isSpeaking() {
    return this.synth?.speaking || false
  }

  /**
   * 检查是否已暂停
   */
  isPaused() {
    return this.synth?.paused || false
  }

  /**
   * 获取所有可用英语语音
   */
  getAvailableVoices() {
    return this.voices.filter(voice => voice.lang && voice.lang.startsWith('en'))
  }
}

// 创建全局语音管理实例
export const speechManager = new SpeechManager()

/**
 * 发音组件使用的快捷方法
 */
export const playWordAudio = (word, voiceType = 'US') => {
  return speechManager.speak(word, { voiceType })
}

export const playSentenceAudio = (sentence, voiceType = 'US') => {
  return speechManager.speakSentence(sentence, voiceType)
}

export const stopAudio = () => {
  speechManager.stop()
}
