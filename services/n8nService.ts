
import { ChatMessageData, MessageSender } from '../types';

// TypeScript declaration for APP_CONFIG on window object is now in types.ts

// This service is specifically for getting AI chat responses.
// Saving and loading history will be handled directly in App.tsx for now.

export async function getN8nChatResponse(
  userMessage: string,
  history: ChatMessageData[], // This history is for the n8n AI response endpoint, not the full saved history necessarily
  sessionId: string 
): Promise<string> {
  const webhookUrl = window.APP_CONFIG?.N8N_CHAT_RESPONSE_WEBHOOK_URL;

  // if (!webhookUrl || webhookUrl === 'https://n8n-app.agreeableriver-225df3a2.westus.azurecontainerapps.io/webhook/chat' || webhookUrl.includes("agreeableriver")) { // Check for placeholder
  //   const errorMsg = "N8N Chat Response Webhook URL is not configured or is still the placeholder. Please set it in the APP_CONFIG script in index.html.";
  //   console.error(errorMsg);
  //   throw new Error(errorMsg);
  // }

  const bodyPayload = {
    mensaje: userMessage,
    sessionId: sessionId,
    // If your n8n workflow for AI responses expects history, format it here
    // For example:
    // chatHistory: history.filter(m => m.sender === MessageSender.USER || m.sender === MessageSender.BOT)
    //                     .map(m => ({ role: m.sender === MessageSender.USER ? 'user' : 'model', text: m.text }))
  };

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain',
      },
      body: JSON.stringify(bodyPayload),
    });
  } catch (networkError) {
    console.error('Network error calling n8n chat response webhook:', networkError);
    throw new Error('Network error: Failed to communicate with n8n service for AI response.');
  }

  let responseText = '';
  try {
    responseText = await response.text();
  } catch (textError) {
    console.error('Error reading response text from n8n service:', textError);
    throw new Error('Failed to read the response from the bot service.');
  }

  if (!response.ok) {
    let errorMessage = responseText || response.statusText;
    try {
      const jsonError = JSON.parse(responseText);
      errorMessage = jsonError.error?.message || jsonError.message || responseText;
    } catch (e) {}
    throw new Error(`The bot service returned an error (status ${response.status}): ${errorMessage}`);
  }

  if (responseText.trim() === '') {
    return "The bot didn't provide a specific response this time.";
  }

  const contentType = response.headers.get('content-type');
  let determinedReply: string | undefined;

  if (contentType && contentType.toLowerCase().includes('application/json')) {
    try {
      const data: any = JSON.parse(responseText);
      if (typeof data.output === 'string' && data.output.trim() !== '') {
        determinedReply = data.output.trim();
      } else if (typeof data.reply === 'string' && data.reply.trim() !== '') {
        determinedReply = data.reply.trim();
      } else if (typeof data.answer === 'string' && data.answer.trim() !== '') {
        determinedReply = data.answer.trim();
      } else {
        const firstStringValue = Object.values(data).find(
          value => typeof value === 'string' && (value as string).trim() !== ''
        );
        if (typeof firstStringValue === 'string') {
          determinedReply = (firstStringValue as string).trim();
        }
      }
      if (!determinedReply) {
        console.warn('The bot sent a JSON response, but it contained no usable text field. Raw response:', responseText);
        if (responseText.trim() !== "" && responseText.trim() !== "{}") {
            determinedReply = responseText.trim();
        } else {
            throw new Error('The bot sent a JSON response, but it contained no usable text.');
        }
      }
    } catch (parseError) {
      console.warn(`The bot's response was expected to be JSON but was malformed. Falling back to raw text. Parse error: ${parseError}. Raw response: "${responseText.substring(0, 150)}${responseText.length > 150 ? '...' : ''}"`);
      determinedReply = responseText.trim();
      if (!determinedReply) {
         throw new Error(`The bot's JSON response was malformed and no fallback text available. Raw response: "${responseText.substring(0, 150)}${responseText.length > 150 ? '...' : ''}"`);
      }
    }
  } else {
    determinedReply = responseText.trim();
  }

  if (!determinedReply) {
    throw new Error('The bot returned an empty or unprocessable response.');
  }

  return determinedReply;
}
