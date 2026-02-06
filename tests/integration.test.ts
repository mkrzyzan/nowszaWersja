/**
 * Minimal integration tests - focus on application logic, not libp2p
 */

import { describe, test, expect, afterEach } from 'bun:test';
import { Node } from '../src/node';
import { startServer } from '../src/server';
import type { Transaction } from '../src/types';

describe('Node Integration', () => {
  let nodes: Node[] = [];
  let servers: any[] = [];
  
  afterEach(async () => {
    for (const node of nodes) {
      await node.stop();
    }
    for (const server of servers) {
      if (server?.stop) server.stop();
    }
    nodes = [];
    servers = [];
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  test('should start node and create genesis block', async () => {
    const node = new Node(13000, 14000, 'localhost');
    nodes.push(node);
    
    await node.start();
    
    const state = node.getBlockchainState();
    expect(state.chainLength).toBe(1);
    expect(state.latestBlock.index).toBe(0);
  });

  test('should accept and store transactions', async () => {
    const node = new Node(13010, 14010, 'localhost');
    nodes.push(node);
    await node.start();
    
    const nodeInfo = node.getNodeInfo();
    node.addTransaction(nodeInfo.address, 'recipient', 100);
    
    const state = node.getBlockchainState();
    expect(state.pendingTransactions).toBe(1);
  });

  test('should serve HTTP endpoints', async () => {
    const node = new Node(13020, 14020, 'localhost');
    nodes.push(node);
    await node.start();
    const server = startServer(node, 13020);
    servers.push(server);
    
    const response = await fetch('http://localhost:13020/health');
    expect(response.status).toBe(200);
  });

  test('should reject invalid transactions via HTTP', async () => {
    const node = new Node(13030, 14030, 'localhost');
    nodes.push(node);
    await node.start();
    const server = startServer(node, 13030);
    servers.push(server);
    
    // Send invalid transaction (will fail signature validation)
    const tx: Transaction = {
      from: 'sender',
      to: 'receiver',
      amount: 50,
      timestamp: Date.now(),
      signature: 'invalid_sig',
      publicKey: 'invalid_key'
    };
    
    const response = await fetch('http://localhost:13030/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
    
    // Should reject invalid transaction
    expect(response.status).toBe(400);
  });
});
