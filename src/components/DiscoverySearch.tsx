'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CapabilityTag } from './CapabilityTag';
import {
  Search,
  Sparkles,
  X,
  Filter,
  Loader2,
  Zap,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agent, CapabilityCategory } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface DiscoverySearchProps {
  agents: Agent[];
}

const categoryFilters: CapabilityCategory[] = [
  'analysis',
  'generation',
  'communication',
  'reasoning',
  'action',
  'multimodal',
];

export function DiscoverySearch({ agents }: DiscoverySearchProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CapabilityCategory | null>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [showAIMatch, setShowAIMatch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Array<{
    agent: Agent;
    score: number;
    matchedCapabilities: string[];
  }>>([]);

  // Get all unique capabilities from agents
  const allCapabilities = Array.from(
    new Set(
      agents.flatMap((a) =>
        a.capabilities?.map((c) => c.capability?.name).filter(Boolean) || []
      )
    )
  );

  const handleAIMatch = async () => {
    if (!aiQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/intercom/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements: aiQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.matches || []);
      }
    } catch (error) {
      console.error('AI matching failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    const filtered = agents
      .filter((agent) => {
        if (!query) return true;
        const searchLower = query.toLowerCase();
        return (
          agent.name.toLowerCase().includes(searchLower) ||
          agent.description?.toLowerCase().includes(searchLower) ||
          agent.capabilities?.some(
            (c) => c.capability?.name.toLowerCase().includes(searchLower)
          )
        );
      })
      .map((agent) => ({
        agent,
        score: query ? 0.8 : 1,
        matchedCapabilities:
          agent.capabilities?.map((c) => c.capability?.name || '').filter(Boolean) || [],
      }));

    setResults(filtered);
  };

  // Initial results
  useState(() => {
    setResults(
      agents.slice(0, 10).map((agent) => ({
        agent,
        score: 1,
        matchedCapabilities:
          agent.capabilities?.map((c) => c.capability?.name || '').filter(Boolean) || [],
      }))
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Search Panel */}
      <Card className="lg:col-span-1 bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-400" />
            Discover Agents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI-powered matching */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'w-full justify-start gap-2 bg-gray-800/50 border-gray-700',
                showAIMatch && 'border-purple-500/50 text-purple-400'
              )}
              onClick={() => setShowAIMatch(!showAIMatch)}
            >
              <Sparkles className="w-4 h-4" />
              AI-Powered Matching
              <Zap className="w-3 h-3 ml-auto text-amber-400" />
            </Button>

            <AnimatePresence>
              {showAIMatch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-2">
                    <textarea
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="Describe what you need... e.g., 'I need an agent that can analyze data and generate visualizations'"
                      className="w-full h-24 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                      onClick={handleAIMatch}
                      disabled={!aiQuery.trim() || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Find Best Matches
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search agents or capabilities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 bg-gray-800/50 border-gray-700"
            />
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-gray-400"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              Filters
            </Button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="flex items-center gap-1 overflow-hidden flex-wrap"
                >
                  {categoryFilters.map((cat) => (
                    <Badge
                      key={cat}
                      variant="outline"
                      className={cn(
                        'cursor-pointer text-xs',
                        selectedCategory === cat
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-400'
                          : 'bg-gray-800/50 border-gray-700 text-gray-400'
                      )}
                      onClick={() =>
                        setSelectedCategory(selectedCategory === cat ? null : cat)
                      }
                    >
                      {cat}
                    </Badge>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Capability suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Available capabilities:</p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
              {allCapabilities.slice(0, 20).map((cap, idx) => (
                <CapabilityTag
                  key={idx}
                  name={cap}
                  size="sm"
                  onClick={() => {
                    setQuery(cap);
                    handleSearch();
                  }}
                />
              ))}
            </div>
          </div>

          {/* Search button */}
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Search Agents
          </Button>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card className="lg:col-span-2 bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-green-400" />
              Results
              <Badge variant="secondary" className="ml-2">
                {results.length} agents
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {results.map((result, index) => (
                <motion.div
                  key={result.agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        {result.agent.name}
                        {result.agent.status === 'online' && (
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {result.agent.description || 'No description'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-400">
                        {Math.round(result.score * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">match</div>
                    </div>
                  </div>
                  {result.matchedCapabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.matchedCapabilities.slice(0, 5).map((cap) => (
                        <Badge
                          key={cap}
                          variant="outline"
                          className="text-xs bg-purple-600/10 border-purple-500/30 text-purple-400"
                        >
                          {cap}
                        </Badge>
                      ))}
                      {result.matchedCapabilities.length > 5 && (
                        <Badge variant="outline" className="text-xs text-gray-400">
                          +{result.matchedCapabilities.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {results.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No agents found</p>
                <p className="text-xs text-gray-600 mt-1">
                  Try a different search query
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
