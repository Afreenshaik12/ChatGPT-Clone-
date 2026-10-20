import React, { useState, useMemo } from 'react';
import {
  SquarePen,
  PanelLeftClose,
  Search,
  Trash2,
  Check,
  X,
  Compass,
  Settings,
  Sun,
  Moon,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { ChatSession } from './ChatTypes';
import { ChatGPTIcon } from './ChatIcons';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  isOpen: boolean;
  onToggleSidebar: () => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export function ChatSidebar({
  sessions,
  activeId,
  isOpen,
  onToggleSidebar,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  onClearAllSessions,
  theme,
  onToggleTheme,
  onOpenSettings,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Chronological grouping
  const groupedSessions = useMemo(() => {
    const filtered = sessions.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const groups: { label: string; items: ChatSession[] }[] = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'Previous 7 Days', items: [] },
      { label: 'Previous 30 Days', items: [] },
      { label: 'Older', items: [] },
    ];

    filtered.forEach(session => {
      const age = now - session.updatedAt;
      if (age < oneDay) {
        groups[0].items.push(session);
      } else if (age < 2 * oneDay) {
        groups[1].items.push(session);
      } else if (age < 7 * oneDay) {
        groups[2].items.push(session);
      } else if (age < 30 * oneDay) {
        groups[3].items.push(session);
      } else {
        groups[4].items.push(session);
      }
    });

    return groups.filter(g => g.items.length > 0);
  }, [sessions, searchQuery]);

  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setRenameDraft(session.title);
  };

  const saveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (renameDraft.trim()) {
      onRenameSession(id, renameDraft.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSession(id);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onToggleSidebar}
        className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs transition-opacity"
      />

      {/* Sidebar Panel */}
      <aside
        className="fixed md:static inset-y-0 left-0 z-50 w-[260px] flex flex-col bg-[#171717] dark:bg-[#171717] light:bg-[#f9f9f9] border-r border-neutral-800/80 dark:border-neutral-800/80 light:border-neutral-200 select-none transition-transform duration-200 shrink-0"
        style={{
          backgroundColor: theme === 'dark' ? '#171717' : '#f9f9f9',
        }}
      >
        {/* Top Header / Action Bar */}
        <div className="p-3 flex items-center justify-between border-b border-neutral-800/40 dark:border-neutral-800/40 light:border-neutral-200">
          <button
            onClick={onToggleSidebar}
            title="Close sidebar"
            className="p-2 rounded-lg text-neutral-400 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-neutral-800 dark:hover:bg-neutral-800 light:hover:bg-neutral-200 transition-colors"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>

          <button
            onClick={onNewChat}
            title="New chat"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-200 dark:text-neutral-200 light:text-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-800 light:hover:bg-neutral-200 transition-colors"
          >
            <SquarePen className="w-4 h-4" />
            <span>New chat</span>
          </button>
        </div>

        {/* Search Chat Input */}
        <div className="px-3 pt-2 pb-1">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-neutral-800/60 dark:bg-neutral-800/60 light:bg-neutral-200 text-neutral-200 dark:text-neutral-200 light:text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-neutral-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {groupedSessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-neutral-500">
              {searchQuery ? 'No chats match your search' : 'No conversation history'}
            </div>
          ) : (
            groupedSessions.map(group => (
              <div key={group.label} className="space-y-0.5">
                <div className="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-neutral-500 dark:text-neutral-500 uppercase">
                  {group.label}
                </div>
                {group.items.map(session => {
                  const isActive = session.id === activeId;
                  const isRenaming = editingId === session.id;

                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        isActive
                          ? 'bg-[#212121] dark:bg-[#212121] light:bg-neutral-200 text-white dark:text-white light:text-black font-medium'
                          : 'text-neutral-400 dark:text-neutral-400 light:text-neutral-600 hover:text-neutral-200 dark:hover:text-neutral-200 light:hover:text-black hover:bg-neutral-800/60 dark:hover:bg-neutral-800/60 light:hover:bg-neutral-200/70'
                      }`}
                    >
                      {isRenaming ? (
                        <div
                          className="flex items-center gap-1 w-full"
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={renameDraft}
                            onChange={e => setRenameDraft(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveRename(session.id, e);
                              if (e.key === 'Escape') cancelRename(e as any);
                            }}
                            autoFocus
                            className="flex-1 px-1.5 py-0.5 text-xs rounded bg-neutral-900 border border-neutral-700 text-white focus:outline-none"
                          />
                          <button
                            onClick={e => saveRename(session.id, e)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelRename}
                            className="p-1 text-neutral-400 hover:text-neutral-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 truncate pr-6">
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span className="truncate">{session.title}</span>
                          </div>

                          {/* Hover action buttons */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity absolute right-2">
                            <button
                              onClick={e => startRename(session, e)}
                              title="Rename chat"
                              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                            >
                              <SquarePen className="w-3 h-3" />
                            </button>
                            <button
                              onClick={e => handleDelete(session.id, e)}
                              title="Delete chat"
                              className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-700 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Bottom User & Utility Area */}
        <div className="p-2 border-t border-neutral-800/60 dark:border-neutral-800/60 light:border-neutral-200 space-y-1">
          {/* Explore GPTs */}
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:bg-neutral-800 dark:hover:bg-neutral-800 light:hover:bg-neutral-200 cursor-pointer transition-colors">
            <Compass className="w-4 h-4 text-emerald-500" />
            
          </div>

          {/* User Bar with popup menu */}
          <div className="relative">
            {showUserMenu && (
              <div
                className="absolute bottom-12 left-0 right-0 p-1.5 rounded-xl bg-[#212121] dark:bg-[#212121] light:bg-white border border-neutral-700/80 dark:border-neutral-700/80 light:border-neutral-300 shadow-xl z-50 text-xs space-y-0.5"
                style={{
                  backgroundColor: theme === 'dark' ? '#212121' : '#ffffff',
                }}
              >
                <button
                  onClick={() => {
                    onOpenSettings();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-neutral-300 dark:text-neutral-300 light:text-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-800 light:hover:bg-neutral-100 transition-colors"
                >
                  <Settings className="w-4 h-4 text-neutral-400" />
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => {
                    onToggleTheme();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-neutral-300 dark:text-neutral-300 light:text-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-800 light:hover:bg-neutral-100 transition-colors"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Light mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-400" />
                      <span>Dark mode</span>
                    </>
                  )}
                </button>

                <div className="h-px bg-neutral-700/60 dark:bg-neutral-700/60 light:bg-neutral-200 my-1" />

                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete all chat history?')) {
                      onClearAllSessions();
                    }
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear all chats</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="w-full flex items-center justify-between p-2 rounded-xl text-neutral-200 dark:text-neutral-200 light:text-neutral-800 hover:bg-neutral-800/70 dark:hover:bg-neutral-800/70 light:hover:bg-neutral-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#10a37f] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  Y
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold leading-tight text-neutral-200 dark:text-neutral-200 light:text-neutral-900">
                    You
                  </div>
                  <div className="text-[10px] text-neutral-400">ChatGPT Plus</div>
                </div>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-400/80" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
