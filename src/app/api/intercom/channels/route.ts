import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { ChannelType } from '@/lib/types';

// GET /api/intercom/channels - List all channels
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type') as ChannelType | null;

    // Get single channel by ID
    if (id) {
      const channel = await db.channel.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              agent: true,
            },
          },
          messages: {
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: true,
            },
          },
        },
      });

      if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
      }

      return NextResponse.json(channel);
    }

    // Get all channels
    const channels = await db.channel.findMany({
      where: {
        ...(type && { type }),
      },
      include: {
        _count: {
          select: { members: true, messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

// POST /api/intercom/channels - Create a new channel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name: string;
      description?: string;
      type?: ChannelType;
      memberIds?: string[];
    };

    if (!body.name) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    // Generate a unique channel ID for Intercom
    const channelId = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const channel = await db.channel.create({
      data: {
        name: body.name,
        description: body.description,
        type: body.type || 'public',
        channelId,
        members: body.memberIds
          ? {
              create: body.memberIds.map(agentId => ({
                agentId,
                role: 'member' as const,
              })),
            }
          : undefined,
      },
      include: {
        members: {
          include: {
            agent: true,
          },
        },
      },
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}

// PUT /api/intercom/channels - Update a channel
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json() as {
      name?: string;
      description?: string;
      type?: ChannelType;
    };

    const channel = await db.channel.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type && { type: body.type }),
      },
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error('Error updating channel:', error);
    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    );
  }
}

// DELETE /api/intercom/channels - Delete a channel
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      );
    }

    await db.channel.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting channel:', error);
    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    );
  }
}

// PATCH /api/intercom/channels - Join/Leave channel
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json() as {
      channelId: string;
      agentId: string;
      action: 'join' | 'leave';
    };

    if (!body.channelId || !body.agentId || !body.action) {
      return NextResponse.json(
        { error: 'channelId, agentId, and action are required' },
        { status: 400 }
      );
    }

    if (body.action === 'join') {
      const member = await db.channelMember.create({
        data: {
          channelId: body.channelId,
          agentId: body.agentId,
          role: 'member',
        },
        include: {
          agent: true,
          channel: true,
        },
      });
      return NextResponse.json(member);
    } else {
      await db.channelMember.delete({
        where: {
          agentId_channelId: {
            agentId: body.agentId,
            channelId: body.channelId,
          },
        },
      });
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error updating channel membership:', error);
    return NextResponse.json(
      { error: 'Failed to update channel membership' },
      { status: 500 }
    );
  }
}
