/**
 * 语音合成工具
 * 优先使用 easy-speech，检测移动端浏览器兼容性
 */

import EasySpeech from 'easy-speech'

let initialized = false
let isSupported = false

/**
 * 检测浏览器是否支持语音合成
 */
export const detectSpeechSupport = () => {
  if (typeof window === 'undefined') return false
  
  const hasSpeechSynthesis = 'speechSynthesis' in window
  const hasUtterance = typeof SpeechSynthesisUtterance !== 'undefined'
  
  return {
    supported: hasSpeechSynthesis && hasUtterance,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    userAgent: navigator.userAgent
  }
}

/**
 * 初始化语音引擎
 */
export const initSpeechEngine = async () => {
  if (initialized) return isSupported

  try {
    const detection = EasySpeech.detect()
    
    if (!detection.speechSynthesis || !detection.speechSynthesisUtterance) {
      console.warn('浏览器不支持语音合成')
      isSupported = false
      initialized = true
      return false
    }

    await EasySpeech.init({
      maxTimeout: 5000,
      interval: 250
    })

    isSupported = true
    initialized = true
    console.log('语音引擎初始化成功')
    return true
  } catch (error) {
    console.error('语音引擎初始化失败:', error)
    isSupported = false
    initialized = true
    return false
  }
}

/**
 * 播放单词发音
 */
export const playWordAudio = async (word, voiceType = 'US') => {
  if (!isSupported) {
    await initSpeechEngine()
    if (!isSupported) {
      throw new Error('browser_not_supported')
    }
  }

  try {
    await EasySpeech.speak({
      text: word,
      pitch: 1.0,
      rate: 0.9,
      volume: 1.0
    })
  } catch (error) {
    console.error('播放失败:', error)
    throw error
  }
}

/**
 * 播放句子发音
 */
export const playSentenceAudio = async (sentence, voiceType = 'US') => {
  if (!isSupported) {
    await initSpeechEngine()
    if (!isSupported) {
      throw new Error('browser_not_supported')
    }
  }

  try {
    await EasySpeech.speak({
      text: sentence,
      pitch: 1.0,
      rate: 0.85,
      volume: 1.0
    })
  } catch (error) {
    console.error('播放失败:', error)
    throw error
  }
}

/**
 * 停止播放
 */
export const stopAudio = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

/**
 * 获取浏览器语音支持状态和提示信息
 */
export const getSpeechStatus = () => {
  const status = detectSpeechSupport()
  
  let message = ''
  let canTry = true
  
  if (!status.supported) {
    message = '您的浏览器不支持语音合成功能'
    canTry = false
  } else if (status.isMobile) {
    message = '移动端浏览器语音功能可能受限，请确保：\n1. 系统语音设置已开启\n2. 媒体音量已打开\n3. 尝试使用 Chrome 浏览器'
  }
  
  return {
    ...status,
    message,
    canTry
  }
}
