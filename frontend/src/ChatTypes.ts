export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: ChatAttachment[];
  isStreaming?: boolean;
  feedback?: 'like' | 'dislike' | null;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model: string;
}

export type ChatThemeMode = 'dark' | 'light' | 'system';

export interface ChatModelOption {
  id: string;
  name: string;
  description: string;
  tag?: string;
  iconType: 'sparkles' | 'zap' | 'brain';
}
