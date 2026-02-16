import React from 'react';
import { useChatContext } from '../../context/ChatContext';

interface ChatHeaderProps {
  onNavigateToNotes?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onNavigateToNotes }) => {
  const { clearChat, messages } = useChatContext();

  const handleClearChat = () => {
    if (messages.length > 0) {
      if (window.confirm('Are you sure you want to clear this chat?')) {
        clearChat();
      }
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Criminal Law Research
              </h1>
              <p className="text-xs text-gray-500">
                Powered by RAG + Retrieval
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
