import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content text-gray-900 dark:text-gray-100 ${className}`}>
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
        {content}
      </ReactMarkdown>
    </div>
  )
}
