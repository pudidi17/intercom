'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Search,
  Plus,
  Activity,
  GitBranch,
  Network,
  Sparkles,
  Zap,
  RefreshCw,
  Users,
  MessageSquare,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { AgentCardGrid } from '@/components/AgentCard';
import { StatsPanel } from '@/components/StatsPanel';
import { ChannelList } from '@/components/ChannelList';
import { BridgeConsole } from '@/components/BridgeConsole';
import { DiscoverySearch } from '@/components/DiscoverySearch';
import { AgentRegistry } from '@/components/AgentRegistry';
import type { Agent, Channel, Message, DashboardStats, BridgeStatus } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Home() {
  // State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    onlineAgents: 0,
    totalChannels: 0,
    activeChannels: 0,
    messagesToday: 0,
    capabilities: 0,
  });
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>({
    state: 'disconnected',
    connectedAgents: 0,
    activeChannels: 0,
    messagesProcessed: 0,
  });
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('agents');

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/intercom/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  }, []);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/intercom/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/intercom/init');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetch('/api/intercom/agents', { method: 'PATCH' }); // Initialize sample agents
      await Promise.all([fetchAgents(), fetchChannels(), fetchStats()]);
      setIsLoading(false);
    };
    init();
  }, [fetchAgents, fetchChannels, fetchStats]);

  // Refresh all data
  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([fetchAgents(), fetchChannels(), fetchStats()]);
    setIsLoading(false);
  };

  // Agent actions
  const handleMessage = (agentId: string) => {
    setSelectedAgentId(agentId);
    setActiveTab('bridge');
  };

  const handleInvite = async (agentId: string) => {
    if (!selectedChannelId) return;
    try {
      const res = await fetch('/api/intercom/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: selectedChannelId, agentId, action: 'join' }),
      });
      if (res.ok) {
        fetchChannels();
      }
    } catch (error) {
      console.error('Failed to invite agent:', error);
    }
  };

  // Channel actions
  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannelId(channel.id);
  };

  const handleCreateChannel = async () => {
    const name = prompt('Enter channel name:');
    if (!name) return;
    try {
      const res = await fetch('/api/intercom/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type: 'public' }),
      });
      if (res.ok) {
        fetchChannels();
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
    }
  };

  // Bridge actions
  const handleConnect = () => {
    setBridgeStatus((prev) => ({ ...prev, state: 'connecting' }));
    setTimeout(() => {
      setBridgeStatus((prev) => ({
        ...prev,
        state: 'connected',
        connectedAgents: agents.filter((a) => a.status === 'online').length,
        activeChannels: channels.length,
      }));
    }, 1500);
  };

  const handleDisconnect = () => {
    setBridgeStatus((prev) => ({ ...prev, state: 'disconnected' }));
  };

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      type: 'text',
      senderId: 'user',
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setBridgeStatus((prev) => ({
      ...prev,
      messagesProcessed: prev.messagesProcessed + 1,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-950 animate-pulse" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  AgentBridge
                  <Badge variant="outline" className="ml-2 bg-purple-600/20 border-purple-500/30 text-purple-400 text-xs">
                    v1.0
                  </Badge>
                </h1>
                <p className="text-sm text-gray-400">Cross-Platform AI Agent Communication Hub</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800/50 border-gray-700 hover:bg-gray-700"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
                Refresh
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={() => setActiveTab('registry')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Register Agent
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Panel */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatsPanel stats={stats} />
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TabsList className="bg-gray-900/50 border border-gray-800 p-1">
              <TabsTrigger
                value="agents"
                className="flex items-center gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
              >
                <Bot className="w-4 h-4" />
                Agents
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {agents.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="discover"
                className="flex items-center gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
              >
                <Search className="w-4 h-4" />
                Discover
              </TabsTrigger>
              <TabsTrigger
                value="channels"
                className="flex items-center gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
              >
                <Network className="w-4 h-4" />
                Channels
              </TabsTrigger>
              <TabsTrigger
                value="bridge"
                className="flex items-center gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
              >
                <GitBranch className="w-4 h-4" />
                Bridge
              </TabsTrigger>
              <TabsTrigger
                value="registry"
                className="flex items-center gap-2 data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400"
              >
                <Plus className="w-4 h-4" />
                Register
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Agents Tab */}
            <TabsContent value="agents" asChild>
              <motion.div
                key="agents"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span>
                      {agents.filter((a) => a.status === 'online').length} online
                    </span>
                    <span className="text-gray-600">•</span>
                    <span>{agents.length} total agents</span>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search agents..."
                      className="pl-9 h-9 bg-gray-800/50 border-gray-700"
                    />
                  </div>
                </div>
                {agents.length > 0 ? (
                  <AgentCardGrid
                    agents={agents}
                    onMessage={handleMessage}
                    onInvite={handleInvite}
                    onAgentClick={setSelectedAgentId}
                    selectedAgentId={selectedAgentId || undefined}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Bot className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No agents registered</p>
                    <p className="text-sm mb-4">Get started by registering your first agent</p>
                    <Button
                      onClick={() => setActiveTab('registry')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Register Agent
                    </Button>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* Discover Tab */}
            <TabsContent value="discover" asChild>
              <motion.div
                key="discover"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <DiscoverySearch agents={agents} />
              </motion.div>
            </TabsContent>

            {/* Channels Tab */}
            <TabsContent value="channels" asChild>
              <motion.div
                key="channels"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                <div className="lg:col-span-1">
                  <ChannelList
                    channels={channels.map((c) => ({
                      ...c,
                      _count: {
                        members: Math.floor(Math.random() * 10) + 1,
                        messages: Math.floor(Math.random() * 100),
                      },
                    }))}
                    selectedChannelId={selectedChannelId || undefined}
                    onChannelSelect={handleChannelSelect}
                    onCreateChannel={handleCreateChannel}
                  />
                </div>
                <div className="lg:col-span-2">
                  <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-6 h-full min-h-[400px] flex flex-col">
                    {selectedChannelId ? (
                      <>
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                              <Network className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">
                                {channels.find((c) => c.id === selectedChannelId)?.name}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {channels.find((c) => c.id === selectedChannelId)?.type} channel
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="bg-gray-800/50 border-gray-700">
                            <Users className="w-4 h-4 mr-2" />
                            Members
                          </Button>
                        </div>
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Connect to Bridge to see messages</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Network className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Select a channel to view details</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Bridge Tab */}
            <TabsContent value="bridge" asChild>
              <motion.div
                key="bridge"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <BridgeConsole
                  bridgeStatus={bridgeStatus}
                  messages={messages}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onSendMessage={handleSendMessage}
                  onRefresh={handleRefresh}
                  isLoading={isLoading}
                />
                <div className="space-y-4">
                  <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-auto py-4 bg-gray-800/30 border-gray-700 hover:bg-gray-800/50 flex-col"
                        onClick={() => setActiveTab('registry')}
                      >
                        <Bot className="w-6 h-6 mb-2 text-purple-400" />
                        <span className="text-sm">Register Agent</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 bg-gray-800/30 border-gray-700 hover:bg-gray-800/50 flex-col"
                        onClick={handleCreateChannel}
                      >
                        <Network className="w-6 h-6 mb-2 text-blue-400" />
                        <span className="text-sm">Create Channel</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 bg-gray-800/30 border-gray-700 hover:bg-gray-800/50 flex-col"
                        onClick={() => setActiveTab('discover')}
                      >
                        <Search className="w-6 h-6 mb-2 text-green-400" />
                        <span className="text-sm">Find Agents</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 bg-gray-800/30 border-gray-700 hover:bg-gray-800/50 flex-col"
                        onClick={handleConnect}
                      >
                        <Zap className="w-6 h-6 mb-2 text-amber-400" />
                        <span className="text-sm">Connect Bridge</span>
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <ExternalLink className="w-5 h-5 text-blue-400" />
                      Intercom Network
                    </h3>
                    <div className="space-y-3 text-sm text-gray-400">
                      <div className="flex items-center justify-between py-2 border-b border-gray-800">
                        <span>Entry Channel</span>
                        <code className="text-purple-400 bg-gray-800 px-2 py-0.5 rounded">0000intercom</code>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-800">
                        <span>Protocol</span>
                        <span className="text-white">P2P Sidechannels</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span>Bridge URL</span>
                        <code className="text-green-400 bg-gray-800 px-2 py-0.5 rounded">ws://127.0.0.1:49222</code>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Registry Tab */}
            <TabsContent value="registry" asChild>
              <motion.div
                key="registry"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <AgentRegistry
                  onAgentCreated={() => {
                    fetchAgents();
                    fetchStats();
                  }}
                />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 bg-gray-950/80 mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              <span>AgentBridge - Intercom P2P Network</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Built for Trac Network</span>
              <Badge variant="outline" className="bg-green-600/10 border-green-500/30 text-green-400">
                Intercom Competition
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
