/**
 * AgentBridge Library
 * Core functionality for AgentBridge on Intercom/Trac Network
 */

class AgentBridge {
  constructor (options = {}) {
    this.options = {
      subnetChannel: options.subnetChannel || 'agentbridge',
      peerStoreName: options.peerStoreName || 'agentbridge-peer',
      msbStoreName: options.msbStoreName || 'agentbridge-msb',
      scBridge: options.scBridge !== false,
      scBridgePort: options.scBridgePort || 49222,
      sidechannels: options.sidechannels || ['agentbridge-main', 'agentbridge-discover', 'agentbridge-match'],
      ...options
    }
    
    this.state = {
      agents: new Map(),
      channels: new Map(),
      matchRequests: new Map(),
      matchProposals: new Map(),
      reputation: new Map()
    }
    
    this.stats = {
      totalAgents: 0,
      onlineAgents: 0,
      totalChannels: 0,
      activeChannels: 0,
      messagesProcessed: 0,
      successfulMatches: 0
    }
    
    this.started = false
    this.connections = new Set()
  }
  
  async start () {
    if (this.started) return
    
    console.log('[AgentBridge] Initializing...')
    console.log('[AgentBridge] Subnet channel:', this.options.subnetChannel)
    console.log('[AgentBridge] SC-Bridge enabled:', this.options.scBridge)
    console.log('[AgentBridge] SC-Bridge port:', this.options.scBridgePort)
    console.log('[AgentBridge] Sidechannels:', this.options.sidechannels.join(', '))
    
    this.started = true
    
    if (this.options.scBridge) {
      await this.startSCBridge()
    }
    
    console.log('[AgentBridge] Ready for agent connections')
  }
  
  async stop () {
    if (!this.started) return
    
    for (const conn of this.connections) {
      try { conn.close() } catch (e) {}
    }
    this.connections.clear()
    
    this.started = false
    console.log('[AgentBridge] Stopped')
  }
  
  async startSCBridge () {
    console.log('[AgentBridge] SC-Bridge starting on port', this.options.scBridgePort)
  }
  
  registerAgent (agentData) {
    const { name, description, capabilities = [], protocol = 'intercom', visibility = 'public', endpoint } = agentData
    
    if (!name) throw new Error('Agent name is required')
    
    for (const [id, agent] of this.state.agents) {
      if (agent.name === name) throw new Error('Agent name already registered')
    }
    
    const agentId = this.generateId()
    const timestamp = Date.now()
    
    const agent = {
      id: agentId,
      name,
      description: description || '',
      capabilities: capabilities.map(cap => ({
        name: cap.name,
        proficiency: Math.min(1, Math.max(0, cap.proficiency || 0.5)),
        certified: cap.certified || false
      })),
      protocol,
      visibility,
      endpoint: endpoint || null,
      status: 'online',
      createdAt: timestamp,
      updatedAt: timestamp,
      matchCount: 0,
      successCount: 0
    }
    
    this.state.agents.set(agentId, agent)
    this.stats.totalAgents++
    this.stats.onlineAgents++
    
    console.log('[AgentBridge] Agent registered:', name, '(' + agentId + ')')
    
    return { agentId, agent }
  }
  
  updateAgent (agentId, updates) {
    const agent = this.state.agents.get(agentId)
    if (!agent) throw new Error('Agent not found')
    
    if (updates.status && ['online', 'offline', 'busy'].includes(updates.status)) {
      if (agent.status === 'online' && updates.status !== 'online') this.stats.onlineAgents--
      else if (agent.status !== 'online' && updates.status === 'online') this.stats.onlineAgents++
      agent.status = updates.status
    }
    
    if (updates.capabilities) {
      agent.capabilities = updates.capabilities.map(cap => ({
        name: cap.name,
        proficiency: Math.min(1, Math.max(0, cap.proficiency || 0.5)),
        certified: cap.certified || false
      }))
    }
    
    if (updates.visibility) agent.visibility = updates.visibility
    if (updates.endpoint !== undefined) agent.endpoint = updates.endpoint
    
    agent.updatedAt = Date.now()
    return agent
  }
  
  unregisterAgent (agentId) {
    const agent = this.state.agents.get(agentId)
    if (!agent) throw new Error('Agent not found')
    
    if (agent.status === 'online') this.stats.onlineAgents--
    this.state.agents.delete(agentId)
    this.stats.totalAgents--
    
    return true
  }
  
  getAgent (agentId) {
    return this.state.agents.get(agentId) || null
  }
  
  getAgents (filter = {}) {
    let agents = Array.from(this.state.agents.values())
    if (filter.status) agents = agents.filter(a => a.status === filter.status)
    if (filter.visibility !== 'private') agents = agents.filter(a => a.visibility === 'public')
    if (filter.limit) agents = agents.slice(0, filter.limit)
    return agents
  }
  
  discoverAgents (query = {}) {
    const { capabilities = [], minProficiency = 0, status, limit = 20 } = query
    
    let agents = Array.from(this.state.agents.values()).filter(a => a.visibility === 'public')
    if (status) agents = agents.filter(a => a.status === status)
    
    const results = agents.map(agent => {
      const matchedCapabilities = []
      let totalScore = 0
      
      for (const cap of agent.capabilities) {
        if (capabilities.includes(cap.name) && cap.proficiency >= minProficiency) {
          matchedCapabilities.push(cap.name)
          totalScore += cap.proficiency
        }
      }
      
      const matchScore = capabilities.length > 0 
        ? totalScore / capabilities.length 
        : (matchedCapabilities.length > 0 ? 0.5 : 0)
      
      return {
        id: agent.id, name: agent.name, description: agent.description,
        status: agent.status, protocol: agent.protocol,
        matchedCapabilities, matchScore,
        reputation: this.state.reputation.get(agent.id) || null
      }
    })
    
    const filtered = results.filter(r => capabilities.length === 0 || r.matchedCapabilities.length > 0)
    filtered.sort((a, b) => b.matchScore - a.matchScore)
    
    return { agents: filtered.slice(0, limit), total: filtered.length }
  }
  
  createMatchRequest (requestData) {
    const { requiredCapabilities = [], minScore = 0.5, taskDescription, ttl = 300, preferredProtocols = [], requesterId } = requestData
    if (requiredCapabilities.length === 0) throw new Error('At least one required capability is needed')
    
    const matchId = 'match-' + this.generateId()
    const request = {
      id: matchId, requesterId, requiredCapabilities, minScore,
      taskDescription: taskDescription || '', preferredProtocols,
      expiresAt: Date.now() + (ttl * 1000),
      createdAt: Date.now(), status: 'pending'
    }
    
    this.state.matchRequests.set(matchId, request)
    return request
  }
  
  acceptMatch (matchId, proposerId) {
    const request = this.state.matchRequests.get(matchId)
    if (!request) throw new Error('Match request not found')
    
    request.status = 'accepted'
    request.acceptedWith = proposerId
    request.acceptedAt = Date.now()
    
    const requester = this.state.agents.get(request.requesterId)
    const proposer = this.state.agents.get(proposerId)
    if (requester) requester.matchCount++
    if (proposer) proposer.matchCount++
    
    this.stats.successfulMatches++
    
    return { matchId, channelId: 'match-' + matchId, status: 'accepted' }
  }
  
  getStats () {
    return { ...this.stats }
  }
  
  generateId () {
    return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  }
}

module.exports = { AgentBridge }
