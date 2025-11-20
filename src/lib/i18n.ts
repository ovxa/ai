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
    aiTrioChat: 'Group',
    subtitle: 'AI.JE',
    pageTitle: 'Group - KI-Team-Chat',
    pageDescription: 'Verwenden Sie @ um spezifische KI zu erwähnen, oder senden Sie direkt eine Nachricht',
    startConversation: 'Gespräch starten',
    startConversationHint: 'Verwenden Sie @ um spezifische KI zu erwähnen, oder senden Sie direkt eine Nachricht',
    language: 'Sprache',
    settings: 'Einstellungen',
    theme: 'Thema',
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
    aiTrioChat: 'Group',
    subtitle: 'AI.JE',
    pageTitle: 'Group - AI Team Chat',
    pageDescription: 'Use @ to mention specific AI, or send message directly',
    startConversation: 'Start conversation',
    startConversationHint: 'Use @ to mention specific AI, or send message directly',
    language: 'Language',
    settings: 'Settings',
    theme: 'Theme',
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
    aiTrioChat: 'Group',
    subtitle: 'AI.JE',
    pageTitle: 'Group - Chat de Equipo de IA',
    pageDescription: 'Use @ para mencionar IA específica, o envíe mensaje directamente',
    startConversation: 'Iniciar conversación',
    startConversationHint: 'Use @ para mencionar IA específica, o envíe mensaje directamente',
    language: 'Idioma',
    settings: 'Configuración',
    theme: 'Tema',
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
    aiTrioChat: 'Group',
    subtitle: 'AI.JE',
    pageTitle: 'Group - Chat d\'Équipe IA',
    pageDescription: 'Utilisez @ pour mentionner une IA spécifique, ou envoyez un message directement',
    startConversation: 'Démarrer la conversation',
    startConversationHint: 'Utilisez @ pour mentionner une IA spécifique, ou envoyez un message directement',
    language: 'Langue',
    settings: 'Paramètres',
    theme: 'Thème',
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
    aiTrioChat: 'Group',
    subtitle: 'AI.JE',
    pageTitle: 'Group - Chat di Squadra IA',
    pageDescription: 'Usa @ per menzionare IA specifica, o invia messaggio direttamente',
    startConversation: 'Inizia conversazione',
    startConversationHint: 'Usa @ per menzionare IA specifica, o invia messaggio direttamente',
    language: 'Lingua',
    settings: 'Impostazioni',
    theme: 'Tema',
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
    aiTrioChat: 'Group',
    subtitle: 'AI.JE',
    pageTitle: 'Group - AIチームチャット',
    pageDescription: '@を使用して特定のAIをメンション、または直接メッセージを送信',
    startConversation: '会話を開始',
    startConversationHint: '@を使用して特定のAIをメンション、または直接メッセージを送信',
    language: '言語',
    settings: '設定',
    theme: 'テーマ',
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
    aiTrioChat: 'Group',
    subtitle: 'AI.JE',
    pageTitle: 'Group - AI 팀 채팅',
    pageDescription: '@를 사용하여 특정 AI를 언급하거나 직접 메시지 보내기',
    startConversation: '대화 시작',
    startConversationHint: '@를 사용하여 특정 AI를 언급하거나 직접 메시지 보내기',
    language: '언어',
    settings: '설정',
    theme: '테마',
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
    aiTrioChat: 'Group',
    subtitle: 'AI.JE',
    pageTitle: 'Group - Chat de Equipe de IA',
    pageDescription: 'Use @ para mencionar IA específica, ou envie mensagem diretamente',
    startConversation: 'Iniciar conversa',
    startConversationHint: 'Use @ para mencionar IA específica, ou envie mensagem diretamente',
    language: 'Idioma',
    settings: 'Configurações',
    theme: 'Tema',
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
    aiTrioChat: 'Group',
    subtitle: 'AI.JE',
    pageTitle: 'Group - AI 团队聊天',
    pageDescription: '使用 @ 提及特定 AI，或直接发送消息',
    startConversation: '开始对话',
    startConversationHint: '使用 @ 提及特定 AI，或直接发送消息',
    language: '语言',
    settings: '设置',
    theme: '主题',
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
    aiTrioChat: 'Group',
    subtitle: 'AI.JE',
    pageTitle: 'Group - Командный Чат с ИИ',
    pageDescription: 'Используйте @ для упоминания конкретного ИИ, или отправьте сообщение напрямую',
    startConversation: 'Начать разговор',
    startConversationHint: 'Используйте @ для упоминания конкретного ИИ, или отправьте сообщение напрямую',
    language: 'Язык',
    settings: 'Настройки',
    theme: 'Тема',
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
