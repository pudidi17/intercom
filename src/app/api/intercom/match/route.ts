import { NextRequest, NextResponse } from 'next/server';
import { matchAgentsToRequirements, suggestCapabilities } from '@/lib/capabilities';

// POST /api/intercom/match - AI-powered agent matching
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      requirements: string;
      context?: string;
    };

    if (!body.requirements) {
      return NextResponse.json(
        { error: 'Requirements are required' },
        { status: 400 }
      );
    }

    const matches = await matchAgentsToRequirements(
      body.requirements,
      body.context
    );

    return NextResponse.json({
      matches,
      total: matches.length,
    });
  } catch (error) {
    console.error('Error matching agents:', error);
    return NextResponse.json(
      { error: 'Failed to match agents' },
      { status: 500 }
    );
  }
}

// GET /api/intercom/match - Suggest capabilities
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const description = searchParams.get('description');

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    const capabilities = await suggestCapabilities(description);

    return NextResponse.json({
      capabilities,
    });
  } catch (error) {
    console.error('Error suggesting capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to suggest capabilities' },
      { status: 500 }
    );
  }
}
