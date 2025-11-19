/**
 * Internationalization support
 * Display text based on user's selected or browser language
 */

export type Language = 'de' | 'en' | 'es' | 'fr' | 'it' | 'ja' | 'ko' | 'pt' | 'zh' | 'ru'

export const languageNames: Record<Language, string> = {
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  pt: 'Português',
  zh: '简体中文',
  ru: 'Русский',
}

export const translations = {
  de: {
    // German
    inputPlaceholder: '@',
    send: 'Senden',
    clear: 'Löschen',
    models: 'Modelle',
    apiKey: 'API-Schlüssel',
    generating: 'Generiert...',
    stop: 'Stopp',
    responseCount: 'Antwort Anzahl',
    aiTrioChat: 'AI Trio Chat',
    subtitle: 'Drei KI-Kollaborationsassistenten - Verwenden Sie @ um spezifische KI zu erwähnen',
    startConversation: 'Gespräch starten',
    startConversationHint: 'Verwenden Sie @ um spezifische KI zu erwähnen, oder senden Sie direkt eine Nachricht',
    language: 'Sprache',
  },
  en: {
    // English
    inputPlaceholder: '@',
    send: 'Send',
    clear: 'Clear',
    models: 'Models',
    apiKey: 'API Key',
    generating: 'Generating...',
    stop: 'Stop',
    responseCount: 'response count',
    aiTrioChat: 'AI Trio Chat',
    subtitle: 'Three AI Collaboration Assistants - Use @ to mention specific AI',
    startConversation: 'Start conversation',
    startConversationHint: 'Use @ to mention specific AI, or send message directly',
    language: 'Language',
  },
  es: {
    // Spanish
    inputPlaceholder: '@',
    send: 'Enviar',
    clear: 'Borrar',
    models: 'Modelos',
    apiKey: 'Clave API',
    generating: 'Generando...',
    stop: 'Detener',
    responseCount: 'conteo de respuestas',
    aiTrioChat: 'AI Trio Chat',
    subtitle: 'Tres Asistentes de Colaboración de IA - Use @ para mencionar IA específica',
    startConversation: 'Iniciar conversación',
    startConversationHint: 'Use @ para mencionar IA específica, o envíe mensaje directamente',
    language: 'Idioma',
  },
  fr: {
    // French
    inputPlaceholder: '@',
    send: 'Envoyer',
    clear: 'Effacer',
    models: 'Modèles',
    apiKey: 'Clé API',
    generating: 'Génération...',
    stop: 'Arrêter',
    responseCount: 'nombre de réponses',
    aiTrioChat: 'AI Trio Chat',
    subtitle: 'Trois Assistants de Collaboration IA - Utilisez @ pour mentionner une IA spécifique',
    startConversation: 'Démarrer la conversation',
    startConversationHint: 'Utilisez @ pour mentionner une IA spécifique, ou envoyez un message directement',
    language: 'Langue',
  },
  it: {
    // Italian
    inputPlaceholder: '@',
    send: 'Invia',
    clear: 'Cancella',
    models: 'Modelli',
    apiKey: 'Chiave API',
    generating: 'Generazione...',
    stop: 'Ferma',
    responseCount: 'conteggio risposte',
    aiTrioChat: 'AI Trio Chat',
    subtitle: 'Tre Assistenti di Collaborazione IA - Usa @ per menzionare IA specifica',
    startConversation: 'Inizia conversazione',
    startConversationHint: 'Usa @ per menzionare IA specifica, o invia messaggio direttamente',
    language: 'Lingua',
  },
  ja: {
    // Japanese
    inputPlaceholder: '@',
    send: '送信',
    clear: 'クリア',
    models: 'モデル',
    apiKey: 'APIキー',
    generating: '生成中...',
    stop: '停止',
    responseCount: '応答数',
    aiTrioChat: 'AI Trio Chat',
    subtitle: '三つのAI協力アシスタント - @を使用して特定のAIをメンション',
    startConversation: '会話を開始',
    startConversationHint: '@を使用して特定のAIをメンション、または直接メッセージを送信',
    language: '言語',
  },
  ko: {
    // Korean
    inputPlaceholder: '@',
    send: '전송',
    clear: '지우기',
    models: '모델',
    apiKey: 'API 키',
    generating: '생성 중...',
    stop: '중지',
    responseCount: '응답 수',
    aiTrioChat: 'AI Trio Chat',
    subtitle: '세 가지 AI 협업 도우미 - @를 사용하여 특정 AI 언급',
    startConversation: '대화 시작',
    startConversationHint: '@를 사용하여 특정 AI를 언급하거나 직접 메시지 보내기',
    language: '언어',
  },
  pt: {
    // Portuguese
    inputPlaceholder: '@',
    send: 'Enviar',
    clear: 'Limpar',
    models: 'Modelos',
    apiKey: 'Chave API',
    generating: 'Gerando...',
    stop: 'Parar',
    responseCount: 'contagem de respostas',
    aiTrioChat: 'AI Trio Chat',
    subtitle: 'Três Assistentes de Colaboração de IA - Use @ para mencionar IA específica',
    startConversation: 'Iniciar conversa',
    startConversationHint: 'Use @ para mencionar IA específica, ou envie mensagem diretamente',
    language: 'Idioma',
  },
  zh: {
    // Chinese
    inputPlaceholder: '@',
    send: '发送',
    clear: '清空',
    models: '模型',
    apiKey: 'API 密钥',
    generating: '生成中...',
    stop: '停止',
    responseCount: '回复字数',
    aiTrioChat: 'AI Trio Chat',
    subtitle: '三 AI 协作助手 - 使用 @ 提及特定 AI',
    startConversation: '开始对话',
    startConversationHint: '使用 @ 提及特定 AI，或直接发送消息',
    language: '语言',
  },
  ru: {
    // Russian
    inputPlaceholder: '@',
    send: 'Отправить',
    clear: 'Очистить',
    models: 'Модели',
    apiKey: 'API ключ',
    generating: 'Генерация...',
    stop: 'Остановить',
    responseCount: 'количество ответов',
    aiTrioChat: 'AI Trio Chat',
    subtitle: 'Три ИИ-помощника для совместной работы - Используйте @ для упоминания конкретного ИИ',
    startConversation: 'Начать разговор',
    startConversationHint: 'Используйте @ для упоминания конкретного ИИ, или отправьте сообщение напрямую',
    language: 'Язык',
  },
}

/**
 * Get browser language
 */
export function getBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en'

  const browserLang = navigator.language.toLowerCase()

  // Match language code
  if (browserLang.startsWith('de')) return 'de'
  if (browserLang.startsWith('es')) return 'es'
  if (browserLang.startsWith('fr')) return 'fr'
  if (browserLang.startsWith('it')) return 'it'
  if (browserLang.startsWith('ja')) return 'ja'
  if (browserLang.startsWith('ko')) return 'ko'
  if (browserLang.startsWith('pt')) return 'pt'
  if (browserLang.startsWith('zh')) return 'zh'
  if (browserLang.startsWith('ru')) return 'ru'

  return 'en' // Default to English
}

/**
 * Get saved language from localStorage
 */
export function getSavedLanguage(): Language | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem('language')
  if (saved && saved in translations) {
    return saved as Language
  }
  return null
}

/**
 * Save language to localStorage
 */
export function saveLanguage(lang: Language): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('language', lang)
}

/**
 * Get current language (saved or browser default)
 */
export function getCurrentLanguage(): Language {
  return getSavedLanguage() || getBrowserLanguage()
}

/**
 * Get translation text
 */
export function useTranslation() {
  const lang = getCurrentLanguage()
  return translations[lang]
}
