# دليل إعداد تطبيق "طالب - المساعد الذكي"

## 🚀 البدء السريع

هذا الدليل يوضح كيفية تشغيل تطبيق "طالب" مع ذكاء اصطناعي حقيقي باستخدام Google Gemini API.

---

## 📋 المتطلبات

- **Node.js** 18.0 أو أحدث
- **npm** أو **yarn**
- حساب Google مجاني (للحصول على مفتاح Gemini API)

---

## 🔑 الخطوة 1: الحصول على مفتاح Google Gemini API

1. اذهب إلى [Google AI Studio](https://ai.google.dev/)
2. انقر على **"Get API Key"** (احصل على مفتاح API)
3. اختر **"Create API Key in new Google Cloud project"** أو استخدم مشروعاً موجوداً
4. سيتم إنشاء مفتاح API مجاني لك تلقائياً
5. **انسخ المفتاح** - ستحتاجه في الخطوة التالية

> **ملاحظة**: الطبقة المجانية من Google Gemini توفر:
> - **15 طلب في الدقيقة** (RPM)
> - **1 مليون رمز يومي** (tokens)
> - هذا كافٍ تماماً للاستخدام الشخصي والاختبار

---

## 📦 الخطوة 2: تثبيت المشروع

```bash
# 1. انسخ المستودع (إذا لم تكن قد فعلت ذلك)
git clone https://github.com/CodeBitsLern/taleb-ai.git
cd taleb-ai

# 2. ثبّت المكتبات
npm install

# 3. أنشئ ملف .env.local
cp .env.example .env.local

# 4. افتح .env.local وأضف مفتاح API الخاص بك
# VITE_GEMINI_API_KEY=your_key_here
```

---

## ⚙️ الخطوة 3: إعداد متغيرات البيئة

افتح ملف `.env.local` وأضف:

```env
VITE_GEMINI_API_KEY=your_actual_api_key_here
VITE_API_URL=http://localhost:3000
```

**مثال:**
```env
VITE_GEMINI_API_KEY=AIzaSyDxxx...xxxxx
VITE_API_URL=http://localhost:3000
```

---

## 🏃 الخطوة 4: تشغيل التطبيق محلياً

### الخيار الأول: استخدام Vite Dev Server

```bash
npm run dev
```

سيفتح التطبيق على `http://localhost:5173`

**المشكلة**: في هذا الوضع، لن تتمكن من استدعاء API من المتصفح مباشرة لأن مفتاح API سيكون مرئياً في الكود.

### الخيار الثاني: استخدام خادم Node.js (الموصى به)

1. **ثبّت Express** (إذا لم تكن قد فعلت):
```bash
npm install express cors
```

2. **أنشئ ملف `server.js`** في جذر المشروع:

```javascript
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

const SYSTEM_INSTRUCTIONS = `أنت "طالب" - مساعد ذكي متخصص في تقديم خدمات تعليمية وترفيهية آمنة وموثوقة...`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chatContent = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_INSTRUCTIONS }],
      },
      {
        role: 'model',
        parts: [
          {
            text: 'حسناً، فهمت التعليمات بشكل كامل. سألتزم بجميع السياسات والقيود المذكورة.',
          },
        ],
      },
      ...(conversationHistory || []),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const result = await model.generateContent({
      contents: chatContent,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const response = result.response;
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

3. **شغّل الخادم**:
```bash
node server.js
```

4. **في نافذة أخرى، شغّل Vite**:
```bash
npm run dev
```

الآن يمكنك الوصول إلى التطبيق على `http://localhost:5173` والخادم على `http://localhost:3000`

---

## 🌐 الخطوة 5: النشر على الإنترنت

### الخيار الأول: Vercel (الموصى به - مجاني)

1. **ادفع الكود إلى GitHub**:
```bash
git add .
git commit -m "Add Gemini AI integration"
git push origin main
```

2. **اذهب إلى [Vercel.com](https://vercel.com)**
3. انقر على **"New Project"**
4. اختر مستودع GitHub الخاص بك
5. أضف متغيرات البيئة:
   - `VITE_GEMINI_API_KEY`: مفتاح API الخاص بك
   - `VITE_API_URL`: رابط التطبيق المنشور (مثل `https://taleb-ai.vercel.app`)
6. انقر على **"Deploy"**

### الخيار الثاني: Netlify (مجاني أيضاً)

1. **اذهب إلى [Netlify.com](https://netlify.com)**
2. انقر على **"Add new site"** > **"Import an existing project"**
3. اختر GitHub وحدد المستودع
4. أضف متغيرات البيئة في **Site settings** > **Build & deploy** > **Environment**
5. انقر على **"Deploy"**

### الخيار الثالث: Railway.app (مجاني مع حد أدنى)

1. اذهب إلى [Railway.app](https://railway.app)
2. انقر على **"New Project"**
3. اختر **"Deploy from GitHub"**
4. اختر المستودع الخاص بك
5. أضف متغيرات البيئة
6. انقر على **"Deploy"**

---

## ✅ اختبار التطبيق

بعد التشغيل (محلياً أو على الإنترنت):

1. افتح التطبيق في المتصفح
2. اكتب رسالة مثل: **"مرحباً، من أنت؟"**
3. انتظر الرد من "طالب"
4. جرّب أسئلة تعليمية مثل: **"ما هي عاصمة فرنسا؟"**

---

## 🐛 استكشاف الأخطاء

### المشكلة: "API key not configured"
**الحل**: تأكد من أن `VITE_GEMINI_API_KEY` موجود في ملف `.env.local`

### المشكلة: "Failed to connect to chat service"
**الحل**: تأكد من أن الخادم يعمل على `http://localhost:3000`

### المشكلة: CORS errors
**الحل**: تأكد من أن الخادم يستخدم `cors()` middleware

### المشكلة: رسائل بطيئة جداً
**الحل**: هذا طبيعي في الطبقة المجانية من Gemini. يمكنك الترقية للحصول على سرعة أفضل.

---

## 📚 الموارد الإضافية

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Vercel Deployment Guide](https://vercel.com/docs)

---

## 🎉 تم!

تهانينا! لديك الآن تطبيق "طالب" يعمل مع ذكاء اصطناعي حقيقي!

للمزيد من المساعدة، يمكنك:
- فتح issue على GitHub
- التواصل على البريد: ahmad.taleb9611@gmail.com

---

**آخر تحديث**: 2026-06-10
**الإصدار**: 1.0.0
