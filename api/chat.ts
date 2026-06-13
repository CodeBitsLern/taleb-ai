import { GoogleGenerativeAI } from "@google/generative-ai";

// Use stable v1 API version if possible, or ensure correct model naming
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// Force use of a stable configuration
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

export async function handleChat(request: ChatRequest) {
  if (!apiKey) {
    return { success: false, error: "API key not configured (GEMINI_API_KEY is missing)" };
  }

  try {
    // Using the most stable model name for v1/v1beta
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      apiVersion: "v1" // Explicitly use stable v1
    });

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
    currentParts.push({ text: request.message || "مرحبا" });
    contents.push({ role: "user", parts: currentParts });

    const result = await model.generateContent({ contents });
    const response = await result.response;
    const text = response.text();
    
    if (text) return { success: true, message: text };
    throw new Error("Empty response");
  } catch (error) {
    console.error("Chat Error:", error);
    return { 
      success: false, 
      error: `(V4.0 Stable) Error: ${error instanceof Error ? error.message : "Unknown"}` 
    };
  }
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
