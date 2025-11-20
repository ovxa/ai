import { useState, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import { AgentId } from '@/types'
import { useTranslation } from '@/lib/i18n'

interface FullscreenMarkdownProps {
  content: string
  onClose: () => void
  agentId?: AgentId
  isStreaming?: boolean
  onStopGeneration?: (agentId: AgentId) => void
}

export default function FullscreenMarkdown({
  content: initialContent,
  onClose,
  agentId,
  isStreaming = false,
  onStopGeneration
}: FullscreenMarkdownProps) {
  const t = useTranslation()
  // Content state management
  const [content, setContent] = useState(initialContent)

  // Update content dynamically during streaming, lock after streaming completes
  useEffect(() => {
    if (isStreaming) {
      // During streaming: update content in real-time
      setContent(initialContent)
    }
    // If not streaming, content is locked to prevent interrupting user's reading
  }, [initialContent, isStreaming])
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Markdown 预览
          </h3>
          {/* Close button - always shown */}
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <MarkdownRenderer content={content} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          {/* Character count - left side (only during streaming) */}
          {isStreaming ? (
            <div className="text-sm text-muted-foreground">
              {content.length} {t.responseCount}
            </div>
          ) : (
            <div></div>
          )}

          {/* Right side button - Stop button during streaming, Close button otherwise */}
          {isStreaming && agentId && onStopGeneration ? (
            <button
              onClick={() => onStopGeneration(agentId)}
              className="flex items-center gap-2 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors"
              title={t.stop}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
              <span>{t.stop}</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors"
            >
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
