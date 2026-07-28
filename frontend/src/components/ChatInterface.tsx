'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Stethoscope, MessageSquare, Quote, BookOpen, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface Citation {
  text: string;
  chunkIndex: number;
  sourceName: string;
  score?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt?: string;
}

interface DocumentInfo {
  _id: string;
  filename: string;
  documentType?: string;
}

interface Chat {
  _id: string;
  title: string;
  document: DocumentInfo | string;
  messages?: Message[];
}

interface ChatInterfaceProps {
  chat: Chat | null;
  onRefreshChat: (chatId: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ chat, onRefreshChat }) => {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, isSubmitting]);

  if (!chat) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 glass-panel rounded-3xl border-slate-800">
        <MessageSquare className="h-16 w-16 mb-4 text-slate-700 animate-pulse" />
        <h3 className="text-base font-bold text-slate-300">No Medical Consultation Active</h3>
        <p className="text-xs mt-1 text-slate-500 text-center max-w-xs">
          Select an existing conversation or start a new medical Q&A session by selecting a document in the sidebar.
        </p>
      </div>
    );
  }

  const documentInfo = typeof chat.document === 'object' ? chat.document : null;
  const documentName = documentInfo?.filename || 'Clinical Document';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isSubmitting) return;

    const queryText = question.trim();
    setQuestion('');
    setError(null);
    setIsSubmitting(true);

    try {
      if (!chat.messages) chat.messages = [];
      chat.messages.push({
        role: 'user',
        content: queryText,
        createdAt: new Date().toISOString(),
      });

      await api.post(`/chats/${chat._id}/question`, {
        question: queryText,
      });

      onRefreshChat(chat._id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit medical query.');
      chat.messages?.pop();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col glass-panel rounded-3xl border-slate-800/80 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white max-w-md truncate" title={chat.title}>
              {chat.title}
            </h2>
            <p className="text-[11px] text-slate-400">
              Scoped Vector Source: <span className="text-teal-400 font-semibold">{documentName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {(!chat.messages || chat.messages.length === 0) && !isSubmitting && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <Stethoscope className="h-8 w-8 text-teal-500 animate-pulse" />
            <h3 className="text-slate-300 font-semibold text-xs">Vector Indexed & Ready for Medical Q&A</h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Ask questions regarding <span className="text-slate-300 font-semibold">{documentName}</span>. MedSynexa AI will search vector segments and provide cited medical answers.
            </p>
          </div>
        )}

        {chat.messages?.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 ${
                  isUser
                    ? 'bg-teal-600 text-white rounded-br-none shadow-md shadow-teal-600/10'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
                  {isUser ? 'You (Doctor)' : 'MedSynexa AI'}
                </div>

                <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <BookOpen className="h-3.5 w-3.5 text-teal-400" />
                      <span>Verifiable Sources ({msg.citations.length})</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {msg.citations.map((cite, cIdx) => (
                        <details
                          key={cIdx}
                          className="group border border-slate-800 rounded-xl bg-slate-950/40 overflow-hidden"
                        >
                          <summary className="px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 cursor-pointer list-none flex items-center justify-between transition-colors">
                            <span className="flex items-center gap-1.5">
                              <Quote className="h-3 w-3 text-teal-500" />
                              <span>Source Segment {cIdx + 1} (Chunk {cite.chunkIndex})</span>
                            </span>
                            <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">
                              ▼
                            </span>
                          </summary>
                          <div className="p-3 bg-slate-950 text-xs text-slate-400 border-t border-slate-900 leading-relaxed max-h-36 overflow-y-auto">
                            "{cite.text}"
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSubmitting && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl p-4 bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none space-y-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                MedSynexa AI
              </div>
              <div className="flex items-center gap-1.5 p-1 text-teal-400 text-xs font-mono">
                <span className="typing-cursor">Searching pgvector segments & drafting response</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/20 text-red-200 text-xs flex items-start gap-2.5 mt-4">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-xs disabled:opacity-50"
            placeholder={`Ask a medical or guideline question about ${documentName}...`}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting || !question.trim()}
            className="px-5 py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] border border-teal-400/20 flex items-center justify-center shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
