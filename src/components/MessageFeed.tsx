'use client';

import { useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Message, Agent } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, ArrowRight } from 'lucide-react';

interface MessageFeedProps {
  messages: Array<Message & { sender?: Agent }>;
  currentAgentId?: string;
  className?: string;
  maxHeight?: string;
}

export function MessageFeed({
  messages,
  currentAgentId,
  className,
  maxHeight = '500px',
}: MessageFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      ref={feedRef}
      className={cn(
        'space-y-3 overflow-y-auto pr-2 custom-scrollbar',
        className
      )}
      style={{ maxHeight }}
    >
      <AnimatePresence>
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentAgentId;
          const isSystem = message.type === 'system';
          const isError = message.type === 'error';

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className={cn(
                'flex gap-3',
                isCurrentUser ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Avatar */}
              {!isSystem && (
                <Avatar className="h-8 w-8 flex-shrink-0 border border-gray-700">
                  <AvatarImage src={message.sender?.avatar} />
                  <AvatarFallback
                    className={cn(
                      'text-xs font-medium',
                      isCurrentUser
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300'
                    )}
                  >
                    {message.sender?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || (
                      <Bot className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Message Content */}
              <div
                className={cn(
                  'flex-1 max-w-[75%]',
                  isCurrentUser ? 'items-end' : 'items-start',
                  isSystem && 'max-w-full'
                )}
              >
                {/* Sender name and time */}
                {!isSystem && (
                  <div
                    className={cn(
                      'flex items-center gap-2 mb-1',
                      isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <span className="text-sm font-medium text-gray-300">
                      {message.sender?.name || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.createdAt)}
                    </span>
                    {message.receiverId && (
                      <>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <User className="w-3 h-3 text-gray-500" />
                      </>
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm',
                    isSystem && 'bg-gray-800/50 border border-gray-700/50 text-gray-400 text-center italic',
                    isError && 'bg-red-500/20 border border-red-500/30 text-red-400',
                    !isSystem && !isError && isCurrentUser && 'bg-gradient-to-br from-purple-600 to-blue-600 text-white',
                    !isSystem && !isError && !isCurrentUser && 'bg-gray-800 text-gray-200 border border-gray-700/50'
                  )}
                >
                  {message.content}
                </div>

                {/* Message metadata */}
                {message.metadata && (
                  <div className="mt-1 text-xs text-gray-500">
                    {JSON.stringify(message.metadata).slice(0, 50)}...
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Bot className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm">No messages yet</p>
          <p className="text-xs text-gray-600 mt-1">
            Start a conversation or join a channel
          </p>
        </div>
      )}
    </div>
  );
}

interface MessageInputProps {
  onSend: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  placeholder = 'Type a message...',
  disabled,
}: MessageInputProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get('message') as string;
    if (content.trim()) {
      onSend(content.trim());
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        name="message"
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 disabled:opacity-50"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={disabled}
        className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-500 hover:to-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
}
