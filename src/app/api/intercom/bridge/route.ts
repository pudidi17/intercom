import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/intercom/bridge - Get bridge configuration and status
export async function GET() {
  try {
    const onlineAgents = await db.agent.count({
      where: { status: 'online' },
    });

    const activeChannels = await db.channel.count();

    const messageCount = await db.message.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return NextResponse.json({
      bridgeUrl: process.env.INTERCOM_BRIDGE_URL || 'ws://127.0.0.1:49222',
      status: 'available',
      connectedAgents: onlineAgents,
      activeChannels,
      messagesProcessed: messageCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching bridge status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bridge status' },
      { status: 500 }
    );
  }
}

// POST /api/intercom/bridge - Send a message through the bridge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      content: string;
      senderId: string;
      channelId?: string;
      receiverId?: string;
      type?: 'text' | 'command' | 'system';
      metadata?: Record<string, unknown>;
    };

    if (!body.content || !body.senderId) {
      return NextResponse.json(
        { error: 'content and senderId are required' },
        { status: 400 }
      );
    }

    // Create message in database
    const message = await db.message.create({
      data: {
        content: body.content,
        type: body.type || 'text',
        senderId: body.senderId,
        channelId: body.channelId,
        receiverId: body.receiverId,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
      include: {
        sender: true,
        channel: true,
      },
    });

    // In a real implementation, this would forward to the Intercom SC-Bridge
    // For now, we just store in the database

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        sender: message.sender,
        channelId: message.channelId,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET /api/intercom/bridge/messages - Get recent messages
export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const channelId = searchParams.get('channelId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const messages = await db.message.findMany({
      where: {
        ...(channelId && { channelId }),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
