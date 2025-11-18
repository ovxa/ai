import { AI_AGENTS } from '@/lib/agents'
import { useChatStore } from '@/lib/store'
import AIAgentCard from './AIAgentCard'
import MessageList from './MessageList'
import ChatInput from './ChatInput'

export default function ChatInterface() {
  const { currentMentions, error, reset } = useChatStore()

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

          {/* Reset button */}
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                     bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                     rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            清空对话
          </button>
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

      {/* Main layout: responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-8rem)]">
        {/* Left sidebar: AI Agents (desktop) / Top section (mobile) */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto">
          <div className="sticky top-0 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm py-2 px-1 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              AI 助手
            </h2>
            <div className="space-y-3">
              {AI_AGENTS.map(agent => {
                const isMentioned = hasMentions
                  ? currentMentions.includes(agent.id)
                  : true // 如果没有提及，显示所有 agents

                return (
                  <AIAgentCard
                    key={agent.id}
                    agent={agent}
                    isMentioned={isMentioned}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Chat area */}
        <div className="lg:col-span-2 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
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
