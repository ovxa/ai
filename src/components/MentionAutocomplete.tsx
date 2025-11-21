import { useEffect, useRef } from 'react'
import { AutocompleteOption } from '@/types'

interface MentionAutocompleteProps {
  options: AutocompleteOption[]
  selectedIndex: number
  onSelect: (option: AutocompleteOption) => void
  onClose: () => void
  position: { top: number; left: number }
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

export default function MentionAutocomplete({
  options,
  selectedIndex,
  onSelect,
  onClose,
  position
}: MentionAutocompleteProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)

  // 滚动到选中的选项
  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      const list = listRef.current
      const selected = selectedRef.current
      const listRect = list.getBoundingClientRect()
      const selectedRect = selected.getBoundingClientRect()

      if (selectedRect.top < listRect.top) {
        selected.scrollIntoView({ block: 'nearest' })
      } else if (selectedRect.bottom > listRect.bottom) {
        selected.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (options.length === 0) {
    return null
  }

  // 最多显示4个选项
  const displayOptions = options.slice(0, 4)

  return (
    <div
      ref={listRef}
      className="fixed z-50 bg-card rounded-lg shadow-xl border border-border overflow-hidden"
      style={{
        bottom: `calc(100vh - ${position.top}px + 10px)`, // 显示在输入框上方
        left: Math.max(8, Math.min(position.left, window.innerWidth - 288)), // Keep within viewport with 8px margin
        minWidth: '280px',
        maxWidth: 'calc(100vw - 16px)' // Never exceed viewport width
      }}
    >
      <div className="overflow-y-auto">
        {displayOptions.map((option, index) => {
          const isSelected = index === selectedIndex
          const colorClass = option.color && option.color in colorClasses
            ? colorClasses[option.color as keyof typeof colorClasses]
            : ''

          return (
            <div
              key={option.id}
              ref={isSelected ? selectedRef : null}
              className={`
                px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors
                ${isSelected
                  ? 'bg-accent'
                  : 'hover:bg-accent/50'
                }
              `}
              onClick={() => onSelect(option)}
            >
              {/* 在线状态指示器 */}
              <div className="flex-shrink-0">
                {option.isOnline ? (
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                )}
              </div>

              {/* 选项内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`
                    text-sm font-medium px-2 py-0.5 rounded
                    ${option.id === 'all'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : colorClass || 'bg-secondary text-secondary-foreground'
                    }
                  `}>
                    {option.label.split(' ')[0]}
                  </span>
                  <span className="text-sm text-muted-foreground truncate">
                    {option.label.split(' ').slice(1).join(' ')}
                  </span>
                </div>
              </div>

              {/* 选中指示器 */}
              {isSelected && (
                <div className="flex-shrink-0 text-blue-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 提示文本 */}
      <div className="px-4 py-2 bg-muted border-t border-border">
        <p className="text-xs text-muted-foreground">
          ↑↓ 导航 • Enter 选择 • Esc 关闭
        </p>
      </div>
    </div>
  )
}
