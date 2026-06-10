interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    const request: ChatRequest = {
      message: userMessage,
      conversationHistory: conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to get response from AI",
      };
    }

    const data = (await response.json()) as ChatResponse;
    return data;
  } catch (error) {
    console.error("Chat API error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to connect to chat service",
    };
  }
}
