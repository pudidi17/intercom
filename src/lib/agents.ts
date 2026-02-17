import { db } from './db';
import type { 
  Agent, 
  CreateAgentRequest, 
  UpdateAgentRequest,
  DiscoverRequest,
  DiscoverResponse,
  AgentStatus,
} from './types';

// Get all agents with optional filters
export async function getAgents(filters?: {
  status?: AgentStatus;
  capability?: string;
  limit?: number;
}): Promise<Agent[]> {
  const agents = await db.agent.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.capability && {
        capabilities: {
          some: {
            capability: {
              name: {
                contains: filters.capability,
                mode: 'insensitive',
              },
            },
          },
        },
      }),
    },
    include: {
      capabilities: {
        include: {
          capability: true,
        },
      },
    },
    take: filters?.limit || 50,
    orderBy: { createdAt: 'desc' },
  });

  return agents.map(agent => ({
    ...agent,
    metadata: agent.metadata ? JSON.parse(agent.metadata) : null,
    capabilities: agent.capabilities.map(ac => ({
      ...ac,
      capability: ac.capability,
    })),
  })) as Agent[];
}

// Get a single agent by ID
export async function getAgent(id: string): Promise<Agent | null> {
  const agent = await db.agent.findUnique({
    where: { id },
    include: {
      capabilities: {
        include: {
          capability: true,
        },
      },
      channels: {
        include: {
          channel: true,
        },
      },
    },
  });

  if (!agent) return null;

  return {
    ...agent,
    metadata: agent.metadata ? JSON.parse(agent.metadata) : null,
    capabilities: agent.capabilities.map(ac => ({
      ...ac,
      capability: ac.capability,
    })),
  } as Agent;
}

// Create a new agent
export async function createAgent(data: CreateAgentRequest): Promise<Agent> {
  // First, ensure capabilities exist
  const capabilityNames = data.capabilities?.map(c => c.name) || [];
  
  // Create capabilities if they don't exist
  if (capabilityNames.length > 0) {
    await Promise.all(
      capabilityNames.map(name =>
        db.capability.upsert({
          where: { name },
          update: {},
          create: {
            name,
            category: guessCategory(name),
          },
        })
      )
    );
  }

  const agent = await db.agent.create({
    data: {
      name: data.name,
      description: data.description,
      avatar: data.avatar,
      protocol: data.protocol || 'intercom',
      endpoint: data.endpoint,
      status: 'offline',
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      capabilities: data.capabilities
        ? {
            create: data.capabilities.map(c => ({
              capability: {
                connect: { name: c.name },
              },
              proficiency: c.proficiency || 0.5,
              certified: c.certified || false,
            })),
          }
        : undefined,
    },
    include: {
      capabilities: {
        include: {
          capability: true,
        },
      },
    },
  });

  return {
    ...agent,
    metadata: agent.metadata ? JSON.parse(agent.metadata) : null,
    capabilities: agent.capabilities.map(ac => ({
      ...ac,
      capability: ac.capability,
    })),
  } as Agent;
}

// Update an agent
export async function updateAgent(id: string, data: UpdateAgentRequest): Promise<Agent | null> {
  // Handle capability updates
  if (data.capabilities) {
    // Remove existing capabilities
    await db.agentCapability.deleteMany({
      where: { agentId: id },
    });

    // Ensure capabilities exist
    await Promise.all(
      data.capabilities.map(c =>
        db.capability.upsert({
          where: { name: c.name },
          update: {},
          create: {
            name: c.name,
            category: guessCategory(c.name),
          },
        })
      )
    );

    // Create new capabilities
    await db.agentCapability.createMany({
      data: data.capabilities.map(c => ({
        agentId: id,
        capabilityName: c.name,
        proficiency: c.proficiency || 0.5,
        certified: c.certified || false,
      })),
    });
  }

  const agent = await db.agent.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
      ...(data.status && { status: data.status }),
      ...(data.protocol && { protocol: data.protocol }),
      ...(data.endpoint !== undefined && { endpoint: data.endpoint }),
      ...(data.metadata && { metadata: JSON.stringify(data.metadata) }),
    },
    include: {
      capabilities: {
        include: {
          capability: true,
        },
      },
    },
  });

  return {
    ...agent,
    metadata: agent.metadata ? JSON.parse(agent.metadata) : null,
    capabilities: agent.capabilities.map(ac => ({
      ...ac,
      capability: ac.capability,
    })),
  } as Agent;
}

// Delete an agent
export async function deleteAgent(id: string): Promise<boolean> {
  try {
    await db.agent.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

// Discover agents by capabilities
export async function discoverAgents(request: DiscoverRequest): Promise<DiscoverResponse> {
  const { capabilities = [], categories, minProficiency = 0, status, limit = 20 } = request;

  const agents = await db.agent.findMany({
    where: {
      ...(status && { status }),
      ...(capabilities.length > 0 && {
        capabilities: {
          some: {
            proficiency: { gte: minProficiency },
            capability: {
              name: { in: capabilities },
              ...(categories && { category: { in: categories } }),
            },
          },
        },
      }),
      ...(capabilities.length === 0 && categories && {
        capabilities: {
          some: {
            proficiency: { gte: minProficiency },
            capability: {
              category: { in: categories },
            },
          },
        },
      }),
    },
    include: {
      capabilities: {
        include: {
          capability: true,
        },
      },
    },
    take: limit,
  });

  const results = agents.map(agent => {
    const matchedCapabilities = agent.capabilities
      .filter(ac => {
        const matchesCapability = capabilities.length === 0 || capabilities.includes(ac.capability.name);
        const matchesProficiency = ac.proficiency >= minProficiency;
        const matchesCategory = !categories || categories.includes(ac.capability.category as any);
        return matchesCapability && matchesProficiency && matchesCategory;
      })
      .map(ac => ac.capability.name);

    // Calculate match score based on capability matches
    const matchScore = capabilities.length > 0
      ? matchedCapabilities.length / capabilities.length
      : 1;

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description || undefined,
      status: agent.status as AgentStatus,
      matchedCapabilities,
      matchScore,
    };
  });

  // Sort by match score descending
  results.sort((a, b) => b.matchScore - a.matchScore);

  return {
    agents: results,
    total: results.length,
  };
}

// Update agent status
export async function updateAgentStatus(id: string, status: AgentStatus): Promise<boolean> {
  try {
    await db.agent.update({
      where: { id },
      data: { status },
    });
    return true;
  } catch {
    return false;
  }
}

// Get agent statistics
export async function getAgentStats(): Promise<{
  total: number;
  online: number;
  offline: number;
  busy: number;
}> {
  const [total, online, offline, busy] = await Promise.all([
    db.agent.count(),
    db.agent.count({ where: { status: 'online' } }),
    db.agent.count({ where: { status: 'offline' } }),
    db.agent.count({ where: { status: 'busy' } }),
  ]);

  return { total, online, offline, busy };
}

// Helper function to guess capability category
function guessCategory(capabilityName: string): string {
  const name = capabilityName.toLowerCase();
  
  if (name.includes('analy') || name.includes('process') || name.includes('evaluate')) {
    return 'analysis';
  }
  if (name.includes('generat') || name.includes('create') || name.includes('write')) {
    return 'generation';
  }
  if (name.includes('communicat') || name.includes('chat') || name.includes('message')) {
    return 'communication';
  }
  if (name.includes('reason') || name.includes('think') || name.includes('logic')) {
    return 'reasoning';
  }
  if (name.includes('act') || name.includes('execute') || name.includes('perform')) {
    return 'action';
  }
  if (name.includes('image') || name.includes('audio') || name.includes('video') || name.includes('multimodal')) {
    return 'multimodal';
  }
  
  return 'analysis'; // default
}

// Initialize with sample agents for demo
export async function initializeSampleAgents(): Promise<void> {
  const existingAgents = await db.agent.count();
  if (existingAgents > 0) return;

  const sampleAgents: CreateAgentRequest[] = [
    {
      name: 'Analyst Pro',
      description: 'Expert data analyst specializing in pattern recognition and insights generation',
      protocol: 'intercom',
      capabilities: [
        { name: 'data-analysis', proficiency: 0.95, certified: true },
        { name: 'pattern-recognition', proficiency: 0.9, certified: true },
        { name: 'report-generation', proficiency: 0.85, certified: false },
      ],
    },
    {
      name: 'Creative Writer',
      description: 'AI writing assistant for content creation and storytelling',
      protocol: 'openai',
      capabilities: [
        { name: 'content-generation', proficiency: 0.92, certified: true },
        { name: 'storytelling', proficiency: 0.88, certified: true },
        { name: 'editing', proficiency: 0.8, certified: false },
      ],
    },
    {
      name: 'Code Assistant',
      description: 'Full-stack development helper with expertise in multiple languages',
      protocol: 'anthropic',
      capabilities: [
        { name: 'code-generation', proficiency: 0.95, certified: true },
        { name: 'debugging', proficiency: 0.9, certified: true },
        { name: 'code-review', proficiency: 0.85, certified: true },
        { name: 'documentation', proficiency: 0.8, certified: false },
      ],
    },
    {
      name: 'Research Bot',
      description: 'Information gatherer and knowledge synthesizer',
      protocol: 'intercom',
      capabilities: [
        { name: 'web-search', proficiency: 0.9, certified: true },
        { name: 'summarization', proficiency: 0.88, certified: true },
        { name: 'fact-checking', proficiency: 0.85, certified: false },
      ],
    },
    {
      name: 'Visual Designer',
      description: 'Image generation and visual content creation specialist',
      protocol: 'intercom',
      capabilities: [
        { name: 'image-generation', proficiency: 0.93, certified: true },
        { name: 'style-transfer', proficiency: 0.85, certified: false },
        { name: 'image-editing', proficiency: 0.8, certified: false },
      ],
    },
    {
      name: 'Orchestrator',
      description: 'Multi-agent coordinator and workflow manager',
      protocol: 'intercom',
      capabilities: [
        { name: 'task-routing', proficiency: 0.9, certified: true },
        { name: 'multi-agent-coordination', proficiency: 0.88, certified: true },
        { name: 'workflow-management', proficiency: 0.85, certified: true },
      ],
    },
  ];

  for (const agent of sampleAgents) {
    await createAgent(agent);
  }

  // Set some agents to online status
  const allAgents = await db.agent.findMany();
  for (let i = 0; i < Math.min(4, allAgents.length); i++) {
    await db.agent.update({
      where: { id: allAgents[i].id },
      data: { status: 'online' },
    });
  }
}
