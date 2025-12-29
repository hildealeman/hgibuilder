
import { Peer, DataConnection } from 'peerjs';
import { Artifact, Message } from '../types';

export type SyncEventType = 'SYNC_STATE' | 'NEW_MESSAGE' | 'CODE_UPDATE' | 'REMOTE_PROMPT';

export interface SyncPayload {
  type: SyncEventType;
  data: any;
}

export interface Collaborator {
  id: string;
  role: 'host' | 'guest';
}

class CollaborationService {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private onDataCallback: ((payload: SyncPayload, connId: string) => void) | null = null;
  private onConnectionCallback: ((count: number) => void) | null = null;
  
  public myId: string | null = null;
  public isHost: boolean = false;

  async initialize(hostId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Initialize Peer
      this.peer = new Peer({
        debug: 1
      });

      this.peer.on('open', (id) => {
        this.myId = id;
        console.log('My Peer ID:', id);

        if (hostId) {
          this.connectToHost(hostId);
          this.isHost = false;
        } else {
          this.isHost = true;
        }
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.handleConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('Peer Error:', err);
        // reject(err); // Don't reject mainly to keep retry logic open if needed
      });
    });
  }

  private connectToHost(hostId: string) {
    if (!this.peer) return;
    const conn = this.peer.connect(hostId);
    this.handleConnection(conn);
  }

  private handleConnection(conn: DataConnection) {
    conn.on('open', () => {
      console.log('Connected to:', conn.peer);
      this.connections.set(conn.peer, conn);
      this.updateConnectionCount();
      
      // If we are host, we might want to sync state immediately in App logic
      // but we wait for App to trigger that based on 'connection' event logic if needed
      // Ideally, the App listens to onConnectionCallback and sends SYNC
    });

    conn.on('data', (data: any) => {
      if (this.onDataCallback) {
        this.onDataCallback(data as SyncPayload, conn.peer);
      }
    });

    conn.on('close', () => {
      console.log('Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      this.updateConnectionCount();
    });
    
    conn.on('error', (err) => {
       console.error("Connection Error", err);
       this.connections.delete(conn.peer);
       this.updateConnectionCount();
    });
  }

  private updateConnectionCount() {
    if (this.onConnectionCallback) {
      this.onConnectionCallback(this.connections.size);
    }
  }

  public broadcast(type: SyncEventType, data: any) {
    const payload: SyncPayload = { type, data };
    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send(payload);
      }
    });
  }

  public sendToHost(type: SyncEventType, data: any) {
    // If guest, we usually only have one connection (to host)
    this.connections.forEach(conn => {
      if (conn.open) {
         conn.send({ type, data });
      }
    });
  }

  public onData(cb: (payload: SyncPayload, connId: string) => void) {
    this.onDataCallback = cb;
  }

  public onConnectionChange(cb: (count: number) => void) {
    this.onConnectionCallback = cb;
  }
  
  public cleanup() {
      this.connections.forEach(c => c.close());
      this.connections.clear();
      if(this.peer) this.peer.destroy();
      this.peer = null;
  }
}

export const collaborationService = new CollaborationService();
