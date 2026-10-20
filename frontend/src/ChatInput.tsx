import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Globe,
  Sparkles,
  Mic,
  MicOff,
  X,
  FileText,
} from 'lucide-react';
import { ChatAttachment } from './ChatTypes';

interface ChatInputProps {
  onSendMessage: (
    content: string,
    attachments: ChatAttachment[],
    options: { webSearch: boolean; reasoning: boolean }
  ) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
}

export function ChatInput({
  onSendMessage,
  isStreaming,
  onStopStreaming,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [text]);

  // Voice speech-to-text setup
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setText(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const isImg = file.type.startsWith('image/');
      const newAtt: ChatAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        type: file.type,
        size: file.size,
      };

      if (isImg) {
        const reader = new FileReader();
        reader.onload = ev => {
          newAtt.previewUrl = ev.target?.result as string;
          setAttachments(prev => [...prev, newAtt]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments(prev => [...prev, newAtt]);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStreaming) {
      onStopStreaming();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    onSendMessage(trimmed, attachments, {
      webSearch: webSearchEnabled,
      reasoning: reasoningEnabled,
    });

    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = text.trim().length > 0 || attachments.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5">
      {/* Container */}
      <div className="relative rounded-3xl bg-[#f4f4f4] dark:bg-[#2f2f2f] border border-neutral-200 dark:border-neutral-700/80 p-2 sm:p-2.5 transition-shadow focus-within:shadow-md focus-within:border-neutral-300 dark:focus-within:border-neutral-600">
        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 pt-1 pb-2">
            {attachments.map(att => (
              <div
                key={att.id}
                className="relative flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-xl bg-white dark:bg-[#383838] border border-neutral-200 dark:border-neutral-600 text-xs text-neutral-800 dark:text-neutral-200 group"
              >
                {att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="w-6 h-6 rounded object-cover"
                  />
                ) : (
                  <FileText className="w-4 h-4 text-neutral-400" />
                )}
                <span className="truncate max-w-[130px] font-medium">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatGPT..."
          rows={1}
          className="w-full px-3 py-1.5 bg-transparent border-0 text-neutral-900 dark:text-[#ececec] placeholder-neutral-500 text-sm md:text-base focus:outline-none resize-none leading-relaxed max-h-48 overflow-y-auto"
        />

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-1 px-1">
          {/* Left tools: Attachment, Web Search, Deep Think */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />

            {/* Attach button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach files"
              className="p-2 rounded-full text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web Search toggle */}
            <button
              type="button"
              onClick={() => setWebSearchEnabled(v => !v)}
              title="Search the web"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                webSearchEnabled
                  ? 'bg-blue-600/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/30'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Deep Reasoning toggle */}
            <button
              type="button"
              onClick={() => setReasoningEnabled(v => !v)}
              title="Reasoning model"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                reasoningEnabled
                  ? 'bg-purple-600/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/30'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Reason</span>
            </button>
          </div>

          {/* Right tools: Voice & Submit */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Voice Dictation */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isListening ? 'Stop listening' : 'Voice input'}
              className={`p-2 rounded-full transition-colors ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send / Stop button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                title="Stop generation"
                className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center hover:opacity-85 transition-opacity"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!canSubmit}
                title="Send prompt"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  canSubmit
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 shadow-sm cursor-pointer'
                    : 'bg-neutral-300 dark:bg-neutral-700/60 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Legal disclaimer footer */}
      <p className="text-center text-[11px] text-neutral-400 dark:text-neutral-500 mt-2 select-none">
        ChatGPT can make mistakes. Check important info.
      </p>
    </div>
  );
}
