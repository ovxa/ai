import { useState, useEffect } from 'react'
import { AI_AGENTS, getCustomModels, saveCustomModels, resetModelsToDefault, addModel, removeModel, updateModel } from '@/lib/agents'
import { saveCustomEndpoint, clearCustomEndpoint, getCustomEndpoint, getEndpointFromURL, fetchAvailableModels, extractModelShortName } from '@/lib/api'
import { useChatStore } from '@/lib/store'

export default function ModelSettings() {
  const [showSettings, setShowSettings] = useState(false)
  const { apiKey, setCustomEndpoint } = useChatStore()

  const [models, setModels] = useState<string[]>([])
  const [endpoint, setEndpoint] = useState('')
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [showModelPicker, setShowModelPicker] = useState<number | null>(null)
  const [modelSearchQuery, setModelSearchQuery] = useState('')

  // URL 中的 endpoint
  const urlEndpoint = getEndpointFromURL()

  useEffect(() => {
    setModels(getCustomModels())
    setEndpoint(getCustomEndpoint() || '')
  }, [showSettings])

  // 从 API 获取可用模型
  const handleFetchModels = async () => {
    if (!apiKey) {
      alert('请先设置 API Key')
      return
    }

    setLoadingModels(true)
    try {
      const fetchedModels = await fetchAvailableModels(apiKey, endpoint || undefined)
      setAvailableModels(fetchedModels)
    } catch (error) {
      console.error('Failed to fetch models:', error)
      alert('获取模型列表失败，请检查 API Key 和 Endpoint')
    } finally {
      setLoadingModels(false)
    }
  }

  const handleEndpointChange = (newEndpoint: string) => {
    setEndpoint(newEndpoint)
    if (newEndpoint.trim()) {
      saveCustomEndpoint(newEndpoint.trim())
      setCustomEndpoint(newEndpoint.trim())
    } else {
      clearCustomEndpoint()
      setCustomEndpoint(null)
    }
  }

  const handleAddModel = () => {
    const newModel = prompt('输入模型名称（例如：anthropic/claude-sonnet-4.5）')
    if (newModel && newModel.trim()) {
      const newModels = [...models, newModel.trim()]
      setModels(newModels)
      saveCustomModels(newModels)
    }
  }

  const handleRemoveModel = (index: number) => {
    if (models.length <= 1) {
      alert('至少需要保留一个模型')
      return
    }
    const newModels = models.filter((_, i) => i !== index)
    setModels(newModels)
    saveCustomModels(newModels)
  }

  const handleUpdateModel = (index: number, newModel: string) => {
    const newModels = [...models]
    newModels[index] = newModel
    setModels(newModels)
    saveCustomModels(newModels)
  }

  const handleSelectModel = (index: number, model: string) => {
    handleUpdateModel(index, model)
    setShowModelPicker(null)
    setModelSearchQuery('')
  }

  // 过滤可用模型
  const filteredModels = availableModels.filter(model =>
    model.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
    extractModelShortName(model).toLowerCase().includes(modelSearchQuery.toLowerCase())
  )

  const handleReset = () => {
    resetModelsToDefault()
    setModels(getCustomModels())
    setEndpoint('')
    clearCustomEndpoint()
    setCustomEndpoint(null)
  }

  if (!showSettings) {
    return (
      <button
        onClick={() => setShowSettings(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm
                 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                 rounded-lg transition-colors"
        title="Model Settings"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden sm:inline">Models</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Model & API Settings
          </h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* API Endpoint */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Endpoint
          </label>
          {urlEndpoint && (
            <div className="mb-2 p-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded text-xs">
              <span className="text-green-800 dark:text-green-300">从 URL 获取: </span>
              <span className="font-mono text-green-900 dark:text-green-200">{urlEndpoint}</span>
            </div>
          )}
          <input
            type="text"
            value={endpoint}
            onChange={(e) => handleEndpointChange(e.target.value)}
            placeholder="https://openrouter.ai/api/v1/chat/completions"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            留空使用 OpenRouter。可使用 URL 参数：?endpoint=YOUR_ENDPOINT
          </p>
        </div>

        {/* Fetch Models */}
        <div className="mb-6">
          <button
            onClick={handleFetchModels}
            disabled={loadingModels || !apiKey}
            className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400
                     text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loadingModels ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                加载中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                从 API 获取可用模型
              </>
            )}
          </button>

          {availableModels.length > 0 && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs max-h-32 overflow-y-auto">
              <div className="text-gray-600 dark:text-gray-400 mb-1">找到 {availableModels.length} 个模型</div>
            </div>
          )}
        </div>

        {/* AI Models List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              AI Models
            </h3>
            <button
              onClick={handleAddModel}
              className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              + 添加模型
            </button>
          </div>

          <div className="space-y-3">
            {models.map((model, index) => {
              const shortName = extractModelShortName(model)
              const agent = AI_AGENTS[index]

              return (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {shortName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {agent?.mention || `@${shortName.toLowerCase()}`}
                      </div>
                    </div>
                    {models.length > 1 && (
                      <button
                        onClick={() => handleRemoveModel(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="删除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => handleUpdateModel(index, e.target.value)}
                      className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                      placeholder="e.g., anthropic/claude-sonnet-4.5"
                    />
                    {availableModels.length > 0 && (
                      <button
                        onClick={() => setShowModelPicker(showModelPicker === index ? null : index)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1
                                 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                      >
                        选择
                      </button>
                    )}
                  </div>

                  {/* Model Picker Dropdown */}
                  {showModelPicker === index && availableModels.length > 0 && (
                    <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      {/* 搜索框 */}
                      <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                        <input
                          type="text"
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                          placeholder="搜索模型..."
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded
                                   bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                        />
                      </div>

                      {/* 模型列表 */}
                      <div className="max-h-40 overflow-y-auto">
                        {filteredModels.length > 0 ? (
                          filteredModels.map((availableModel) => (
                            <button
                              key={availableModel}
                              onClick={() => handleSelectModel(index, availableModel)}
                              className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-blue-50 dark:hover:bg-blue-900/30
                                       text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                            >
                              <div className="font-semibold">{extractModelShortName(availableModel)}</div>
                              <div className="text-gray-500 dark:text-gray-400 text-[10px]">{availableModel}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                            未找到匹配的模型
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            重置为默认
          </button>
          <button
            onClick={() => setShowSettings(false)}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
