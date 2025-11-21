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
    errors: {
      allAisFailed: 'Alle KIs konnten nicht antworten, bitte überprüfen Sie API-Schlüssel und Netzwerkverbindung',
      apiKeyRequired: 'Bitte setzen Sie zuerst den API-Schlüssel. Sie können ?api=IHR_SCHLÜSSEL zur URL hinzufügen oder ihn in den Einstellungen konfigurieren.',
      sendMessageFailed: 'Nachricht konnte nicht gesendet werden, bitte erneut versuchen',
      invalidApiKey: 'Ungültiger API-Schlüssel. Bitte überprüfen Sie Ihren API-Schlüssel.',
      rateLimitExceeded: 'Ratenlimit überschritten. Bitte versuchen Sie es später erneut.',
      apiError: 'API-Fehler',
      noResponseBody: 'Keine Antwort vom Server',
      requestAborted: 'Anfrage abgebrochen',
      noContent: 'Kein Inhalt in der Antwort',
      apiCallFailed: 'API-Aufruf fehlgeschlagen',
      fetchModelsFailed: 'Modelle konnten nicht abgerufen werden',
      aiResponseError: 'Entschuldigung, ich kann momentan nicht antworten. Bitte versuchen Sie es später erneut.',
    },
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
    errors: {
      allAisFailed: 'All AIs failed to respond, please check API Key and network connection',
      apiKeyRequired: 'Please set API Key first. You can add ?api=YOUR_KEY to the URL or configure it in settings.',
      sendMessageFailed: 'Failed to send message, please retry',
      invalidApiKey: 'Invalid API key. Please check your API key.',
      rateLimitExceeded: 'Rate limit exceeded. Please try again later.',
      apiError: 'API error',
      noResponseBody: 'No response body',
      requestAborted: 'Request aborted',
      noContent: 'No content in response',
      apiCallFailed: 'Failed to call API',
      fetchModelsFailed: 'Failed to fetch models',
      aiResponseError: 'Sorry, I cannot respond right now. Please try again later.',
    },
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
    errors: {
      allAisFailed: 'Todas las IAs no pudieron responder, por favor verifique la clave API y la conexión de red',
      apiKeyRequired: 'Por favor configure primero la clave API. Puede agregar ?api=SU_CLAVE a la URL o configurarla en ajustes.',
      sendMessageFailed: 'No se pudo enviar el mensaje, por favor reintente',
      invalidApiKey: 'Clave API inválida. Por favor verifique su clave API.',
      rateLimitExceeded: 'Límite de tasa excedido. Por favor intente nuevamente más tarde.',
      apiError: 'Error de API',
      noResponseBody: 'Sin respuesta del servidor',
      requestAborted: 'Solicitud abortada',
      noContent: 'Sin contenido en la respuesta',
      apiCallFailed: 'Fallo en la llamada a la API',
      fetchModelsFailed: 'No se pudieron obtener los modelos',
      aiResponseError: 'Lo siento, no puedo responder en este momento. Por favor intente nuevamente más tarde.',
    },
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
    errors: {
      allAisFailed: 'Toutes les IAs n\'ont pas pu répondre, veuillez vérifier la clé API et la connexion réseau',
      apiKeyRequired: 'Veuillez d\'abord définir la clé API. Vous pouvez ajouter ?api=VOTRE_CLE à l\'URL ou la configurer dans les paramètres.',
      sendMessageFailed: 'Échec de l\'envoi du message, veuillez réessayer',
      invalidApiKey: 'Clé API invalide. Veuillez vérifier votre clé API.',
      rateLimitExceeded: 'Limite de débit dépassée. Veuillez réessayer plus tard.',
      apiError: 'Erreur API',
      noResponseBody: 'Aucune réponse du serveur',
      requestAborted: 'Requête abandonnée',
      noContent: 'Aucun contenu dans la réponse',
      apiCallFailed: 'Échec de l\'appel API',
      fetchModelsFailed: 'Échec de la récupération des modèles',
      aiResponseError: 'Désolé, je ne peux pas répondre pour le moment. Veuillez réessayer plus tard.',
    },
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
    errors: {
      allAisFailed: 'Tutte le IA non hanno potuto rispondere, controlla la chiave API e la connessione di rete',
      apiKeyRequired: 'Imposta prima la chiave API. Puoi aggiungere ?api=TUA_CHIAVE all\'URL o configurarla nelle impostazioni.',
      sendMessageFailed: 'Impossibile inviare il messaggio, riprova',
      invalidApiKey: 'Chiave API non valida. Controlla la tua chiave API.',
      rateLimitExceeded: 'Limite di velocità superato. Riprova più tardi.',
      apiError: 'Errore API',
      noResponseBody: 'Nessuna risposta dal server',
      requestAborted: 'Richiesta annullata',
      noContent: 'Nessun contenuto nella risposta',
      apiCallFailed: 'Chiamata API fallita',
      fetchModelsFailed: 'Impossibile recuperare i modelli',
      aiResponseError: 'Mi dispiace, non posso rispondere in questo momento. Riprova più tardi.',
    },
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
    errors: {
      allAisFailed: 'すべてのAIが応答できませんでした。APIキーとネットワーク接続を確認してください',
      apiKeyRequired: '最初にAPIキーを設定してください。URLに ?api=YOUR_KEY を追加するか、設定で構成できます。',
      sendMessageFailed: 'メッセージの送信に失敗しました。再試行してください',
      invalidApiKey: '無効なAPIキーです。APIキーを確認してください。',
      rateLimitExceeded: 'レート制限を超えました。後でもう一度お試しください。',
      apiError: 'APIエラー',
      noResponseBody: 'サーバーからの応答がありません',
      requestAborted: 'リクエストが中止されました',
      noContent: '応答にコンテンツがありません',
      apiCallFailed: 'API呼び出しに失敗しました',
      fetchModelsFailed: 'モデルの取得に失敗しました',
      aiResponseError: '申し訳ございません、現在応答できません。後でもう一度お試しください。',
    },
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
    errors: {
      allAisFailed: '모든 AI가 응답하지 못했습니다. API 키와 네트워크 연결을 확인하세요',
      apiKeyRequired: '먼저 API 키를 설정하세요. URL에 ?api=YOUR_KEY를 추가하거나 설정에서 구성할 수 있습니다.',
      sendMessageFailed: '메시지 전송에 실패했습니다. 다시 시도하세요',
      invalidApiKey: '잘못된 API 키입니다. API 키를 확인하세요.',
      rateLimitExceeded: '속도 제한을 초과했습니다. 나중에 다시 시도하세요.',
      apiError: 'API 오류',
      noResponseBody: '서버 응답 없음',
      requestAborted: '요청이 중단되었습니다',
      noContent: '응답에 내용이 없습니다',
      apiCallFailed: 'API 호출 실패',
      fetchModelsFailed: '모델을 가져오지 못했습니다',
      aiResponseError: '죄송합니다. 지금은 응답할 수 없습니다. 나중에 다시 시도하세요.',
    },
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
    errors: {
      allAisFailed: 'Todas as IAs falharam ao responder, verifique a chave API e a conexão de rede',
      apiKeyRequired: 'Configure a chave API primeiro. Você pode adicionar ?api=SUA_CHAVE à URL ou configurá-la nas configurações.',
      sendMessageFailed: 'Falha ao enviar mensagem, tente novamente',
      invalidApiKey: 'Chave API inválida. Verifique sua chave API.',
      rateLimitExceeded: 'Limite de taxa excedido. Tente novamente mais tarde.',
      apiError: 'Erro de API',
      noResponseBody: 'Sem resposta do servidor',
      requestAborted: 'Solicitação abortada',
      noContent: 'Sem conteúdo na resposta',
      apiCallFailed: 'Falha na chamada da API',
      fetchModelsFailed: 'Falha ao buscar modelos',
      aiResponseError: 'Desculpe, não posso responder agora. Por favor, tente novamente mais tarde.',
    },
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
    errors: {
      allAisFailed: '所有 AI 都无法响应，请检查 API 密钥和网络连接',
      apiKeyRequired: '请先设置 API 密钥。您可以在 URL 中添加 ?api=YOUR_KEY 或在设置中配置。',
      sendMessageFailed: '发送消息失败，请重试',
      invalidApiKey: '无效的 API 密钥。请检查您的 API 密钥。',
      rateLimitExceeded: '超出速率限制。请稍后再试。',
      apiError: 'API 错误',
      noResponseBody: '服务器无响应',
      requestAborted: '请求已中止',
      noContent: '响应中没有内容',
      apiCallFailed: 'API 调用失败',
      fetchModelsFailed: '获取模型失败',
      aiResponseError: '抱歉，我现在无法回答。请稍后再试。',
    },
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
    errors: {
      allAisFailed: 'Все ИИ не смогли ответить, проверьте API ключ и сетевое соединение',
      apiKeyRequired: 'Сначала установите API ключ. Вы можете добавить ?api=YOUR_KEY к URL или настроить его в настройках.',
      sendMessageFailed: 'Не удалось отправить сообщение, попробуйте еще раз',
      invalidApiKey: 'Неверный API ключ. Проверьте ваш API ключ.',
      rateLimitExceeded: 'Превышен лимит запросов. Попробуйте позже.',
      apiError: 'Ошибка API',
      noResponseBody: 'Нет ответа от сервера',
      requestAborted: 'Запрос прерван',
      noContent: 'Нет содержимого в ответе',
      apiCallFailed: 'Не удалось вызвать API',
      fetchModelsFailed: 'Не удалось получить модели',
      aiResponseError: 'Извините, я не могу ответить прямо сейчас. Пожалуйста, попробуйте позже.',
    },
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
 * Get translation text (React hook)
 */
export function useTranslation() {
  const lang = getCurrentLanguage()
  return translations[lang]
}

/**
 * Get translation text (non-React function for use in api.ts, store.ts, etc.)
 */
export function getTranslation() {
  const lang = getCurrentLanguage()
  return translations[lang]
}
