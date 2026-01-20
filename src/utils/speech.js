/**
 * 语音合成工具
 * 使用服务器端 edge-tts 生成音频
 */

let audioRef = null

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

    const voice = voiceType === 'US' ? 'en-US-GuyNeural' : 'en-GB-SoniaNeural'

    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: word, voice })
    })
    .then(response => {
      if (!response.ok) throw new Error('TTS 请求失败')
      return response.arrayBuffer()
    })
    .then(arrayBuffer => {
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      audioRef = new Audio(audioUrl)
      
      audioRef.onended = () => {
        URL.revokeObjectURL(audioUrl)
        audioRef = null
        resolve()
      }

      audioRef.onerror = (e) => {
        URL.revokeObjectURL(audioUrl)
        audioRef = null
        reject(new Error('音频播放失败'))
      }

      audioRef.play()
    })
    .catch(error => {
      console.error('TTS 请求失败:', error)
      reject(error)
    })
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

    const voice = 'en-US-SarahNeural'

    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sentence, voice, rate: '-5%' })
    })
    .then(response => {
      if (!response.ok) throw new Error('TTS 请求失败')
      return response.arrayBuffer()
    })
    .then(arrayBuffer => {
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      audioRef = new Audio(audioUrl)
      
      audioRef.onended = () => {
        URL.revokeObjectURL(audioUrl)
        audioRef = null
        resolve()
      }

      audioRef.onerror = () => {
        URL.revokeObjectURL(audioUrl)
        audioRef = null
        reject(new Error('音频播放失败'))
      }

      audioRef.play()
    })
    .catch(error => {
      reject(error)
    })
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
 * 初始化（空操作）
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
    message: '使用 Edge TTS 语音合成',
    canTry: true
  }
}
