import { NextRequest, NextResponse } from 'next/server';
import { discoverAgents } from '@/lib/agents';
import { getCapabilities } from '@/lib/capabilities';
import type { DiscoverRequest, CapabilityCategory } from '@/lib/types';

// POST /api/intercom/discover - Discover agents by capabilities
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DiscoverRequest;

    const result = await discoverAgents({
      capabilities: body.capabilities,
      categories: body.categories,
      minProficiency: body.minProficiency || 0,
      status: body.status,
      limit: body.limit || 20,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error discovering agents:', error);
    return NextResponse.json(
      { error: 'Failed to discover agents' },
      { status: 500 }
    );
  }
}

// GET /api/intercom/discover - Get available capabilities
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as CapabilityCategory | null;
    const search = searchParams.get('search');

    const capabilities = await getCapabilities({
      category: category || undefined,
      search: search || undefined,
    });

    return NextResponse.json(capabilities);
  } catch (error) {
    console.error('Error fetching capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capabilities' },
      { status: 500 }
    );
  }
}
