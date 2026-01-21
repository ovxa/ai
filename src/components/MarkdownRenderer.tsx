import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'

interface MarkdownRendererProps {
  content: string
  className?: string
}

// Parse content to separate thinking blocks from main content
const parseThinkingContent = (content: string): { thinking: string | null; mainContent: string } => {
  // Match <think>...</think> pattern (case insensitive)
  const thinkRegex = /<think>([\s\S]*?)<\/think>/i
  const match = content.match(thinkRegex)

  if (match) {
    const thinking = match[1].trim()
    const mainContent = content.replace(thinkRegex, '').trim()
    return { thinking, mainContent }
  }

  // Also check for content before </think> without opening tag (streaming case)
  const partialThinkRegex = /^([\s\S]*?)<\/think>/i
  const partialMatch = content.match(partialThinkRegex)

  if (partialMatch) {
    const thinking = partialMatch[1].trim()
    const mainContent = content.replace(partialThinkRegex, '').trim()
    return { thinking, mainContent }
  }

  return { thinking: null, mainContent: content }
}

// Thinking block component with collapsible functionality
interface ThinkingBlockProps {
  content: string
  t: ReturnType<typeof useTranslation>
}

function ThinkingBlock({ content, t }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm text-gray-600 dark:text-gray-400"
      >
        {/* Brain/Thinking icon */}
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? '' : 'animate-pulse'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <span>{isExpanded ? (t.hideThinking || 'Hide thinking process') : (t.viewThinking || 'View thinking process')}</span>
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  )
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const t = useTranslation()
  const { thinking, mainContent } = parseThinkingContent(content)

  return (
    <div className={`markdown-content text-gray-900 dark:text-gray-100 ${className}`}>
      {/* Show thinking block if present */}
      {thinking && <ThinkingBlock content={thinking} t={t} />}

      {/* Show main content */}
      {mainContent && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // 自定义组件样式
            h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900 dark:text-gray-100">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-5 text-gray-900 dark:text-gray-100">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-4 text-gray-900 dark:text-gray-100">{children}</h3>,
            h4: ({ children }) => <h4 className="text-base font-bold mb-2 mt-3 text-gray-900 dark:text-gray-100">{children}</h4>,
            h5: ({ children }) => <h5 className="text-sm font-bold mb-1 mt-2 text-gray-900 dark:text-gray-100">{children}</h5>,
            h6: ({ children }) => <h6 className="text-xs font-bold mb-1 mt-2 text-gray-900 dark:text-gray-100">{children}</h6>,

            p: ({ children }) => <p className="mb-3 leading-relaxed text-gray-800 dark:text-gray-200">{children}</p>,

            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {children}
              </a>
            ),

            ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-800 dark:text-gray-200">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-800 dark:text-gray-200">{children}</ol>,
            li: ({ children }) => <li className="ml-4 text-gray-800 dark:text-gray-200">{children}</li>,

            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 mb-3 italic text-gray-700 dark:text-gray-300">
                {children}
              </blockquote>
            ),

            code: ({ inline, className, children, ...props }: any) => {
              if (inline) {
                return (
                  <code
                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-pink-600 dark:text-pink-400"
                    {...props}
                  >
                    {children}
                  </code>
                )
              }
              return (
                <code
                  className={`block p-3 bg-gray-900 text-gray-100 dark:bg-gray-950 rounded-lg overflow-x-auto text-sm font-mono ${className || ''}`}
                  {...props}
                >
                  {children}
                </code>
              )
            },

            pre: ({ children }) => (
              <pre className="mb-3 rounded-lg overflow-hidden bg-gray-900 dark:bg-gray-950">
                {children}
              </pre>
            ),

            table: ({ children }) => (
              <div className="overflow-x-auto mb-3">
                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                  {children}
                </table>
              </div>
            ),

            thead: ({ children }) => (
              <thead className="bg-gray-100 dark:bg-gray-800">
                {children}
              </thead>
            ),

            th: ({ children }) => (
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">
                {children}
              </th>
            ),

            td: ({ children }) => (
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-800 dark:text-gray-200">
                {children}
              </td>
            ),

            hr: () => <hr className="my-4 border-gray-300 dark:border-gray-600" />,

            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt}
                className="max-w-full h-auto rounded-lg my-3"
              />
            ),
          }}
        >
          {mainContent}
        </ReactMarkdown>
      )}
    </div>
  )
}
