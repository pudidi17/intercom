// Agent Types
export interface Agent {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  status: AgentStatus;
  protocol: AgentProtocol;
  endpoint?: string;
  authToken?: string;
  metadata?: Record<string, unknown>;
  capabilities: AgentCapability[];
  channels?: ChannelMember[];
  createdAt: Date;
  updatedAt: Date;
}

export type AgentStatus = 'online' | 'offline' | 'busy';
export type AgentProtocol = 'intercom' | 'openai' | 'anthropic' | 'custom';

// Capability Types
export interface Capability {
  id: string;
  name: string;
  description?: string;
  category?: CapabilityCategory;
  createdAt: Date;
  updatedAt: Date;
}

export type CapabilityCategory = 'analysis' | 'generation' | 'communication' | 'reasoning' | 'action' | 'multimodal';

export interface AgentCapability {
  agentId: string;
  capabilityId: string;
  capability?: Capability;
  proficiency: number;
  certified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Channel Types
export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: ChannelType;
  channelId: string; // Intercom sidechannel ID
  createdBy?: string;
  members?: ChannelMember[];
  messages?: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export type ChannelType = 'public' | 'private';

export interface ChannelMember {
  agentId: string;
  channelId: string;
  role: MemberRole;
  agent?: Agent;
  channel?: Channel;
  joinedAt: Date;
}

export type MemberRole = 'admin' | 'member';

// Message Types
export interface Message {
  id: string;
  content: string;
  type: MessageType;
  senderId: string;
  receiverId?: string;
  channelId?: string;
  sender?: Agent;
  receiver?: Agent;
  channel?: Channel;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type MessageType = 'text' | 'command' | 'system' | 'error';

// Intercom Protocol Types
export interface IntercomMessage {
  type: IntercomMessageType;
  payload: unknown;
  timestamp?: number;
  sender?: string;
  channel?: string;
}

export type IntercomMessageType = 
  | 'auth_request'
  | 'auth_response'
  | 'agent_register'
  | 'agent_unregister'
  | 'sidechannel_create'
  | 'sidechannel_join'
  | 'sidechannel_leave'
  | 'sidechannel_message'
  | 'sidechannel_event'
  | 'capability_query'
  | 'capability_response'
  | 'discover_request'
  | 'discover_response'
  | 'heartbeat'
  | 'error';

export interface IntercomAuthRequest {
  type: 'auth_request';
  payload: {
    token: string;
    agentId?: string;
  };
}

export interface IntercomAuthResponse {
  type: 'auth_response';
  payload: {
    success: boolean;
    agentId?: string;
    error?: string;
  };
}

export interface IntercomSidechannelMessage {
  type: 'sidechannel_message';
  payload: {
    channelId: string;
    content: string;
    senderId: string;
    metadata?: Record<string, unknown>;
  };
}

export interface IntercomSidechannelEvent {
  type: 'sidechannel_event';
  payload: {
    channelId: string;
    event: 'join' | 'leave' | 'created' | 'destroyed';
    agentId?: string;
  };
}

// API Request/Response Types
export interface CreateAgentRequest {
  name: string;
  description?: string;
  avatar?: string;
  protocol?: AgentProtocol;
  endpoint?: string;
  capabilities?: Array<{
    name: string;
    proficiency?: number;
    certified?: boolean;
  }>;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  avatar?: string;
  status?: AgentStatus;
  protocol?: AgentProtocol;
  endpoint?: string;
  capabilities?: Array<{
    name: string;
    proficiency?: number;
    certified?: boolean;
  }>;
}

export interface DiscoverRequest {
  capabilities?: string[];
  categories?: CapabilityCategory[];
  minProficiency?: number;
  status?: AgentStatus;
  limit?: number;
}

export interface DiscoverResponse {
  agents: Array<{
    id: string;
    name: string;
    description?: string;
    status: AgentStatus;
    matchedCapabilities: string[];
    matchScore: number;
  }>;
  total: number;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  type?: ChannelType;
  memberIds?: string[];
}

export interface SendMessageRequest {
  content: string;
  type?: MessageType;
  receiverId?: string;
  channelId?: string;
  metadata?: Record<string, unknown>;
}

// WebSocket Connection Types
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface BridgeStatus {
  state: ConnectionState;
  lastHeartbeat?: Date;
  connectedAgents: number;
  activeChannels: number;
  messagesProcessed: number;
}

// Stats Types
export interface DashboardStats {
  totalAgents: number;
  onlineAgents: number;
  totalChannels: number;
  activeChannels: number;
  messagesToday: number;
  capabilities: number;
}

// Match Result Types
export interface MatchResult {
  agent: Agent;
  score: number;
  matchedCapabilities: Capability[];
  missingCapabilities: Capability[];
  recommendations: string[];
}
