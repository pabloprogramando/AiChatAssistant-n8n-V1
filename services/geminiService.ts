
import { GoogleGenAI, GenerateContentResponse, Content, Part } from "@google/genai";
import { ChatMessageData, MessageSender } from '../types';

// TypeScript declarations for Window.APP_CONFIG and Window.process are now in types.ts

const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

function formatChatHistoryForGemini(chatMessages: ChatMessageData[]): Content[] {
  return chatMessages
    .filter(msg => msg.sender === MessageSender.USER || msg.sender === MessageSender.BOT)
    .map(msg => {
      const role = msg.sender === MessageSender.USER ? 'user' : 'model';
      return {
        role: role,
        parts: [{ text: msg.text }] as Part[],
      };
    }) as Content[];
}

export async function getGeminiChatResponse(
  userMessage: string,
  history: ChatMessageData[] // This is the existing chat history from ChatPage
): Promise<string> {
  const currentApiKey = process.env.API_KEY; 
  if (!currentApiKey) {
    console.error("Gemini API Key (process.env.API_KEY) is not configured or accessible. This must be set via environment variables during the build/deployment process.");
    throw new Error("Gemini API Key is not configured. Please ensure it is set in the application's environment settings for deployment.");
  }
  
  const formattedHistory = formatChatHistoryForGemini(history);

  try {
    const aiClient = new GoogleGenAI({ apiKey: currentApiKey });
    const chat = aiClient.chats.create({
      model: GEMINI_MODEL_NAME,
      history: formattedHistory,
    });

    const response: GenerateContentResponse = await chat.sendMessage({ message: userMessage });
    
    const responseText = response.text;
    if (responseText === null || responseText === undefined || responseText.trim() === "") {
        console.warn("Gemini API returned a response without text or empty text.", response);
        throw new Error("The AI assistant returned an empty response.");
    }
    return responseText;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get response from AI: ${error.message}`);
    }
    throw new Error('An unknown error occurred while contacting the AI assistant.');
  }
}
