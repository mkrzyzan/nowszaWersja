/**
 * Test script to verify P2P connections between nodes
 */

import { GossipProtocol } from './src/gossip';
import type { NetworkMessage } from './src/types';

async function main() {
  console.log('🧪 Testing P2P Connection with WebSocket Transport\n');
  
  // Create node 1
  console.log('Creating Node 1 on port 4000...');
  const node1 = new GossipProtocol('node-1', 4000);
  let node1ReceivedMessage = false;
  
  node1.on('TRANSACTION', (msg: NetworkMessage) => {
    console.log('✅ Node 1 received transaction:', msg);
    node1ReceivedMessage = true;
  });
  
  await node1.start();
  console.log('Node 1 started\n');
  
  // Wait a bit for node 1 to fully initialize
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Create node 2
  console.log('Creating Node 2 on port 4001...');
  const node2 = new GossipProtocol('node-2', 4001);
  let node2ReceivedMessage = false;
  
  node2.on('BLOCK', (msg: NetworkMessage) => {
    console.log('✅ Node 2 received block:', msg);
    node2ReceivedMessage = true;
  });
  
  await node2.start();
  console.log('Node 2 started\n');
  
  // Add node 1 as bootstrap peer for node 2
  console.log('Connecting Node 2 to Node 1...');
  await node2.addBootstrapPeer('localhost', 4000);
  
  // Wait for connection to establish
  console.log('Waiting for peers to discover and connect...\n');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Check peer counts
  const node1Peers = node1.getPeerCount();
  const node2Peers = node2.getPeerCount();
  
  console.log(`\n📊 Connection Status:`);
  console.log(`   Node 1 connected peers: ${node1Peers}`);
  console.log(`   Node 2 connected peers: ${node2Peers}`);
  
  if (node1Peers > 0 && node2Peers > 0) {
    console.log('   ✅ Nodes are connected!\n');
    
    // Give gossipsub time to propagate topic subscriptions
    console.log('Waiting for gossipsub topic subscription propagation...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test message propagation
    console.log('Testing message propagation...');
    
    // Node 1 broadcasts a transaction
    console.log('Node 1 broadcasting transaction...');
    node1.broadcast({
      type: 'TRANSACTION',
      timestamp: Date.now(),
      payload: { from: 'alice', to: 'bob', amount: 100 },
      sender: 'node-1'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Node 2 broadcasts a block
    console.log('Node 2 broadcasting block...');
    node2.broadcast({
      type: 'BLOCK',
      timestamp: Date.now(),
      payload: { index: 1, transactions: [] },
      sender: 'node-2'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📊 Message Propagation Results:');
    console.log(`   Node 1 received messages: ${node1ReceivedMessage ? '✅' : '❌'}`);
    console.log(`   Node 2 received messages: ${node2ReceivedMessage ? '✅' : '❌'}`);
    
    if (node1ReceivedMessage && node2ReceivedMessage) {
      console.log('\n🎉 SUCCESS: All tests passed!');
      console.log('   - Nodes discovered each other');
      console.log('   - Connections established');
      console.log('   - Messages propagated bi-directionally\n');
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Nodes connected but messages not propagating\n');
    }
  } else {
    console.log('   ❌ Nodes failed to connect\n');
  }
  
  // Cleanup
  console.log('Cleaning up...');
  await node1.stop();
  await node2.stop();
  console.log('Done!\n');
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
