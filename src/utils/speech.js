/**
 * 语音合成工具
 * 优先使用服务器端 TTS API，兼容移动端
 */

let isInitialized = false

/**
 * 使用服务器 TTS API 生成并播放音频
 */
const playWithServerTTS = async (text, options = {}) => {
  const lang = options.lang || 'en'

  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, lang })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'TTS 请求失败')
  }

  const audioBuffer = await response.arrayBuffer()
  const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
  const audioUrl = URL.createObjectURL(audioBlob)

  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl)
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
      resolve()
    }
    
    audio.onerror = (e) => {
      URL.revokeObjectURL(audioUrl)
      reject(new Error('音频播放失败'))
    }
    
    audio.play()
  })
}

/**
 * 检测浏览器是否支持 Web Speech API
 */
export const detectSpeechSupport = () => {
  if (typeof window === 'undefined') return false
  
  const hasSpeechSynthesis = 'speechSynthesis' in window
  const hasUtterance = typeof SpeechSynthesisUtterance !== 'undefined'
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  return {
    supported: hasSpeechSynthesis && hasUtterance,
    isMobile,
    userAgent: navigator.userAgent
  }
}

/**
 * 初始化语音引擎
 */
export const initSpeechEngine = async () => {
  if (isInitialized) return true
  isInitialized = true
  return true
}

/**
 * 播放单词发音
 */
export const playWordAudio = async (word, voiceType = 'US') => {
  try {
    // 优先使用服务器端 TTS
    await playWithServerTTS(word, { lang: 'en' })
  } catch (error) {
    console.error('服务器 TTS 失败:', error)
    throw error
  }
}

/**
 * 播放句子发音
 */
export const playSentenceAudio = async (sentence, voiceType = 'US') => {
  try {
    await playWithServerTTS(sentence, { lang: 'en' })
  } catch (error) {
    console.error('服务器 TTS 失败:', error)
    throw error
  }
}

/**
 * 停止播放
 */
export const stopAudio = () => {
  if (typeof window !== 'undefined') {
    window.speechSynthesis?.cancel()
  }
}

/**
 * 获取语音状态
 */
export const getSpeechStatus = () => {
  const status = detectSpeechSupport()
  return {
    ...status,
    message: status.supported ? '' : '使用服务器端语音合成',
    canTry: true
  }
}
