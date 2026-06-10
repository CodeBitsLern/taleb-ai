import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "");

// System instructions for Taleb AI
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
- إذا شعرت بأن هناك غموضاً في التعليمات، اختر الخيار الأكثر أماناً والتزاماً بالأخلاقيات`;

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function handleChat(
  request: ChatRequest
): Promise<ChatResponse> {
  try {
    if (!process.env.VITE_GEMINI_API_KEY) {
      return {
        success: false,
        error: "API key not configured",
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build conversation history for context
    const conversationHistory = request.conversationHistory || [];

    // Prepare the chat content
    const chatContent = [
      {
        role: "user",
        parts: [{ text: SYSTEM_INSTRUCTIONS }],
      },
      {
        role: "model",
        parts: [
          {
            text: "حسناً، فهمت التعليمات بشكل كامل. سألتزم بجميع السياسات والقيود المذكورة. أنا طالب، مساعدك الذكي، وأنا هنا لمساعدتك بطريقة آمنة وأخلاقية.",
          },
        ],
      },
      ...conversationHistory,
      {
        role: "user",
        parts: [{ text: request.message }],
      },
    ];

    // Call the Gemini API
    const result = await model.generateContent({
      contents: chatContent,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const response = result.response;
    const text = response.text();

    return {
      success: true,
      message: text,
    };
  } catch (error) {
    console.error("Chat API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Export as a default handler for serverless functions
export default async function handler(
  req: { method: string; body: ChatRequest },
  res: { status: (code: number) => { json: (data: any) => void } }
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const result = await handleChat(req.body);
  return res.status(result.success ? 200 : 400).json(result);
}
