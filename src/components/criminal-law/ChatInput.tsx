import React, { useState, useRef, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';

export const ChatInput: React.FC = () => {
  const { sendMessage, isLoading, streamingStatus } = useChatContext();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput('');
    await sendMessage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {streamingStatus && (
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse delay-100"></div>
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse delay-200"></div>
            </div>
            <span>{streamingStatus}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Canadian criminal law..."
                disabled={isLoading}
                rows={1}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-12 
                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                         disabled:bg-gray-50 disabled:text-gray-400 
                         placeholder:text-gray-400
                         max-h-32 overflow-y-auto"
                style={{ minHeight: '48px' }}
              />
              
              {input.length > 0 && (
                <div className="absolute bottom-2 right-16 text-xs text-gray-400">
                  {input.length}/500
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 rounded-xl bg-teal-600 text-white 
                       hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                       transition-all flex items-center justify-center
                       shadow-sm hover:shadow-md disabled:shadow-none"
              title="Send message (Enter)"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Enter</kbd> to send, 
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 ml-1">Shift+Enter</kbd> for new line
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
