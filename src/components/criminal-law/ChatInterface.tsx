import React from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChatContext } from '../../context/ChatContext';

interface ChatInterfaceProps {
  onNavigateToNotes?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onNavigateToNotes }) => {
  const { error } = useChatContext();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ChatHeader onNavigateToNotes={onNavigateToNotes} />

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <MessageList />

      <ChatInput />
    </div>
  );
};
