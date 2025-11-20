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
    <div className="h-screen relative overflow-hidden">
      {/* Messages area - fullscreen, behind overlays */}
      <div className="absolute inset-0 bg-white dark:bg-gray-800">
        <MessageList />
      </div>

      {/* Header with gradient fade - positioned over messages */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 dark:to-transparent py-2 sm:py-3 lg:py-4 px-2 sm:px-4 lg:px-0 pb-8 sm:pb-12">
        <div className="w-full lg:max-w-7xl lg:mx-auto">
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
      </div>

      {/* Fixed input at bottom with gradient fade - positioned over messages */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 dark:to-transparent pt-8 sm:pt-12 pb-2 sm:pb-4 px-2 sm:px-4">
        <div className="w-full lg:max-w-7xl lg:mx-auto">
          <ChatInput />
        </div>
      </div>
    </div>
  )
}
