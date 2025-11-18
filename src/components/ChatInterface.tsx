import { useEffect } from 'react'
import { useChatStore } from '@/lib/store'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import APIKeySettings from './APIKeySettings'
import ModelSettings from './ModelSettings'

export default function ChatInterface() {
  const { error, reset, initializeAPIKey } = useChatStore()

  // 初始化 API key（从 URL 或 localStorage）
  useEffect(() => {
    initializeAPIKey()
  }, [initializeAPIKey])

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
              className="flex items-center gap-2 px-3 py-1.5 text-sm
                       bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                       rounded-lg transition-colors"
              title="清空对话"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">清空</span>
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
        {/* Chat area - Full height */}
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
