'use client'

import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import ModelSettings from './ModelSettings'
import APIKeySettings from './APIKeySettings'
import LanguageSelector from './LanguageSelector'
import { useTranslation } from '@/lib/i18n'

export default function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslation()

  return (
    <div className="relative">
      {/* Settings icon button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={t.settings || 'Settings'}
      >
        <svg
          className="w-6 h-6 text-gray-700 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu panel */}
          <div className="absolute left-0 top-full mt-2 z-30 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[280px] py-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 mb-2">
              {t.settings || 'Settings'}
            </div>

            <div className="space-y-1 px-2">
              {/* Language Selector */}
              <div className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t.language}
                </span>
                <LanguageSelector />
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t.theme}
                </span>
                <ThemeToggle />
              </div>

              {/* Model Settings */}
              <div className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t.models}
                </span>
                <ModelSettings />
              </div>

              {/* API Key Settings */}
              <div className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t.apiKey}
                </span>
                <APIKeySettings />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
