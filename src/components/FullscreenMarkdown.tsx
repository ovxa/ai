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
  // Snapshot content when opened to prevent updates during viewing
  const [content, setContent] = useState(initialContent)

  // Lock content on first render, don't update even if initialContent changes
  useEffect(() => {
    setContent(initialContent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Markdown 预览
          </h3>
          {isStreaming && agentId && onStopGeneration ? (
            <button
              onClick={() => onStopGeneration(agentId)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
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
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <MarkdownRenderer content={content} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          {/* Character count - left side */}
          {isStreaming ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {content.length} {t.responseCount}
            </div>
          ) : (
            <div></div>
          )}

          {/* Close button - right side */}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
