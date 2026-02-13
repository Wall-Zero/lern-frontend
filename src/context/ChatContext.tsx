// src/context/ChatContext.tsx

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { criminalLawApi } from '../api/endpoints/criminalLaw';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    sources?: any[];
    definitions?: any[];
    controlling_sections?: string[];
    case_citations?: any[];
    query_stats?: any;
  };
  isStreaming?: boolean;
}

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (query: string) => Promise<void>;
  clearChat: () => void;
  streamingStatus: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setStreamingStatus('Initializing...');

    // Create assistant message placeholder
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      let assistantContent = '';
      let metadata: any = {};

      // Use the criminalLawApi.askRAGStream method
      await criminalLawApi.askRAGStream(
        query,
        {
          alpha: 0.5,
          limit: 10,
          use_reranker: true,
          use_canlii: false,
        },
        {
          // Status updates
          onStatus: (status, message) => {
            const statusMessages: Record<string, string> = {
              'embedding': '🔍 Analyzing query...',
              'searching': '📚 Searching legal database...',
              'reranking': '⚖️ Ranking results...',
              'processing': '🔧 Processing definitions...',
              'canlii': '⚖️ Searching case law...',
              'generating': '✍️ Generating response...',
            };
            
            setStreamingStatus(statusMessages[status] || message || 'Processing...');
          },

          // Token streaming
          onToken: (token) => {
            assistantContent += token;
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: assistantContent }
                  : msg
              )
            );
          },

          // Completion
          onComplete: (completionMetadata) => {
            metadata = completionMetadata;
            setStreamingStatus(null);
            
            // Update final message with metadata
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: assistantContent || 'No response generated.',
                      metadata: metadata,
                      isStreaming: false,
                    }
                  : msg
              )
            );
          },

          // Error handling
          onError: (errorMessage) => {
            setError(errorMessage);
            setStreamingStatus(null);
            
            // Remove the streaming message on error
            setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
          },
        }
      );
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to process query');
      
      // Remove the streaming message on error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
      setStreamingStatus(null);
      abortControllerRef.current = null;
    }
  }, [isLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setStreamingStatus(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        error,
        sendMessage,
        clearChat,
        streamingStatus,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
