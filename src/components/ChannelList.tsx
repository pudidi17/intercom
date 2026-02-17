'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Hash,
  Lock,
  Plus,
  Users,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Channel, ChannelType } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChannelListProps {
  channels: Array<Channel & { _count?: { members?: number; messages?: number } }>;
  selectedChannelId?: string;
  onChannelSelect: (channel: Channel) => void;
  onCreateChannel?: () => void;
  onJoinChannel?: (channelId: string) => void;
  currentAgentId?: string;
}

export function ChannelList({
  channels,
  selectedChannelId,
  onChannelSelect,
  onCreateChannel,
  onJoinChannel,
  currentAgentId,
}: ChannelListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Hash className="w-5 h-5 text-purple-400" />
            Channels
          </CardTitle>
          {onCreateChannel && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
              onClick={onCreateChannel}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        <Input
          placeholder="Search channels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 bg-gray-800/50 border-gray-700 text-sm"
        />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          <AnimatePresence>
            {filteredChannels.map((channel, index) => {
              const isSelected = selectedChannelId === channel.id;
              const isPrivate = channel.type === 'private';
              const memberCount = channel._count?.members || 0;
              const messageCount = channel._count?.messages || 0;

              return (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <button
                    className={cn(
                      'w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 text-left group',
                      isSelected
                        ? 'bg-purple-600/20 border border-purple-500/30'
                        : 'hover:bg-gray-800/50 border border-transparent'
                    )}
                    onClick={() => onChannelSelect(channel)}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                      )}
                    >
                      {isPrivate ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Hash className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-medium truncate',
                            isSelected ? 'text-white' : 'text-gray-200'
                          )}
                        >
                          {channel.name}
                        </span>
                        {isPrivate && (
                          <Lock className="w-3 h-3 text-amber-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {memberCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {messageCount}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 transition-transform',
                        isSelected
                          ? 'text-purple-400 rotate-90'
                          : 'text-gray-600 group-hover:text-gray-400'
                      )}
                    />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredChannels.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No channels found</p>
              {onCreateChannel && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-purple-400 mt-2"
                  onClick={onCreateChannel}
                >
                  Create a channel
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChannelListItemProps {
  channel: Channel;
  isSelected: boolean;
  onClick: () => void;
}

export function ChannelListItem({
  channel,
  isSelected,
  onClick,
}: ChannelListItemProps) {
  const isPrivate = channel.type === 'private';

  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
        isSelected
          ? 'bg-purple-600/20 text-white'
          : 'hover:bg-gray-800/50 text-gray-300'
      )}
      onClick={onClick}
    >
      {isPrivate ? (
        <Lock className="w-4 h-4 text-amber-400" />
      ) : (
        <Hash className="w-4 h-4 text-gray-500" />
      )}
      <span className="font-medium truncate">{channel.name}</span>
    </button>
  );
}
