import React, { useState, useEffect, useRef } from 'react'
import { sendChatMessage } from '../utils/api'

interface Message {
  id: string
  text: string
  sender: 'user' | 'assistant'
  timestamp: Date
  image?: string
}

interface Persona {
  id: string;
  name: string;
  icon: string;
}

const PERSONAS: Persona[] = [
  { id: 'default', name: 'طالب الشامل', icon: '🤖' },
  { id: 'teacher', name: 'طالب المعلم', icon: '👨‍🏫' },
  { id: 'friend', name: 'طالب الصديق', icon: '🤝' },
  { id: 'storyteller', name: 'طالب الحكواتي', icon: '📚' },
];

const STORAGE_KEY = 'taleb_chat_history_v2'
const THEME_KEY = 'taleb_theme'

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState('default')
  const [selectedImage, setSelectedImage] = useState<{data: string, mimeType: string, preview: string} | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY)
    const initialTheme = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDarkMode(initialTheme)
    document.documentElement.setAttribute('data-theme', initialTheme ? 'dark' : 'light')

    const savedHistory = localStorage.getItem(STORAGE_KEY)
    if (savedHistory) {
      setMessages(JSON.parse(savedHistory).map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) })))
    } else {
      setMessages([{ id: '1', text: 'مرحباً! أنا طالب، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟', sender: 'assistant', timestamp: new Date() }])
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.lang = 'ar-SA'
      recognitionRef.current.onresult = (e: any) => setInputValue(e.results[0][0].transcript)
      recognitionRef.current.onend = () => setIsListening(false)
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1]
        setSelectedImage({
          data: base64String,
          mimeType: file.type,
          preview: reader.result as string
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const speak = (text: string) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = /[a-zA-Z]/.test(text) ? 'en-US' : 'ar-SA'
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!inputValue.trim() && !selectedImage) || isLoading) return

    const userMsg: Message = { 
      id: Date.now().toString(), 
      text: inputValue, 
      sender: 'user', 
      timestamp: new Date(),
      image: selectedImage?.preview 
    }
    
    setMessages(prev => [...prev, userMsg])
    const currentInput = inputValue
    const currentImage = selectedImage
    setInputValue('')
    setSelectedImage(null)
    setIsLoading(true)

    try {
      const history = messages.filter(m => m.id !== '1').map(m => ({ role: m.sender === 'user' ? 'user' : 'model', content: m.text }))
      const response = await sendChatMessage(currentInput, history, selectedPersona, currentImage ? {data: currentImage.data, mimeType: currentImage.mimeType} : undefined)
      if (response.success && response.message) {
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), text: response.message, sender: 'assistant', timestamp: new Date() }
        setMessages(prev => [...prev, assistantMsg])
        speak(response.message)
      } else {
        const errorMsg: Message = { id: (Date.now() + 1).toString(), text: `خطأ: ${response.error || 'حدث خطأ غير متوقع'}`, sender: 'assistant', timestamp: new Date() }
        setMessages(prev => [...prev, errorMsg])
      }
    } catch (e) { 
      console.error(e)
      const errorMsg: Message = { id: (Date.now() + 1).toString(), text: 'عذراً، تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت أو المحاولة لاحقاً.', sender: 'assistant', timestamp: new Date() }
      setMessages(prev => [...prev, errorMsg])
    }
    finally { setIsLoading(false) }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-top">
          <div className="persona-selector">
            {PERSONAS.map(p => (
              <button 
                key={p.id} 
                className={`persona-btn ${selectedPersona === p.id ? 'active' : ''}`}
                onClick={() => setSelectedPersona(p.id)}
                title={p.name}
              >
                {p.icon}
              </button>
            ))}
          </div>
          <div className="header-actions">
            <button onClick={() => {
              setIsDarkMode(!isDarkMode)
              document.documentElement.setAttribute('data-theme', !isDarkMode ? 'dark' : 'light')
              localStorage.setItem(THEME_KEY, !isDarkMode ? 'dark' : 'light')
            }} className="action-btn">{isDarkMode ? '☀️' : '🌙'}</button>
            <button onClick={() => {
              window.speechSynthesis.cancel()
              setMessages([{ id: '1', text: 'مرحباً! أنا طالب، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟', sender: 'assistant', timestamp: new Date() }])
              localStorage.removeItem(STORAGE_KEY)
            }} className="action-btn">🗑️</button>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map(m => (
          <div key={m.id} className={`message ${m.sender}`}>
            <div className="message-content">
              {m.image && <img src={m.image} alt="uploaded" className="message-img" />}
              {m.text}
              {m.sender === 'assistant' && <button className="inline-speak-btn" onClick={() => speak(m.text)}>🔊</button>}
            </div>
            <span className="message-time">{m.timestamp.toLocaleTimeString('ar-SA')}</span>
          </div>
        ))}
        {isLoading && <div className="message assistant"><div className="message-content"><div className="typing-indicator"><span></span><span></span><span></span></div></div></div>}
        <div ref={messagesEndRef} />
      </div>

      {selectedImage && (
        <div className="image-preview-bar">
          <img src={selectedImage.preview} alt="preview" />
          <button onClick={() => setSelectedImage(null)}>✕</button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input type="file" accept="image/*" ref={fileInputRef} style={{display: 'none'}} onChange={handleImageSelect} />
        <button type="button" className="action-btn" onClick={() => fileInputRef.current?.click()}>🖼️</button>
        <button type="button" className={`voice-btn ${isListening ? 'listening' : ''}`} onClick={() => {
          if (isListening) recognitionRef.current?.stop()
          else { window.speechSynthesis.cancel(); recognitionRef.current?.start(); setIsListening(true) }
        }}>{isListening ? '🛑' : '🎤'}</button>
        <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={`تحدث مع ${PERSONAS.find(p => p.id === selectedPersona)?.name}...`} className="chat-input" disabled={isLoading} />
        <button type="submit" className="send-button" disabled={isLoading}>➤</button>
      </form>
    </div>
  )
}
