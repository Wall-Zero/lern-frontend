// src/context/ChatContext.tsx

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { criminalLawApi } from '../api/endpoints/criminalLaw';

interface Chat {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview?: {
    role: string;
    content: string;
    created_at: string;
  };
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  sources_metadata?: any;
  timestamp?: Date;
  isStreaming?: boolean;
}

interface ChatContextType {
  chats: Chat[];
  activeChat: number | null;
  loadChats: () => Promise<void>;
  createNewChat: () => void;
  selectChat: (chatId: number) => Promise<void>;
  deleteChat: (chatId: number) => Promise<void>;
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
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = useCallback(async () => {
    try {
      const data = await criminalLawApi.listChats();
      // El endpoint devuelve { results: [...] }
      const chatsList = data.results || [];
      setChats(Array.isArray(chatsList) ? chatsList : []);
    } catch (err: any) {
      console.error('Failed to load chats:', err);
      setChats([]);
    }
  }, []);

  const loadChatMessages = async (chatId: number) => {
    try {
      const data = await criminalLawApi.getChatMessages(chatId);
      // El endpoint devuelve { messages: [...] }
      const messagesList = data.messages || [];
      
      const formattedMessages: Message[] = (Array.isArray(messagesList) ? messagesList : []).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
        sources_metadata: msg.sources_metadata,
        timestamp: new Date(msg.created_at),
      }));
      
      setMessages(formattedMessages);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    }
  };

  const createNewChat = useCallback(() => {
    setActiveChat(null);
    setMessages([]);
    setError(null);
  }, []);

  const selectChat = useCallback(async (chatId: number) => {
    setActiveChat(chatId);
    setMessages([]);
    await loadChatMessages(chatId);
  }, []);

  const deleteChat = useCallback(async (chatId: number) => {
    try {
      await criminalLawApi.deleteChat(chatId);
      await loadChats();
      
      if (activeChat === chatId) {
        createNewChat();
      }
    } catch (err: any) {
      console.error('Failed to delete chat:', err);
      setError('Failed to delete chat');
    }
  }, [activeChat, createNewChat, loadChats]);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setStreamingStatus('Initializing...');

    const assistantMessageId = Date.now() + 1;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      let assistantContent = '';
      let metadata: any = {};
      let newChatId: number | null = null;

      await criminalLawApi.sendMessageStream(
        query,
        activeChat,
        {
          alpha: 0.5,
          limit: 10,
          use_reranker: true,
          use_canlii: false,
        },
        {
          onChatCreated: (chatId) => {
            newChatId = parseInt(chatId);
            setActiveChat(newChatId);
          },

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

          onComplete: (completionMetadata) => {
            metadata = completionMetadata;
            setStreamingStatus(null);
            
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: assistantContent || 'No response generated.',
                      sources_metadata: metadata,
                      isStreaming: false,
                    }
                  : msg
              )
            );

            // Recargar chats
            loadChats();
          },

          onError: (errorMessage) => {
            setError(errorMessage);
            setStreamingStatus(null);
            setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
          },
        }
      );
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to process query');
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
      setStreamingStatus(null);
    }
  }, [isLoading, activeChat, loadChats]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setStreamingStatus(null);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        loadChats,
        createNewChat,
        selectChat,
        deleteChat,
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