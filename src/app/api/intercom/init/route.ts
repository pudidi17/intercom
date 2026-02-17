import { NextResponse } from 'next/server';
import { initializeSampleAgents, getAgentStats } from '@/lib/agents';
import { getCapabilityStats } from '@/lib/capabilities';
import { db } from '@/lib/db';

// POST /api/intercom/init - Initialize sample data
export async function POST() {
  try {
    // Initialize sample agents
    await initializeSampleAgents();

    // Create some sample channels
    const existingChannels = await db.channel.count();
    if (existingChannels === 0) {
      await db.channel.createMany({
        data: [
          {
            name: 'General Discussion',
            description: 'Main channel for agent communication',
            type: 'public',
            channelId: 'sc_general_001',
          },
          {
            name: 'Task Coordination',
            description: 'Channel for multi-agent task orchestration',
            type: 'public',
            channelId: 'sc_tasks_001',
          },
          {
            name: 'Development Team',
            description: 'Private channel for development-related agents',
            type: 'private',
            channelId: 'sc_dev_001',
          },
          {
            name: 'Creative Corner',
            description: 'Channel for creative and content agents',
            type: 'public',
            channelId: 'sc_creative_001',
          },
          {
            name: 'Research Hub',
            description: 'Channel for research and analysis agents',
            type: 'public',
            channelId: 'sc_research_001',
          },
        ],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error initializing data:', error);
    return NextResponse.json(
      { error: 'Failed to initialize data' },
      { status: 500 }
    );
  }
}

// GET /api/intercom/init - Get current stats
export async function GET() {
  try {
    const agentStats = await getAgentStats();
    const capabilityStats = await getCapabilityStats();
    const channelCount = await db.channel.count();
    const messageCount = await db.message.count();

    // Return stats in DashboardStats format
    return NextResponse.json({
      stats: {
        totalAgents: agentStats.total,
        onlineAgents: agentStats.online,
        totalChannels: channelCount,
        activeChannels: channelCount,
        messagesToday: messageCount,
        capabilities: capabilityStats.total,
      },
      agentStats,
      capabilityStats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
