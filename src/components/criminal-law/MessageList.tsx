// src/components/chat/MessageList.tsx

import React, { useEffect, useRef } from 'react';
import { useChatContext } from '../../context/ChatContext';

export const MessageList: React.FC = () => {
  const { messages } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Criminal Law Research Assistant
          </h2>
          <p className="text-gray-600">
            Ask me anything about Canadian criminal law. I'll search through legal documents,
            statutes, and provide detailed answers with citations.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-2 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg text-left">
              <span className="text-gray-500">Try:</span>{' '}
              <span className="text-gray-700">"What are the conditions for bail?"</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-left">
              <span className="text-gray-500">Or:</span>{' '}
              <span className="text-gray-700">"Explain the reasonable doubt standard"</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] ${
                message.role === 'user'
                  ? 'bg-teal-600 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm'
              } px-5 py-4`}
            >
              {/* Message Content */}
              <div
                className={`prose prose-sm max-w-none ${
                  message.role === 'user' ? 'prose-invert' : ''
                }`}
              >
                {message.content || (
                  <span className="text-gray-400 italic">Generating response...</span>
                )}
              </div>

              {/* Streaming Indicator */}
              {message.isStreaming && (
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse delay-200"></div>
                  </div>
                  <span>Streaming...</span>
                </div>
              )}

              {/* Metadata (Sources, Definitions, etc.) */}
              {message.metadata && !message.isStreaming && (
                <div className="mt-4 space-y-3 pt-4 border-t border-gray-200">
                  {/* Sources */}
                  {message.metadata.sources && message.metadata.sources.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Sources
                      </h4>
                      <div className="space-y-1.5">
                        {message.metadata.sources.slice(0, 3).map((source: any, idx: number) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs transition-colors group"
                          >
                            <div className="font-medium text-gray-900 group-hover:text-teal-600 line-clamp-1">
                              {source.title}
                            </div>
                            {source.rerank_score && (
                              <div className="text-gray-500 mt-0.5">
                                Relevance: {(source.rerank_score * 100).toFixed(0)}%
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Definitions */}
                  {message.metadata.definitions && message.metadata.definitions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Key Definitions
                      </h4>
                      <div className="space-y-1.5">
                        {message.metadata.definitions.slice(0, 2).map((def: any, idx: number) => (
                          <div key={idx} className="p-2 bg-teal-50 rounded-lg text-xs">
                            <span className="font-semibold text-teal-900">{def.term}:</span>{' '}
                            <span className="text-gray-700">{def.definition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Controlling Sections */}
                  {message.metadata.controlling_sections && message.metadata.controlling_sections.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Relevant Sections
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {message.metadata.controlling_sections.slice(0, 5).map((section: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Query Stats */}
                  {message.metadata.query_stats && (
                    <div className="text-xs text-gray-500 flex items-center gap-3 pt-2">
                      <span>📊 {message.metadata.query_stats.final_results} sources analyzed</span>
                      <span>⚡ {message.metadata.query_stats.tokens_generated} tokens</span>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div className="mt-2 text-xs text-gray-400">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
