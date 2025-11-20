'use client'

import { useState, useEffect } from 'react'
import { Language, languageNames, getCurrentLanguage, saveLanguage, useTranslation } from '@/lib/i18n'

export default function LanguageSelector() {
  const [language, setLanguage] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslation()

  // Only execute after client-side mount
  useEffect(() => {
    setMounted(true)
    setLanguage(getCurrentLanguage())
  }, [])

  // Handle language change
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    saveLanguage(lang)
    setIsOpen(false)
    // Reload page to apply new language
    window.location.reload()
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="relative">
        <button
          className="flex items-center gap-2 px-3 py-1.5 text-sm
                     bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                     rounded-lg transition-colors"
          disabled
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm
                   bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                   rounded-lg transition-colors"
        title={t.language}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-20 max-h-80 overflow-y-auto">
            {(Object.keys(languageNames) as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  language === lang ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' : ''
                }`}
              >
                {languageNames[lang]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
