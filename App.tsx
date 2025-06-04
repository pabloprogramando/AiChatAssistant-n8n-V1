




import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LoginPage } from './components/LoginPage';
import { ChatPage } from './components/ChatPage';
import { Sidebar } from './components/Sidebar';
import { MessageSender, ChatMessageData, ChatSession, StoredConversation } from './types';
import { supabase, Session, User } from './supabaseClient';
import { getN8nChatResponse } from './services/n8nService'; // Import for AI response

export interface AppUserInfo {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
}

const createWelcomeMessage = (userName?: string): ChatMessageData => ({
  id: uuidv4(),
  text: `Hello, ${userName || 'User'}! I'm your AI assistant. How can I help you today?`,
  sender: MessageSender.BOT,
  timestamp: new Date(),
});

const TYPING_INDICATOR_ID = 'typing-indicator-message'; // Consistent ID

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [allConversations, setAllConversations] = useState<Record<string, StoredConversation>>({});
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false); // For AI response loading state
  const [historyFetchError, setHistoryFetchError] = useState<string | null>(null);
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  const initialLoadAttemptedForUserId = useRef<string | null>(null);
  // const sessionRef = useRef<Session | null>(null); // Not actively used, can be removed if no other use cases emerge

  const currentUser = session?.user;

  const handleNewChat = useCallback((userForNewChat: User) => {
    if (!userForNewChat) {
        console.warn("handleNewChat called without a valid user.");
        return;
    }
    const newConversationId = uuidv4();
    const userName = userForNewChat.user_metadata?.full_name || userForNewChat.user_metadata?.name || userForNewChat.email;
    const welcomeMsg = createWelcomeMessage(userName);
    
    const newConversation: StoredConversation = {
      id: newConversationId,
      user_app_id: userForNewChat.id,
      messages: [welcomeMsg],
      title: "New Chat",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setAllConversations(prev => ({ ...prev, [newConversationId]: newConversation }));
    setCurrentConversationId(newConversationId);
    setHistoryFetchError(null); // Clear any previous fetch error when a new chat is explicitly created
  }, []);

  const fetchPastConversations = useCallback(async (userId: string): Promise<StoredConversation[]> => {
    const retrieveUrl = window.APP_CONFIG?.N8N_RETRIEVE_CHAT_WEBHOOK_URL;
    if (!retrieveUrl || retrieveUrl.includes('YOUR_N8N_RETRIEVE_CHAT_WEBHOOK_URL_PLACEHOLDER') || !retrieveUrl.includes("agreeableriver")) {
      console.error("N8N Retrieve Chat Webhook URL is not configured in index.html.");
      throw new Error("Chat history service is not configured.");
    }

    const response = await fetch(`${retrieveUrl}?user_app_id=${encodeURIComponent(userId)}`);
    const responseText = await response.text();

    if (!response.ok) {
      const errorMsg = `Failed to fetch conversations: ${response.status} ${response.statusText}. Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!responseText || responseText.trim() === "") {
      return []; 
    }
    
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      const detailedErrorMessage = `Failed to parse JSON response from retrieve chat webhook. Raw response: "${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}". Original error: ${parseError.message}`;
      console.error("Error parsing JSON response from retrieve chat webhook:", parseError, "Raw response (full):", responseText);
      throw new Error(detailedErrorMessage);
    }

    if (!Array.isArray(data)) {
      const typeErrorMsg = `Fetched conversation data is not an array as expected. Type: ${typeof data}. Raw response: "${responseText.substring(0,200)}${responseText.length > 200 ? '...' : ''}". Parsed data (sample): ${JSON.stringify(data)?.substring(0,100)}`;
      console.error(typeErrorMsg, "Full parsed data:", data);
      throw new Error(typeErrorMsg);
    }
    
    return (data as any[]).map(convo => { // Use any[] for raw convo from webhook
      let processedMessages: ChatMessageData[];
      let rawMessagesArray: any[] = [];

      if (Array.isArray(convo.messages)) {
        rawMessagesArray = convo.messages;
      } else if (typeof convo.messages === 'object' && convo.messages !== null && Array.isArray(convo.messages.chat_history)) {
        // Handle nested chat_history
        rawMessagesArray = convo.messages.chat_history;
        console.info(`Conversation ID ${convo.id || 'N/A'}: Extracted messages from nested 'chat_history' property.`);
      } else {
        if (convo.messages != null) { 
          console.warn(`Conversation ID ${convo.id || 'N/A'}: 'messages' property is neither an array nor an object with a 'chat_history' array (type: ${typeof convo.messages}). Defaulting to empty messages. Raw messages content (first 100 chars):`, JSON.stringify(convo.messages).substring(0,100));
        } else { 
          console.warn(`Conversation ID ${convo.id || 'N/A'}: 'messages' property is missing or null. Defaulting to empty messages.`);
        }
        // rawMessagesArray remains [] as initialized
      }
      
      processedMessages = rawMessagesArray.map((msg: any) => {
        let validTimestamp = new Date(); 
        if (msg.timestamp) {
          const parsedTs = new Date(msg.timestamp);
          if (!isNaN(parsedTs.getTime())) {
            validTimestamp = parsedTs;
          } else {
            console.warn(`Conversation ID ${convo.id || 'N/A'}, Message ID ${msg.id || 'N/A'}: Invalid message timestamp '${msg.timestamp}'. Defaulting to current time.`);
          }
        } else {
            console.warn(`Conversation ID ${convo.id || 'N/A'}, Message ID ${msg.id || 'N/A'}: Missing message timestamp. Defaulting to current time.`);
        }
        return {
          id: msg.id || uuidv4(), // Ensure message has an ID
          text: msg.text || "",
          sender: msg.sender || MessageSender.BOT, // Default sender if missing
          timestamp: validTimestamp
        };
      });

      let validCreatedAt = new Date().toISOString();
      if (convo.created_at) {
        const parsedDate = new Date(convo.created_at);
        if (!isNaN(parsedDate.getTime())) {
          validCreatedAt = parsedDate.toISOString();
        } else {
          console.warn(`Conversation ID ${convo.id || 'N/A'}: Invalid created_at timestamp '${convo.created_at}'. Defaulting to current time.`);
        }
      } else {
        console.warn(`Conversation ID ${convo.id || 'N/A'}: Missing created_at timestamp. Defaulting to current time.`);
      }

      let validUpdatedAt = new Date().toISOString();
      if (convo.updated_at) {
        const parsedDate = new Date(convo.updated_at);
        if (!isNaN(parsedDate.getTime())) {
          validUpdatedAt = parsedDate.toISOString();
        } else {
          console.warn(`Conversation ID ${convo.id || 'N/A'}: Invalid updated_at timestamp '${convo.updated_at}'. Defaulting to current time.`);
        }
      } else {
        // If updated_at is missing, it's reasonable to use created_at or current time
        validUpdatedAt = validCreatedAt; // Or new Date().toISOString() if preferred
        console.warn(`Conversation ID ${convo.id || 'N/A'}: Missing updated_at timestamp. Defaulting to created_at or current time.`);
      }
      
      // Ensure essential fields like id and title exist, providing defaults
      const conversationId = convo.id || uuidv4();
      if (!convo.id) {
        console.warn(`Conversation from webhook missing 'id'. Generated new ID: ${conversationId}`);
      }
      const conversationTitle = convo.title || "Untitled Chat";
       if (!convo.title) {
        console.warn(`Conversation ID ${conversationId} from webhook missing 'title'. Defaulting to "Untitled Chat".`);
      }


      return {
        id: conversationId,
        user_app_id: convo.user_app_id || userId, // Ensure user_app_id is present
        messages: processedMessages,
        title: conversationTitle,
        created_at: validCreatedAt,
        updated_at: validUpdatedAt,
      } as StoredConversation; // Cast to StoredConversation after processing
    });
  }, []);

  const saveConversation = useCallback(async (conversationToSave: StoredConversation) => {
    const user = session?.user; 
    if (!user) {
        console.warn("Cannot save conversation, no user session.");
        return;
    }
    const saveUrl = window.APP_CONFIG?.N8N_SAVE_CHAT_WEBHOOK_URL;
    if (!saveUrl || saveUrl.includes('YOUR_N8N_SAVE_CHAT_WEBHOOK_URL_PLACEHOLDER') || !saveUrl.includes("agreeableriver")) {
      console.error("N8N Save Chat Webhook URL is not configured in index.html.");
      return;
    }
    const payload = {
      user_app_id: user.id,
      conversation_id: conversationToSave.id,
      messages: conversationToSave.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : new Date(msg.timestamp).toISOString() // Ensure ISO string
      })),
      title: conversationToSave.title,
    };
    try {
      const response = await fetch(saveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to save conversation ${conversationToSave.id}: ${response.status} ${response.statusText}`, errorText);
      }
    } catch (error) {
      console.error("Error saving conversation:", error);
    }
  }, [session]);

  useEffect(() => {
    const manageAuthSession = async (currentAuthSession: Session | null) => {
      const user = currentAuthSession?.user ?? null;
      setSession(currentAuthSession); 

      if (user) {
        if (user.id !== initialLoadAttemptedForUserId.current) {
          initialLoadAttemptedForUserId.current = user.id; 
          setAuthLoading(true); 
          setIsLoadingHistory(true);
          setHistoryFetchError(null); 

          try {
            const convos = await fetchPastConversations(user.id);
            if (convos.length > 0) {
              const convosMap = convos.reduce((acc, convo) => {
                acc[convo.id] = convo;
                return acc;
              }, {} as Record<string, StoredConversation>);
              setAllConversations(convosMap);
              const sortedConvos = [...convos].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
              setCurrentConversationId(sortedConvos[0].id);
            } else {
              handleNewChat(user);
            }
          } catch (error) {
            console.error("manageAuthSession: Failed to fetch or process past conversations:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to load chat history. Please try again or start a new chat.";
            setHistoryFetchError(errorMessage);
            setAllConversations({}); 
            setCurrentConversationId(null);
          } finally {
            setIsLoadingHistory(false);
            setAuthLoading(false); 
          }
        } else { 
          if (!isLoadingHistory && !historyFetchError) { 
            if (Object.keys(allConversations).length === 0 && !currentConversationId) {
               if (!Object.values(allConversations).find(c => c.user_app_id === user.id)) {
                  handleNewChat(user);
               }
            }
          }
          setAuthLoading(false); 
        }
      } else { 
        setAllConversations({});
        setCurrentConversationId(null);
        initialLoadAttemptedForUserId.current = null; 
        setHistoryFetchError(null); 
        setAuthLoading(false);
      }
    };

    setAuthLoading(true); 
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      initialLoadAttemptedForUserId.current = null; 
      setHistoryFetchError(null);
      manageAuthSession(initialSession);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        const currentLoadedUserId = initialLoadAttemptedForUserId.current;
        const newPotentialUserId = newSession?.user?.id;

        if (newPotentialUserId !== currentLoadedUserId) {
            initialLoadAttemptedForUserId.current = null; 
            setHistoryFetchError(null); 
        }
        manageAuthSession(newSession);
      }
    );
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchPastConversations, handleNewChat]); 

  useEffect(() => {
    const sessions = Object.values(allConversations)
      .map(convo => ({
        id: convo.id,
        title: convo.title,
        lastUpdated: new Date(convo.updated_at).getTime(),
      }))
      .sort((a, b) => b.lastUpdated - a.lastUpdated);
    setChatSessions(sessions);
  }, [allConversations]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const handleSelectChat = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
  }, []);
  
  const handleDeleteChat = useCallback(async (conversationIdToDelete: string) => {
    const user = session?.user;
    if (!user) {
      console.warn("Cannot delete conversation: no user session.");
      alert("You must be logged in to delete conversations.");
      return;
    }

    const conversationAboutToDelete = allConversations[conversationIdToDelete];
    if (!conversationAboutToDelete) {
      console.warn(`Conversation with ID ${conversationIdToDelete} not found for deletion confirmation.`);
      // This case should ideally not happen if the UI is in sync
      alert("Conversation not found. It might have already been deleted.");
      return;
    }

    const userConfirmed = window.confirm(
      `Are you sure you want to delete the conversation "${conversationAboutToDelete.title}"? This action cannot be undone.`
    );

    if (!userConfirmed) {
      return;
    }

    const deleteUrl = window.APP_CONFIG?.N8N_DELETE_CHAT_WEBHOOK_URL;
    if (!deleteUrl || deleteUrl.includes('YOUR_N8N_DELETE_CHAT_WEBHOOK_URL_PLACEHOLDER') || !deleteUrl.startsWith("http")) {
      console.error("N8N Delete Chat Webhook URL is not configured correctly in index.html or is still a placeholder.");
      alert("Error: Chat deletion service is not configured or the URL is invalid. The chat was not deleted from the server.");
      return;
    }

    try {
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_app_id: user.id,
          conversation_id: conversationIdToDelete,
        }),
      });

      if (response.ok) {
        // Backend deletion successful, now update UI and local state
        const newAllConversations = { ...allConversations };
        delete newAllConversations[conversationIdToDelete];
        
        setAllConversations(newAllConversations);

        if (currentConversationId === conversationIdToDelete) {
          const sortedRemainingSessions = Object.values(newAllConversations)
            .map(c => ({ id: c.id, title: c.title, lastUpdated: new Date(c.updated_at).getTime() }))
            .sort((a, b) => b.lastUpdated - a.lastUpdated);
          
          if (sortedRemainingSessions.length > 0) {
            setCurrentConversationId(sortedRemainingSessions[0].id);
          } else if (!historyFetchError && currentUser) { 
            handleNewChat(currentUser); // This will set the new chat as current
          } else {
            setCurrentConversationId(null); // No chats left, and potentially an error or no user
          }
        }
        // alert("Conversation deleted successfully."); // Optional: User feedback
      } else {
        // Backend deletion failed
        const errorText = await response.text();
        console.error(`Failed to delete conversation ${conversationIdToDelete} from backend: ${response.status} ${response.statusText}`, errorText);
        alert(`Failed to delete conversation from the server (Error ${response.status}). Please try again. Details: ${errorText.substring(0,100)}`);
      }
    } catch (error) {
      console.error("Error calling delete chat webhook:", error);
      alert("An error occurred while trying to delete the conversation. Please check your connection and try again.");
    }
  }, [allConversations, currentConversationId, handleNewChat, session, historyFetchError, currentUser]);

  const handleUserMessageSubmit = useCallback(async (conversationId: string, userMessageText: string) => {
    if (!currentUser || !allConversations[conversationId]) {
      console.error("Cannot submit message: no user or conversation not found.");
      return;
    }

    const userMessage: ChatMessageData = { id: uuidv4(), text: userMessageText, sender: MessageSender.USER, timestamp: new Date() }; 
    const typingIndicator: ChatMessageData = { id: TYPING_INDICATOR_ID, text: 'Bot is typing...', sender: MessageSender.TYPING_INDICATOR, timestamp: new Date() };

    setAllConversations(prev => { 
        const currentConvo = prev[conversationId];
        return {
            ...prev,
            [conversationId]: {
            ...currentConvo,
            messages: [...currentConvo.messages.filter(m => m.id !== TYPING_INDICATOR_ID), userMessage, typingIndicator],
            updated_at: new Date().toISOString(),
            },
        };
    });
    setIsAiResponding(true);

    let botMessage: ChatMessageData;
    try {
      const messagesForAIHistory = [...allConversations[conversationId].messages.filter(m => m.id !== TYPING_INDICATOR_ID), userMessage];
      const botResponseText = await getN8nChatResponse(userMessageText, messagesForAIHistory, conversationId);
      botMessage = { id: uuidv4(), text: botResponseText, sender: MessageSender.BOT, timestamp: new Date() };
    } catch (error) {
      console.error("Error getting AI response:", error);
      botMessage = { id: uuidv4(), text: error instanceof Error ? error.message : "An error occurred with the AI.", sender: MessageSender.ERROR, timestamp: new Date() };
    } finally {
      setIsAiResponding(false);
      setAllConversations(prev => {
        const currentConvo = prev[conversationId];
        if (!currentConvo) return prev; 

        let newTitle = currentConvo.title;
        const userMessagesInConvo = currentConvo.messages.filter(m => m.sender === MessageSender.USER && m.id !== userMessage.id);
        if ((newTitle === "New Chat" || newTitle.startsWith("New Chat") || newTitle === "Untitled Chat") && userMessagesInConvo.length === 0) { 
            newTitle = userMessage.text.substring(0, 35) + (userMessage.text.length > 35 ? "..." : "");
        }
        const finalMessages = [...currentConvo.messages.filter(m => m.id !== TYPING_INDICATOR_ID && m.id !== userMessage.id), userMessage, botMessage];
        const updatedConvoForSave: StoredConversation = {
            ...currentConvo,
            messages: finalMessages,
            title: newTitle,
            updated_at: new Date().toISOString(),
        };
        saveConversation(updatedConvoForSave); 
        return { ...prev, [conversationId]: updatedConvoForSave };
      });
    }
  }, [currentUser, allConversations, saveConversation, getN8nChatResponse]); 


  // --- Render Logic ---
  const showLoadingScreen = authLoading || (session && isLoadingHistory && !historyFetchError && initialLoadAttemptedForUserId.current === session.user?.id && Object.keys(allConversations).length === 0);

  if (showLoadingScreen) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-lg">
          {authLoading && !session ? "Initializing session..." : "Loading chat history..."}
        </p>
      </div>
    );
  }

  if (!session) { 
    return <LoginPage />;
  }
  
  const appUserInfo: AppUserInfo = {
    id: currentUser.id, 
    email: currentUser.email,
    name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email,
    picture: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture,
  };

  if (historyFetchError && Object.keys(allConversations).length === 0 && !currentConversationId) {
    return (
      <div className="flex h-screen bg-gray-900 text-white antialiased">
        <Sidebar
          userInfo={appUserInfo}
          chatSessions={chatSessions} 
          currentChatId={null}
          onNewChat={() => { if(currentUser) handleNewChat(currentUser); }} 
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onLogout={handleLogout}
        />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-800">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-500 mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
          </svg>
          <h2 className="text-xl font-semibold text-red-400 mb-3">Error Loading Chats</h2>
          <p className="text-gray-300 mb-6 text-sm max-w-md">{historyFetchError}</p>
          <button
            onClick={() => { if(currentUser) handleNewChat(currentUser); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            <NewChatIcon className="w-5 h-5 mr-2 inline" />
            Start New Chat
          </button>
        </main>
      </div>
    );
  }
  
  const currentMessages = currentConversationId ? allConversations[currentConversationId]?.messages : [];

  return (
    <div className="flex h-screen bg-gray-900 text-white antialiased">
      <Sidebar
        userInfo={appUserInfo}
        chatSessions={chatSessions}
        currentChatId={currentConversationId}
        onNewChat={() => { if(currentUser) handleNewChat(currentUser);}}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentConversationId && allConversations[currentConversationId] ? ( 
          <ChatPage
            key={currentConversationId} 
            userInfo={appUserInfo}
            conversationId={currentConversationId}
            messages={allConversations[currentConversationId].messages}
            onLogout={handleLogout} 
            onUserSubmit={handleUserMessageSubmit}
            isAiResponding={isAiResponding}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-blue-500 mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-3.86 8.25-8.625 8.25S3.75 16.556 3.75 12C3.75 7.444 7.365 3.75 12 3.75c4.701 0 8.303 3.348 8.605 7.645a.75.75 0 0 0 .595.805 60.618 60.618 0 0 1 .37 5.363Z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-200 mb-2">AI Chat Assistant</h2>
            <p className="text-gray-400 mb-6">
              {isLoadingHistory ? "Loading chats..." : (currentUser && Object.keys(allConversations).length === 0 && !historyFetchError ? "Start your first conversation!" : "Select a chat or start a new one.")}
            </p>
            <button
              onClick={() => { if(currentUser) handleNewChat(currentUser);}}
              disabled={isLoadingHistory || !currentUser}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
            >
              <NewChatIcon className="w-5 h-5 mr-2 inline" />
              Start New Chat
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

const NewChatIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
