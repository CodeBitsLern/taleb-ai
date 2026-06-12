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

// Use the relative path for API calls to ensure it works on the same domain (Vercel)
// Only use VITE_API_URL if it's explicitly set and not empty
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

    // In production on Vercel, we should use the relative path /api/chat
    // In development, we use VITE_API_URL if provided, otherwise fallback to /api/chat
    const url = (import.meta.env.PROD) ? '/api/chat' : (API_BASE_URL ? `${API_BASE_URL}/api/chat` : '/api/chat');

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.error || `HTTP Error ${response.status}: ${response.statusText}` 
      };
    }

    return await response.json();
  } catch (error) {
    console.error("Chat API Error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to connect to chat service" 
    };
  }
}
