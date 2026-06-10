interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface ChatRequest {
  message: string;
  persona?: string;
  image?: { data: string; mimeType: string };
  conversationHistory?: ChatMessage[];
}

interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  persona: string = "default",
  image?: { data: string; mimeType: string }
): Promise<ChatResponse> {
  try {
    const request: ChatRequest = {
      message: userMessage,
      persona,
      image,
      conversationHistory
    };

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    return await response.json();
  } catch (error) {
    return { success: false, error: "Failed to connect to chat service" };
  }
}
