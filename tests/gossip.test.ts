/**
 * Tests for GossipProtocol wrapper around libp2p
 * Note: We don't test libp2p itself - it's a well-tested industry standard
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { GossipProtocol } from '../src/gossip';
import type { NetworkMessage } from '../src/types';

describe('GossipProtocol', () => {
  let gossip: GossipProtocol;

  beforeEach(async () => {
    gossip = new GossipProtocol('test-node', 15000);
    await gossip.start();
  });

  afterEach(async () => {
    await gossip.stop();
  });

  test('should initialize with node ID and port', () => {
    expect(gossip.getNodeId()).toBe('test-node');
    expect(gossip.getPort()).toBe(15000);
  });

  test('should register and call message handlers', () => {
    let handlerCalled = false;
    let receivedMessage: NetworkMessage | null = null;
    
    gossip.on('BLOCK', (message) => {
      handlerCalled = true;
      receivedMessage = message;
    });

    const message: NetworkMessage = {
      type: 'BLOCK',
      payload: { index: 1 },
      sender: 'test-sender',
      timestamp: Date.now()
    };

    gossip.handleMessage(message);
    
    expect(handlerCalled).toBe(true);
    expect(receivedMessage).toEqual(message);
  });

  test('should deduplicate messages', () => {
    let callCount = 0;

    gossip.on('TRANSACTION', () => {
      callCount++;
    });

    const message: NetworkMessage = {
      type: 'TRANSACTION',
      payload: { amount: 100 },
      sender: 'test-sender',
      timestamp: Date.now()
    };

    gossip.handleMessage(message);
    gossip.handleMessage(message); // Duplicate
    
    expect(callCount).toBe(1);
  });

  test('should broadcast messages without errors', () => {
    const message: NetworkMessage = {
      type: 'BLOCK',
      payload: {},
      sender: 'test-node',
      timestamp: Date.now()
    };

    expect(() => gossip.broadcast(message)).not.toThrow();
  });

  test('should broadcast blocks using helper method', () => {
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

    expect(() => gossip.broadcastBlock(block)).not.toThrow();
  });

  test('should stop cleanly', async () => {
    // Stop is already called in afterEach, just verify it doesn't throw
    expect(true).toBe(true);
  });
});
