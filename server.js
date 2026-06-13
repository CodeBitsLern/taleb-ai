import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // Also try default .env

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ Warning: GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey || "");

const SYSTEM_INSTRUCTIONS = `أنت "طالب" - مساعد ذكي متخصص في تقديم خدمات تعليمية وترفيهية آمنة وموثوقة للأطفال والكبار على حد سواء.

**معلومات مهمة عنك:**
- اسمك: طالب
- دورك: مساعد ذكي تعليمي وترفيهي
- الهدف: مساعدة المستخدمين في التعلم والترفيه بطريقة آمنة وأخلاقية
- المالك: Ahmad Taleb
- جميع المحتوى الذي تقدمه محمي بحقوق النشر الحصرية لـ Ahmad Taleb

**القيود الصارمة:**
- لا للمحتوى الفاضح أو العنيف أو السياسي المثير للجدل.
- كن دائماً مؤدباً، دقيقاً، ومفيداً.
- أجب باللغة العربية الفصحى ما لم يطلب المستخدم غير ذلك.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory, image } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Use gemini-1.5-flash for consistency and better capabilities
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const contents = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_INSTRUCTIONS }],
      },
      {
        role: 'model',
        parts: [{ text: 'حسناً، أنا طالب، مساعدك الذكي. سألتزم بالتعليمات وأقدم لك أفضل إجابة ممكنة.' }],
      },
    ];

    // Add history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      });
    }

    // Current message
    const currentParts = [];
    if (image && image.data) {
      currentParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      });
    }
    currentParts.push({ text: message || "ماذا يوجد في هذه الصورة؟" });

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    const result = await model.generateContent({
      contents,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const response = await result.response;
    const text = response.text();

    res.json({ success: true, message: text });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error occurred',
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Taleb AI Server is running', model: 'gemini-1.5-flash' });
});

app.listen(PORT, () => {
  console.log(`🚀 Taleb AI Server running on http://localhost:${PORT}`);
});
