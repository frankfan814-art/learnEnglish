/**
 * 简易语音合成器
 * 使用 Web Audio API 直接合成语音，绕过浏览器 TTS 限制
 */

class SimpleSpeechSynthesizer {
  constructor() {
    this.audioContext = null
    this.isInitialized = false
    this.phonemeMap = this.createPhonemeMap()
  }

  /**
   * 创建音素映射
   */
  createPhonemeMap() {
    return {
      // 元音
      'a': { freq: 220, duration: 0.2, type: 'vowel' },
      'e': { freq: 330, duration: 0.15, type: 'vowel' },
      'i': { freq: 440, duration: 0.15, type: 'vowel' },
      'o': { freq: 260, duration: 0.2, type: 'vowel' },
      'u': { freq: 200, duration: 0.18, type: 'vowel' },
      
      // 辅音
      'b': { freq: 120, duration: 0.1, type: 'plosive' },
      'p': { freq: 100, duration: 0.08, type: 'plosive' },
      'd': { freq: 150, duration: 0.1, type: 'plosive' },
      't': { freq: 130, duration: 0.08, type: 'plosive' },
      'g': { freq: 110, duration: 0.12, type: 'plosive' },
      'k': { freq: 90, duration: 0.1, type: 'plosive' },
      
      'f': { freq: 3000, duration: 0.15, type: 'fricative' },
      's': { freq: 4000, duration: 0.12, type: 'fricative' },
      'h': { freq: 2000, duration: 0.08, type: 'fricative' },
      'v': { freq: 2500, duration: 0.15, type: 'fricative' },
      'z': { freq: 3500, duration: 0.12, type: 'fricative' },
      
      'm': { freq: 180, duration: 0.15, type: 'nasal' },
      'n': { freq: 160, duration: 0.14, type: 'nasal' },
      'l': { freq: 350, duration: 0.12, type: 'liquid' },
      'r': { freq: 280, duration: 0.1, type: 'liquid' },
      'w': { freq: 300, duration: 0.15, type: 'semivowel' },
      'y': { freq: 450, duration: 0.12, type: 'semivowel' }
    }
  }

  /**
   * 初始化音频上下文
   */
  initAudioContext() {
    if (this.isInitialized) return true

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      
      this.isInitialized = true
      console.log('[SimpleSpeech] 音频上下文初始化成功')
      return true
    } catch (error) {
      console.error('[SimpleSpeech] 音频上下文初始化失败:', error)
      return false
    }
  }

  /**
   * 将单词分解为音素序列
   */
  wordToPhonemes(word) {
    // 简化的音素分解规则
    const phonemeRules = {
      // 单字母元音
      'a': ['a'], 'e': ['e'], 'i': ['i'], 'o': ['o'], 'u': ['u'],
      
      // 双字母元音
      'ai': ['a', 'i'], 'ei': ['e', 'i'], 'oi': ['o', 'i'],
      'au': ['a', 'u'], 'ou': ['o', 'u'], 'ea': ['e', 'a'],
      'ee': ['i', 'i'], 'oo': ['u', 'u'],
      
      // 辅音组合
      'ch': ['t', 'sh'], 'sh': ['sh'], 'th': ['t', 'h'],
      'ph': ['f'], 'wh': ['w', 'h'], 'ng': ['n', 'g'],
      
      // 默认处理
      'default': (char) => [char.toLowerCase()]
    }

    const phonemes = []
    const wordLower = word.toLowerCase()
    let i = 0
    
    while (i < wordLower.length) {
      let matched = false
      
      // 尝试匹配双字母组合
      if (i < wordLower.length - 1) {
        const twoChars = wordLower.substr(i, 2)
        if (phonemeRules[twoChars]) {
          phonemes.push(...phonemeRules[twoChars])
          i += 2
          matched = true
        }
      }
      
      // 尝试匹配单字母
      if (!matched && phonemeRules[wordLower[i]]) {
        phonemes.push(...phonemeRules[wordLower[i]])
        i += 1
        matched = true
      }
      
      // 默认处理
      if (!matched) {
        phonemes.push(...phonemeRules.default(wordLower[i]))
        i += 1
      }
    }
    
    console.log(`[SimpleSpeech] "${word}" 分解为音素:`, phonemes)
    return phonemes
  }

  /**
   * 生成音素音频
   */
  generatePhonemeAudio(phoneme, startTime) {
    const phonemeInfo = this.phonemeMap[phoneme]
    if (!phonemeInfo) {
      console.warn(`[SimpleSpeech] 未知音素: ${phoneme}`)
      return null
    }

    const { freq, duration, type } = phonemeInfo
    
    // 创建振荡器
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    // 根据音素类型设置波形
    switch (type) {
      case 'vowel':
        oscillator.type = 'sine'
        break
      case 'plosive':
        oscillator.type = 'square'
        break
      case 'fricative':
        oscillator.type = 'sawtooth'
        break
      case 'nasal':
        oscillator.type = 'triangle'
        break
      case 'liquid':
      case 'semivowel':
        oscillator.type = 'sine'
        break
      default:
        oscillator.type = 'sine'
    }
    
    // 设置频率和包络
    oscillator.frequency.setValueAtTime(freq, startTime)
    
    // 音量包络
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01) // 快速起音
    gainNode.gain.setValueAtTime(0.3, startTime + duration * 0.8) // 持续音量
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration) // 快速衰减
    
    return { oscillator, gainNode, endTime: startTime + duration }
  }

  /**
   * 合成单词音频
   */
  synthesizeWord(word) {
    if (!this.initAudioContext()) {
      throw new Error('音频上下文初始化失败')
    }

    console.log(`[SimpleSpeech] 开始合成单词: "${word}"`)
    
    const phonemes = this.wordToPhonemes(word)
    const audioNodes = []
    let currentTime = this.audioContext.currentTime
    
    // 为每个音素生成音频
    phonemes.forEach(phoneme => {
      const audioNode = this.generatePhonemeAudio(phoneme, currentTime)
      if (audioNode) {
        audioNodes.push(audioNode)
        currentTime = audioNode.endTime + 0.02 // 音素间隔
      }
    })
    
    // 启动所有振荡器
    audioNodes.forEach(({ oscillator, endTime }) => {
      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(endTime)
    })
    
    return {
      duration: currentTime - this.audioContext.currentTime,
      nodes: audioNodes
    }
  }

  /**
   * 播放单词
   */
  async speak(text) {
    console.log(`[SimpleSpeech] 开始播放: "${text}"`)
    
    const words = text.trim().split(/\s+/)
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      
      try {
        const { duration } = this.synthesizeWord(word)
        
        // 等待当前单词播放完成
        await new Promise(resolve => setTimeout(resolve, duration * 1000))
        
        // 单词间间隔
        if (i < words.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
      } catch (error) {
        console.error(`[SimpleSpeech] 单词 "${word}" 合成失败:`, error)
      }
    }
    
    console.log('[SimpleSpeech] 播放完成')
  }

  /**
   * 快速播放单个单词（用于学习应用）
   */
  async speakWord(word) {
    console.log(`[SimpleSpeech] 快速播放单词: "${word}"`)
    
    if (!this.initAudioContext()) {
      throw new Error('音频上下文初始化失败')
    }

    try {
      const { duration } = this.synthesizeWord(word)
      await new Promise(resolve => setTimeout(resolve, duration * 1000))
      console.log('[SimpleSpeech] 单词播放完成')
      return true
    } catch (error) {
      console.error('[SimpleSpeech] 单词播放失败:', error)
      throw error
    }
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      audioContextState: this.audioContext?.state || 'unavailable',
      webAudioSupported: 'AudioContext' in window || 'webkitAudioContext' in window,
      phonemeCount: Object.keys(this.phonemeMap).length
    }
  }

  /**
   * 停止播放
   */
  stop() {
    // 创建新的音频上下文来停止所有声音
    if (this.audioContext) {
      try {
        this.audioContext.close()
      } catch (e) {}
      this.isInitialized = false
      this.initAudioContext()
    }
  }
}

export default SimpleSpeechSynthesizer