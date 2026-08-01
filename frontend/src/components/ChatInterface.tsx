'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Stethoscope, MessageSquare, Quote, BookOpen, AlertCircle, FlaskConical, Mic, MicOff, Download } from 'lucide-react';
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

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  
  const baseTranscriptRef = useRef<string>('');
  const finalRef = useRef<string>('');
  const interimRef = useRef<string>('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, isSubmitting]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        let final = '';
        let interim = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        finalRef.current = final;
        interimRef.current = interim;

        const separator = baseTranscriptRef.current && final ? ' ' : '';
        setQuestion(baseTranscriptRef.current + separator + final);
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        console.warn('Speech recognition warning:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        let fullText = baseTranscriptRef.current;
        if (finalRef.current) fullText += (fullText ? ' ' : '') + finalRef.current.trim();
        if (interimRef.current) fullText += (fullText ? ' ' : '') + interimRef.current.trim();
        
        setQuestion(fullText);
        setInterimTranscript('');
      };
    }
  }, []);

  if (!chat) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 p-8 gap-3.5 text-center">
        <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-800">No Active Query</h3>
          <p className="text-[10px] mt-1 text-gray-400 max-w-xs leading-normal">
            Select a reference book or report from the library to start a clinical query session.
          </p>
        </div>
      </div>
    );
  }

  const documentInfo = typeof chat.document === 'object' ? chat.document : null;
  const documentName = documentInfo?.filename || 'Medical Library';
  const isLabDoc = documentInfo?.documentType === 'lab_report';

  const submitQuestion = async (queryText: string) => {
    if (!queryText.trim() || isSubmitting) return;

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

      await api.post(`/chats/${chat._id}/question`, { question: queryText });
      onRefreshChat(chat._id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit query.');
      chat.messages?.pop();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion(question);
  };

  // Whisper Recording
  const [isWhisperProcessing, setIsWhisperProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      recognitionRef.current?.start();
    } catch (err) {
      console.error("Microphone access denied:", err);
      setError("Please allow microphone access to use voice dictation.");
      setIsListening(false);
    }
  };

  const stopRecordingAndTranscribe = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        resolve('');
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          const response = await api.post('/speech/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          resolve(response.data.text);
        } catch (err) {
          console.error("Whisper error:", err);
          reject(err);
        }
      };

      mediaRecorderRef.current.stop();
      recognitionRef.current?.stop();
    });
  };

  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false);
      setIsWhisperProcessing(true);
      
      try {
        const whisperText = await stopRecordingAndTranscribe();
        const separator = baseTranscriptRef.current && whisperText ? ' ' : '';
        const fullText = baseTranscriptRef.current + separator + whisperText.trim();
        
        setQuestion(fullText);
        setInterimTranscript('');
        
        if (fullText.trim()) {
          submitQuestion(fullText);
        }
      } catch (err) {
        let fullText = baseTranscriptRef.current;
        if (finalRef.current) fullText += (fullText ? ' ' : '') + finalRef.current.trim();
        if (interimRef.current) fullText += (fullText ? ' ' : '') + interimRef.current.trim();
        
        setQuestion(fullText);
        setInterimTranscript('');
        if (fullText.trim()) {
          submitQuestion(fullText);
        }
      } finally {
        setIsWhisperProcessing(false);
      }
    } else {
      baseTranscriptRef.current = question;
      finalRef.current = '';
      interimRef.current = '';
      setInterimTranscript('');
      setIsListening(true);
      await startRecording();
    }
  };

  const handleDownloadTranscript = () => {
    if (!chat.messages || chat.messages.length === 0) return;
    let text = `MEDSYNEXA CONSULTATION TRANSCRIPT\n`;
    text += `Topic: ${chat.title}\nSource Document: ${documentName}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n\n`;
    text += `==========================================\n\n`;
    
    chat.messages.forEach(msg => {
      const role = msg.role === 'user' ? 'Doctor' : 'MedSynexa AI';
      text += `[${role}]:\n${msg.content}\n\n`;
    });
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transcript_${chat.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">

      {/* ── Header ── */}
      <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center justify-between gap-3 shrink-0 no-print">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`icon-container ${isLabDoc ? 'icon-cyan' : 'icon-blue'} h-8 w-8`}>
            {isLabDoc ? <FlaskConical className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-[#111111] truncate" title={chat.title}>
              {chat.title}
            </h2>
            <p className="text-[9px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
              <BookOpen className="h-3 w-3 text-blue-500" />
              <span className="truncate">{documentName}</span>
            </p>
          </div>
        </div>

        {chat.messages && chat.messages.length > 0 && (
          <button
            onClick={handleDownloadTranscript}
            className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100"
            title="Download Chat Transcript"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download Chat</span>
          </button>
        )}
      </div>

      {/* ── Message Area ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 bg-[#FAFAFA]">

        {(!chat.messages || chat.messages.length === 0) && !isSubmitting && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3.5 py-10">
            <div className="icon-container icon-blue h-12 w-12">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800">Reference Consultation Active</h3>
              <p className="text-[10px] text-gray-400 mt-1 max-w-xs leading-normal">
                Submit questions or dictate symptoms to search <span className="font-semibold text-gray-600">{documentName}</span>.
              </p>
            </div>
          </div>
        )}

        {chat.messages?.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100/50 flex items-center justify-center shrink-0 mr-2 mt-1 shadow-sm">
                  <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
                </div>
              )}

              <div className="max-w-[85%] sm:max-w-[75%] space-y-2.5">
                <div
                  className={`rounded-2xl px-4 py-3 border ${
                    isUser
                      ? 'msg-user border-blue-600 text-white rounded-br-sm shadow-sm'
                      : 'msg-ai border-gray-250/70 text-[#111111] rounded-bl-sm shadow-sm'
                  }`}
                >
                  <div className={`text-[9px] font-bold uppercase tracking-wider mb-2 ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
                    {isUser ? 'Doctor' : 'MedSynexa AI'}
                  </div>

                  <div className={`prose prose-sm max-w-none text-xs leading-relaxed ${isUser ? 'text-white' : 'text-gray-700'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Sources / Citations */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="space-y-1.5 ml-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      <span>References ({msg.citations.length})</span>
                    </div>

                    {msg.citations.map((cite, cIdx) => (
                      <details
                        key={cIdx}
                        className="group border border-gray-200/60 rounded-xl bg-white overflow-hidden text-xs shadow-sm"
                      >
                        <summary className="px-3 py-2 font-semibold text-gray-600 hover:bg-[#FAFAFA] cursor-pointer list-none flex items-center justify-between transition-colors">
                          <span className="flex items-center gap-1.5 text-[10px]">
                            <Quote className="h-3 w-3 text-blue-500 shrink-0" />
                            <span className="truncate max-w-xs">{cite.sourceName} (Section {cite.chunkIndex + 1})</span>
                          </span>
                          <span className="text-[9px] text-gray-300 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-100 text-gray-500 leading-relaxed max-h-24 overflow-y-auto text-[10px]">
                          "{cite.text}"
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="h-7 w-7 rounded-full bg-blue-100 border border-blue-200/50 flex items-center justify-center shrink-0 ml-2 mt-1 shadow-sm">
                  <Mic className="h-3.5 w-3.5 text-blue-600" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isSubmitting && (
          <div className="flex justify-start">
            <div className="h-7 w-7 rounded-full bg-blue-50 border border-blue-100/50 flex items-center justify-center shrink-0 mr-2 mt-1 shadow-sm">
              <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="bg-white border border-gray-200/80 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-2">MedSynexa AI</div>
              <div className="flex items-center gap-1 text-blue-600 text-[11px] font-semibold">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Searching clinical library...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0 no-print">
        
        {isListening && (
          <div className="absolute bottom-[76px] left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5 animate-bounce">
            <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse"></span>
            Listening... Click stop when done
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 items-end">
          
          <button
            type="button"
            onClick={toggleListening}
            disabled={isWhisperProcessing}
            className={`px-3 py-2.5 rounded-xl flex items-center justify-center shrink-0 transition-all border ${
              isListening 
                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 animate-pulse' 
                : isWhisperProcessing
                ? 'bg-blue-50 text-blue-600 border-blue-200 cursor-wait'
                : 'bg-gray-50 text-gray-500 border-gray-200/80 hover:bg-gray-100 hover:text-blue-600'
            }`}
            title="Voice Dictation"
          >
            {isWhisperProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-4.5 w-4.5" />
            ) : (
              <Mic className="h-4.5 w-4.5" />
            )}
          </button>

          <div className="flex-1 relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitQuestion(question);
                }
              }}
              disabled={isSubmitting || isWhisperProcessing}
              className={`input-field w-full px-3 py-2.5 text-xs resize-none min-h-[38px] max-h-[100px] ${
                isListening ? 'border-red-300 ring-2 ring-red-100 bg-red-50/20' : ''
              } ${isWhisperProcessing ? 'opacity-70' : ''}`}
              placeholder={isWhisperProcessing ? "Transcribing audio..." : isListening ? "Listening..." : `Ask about ${documentName}…`}
              rows={1}
              required={!isListening && !isWhisperProcessing}
            />
            {isListening && interimTranscript && (
              <div className="absolute top-full left-0 mt-0.5 px-3 text-[9px] text-blue-600 italic truncate w-full">
                {interimTranscript}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isWhisperProcessing || (!question.trim() && !isListening)}
            className="btn-primary px-3.5 py-2.5 rounded-xl flex items-center justify-center shrink-0"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
