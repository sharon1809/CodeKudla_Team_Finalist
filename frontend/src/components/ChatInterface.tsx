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
  
  // Robust state tracking to prevent dropped words
  const baseTranscriptRef = useRef<string>('');
  const finalRef = useRef<string>('');
  const interimRef = useRef<string>('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, isSubmitting]);

  // Initialize Speech Recognition
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
        // Commit any leftover interim text if the browser aborted prematurely
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
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-8 gap-4">
        <div className="h-14 w-14 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
          <MessageSquare className="h-7 w-7 text-[#CBD5E1]" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-[#0F172A]">No Consultation Active</h3>
          <p className="text-xs mt-1.5 text-[#94A3B8] max-w-xs leading-relaxed">
            Select a document from the library and start a Q&A session to chat with your medical textbooks or journals.
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

  // Whisper Processing State
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
      recognitionRef.current?.start(); // For visual feedback only
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
        
        // Release the microphone
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
        // Fallback to the browser's buggy text if Whisper API fails
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
      baseTranscriptRef.current = question; // Capture whatever they typed so far
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
      const role = msg.role === 'user' ? 'Doctor / Patient' : 'MedSynexa AI';
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
    <div className="h-full flex flex-col bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden relative">

      {/* ── Header ── */}
      <div className="px-5 py-3.5 border-b border-[#F1F5F9] bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`icon-container ${isLabDoc ? 'icon-cyan' : 'icon-teal'} h-9 w-9`}>
            {isLabDoc ? <FlaskConical className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#0F172A] truncate" title={chat.title}>
              {chat.title}
            </h2>
            <p className="text-[11px] text-[#94A3B8] flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-teal-500" />
              <span className="truncate">{documentName}</span>
            </p>
          </div>
        </div>

        {chat.messages && chat.messages.length > 0 && (
          <button
            onClick={handleDownloadTranscript}
            className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-100"
            title="Download full chat transcript"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download Chat</span>
          </button>
        )}
      </div>

      {/* ── Message Area ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-[#F8FAFC]">

        {(!chat.messages || chat.messages.length === 0) && !isSubmitting && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-10">
            <div className="icon-container icon-teal h-12 w-12">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Ready for Medical Q&A</h3>
              <p className="text-xs text-[#94A3B8] mt-1 max-w-xs leading-relaxed">
                Ask questions or dictate patient symptoms to query <span className="font-semibold text-[#475569]">{documentName}</span>. Answers are grounded in your uploaded document.
              </p>
            </div>
          </div>
        )}

        {chat.messages?.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="h-7 w-7 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0 mr-2 mt-1">
                  <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    isUser
                      ? 'msg-user text-white rounded-br-sm'
                      : 'msg-ai text-[#0F172A] rounded-bl-sm'
                  }`}
                >
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isUser ? 'text-white/70' : 'text-[#94A3B8]'}`}>
                    {isUser ? 'Doctor / Patient' : 'MedSynexa AI'}
                  </div>

                  <div className={`prose prose-sm max-w-none text-sm leading-relaxed ${isUser ? 'prose-invert' : ''}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Citations */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="space-y-1.5 ml-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8]">
                      <BookOpen className="h-3.5 w-3.5 text-teal-500" />
                      <span>Sources ({msg.citations.length})</span>
                    </div>

                    {msg.citations.map((cite, cIdx) => (
                      <details
                        key={cIdx}
                        className="group border border-[#E2E8F0] rounded-xl bg-white overflow-hidden text-xs"
                      >
                        <summary className="px-3 py-2 font-medium text-[#475569] hover:bg-[#F8FAFC] cursor-pointer list-none flex items-center justify-between transition-colors">
                          <span className="flex items-center gap-1.5">
                            <Quote className="h-3 w-3 text-teal-500" />
                            <span>Source Segment {cIdx + 1} (Chunk {cite.chunkIndex})</span>
                          </span>
                          <span className="text-[10px] text-[#CBD5E1] group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="px-3 py-2.5 bg-[#F8FAFC] text-[#64748B] border-t border-[#E2E8F0] leading-relaxed max-h-32 overflow-y-auto text-[11px]">
                          "{cite.text}"
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="h-7 w-7 rounded-full bg-teal-600 flex items-center justify-center shrink-0 ml-2 mt-1 shadow-sm">
                  <Mic className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isSubmitting && (
          <div className="flex justify-start">
            <div className="h-7 w-7 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0 mr-2 mt-1">
              <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">MedSynexa AI</div>
              <div className="flex items-center gap-1 text-teal-600 text-xs font-mono">
                <span className="typing-cursor">Searching medical literature</span>
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
      <div className="px-4 py-3.5 border-t border-[#F1F5F9] bg-white shrink-0">
        
        {/* Floating Voice Indicator */}
        {isListening && (
          <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
            <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
            Listening... Click stop when done
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 items-end">
          
          <button
            type="button"
            onClick={toggleListening}
            disabled={isWhisperProcessing}
            className={`px-4 py-3 rounded-xl flex items-center justify-center shrink-0 transition-all border ${
              isListening 
                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 animate-pulse' 
                : isWhisperProcessing
                ? 'bg-teal-50 text-teal-600 border-teal-200 cursor-wait'
                : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:text-teal-600'
            }`}
            title="Voice Dictation"
          >
            {isWhisperProcessing ? (
              <div className="h-5 w-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            ) : isListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
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
              className={`input-field w-full px-4 py-3 text-sm resize-none min-h-[46px] max-h-[120px] ${
                isListening ? 'border-red-300 ring-2 ring-red-100 bg-red-50/30' : ''
              } ${isWhisperProcessing ? 'opacity-70' : ''}`}
              placeholder={isWhisperProcessing ? "Transcribing audio..." : isListening ? "Listening..." : `Ask about ${documentName}…`}
              rows={1}
              required={!isListening && !isWhisperProcessing} // Only require if not actively listening
            />
            {isListening && interimTranscript && (
              <div className="absolute top-full left-0 mt-1 px-4 text-[11px] text-teal-600 italic truncate w-full">
                {interimTranscript}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isWhisperProcessing || (!question.trim() && !isListening)}
            className="btn-primary px-4 py-3 rounded-xl flex items-center justify-center shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
