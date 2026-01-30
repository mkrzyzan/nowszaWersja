/**
 * Tests for Gossip Protocol implementation
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { GossipProtocol } from '../src/gossip';
import type { Peer, NetworkMessage } from '../src/types';

describe('GossipProtocol', () => {
  let gossip: GossipProtocol;

  beforeEach(() => {
    gossip = new GossipProtocol('node1', 3000);
  });

  test('should initialize with node ID and port', () => {
    expect(gossip.getNodeId()).toBe('node1');
    expect(gossip.getPeerCount()).toBe(0);
  });

  test('should add a peer', () => {
    const peer: Peer = {
      id: 'peer1',
      address: '127.0.0.1',
      port: 3001,
      lastSeen: Date.now()
    };

    gossip.addPeer(peer);
    
    expect(gossip.getPeerCount()).toBe(1);
    expect(gossip.getPeers()).toContainEqual(peer);
  });

  test('should remove a peer', () => {
    const peer: Peer = {
      id: 'peer1',
      address: '127.0.0.1',
      port: 3001,
      lastSeen: Date.now()
    };

    gossip.addPeer(peer);
    expect(gossip.getPeerCount()).toBe(1);
    
    gossip.removePeer('peer1');
    expect(gossip.getPeerCount()).toBe(0);
  });

  test('should get all peers', () => {
    const peer1: Peer = {
      id: 'peer1',
      address: '127.0.0.1',
      port: 3001,
      lastSeen: Date.now()
    };
    const peer2: Peer = {
      id: 'peer2',
      address: '127.0.0.1',
      port: 3002,
      lastSeen: Date.now()
    };

    gossip.addPeer(peer1);
    gossip.addPeer(peer2);
    
    const peers = gossip.getPeers();
    expect(peers).toHaveLength(2);
  });

  test('should register and call message handler', () => {
    let called = false;
    let receivedMessage: NetworkMessage | null = null;

    gossip.on('BLOCK', (message) => {
      called = true;
      receivedMessage = message;
    });

    const message: NetworkMessage = {
      type: 'BLOCK',
      payload: { index: 1 },
      sender: 'node2',
      timestamp: Date.now()
    };

    gossip.handleMessage(message);
    
    expect(called).toBe(true);
    expect(receivedMessage).toEqual(message);
  });

  test('should not rehandle the same message', () => {
    let callCount = 0;

    gossip.on('TRANSACTION', () => {
      callCount++;
    });

    const message: NetworkMessage = {
      type: 'TRANSACTION',
      payload: { amount: 100 },
      sender: 'node2',
      timestamp: Date.now()
    };

    gossip.handleMessage(message);
    gossip.handleMessage(message); // Try to handle again
    
    expect(callCount).toBe(1); // Should only be called once
  });

  test('should broadcast message', () => {
    const message: NetworkMessage = {
      type: 'BLOCK',
      payload: {},
      sender: 'node1',
      timestamp: Date.now()
    };

    // Add a peer
    gossip.addPeer({
      id: 'peer1',
      address: '127.0.0.1',
      port: 3001,
      lastSeen: Date.now()
    });

    // Should not throw
    expect(() => gossip.broadcast(message)).not.toThrow();
  });

  test('should update peer last seen', () => {
    const peer: Peer = {
      id: 'peer1',
      address: '127.0.0.1',
      port: 3001,
      lastSeen: Date.now() - 10000
    };

    gossip.addPeer(peer);
    const oldLastSeen = gossip.getPeers()[0].lastSeen;
    
    // Update last seen
    gossip.updatePeerLastSeen('peer1');
    const newLastSeen = gossip.getPeers()[0].lastSeen;
    
    expect(newLastSeen).toBeGreaterThanOrEqual(oldLastSeen);
  });

  test('should cleanup stale peers', () => {
    const stalePeer: Peer = {
      id: 'stale',
      address: '127.0.0.1',
      port: 3001,
      lastSeen: Date.now() - 400000 // 400 seconds ago
    };
    const activePeer: Peer = {
      id: 'active',
      address: '127.0.0.1',
      port: 3002,
      lastSeen: Date.now()
    };

    gossip.addPeer(stalePeer);
    gossip.addPeer(activePeer);
    
    expect(gossip.getPeerCount()).toBe(2);
    
    gossip.cleanupStalePeers(300000); // 300 seconds max age
    
    expect(gossip.getPeerCount()).toBe(1);
    expect(gossip.getPeers()[0].id).toBe('active');
  });

  test('should broadcast block', () => {
    const block = {
      index: 1,
      timestamp: Date.now(),
      transactions: [],
      previousHash: 'prev',
      hash: 'hash',
      nonce: 0,
      validator: 'val1',
      drandRound: 1,
      drandSignature: 'sig'
    };

    // Should not throw
    expect(() => gossip.broadcastBlock(block)).not.toThrow();
  });

  test('should handle peer discovery', () => {
    // Should not throw
    expect(() => gossip.discoverPeers()).not.toThrow();
  });
});
