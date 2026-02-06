/**
 * Minimal test to see if basic libp2p connections work
 */

import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@libp2p/noise';
import { yamux } from '@libp2p/yamux';
import { mplex } from '@libp2p/mplex';
import { identify } from '@libp2p/identify';
import { ping } from '@libp2p/ping';
import { mdns } from '@libp2p/mdns';

async function main() {
  console.log('🧪 Testing minimal libp2p connection\n');
  
  // Create node 1
  console.log('Creating Node 1...');
  const node1 = await createLibp2p({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/5000']
    },
    transports: [tcp()],
    streamMuxers: [yamux(), mplex()],
    connectionEncryption: [noise()],
    peerDiscovery: [mdns({ interval: 1000 })],
    services: {
      identify: identify(),
      ping: ping()
    }
  });
  
  await node1.start();
  console.log('Node 1 started:', node1.peerId.toString().substring(0, 20) + '...');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Create node 2
  console.log('\nCreating Node 2...');
  const node2 = await createLibp2p({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/5001']
    },
    transports: [tcp()],
    streamMuxers: [yamux(), mplex()],
    connectionEncryption: [noise()],
    peerDiscovery: [mdns({ interval: 1000 })],
    services: {
      identify: identify(),
      ping: ping()
    }
  });
  
  await node2.start();
  console.log('Node 2 started:', node2.peerId.toString().substring(0, 20) + '...');
  
  // Listen for connections
  node1.addEventListener('peer:connect', (evt) => {
    console.log('✅ Node 1 connected to:', evt.detail.toString().substring(0, 20) + '...');
  });
  
  node2.addEventListener('peer:connect', (evt) => {
    console.log('✅ Node 2 connected to:', evt.detail.toString().substring(0, 20) + '...');
  });
  
  // Listen for discovery
  node1.addEventListener('peer:discovery', async (evt) => {
    console.log('🔍 Node 1 discovered:', evt.detail.id.toString().substring(0, 20) + '...');
    try {
      await node1.dial(evt.detail.id);
    } catch (err: any) {
      console.log('   Dial failed:', err.message);
    }
  });
  
  node2.addEventListener('peer:discovery', async (evt) => {
    console.log('🔍 Node 2 discovered:', evt.detail.id.toString().substring(0, 20) + '...');
    try {
      await node2.dial(evt.detail.id);
    } catch (err: any) {
      console.log('   Dial failed:', err.message);
    }
  });
  
  console.log('\n Waiting for discovery and connection...\n');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  console.log('\n📊 Results:');
  console.log('Node 1 peers:', node1.getPeers().length);
  console.log('Node 2 peers:', node2.getPeers().length);
  
  await node1.stop();
  await node2.stop();
  
  process.exit(0);
}

main().catch(console.error);
