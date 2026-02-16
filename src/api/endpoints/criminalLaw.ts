// src/api/endpoints/criminalLaw.ts

import apiClient from '../client';

export interface RAGSearchParams {
  alpha?: number;
  limit?: number;
  use_reranker?: boolean;
  use_canlii?: boolean;
}

export interface StreamCallbacks {
  onStatus?: (status: string, message?: string) => void;
  onToken?: (token: string) => void;
  onComplete?: (metadata: any) => void;
  onError?: (error: string) => void;
  onChatCreated?: (chatId: string) => void;
}

export const criminalLawApi = {
  // GET /api/chats/ - Lista todos los chats
  listChats: async () => {
    const response = await apiClient.get('/chats/');
    return response.data; // { count, next, previous, results: [...] }
  },

  // GET /api/chats/{id} - Obtiene un chat con sus mensajes
  getChatMessages: async (chatId: number) => {
    const response = await apiClient.get(`/chats/${chatId}/`);
    return response.data; // { id, title, messages: [...] }
  },

  // DELETE /api/chats/{id} - Elimina un chat (soft delete)
  deleteChat: async (chatId: number) => {
    const response = await apiClient.delete(`/chats/${chatId}/`);
    return response.data;
  },

  // POST /api/chats/send-message/ o /api/chats/{id}/send-message/
  sendMessageStream: async (
    content: string,
    chatId: number | null,
    params: RAGSearchParams,
    callbacks: StreamCallbacks
  ) => {
    const url = chatId 
      ? `${apiClient.defaults.baseURL}/chats/${chatId}/send-message/`
      : `${apiClient.defaults.baseURL}/chats/send-message/`;
    
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content, ...params }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No reader available');
    }

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.status === 'chat_created') {
              callbacks.onChatCreated?.(parsed.chat_id);
            }
            else if (parsed.status && !['streaming', 'complete'].includes(parsed.status)) {
              callbacks.onStatus?.(parsed.status, parsed.message);
            }
            else if (parsed.status === 'streaming' && parsed.token) {
              callbacks.onToken?.(parsed.token);
            }
            else if (parsed.status === 'complete' && parsed.done) {
              const responseData = parsed.response || {};
              
              const metadata = {
                answer: responseData.answer,
                confidence: responseData.confidence,
                confidence_breakdown: responseData.confidence_breakdown,
                query_type: responseData.query_type,
                intent: responseData.intent,
                primary_source: responseData.primary_source,
                supporting_sources: responseData.supporting_sources,
                citations: responseData.citations,
                citation_validation: responseData.citation_validation,
                key_sections: responseData.key_sections,
                definitions: responseData.definitions,
                case_citations: responseData.case_citations,
                warnings: responseData.warnings,
                suggested_followups: responseData.suggested_followups,
                metadata: responseData.metadata,
              };
              
              callbacks.onComplete?.(metadata);
            }
            else if (parsed.status === 'error') {
              callbacks.onError?.(parsed.error);
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  },
};