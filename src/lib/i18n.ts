/**
 * 国际化支持
 * 根据用户浏览器语言显示对应文字
 */

export type Language = 'de' | 'en' | 'es' | 'fr' | 'it' | 'ja' | 'ko' | 'pt' | 'zh' | 'ru'

export const translations = {
  de: {
    // German
    inputPlaceholder: 'Nachricht eingeben... (@ verwenden, um spezifische KI zu erwähnen)',
    send: 'Senden',
    sendHint: 'Enter zum Senden • Shift+Enter für Zeilenumbruch',
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
    inputPlaceholder: 'Enter message... (use @ to mention specific AI)',
    send: 'Send',
    sendHint: 'Enter to send • Shift+Enter for new line',
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
    inputPlaceholder: 'Ingrese mensaje... (use @ para mencionar IA específica)',
    send: 'Enviar',
    sendHint: 'Enter para enviar • Shift+Enter para nueva línea',
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
    inputPlaceholder: 'Entrez le message... (utilisez @ pour mentionner une IA spécifique)',
    send: 'Envoyer',
    sendHint: 'Enter pour envoyer • Shift+Enter pour nouvelle ligne',
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
    inputPlaceholder: 'Inserisci messaggio... (usa @ per menzionare IA specifica)',
    send: 'Invia',
    sendHint: 'Enter per inviare • Shift+Enter per nuova riga',
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
    inputPlaceholder: 'メッセージを入力... (@を使用して特定のAIをメンション)',
    send: '送信',
    sendHint: 'Enterで送信 • Shift+Enterで改行',
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
    inputPlaceholder: '메시지 입력... (특정 AI를 언급하려면 @ 사용)',
    send: '전송',
    sendHint: 'Enter로 전송 • Shift+Enter로 줄바꿈',
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
    inputPlaceholder: 'Digite a mensagem... (use @ para mencionar IA específica)',
    send: 'Enviar',
    sendHint: 'Enter para enviar • Shift+Enter para nova linha',
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
    inputPlaceholder: '输入消息... (使用 @ 提及特定 AI)',
    send: '发送',
    sendHint: 'Enter 发送 • Shift+Enter 换行',
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
    inputPlaceholder: 'Введите сообщение... (используйте @ для упоминания конкретного ИИ)',
    send: 'Отправить',
    sendHint: 'Enter для отправки • Shift+Enter для новой строки',
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
