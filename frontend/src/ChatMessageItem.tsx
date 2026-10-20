import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Pencil,
  FileText,
} from 'lucide-react';
import { ChatMessage } from './ChatTypes';
import { ChatGPTIcon } from './ChatIcons';

interface ChatMessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEditMessage?: (newContent: string) => void;
  onFeedback?: (type: 'like' | 'dislike') => void;
}

export function ChatMessageItem({
  message,
  isStreaming = false,
  onRegenerate,
  onEditMessage,
  onFeedback,
}: ChatMessageItemProps) {
  const [copiedFull, setCopiedFull] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(message.content);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.role === 'user';

  const handleCopyFull = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown tags for clean audio speech
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[#*_`>]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSaveEdit = () => {
    if (editDraft.trim() && editDraft !== message.content && onEditMessage) {
      onEditMessage(editDraft.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`group w-full py-4 sm:py-6 px-3 sm:px-4 md:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-transparent'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-4 md:gap-5 items-start">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-[#343541] dark:bg-[#40414f] text-neutral-200 border border-neutral-700/50 flex items-center justify-center text-xs font-semibold select-none shadow-sm">
              Y
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#10a37f] text-white flex items-center justify-center shadow-sm select-none">
              <ChatGPTIcon className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {isUser ? 'You' : 'ChatGPT'}
            </span>
          </div>

          {/* User Message View / Edit */}
          {isUser ? (
            <div>
              {/* Attachments preview if any */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {message.attachments.map(att => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#2f2f2f] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300"
                    >
                      {att.previewUrl ? (
                        <img
                          src={att.previewUrl}
                          alt={att.name}
                          className="w-5 h-5 rounded object-cover"
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-neutral-400" />
                      )}
                      <span className="truncate max-w-[140px] font-medium">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {isEditing ? (
                <div className="mt-2 space-y-3">
                  <textarea
                    value={editDraft}
                    onChange={e => setEditDraft(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white dark:bg-[#2f2f2f] border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 resize-none"
                    rows={3}
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => {
                        setEditDraft(message.content);
                        setIsEditing(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
                    >
                      Save & Submit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group/edit">
                  <div className="text-sm md:text-base text-neutral-900 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  {onEditMessage && (
                    <button
                      onClick={() => setIsEditing(true)}
                      title="Edit message"
                      className="opacity-0 group-hover/edit:opacity-100 transition-opacity absolute -right-2 top-0 p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Assistant Markdown Rendering */
            <div className="text-sm md:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed">
              <MarkdownRenderer content={message.content} />
              {isStreaming && (
                <span className="typing-cursor inline-block w-2 text-[#10a37f]" />
              )}
            </div>
          )}

          {/* Action toolbar for assistant response */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-1 mt-3 pt-1 text-neutral-400 dark:text-neutral-400">
              <button
                onClick={handleCopyFull}
                title={copiedFull ? 'Copied' : 'Copy'}
                className="p-1.5 rounded-md hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2f2f2f] transition-colors"
              >
                {copiedFull ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={handleToggleSpeech}
                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                className={`p-1.5 rounded-md transition-colors ${
                  isSpeaking
                    ? 'text-emerald-500 bg-neutral-100 dark:bg-[#2f2f2f]'
                    : 'hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2f2f2f]'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  title="Regenerate response"
                  className="p-1.5 rounded-md hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2f2f2f] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <div className="w-px h-3.5 bg-neutral-300 dark:bg-neutral-800 mx-1" />

              <button
                onClick={() => onFeedback && onFeedback('like')}
                title="Good response"
                className={`p-1.5 rounded-md transition-colors ${
                  message.feedback === 'like'
                    ? 'text-emerald-500 bg-neutral-100 dark:bg-[#2f2f2f]'
                    : 'hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2f2f2f]'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
              </button>

              <button
                onClick={() => onFeedback && onFeedback('dislike')}
                title="Bad response"
                className={`p-1.5 rounded-md transition-colors ${
                  message.feedback === 'dislike'
                    ? 'text-rose-500 bg-neutral-100 dark:bg-[#2f2f2f]'
                    : 'hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2f2f2f]'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight Markdown Parser and Formatter with Code block highlighting,
 * language tag, and single-click copy button.
 */
function MarkdownRenderer({ content }: { content: string }) {
  // Split into segments by code blocks ```lang ... ```
  const segments = React.useMemo(() => {
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2].trimEnd(),
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
      });
    }

    return parts;
  }, [content]);

  return (
    <div className="space-y-4">
      {segments.map((seg, idx) => {
        if (seg.type === 'code') {
          return (
            <CodeBlockView
              key={idx}
              language={seg.language || 'code'}
              code={seg.content}
            />
          );
        }
        return <TextBlockView key={idx} text={seg.content} />;
      })}
    </div>
  );
}

function CodeBlockView({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-neutral-700/60 bg-[#0d0d0d] shadow-sm">
      {/* Top code header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#171717] border-b border-neutral-800 text-xs text-neutral-400 font-mono select-none">
        <span className="lowercase">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code contents */}
      <pre className="p-4 text-xs md:text-sm font-mono overflow-x-auto text-[#e6e6e6] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function TextBlockView({ text }: { text: string }) {
  // Render paragraphs, headings, blockquotes, bullet points, tables
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1.5 my-2">
          {listItems.map((item, i) => (
            <li key={i}>{formatInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check list item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(trimmed.slice(2));
      return;
    }

    if (trimmed.match(/^\d+\.\s+/)) {
      flushList();
      const itemText = trimmed.replace(/^\d+\.\s+/, '');
      elements.push(
        <div key={index} className="flex gap-2.5 my-1.5">
          <span className="text-neutral-500 font-medium shrink-0">
            {trimmed.match(/^\d+\./)?.[0]}
          </span>
          <div>{formatInline(itemText)}</div>
        </div>
      );
      return;
    }

    // If we were in a list and hit normal text, flush
    flushList();

    if (!trimmed) {
      return;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-base font-semibold mt-4 mb-2 text-neutral-900 dark:text-neutral-100">
          {formatInline(trimmed.slice(4))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-lg font-bold mt-5 mb-2 text-neutral-900 dark:text-neutral-100">
          {formatInline(trimmed.slice(3))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1 key={index} className="text-xl font-bold mt-6 mb-2 text-neutral-900 dark:text-neutral-100">
          {formatInline(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={index}
          className="border-l-2 border-neutral-400 dark:border-neutral-600 pl-3.5 my-2 text-neutral-600 dark:text-neutral-300 italic"
        >
          {formatInline(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // simple table row render
      const cols = trimmed.split('|').slice(1, -1).map(c => c.trim());
      const isDivider = cols.every(c => /^:?-+:?$/.test(c));
      if (!isDivider) {
        elements.push(
          <div
            key={index}
            className="grid grid-flow-col auto-cols-fr gap-3 py-1.5 px-3 border-b border-neutral-200 dark:border-neutral-800 text-xs md:text-sm font-mono"
          >
            {cols.map((col, cIdx) => (
              <span key={cIdx} className="break-words">
                {formatInline(col)}
              </span>
            ))}
          </div>
        );
      }
      return;
    }

    // Paragraph
    elements.push(
      <p key={index} className="my-2 leading-relaxed">
        {formatInline(line)}
      </p>
    );
  });

  flushList();

  return <>{elements}</>;
}

/**
 * Format inline bold, italic, code tags
 */
function formatInline(str: string): React.ReactNode {
  // Regex to detect bold **text**, inline code `code`, and italics *text*
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIdx) {
      parts.push(str.slice(lastIdx, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-neutral-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono text-[0.875em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-neutral-700 dark:text-neutral-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIdx = match.index + token.length;
  }

  if (lastIdx < str.length) {
    parts.push(str.slice(lastIdx));
  }

  return parts.length > 0 ? parts : str;
}
