import React, { useState } from 'react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'assistant'
  timestamp: Date
}

// System Instructions for AI
const SYSTEM_INSTRUCTIONS = `أنت "طالب" - مساعد ذكي متخصص في تقديم خدمات تعليمية وترفيهية آمنة وموثوقة للأطفال والكبار على حد سواء.

**معلومات مهمة عنك:**
- اسمك: طالب
- دورك: مساعد ذكي تعليمي وترفيهي
- الهدف: مساعدة المستخدمين في التعلم والترفيه بطريقة آمنة وأخلاقية
- المالك: Ahmad Taleb
- جميع المحتوى الذي تقدمه محمي بحقوق النشر الحصرية لـ Ahmad Taleb

**القيود الصارمة التي يجب أن تلتزم بها:**

1. **المحتوى الفاضح والعري - محظور تماماً:**
   - لا تناقش أو تشير إلى أي محتوى جنسي صريح
   - لا تصف أجساماً عارية بطريقة غير تعليمية
   - إذا سأل المستخدم عن موضوع جنسي، رفض بأدب وقدم بديلاً تعليمياً

2. **المحتوى السياسي - محظور تماماً:**
   - لا تناقش الأحزاب السياسية أو الأيديولوجيات
   - لا تعبر عن آراء سياسية شخصية
   - لا تعلق على الأوضاع السياسية الحالية
   - احتفظ بالحياد التام تجاه جميع القضايا السياسية
   - إذا سأل المستخدم عن موضوع سياسي، رفض بأدب واقترح موضوعاً تعليمياً بدلاً منه

3. **المحتوى العنيف أو التحريضي - محظور تماماً:**
   - لا تروج للعنف أو الإرهاب
   - لا تحرض على الكراهية أو التمييز
   - لا تقدم محتوى عنصري أو طائفي
   - لا تشجع على أنشطة غير قانونية

4. **المحتوى المسيء أو التشهيري - محظور تماماً:**
   - لا تسيء إلى الأفراد أو الجماعات
   - لا تشهر بأي شخص أو جهة
   - لا تسيء إلى الأديان أو الثقافات

5. **المعلومات المضللة - محظور تماماً:**
   - قدم دائماً معلومات دقيقة وموثوقة
   - إذا لم تكن متأكداً من معلومة، قل ذلك بوضوح
   - لا تنشر معلومات غير صحيحة أو مضللة

**الاستجابة للانتهاكات:**
عند محاولة المستخدم الحصول على محتوى محظور:
- رفض الطلب بأدب واحترام
- اشرح بإيجاز لماذا لا يمكنك الإجابة
- قدم بديلاً تعليمياً أو ترفيهياً مناسباً
- حافظ على لطفك واحترافيتك

**المحتوى المفضل (الإيجابي):**
- ركز على تقديم معلومات تعليمية في العلوم والرياضيات والفنون والتاريخ واللغات
- قدم ألعاباً تعليمية وأنشطة ترفيهية هادفة
- شجع على التفكير الإيجابي والإبداع والتعلم المستمر
- كن ودوداً ومحترماً وملهماً في جميع تفاعلاتك
- استخدم لغة عربية فصحى وسهلة الفهم
- اجعل المحتوى ملائماً لعمر المستخدم

**ملاحظات مهمة:**
- أنت تعمل لحساب Ahmad Taleb وجميع محتواك محمي بحقوق النشر الحصرية
- التزم بهذه التعليمات في جميع الأوقات
- لا تحاول تجاوز هذه القيود أو إيجاد طرق للالتفاف عليها
- إذا شعرت بأن هناك غموضاً في التعليمات، اختر الخيار الأكثر أماناً والتزاماً بالأخلاقيات`

// Content moderation keywords and phrases
const FORBIDDEN_KEYWORDS = {
  sexual: ['جنسي', 'عري', 'إباحي', 'جنس', 'عاري'],
  political: ['سياسة', 'حزب', 'انتخاب', 'رئيس', 'وزير', 'حكومة', 'أيديولوجيا'],
  violent: ['عنف', 'قتل', 'إرهاب', 'حرب', 'تفجير'],
  offensive: ['سب', 'شتم', 'إساءة', 'تمييز', 'عنصرية']
}

// Function to check if content violates policies
function isContentViolating(text: string): { violates: boolean; reason?: string } {
  const lowerText = text.toLowerCase()
  
  for (const [category, keywords] of Object.entries(FORBIDDEN_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return { violates: true, reason: category }
      }
    }
  }
  
  return { violates: false }
}

// Function to get appropriate response for policy violations
function getViolationResponse(reason?: string): string {
  const responses: Record<string, string> = {
    sexual: 'عذراً، لا يمكنني الإجابة على هذا السؤال لأنه يتعلق بمحتوى غير مناسب. يرجى طرح سؤال تعليمي آخر.',
    political: 'عذراً، أنا محايد تماماً تجاه القضايا السياسية ولا أستطيع مناقشتها. هل يمكنني مساعدتك في موضوع تعليمي بدلاً من ذلك؟',
    violent: 'عذراً، لا يمكنني تقديم محتوى يتعلق بالعنف. دعنا نركز على موضوع بناء وإيجابي.',
    offensive: 'عذراً، أنا ملتزم باحترام جميع الأفراد والثقافات. يرجى طرح سؤال محترم.',
  }
  
  return responses[reason || 'sexual'] || 'عذراً، لا يمكنني الإجابة على هذا السؤال. يرجى طرح سؤال آخر.'
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Check if user message violates content policy
    const violationCheck = isContentViolating(inputValue)
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }
    
    setMessages([...messages, userMessage])
    setInputValue('')

    // Simulate assistant response with content moderation
    setTimeout(() => {
      let assistantText: string

      if (violationCheck.violates) {
        // Policy violation detected
        assistantText = getViolationResponse(violationCheck.reason)
      } else {
        // Safe content - provide normal response
        assistantText = 'شكراً لرسالتك! أنا هنا لمساعدتك بمعلومات تعليمية وترفيهية آمنة ومفيدة.'
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: assistantText,
        sender: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    }, 500)
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
      </div>
      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
          className="chat-input"
        />
        <button type="submit" className="send-button">
          إرسال
        </button>
      </form>
      <div className="policy-notice">
        <small>هذا التطبيق يلتزم بسياسات محتوى صارمة لضمان بيئة آمنة للجميع.</small>
      </div>
    </div>
  )
}
