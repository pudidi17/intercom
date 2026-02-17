import { NextRequest, NextResponse } from 'next/server';
import {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  initializeSampleAgents,
} from '@/lib/agents';
import type { CreateAgentRequest, UpdateAgentRequest } from '@/lib/types';

// GET /api/intercom/agents - List all agents
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'online' | 'offline' | 'busy' | null;
    const capability = searchParams.get('capability');
    const id = searchParams.get('id');
    const limit = searchParams.get('limit');

    // Get single agent by ID
    if (id) {
      const agent = await getAgent(id);
      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }
      return NextResponse.json(agent);
    }

    // Get all agents with optional filters
    const agents = await getAgents({
      status: status || undefined,
      capability: capability || undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/intercom/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateAgentRequest;

    if (!body.name) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    const agent = await createAgent(body);
    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}

// PUT /api/intercom/agents - Update an agent
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json() as UpdateAgentRequest;
    const agent = await updateAgent(id, body);

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// DELETE /api/intercom/agents - Delete an agent
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteAgent(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete agent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}

// PATCH /api/intercom/agents - Initialize sample agents
export async function PATCH() {
  try {
    await initializeSampleAgents();
    return NextResponse.json({ success: true, message: 'Sample agents initialized' });
  } catch (error) {
    console.error('Error initializing sample agents:', error);
    return NextResponse.json(
      { error: 'Failed to initialize sample agents' },
      { status: 500 }
    );
  }
}
