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

export interface APIEndpoint {
  url: string
  key: string
  name?: string
}

const DEFAULT_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

/**
 * 客户端直接调用 AI API
 * 支持 OpenRouter 和自定义 API endpoints
 * 支持流式输出
 */
export async function callChatAPI(
  request: ChatAPIRequest,
  agent: AIAgent,
  apiKey: string,
  customEndpoint?: string,
  onStream?: (content: string) => void
): Promise<ChatAPIResponse> {
  if (!apiKey) {
    throw new Error('API key is required. Please add ?api=YOUR_KEY to the URL or set it in settings.')
  }

  const endpoint = customEndpoint || DEFAULT_ENDPOINT

  // 构建消息历史 - 移除system prompt，让AI之间可以互相看到对话
  const messages = [
    // 只包含最近的消息历史（最多 20 条）
    ...(request.history || [])
      .slice(-20)
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
    // 调用 AI API，启用流式输出
    const response = await fetch(endpoint, {
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
        max_tokens: 2000,
        stream: true // 启用流式输出
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', errorText)

      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your API key.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    }

    // 处理流式响应
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    if (!reader) {
      throw new Error('No response body')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content

            if (content) {
              fullContent += content
              // 调用流式回调
              if (onStream) {
                onStream(fullContent)
              }
            }
          } catch (e) {
            // 忽略解析错误
            console.warn('Failed to parse SSE data:', data)
          }
        }
      }
    }

    if (!fullContent) {
      throw new Error('No content in response')
    }

    return { content: fullContent }
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

/**
 * 保存自定义 API endpoint
 */
export function saveCustomEndpoint(endpoint: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('custom_api_endpoint', endpoint)
}

/**
 * 获取自定义 API endpoint
 */
export function getCustomEndpoint(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('custom_api_endpoint')
}

/**
 * 清除自定义 API endpoint
 */
export function clearCustomEndpoint(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('custom_api_endpoint')
}
