/**
 * 国际化支持
 * 根据用户浏览器语言显示对应文字
 */

export type Language = 'de' | 'en' | 'es' | 'fr' | 'it' | 'ja' | 'ko' | 'pt' | 'zh' | 'ru'

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
  },
}

/**
 * 获取浏览器语言
 */
export function getBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en'

  const browserLang = navigator.language.toLowerCase()

  // 匹配语言代码
  if (browserLang.startsWith('de')) return 'de'
  if (browserLang.startsWith('es')) return 'es'
  if (browserLang.startsWith('fr')) return 'fr'
  if (browserLang.startsWith('it')) return 'it'
  if (browserLang.startsWith('ja')) return 'ja'
  if (browserLang.startsWith('ko')) return 'ko'
  if (browserLang.startsWith('pt')) return 'pt'
  if (browserLang.startsWith('zh')) return 'zh'
  if (browserLang.startsWith('ru')) return 'ru'

  return 'en' // 默认英语
}

/**
 * 获取翻译文本
 */
export function useTranslation() {
  const lang = getBrowserLanguage()
  return translations[lang]
}
