/**
 * Simple gossip protocol for GROSIK
 * Enables peer-to-peer communication between nodes
 */

import type { Peer, NetworkMessage, Block } from './types';

export class GossipProtocol {
  private peers: Map<string, Peer> = new Map();
  private nodeId: string;
  private port: number;
  private messageHandlers: Map<string, (message: NetworkMessage) => void> = new Map();
  private seenMessages: Set<string> = new Set();

  constructor(nodeId: string, port: number) {
    this.nodeId = nodeId;
    this.port = port;
  }

  /**
   * Add a peer to the network
   */
  addPeer(peer: Peer): void {
    this.peers.set(peer.id, peer);
    console.log(`Added peer: ${peer.id} at ${peer.address}:${peer.port}`);
  }

  /**
   * Remove a peer from the network
   */
  removePeer(peerId: string): void {
    this.peers.delete(peerId);
    console.log(`Removed peer: ${peerId}`);
  }

  /**
   * Get all peers
   */
  getPeers(): Peer[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get peer count
   */
  getPeerCount(): number {
    return this.peers.size;
  }

  /**
   * Register a message handler for a specific message type
   */
  on(messageType: string, handler: (message: NetworkMessage) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Send a message to a peer over HTTP
   */
  private async sendToPeer(peer: Peer, message: NetworkMessage): Promise<void> {
    try {
      const url = `http://${peer.address}:${peer.port}/gossip`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
      // Peer might be unreachable, log but don't crash
      console.log(`Failed to send ${message.type} to peer ${peer.id.substring(0, 16)}...: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Broadcast a message to all peers
   */
  broadcast(message: NetworkMessage): void {
    const messageId = this.getMessageId(message);
    
    // Avoid rebroadcasting seen messages
    if (this.seenMessages.has(messageId)) {
      return;
    }

    this.seenMessages.add(messageId);
    
    // Clean up old messages (keep only last 1000)
    if (this.seenMessages.size > 1000) {
      const messagesToDelete = Array.from(this.seenMessages).slice(0, 100);
      messagesToDelete.forEach(id => this.seenMessages.delete(id));
    }

    console.log(`Broadcasting ${message.type} message to ${this.peers.size} peers`);
    
    // Actually send the message over HTTP to each peer
    this.peers.forEach(peer => {
      this.sendToPeer(peer, message);
    });
  }

  /**
   * Handle incoming message
   */
  handleMessage(message: NetworkMessage): void {
    const messageId = this.getMessageId(message);
    
    // Check if we've already seen this message
    if (this.seenMessages.has(messageId)) {
      return;
    }

    this.seenMessages.add(messageId);

    // Call registered handler
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }

    // Rebroadcast to other peers (gossip)
    this.broadcast(message);
  }

  /**
   * Generate a unique message ID
   */
  private getMessageId(message: NetworkMessage): string {
    return `${message.type}-${message.sender}-${message.timestamp}`;
  }

  /**
   * Broadcast a new block
   */
  broadcastBlock(block: Block): void {
    const message: NetworkMessage = {
      type: 'BLOCK',
      payload: block,
      sender: this.nodeId,
      timestamp: Date.now()
    };
    this.broadcast(message);
  }

  /**
   * Request peers from known peers (peer discovery)
   */
  discoverPeers(): void {
    const message: NetworkMessage = {
      type: 'PEER_DISCOVERY',
      payload: {
        id: this.nodeId,
        port: this.port
      },
      sender: this.nodeId,
      timestamp: Date.now()
    };
    this.broadcast(message);
  }

  /**
   * Clean up stale peers
   */
  cleanupStalePeers(maxAge: number = 300000): void {
    const now = Date.now();
    const staleIds: string[] = [];

    this.peers.forEach((peer, id) => {
      if (now - peer.lastSeen > maxAge) {
        staleIds.push(id);
      }
    });

    staleIds.forEach(id => this.removePeer(id));
  }

  /**
   * Update peer's last seen timestamp
   */
  updatePeerLastSeen(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.lastSeen = Date.now();
    }
  }

  /**
   * Get node ID
   */
  getNodeId(): string {
    return this.nodeId;
  }

  /**
   * Get port
   */
  getPort(): number {
    return this.port;
  }
}
