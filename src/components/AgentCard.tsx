'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MoreVertical, 
  MessageSquare, 
  UserPlus, 
  Zap,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CapabilityTagList } from './CapabilityTag';
import type { Agent, AgentStatus } from '@/lib/types';
import { motion } from 'framer-motion';

interface AgentCardProps {
  agent: Agent;
  onMessage?: (agentId: string) => void;
  onInvite?: (agentId: string) => void;
  onClick?: (agentId: string) => void;
  selected?: boolean;
}

const statusColors: Record<AgentStatus, string> = {
  online: 'bg-green-500 shadow-green-500/50',
  offline: 'bg-gray-500',
  busy: 'bg-amber-500 shadow-amber-500/50',
};

const statusLabels: Record<AgentStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  busy: 'Busy',
};

const protocolIcons: Record<string, string> = {
  intercom: '🔗',
  openai: '🤖',
  anthropic: '🧠',
  custom: '⚙️',
};

export function AgentCard({
  agent,
  onMessage,
  onInvite,
  onClick,
  selected,
}: AgentCardProps) {
  const initials = agent.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50 backdrop-blur-sm cursor-pointer transition-all duration-300',
          'hover:border-gray-600 hover:shadow-lg hover:shadow-gray-900/50',
          selected && 'border-purple-500/50 shadow-lg shadow-purple-500/20'
        )}
        onClick={() => onClick?.(agent.id)}
      >
        {/* Status indicator glow */}
        {agent.status === 'online' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0" />
        )}

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-gray-700">
                  <AvatarImage src={agent.avatar} alt={agent.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Circle
                  className={cn(
                    'absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-900',
                    statusColors[agent.status]
                  )}
                  fill="currentColor"
                />
              </div>
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  {agent.name}
                  {agent.status === 'online' && (
                    <Zap className="w-4 h-4 text-amber-400" />
                  )}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{protocolIcons[agent.protocol] || '🔗'}</span>
                  <span>{agent.protocol}</span>
                  <span className="text-gray-600">•</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs px-1.5 py-0 h-5',
                      agent.status === 'online' && 'text-green-400 border-green-500/30',
                      agent.status === 'busy' && 'text-amber-400 border-amber-500/30',
                      agent.status === 'offline' && 'text-gray-400 border-gray-500/30'
                    )}
                  >
                    {statusLabels[agent.status]}
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {agent.description && (
            <p className="text-sm text-gray-400 line-clamp-2">
              {agent.description}
            </p>
          )}

          {agent.capabilities && agent.capabilities.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Capabilities</p>
              <CapabilityTagList
                capabilities={agent.capabilities.map((c) => ({
                  name: c.capability?.name || 'unknown',
                  proficiency: c.proficiency,
                  certified: c.certified,
                  category: c.capability?.category as any,
                }))}
                maxDisplay={4}
                size="sm"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-gray-800/50 border-gray-700 hover:bg-gray-700 hover:border-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                onMessage?.(agent.id);
              }}
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              Message
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-purple-600/20 border-purple-500/30 text-purple-400 hover:bg-purple-600/30 hover:text-purple-300"
              onClick={(e) => {
                e.stopPropagation();
                onInvite?.(agent.id);
              }}
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Invite
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface AgentCardGridProps {
  agents: Agent[];
  onMessage?: (agentId: string) => void;
  onInvite?: (agentId: string) => void;
  onAgentClick?: (agentId: string) => void;
  selectedAgentId?: string;
}

export function AgentCardGrid({
  agents,
  onMessage,
  onInvite,
  onAgentClick,
  selectedAgentId,
}: AgentCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent, index) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <AgentCard
            agent={agent}
            onMessage={onMessage}
            onInvite={onInvite}
            onClick={onAgentClick}
            selected={selectedAgentId === agent.id}
          />
        </motion.div>
      ))}
    </div>
  );
}
