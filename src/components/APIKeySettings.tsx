import { useState, useEffect } from 'react'
import { useChatStore } from '@/lib/store'
import { getAPIKeysFromURL, getAllAPIKeys } from '@/lib/api'

export default function APIKeySettings() {
  const [showSettings, setShowSettings] = useState(false)
  const [inputKey, setInputKey] = useState('')
  const { apiKey, setAPIKey } = useChatStore()

  const urlKeys = getAPIKeysFromURL()
  const hasURLKey = urlKeys.length > 0

  useEffect(() => {
    // 自动显示设置界面如果没有 API key
    if (!apiKey && !hasURLKey) {
      setShowSettings(true)
    }
  }, [apiKey, hasURLKey])

  const handleSave = () => {
    if (inputKey.trim()) {
      setAPIKey(inputKey.trim())
      setShowSettings(false)
      setInputKey('')
    }
  }

  const handleClear = () => {
    setAPIKey('')
    setInputKey('')
  }

  if (!showSettings && apiKey) {
    return (
      <button
        onClick={() => setShowSettings(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm
                 bg-secondary hover:bg-secondary/80
                 rounded-lg transition-colors"
        title="API Key Settings"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </button>
    )
  }

  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center
      bg-black/50 backdrop-blur-sm
      ${showSettings ? '' : 'hidden'}
    `}>
      <div className="bg-card rounded-lg shadow-2xl p-6 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            API Key Settings
          </h2>
          {apiKey && (
            <button
              onClick={() => setShowSettings(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* URL Keys Info */}
        {hasURLKey && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  API Key from URL detected
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {urlKeys.length} key{urlKeys.length > 1 ? 's' : ''} found in URL parameters
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current API Key Status */}
        {apiKey && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Current API Key
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded font-mono text-sm overflow-hidden overflow-ellipsis">
                {apiKey.substring(0, 20)}...{apiKey.substring(apiKey.length - 4)}
              </code>
              <button
                onClick={handleClear}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                title="Clear API Key"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Input New Key */}
        <div className="mb-4">
          <label htmlFor="api-key-input" className="block text-sm font-medium text-foreground mb-2">
            {apiKey ? 'Update API Key' : 'Enter OpenRouter API Key'}
          </label>
          <input
            id="api-key-input"
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="sk-or-..."
            className="w-full px-3 py-2 border border-input rounded-lg
                     bg-background text-foreground
                     focus:ring-2 focus:ring-ring focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSave()
              }
            }}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Get your API key from{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              OpenRouter
            </a>
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium text-foreground mb-2">
            Alternative: Use URL Parameter
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            You can also pass the API key via URL:
          </p>
          <code className="block text-xs bg-background px-2 py-1 rounded font-mono overflow-x-auto">
            {typeof window !== 'undefined' ? window.location.origin : ''}?api=YOUR_API_KEY
          </code>
          <p className="text-xs text-muted-foreground mt-2">
            Multiple keys: ?api=key1&api=key2
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!inputKey.trim()}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400
                     text-white font-medium rounded-lg transition-colors
                     disabled:cursor-not-allowed"
          >
            {apiKey ? 'Update Key' : 'Save Key'}
          </button>
          {apiKey && (
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
