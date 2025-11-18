import { create } from 'zustand'
import { AgentId, AgentStatus, Message, AgentState } from '@/types'
import { getAllAgentIds, getAgentById } from './agents'
import { parseMessage } from '@/utils/mention'
import { callChatAPI, getAvailableAPIKey, saveAPIKey } from './api'

interface ChatStore {
  // 状态
  messages: Message[]
  agents: Map<AgentId, AgentState>
  currentMentions: AgentId[] // 当前消息提及的 agents
  isLoading: boolean
  error: string | null
  apiKey: string | null // 当前使用的 API key

  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setAgentStatus: (agentId: AgentId, status: AgentStatus) => void
  setCurrentMentions: (mentions: AgentId[]) => void
  clearCurrentMentions: () => void
  sendMessage: (content: string) => Promise<void>
  sendToSpecificAgents: (content: string, agentIds: AgentId[]) => Promise<void>
  setAPIKey: (key: string) => void
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
  isLoading: false,
  error: null,
  apiKey: null,

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
    const { addMessage, sendToSpecificAgents } = get()

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
      // 有 @mention：发送给指定的 agents
      await sendToSpecificAgents(cleanContent, mentions)
    } else {
      // 无 @mention：按默认流程（sequential）
      const allAgents = getAllAgentIds()
      await sendToSpecificAgents(cleanContent, allAgents)
    }
  },

  sendToSpecificAgents: async (content, agentIds) => {
    const { addMessage, setAgentStatus, apiKey } = get()

    // 检查 API key
    if (!apiKey) {
      set({
        error: '请先设置 API Key。您可以在 URL 中添加 ?api=YOUR_KEY 或在设置中配置。'
      })
      return
    }

    set({ isLoading: true, error: null })

    try {
      // 设置所有目标 agents 为 typing 状态
      agentIds.forEach(id => setAgentStatus(id, 'typing'))

      // 并行请求所有指定的 agents
      const responses = await Promise.allSettled(
        agentIds.map(async (agentId) => {
          try {
            const agent = getAgentById(agentId)
            if (!agent) {
              throw new Error(`Agent ${agentId} not found`)
            }

            const response = await callChatAPI(
              {
                agentId,
                message: content,
                history: get().messages
              },
              agent,
              apiKey
            )

            return { agentId, content: response.content }
          } catch (error) {
            console.error(`Error from ${agentId}:`, error)
            setAgentStatus(agentId, 'error')
            throw error
          }
        })
      )

      // 处理响应
      responses.forEach((result, index) => {
        const agentId = agentIds[index]

        if (result.status === 'fulfilled') {
          // 成功：添加消息并设置为在线
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
    } catch (error) {
      console.error('Send message error:', error)
      set({ error: '发送消息失败，请重试' })
    } finally {
      set({ isLoading: false })
    }
  },

  setAPIKey: (key) => {
    set({ apiKey: key })
    if (key) {
      saveAPIKey(key)
    }
  },

  initializeAPIKey: () => {
    const key = getAvailableAPIKey()
    if (key) {
      set({ apiKey: key })
    }
  },

  reset: () => {
    set({
      messages: [],
      agents: initializeAgents(),
      currentMentions: [],
      isLoading: false,
      error: null
    })
  }
}))
