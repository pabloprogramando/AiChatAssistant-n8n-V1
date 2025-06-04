

export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
  TYPING_INDICATOR = 'typing_indicator',
  ERROR = 'error',
}

export interface ChatMessageData {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date; // Ensure this is Date type
}

export interface ChatSession { // For sidebar display
  id: string;
  title: string;
  lastUpdated: number; // Store as timestamp (Date.now())
}

export interface StoredConversation {
  id: string; // Conversation UUID, matches ChatSession.id
  user_app_id: string; // Supabase user ID
  messages: ChatMessageData[];
  title: string;
  created_at: string; // ISO date string from DB
  updated_at: string; // ISO date string from DB
}

// The UserInfo interface previously here is no longer needed.
// App.tsx defines AppUserInfo which is used by ChatPage and Sidebar.
// LoginPage directly uses Supabase types.

// Centralized global declarations
declare global {
  interface Window {
    APP_CONFIG?: {
      N8N_CHAT_RESPONSE_WEBHOOK_URL?: string;
      N8N_SAVE_CHAT_WEBHOOK_URL?: string;
      N8N_RETRIEVE_CHAT_WEBHOOK_URL?: string;
      N8N_DELETE_CHAT_WEBHOOK_URL?: string; // Added for deleting chats
      N8N_WEBHOOK_URL?: string; // General N8N webhook URL
      API_KEY?: string;         // API key potentially for n8n or other services configured via APP_CONFIG
    };
    process?: {
      env?: {
        [key: string]: string | undefined;
        API_KEY?: string;         // Gemini API Key, sourced from actual environment variables
        N8N_WEBHOOK_URL?: string; // N8N Webhook URL from environment variables
      };
    };
  }
}