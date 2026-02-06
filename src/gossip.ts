/**
 * libp2p-based gossip protocol for GROSIK
 * Enables peer-to-peer communication between nodes using libp2p gossipsub
 */

import { createLibp2p, type Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { mplex } from '@libp2p/mplex';
import { yamux } from '@libp2p/yamux';
import { noise } from '@libp2p/noise';
import { gossipsub } from '@libp2p/gossipsub';
import { identify } from '@libp2p/identify';
import { kadDHT } from '@libp2p/kad-dht';
import { ping } from '@libp2p/ping';
import { mdns } from '@libp2p/mdns';
import type { Message } from '@libp2p/interface';
import { multiaddr } from '@multiformats/multiaddr';
import type { Peer, NetworkMessage, Block } from './types';

export class GossipProtocol {
  private libp2p?: Libp2p;
  private peers: Map<string, Peer> = new Map();
  private nodeId: string;
  private port: number;
  private messageHandlers: Map<string, (message: NetworkMessage) => void> = new Map();
  private seenMessages: Set<string> = new Set();
  private started: boolean = false;
  private topics: string[] = [
    '/grosik/block',
    '/grosik/transaction',
    '/grosik/peer-discovery',
    '/grosik/stake-update'
  ];

  constructor(nodeId: string, port: number) {
    this.nodeId = nodeId;
    this.port = port;
  }

  /**
   * Start the libp2p node
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    // Create libp2p node
    this.libp2p = await createLibp2p({
      addresses: {
        listen: [`/ip4/0.0.0.0/tcp/${this.port}`]
      },
      transports: [tcp()],
      streamMuxers: [mplex(), yamux()],
      connectionEncryption: [noise()],
      peerDiscovery: [
        mdns({
          interval: 1000  // Check for peers every second
        })
      ],
      services: {
        pubsub: gossipsub({
          emitSelf: false,
          allowPublishToZeroTopicPeers: true
        }),
        identify: identify(),
        dht: kadDHT(),
        ping: ping()
      }
    });

    await this.libp2p.start();
    this.started = true;

    // Subscribe to all topics
    for (const topic of this.topics) {
      this.libp2p.services.pubsub.subscribe(topic);
    }

    // Handle incoming messages
    this.libp2p.services.pubsub.addEventListener('message', (evt: CustomEvent<Message>) => {
      this.handlePubsubMessage(evt.detail);
    });

    // Track peer connections
    this.libp2p.addEventListener('peer:connect', (evt) => {
      const peerId = evt.detail.toString();
      console.log(`✅ Peer connected: ${peerId}`);
    });

    this.libp2p.addEventListener('peer:disconnect', (evt) => {
      const peerId = evt.detail.toString();
      console.log(`❌ Peer disconnected: ${peerId}`);
    });

    // Listen for peer discovery events and dial them
    this.libp2p.addEventListener('peer:discovery', async (evt) => {
      const peerId = evt.detail.id.toString();
      const multiaddrs = evt.detail.multiaddrs;
      console.log(`🔍 Peer discovered: ${peerId}`);
      console.log(`   Multiaddrs: ${multiaddrs.map(ma => ma.toString()).join(', ')}`);
      
      // Attempt to dial the discovered peer
      try {
        console.log(`   Dialing discovered peer...`);
        await this.libp2p?.dial(evt.detail.id);
        console.log(`   ✅ Successfully connected to discovered peer`);
      } catch (error) {
        console.log(`   Could not connect: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    console.log(`\nlibp2p node started!`);
    console.log(`Peer ID: ${this.libp2p.peerId.toString()}`);
    console.log(`\nListening on:`);
    this.libp2p.getMultiaddrs().forEach(addr => {
      console.log(`  ${addr.toString()}`);
    });
    console.log(`\n💡 To connect another node to this one, use:`);
    console.log(`   --peer localhost:${this.port - 1000}\n`);
  }

  /**
   * Stop the libp2p node
   */
  async stop(): Promise<void> {
    if (this.libp2p) {
      await this.libp2p.stop();
      this.started = false;
      console.log('libp2p node stopped');
    }
  }

  /**
   * Handle incoming pubsub messages
   */
  private handlePubsubMessage(message: Message): void {
    try {
      const data = new TextDecoder().decode(message.data);
      const networkMessage: NetworkMessage = JSON.parse(data);
      this.handleMessage(networkMessage);
    } catch (error) {
      console.error('Error handling pubsub message:', error);
    }
  }

  /**
   * Add a peer to the network (for compatibility with old API)
   * Note: With libp2p, peers are discovered automatically through gossipsub and DHT.
   * This method is kept for compatibility but doesn't perform manual dialing.
   * Use addBootstrapPeer() for explicit peer connections.
   */
  async addPeer(peer: Peer): Promise<void> {
    this.peers.set(peer.id, peer);
    console.log(`Added peer: ${peer.id} at ${peer.address}:${peer.port}`);
    
    // Peers will be discovered automatically via gossipsub topic subscriptions and DHT
    // No manual dialing needed here
  }

  /**
   * Add a bootstrap peer and attempt to connect
   * This tries to dial the peer directly if we can construct a valid multiaddr
   */
  async addBootstrapPeer(address: string, port: number): Promise<void> {
    if (!this.libp2p || !this.started) {
      throw new Error('libp2p not started');
    }
    
    // Convert localhost to 127.0.0.1
    const addr = address === 'localhost' ? '127.0.0.1' : address;
    const multiaddr_str = `/ip4/${addr}/tcp/${port}`;
    
    console.log(`Attempting to connect to bootstrap peer at ${multiaddr_str}`);
    console.log(`Note: Connection will succeed once peer is discovered via mDNS`);
    
    // Store the multiaddr for the connection manager to try
    try {
      const ma = multiaddr(multiaddr_str);
      
      // Try to dial - this may fail initially but libp2p will retry
      // The connection will establish once mDNS discovers the peer
      this.libp2p.dial(ma).catch((err) => {
        console.log(`Initial dial attempt: ${err.message}`);
        console.log(`Will retry via mDNS discovery...`);
      });
    } catch (error) {
      console.log(`Bootstrap peer hint registered: ${multiaddr_str}`);
    }
  }

  /**
   * Remove a peer from the network
   */
  removePeer(peerId: string): void {
    this.peers.delete(peerId);
    console.log(`Removed peer: ${peerId}`);
  }

  /**
   * Get all peers from libp2p connections
   */
  getPeers(): Peer[] {
    if (this.libp2p && this.started) {
      // Get peers from libp2p connections
      const libp2pPeers = this.libp2p.getPeers();
      return libp2pPeers.map(peerId => ({
        id: peerId.toString(),
        address: 'unknown',
        port: 0,
        lastSeen: Date.now()
      }));
    }
    return Array.from(this.peers.values());
  }

  /**
   * Get peer count from libp2p connections
   */
  getPeerCount(): number {
    if (this.libp2p && this.started) {
      return this.libp2p.getPeers().length;
    }
    return this.peers.size;
  }

  /**
   * Register a message handler for a specific message type
   */
  on(messageType: string, handler: (message: NetworkMessage) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Broadcast a message to all peers using libp2p pubsub
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

    // Get the topic for this message type
    const topic = this.getTopicForMessageType(message.type);
    
    // Publish via libp2p pubsub
    if (this.libp2p && this.started) {
      try {
        const data = new TextEncoder().encode(JSON.stringify(message));
        this.libp2p.services.pubsub.publish(topic, data);
        console.log(`Broadcasting ${message.type} message via libp2p gossipsub`);
      } catch (error) {
        console.error(`Failed to broadcast message: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Get the topic name for a message type
   */
  private getTopicForMessageType(type: string): string {
    const topicMap: Record<string, string> = {
      'BLOCK': '/grosik/block',
      'TRANSACTION': '/grosik/transaction',
      'PEER_DISCOVERY': '/grosik/peer-discovery',
      'STAKE_UPDATE': '/grosik/stake-update'
    };
    return topicMap[type] || '/grosik/default';
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
   * Note: In a multi-host deployment, the address should be configured
   * to reflect the actual network address where this node is reachable.
   * For single-machine localhost testing, 'localhost' is sufficient.
   */
  discoverPeers(): void {
    const message: NetworkMessage = {
      type: 'PEER_DISCOVERY',
      payload: {
        id: this.nodeId,
        address: 'localhost',
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
