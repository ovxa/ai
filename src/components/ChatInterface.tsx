import { useEffect, useState } from 'react'
import { useChatStore } from '@/lib/store'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import SettingsMenu from './SettingsMenu'
import { useTranslation } from '@/lib/i18n'

export default function ChatInterface() {
  const { error, reset, initializeAPIKey } = useChatStore()
  const t = useTranslation()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // 初始化 API key（从 URL 或 localStorage）
  // 只在组件挂载时执行一次
  useEffect(() => {
    initializeAPIKey()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="h-screen relative overflow-hidden">
      {/* Messages area - fullscreen, behind overlays */}
      <div className="absolute inset-0 bg-background pt-16 sm:pt-20 pb-20 sm:pb-24">
        <MessageList />
      </div>

      {/* Header - fixed at top with solid background */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-card border-b border-border py-3 sm:py-4 px-4 sm:px-6">
        <div className="w-full lg:max-w-7xl lg:mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Settings icon */}
            <div className="flex-shrink-0">
              <SettingsMenu onOpenChange={setIsSettingsOpen} />
            </div>

            {/* Center: Group + AI.JE */}
            <div className="flex items-baseline gap-2 justify-center flex-1">
              <a
                href="https://group.ai.je"
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl sm:text-3xl font-bold text-foreground hover:text-primary transition-colors"
              >
                {t.aiTrioChat}
              </a>
              <a
                href="https://ai.je"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors"
              >
                {t.subtitle}
              </a>
            </div>

            {/* Right: Clear button */}
            <div className="flex-shrink-0">
              <button
                onClick={reset}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title={t.clear}
              >
                <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-destructive/10 border border-destructive rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm sm:text-base">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed input at bottom with solid background - positioned over messages */}
      {!isSettingsOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-muted border-t border-border py-2 sm:py-4 px-2 sm:px-4">
          <div className="w-full lg:max-w-7xl lg:mx-auto">
            <ChatInput />
          </div>
        </div>
      )}
    </div>
  )
}
