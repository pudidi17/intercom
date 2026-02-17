/**
 * AgentBridge Contract
 * 
 * This contract manages the AgentBridge communication hub on Trac Network.
 * It handles:
 * - Agent registration and profiles
 * - Capability tracking and verification
 * - Matchmaking requests and proposals
 * - Channel membership and policies
 * - Reputation scoring
 */

module.exports = {
  name: 'agentbridge',
  version: '1.0.0',
  
  // Initial state
  state: {
    // Agent registry: agentId -> agent profile
    agents: {},
    
    // Capability registry: capability name -> list of agent IDs
    capabilityIndex: {},
    
    // Active matchmaking requests: matchId -> request
    matchRequests: {},
    
    // Match proposals: matchId -> proposal
    matchProposals: {},
    
    // Channel membership: channelId -> member list
    channelMembers: {},
    
    // Agent reputation: agentId -> reputation data
    reputation: {},
    
    // Statistics
    stats: {
      totalAgents: 0,
      totalMatches: 0,
      successfulMatches: 0,
      totalChannels: 0,
      totalMessages: 0
    }
  },
  
  // State handlers
  handlers: {
    /**
     * Register a new agent
     * @param {Object} state - Current state
     * @param {Object} payload - { name, description, capabilities, protocol, visibility, endpoint }
     * @param {Object} context - { writer, timestamp }
     * @returns {Object} New state
     */
    agent_register(state, payload, context) {
      const { name, description, capabilities = [], protocol = 'intercom', visibility = 'public', endpoint } = payload;
      const { writer, timestamp } = context;
      
      // Validate required fields
      if (!name || typeof name !== 'string') {
        throw new Error('Agent name is required');
      }
      
      // Check for duplicate name
      const existingAgent = Object.values(state.agents).find(a => a.name === name);
      if (existingAgent) {
        throw new Error('Agent name already registered');
      }
      
      // Generate agent ID from writer key
      const agentId = writer;
      
      // Create agent profile
      const agent = {
        id: agentId,
        name,
        description: description || '',
        capabilities: capabilities.map(cap => ({
          name: cap.name,
          proficiency: Math.min(1, Math.max(0, cap.proficiency || 0.5)),
          certified: cap.certified || false,
          certifiedBy: cap.certified ? writer : null,
          certifiedAt: cap.certified ? timestamp : null
        })),
        protocol,
        visibility,
        endpoint: endpoint || null,
        status: 'online',
        createdAt: timestamp,
        updatedAt: timestamp,
        matchCount: 0,
        successCount: 0
      };
      
      // Update state
      const newState = { ...state };
      newState.agents[agentId] = agent;
      
      // Update capability index
      for (const cap of capabilities) {
        if (!newState.capabilityIndex[cap.name]) {
          newState.capabilityIndex[cap.name] = [];
        }
        if (!newState.capabilityIndex[cap.name].includes(agentId)) {
          newState.capabilityIndex[cap.name].push(agentId);
        }
      }
      
      // Update stats
      newState.stats = { ...state.stats };
      newState.stats.totalAgents++;
      
      return {
        ...newState,
        _event: {
          type: 'agent_registered',
          agentId,
          agent
        }
      };
    },
    
    /**
     * Update agent profile
     * @param {Object} state - Current state
     * @param {Object} payload - { status?, capabilities?, visibility?, endpoint? }
     * @param {Object} context - { writer, timestamp }
     * @returns {Object} New state
     */
    agent_update(state, payload, context) {
      const { status, capabilities, visibility, endpoint } = payload;
      const { writer, timestamp } = context;
      
      const agentId = writer;
      const existingAgent = state.agents[agentId];
      
      if (!existingAgent) {
        throw new Error('Agent not registered');
      }
      
      const newState = { ...state };
      const updatedAgent = { ...existingAgent };
      
      // Update status
      if (status && ['online', 'offline', 'busy'].includes(status)) {
        updatedAgent.status = status;
      }
      
      // Update capabilities
      if (capabilities && Array.isArray(capabilities)) {
        // Remove old capability index entries
        for (const cap of updatedAgent.capabilities) {
          const idx = newState.capabilityIndex[cap.name]?.indexOf(agentId);
          if (idx > -1) {
            newState.capabilityIndex[cap.name].splice(idx, 1);
          }
        }
        
        // Set new capabilities
        updatedAgent.capabilities = capabilities.map(cap => ({
          name: cap.name,
          proficiency: Math.min(1, Math.max(0, cap.proficiency || 0.5)),
          certified: cap.certified || false
        }));
        
        // Add new capability index entries
        newState.capabilityIndex = { ...state.capabilityIndex };
        for (const cap of capabilities) {
          if (!newState.capabilityIndex[cap.name]) {
            newState.capabilityIndex[cap.name] = [];
          }
          if (!newState.capabilityIndex[cap.name].includes(agentId)) {
            newState.capabilityIndex[cap.name].push(agentId);
          }
        }
      }
      
      // Update visibility
      if (visibility && ['public', 'private'].includes(visibility)) {
        updatedAgent.visibility = visibility;
      }
      
      // Update endpoint
      if (endpoint !== undefined) {
        updatedAgent.endpoint = endpoint;
      }
      
      updatedAgent.updatedAt = timestamp;
      newState.agents[agentId] = updatedAgent;
      
      return {
        ...newState,
        _event: {
          type: 'agent_updated',
          agentId,
          updates: payload
        }
      };
    },
    
    /**
     * Unregister an agent
     * @param {Object} state - Current state
     * @param {Object} payload - {}
     * @param {Object} context - { writer, timestamp }
     * @returns {Object} New state
     */
    agent_unregister(state, payload, context) {
      const { writer } = context;
      const agentId = writer;
      
      const existingAgent = state.agents[agentId];
      if (!existingAgent) {
        throw new Error('Agent not registered');
      }
      
      const newState = { ...state };
      
      // Remove from capability index
      for (const cap of existingAgent.capabilities) {
        const idx = newState.capabilityIndex[cap.name]?.indexOf(agentId);
        if (idx > -1) {
          newState.capabilityIndex[cap.name].splice(idx, 1);
        }
      }
      
      // Remove agent
      delete newState.agents[agentId];
      
      // Update stats
      newState.stats = { ...state.stats };
      newState.stats.totalAgents--;
      
      return {
        ...newState,
        _event: {
          type: 'agent_unregistered',
          agentId
        }
      };
    },
    
    /**
     * Create a matchmaking request
     * @param {Object} state - Current state
     * @param {Object} payload - { requiredCapabilities, minScore, taskDescription, ttl, preferredProtocols }
     * @param {Object} context - { writer, timestamp }
     * @returns {Object} New state
     */
    match_create(state, payload, context) {
      const { requiredCapabilities = [], minScore = 0.5, taskDescription, ttl = 300, preferredProtocols = [] } = payload;
      const { writer, timestamp } = context;
      
      if (requiredCapabilities.length === 0) {
        throw new Error('At least one required capability is needed');
      }
      
      const matchId = `match-${writer.slice(0, 8)}-${timestamp}`;
      const expiresAt = timestamp + (ttl * 1000);
      
      const request = {
        id: matchId,
        requesterId: writer,
        requiredCapabilities,
        minScore,
        taskDescription: taskDescription || '',
        preferredProtocols,
        expiresAt,
        createdAt: timestamp,
        status: 'pending'
      };
      
      const newState = { ...state };
      newState.matchRequests = { ...state.matchRequests };
      newState.matchRequests[matchId] = request;
      
      // Update stats
      newState.stats = { ...state.stats };
      newState.stats.totalMatches++;
      
      return {
        ...newState,
        _event: {
          type: 'match_request_created',
          matchId,
          request
        }
      };
    },
    
    /**
     * Propose a match (called by potential match agents)
     * @param {Object} state - Current state
     * @param {Object} payload - { matchId, score, matchedCapabilities }
     * @param {Object} context - { writer, timestamp }
     * @returns {Object} New state
     */
    match_propose(state, payload, context) {
      const { matchId, score, matchedCapabilities } = payload;
      const { writer, timestamp } = context;
      
      const request = state.matchRequests[matchId];
      if (!request) {
        throw new Error('Match request not found');
      }
      
      if (timestamp > request.expiresAt) {
        throw new Error('Match request expired');
      }
      
      if (request.status !== 'pending') {
        throw new Error('Match request no longer pending');
      }
      
      const proposerAgent = state.agents[writer];
      if (!proposerAgent) {
        throw new Error('Proposer agent not registered');
      }
      
      const proposal = {
        matchId,
        proposerId: writer,
        score: Math.min(1, Math.max(0, score)),
        matchedCapabilities,
        proposedAt: timestamp,
        status: 'proposed'
      };
      
      const newState = { ...state };
      newState.matchProposals = { ...state.matchProposals };
      newState.matchProposals[`${matchId}-${writer}`] = proposal;
      
      return {
        ...newState,
        _event: {
          type: 'match_proposed',
          matchId,
          proposal
        }
      };
    },
    
    /**
     * Accept a match proposal
     * @param {Object} state - Current state
     * @param {Object} payload - { matchId, proposerId }
     * @param {Object} context - { writer, timestamp }
     * @returns {Object} New state
     */
    match_accept(state, payload, context) {
      const { matchId, proposerId } = payload;
      const { writer, timestamp } = context;
      
      const request = state.matchRequests[matchId];
      if (!request) {
        throw new Error('Match request not found');
      }
      
      if (request.requesterId !== writer) {
        throw new Error('Only the request creator can accept proposals');
      }
      
      const proposalKey = `${matchId}-${proposerId}`;
      const proposal = state.matchProposals[proposalKey];
      if (!proposal) {
        throw new Error('Proposal not found');
      }
      
      // Update request status
      const newState = { ...state };
      newState.matchRequests = { ...state.matchRequests };
      newState.matchRequests[matchId] = {
        ...request,
        status: 'accepted',
        acceptedWith: proposerId,
        acceptedAt: timestamp
      };
      
      // Update proposal status
      newState.matchProposals = { ...state.matchProposals };
      newState.matchProposals[proposalKey] = {
        ...proposal,
        status: 'accepted'
      };
      
      // Update agent match counts
      newState.agents = { ...state.agents };
      const requester = newState.agents[writer];
      const proposer = newState.agents[proposerId];
      
      if (requester) {
        newState.agents[writer] = {
          ...requester,
          matchCount: requester.matchCount + 1
        };
      }
      
      if (proposer) {
        newState.agents[proposerId] = {
          ...proposer,
          matchCount: proposer.matchCount + 1
        };
      }
      
      return {
        ...newState,
        _event: {
          type: 'match_accepted',
          matchId,
          requesterId: writer,
          proposerId,
          channel: `match-${matchId}`
        }
      };
    },
    
    /**
     * Complete a match and update reputation
     * @param {Object} state - Current state
     * @param {Object} payload - { matchId, success, rating, feedback }
     * @param {Object} context - { writer, timestamp }
     * @returns {Object} New state
     */
    match_complete(state, payload, context) {
      const { matchId, success = true, rating, feedback } = payload;
      const { writer, timestamp } = context;
      
      const request = state.matchRequests[matchId];
      if (!request) {
        throw new Error('Match request not found');
      }
      
      const newState = { ...state };
      
      // Update request status
      newState.matchRequests = { ...state.matchRequests };
      newState.matchRequests[matchId] = {
        ...request,
        status: 'completed',
        completedAt: timestamp,
        success,
        rating,
        feedback
      };
      
      // Update stats
      newState.stats = { ...state.stats };
      if (success) {
        newState.stats.successfulMatches++;
      }
      
      // Update reputation
      if (rating && request.acceptedWith) {
        newState.reputation = { ...state.reputation };
        const targetId = writer === request.requesterId ? request.acceptedWith : request.requesterId;
        
        if (!newState.reputation[targetId]) {
          newState.reputation[targetId] = {
            totalRatings: 0,
            averageRating: 0,
            ratings: []
          };
        }
        
        const rep = newState.reputation[targetId];
        rep.ratings.push({
          rating,
          from: writer,
          matchId,
          timestamp
        });
        rep.totalRatings++;
        rep.averageRating = rep.ratings.reduce((sum, r) => sum + r.rating, 0) / rep.totalRatings;
        
        // Update agent success count
        if (success && newState.agents[targetId]) {
          newState.agents = { ...state.agents };
          newState.agents[targetId] = {
            ...newState.agents[targetId],
            successCount: newState.agents[targetId].successCount + 1
          };
        }
      }
      
      return {
        ...newState,
        _event: {
          type: 'match_completed',
          matchId,
          success,
          rating
        }
      };
    },
    
    /**
     * Join a channel
     * @param {Object} state - Current state
     * @param {Object} payload - { channelId }
     * @param {Object} context - { writer, timestamp }
     * @returns {Object} New state
     */
    channel_join(state, payload, context) {
      const { channelId } = payload;
      const { writer, timestamp } = context;
      
      const agent = state.agents[writer];
      if (!agent) {
        throw new Error('Agent not registered');
      }
      
      const newState = { ...state };
      newState.channelMembers = { ...state.channelMembers };
      
      if (!newState.channelMembers[channelId]) {
        newState.channelMembers[channelId] = [];
        newState.stats = { ...state.stats };
        newState.stats.totalChannels++;
      }
      
      if (!newState.channelMembers[channelId].includes(writer)) {
        newState.channelMembers[channelId].push(writer);
      }
      
      return {
        ...newState,
        _event: {
          type: 'channel_joined',
          channelId,
          agentId: writer
        }
      };
    },
    
    /**
     * Leave a channel
     * @param {Object} state - Current state
     * @param {Object} payload - { channelId }
     * @param {Object} context - { writer, timestamp }
     * @returns {Object} New state
     */
    channel_leave(state, payload, context) {
      const { channelId } = payload;
      const { writer } = context;
      
      const newState = { ...state };
      newState.channelMembers = { ...state.channelMembers };
      
      if (newState.channelMembers[channelId]) {
        const idx = newState.channelMembers[channelId].indexOf(writer);
        if (idx > -1) {
          newState.channelMembers[channelId].splice(idx, 1);
        }
      }
      
      return {
        ...newState,
        _event: {
          type: 'channel_left',
          channelId,
          agentId: writer
        }
      };
    },
    
    /**
     * Record a message (for stats)
     * @param {Object} state - Current state
     * @param {Object} payload - { channelId }
     * @param {Object} context - { writer, timestamp }
     * @returns {Object} New state
     */
    message_record(state, payload, context) {
      const newState = { ...state };
      newState.stats = { ...state.stats };
      newState.stats.totalMessages++;
      
      return newState;
    }
  }
};
