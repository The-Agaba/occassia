import { Client } from '@stomp/stompjs';
import type { IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/authStore';

const websocketUrl = import.meta.env.VITE_WS_URL || '/ws';

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

type ConnectionStateListener = (state: ConnectionState) => void;

class WebSocketManager {
  private client: Client | null = null;
  private state: ConnectionState = 'DISCONNECTED';
  private stateListeners: Set<ConnectionStateListener> = new Set();
  private reconnectAttempt = 0;
  private maxReconnectDelay = 30000;
  private baseReconnectDelay = 2000;

  constructor() {}

  public connect() {
    if (this.client && this.client.active) return;
    
    this.updateState(this.reconnectAttempt > 0 ? 'RECONNECTING' : 'CONNECTING');

    this.client = new Client({
      webSocketFactory: () => new SockJS(websocketUrl),
      // STOMP native reconnect can be used, but we'll do exponential backoff manually
      // if we want full control, or let STOMP do it and just track state.
      // We'll let STOMP do it but dynamically adjust reconnectDelay.
      reconnectDelay: this.calculateBackoff(),
      beforeConnect: () => {
        const token = useAuthStore.getState().token;
        if (token && this.client) {
          this.client.connectHeaders = { Authorization: `Bearer ${token}` };
        }
      },
      onConnect: () => {
        this.reconnectAttempt = 0;
        this.client!.reconnectDelay = this.baseReconnectDelay;
        this.updateState('CONNECTED');
      },
      onWebSocketClose: () => {
        if (this.state !== 'DISCONNECTED') {
          this.reconnectAttempt++;
          if (this.client) {
            this.client.reconnectDelay = this.calculateBackoff();
          }
          this.updateState('RECONNECTING');
        }
      },
      onWebSocketError: () => {
        if (this.state !== 'DISCONNECTED') {
          this.updateState('RECONNECTING');
        }
      },
    });

    this.client.activate();
  }

  public disconnect() {
    this.updateState('DISCONNECTED');
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }

  public subscribe(destination: string, callback: (message: IMessage) => void): StompSubscription | null {
    if (this.client && this.client.connected) {
      return this.client.subscribe(destination, callback);
    }
    return null;
  }

  public onStateChange(listener: ConnectionStateListener) {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  public getState() {
    return this.state;
  }

  public getClient() {
    return this.client;
  }

  private updateState(newState: ConnectionState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateListeners.forEach((l) => l(newState));
    }
  }

  private calculateBackoff() {
    const delay = this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempt);
    return Math.min(delay, this.maxReconnectDelay);
  }
}

export const wsManager = new WebSocketManager();

// Keep backward compatibility for other places if they use disconnectWebSocket
export function disconnectWebSocket() {
  wsManager.disconnect();
}
