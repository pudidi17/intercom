/**
 * AgentBridge Protocol
 * 
 * Defines the command mappings and transaction entrypoints for the AgentBridge contract.
 * This file maps external commands to internal contract handlers.
 */

module.exports = {
  name: 'agentbridge-protocol',
  version: '1.0.0',
  
  /**
   * Command definitions
   * Each command maps to a contract handler with parameter validation
   */
  commands: {
    // Agent Management
    '/agent_register': {
      handler: 'agent_register',
      description: 'Register a new agent in the hub',
      params: {
        name: { type: 'string', required: true, min: 1, max: 100 },
        description: { type: 'string', required: false, max: 500 },
        capabilities: { 
          type: 'array', 
          required: false,
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', required: true },
              proficiency: { type: 'number', min: 0, max: 1 },
              certified: { type: 'boolean' }
            }
          }
        },
        protocol: { type: 'string', enum: ['intercom', 'openai', 'anthropic', 'custom'] },
        visibility: { type: 'string', enum: ['public', 'private'] },
        endpoint: { type: 'string', required: false }
      }
    },
    
    '/agent_update': {
      handler: 'agent_update',
      description: 'Update agent profile',
      params: {
        status: { type: 'string', enum: ['online', 'offline', 'busy'] },
        capabilities: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', required: true },
              proficiency: { type: 'number', min: 0, max: 1 },
              certified: { type: 'boolean' }
            }
          }
        },
        visibility: { type: 'string', enum: ['public', 'private'] },
        endpoint: { type: 'string' }
      }
    },
    
    '/agent_unregister': {
      handler: 'agent_unregister',
      description: 'Remove agent from the hub',
      params: {}
    },
    
    // Discovery
    '/discover': {
      handler: null, // Read-only, handled separately
      description: 'Discover agents by capabilities',
      params: {
        capabilities: { type: 'array', items: { type: 'string' } },
        categories: { type: 'array', items: { type: 'string' } },
        minProficiency: { type: 'number', min: 0, max: 1 },
        status: { type: 'string', enum: ['online', 'offline', 'busy'] },
        limit: { type: 'number', min: 1, max: 100 }
      },
      readOnly: true
    },
    
    // Matchmaking
    '/match_create': {
      handler: 'match_create',
      description: 'Create a matchmaking request',
      params: {
        requiredCapabilities: { 
          type: 'array', 
          required: true,
          items: { type: 'string' }
        },
        minScore: { type: 'number', min: 0, max: 1 },
        taskDescription: { type: 'string', max: 1000 },
        ttl: { type: 'number', min: 60, max: 3600 },
        preferredProtocols: { 
          type: 'array', 
          items: { type: 'string', enum: ['intercom', 'openai', 'anthropic', 'custom'] }
        }
      }
    },
    
    '/match_propose': {
      handler: 'match_propose',
      description: 'Propose to fulfill a match request',
      params: {
        matchId: { type: 'string', required: true },
        score: { type: 'number', min: 0, max: 1, required: true },
        matchedCapabilities: { type: 'array', items: { type: 'string' }, required: true }
      }
    },
    
    '/match_accept': {
      handler: 'match_accept',
      description: 'Accept a match proposal',
      params: {
        matchId: { type: 'string', required: true },
        proposerId: { type: 'string', required: true }
      }
    },
    
    '/match_reject': {
      handler: null, // Updates proposal status
      description: 'Reject a match proposal',
      params: {
        matchId: { type: 'string', required: true },
        proposerId: { type: 'string', required: true }
      }
    },
    
    '/match_complete': {
      handler: 'match_complete',
      description: 'Mark a match as complete',
      params: {
        matchId: { type: 'string', required: true },
        success: { type: 'boolean' },
        rating: { type: 'number', min: 1, max: 5 },
        feedback: { type: 'string', max: 500 }
      }
    },
    
    // Channels
    '/channel_join': {
      handler: 'channel_join',
      description: 'Join a communication channel',
      params: {
        channelId: { type: 'string', required: true }
      }
    },
    
    '/channel_leave': {
      handler: 'channel_leave',
      description: 'Leave a communication channel',
      params: {
        channelId: { type: 'string', required: true }
      }
    },
    
    // Messages
    '/message_record': {
      handler: 'message_record',
      description: 'Record a message for statistics',
      params: {
        channelId: { type: 'string' }
      }
    }
  },
  
  /**
   * Read handlers - these don't modify state
   */
  readers: {
    /**
     * Get agent by ID
     */
    get_agent(state, params) {
      const { agentId } = params;
      if (!agentId) return null;
      return state.agents[agentId] || null;
    },
    
    /**
     * Get all public agents
     */
    get_agents(state, params) {
      const { status, limit = 50 } = params;
      let agents = Object.values(state.agents).filter(a => a.visibility === 'public');
      
      if (status) {
        agents = agents.filter(a => a.status === status);
      }
      
      return agents.slice(0, limit);
    },
    
    /**
     * Discover agents by capabilities
     */
    discover(state, params) {
      const { 
        capabilities = [], 
        categories = [], 
        minProficiency = 0, 
        status, 
        limit = 20 
      } = params;
      
      // Find agents matching capabilities
      const matchingAgentIds = new Set();
      
      for (const capName of capabilities) {
        const agentsWithCap = state.capabilityIndex[capName] || [];
        agentsWithCap.forEach(id => matchingAgentIds.add(id));
      }
      
      // If no capabilities specified, get all public agents
      if (capabilities.length === 0) {
        Object.values(state.agents)
          .filter(a => a.visibility === 'public')
          .forEach(a => matchingAgentIds.add(a.id));
      }
      
      // Score and filter agents
      const results = [];
      
      for (const agentId of matchingAgentIds) {
        const agent = state.agents[agentId];
        if (!agent || agent.visibility !== 'public') continue;
        if (status && agent.status !== status) continue;
        
        // Calculate match score
        const matchedCapabilities = [];
        let totalScore = 0;
        
        for (const cap of agent.capabilities) {
          if (capabilities.includes(cap.name) && cap.proficiency >= minProficiency) {
            matchedCapabilities.push(cap.name);
            totalScore += cap.proficiency;
          }
        }
        
        // Filter by category if specified
        if (categories.length > 0) {
          // Assuming capabilities have categories - simplified check
          // In real implementation, would need category mapping
        }
        
        // Calculate match score (0-1)
        const matchScore = capabilities.length > 0 
          ? totalScore / capabilities.length 
          : 0.5;
        
        // Only include if at least one capability matched
        if (matchedCapabilities.length > 0 || capabilities.length === 0) {
          results.push({
            id: agent.id,
            name: agent.name,
            description: agent.description,
            status: agent.status,
            protocol: agent.protocol,
            capabilities: agent.capabilities,
            matchedCapabilities,
            matchScore,
            reputation: state.reputation[agentId] || null
          });
        }
      }
      
      // Sort by match score descending
      results.sort((a, b) => b.matchScore - a.matchScore);
      
      return {
        agents: results.slice(0, limit),
        total: results.length
      };
    },
    
    /**
     * Get match requests
     */
    get_match_requests(state, params) {
      const { status, requesterId, limit = 20 } = params;
      
      let requests = Object.values(state.matchRequests);
      
      if (status) {
        requests = requests.filter(r => r.status === status);
      }
      
      if (requesterId) {
        requests = requests.filter(r => r.requesterId === requesterId);
      }
      
      // Filter out expired requests
      const now = Date.now();
      requests = requests.filter(r => r.expiresAt > now || r.status !== 'pending');
      
      return requests.slice(0, limit);
    },
    
    /**
     * Get match proposals for a request
     */
    get_match_proposals(state, params) {
      const { matchId } = params;
      
      if (!matchId) return [];
      
      return Object.values(state.matchProposals)
        .filter(p => p.matchId === matchId);
    },
    
    /**
     * Get channel members
     */
    get_channel_members(state, params) {
      const { channelId } = params;
      
      if (!channelId) return [];
      
      const memberIds = state.channelMembers[channelId] || [];
      return memberIds.map(id => state.agents[id]).filter(Boolean);
    },
    
    /**
     * Get statistics
     */
    get_stats(state) {
      return state.stats;
    },
    
    /**
     * Get agent reputation
     */
    get_reputation(state, params) {
      const { agentId } = params;
      
      if (!agentId) return null;
      
      return state.reputation[agentId] || null;
    }
  },
  
  /**
   * Sidechannel message handlers
   * These handle P2P messages received via sidechannels
   */
  sidechannelHandlers: {
    /**
     * Handle incoming discovery broadcast
     */
    discover_broadcast(message, state, context) {
      const { channelId, payload } = message;
      
      // Process discovery broadcast from another agent
      if (payload.type === 'capability_announcement') {
        // Agent is announcing their capabilities
        // Could auto-register or update based on trusted source
        console.log(`[AgentBridge] Received capability announcement from ${message.from}`);
      }
      
      if (payload.type === 'match_broadcast') {
        // Agent is broadcasting a match request
        console.log(`[AgentBridge] Received match broadcast: ${payload.matchId}`);
      }
    },
    
    /**
     * Handle incoming match proposal via sidechannel
     */
    match_proposal_direct(message, state, context) {
      const { from, payload } = message;
      
      // Direct match proposal via sidechannel
      // This bypasses the on-chain proposal for faster matching
      console.log(`[AgentBridge] Direct match proposal from ${from}`);
      
      return {
        type: 'match_proposal_received',
        from,
        proposal: payload
      };
    },
    
    /**
     * Handle task delegation message
     */
    task_delegate(message, state, context) {
      const { from, payload } = message;
      
      // Another agent is delegating a task
      console.log(`[AgentBridge] Task delegation from ${from}: ${payload.taskDescription}`);
      
      return {
        type: 'task_delegation_received',
        from,
        task: payload
      };
    }
  },
  
  /**
   * Transaction entrypoints
   * These define how external transactions map to contract calls
   */
  entrypoints: {
    register: '/agent_register',
    update: '/agent_update',
    unregister: '/agent_unregister',
    match: '/match_create',
    propose: '/match_propose',
    accept: '/match_accept',
    complete: '/match_complete',
    join: '/channel_join',
    leave: '/channel_leave'
  }
};
