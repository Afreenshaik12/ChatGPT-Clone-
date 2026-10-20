
import React, { useState, useEffect, useRef } from 'react';
import {
  PanelLeft,
  SquarePen,
  Share2,
  ArrowDown,
} from 'lucide-react';

import { ChatSession, ChatMessage, ChatAttachment } from './ChatTypes';
import {
  loadSavedSessions,
  persistSessions,
  getStoredTheme,
  setStoredTheme,
  INITIAL_PROMPT_SUGGESTIONS,
} from './ChatEngine';
import { ChatGPTIcon } from './ChatIcons';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import {
  ModelSelector,
  ShareModal,
  SettingsModal,
} from './ChatModals';

const BACKEND_URL = 'http://localhost:3001/chat';

export default function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentModelId, setCurrentModelId] = useState('openai/gpt-oss-20b');

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] =
    useState<string | null>(null);

  const streamingAbortRef = useRef<boolean>(false);
  const requestIdRef = useRef(0);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Initialize theme and saved chats
  useEffect(() => {
    const initialTheme = getStoredTheme();
    setTheme(initialTheme);
    setStoredTheme(initialTheme);

    const {
      sessions: loadedSessions,
      activeId: loadedActiveId,
    } = loadSavedSessions();

    setSessions(loadedSessions);
    setActiveId(loadedActiveId);

    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  // Persist chat sessions
  useEffect(() => {
    if (sessions.length > 0) {
      persistSessions(sessions, activeId);
    }
  }, [sessions, activeId]);

  const activeSession =
    sessions.find(session => session.id === activeId) || null;

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [activeSession?.messages, isStreaming]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const {
      scrollTop,
      scrollHeight,
      clientHeight,
    } = scrollContainerRef.current;

    setShowScrollBottom(
      scrollHeight - (scrollTop + clientHeight) > 160
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    setTheme(nextTheme);
    setStoredTheme(nextTheme);
  };

  // Create a new chat
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }

    const newSessionId = crypto.randomUUID();

    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: currentModelId,
    };

    setSessions(previous => [newSession, ...previous]);
    setActiveId(newSessionId);

    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Select an existing chat
  const handleSelectSession = (id: string) => {
    if (isStreaming) {
      handleStopStreaming();
    }

    setActiveId(id);

    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Rename a chat
  const handleRenameSession = (
    id: string,
    newTitle: string
  ) => {
    setSessions(previous =>
      previous.map(session =>
        session.id === id
          ? {
              ...session,
              title: newTitle,
              updatedAt: Date.now(),
            }
          : session
      )
    );
  };

  // Delete a chat
  const handleDeleteSession = (id: string) => {
    setSessions(previous => {
      const remaining = previous.filter(
        session => session.id !== id
      );

      if (activeId === id) {
        setActiveId(
          remaining.length > 0 ? remaining[0].id : null
        );
      }

      return remaining;
    });
  };

  // Clear all saved chats
  const handleClearAllSessions = () => {
    if (isStreaming) {
      handleStopStreaming();
    }

    setSessions([]);
    setActiveId(null);

    localStorage.removeItem('chatgpt_ui_sessions');
    localStorage.removeItem('chatgpt_ui_active_id');
  };

  // Stop displaying the current response
  const handleStopStreaming = () => {
    streamingAbortRef.current = true;
    requestIdRef.current += 1;

    setIsStreaming(false);
    setStreamingMessageId(null);
  };

  // Send a message from the input box
  const handleSendMessage = (
    content: string,
    attachments: ChatAttachment[],
    options: {
      webSearch: boolean;
      reasoning: boolean;
    }
  ) => {
    const trimmedContent = content.trim();

    if (!trimmedContent && attachments.length === 0) {
      return;
    }

    let targetSessionId = activeId;
    let targetSession = activeSession;

    // Create a chat if no chat is currently selected
    if (!targetSessionId || !targetSession) {
      targetSessionId = crypto.randomUUID();

      targetSession = {
        id: targetSessionId,
        title: trimmedContent.slice(0, 40) || 'New conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        model: currentModelId,
      };

      setSessions(previous => [
        targetSession!,
        ...previous,
      ]);

      setActiveId(targetSessionId);
    } else if (
      targetSession.messages.length === 0 &&
      trimmedContent
    ) {
      handleRenameSession(
        targetSession.id,
        trimmedContent.slice(0, 40)
      );
    }

    // Add the user's message to the conversation
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: trimmedContent,
      timestamp: Date.now(),
      attachments,
    };

    const assistantMessageId = `msg-${Date.now()}-ai`;

    const emptyAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setSessions(previous =>
      previous.map(session => {
        if (session.id !== targetSessionId) {
          return session;
        }

        return {
          ...session,
          updatedAt: Date.now(),
          messages: [
            ...session.messages,
            userMessage,
            emptyAssistantMessage,
          ],
        };
      })
    );

    // The current backend accepts text messages only.
    if (attachments.length > 0 && !trimmedContent) {
      setSessions(previous =>
        previous.map(session =>
          session.id === targetSessionId
            ? {
                ...session,
                messages: session.messages.map(message =>
                  message.id === assistantMessageId
                    ? {
                        ...message,
                        content:
                          'Please enter a text question. File and image processing is not connected yet.',
                        isStreaming: false,
                      }
                    : message
                ),
              }
            : session
        )
      );

      return;
    }

    // Web search and reasoning options will be connected separately.
    void options;

    void triggerStreamResponse(
      targetSessionId,
      assistantMessageId,
      trimmedContent
    );
  };

  // Call the real Express backend
  const triggerStreamResponse = async (
    sessionId: string,
    assistantMsgId: string,
    query: string
  ) => {
    const thisRequestId = ++requestIdRef.current;

    setIsStreaming(true);
    setStreamingMessageId(assistantMsgId);
    streamingAbortRef.current = false;

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          threadID: sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'The backend could not generate a response.'
        );
      }

      if (typeof data.message !== 'string') {
        throw new Error(
          'Unexpected backend response. Expected a message field.'
        );
      }

      if (
        streamingAbortRef.current ||
        thisRequestId !== requestIdRef.current
      ) {
        return;
      }

      // Display the real response returned by the backend
      setSessions(previous =>
        previous.map(session => {
          if (session.id !== sessionId) {
            return session;
          }

          return {
            ...session,
            updatedAt: Date.now(),
            messages: session.messages.map(message =>
              message.id === assistantMsgId
                ? {
                    ...message,
                    content: data.message,
                    isStreaming: false,
                  }
                : message
            ),
          };
        })
      );
    } catch (error) {
      console.error('Backend request failed:', error);

      if (
        streamingAbortRef.current ||
        thisRequestId !== requestIdRef.current
      ) {
        return;
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.';

      setSessions(previous =>
        previous.map(session => ({
          ...session,
          messages: session.messages.map(message =>
            message.id === assistantMsgId
              ? {
                  ...message,
                  content: `Sorry, I couldn't get a response from the AI backend. ${errorMessage} Check that your backend is running on port 3001.`,
                  isStreaming: false,
                }
              : message
          ),
        }))
      );
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setIsStreaming(false);
        setStreamingMessageId(null);
      }
    }
  };

  // Regenerate the last assistant response
  const handleRegenerate = () => {
    if (
      !activeSession ||
      activeSession.messages.length < 2 ||
      isStreaming
    ) {
      return;
    }

    const lastUserMessage = [...activeSession.messages]
      .reverse()
      .find(message => message.role === 'user');

    if (!lastUserMessage) return;

    const assistantMessageId = `msg-${Date.now()}-ai-regen`;

    const emptyAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setSessions(previous =>
      previous.map(session => {
        if (session.id !== activeSession.id) {
          return session;
        }

        const filtered = session.messages.filter(
          (message, index) =>
            !(
              message.role === 'assistant' &&
              index === session.messages.length - 1
            )
        );

        return {
          ...session,
          updatedAt: Date.now(),
          messages: [
            ...filtered,
            emptyAssistantMessage,
          ],
        };
      })
    );

    void triggerStreamResponse(
      activeSession.id,
      assistantMessageId,
      lastUserMessage.content
    );
  };

  // Edit a message and request a new response
  const handleEditMessage = (
    msgId: string,
    newContent: string
  ) => {
    if (!activeSession || isStreaming) return;

    const msgIndex = activeSession.messages.findIndex(
      message => message.id === msgId
    );

    if (msgIndex === -1) return;

    const trimmedContent = newContent.trim();

    if (!trimmedContent) return;

    const truncated = activeSession.messages.slice(
      0,
      msgIndex
    );

    const updatedUserMessage: ChatMessage = {
      id: `msg-${Date.now()}-user-edited`,
      role: 'user',
      content: trimmedContent,
      timestamp: Date.now(),
    };

    const assistantMessageId =
      `msg-${Date.now()}-ai-after-edit`;

    const emptyAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setSessions(previous =>
      previous.map(session =>
        session.id === activeSession.id
          ? {
              ...session,
              updatedAt: Date.now(),
              messages: [
                ...truncated,
                updatedUserMessage,
                emptyAssistantMessage,
              ],
            }
          : session
      )
    );

    void triggerStreamResponse(
      activeSession.id,
      assistantMessageId,
      trimmedContent
    );
  };

  // Toggle message feedback
  const handleFeedback = (
    msgId: string,
    type: 'like' | 'dislike'
  ) => {
    if (!activeSession) return;

    setSessions(previous =>
      previous.map(session => {
        if (session.id !== activeSession.id) {
          return session;
        }

        return {
          ...session,
          messages: session.messages.map(message =>
            message.id === msgId
              ? {
                  ...message,
                  feedback:
                    message.feedback === type ? null : type,
                }
              : message
          ),
        };
      })
    );
  };

  const isNewChat =
    !activeSession || activeSession.messages.length === 0;

  return (
    <div
      className="min-h-screen w-full flex bg-[#212121] dark:bg-[#212121] light:bg-[#ffffff] text-[#ececec] dark:text-[#ececec] light:text-[#0d0d0d] font-sans antialiased overflow-hidden"
      style={{
        backgroundColor:
          theme === 'dark' ? '#212121' : '#ffffff',
        color: theme === 'dark' ? '#ececec' : '#0d0d0d',
      }}
    >
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeId={activeId}
        isOpen={sidebarOpen}
        onToggleSidebar={() =>
          setSidebarOpen(value => !value)
        }
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAllSessions}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-14 px-3 sm:px-4 flex items-center justify-between border-b border-neutral-800/60 dark:border-neutral-800/60 light:border-neutral-200 select-none z-10 shrink-0">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <>
                <button
                  onClick={() => setSidebarOpen(true)}
                  title="Open sidebar"
                  className="p-2 rounded-xl text-neutral-400 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-neutral-800 dark:hover:bg-neutral-800 light:hover:bg-neutral-100 transition-colors"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={handleNewChat}
                  title="New chat"
                  className="p-2 rounded-xl text-neutral-400 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-neutral-800 dark:hover:bg-neutral-800 light:hover:bg-neutral-100 transition-colors"
                >
                  <SquarePen className="w-5 h-5" />
                </button>
              </>
            )}

            <ModelSelector
              currentModelId={currentModelId}
              onSelectModel={setCurrentModelId}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareOpen(true)}
              disabled={isNewChat}
              title="Share chat"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isNewChat
                  ? 'opacity-40 cursor-not-allowed text-neutral-500'
                  : 'text-neutral-300 dark:text-neutral-300 light:text-neutral-700 hover:bg-neutral-800 dark:hover:bg-neutral-800 light:hover:bg-neutral-100'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto relative flex flex-col"
        >
          {isNewChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full my-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-white light:bg-neutral-900 text-neutral-900 dark:text-neutral-900 light:text-white flex items-center justify-center shadow-lg mb-6 ring-1 ring-black/5 dark:ring-white/10">
                <ChatGPTIcon className="w-8 h-8" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mb-8">
                What can I help with?
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {INITIAL_PROMPT_SUGGESTIONS.map(
                  (card, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        handleSendMessage(card.prompt, [], {
                          webSearch: false,
                          reasoning: false,
                        })
                      }
                      className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700/70 light:border-neutral-200 bg-white/60 dark:bg-neutral-800/40 light:bg-neutral-50 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 light:hover:bg-neutral-100 text-left transition-all hover:scale-[1.01] hover:shadow-sm group"
                    >
                      <div className="text-[11px] font-medium text-neutral-500 mb-1">
                        {card.category}
                      </div>

                      <div className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white leading-snug">
                        {card.title}
                      </div>

                      <div className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                        {card.subtitle}
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 py-4 divide-y divide-neutral-200/40 dark:divide-neutral-800/40">
              {activeSession.messages.map(message => (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  isStreaming={
                    message.id === streamingMessageId &&
                    isStreaming
                  }
                  onRegenerate={handleRegenerate}
                  onEditMessage={newContent =>
                    handleEditMessage(
                      message.id,
                      newContent
                    )
                  }
                  onFeedback={type =>
                    handleFeedback(message.id, type)
                  }
                />
              ))}

              <div ref={messagesEndRef} className="h-6" />
            </div>
          )}
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            title="Scroll to bottom"
            className="absolute bottom-24 right-6 p-2 rounded-full bg-white dark:bg-neutral-800 light:bg-neutral-900 text-neutral-900 dark:text-white light:text-white shadow-lg border border-neutral-200 dark:border-neutral-700 hover:scale-105 transition-all z-20"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* Input */}
        <div className="shrink-0 bg-gradient-to-t from-[#212121] via-[#212121] dark:from-[#212121] dark:via-[#212121] light:from-white light:via-white to-transparent pt-3">
          <ChatInput
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            onStopStreaming={handleStopStreaming}
          />
        </div>
      </div>

      {/* Modals */}
      <ShareModal
        session={activeSession}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onClearAllSessions={handleClearAllSessions}
      />
    </div>
  );
}
