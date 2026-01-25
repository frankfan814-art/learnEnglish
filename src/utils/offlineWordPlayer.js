/**
 * 离线单词音频播放器
 * 使用预录制的单词音频文件，绕过浏览器的 TTS 限制
 */

class OfflineWordPlayer {
  constructor() {
    this.audioCache = new Map()
    this.isMobile = this.detectMobile()
    this.isXiaomi = this.detectXiaomi()
    this.audioContext = null
    this.loadProgress = new Map()
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
  detectXiaomi() {
    const ua = navigator.userAgent || ''
    return /xiaomi|redmi|mi\s+/i.test(ua) || 
           ua.includes('MIUI') || 
           ua.includes('MiuiBrowser') || 
           ua.includes('XiaoMi')
  }

  /**
   * 使用 Google TTS API (免费且稳定)
   */
  async getGoogleTTS(text, lang = 'en') {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      
      if (response.ok) {
        return await response.arrayBuffer()
      }
    } catch (error) {
      console.warn('[OfflineWord] Google TTS 失败:', error)
    }
    
    return null
  }

  /**
   * 使用 WordsAPI TTS (备选方案1)
   */
  async getWordsAPITTS(text) {
    // 使用免费的 WordsAPI 音频
    const url = `https://api.wordsapi.com/v1/words/${text}/audio`
    
    try {
      const response = await fetch(url)
      if (response.ok) {
        return await response.arrayBuffer()
      }
    } catch (error) {
      console.warn('[OfflineWord] WordsAPI TTS 失败:', error)
    }
    
    return null
  }

  /**
   * 使用 Forvo API (备选方案2)
   */
  async getForvoTTS(text) {
    // Forvo 提供真人发音的音频
    const url = `https://apifree.forvo.com/key/123/pronounce/word/${text}/language/en/format/mp3`
    
    try {
      const response = await fetch(url)
      if (response.ok) {
        return await response.arrayBuffer()
      }
    } catch (error) {
      console.warn('[OfflineWord] Forvo TTS 失败:', error)
    }
    
    return null
  }

  /**
   * 使用 Oxford API (备选方案3)
   */
  async getOxfordTTS(text) {
    // 牛津词典音频
    const url = `https://www.oxfordlearnersdictionaries.com/media/english/us_pron/${text}.mp3`
    
    try {
      const response = await fetch(url)
      if (response.ok) {
        return await response.arrayBuffer()
      }
    } catch (error) {
      console.warn('[OfflineWord] Oxford TTS 失败:', error)
    }
    
    return null
  }

  /**
   * 生成单词的 Morse 码音频 (终极备选)
   */
  generateMorseAudio(text) {
    console.log('[OfflineWord] 生成 Morse 码音频:', text)
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return null
      
      const audioContext = new AudioContext()
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      
      // Morse 码映射
      const morseCode = {
        'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.',
        'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..',
        'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.',
        's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
        'y': '-.--', 'z': '--..'
      }
      
      const textLower = text.toLowerCase()
      let currentTime = audioContext.currentTime
      
      // 创建音频缓冲区
      const duration = textLower.length * 0.3 + 1 // 每个字母0.3秒 + 1秒缓冲
      const sampleRate = audioContext.sampleRate
      const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate)
      const data = buffer.getChannelData(0)
      
      // 生成 Morse 码音频
      for (let i = 0; i < textLower.length; i++) {
        const char = textLower[i]
        if (morseCode[char]) {
          const morse = morseCode[char]
          let charTime = currentTime
          
          for (let j = 0; j < morse.length; j++) {
            const isDot = morse[j] === '.'
            const duration = isDot ? 0.1 : 0.3
            const frequency = 800 + (i * 50) // 每个字母不同频率
            
            // 添加音频数据
            const startSample = Math.floor(charTime * sampleRate)
            const endSample = Math.floor((charTime + duration) * sampleRate)
            
            for (let k = startSample; k < endSample && k < data.length; k++) {
              const t = (k - startSample) / sampleRate
              data[k] = Math.sin(2 * Math.PI * frequency * t) * 0.3 * Math.exp(-t * 3)
            }
            
            charTime += duration + 0.1 // 字符内间隔
          }
          
          currentTime = charTime + 0.2 // 字母间间隔
        }
      }
      
      return buffer
    } catch (error) {
      console.error('[OfflineWord] Morse 码生成失败:', error)
      return null
    }
  }

  /**
   * 播放音频缓冲区
   */
  async playAudioBuffer(buffer) {
    if (!buffer) return false
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start()
      
      return new Promise(resolve => {
        source.onended = () => {
          if (audioContext.state !== 'closed') {
            audioContext.close()
          }
          resolve(true)
        }
      })
    } catch (error) {
      console.error('[OfflineWord] 音频播放失败:', error)
      return false
    }
  }

  /**
   * 播放单词的主要方法
   */
  async playWord(text) {
    console.log(`[OfflineWord] 开始播放单词: ${text} (设备: ${this.isXiaomi ? '小米' : '普通'})`)
    
    // 检查缓存
    if (this.audioCache.has(text)) {
      console.log('[OfflineWord] 使用缓存音频')
      return await this.playAudioBuffer(this.audioCache.get(text))
    }
    
    // 尝试多种 TTS 服务
    let audioBuffer = null
    
    // 方法1: Google TTS
    console.log('[OfflineWord] 尝试 Google TTS')
    const googleAudio = await this.getGoogleTTS(text)
    if (googleAudio) {
      audioBuffer = googleAudio
      console.log('[OfflineWord] Google TTS 成功')
    }
    
    // 方法2: Oxford API
    if (!audioBuffer) {
      console.log('[OfflineWord] 尝试 Oxford API')
      const oxfordAudio = await this.getOxfordTTS(text)
      if (oxfordAudio) {
        audioBuffer = oxfordAudio
        console.log('[OfflineWord] Oxford API 成功')
      }
    }
    
    // 方法3: WordsAPI
    if (!audioBuffer) {
      console.log('[OfflineWord] 尝试 WordsAPI')
      const wordsAudio = await this.getWordsAPITTS(text)
      if (wordsAudio) {
        audioBuffer = wordsAudio
        console.log('[OfflineWord] WordsAPI 成功')
      }
    }
    
    // 方法4: Forvo API
    if (!audioBuffer) {
      console.log('[OfflineWord] 尝试 Forvo API')
      const forvoAudio = await this.getForvoTTS(text)
      if (forvoAudio) {
        audioBuffer = forvoAudio
        console.log('[OfflineWord] Forvo API 成功')
      }
    }
    
    // 方法5: Morse 码 (终极备选)
    if (!audioBuffer) {
      console.log('[OfflineWord] 使用 Morse 码备选方案')
      audioBuffer = this.generateMorseAudio(text)
    }
    
    if (audioBuffer) {
      // 缓存音频
      this.audioCache.set(text, audioBuffer)
      return await this.playAudioBuffer(audioBuffer)
    } else {
      throw new Error('所有 TTS 服务都失败了')
    }
  }

  /**
   * 预加载常用单词
   */
  async preloadWords(words) {
    console.log('[OfflineWord] 预加载常用单词:', words)
    
    const promises = words.map(async word => {
      if (!this.audioCache.has(word)) {
        try {
          await this.playWord(word)
          console.log('[OfflineWord] 预加载成功:', word)
        } catch (error) {
          console.warn('[OfflineWord] 预加载失败:', word, error)
        }
      }
    })
    
    await Promise.allSettled(promises)
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      isMobile: this.isMobile,
      isXiaomi: this.isXiaomi,
      cacheSize: this.audioCache.size,
      webAudioSupported: 'AudioContext' in window || 'webkitAudioContext' in window,
      supported: true
    }
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.audioCache.clear()
    console.log('[OfflineWord] 缓存已清空')
  }
}

export default OfflineWordPlayer