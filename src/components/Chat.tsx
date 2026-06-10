import React, { useState } from 'react'
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    // Add user message to the chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Build conversation history for context (excluding the initial greeting)
      const conversationHistory: ConversationMessage[] = messages
        .filter(msg => msg.id !== '1') // Exclude the initial greeting
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          content: msg.text
        }))

      // Send message to the API
      const response = await sendChatMessage(inputValue, conversationHistory)

      if (response.success && response.message) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.message,
          sender: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Show error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.error || 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
          sender: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
        sender: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>طالب - المساعد الذكي</h1>
        <p className="copyright-notice">© 2026 Ahmad Taleb. جميع الحقوق محفوظة.</p>
      </div>
      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">
              {message.text}
            </div>
            <span className="message-time">
              {message.timestamp.toLocaleTimeString('ar-SA')}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-content">
              <span className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
          className="chat-input"
          disabled={isLoading}
        />
        <button type="submit" className="send-button" disabled={isLoading}>
          {isLoading ? '⏳' : '➤'}
        </button>
      </form>
      <div className="policy-notice">
        <small>هذا التطبيق يلتزم بسياسات محتوى صارمة لضمان بيئة آمنة للجميع.</small>
      </div>
    </div>
  )
}
