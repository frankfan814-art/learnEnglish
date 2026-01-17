/**
 * 使用 AI 生成单词的详细释义（词性和中文含义）
 * 支持 DeepSeek API 和 Ollama 本地模型
 */

export interface WordDefinition {
  partOfSpeech: string // 词性：n., v., adj., adv. 等
  meaning: string // 中文释义
}

export interface GeneratedDefinitions {
  word: string
  definitions: WordDefinition[]
  phonetic?: string
}

/**
 * DeepSeek API 客户端
 */
class DeepSeekClient {
  private apiKey: string
  private endpoint: string
  private model: string

  constructor() {
    // 从 settings 读取配置
    const settings = this.loadSettings()
    this.apiKey = settings.deepSeekApiKey || import.meta.env.VITE_DEEPSEEK_API_KEY || ''
    this.endpoint = settings.deepSeekEndpoint || import.meta.env.VITE_DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions'
    this.model = settings.deepSeekModel || import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat'
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('english_app_settings')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  }

  /**
   * 生成单词释义
   */
  async generateDefinitions(word: string): Promise<GeneratedDefinitions> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API Key 未配置。请在设置中配置 API Key，或使用 Ollama 本地模型。')
    }

    const prompt = this.buildPrompt(word)

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的英语词典助手，擅长为英语单词提供准确的词性标注和中文释义。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        throw new Error(`DeepSeek API 错误: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('API 返回内容为空')
      }

      return this.parseResponse(word, content)
    } catch (error) {
      console.error('DeepSeek API 调用失败:', error)
      throw error
    }
  }

  /**
   * 构建提示词
   */
  private buildPrompt(word: string): string {
    return `请为英语单词 "${word}" 提供详细的词性和中文释义。

要求：
1. 列出该单词的所有常见词性（如：名词 n., 动词 v., 形容词 adj., 副词 adv. 等）
2. 为每个词性提供准确的中文释义
3. 如果有多个义项，用分号分隔
4. 包含音标（如果知道的话）

输出格式（严格按照以下JSON格式）：
{
  "word": "${word}",
  "phonetic": "/音标/",
  "definitions": [
    {
      "partOfSpeech": "n.",
      "meaning": "含义1；含义2；含义3"
    },
    {
      "partOfSpeech": "v.",
      "meaning": "含义1；含义2"
    }
  ]
}

请直接输出JSON，不要包含其他说明文字。`
  }

  /**
   * 解析 API 返回的内容
   */
  private parseResponse(word: string, content: string): GeneratedDefinitions {
    try {
      // 提取 JSON 部分
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('未找到 JSON 格式')
      }

      const data = JSON.parse(jsonMatch[0])

      // 验证并返回
      return {
        word: data.word || word,
        phonetic: data.phonetic,
        definitions: Array.isArray(data.definitions) ? data.definitions : []
      }
    } catch (error) {
      console.error('解析响应失败:', error, '原始内容:', content)

      // 返回默认值
      return {
        word,
        definitions: [
          {
            partOfSpeech: 'n.',
            meaning: '（待完善释义）'
          }
        ]
      }
    }
  }
}

/**
 * Ollama 本地模型客户端（用于生成释义）
 */
class OllamaDefinitionsClient {
  private endpoint: string
  private model: string

  constructor(endpoint?: string, model?: string) {
    this.endpoint = endpoint || 'http://localhost:11434'
    this.model = model || 'qwen2.5:3b'
  }

  /**
   * 生成单词释义
   */
  async generateDefinitions(word: string): Promise<GeneratedDefinitions> {
    const prompt = this.buildPrompt(word)

    try {
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.5,
            top_p: 0.9,
            num_predict: 500
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API 错误: ${response.status}`)
      }

      const data = await response.json()
      const content = data?.response

      if (!content) {
        throw new Error('Ollama 返回内容为空')
      }

      return this.parseResponse(word, content)
    } catch (error) {
      console.error('Ollama 调用失败:', error)
      throw error
    }
  }

  /**
   * 构建提示词
   */
  private buildPrompt(word: string): string {
    return `请为英语单词 "${word}" 提供详细的词性和中文释义。

要求：
1. 列出该单词的所有常见词性（名词 n., 动词 v., 形容词 adj., 副词 adv. 等）
2. 为每个词性提供准确的中文释义
3. 包含音标（可选）

输出格式（严格按照以下JSON格式）：
{
  "word": "${word}",
  "phonetic": "/音标/",
  "definitions": [
    {"partOfSpeech": "n.", "meaning": "含义1；含义2"},
    {"partOfSpeech": "v.", "meaning": "含义1；含义2"}
  ]
}

请直接输出JSON，不要包含其他说明文字。`
  }

  /**
   * 解析响应
   */
  private parseResponse(word: string, content: string): GeneratedDefinitions {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('未找到 JSON 格式')
      }

      const data = JSON.parse(jsonMatch[0])

      return {
        word: data.word || word,
        phonetic: data.phonetic,
        definitions: Array.isArray(data.definitions) ? data.definitions : []
      }
    } catch (error) {
      console.error('解析 Ollama 响应失败:', error)

      return {
        word,
        definitions: [
          {
            partOfSpeech: 'n.',
            meaning: '（释义生成失败）'
          }
        ]
      }
    }
  }

  /**
   * 检查连接
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }
}

/**
 * 统一的单词释义生成器
 */
export class WordDefinitionsGenerator {
  private provider: 'deepseek' | 'ollama'
  private deepSeekClient: DeepSeekClient
  private ollamaClient: OllamaDefinitionsClient

  constructor(provider: 'deepseek' | 'ollama' = 'deepseek') {
    this.provider = provider
    this.deepSeekClient = new DeepSeekClient()
    this.ollamaClient = new OllamaDefinitionsClient()
  }

  /**
   * 切换提供商
   */
  setProvider(provider: 'deepseek' | 'ollama') {
    this.provider = provider
  }

  /**
   * 设置 Ollama 配置
   */
  setOllamaConfig(endpoint?: string, model?: string) {
    this.ollamaClient = new OllamaDefinitionsClient(endpoint, model)
  }

  /**
   * 生成单词释义
   */
  async generateDefinitions(word: string): Promise<GeneratedDefinitions> {
    if (this.provider === 'deepseek') {
      return this.deepSeekClient.generateDefinitions(word)
    } else {
      // 检查 Ollama 连接
      const connected = await this.ollamaClient.checkConnection()
      if (!connected) {
        throw new Error('无法连接到 Ollama 服务')
      }
      return this.ollamaClient.generateDefinitions(word)
    }
  }

  /**
   * 批量生成单词释义
   */
  async generateBatch(
    words: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, GeneratedDefinitions>> {
    const results = new Map<string, GeneratedDefinitions>()

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      try {
        const definitions = await this.generateDefinitions(word)
        results.set(word, definitions)

        onProgress?.(i + 1, words.length)

        // 避免请求过快
        if (i < words.length - 1) {
          await this.delay(300)
        }
      } catch (error) {
        console.error(`生成 "${word}" 释义失败:`, error)
      }
    }

    return results
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 全局实例
let generatorInstance: WordDefinitionsGenerator | null = null

/**
 * 获取单词释义生成器实例
 */
export const getDefinitionsGenerator = (
  provider?: 'deepseek' | 'ollama'
): WordDefinitionsGenerator => {
  if (!generatorInstance) {
    // 从 localStorage 读取设置
    const settings = JSON.parse(localStorage.getItem('english_app_settings') || '{}')
    const preferredProvider = provider || settings.llmProvider || 'deepseek'
    generatorInstance = new WordDefinitionsGenerator(preferredProvider)
  }
  return generatorInstance
}

/**
 * 重置生成器
 */
export const resetDefinitionsGenerator = (provider?: 'deepseek' | 'ollama') => {
  if (provider) {
    generatorInstance = new WordDefinitionsGenerator(provider)
  } else {
    generatorInstance = null
  }
}
