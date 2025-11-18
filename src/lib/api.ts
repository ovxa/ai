import { AIAgent } from '@/types'
import { Message } from '@/types'

export interface ChatAPIRequest {
  agentId: string
  message: string
  history?: Message[]
}

export interface ChatAPIResponse {
  content: string
}

/**
 * 客户端直接调用 OpenRouter API
 * 支持从 URL 参数或 localStorage 获取 API key
 */
export async function callChatAPI(
  request: ChatAPIRequest,
  agent: AIAgent,
  apiKey: string
): Promise<ChatAPIResponse> {
  if (!apiKey) {
    throw new Error('API key is required. Please add ?api=YOUR_KEY to the URL or set it in settings.')
  }

  // 构建消息历史
  const messages = [
    {
      role: 'system',
      content: agent.systemPrompt
    },
    // 只包含最近的消息历史（最多 10 条）
    ...(request.history || [])
      .slice(-10)
      .map((msg: Message) => ({
        role: msg.role,
        content: msg.content
      })),
    {
      role: 'user',
      content: request.message
    }
  ]

  try {
    // 调用 OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'AI Trio Chat'
      },
      body: JSON.stringify({
        model: agent.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', errorText)

      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your API key.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content in response')
    }

    return { content }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to call API')
  }
}

/**
 * 从 URL 参数获取 API keys
 * 支持多个 ?api= 参数
 */
export function getAPIKeysFromURL(): string[] {
  if (typeof window === 'undefined') return []

  const params = new URLSearchParams(window.location.search)
  const apiKeys: string[] = []

  // 获取所有 api 参数
  params.forEach((value, key) => {
    if (key === 'api' && value.trim()) {
      apiKeys.push(value.trim())
    }
  })

  return apiKeys
}

/**
 * 从 localStorage 获取保存的 API key
 */
export function getSavedAPIKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('openrouter_api_key')
}

/**
 * 保存 API key 到 localStorage
 */
export function saveAPIKey(apiKey: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('openrouter_api_key', apiKey)
}

/**
 * 清除保存的 API key
 */
export function clearSavedAPIKey(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('openrouter_api_key')
}

/**
 * 获取可用的 API key
 * 优先级：URL 参数 > localStorage
 */
export function getAvailableAPIKey(): string | null {
  // 优先从 URL 获取
  const urlKeys = getAPIKeysFromURL()
  if (urlKeys.length > 0) {
    return urlKeys[0]
  }

  // 其次从 localStorage 获取
  return getSavedAPIKey()
}

/**
 * 获取所有可用的 API keys（包括 URL 和 localStorage）
 */
export function getAllAPIKeys(): string[] {
  const keys = new Set<string>()

  // 添加 URL 中的 keys
  getAPIKeysFromURL().forEach(key => keys.add(key))

  // 添加 localStorage 中的 key
  const savedKey = getSavedAPIKey()
  if (savedKey) {
    keys.add(savedKey)
  }

  return Array.from(keys)
}
