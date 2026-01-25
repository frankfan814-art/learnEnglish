/**
 * 语音合成工具 - 改进版
 * 支持多种播放方式和降级策略，针对移动端优化
 */

// 播放器实例
let audioRef = null
let audioElementRef = null
let audioUnlocked = false

// 检测浏览器能力
const detectCapabilities = () => {
  const ua = navigator.userAgent || ''
  const isAndroid = /Android/i.test(ua)
  const isXiaomi = /xiaomi|redmi|mi\s+/i.test(ua)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)

  // 检测音频格式支持
  const audio = document.createElement('audio')
  const supportsMP3 = !!(audio.canPlayType && audio.canPlayType('audio/mpeg').replace(/no/, ''))
  const supportsWAV = !!(audio.canPlayType && audio.canPlayType('audio/wav').replace(/no/, ''))
  const supportsWebM = !!(audio.canPlayType && audio.canPlayType('audio/webm').replace(/no/, ''))

  return {
    isAndroid,
    isXiaomi,
    isMobile,
    supportsMP3,
    supportsWAV,
    supportsWebM
  }
}

const caps = detectCapabilities()

/**
 * 解锁移动端音频播放（需在用户交互事件中调用）
 */
const unlockAudio = async () => {
  if (!caps.isMobile) {
    return true
  }

  // 优先使用 Web Audio 解锁
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      const ctx = new AudioContextClass()
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(0)
      source.stop(0)
      if (ctx.state !== 'closed') {
        await ctx.close()
      }
      return true
    }
  } catch (error) {
    console.warn('[TTS] Web Audio 解锁失败，尝试备用方案:', error)
  }

  // 备用：播放一段静音音频
  try {
    const silentAudio = document.createElement('audio')
    silentAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='
    silentAudio.muted = true
    silentAudio.setAttribute('webkit-playsinline', 'true')
    silentAudio.setAttribute('playsinline', 'true')
    const playPromise = silentAudio.play()
    if (playPromise !== undefined) {
      await playPromise.catch(() => {})
    }
    silentAudio.pause()
    silentAudio.remove()
    return true
  } catch (error) {
    console.warn('[TTS] 静音音频解锁失败:', error)
  }

  return false
}

/**
 * 清理音频资源
 */
const cleanup = () => {
  if (audioRef) {
    audioRef.pause()
    audioRef = null
  }
  if (audioElementRef) {
    audioElementRef.pause()
    audioElementRef.src = ''
    audioElementRef.load()
    audioElementRef.remove()
    audioElementRef = null
  }
}

/**
 * 播放方式 1: 使用 Blob URL (适用于大多数现代浏览器)
 */
const playWithBlob = async (audioBuffer, mimeType) => {
  return new Promise((resolve, reject) => {
    try {
      cleanup()

      const audioBlob = new Blob([audioBuffer], { type: mimeType })
      const audioUrl = URL.createObjectURL(audioBlob)

      audioRef = new Audio(audioUrl)
      audioRef.preload = 'auto'
      audioRef.setAttribute('webkit-playsinline', 'true')
      audioRef.setAttribute('playsinline', 'true')

      audioRef.onended = () => {
        URL.revokeObjectURL(audioUrl)
        audioRef = null
        resolve()
      }

      audioRef.onerror = (e) => {
        URL.revokeObjectURL(audioUrl)
        audioRef = null
        reject(new Error('Blob Audio 播放失败'))
      }

      audioRef.play().catch((err) => {
        URL.revokeObjectURL(audioUrl)
        audioRef = null
        reject(err)
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 播放方式 2: 使用 Data URL (兼容性更好)
 */
const playWithDataURL = async (audioBuffer, mimeType) => {
  return new Promise((resolve, reject) => {
    try {
      cleanup()

      // 将 ArrayBuffer 转换为 base64
      const uint8Array = new Uint8Array(audioBuffer)
      let binary = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i])
      }
      const base64 = btoa(binary)
      const dataUrl = `data:${mimeType};base64,${base64}`

      audioRef = new Audio(dataUrl)
      audioRef.preload = 'auto'
      audioRef.setAttribute('webkit-playsinline', 'true')
      audioRef.setAttribute('playsinline', 'true')

      audioRef.onended = () => {
        audioRef = null
        resolve()
      }

      audioRef.onerror = () => {
        audioRef = null
        reject(new Error('Data URL Audio 播放失败'))
      }

      audioRef.play().catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 播放方式 3: 使用 HTML5 Audio 元素 (移动端兼容性最好)
 */
const playWithElement = async (audioBuffer, mimeType) => {
  return new Promise((resolve, reject) => {
    try {
      cleanup()

      // 移除旧的 audio 元素
      const oldElement = document.getElementById('tts-audio-element')
      if (oldElement) {
        oldElement.remove()
      }

      // 创建新的 audio 元素
      const audio = document.createElement('audio')
      audio.id = 'tts-audio-element'
      audio.style.display = 'none'

      // 使用 Data URL（更兼容）
      const uint8Array = new Uint8Array(audioBuffer)
      let binary = ''
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i])
      }
      const base64 = btoa(binary)
      const dataUrl = `data:${mimeType};base64,${base64}`

      audio.src = dataUrl
      audio.preload = 'auto'

      // 重要：设置移动端兼容属性
      audio.setAttribute('webkit-playsinline', 'true')
      audio.setAttribute('playsinline', 'true')

      audio.onended = () => {
        audioElementRef = null
        resolve()
      }

      audio.onerror = (e) => {
        console.error('Audio 元素播放错误:', e)
        audioElementRef = null
        reject(new Error('Audio 元素播放失败'))
      }

      document.body.appendChild(audio)
      audioElementRef = audio

      // 使用 play() 方法
      const playPromise = audio.play()

      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('播放被拒绝:', err)
          audioElementRef = null
          reject(err)
        })
      }
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 播放方式 4: 浏览器原生 Web Speech API (使用移动端修复器）
 */
const playWithWebSpeechAPI = async (text) => {
  try {
    // 动态导入移动端修复器
    const { default: MobileSpeechFixer } = await import('./mobileSpeechFixer.js')
    const speechFixer = new MobileSpeechFixer()
    
    console.log('[TTS] 使用移动端修复器播放:', text)
    
    // 使用移动端优化的语音播放
    const result = await speechFixer.speak(text, {
      lang: 'en-US',
      rate: 0.9,
      pitch: 1,
      volume: 1
    })
    
    console.log('[TTS] 移动端语音播放完成')
    return result
    
  } catch (error) {
    console.error('[TTS] 移动端修复器失败:', error)
    
    // 降级到基础实现
    return playWithBasicWebSpeechAPI(text)
  }
}

/**
 * 基础 Web Speech API 实现（备用方案）
 */
const playWithBasicWebSpeechAPI = (text) => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('浏览器不支持 Web Speech API'))
      return
    }

    console.log('[TTS] 使用基础 Web Speech API 播放:', text)

    // 取消当前播放
    window.speechSynthesis.cancel()

    // 确保语音服务已初始化
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) {
      // 有些浏览器需要等待 voices 加载
      setTimeout(() => {
        try {
          speakWithFallback(text, resolve, reject)
        } catch (error) {
          reject(error)
        }
      }, 100)
    } else {
      speakWithFallback(text, resolve, reject)
    }
  })
}

/**
 * 实际执行语音播放的函数，包含语音选择fallback
 */
const speakWithFallback = (text, resolve, reject) => {
  const utterance = new SpeechSynthesisUtterance(text)
  
  // 尝试设置合适的英文语音
  const voices = window.speechSynthesis.getVoices()
  const englishVoices = voices.filter(voice => 
    voice.lang.startsWith('en-') || 
    voice.lang.startsWith('en_')
  )
  
  if (englishVoices.length > 0) {
    // 优先使用美式英语
    const usVoice = englishVoices.find(voice => voice.lang.startsWith('en-US')) || englishVoices[0]
    utterance.voice = usVoice
    utterance.lang = usVoice.lang
    console.log('[TTS] 选择语音:', usVoice.name, usVoice.lang)
  } else {
    // fallback 到默认设置
    utterance.lang = 'en-US'
  }
  
  utterance.rate = 0.9
  utterance.pitch = 1
  utterance.volume = 1

  utterance.onend = () => {
    console.log('[TTS] Web Speech API 播放完成')
    resolve()
  }
  utterance.onerror = (e) => {
    console.error('[TTS] Web Speech API 错误:', e)
    console.error('[TTS] 错误详情:', e.error, e.message)
    reject(new Error('Web Speech API 播放失败: ' + (e.error || e.message)))
  }
  
  utterance.onstart = () => {
    console.log('[TTS] Web Speech API 开始播放')
  }

  // 清除之前的语音队列
  window.speechSynthesis.cancel()
  
  // 添加短暂延迟确保清理完成
  setTimeout(() => {
    try {
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('[TTS] speak 调用失败:', error)
      reject(error)
    }
  }, 50)
}

/**
 * 通用播放函数 - 尝试多种方式
 */
const playAudio = async (audioBuffer, mimeType = 'audio/mpeg') => {
  const errors = []

  if (caps.isMobile) {
    try {
      await playWithElement(audioBuffer, mimeType)
      return
    } catch (error) {
      errors.push(`Element方式: ${error.message}`)
      console.log('Audio 元素播放失败，尝试下一种方式')
    }
  }

  // 方式 1: Blob URL (最快，但兼容性可能有问题)
  if (!caps.isXiaomi) {
    try {
      await playWithBlob(audioBuffer, mimeType)
      return
    } catch (error) {
      errors.push(`Blob方式: ${error.message}`)
      console.log('Blob 播放失败，尝试下一种方式')
    }
  }

  // 方式 2: Data URL
  try {
    await playWithDataURL(audioBuffer, mimeType)
    return
  } catch (error) {
    errors.push(`DataURL方式: ${error.message}`)
    console.log('Data URL 播放失败，尝试下一种方式')
  }

  // 方式 3: HTML5 Audio 元素 (移动端兼容性最好)
  try {
    await playWithElement(audioBuffer, mimeType)
    return
  } catch (error) {
    errors.push(`Element方式: ${error.message}`)
    console.log('Audio 元素播放失败')
  }

  // 所有方式都失败
  throw new Error(`所有播放方式都失败: ${errors.join('; ')}`)
}

/**
 * 播放单词发音
 */
export const playWordAudio = async (word, voiceType = 'US') => {
  console.log(`[TTS] 播放单词: ${word}, 浏览器: ${caps.isAndroid ? 'Android' : 'Desktop'}${caps.isXiaomi ? ' (小米)' : ''}`)

  if (!word || typeof word !== 'string') {
    throw new Error('单词内容无效')
  }

  if (!audioUnlocked) {
    audioUnlocked = await unlockAudio()
  }

  const voice = voiceType === 'US' ? 'en-US-GuyNeural' : 'en-GB-SoniaNeural'

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: word, voice })
    })

    if (response.status === 418) {
      // 服务器要求降级到 Web Speech API
      throw new Error('服务器要求降级到 Web Speech API')
    }

    if (!response.ok) {
      throw new Error(`TTS 请求失败: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()

    // 小米设备使用 audio/mpeg
    const mimeType = caps.isXiaomi ? 'audio/mpeg' : 'audio/mpeg'

    await playAudio(arrayBuffer, mimeType)
  } catch (error) {
    console.error('Edge TTS 播放失败，尝试降级到 Web Speech API:', error)

    // 降级方案：使用浏览器原生 Web Speech API
    try {
      await playWithWebSpeechAPI(word)
      console.log('[TTS] Web Speech API 播放成功')
    } catch (fallbackError) {
      console.error('Web Speech API 也失败了:', fallbackError)
      throw new Error(`语音播放失败: ${error.message}`)
    }
  }
}

/**
 * 播放句子发音
 */
export const playSentenceAudio = async (sentence, voiceType = 'US') => {
  console.log(`[TTS] 播放句子, 浏览器: ${caps.isAndroid ? 'Android' : 'Desktop'}${caps.isXiaomi ? ' (小米)' : ''}`)

  if (!sentence || typeof sentence !== 'string') {
    throw new Error('句子内容无效')
  }

  if (!audioUnlocked) {
    audioUnlocked = await unlockAudio()
  }

  const voice = 'en-US-SarahNeural'

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sentence, voice, rate: '-5%' })
    })

    if (response.status === 418) {
      // 服务器要求降级到 Web Speech API
      throw new Error('服务器要求降级到 Web Speech API')
    }

    if (!response.ok) {
      throw new Error(`TTS 请求失败: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()

    const mimeType = caps.isXiaomi ? 'audio/mpeg' : 'audio/mpeg'

    await playAudio(arrayBuffer, mimeType)
  } catch (error) {
    console.error('Edge TTS 播放失败，尝试降级到 Web Speech API:', error)

    // 降级方案
    try {
      await playWithWebSpeechAPI(sentence)
      console.log('[TTS] Web Speech API 播放成功')
    } catch (fallbackError) {
      console.error('Web Speech API 也失败了:', fallbackError)
      throw new Error(`语音播放失败: ${error.message}`)
    }
  }
}

/**
 * 显示语音系统状态
 */
export const showSpeechStatus = () => {
  if ('speechSynthesis' in window) {
    const voices = window.speechSynthesis.getVoices()
    const englishVoices = voices.filter(v => 
      v.lang.startsWith('en-') || v.lang.startsWith('en_')
    )
    
    console.log('🎤 语音系统状态:', {
      totalVoices: voices.length,
      englishVoices: englishVoices.length,
      isSpeaking: window.speechSynthesis.speaking,
      pending: window.speechSynthesis.pending,
      paused: window.speechSynthesis.paused,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    })
    
    // 显示英文语音列表
    console.log('🔊 可用英文语音:')
    englishVoices.forEach((voice, index) => {
      console.log(`${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`)
    })
  } else {
    console.log('❌ 浏览器不支持 Web Speech API')
  }
}

/**
 * 停止播放
 */
export const stopAudio = () => {
  cleanup()
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

/**
 * 初始化语音引擎
 */
export const initSpeechEngine = async () => {
  console.log('[TTS] 初始化语音引擎')
  console.log('[TTS] 浏览器能力:', caps)

  // 预加载 Web Speech API (移动端需要)
  if ('speechSynthesis' in window) {
    // Web Speech API 需要用户交互才能正常工作
    // 先获取语音列表来初始化
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      console.log('[TTS] 可用语音数量:', voices.length)
      if (voices.length > 0) {
        const englishVoices = voices.filter(voice => 
          voice.lang.startsWith('en-') || voice.lang.startsWith('en_')
        )
        console.log('[TTS] 英文语音数量:', englishVoices.length)
      }
    }

    // 立即尝试加载
    loadVoices()
    
    // 监听语音列表变化事件（某些浏览器需要）
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
    
    // 备用方案：定时检查（针对某些浏览器）
    let attempts = 0
    const checkInterval = setInterval(() => {
      attempts++
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0 || attempts > 10) {
        clearInterval(checkInterval)
        console.log('[TTS] 语音列表加载完成，尝试次数:', attempts)
      }
    }, 100)
  }

  if (!audioUnlocked) {
    audioUnlocked = await unlockAudio()
  }

  return true
}

/**
 * 检测语音支持状态
 */
export const getSpeechStatus = () => {
  const hasWebSpeechAPI = 'speechSynthesis' in window

  return {
    supported: true,
    isMobile: caps.isMobile,
    isAndroid: caps.isAndroid,
    isXiaomi: caps.isXiaomi,
    hasWebSpeechAPI,
    message: caps.isXiaomi
      ? '使用增强播放模式 + Web Speech API 降级'
      : '使用 Edge TTS 语音合成',
    canTry: true,
    capabilities: caps
  }
}
