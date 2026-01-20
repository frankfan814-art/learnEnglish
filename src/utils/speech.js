/**
 * 语音合成工具
 * 使用 easy-speech 库解决跨浏览器兼容性问题
 */

import EasySpeech from 'easy-speech'

let initialized = false

/**
 * 初始化语音引擎
 */
export const initSpeechEngine = async () => {
  if (initialized) return true

  try {
    const detection = EasySpeech.detect()
    
    if (!detection.speechSynthesis || !detection.speechSynthesisUtterance) {
      console.warn('浏览器不支持语音合成')
      return false
    }

    await EasySpeech.init({
      maxTimeout: 5000,
      interval: 250
    })

    initialized = true
    console.log('语音引擎初始化成功')
    return true
  } catch (error) {
    console.error('语音引擎初始化失败:', error)
    return false
  }
}

/**
 * 播放单词发音
 */
export const playWordAudio = async (word, voiceType = 'US') => {
  const ready = await initSpeechEngine()
  if (!ready) {
    throw new Error('语音引擎未初始化')
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
  const ready = await initSpeechEngine()
  if (!ready) {
    throw new Error('语音引擎未初始化')
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
  EasySpeech.cancel()
}
