import { useState } from 'react'
import { AI_AGENTS, updateAgentModel, resetModelsToDefault, getCustomModels } from '@/lib/agents'
import { saveCustomEndpoint, clearCustomEndpoint, getCustomEndpoint } from '@/lib/api'
import { useChatStore } from '@/lib/store'

export default function ModelSettings() {
  const [showSettings, setShowSettings] = useState(false)
  const { setCustomEndpoint } = useChatStore()

  const [models, setModels] = useState(() => {
    const customModels = getCustomModels()
    return AI_AGENTS.map(agent => ({
      id: agent.id,
      name: agent.name,
      model: customModels[agent.id] || agent.model
    }))
  })

  const [endpoint, setEndpoint] = useState(getCustomEndpoint() || '')

  const handleModelChange = (agentId: string, newModel: string) => {
    setModels(prev => prev.map(m =>
      m.id === agentId ? { ...m, model: newModel } : m
    ))
    updateAgentModel(agentId, newModel)
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

  const handleReset = () => {
    resetModelsToDefault()
    setModels(AI_AGENTS.map(agent => ({
      id: agent.id,
      name: agent.name,
      model: agent.model
    })))
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
            API Endpoint (Optional)
          </label>
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
            Leave empty to use OpenRouter. You can use custom API endpoints compatible with OpenAI format.
          </p>
        </div>

        {/* Model Configuration */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            AI Models
          </h3>

          {models.map((agent) => (
            <div key={agent.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {agent.name}
              </label>
              <input
                type="text"
                value={agent.model}
                onChange={(e) => handleModelChange(agent.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                placeholder="e.g., anthropic/claude-sonnet-4.5"
              />
            </div>
          ))}
        </div>

        {/* Default Models Reference */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Default Models:
          </h4>
          <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400 font-mono">
            <li>• Analyst: anthropic/claude-sonnet-4.5</li>
            <li>• Creator: openai/gpt-5</li>
            <li>• Evaluator: google/gemini-2.5-pro</li>
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Browse available models at{' '}
            <a
              href="https://openrouter.ai/models"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              openrouter.ai/models
            </a>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={() => setShowSettings(false)}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
