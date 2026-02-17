import type {
  ConnectionState,
  IntercomMessage,
  IntercomMessageType,
  IntercomAuthRequest,
  IntercomAuthResponse,
  IntercomSidechannelMessage,
  IntercomSidechannelEvent,
} from './types';

// Intercom SC-Bridge configuration
const INTERCOM_BRIDGE_URL = process.env.INTERCOM_BRIDGE_URL || 'ws://127.0.0.1:49222';
const RECONNECT_INTERVAL = 5000;
const HEARTBEAT_INTERVAL = 30000;

export type MessageHandler = (message: IntercomMessage) => void;
export type StateHandler = (state: ConnectionState) => void;

export class IntercomClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private agentId: string | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private stateHandlers: Set<StateHandler> = new Set();
  private _state: ConnectionState = 'disconnected';
  private messageQueue: IntercomMessage[] = [];

  constructor(token: string, url?: string) {
    this.token = token;
    this.url = url || INTERCOM_BRIDGE_URL;
  }

  get state(): ConnectionState {
    return this._state;
  }

  private setState(newState: ConnectionState): void {
    this._state = newState;
    this.stateHandlers.forEach(handler => handler(newState));
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.setState('connecting');
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[Intercom] WebSocket connected');
          this.authenticate();
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as IntercomMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('[Intercom] Failed to parse message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[Intercom] WebSocket closed:', event.code, event.reason);
          this.setState('disconnected');
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[Intercom] WebSocket error:', error);
          this.setState('error');
          reject(error);
        };
      } catch (error) {
        this.setState('error');
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState('disconnected');
  }

  private authenticate(): void {
    const authRequest: IntercomAuthRequest = {
      type: 'auth_request',
      payload: {
        token: this.token,
        agentId: this.agentId || undefined,
      },
    };
    this.send(authRequest);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'heartbeat', payload: {} });
    }, HEARTBEAT_INTERVAL);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(console.error);
    }, RECONNECT_INTERVAL);
  }

  private handleMessage(message: IntercomMessage): void {
    switch (message.type) {
      case 'auth_response':
        this.handleAuthResponse(message as IntercomAuthResponse);
        break;
      case 'sidechannel_message':
        this.handleSidechannelMessage(message as IntercomSidechannelMessage);
        break;
      case 'sidechannel_event':
        this.handleSidechannelEvent(message as IntercomSidechannelEvent);
        break;
    }
    this.messageHandlers.forEach(handler => handler(message));
  }

  private handleAuthResponse(response: IntercomAuthResponse): void {
    if (response.payload.success) {
      this.agentId = response.payload.agentId || null;
      this.setState('connected');
      // Send queued messages
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        if (msg) this.send(msg);
      }
    } else {
      console.error('[Intercom] Authentication failed:', response.payload.error);
      this.setState('error');
    }
  }

  private handleSidechannelMessage(message: IntercomSidechannelMessage): void {
    console.log('[Intercom] Sidechannel message:', message.payload);
  }

  private handleSidechannelEvent(event: IntercomSidechannelEvent): void {
    console.log('[Intercom] Sidechannel event:', event.payload);
  }

  send(message: IntercomMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(message);
      return;
    }
    this.ws.send(JSON.stringify({
      ...message,
      timestamp: Date.now(),
    }));
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStateChange(handler: StateHandler): () => void {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  // Sidechannel operations
  createChannel(name: string, description?: string): void {
    this.send({
      type: 'sidechannel_create',
      payload: { name, description },
    });
  }

  joinChannel(channelId: string): void {
    this.send({
      type: 'sidechannel_join',
      payload: { channelId },
    });
  }

  leaveChannel(channelId: string): void {
    this.send({
      type: 'sidechannel_leave',
      payload: { channelId },
    });
  }

  sendChannelMessage(channelId: string, content: string, metadata?: Record<string, unknown>): void {
    this.send({
      type: 'sidechannel_message',
      payload: {
        channelId,
        content,
        senderId: this.agentId,
        metadata,
      },
    });
  }

  // Discovery operations
  queryCapabilities(capabilities: string[]): void {
    this.send({
      type: 'capability_query',
      payload: { capabilities },
    });
  }

  discoverAgents(criteria: Record<string, unknown>): void {
    this.send({
      type: 'discover_request',
      payload: criteria,
    });
  }
}

// Singleton instance for server-side use
let clientInstance: IntercomClient | null = null;

export function getIntercomClient(token?: string): IntercomClient {
  if (!clientInstance && token) {
    clientInstance = new IntercomClient(token);
  }
  if (!clientInstance) {
    throw new Error('Intercom client not initialized. Provide a token.');
  }
  return clientInstance;
}

export function initializeIntercomClient(token: string): IntercomClient {
  if (clientInstance) {
    clientInstance.disconnect();
  }
  clientInstance = new IntercomClient(token);
  return clientInstance;
}
