// src/components/criminal-law/ChatSidebar.tsx

import React from 'react';
import { useChatContext } from '../../context/ChatContext';

export const ChatSidebar: React.FC = () => {
  const { chats, activeChat, createNewChat, selectChat, deleteChat } = useChatContext();

  const handleDeleteChat = (e: React.MouseEvent, chatId: number) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat?')) {
      deleteChat(chatId);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header con Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <div>
            <div className="text-gray-900 font-bold text-base">Criminal Law</div>
            <div className="text-gray-500 text-xs">Research Assistant</div>
          </div>
        </div>
        
        <button
          onClick={createNewChat}
          className="w-full px-4 py-2.5 bg-teal-600 hover:bg-teal-700
                   text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm
                   shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        {chats.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 text-sm mb-2">No chats yet</div>
            <div className="text-gray-500 text-xs">Start a new conversation!</div>
          </div>
        ) : (
          <div className="p-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
              Recent Chats
            </div>
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat.id)}
                  className={`
                    group relative px-3 py-3 rounded-lg cursor-pointer 
                    transition-all duration-150
                    ${activeChat === chat.id 
                      ? 'bg-teal-50 border border-teal-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${activeChat === chat.id ? 'bg-teal-500' : 'bg-gray-300'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium line-clamp-2 mb-1 ${
                        activeChat === chat.id ? 'text-teal-900' : 'text-gray-700'
                      }`}>
                        {chat.title || 'Untitled Chat'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{chat.message_count} msg{chat.message_count !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{new Date(chat.updated_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 
                               rounded-md text-gray-400 hover:text-red-600 transition-all flex-shrink-0"
                      title="Delete chat"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>System Active</span>
        </div>
      </div>
    </div>
  );
};