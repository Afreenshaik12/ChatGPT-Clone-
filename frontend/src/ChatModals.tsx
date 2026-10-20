import React, { useState } from 'react';
import {
  X,
  Check,
  Share2,
  Sparkles,
  Zap,
  Brain,
  ChevronDown,
  Trash2,
  Sun,
  Moon,
  Volume2,
} from 'lucide-react';
import { ChatModelOption, ChatSession } from './ChatTypes';
import { DEFAULT_MODELS } from './ChatEngine';

interface ModelSelectorProps {
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
}

export function ModelSelector({ currentModelId, onSelectModel }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentModel =
    DEFAULT_MODELS.find(m => m.id === currentModelId) || DEFAULT_MODELS[0];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-neutral-800/50 dark:hover:bg-neutral-800/50 light:hover:bg-neutral-200 text-sm font-semibold text-neutral-800 dark:text-neutral-100 transition-colors select-none"
      >
        <span>{currentModel.name}</span>
        <ChevronDown className="w-4 h-4 text-neutral-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-1.5 w-72 rounded-2xl bg-[#212121] dark:bg-[#212121] light:bg-white border border-neutral-700/80 dark:border-neutral-700/80 light:border-neutral-300 shadow-2xl z-50 p-1.5 space-y-1">
            <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase border-b border-neutral-800 dark:border-neutral-800 light:border-neutral-200">
              Model
            </div>
            {DEFAULT_MODELS.map(model => {
              const isSelected = model.id === currentModelId;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-3 transition-colors ${
                    isSelected
                      ? 'bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-100'
                      : 'hover:bg-neutral-800/50 dark:hover:bg-neutral-800/50 light:hover:bg-neutral-50'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-neutral-700/50 dark:bg-neutral-700/50 light:bg-neutral-200 text-neutral-200 dark:text-neutral-200 light:text-neutral-800 shrink-0 mt-0.5">
                    {model.iconType === 'sparkles' && (<Sparkles className="w-4 h-4 text-emerald-400" />)}
                    {model.iconType === 'zap' && (<Zap className="w-4 h-4 text-amber-400" />)}
                    {model.iconType === 'brain' && (<Brain className="w-4 h-4 text-purple-400" />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-200 dark:text-neutral-200 light:text-neutral-900">
                        {model.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                      {model.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

interface ShareModalProps {
  session: ChatSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ session, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !session) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}#chat-${session.id}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-[#212121] dark:bg-[#212121] light:bg-white border border-neutral-700/80 dark:border-neutral-700/80 light:border-neutral-300 p-5 shadow-2xl text-neutral-100 dark:text-neutral-100 light:text-neutral-900">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 dark:border-neutral-800 light:border-neutral-200">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Share link to chat</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-800 light:hover:bg-neutral-100 text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-400 my-3 leading-relaxed">
          Messages sent after generating this link won't be shared. Anyone with this link can view this conversation snapshot.
        </p>

        <div className="p-3 rounded-xl bg-neutral-900 dark:bg-neutral-900 light:bg-neutral-100 border border-neutral-800 dark:border-neutral-800 light:border-neutral-200 mb-4">
          <span className="text-xs font-semibold line-clamp-1 text-neutral-200 dark:text-neutral-200 light:text-neutral-900">
            {session.title}
          </span>
          <span className="text-[11px] text-neutral-500">
            {session.messages.length} messages · Model: {session.model}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-neutral-800/80 dark:bg-neutral-800/80 light:bg-neutral-100 border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 text-neutral-300 dark:text-neutral-300 light:text-neutral-800 focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 text-neutral-900 dark:bg-white dark:text-neutral-900 light:bg-neutral-900 light:text-white font-medium text-xs hover:opacity-90 transition-opacity shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <span>Copy link</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onClearAllSessions: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  onClearAllSessions,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-[#212121] dark:bg-[#212121] light:bg-white border border-neutral-700/80 dark:border-neutral-700/80 light:border-neutral-300 p-6 shadow-2xl text-neutral-100 dark:text-neutral-100 light:text-neutral-900">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 dark:border-neutral-800 light:border-neutral-200">
          <h3 className="text-base font-semibold">Settings</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-800 light:hover:bg-neutral-100 text-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-5 text-xs">
          {/* Theme row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-neutral-200 dark:text-neutral-200 light:text-neutral-900">
                Theme
              </div>
              <div className="text-neutral-400 mt-0.5">Choose your interface appearance</div>
            </div>
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-700 dark:border-neutral-700 light:border-neutral-300 bg-neutral-800 dark:bg-neutral-800 light:bg-neutral-100 font-medium transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </>
              )}
            </button>
          </div>

          <div className="h-px bg-neutral-800 dark:bg-neutral-800 light:border-neutral-200" />

          {/* Speech Audio */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-neutral-200 dark:text-neutral-200 light:text-neutral-900">
                Voice Read Aloud
              </div>
              <div className="text-neutral-400 mt-0.5">
                Enable browser text-to-speech for responses
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Enabled</span>
            </div>
          </div>

          <div className="h-px bg-neutral-800 dark:bg-neutral-800 light:border-neutral-200" />

          {/* Data Controls / Clear all chats */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-neutral-200 dark:text-neutral-200 light:text-neutral-900">
                Delete all chats
              </div>
              <div className="text-neutral-400 mt-0.5">
                Permanently clear all conversation sessions
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete all chats? This cannot be undone.')) {
                  onClearAllSessions();
                  onClose();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-medium transition-colors"
            >
              Delete all
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-800 dark:border-neutral-800 light:border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-200 text-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 light:bg-neutral-900 light:text-white hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
