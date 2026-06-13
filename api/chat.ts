import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

const PERSONAS = {
  teacher: "أنت 'طالب المعلم' - مساعد تعليمي صبور وذكي. هدفك هو شرح المفاهيم المعقدة ببساطة، وتشجيع المستخدم على التعلم، وتقديم أمثلة توضيحية. استخدم لغة فصحى مبسطة.",
  friend: "أنت 'طالب الصديق' - مساعد ودود ومرح. تحدث بلغة قريبة من القلب، استخدم الرموز التعبيرية، وكن مستمعاً جيداً ومحفزاً. يمكنك استخدام لغة بيضاء (مزيج بين الفصحى والعامية الخفيفة).",
  storyteller: "أنت 'طالب الحكواتي' - مبدع في سرد القصص. خيالك واسع، وتستطيع تأليف قصص مشوقة للأطفال والكبار. استخدم أسلوباً روائياً جذاباً ومليئاً بالوصف.",
  default: "أنت 'طالب' - مساعد ذكي شامل، تعليمي وترفيهي آمن وموثوق. صممه Ahmad Taleb."
};

interface ChatRequest {
  message: string;
  persona?: keyof typeof PERSONAS;
  image?: { data: string; mimeType: string };
  conversationHistory?: Array<{ role: string; content: string }>;
}

// Try multiple models in case one fails
const MODEL_NAMES = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];

export async function handleChat(request: ChatRequest) {
  if (!apiKey) {
    return { success: false, error: "API key not configured (GEMINI_API_KEY is missing)" };
  }

  let lastError = null;

  for (const modelName of MODEL_NAMES) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const personaPrompt = PERSONAS[request.persona || "default"];
      
      const contents: any[] = [
        { role: "user", parts: [{ text: personaPrompt }] },
        { role: "model", parts: [{ text: "فهمت دوري. أنا طالب، مساعدك الذكي، جاهز لمساعدتك بكل دقة وأمانة." }] }
      ];

      if (request.conversationHistory && request.conversationHistory.length > 0) {
        request.conversationHistory.forEach(msg => {
          if (msg.content && msg.content.trim() !== "") {
            contents.push({
              role: msg.role === "user" ? "user" : "model",
              parts: [{ text: msg.content }]
            });
          }
        });
      }

      const currentParts: any[] = [];
      if (request.image && request.image.data) {
        currentParts.push({
          inlineData: { data: request.image.data, mimeType: request.image.mimeType }
        });
      }
      currentParts.push({ text: request.message || (request.image ? "ماذا يوجد في هذه الصورة؟" : "مرحبا") });
      contents.push({ role: "user", parts: currentParts });

      const result = await model.generateContent({ contents });
      const response = await result.response;
      const text = response.text();
      
      if (text) return { success: true, message: text };
    } catch (error) {
      console.error(`Error with model ${modelName}:`, error);
      lastError = error;
      // Continue to next model
    }
  }

  return { 
    success: false, 
    error: `(Final V3.0) All models failed. Last error: ${lastError instanceof Error ? lastError.message : "Unknown"}` 
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const result = await handleChat(req.body);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}
