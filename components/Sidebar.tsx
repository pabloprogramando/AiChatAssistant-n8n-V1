
import React, { useEffect } from 'react';
import { ChatSession } from '../types';
import { AppUserInfo } from '../App'; // Import AppUserInfo

// UserInfo prop is now AppUserInfo
interface SidebarProps {
  userInfo: AppUserInfo;
  chatSessions: ChatSession[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onLogout: () => void;
}

// --- SVG Icons (Existing icons remain unchanged) ---
const NewChatIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const ChatBubbleIcon: React.FC<{className?: string}> = ({className}) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-2.286-2.287c-.082-.082-.172-.15-.267-.211A11.964 11.964 0 0 1 12 15c-2.673 0-5.144.949-7.02 2.506-.234.162-.507.27-.794.339V12.811C4.5 11.728 5.116 10.884 6 10.6c.261-.083.528-.15.794-.203a9.004 9.004 0 0 1 6.623-2.995c.284-.032.568-.055.856-.072Zm-12.623 5.186A8.961 8.961 0 0 1 12 6c2.67 0 5.14.95 7.017 2.502.232.16.504.268.79.336V7.5c0-1.135-.846-2.099-1.978-2.193C17.651 5.228 17.319 5.203 17 5.18c0-.002 0-.003 0-.005L12 2.25 7.022 5.18c-.32.18-.586.418-.79.688L3.75 8.25V12c0 .881.43 1.673 1.125 2.148A8.988 8.988 0 0 1 7.627 13.7Z" />
</svg>
);

const TrashIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.678-.112 1.017-.165m11.543 0c-3.443-.39-6.906-.642-10.44-.642S3.743 5.28 1.307 5.793M5.25 5.25h13.5" />
  </svg>
);

const LogoutIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);
// --- End SVG Icons ---


export const Sidebar: React.FC<SidebarProps> = ({
  userInfo,
  chatSessions,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onLogout,
}) => {

  useEffect(() => {
    const styleId = 'custom-scrollbar-styles-sidebar';
    if (document.getElementById(styleId)) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.innerHTML = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #4A5568; /* Tailwind gray-600 */
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #718096; /* Tailwind gray-500 */
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #4A5568 transparent;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      const existingStyleElement = document.getElementById(styleId);
      if (existingStyleElement) {
        document.head.removeChild(existingStyleElement);
      }
    };
  }, []);


  const handleDelete = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    onDeleteChat(chatId);
  };

  return (
    <aside className="w-64 md:w-72 bg-gray-800 flex flex-col p-3 border-r border-gray-700 shadow-lg">
      <button
        onClick={onNewChat}
        className="w-full flex items-center justify-center text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg mb-4 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
      >
        <NewChatIcon className="w-5 h-5 mr-2" />
        New Chat
      </button>

      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Recent Chats</h2>
      <nav className="flex-grow overflow-y-auto space-y-1 pr-1 -mr-1 custom-scrollbar">
        {chatSessions.length === 0 && (
            <p className="text-sm text-gray-500 px-2 py-1">No recent chats.</p>
        )}
        {chatSessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectChat(session.id)}
            className={`group flex items-center justify-between p-2.5 rounded-md text-sm cursor-pointer transition-all duration-150 ease-in-out
                        ${currentChatId === session.id ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'}`}
            role="button"
            aria-current={currentChatId === session.id ? "page" : undefined}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectChat(session.id)}
          >
            <div className="flex items-center overflow-hidden">
              <ChatBubbleIcon className={`w-4 h-4 mr-2.5 flex-shrink-0 ${currentChatId === session.id ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span className="truncate" title={session.title}>{session.title}</span>
            </div>
            <button
              onClick={(e) => handleDelete(e, session.id)}
              className={`p-1 rounded text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity
                         ${currentChatId === session.id ? 'opacity-100' : ''}`}
              aria-label={`Delete chat: ${session.title}`}
              title="Delete chat"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-3 border-t border-gray-700">
        <div className="flex items-center p-2">
          {userInfo.picture && ( // Access picture from AppUserInfo
            <img
              src={userInfo.picture}
              alt={userInfo.name || 'User avatar'} // Access name from AppUserInfo
              className="w-9 h-9 rounded-full mr-3 border-2 border-gray-600"
              referrerPolicy="no-referrer"
            />
          )}
          {!userInfo.picture && ( // Show default avatar if no picture
             <div className="w-9 h-9 rounded-full mr-3 border-2 border-gray-600 bg-gray-700 flex items-center justify-center text-gray-400 text-lg">
                {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : (userInfo.email ? userInfo.email.charAt(0).toUpperCase() : '?')}
             </div>
          )}
          <div className="flex-grow overflow-hidden">
            <p className="text-sm font-medium text-gray-100 truncate" title={userInfo.name || userInfo.email}>
              {userInfo.name || userInfo.email || 'User'} {/* Access name/email from AppUserInfo */}
            </p>
            {/* <p className="text-xs text-gray-400">Online</p>  Consider if this is still relevant or how to determine */}
          </div>
          <button
            onClick={onLogout}
            className="ml-2 p-2 text-gray-400 hover:text-red-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
            aria-label="Logout"
            title="Logout"
          >
            <LogoutIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
