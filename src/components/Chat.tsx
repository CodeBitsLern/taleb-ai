import React, { useState, useEffect, useRef } from 'react'
import { sendChatMessage } from '../utils/api'

interface Message {
  id: string
  text: string
  sender: 'user' | 'assistant'
  timestamp: Date
}

interface ConversationMessage {
  role: 'user' | 'model'
  content: string
}

const STORAGE_KEY = 'taleb_chat_history'
const THEME_KEY = 'taleb_theme'

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'مرحباً! أنا طالب، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟',
      sender: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDarkMode(initialTheme)
    document.documentElement.setAttribute('data-theme', initialTheme ? 'dark' : 'light')
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme ? 'dark' : 'light')
    localStorage.setItem(THEME_KEY, newTheme ? 'dark' : 'light')
  }

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.lang = 'ar-SA'
      recognitionRef.current.interimResults = false

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        setIsListening(false)
      }
      recognitionRef.current.onend = () => setIsListening(false)
    }
  }, [])

  // Load history
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY)
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory)
        setMessages(parsedHistory.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) })))
      } catch (e) { console.error(e) }
    }
  }, [])

  useEffect(() => {
    if (messages.length > 1 || (messages.length === 1 && messages[0].sender === 'assistant' && messages[0].id !== '1')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleClearHistory = () => {
    if (window.confirm('هل أنت متأكد من مسح السجل؟')) {
      stopSpeaking()
      setMessages([{ id: '1', text: 'مرحباً! أنا طالب، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟', sender: 'assistant', timestamp: new Date() }])
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const toggleListening = () => {
    if (isListening) { recognitionRef.current?.stop() }
    else { stopSpeaking(); recognitionRef.current?.start(); setIsListening(true) }
  }

  const detectLanguage = (text: string): string => {
    const englishPattern = /[a-zA-Z]/
    return englishPattern.test(text) ? 'en-US' : 'ar-SA'
  }

  const speak = (text: string) => {
    stopSpeaking()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = detectLanguage(text)
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    stopSpeaking()
    const userMessage: Message = { id: Date.now().toString(), text: inputValue, sender: 'user', timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const history: ConversationMessage[] = messages.filter(m => m.id !== '1').map(m => ({ role: m.sender === 'user' ? 'user' : 'model', content: m.text }))
      const response = await sendChatMessage(inputValue, history)
      if (response.success && response.message) {
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), text: response.message, sender: 'assistant', timestamp: new Date() }
        setMessages(prev => [...prev, assistantMsg])
        speak(response.message)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-top">
          <div className="header-info">
            <h1>طالب AI</h1>
          </div>
          <div className="header-actions">
            <button onClick={toggleTheme} className="action-btn" title="تبديل الوضع">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            {isSpeaking && (
              <button onClick={stopSpeaking} className="action-btn stop-btn" title="إيقاف الصوت">
                🔇
              </button>
            )}
            <button onClick={handleClearHistory} className="action-btn" title="مسح السجل">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">
              {message.text}
              {message.sender === 'assistant' && (
                <button className="inline-speak-btn" onClick={() => speak(message.text)}>🔊</button>
              )}
            </div>
            <span className="message-time">{message.timestamp.toLocaleTimeString('ar-SA')}</span>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <button type="button" onClick={toggleListening} className={`voice-btn ${isListening ? 'listening' : ''}`}>
          {isListening ? '🛑' : '🎤'}
        </button>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="تحدث مع طالب..."
          className="chat-input"
          disabled={isLoading}
        />
        <button type="submit" className="send-button" disabled={isLoading || !inputValue.trim()}>
          ➤
        </button>
      </form>
      <div className="policy-notice">
        <small>© 2026 Ahmad Taleb. جميع الحقوق محفوظة.</small>
      </div>
    </div>
  )
}
