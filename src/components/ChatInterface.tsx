import { useEffect } from 'react'
import { AI_AGENTS } from '@/lib/agents'
import { useChatStore } from '@/lib/store'
import { AgentColor } from '@/types'
import AIAgentCard from './AIAgentCard'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import APIKeySettings from './APIKeySettings'
import ModelSettings from './ModelSettings'

// 颜色映射
const colorMap: Record<AgentColor, { border: string; bg: string; text: string }> = {
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400'
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400'
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-600 dark:text-green-400'
  },
  orange: {
    border: 'border-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400'
  },
  pink: {
    border: 'border-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    text: 'text-pink-600 dark:text-pink-400'
  },
  cyan: {
    border: 'border-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-600 dark:text-cyan-400'
  }
}

export default function ChatInterface() {
  const { currentMentions, error, reset, initializeAPIKey } = useChatStore()

  // 初始化 API key（从 URL 或 localStorage）
  useEffect(() => {
    initializeAPIKey()
  }, [initializeAPIKey])

  // 检查是否有任何 agent 被提及
  const hasMentions = currentMentions.length > 0

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              AI Trio Chat
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              三 AI 协作助手 - 使用 @ 提及特定 AI
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ModelSettings />
            <APIKeySettings />
            <button
              onClick={reset}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                       bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                       rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              清空对话
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex flex-col h-[calc(100%-10rem)] lg:h-[calc(100%-8rem)]">
        {/* AI Agent Cards - Horizontal scroll on mobile, grid on desktop */}
        <div className="mb-3">
          <div className="flex lg:grid lg:grid-cols-3 gap-2 lg:gap-4 overflow-x-auto lg:overflow-x-visible pb-2">
            {AI_AGENTS.map(agent => {
              const isMentioned = hasMentions
                ? currentMentions.includes(agent.id)
                : true

              const agentState = useChatStore.getState().agents.get(agent.id)
              const status = agentState?.status || 'offline'

              const colors = colorMap[agent.color]

              return (
                <div
                  key={agent.id}
                  className={`
                    flex-shrink-0 w-20 lg:w-auto
                    rounded-lg border-2 p-2 lg:p-3 transition-all duration-300
                    ${isMentioned
                      ? `${colors.border} ${colors.bg} opacity-100`
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50'
                    }
                  `}
                >
                  {/* Mobile: Ultra-compact view */}
                  <div className="lg:hidden flex flex-col items-center text-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      status === 'online' ? 'bg-green-500' :
                      status === 'typing' ? 'bg-blue-500 animate-pulse' :
                      status === 'error' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                    <div className={`text-[11px] font-semibold truncate w-full ${colors.text}`}>
                      {agent.name}
                    </div>
                    <div className="text-[9px] text-gray-500 dark:text-gray-400 font-mono">
                      {agent.mention}
                    </div>
                  </div>

                  {/* Desktop: Compact card view */}
                  <div className="hidden lg:flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className={`text-sm font-semibold ${colors.text}`}>
                        {agent.name}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'online' ? 'bg-green-500' :
                        status === 'typing' ? 'bg-blue-500 animate-pulse' :
                        status === 'error' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`} />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {agent.mention}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat area - Takes remaining space */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <MessageList />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
            <ChatInput />
          </div>
        </div>
      </div>

      {/* Usage tips */}
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          提示: 输入 <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">@</code> 可以选择特定 AI，
          或使用 <code className="px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded">@all</code> 向所有 AI 发送消息
        </p>
      </div>
    </div>
  )
}
