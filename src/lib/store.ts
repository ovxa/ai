import { create } from 'zustand'
import { AgentId, AgentStatus, Message, AgentState } from '@/types'
import { getAllAgentIds, getAgentById, initializeCustomModels } from './agents'
import { parseMessage } from '@/utils/mention'
import { callChatAPI, getAvailableAPIKey, saveAPIKey, getCustomEndpoint } from './api'

interface ChatStore {
  // 状态
  messages: Message[]
  agents: Map<AgentId, AgentState>
  currentMentions: AgentId[] // 当前消息提及的 agents
  pendingAgents: AgentId[] // 等待回复的 agents（显示生成动画）
  isLoading: boolean
  error: string | null
  apiKey: string | null // 当前使用的 API key
  customEndpoint: string | null // 自定义 API endpoint
  streamingAgentId: AgentId | null // 当前正在流式输出的 agent
  streamingContent: string // 流式输出的内容
  abortController: AbortController | null // 用于中断请求

  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateStreamingMessage: (agentId: AgentId, content: string) => void
  finalizeStreamingMessage: () => void
  setAgentStatus: (agentId: AgentId, status: AgentStatus) => void
  setCurrentMentions: (mentions: AgentId[]) => void
  clearCurrentMentions: () => void
  sendMessage: (content: string) => Promise<void>
  sendToSpecificAgents: (content: string, agentIds: AgentId[], sequential?: boolean, filterByAgent?: boolean) => Promise<void>
  stopGeneration: () => void
  setAPIKey: (key: string) => void
  setCustomEndpoint: (endpoint: string | null) => void
  initializeAPIKey: () => void
  reset: () => void
}

// 初始化所有 agents 为在线状态
const initializeAgents = (): Map<AgentId, AgentState> => {
  const agents = new Map<AgentId, AgentState>()
  getAllAgentIds().forEach(id => {
    agents.set(id, {
      id,
      status: 'online',
      lastActive: Date.now()
    })
  })
  return agents
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  agents: initializeAgents(),
  currentMentions: [],
  pendingAgents: [],
  isLoading: false,
  error: null,
  apiKey: null,
  customEndpoint: null,
  streamingAgentId: null,
  streamingContent: '',
  abortController: null,

  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    set(state => ({
      messages: [...state.messages, newMessage]
    }))
  },

  updateStreamingMessage: (agentId, content) => {
    set({
      streamingAgentId: agentId,
      streamingContent: content
    })
    // 当AI开始流式输出时，从pendingAgents中移除
    const { pendingAgents } = get()
    if (pendingAgents.includes(agentId)) {
      set({ pendingAgents: pendingAgents.filter(id => id !== agentId) })
    }
  },

  finalizeStreamingMessage: () => {
    const { streamingAgentId, streamingContent, addMessage } = get()
    if (streamingAgentId && streamingContent) {
      addMessage({
        role: 'assistant',
        content: streamingContent,
        agentId: streamingAgentId
      })
    }
    set({
      streamingAgentId: null,
      streamingContent: ''
    })
  },

  setAgentStatus: (agentId, status) => {
    set(state => {
      const newAgents = new Map(state.agents)
      const agent = newAgents.get(agentId)
      if (agent) {
        newAgents.set(agentId, {
          ...agent,
          status,
          lastActive: Date.now()
        })
      }
      return { agents: newAgents }
    })
  },

  setCurrentMentions: (mentions) => {
    set({ currentMentions: mentions })
  },

  clearCurrentMentions: () => {
    set({ currentMentions: [] })
  },

  sendMessage: async (content) => {
    const { addMessage, sendToSpecificAgents, stopGeneration } = get()

    // 停止之前的生成
    stopGeneration()

    // 创建新的 AbortController
    const abortController = new AbortController()
    set({ abortController })

    // 解析消息中的 @mentions
    const { mentions, cleanContent, isAll } = parseMessage(content)

    // 添加用户消息
    addMessage({
      role: 'user',
      content: cleanContent,
      mentions: mentions.length > 0 ? mentions : undefined
    })

    // 根据 mentions 决定发送策略
    if (mentions.length > 0) {
      // 有 @mention：并行发送给指定的 agents，不过滤消息（能看到所有AI的回复）
      await sendToSpecificAgents(cleanContent, mentions, false, false)
    } else {
      // 无 @mention：顺序执行（one by one），每个AI只看自己和用户的对话
      const allAgents = getAllAgentIds()
      await sendToSpecificAgents(cleanContent, allAgents, true, true)
    }
  },

  sendToSpecificAgents: async (content, agentIds, sequential = false, filterByAgent = false) => {
    const { updateStreamingMessage, finalizeStreamingMessage, setAgentStatus, apiKey, customEndpoint, abortController, messages } = get()

    // 检查 API key
    if (!apiKey) {
      set({
        error: '请先设置 API Key。您可以在 URL 中添加 ?api=YOUR_KEY 或在设置中配置。'
      })
      return
    }

    set({ isLoading: true, error: null, pendingAgents: agentIds })

    // 判断是否有 @提及（通过检查最后一条用户消息）
    const lastUserMessage = messages[messages.length - 1]
    const isMentioned = lastUserMessage?.mentions && lastUserMessage.mentions.length > 0

    try {
      if (sequential) {
        // 顺序执行：one by one，每个AI等待上一个AI的回复
        for (const agentId of agentIds) {
          // 检查是否已中止
          if (abortController?.signal.aborted) {
            break
          }

          const agent = getAgentById(agentId)
          if (!agent) {
            console.error(`Agent ${agentId} not found`)
            continue
          }

          setAgentStatus(agentId, 'typing')

          try {
            const response = await callChatAPI(
              {
                agentId,
                message: content,
                history: get().messages, // 实时获取最新的消息历史
                filterByAgent, // 传递过滤参数
                isMentioned // 传递是否被 @提及
              },
              agent,
              apiKey,
              customEndpoint || undefined,
              (chunk) => {
                // 流式更新回调
                updateStreamingMessage(agentId, chunk)
              },
              abortController?.signal
            )

            // 完成流式输出
            finalizeStreamingMessage()
            setAgentStatus(agentId, 'online')
          } catch (error) {
            console.error(`Error from ${agentId}:`, error)
            const errorMsg = error instanceof Error ? error.message : '抱歉，我现在无法回复。请稍后再试。'

            updateStreamingMessage(agentId, errorMsg)
            finalizeStreamingMessage()
            setAgentStatus(agentId, 'error')
          }
        }
      } else {
        // 并行执行：同时向多个 agents 发送（禁用流式输出避免冲突）
        agentIds.forEach(id => setAgentStatus(id, 'typing'))

        const responses = await Promise.allSettled(
          agentIds.map(async (agentId) => {
            const agent = getAgentById(agentId)
            if (!agent) {
              throw new Error(`Agent ${agentId} not found`)
            }

            try {
              // 并行模式下不使用流式输出，避免多个 AI 的输出互相覆盖
              const response = await callChatAPI(
                {
                  agentId,
                  message: content,
                  history: get().messages,
                  filterByAgent, // 传递过滤参数
                  isMentioned // 传递是否被 @提及
                },
                agent,
                apiKey,
                customEndpoint || undefined,
                undefined // 不传递流式回调
              )

              return { agentId, content: response.content }
            } catch (error) {
              setAgentStatus(agentId, 'error')
              throw error
            }
          })
        )

        // 处理并行响应
        responses.forEach((result, index) => {
          const agentId = agentIds[index]

          if (result.status === 'fulfilled') {
            // 成功：添加消息
            const { addMessage } = get()
            addMessage({
              role: 'assistant',
              content: result.value.content,
              agentId
            })
            setAgentStatus(agentId, 'online')
          } else {
            // 失败：添加错误消息
            const errorMsg = result.reason instanceof Error
              ? result.reason.message
              : '抱歉，我现在无法回复。请稍后再试。'

            const { addMessage } = get()
            addMessage({
              role: 'assistant',
              content: errorMsg,
              agentId
            })
            setAgentStatus(agentId, 'error')
          }
        })

        // 检查是否所有请求都失败了
        const allFailed = responses.every(r => r.status === 'rejected')
        if (allFailed) {
          set({ error: '所有 AI 都无法响应，请检查 API Key 和网络连接' })
        }
      }
    } catch (error) {
      console.error('Send message error:', error)
      set({ error: '发送消息失败，请重试' })
    } finally {
      set({ isLoading: false, pendingAgents: [] })
    }
  },

  stopGeneration: () => {
    const { abortController } = get()
    if (abortController) {
      abortController.abort()
      set({
        abortController: null,
        isLoading: false,
        pendingAgents: [],
        streamingAgentId: null,
        streamingContent: ''
      })
    }
  },

  setAPIKey: (key) => {
    set({ apiKey: key })
    if (key) {
      saveAPIKey(key)
    }
  },

  setCustomEndpoint: (endpoint) => {
    set({ customEndpoint: endpoint })
  },

  initializeAPIKey: () => {
    const key = getAvailableAPIKey()
    if (key) {
      set({ apiKey: key })
    }

    // 初始化自定义模型配置
    initializeCustomModels()

    // 初始化自定义 endpoint
    const endpoint = getCustomEndpoint()
    if (endpoint) {
      set({ customEndpoint: endpoint })
    }
  },

  reset: () => {
    set({
      messages: [],
      agents: initializeAgents(),
      currentMentions: [],
      pendingAgents: [],
      isLoading: false,
      error: null
    })
  }
}))
