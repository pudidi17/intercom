'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CapabilityTag } from './CapabilityTag';
import {
  Plus,
  X,
  Loader2,
  Sparkles,
  Bot,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentProtocol, CapabilityCategory } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentRegistryProps {
  onAgentCreated?: () => void;
}

const protocols: AgentProtocol[] = ['intercom', 'openai', 'anthropic', 'custom'];

const capabilitySuggestions = [
  { name: 'data-analysis', category: 'analysis' as CapabilityCategory },
  { name: 'code-generation', category: 'generation' as CapabilityCategory },
  { name: 'web-search', category: 'action' as CapabilityCategory },
  { name: 'image-generation', category: 'multimodal' as CapabilityCategory },
  { name: 'summarization', category: 'communication' as CapabilityCategory },
  { name: 'reasoning', category: 'reasoning' as CapabilityCategory },
  { name: 'debugging', category: 'action' as CapabilityCategory },
  { name: 'translation', category: 'communication' as CapabilityCategory },
];

export function AgentRegistry({ onAgentCreated }: AgentRegistryProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [protocol, setProtocol] = useState<AgentProtocol>('intercom');
  const [endpoint, setEndpoint] = useState('');
  const [selectedCapabilities, setSelectedCapabilities] = useState<
    Array<{ name: string; proficiency: number; certified: boolean }>
  >([]);
  const [newCapability, setNewCapability] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAddCapability = (capName: string) => {
    if (!selectedCapabilities.find((c) => c.name === capName)) {
      setSelectedCapabilities([
        ...selectedCapabilities,
        { name: capName, proficiency: 0.7, certified: false },
      ]);
    }
  };

  const handleRemoveCapability = (capName: string) => {
    setSelectedCapabilities(
      selectedCapabilities.filter((c) => c.name !== capName)
    );
  };

  const handleUpdateProficiency = (capName: string, proficiency: number) => {
    setSelectedCapabilities(
      selectedCapabilities.map((c) =>
        c.name === capName ? { ...c, proficiency } : c
      )
    );
  };

  const handleSuggestCapabilities = async () => {
    if (!description.trim()) return;
    
    setSuggesting(true);
    try {
      const response = await fetch(
        `/api/intercom/match?description=${encodeURIComponent(description)}`
      );
      const data = await response.json();
      if (data.capabilities) {
        data.capabilities.forEach((cap: string) => {
          if (!selectedCapabilities.find((c) => c.name === cap)) {
            handleAddCapability(cap);
          }
        });
      }
    } catch (error) {
      console.error('Failed to suggest capabilities:', error);
    } finally {
      setSuggesting(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/intercom/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          protocol,
          endpoint: endpoint.trim() || undefined,
          capabilities: selectedCapabilities,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          // Reset form
          setName('');
          setDescription('');
          setProtocol('intercom');
          setEndpoint('');
          setSelectedCapabilities([]);
          setSuccess(false);
          onAgentCreated?.();
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to register agent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          Register New Agent
        </CardTitle>
        <p className="text-sm text-gray-400">
          Add your AI agent to the AgentBridge network
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Agent Registered!
            </h3>
            <p className="text-sm text-gray-400">
              Your agent has been added to the network
            </p>
          </motion.div>
        ) : (
          <>
            {/* Agent Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                Agent Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Data Analyzer Pro"
                className="bg-gray-800/50 border-gray-700"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-gray-300">
                  Description
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-purple-400 hover:text-purple-300"
                  onClick={handleSuggestCapabilities}
                  disabled={!description.trim() || suggesting}
                >
                  {suggesting ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  AI Suggest Capabilities
                </Button>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this agent does..."
                className="bg-gray-800/50 border-gray-700 min-h-[80px]"
              />
            </div>

            {/* Protocol */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Protocol</Label>
                <Select
                  value={protocol}
                  onValueChange={(value) => setProtocol(value as AgentProtocol)}
                >
                  <SelectTrigger className="bg-gray-800/50 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {protocols.map((p) => (
                      <SelectItem
                        key={p}
                        value={p}
                        className="hover:bg-gray-700 focus:bg-gray-700"
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endpoint" className="text-gray-300">
                  Endpoint (optional)
                </Label>
                <Input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.example.com"
                  className="bg-gray-800/50 border-gray-700"
                />
              </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-3">
              <Label className="text-gray-300">Capabilities</Label>
              
              {/* Selected capabilities */}
              <AnimatePresence>
                {selectedCapabilities.length > 0 && (
                  <div className="space-y-2">
                    {selectedCapabilities.map((cap) => (
                      <motion.div
                        key={cap.name}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-300 font-medium">
                            {cap.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {Math.round(cap.proficiency * 100)}%
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-500 hover:text-red-400"
                              onClick={() => handleRemoveCapability(cap.name)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={cap.proficiency * 100} className="h-1.5 flex-1" />
                          <label className="flex items-center gap-1 text-xs text-gray-400">
                            <input
                              type="checkbox"
                              checked={cap.certified}
                              onChange={(e) =>
                                setSelectedCapabilities(
                                  selectedCapabilities.map((c) =>
                                    c.name === cap.name
                                      ? { ...c, certified: e.target.checked }
                                      : c
                                  )
                                )
                              }
                              className="rounded border-gray-600"
                            />
                            Certified
                          </label>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {/* Add capability input */}
              <div className="flex gap-2">
                <Input
                  value={newCapability}
                  onChange={(e) => setNewCapability(e.target.value)}
                  placeholder="Add a capability..."
                  className="bg-gray-800/50 border-gray-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCapability.trim()) {
                      handleAddCapability(newCapability.trim());
                      setNewCapability('');
                    }
                  }}
                />
                <Button
                  variant="outline"
                  className="border-gray-700"
                  onClick={() => {
                    if (newCapability.trim()) {
                      handleAddCapability(newCapability.trim());
                      setNewCapability('');
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Suggested capabilities */}
              <div className="flex flex-wrap gap-1.5">
                {capabilitySuggestions
                  .filter(
                    (c) => !selectedCapabilities.find((s) => s.name === c.name)
                  )
                  .map((cap) => (
                    <CapabilityTag
                      key={cap.name}
                      name={cap.name}
                      category={cap.category}
                      size="sm"
                      onClick={() => handleAddCapability(cap.name)}
                    />
                  ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 min-w-[150px]"
                onClick={handleSubmit}
                disabled={!name.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4 mr-2" />
                )}
                Register Agent
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
