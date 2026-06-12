import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

const PERSONAS = {
  teacher: "أنت 'طالب المعلم' - مساعد تعليمي صبور وذكي. هدفك هو شرح المفاهيم المعقدة ببساطة، وتشجيع المستخدم على التعلم، وتقديم أمثلة توضيحية. استخدم لغة فصحى مبسطة.",
  friend: "أنت 'طالب الصديق' - مساعد ودود ومرح. تحدث بلغة قريبة من القلب، استخدم الرموز التعبيرية، وكن مستمعاً جيداً ومحفزاً. يمكنك استخدام لغة بيضاء (مزيج بين الفصحى والعامية الخفيفة).",
  storyteller: "أنت 'طالب الحكواتي' - مبدع في سرد القصص. خيالك واسع، وتستطيع تأليف قصص مشوقة للأطفال والكبار. استخدم أسلوباً روائياً جذاباً ومليئاً بالوصف.",
  default: "أنت 'طالب' - مساعد ذكي شامل، تعليمي وترفيهي آمن وموثوق."
};

interface ChatRequest {
  message: string;
  persona?: keyof typeof PERSONAS;
  image?: { data: string; mimeType: string };
  conversationHistory?: Array<{ role: string; content: string }>;
}

export async function handleChat(request: ChatRequest) {
  try {
    if (!apiKey) {
      return { success: false, error: "API key not configured (GEMINI_API_KEY is missing)" };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const personaPrompt = PERSONAS[request.persona || "default"];
    
    const contents: any[] = [
      { role: "user", parts: [{ text: personaPrompt }] },
      { role: "model", parts: [{ text: "فهمت دوري الجديد تماماً. أنا جاهز لمساعدتك بهذه الشخصية." }] }
    ];

    // Add history
    if (request.conversationHistory) {
      request.conversationHistory.forEach(msg => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add current message and image
    const currentParts: any[] = [{ text: request.message }];
    if (request.image) {
      currentParts.push({
        inlineData: {
          data: request.image.data,
          mimeType: request.image.mimeType
        }
      });
    }
    contents.push({ role: "user", parts: currentParts });

    const result = await model.generateContent({ contents });
    const response = await result.response;
    return { success: true, message: response.text() };
  } catch (error) {
    console.error(error);
    return { success: false, error: error instanceof Error ? error.message : "Error" };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const result = await handleChat(req.body);
  return res.status(result.success ? 200 : 400).json(result);
}
