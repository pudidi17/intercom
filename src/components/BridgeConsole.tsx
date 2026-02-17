'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageFeed, MessageInput } from './MessageFeed';
import {
  Wifi,
  WifiOff,
  Send,
  Activity,
  Server,
  RefreshCw,
  Loader2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BridgeStatus, ConnectionState, Message } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface BridgeConsoleProps {
  bridgeStatus: BridgeStatus;
  messages: Message[];
  onConnect: () => void;
  onDisconnect: () => void;
  onSendMessage: (content: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const connectionStateColors: Record<ConnectionState, string> = {
  disconnected: 'text-gray-500',
  connecting: 'text-amber-500',
  connected: 'text-green-500',
  error: 'text-red-500',
};

const connectionStateLabels: Record<ConnectionState, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Connected',
  error: 'Error',
};

export function BridgeConsole({
  bridgeStatus,
  messages,
  onConnect,
  onDisconnect,
  onSendMessage,
  onRefresh,
  isLoading,
}: BridgeConsoleProps) {
  const [logs, setLogs] = useState<Array<{ time: Date; message: string; type: 'info' | 'error' | 'success' }>>([
    { time: new Date(), message: 'Bridge console initialized', type: 'info' },
  ]);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setLogs((prev) => [...prev, { time: new Date(), message, type }]);
  };

  const handleConnect = () => {
    addLog('Initiating connection to SC-Bridge...', 'info');
    onConnect();
  };

  const handleDisconnect = () => {
    addLog('Disconnecting from SC-Bridge...', 'info');
    onDisconnect();
  };

  const formatLogTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-400" />
            Bridge Console
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'flex items-center gap-1.5',
                bridgeStatus.state === 'connected'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : bridgeStatus.state === 'connecting'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
              )}
            >
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  bridgeStatus.state === 'connected'
                    ? 'bg-green-500 animate-pulse'
                    : bridgeStatus.state === 'connecting'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-gray-500'
                )}
              />
              {connectionStateLabels[bridgeStatus.state]}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn('w-4 h-4', isLoading && 'animate-spin')}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="bg-gray-800/50 border border-gray-700 w-full">
            <TabsTrigger
              value="messages"
              className="flex-1 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Messages
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              className="flex-1 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
            >
              <Activity className="w-4 h-4 mr-1.5" />
              Logs
            </TabsTrigger>
            <TabsTrigger
              value="status"
              className="flex-1 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
            >
              <Zap className="w-4 h-4 mr-1.5" />
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="mt-4 space-y-4">
            <div className="h-64 overflow-hidden">
              <MessageFeed
                messages={messages as any}
                maxHeight="256px"
              />
            </div>
            <MessageInput
              onSend={onSendMessage}
              placeholder="Send message through bridge..."
              disabled={bridgeStatus.state !== 'connected'}
            />
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <div className="h-72 overflow-y-auto bg-gray-950 rounded-lg p-3 font-mono text-xs custom-scrollbar">
              <AnimatePresence>
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      'py-1 border-b border-gray-800/50 last:border-0',
                      log.type === 'error' && 'text-red-400',
                      log.type === 'success' && 'text-green-400',
                      log.type === 'info' && 'text-gray-400'
                    )}
                  >
                    <span className="text-gray-600 mr-2">
                      [{formatLogTime(log.time)}]
                    </span>
                    {log.message}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="status" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              <StatusCard
                label="Connection State"
                value={bridgeStatus.state}
                icon={<Wifi className="w-4 h-4" />}
                color={connectionStateColors[bridgeStatus.state]}
              />
              <StatusCard
                label="Connected Agents"
                value={bridgeStatus.connectedAgents.toString()}
                icon={<Activity className="w-4 h-4" />}
                color="text-purple-400"
              />
              <StatusCard
                label="Active Channels"
                value={bridgeStatus.activeChannels.toString()}
                icon={<Zap className="w-4 h-4" />}
                color="text-blue-400"
              />
              <StatusCard
                label="Messages Processed"
                value={bridgeStatus.messagesProcessed.toString()}
                icon={<Send className="w-4 h-4" />}
                color="text-green-400"
              />
            </div>

            <div className="mt-4 flex gap-2">
              {bridgeStatus.state === 'connected' ? (
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={handleDisconnect}
                >
                  <WifiOff className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                  onClick={handleConnect}
                  disabled={bridgeStatus.state === 'connecting'}
                >
                  {bridgeStatus.state === 'connecting' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wifi className="w-4 h-4 mr-2" />
                  )}
                  Connect to Bridge
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StatusCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
      <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
        {icon}
        {label}
      </div>
      <div className={cn('text-xl font-semibold', color)}>{value}</div>
    </div>
  );
}
