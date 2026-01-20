/**
 * 语音合成工具
 * 使用 Google Translate TTS URL 直接播放
 */

let audioRef = null

/**
 * 获取 Google TTS 音频 URL
 */
const getGoogleTtsUrl = (text, lang = 'en') => {
  const encodedText = encodeURIComponent(text)
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodedText}&tl=${lang}`
}

/**
 * 播放单词发音
 */
export const playWordAudio = async (word, voiceType = 'US') => {
  return new Promise((resolve, reject) => {
    // 停止之前的播放
    if (audioRef) {
      audioRef.pause()
      audioRef = null
    }

    const audioUrl = getGoogleTtsUrl(word, 'en')
    audioRef = new Audio(audioUrl)

    audioRef.onended = () => {
      audioRef = null
      resolve()
    }

    audioRef.onerror = (e) => {
      console.error('音频播放失败:', e)
      // 尝试备用方案：使用中文 TTS
      const fallbackUrl = getGoogleTtsUrl(word, 'en-US')
      const fallbackAudio = new Audio(fallbackUrl)
      
      fallbackAudio.onended = () => resolve()
      fallbackAudio.onerror = () => reject(new Error('音频播放失败'))
      fallbackAudio.play()
    }

    audioRef.play()
  })
}

/**
 * 播放句子发音
 */
export const playSentenceAudio = async (sentence, voiceType = 'US') => {
  return new Promise((resolve, reject) => {
    if (audioRef) {
      audioRef.pause()
      audioRef = null
    }

    const audioUrl = getGoogleTtsUrl(sentence, 'en')
    audioRef = new Audio(audioUrl)

    audioRef.onended = () => {
      audioRef = null
      resolve()
    }

    audioRef.onerror = (e) => {
      console.error('音频播放失败:', e)
      reject(new Error('音频播放失败'))
    }

    audioRef.play()
  })
}

/**
 * 停止播放
 */
export const stopAudio = () => {
  if (audioRef) {
    audioRef.pause()
    audioRef = null
  }
}

/**
 * 初始化（空操作，因为不需要初始化）
 */
export const initSpeechEngine = async () => {
  return true
}

/**
 * 检测语音支持状态
 */
export const getSpeechStatus = () => {
  return {
    supported: true,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || ''),
    message: '使用 Google Translate TTS',
    canTry: true
  }
}
