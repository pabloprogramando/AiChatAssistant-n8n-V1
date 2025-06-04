

import React, { useEffect, useRef, useState } // Removed useCallback
from 'react';
import { ChatMessageData, MessageSender } from '../types'; // Removed MessageSender
import { ChatWindow } from './ChatWindow';
import { ChatInput } from './ChatInput';
// import { getN8nChatResponse } from '../services/n8nService'; // No longer called here
import { AppUserInfo } from '../App'; 

// const TYPING_INDICATOR_ID = 'typing-indicator-message'; // No longer managed here

interface ChatPageProps {
  userInfo: AppUserInfo; 
  conversationId: string; 
  messages: ChatMessageData[]; // Changed from initialMessages
  onLogout: () => void;
  onUserSubmit: (conversationId: string, userMessageText: string) => void; // New prop
  isAiResponding: boolean; // New prop
  // onMessagesUpdate prop is removed
}

// --- SVG Icons --- (Remain Unchanged from your provided file)
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
  </svg>
);
const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
  </svg>
);
const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);
const DefaultAvatarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-8 h-8"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
const MinimizeToWidgetIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
    <rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);
const MaximizeToFullscreenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
  </svg>
);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);
const ChatFloatingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-2.286-2.287c-.082-.082-.172-.15-.267-.211A11.964 11.964 0 0 1 12 15c-2.673 0-5.144.949-7.02 2.506-.234.162-.507.27-.794.339V12.811C4.5 11.728 5.116 10.884 6 10.6c.261-.083.528-.15.794-.203a9.004 9.004 0 0 1 6.623-2.995c.284-.032.568-.055.856-.072Zm-12.623 5.186A8.961 8.961 0 0 1 12 6c2.67 0 5.14.95 7.017 2.502.232.16.504.268.79.336V7.5c0-1.135-.846-2.099-1.978-2.193C17.651 5.228 17.319 5.203 17 5.18c0-.002 0-.003 0-.005L12 2.25 7.022 5.18c-.32.18-.586.418-.79.688L3.75 8.25V12c0 .881.43 1.673 1.125 2.148A8.988 8.988 0 0 1 7.627 13.7Z" />
  </svg>
);
// --- End SVG Icons ---

export const ChatPage: React.FC<ChatPageProps> = ({ 
  userInfo, 
  conversationId, 
  messages, // Use messages prop directly
  onLogout, 
  onUserSubmit,
  isAiResponding
}) => {
  // Local messages state and isLoading state are removed
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [chatDisplayMode, setChatDisplayMode] = useState<'fullscreen' | 'widget'>('fullscreen');
  const [isWidgetExpanded, setIsWidgetExpanded] = useState<boolean>(true);

  // Removed useEffect hooks related to syncing initialMessages to local messages
  // and the effect that called onMessagesUpdate.

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const switchToFullScreenMode = () => setChatDisplayMode('fullscreen');
  const switchToWidgetMode = () => setChatDisplayMode('widget');
  const minimizeWidget = () => setIsWidgetExpanded(false);
  const expandWidget = () => setIsWidgetExpanded(true);

  const handleSendMessageToApp = (userMessageText: string) => {
    if (!conversationId) {
      console.error("ChatPage: Conversation ID is missing when trying to send message.");
      // Optionally, display an error message in the UI if App.tsx doesn't handle this
      return;
    }
    onUserSubmit(conversationId, userMessageText);
  };

  const handleShareChat = async () => {
    const chatText = messages // Use messages prop
      .filter(msg => msg.sender === MessageSender.USER || msg.sender === MessageSender.BOT)
      .map(msg => `${msg.sender === MessageSender.USER ? (userInfo.name || 'User') : 'Bot'}: ${msg.text}`)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(chatText);
      setShowCopiedNotification(true);
      setTimeout(() => setShowCopiedNotification(false), 2000);
    } catch (err) {
      console.error('Failed to copy chat text: ', err);
      alert('Failed to copy chat.');
    }
  };

  const handleSettingsClick = () => {
    alert('Settings functionality is not yet implemented.');
    setIsUserMenuOpen(false);
  };

  if (chatDisplayMode === 'widget' && !isWidgetExpanded) {
    return (
      <button
        onClick={expandWidget}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-xl z-[1000] transition-all duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        aria-label="Open Chat"
        title="Open Chat"
      >
        <ChatFloatingIcon className="w-7 h-7" />
      </button>
    );
  }

  const headerTitle = chatDisplayMode === 'fullscreen' ? "Conversation" : "Chat";
  const headerBaseClasses = "shadow-md flex-shrink-0 flex items-center justify-between border-b border-gray-600";
  const fullscreenHeaderClasses = "bg-gray-700 p-3 sm:p-4 min-h-[60px] sm:min-h-[68px]";
  const widgetHeaderClasses = "bg-gray-700 p-2.5 rounded-t-lg min-h-[50px]";

  const ChatInterfaceCore = (
    <>
      <header className={`${headerBaseClasses} ${chatDisplayMode === 'fullscreen' ? fullscreenHeaderClasses : widgetHeaderClasses}`}>
        <h1 className={`font-semibold text-gray-100 ${chatDisplayMode === 'fullscreen' ? 'text-lg sm:text-xl' : 'text-base'}`}>
          {headerTitle}
        </h1>

        <div className={`flex items-center ${chatDisplayMode === 'fullscreen' ? 'space-x-2 sm:space-x-3' : 'space-x-1.5'}`}>
          <button
            onClick={handleShareChat}
            className={`flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${chatDisplayMode === 'fullscreen' ? 'text-xs sm:text-sm py-1.5 px-2.5 sm:py-2 sm:px-3' : 'text-xs py-1 px-2'}`}
            title="Copy chat to clipboard"
          >
            <ShareIcon className={`mr-1 ${chatDisplayMode === 'fullscreen' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-3.5 h-3.5'}`} />
            Share
          </button>
          {showCopiedNotification && <span className="text-xs text-green-400 animate-pulse">Copied!</span>}
          
          {chatDisplayMode === 'fullscreen' ? (
            <button
              onClick={switchToWidgetMode}
              className="p-1.5 sm:p-2 rounded-full hover:bg-gray-600 transition-colors text-gray-300 hover:text-white"
              title="Switch to Widget Mode"
              aria-label="Switch to Widget Mode"
            >
              <MinimizeToWidgetIcon className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
          ) : ( 
            <>
              <button
                onClick={switchToFullScreenMode}
                className="p-1.5 rounded-full hover:bg-gray-500 transition-colors text-gray-300 hover:text-white"
                title="Switch to Full-Screen Mode"
                aria-label="Switch to Full-Screen Mode"
              >
                <MaximizeToFullscreenIcon className="w-4 h-4" />
              </button>
              <button
                onClick={minimizeWidget}
                className="p-1.5 rounded-full hover:bg-gray-500 transition-colors text-gray-300 hover:text-white"
                title="Minimize Chat"
                aria-label="Minimize Chat"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </>
          )}
          
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="p-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-700"
              aria-label="Open user menu"
              aria-haspopup="true"
              aria-expanded={isUserMenuOpen}
              id="user-menu-button"
            >
              {userInfo.picture ? (
                <img
                  src={userInfo.picture}
                  alt={userInfo.name || 'User avatar'}
                  className={`rounded-full border-2 border-gray-500 group-hover:border-blue-400 transition-colors ${chatDisplayMode === 'fullscreen' ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-7 h-7'}`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <DefaultAvatarIcon className={`text-gray-400 p-1 bg-gray-600 rounded-full border-2 border-gray-500 ${chatDisplayMode === 'fullscreen' ? 'w-8 h-8 sm:w-9 sm:h-9' : 'w-7 h-7'}`} />
              )}
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-60 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-[1050] py-1 origin-top-right"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
              >
                <div className="px-3 py-2 border-b border-gray-700">
                  <p className="text-sm font-semibold text-gray-100 truncate" title={userInfo.name}>
                    {userInfo.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate" title={userInfo.email}>
                    {userInfo.email || 'No email provided'}
                  </p>
                </div>
                <button
                  onClick={handleSettingsClick}
                  className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  role="menuitem"
                >
                  <SettingsIcon className="w-4 h-4 mr-2.5 text-gray-400" />
                  Settings
                </button>
                <button
                  onClick={() => { onLogout(); setIsUserMenuOpen(false); }}
                  className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  role="menuitem"
                >
                  <LogoutIcon className="w-4 h-4 mr-2.5 text-gray-400" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <ChatWindow messages={messages} /> {/* Use messages prop */}
      <ChatInput onSendMessage={handleSendMessageToApp} isLoading={isAiResponding} /> {/* Use isAiResponding prop */}
    </>
  );

  if (chatDisplayMode === 'fullscreen') {
    return (
      <div className="flex flex-col h-full max-h-screen bg-gray-800 text-white sm:shadow-inner overflow-hidden">
        {ChatInterfaceCore}
      </div>
    );
  }

  return (
    <div 
        className="fixed bottom-6 right-6 w-[350px] h-[520px] sm:w-[370px] sm:h-[550px] bg-gray-800 text-white rounded-xl shadow-2xl flex flex-col overflow-hidden z-[1000] transition-all duration-300 ease-in-out"
        style={{ opacity: isWidgetExpanded ? 1 : 0, transform: isWidgetExpanded ? 'scale(1)' : 'scale(0.95)' }}
    >
      {ChatInterfaceCore}
    </div>
  );
};