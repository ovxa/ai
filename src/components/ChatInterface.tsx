import { useEffect } from 'react'
import { useChatStore } from '@/lib/store'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import APIKeySettings from './APIKeySettings'
import ModelSettings from './ModelSettings'
import ThemeToggle from './ThemeToggle'
import LanguageSelector from './LanguageSelector'
import { useTranslation } from '@/lib/i18n'

export default function ChatInterface() {
  const { error, reset, initializeAPIKey } = useChatStore()
  const t = useTranslation()

  // 初始化 API key（从 URL 或 localStorage）
  // 只在组件挂载时执行一次
  useEffect(() => {
    initializeAPIKey()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="w-full lg:max-w-7xl lg:mx-auto h-screen lg:h-[calc(100vh-2rem)] px-2 sm:px-4 lg:px-0">
      {/* Header */}
      <div className="py-2 sm:py-3 lg:mb-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-shrink">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
              <a
                href="https://group.ai.je"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {t.aiTrioChat}
              </a>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">
              <a
                href="https://ai.je"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {t.subtitle}
              </a>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <LanguageSelector />
            <ThemeToggle />
            <ModelSettings />
            <APIKeySettings />
            <button
              onClick={reset}
              className="flex items-center gap-2 px-3 py-1.5 text-sm
                       bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                       rounded-lg transition-colors"
              title={t.clear}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-2 sm:mt-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">

              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex flex-col h-[calc(100%-5rem)] sm:h-[calc(100%-6rem)] lg:h-[calc(100%-8rem)]">
        {/* Chat area - Full height */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <MessageList />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2 sm:p-4 bg-gray-50 dark:bg-gray-900">
            <ChatInput />
          </div>
        </div>
      </div>

    </div>
  )
}
