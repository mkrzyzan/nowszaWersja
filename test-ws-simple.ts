import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@libp2p/noise';
import { yamux } from '@libp2p/yamux';
import { mplex } from '@libp2p/mplex';

async function test() {
  console.log('Creating simple libp2p node with WebSocket...');
  
  const node = await createLibp2p({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/9999/ws']
    },
    transports: [webSockets()],
    streamMuxers: [yamux(), mplex()],
    connectionEncryption: [noise()]
  });
  
  await node.start();
  console.log('Node started!');
  console.log('Peer ID:', node.peerId.toString());
  console.log('Listening on:', node.getMultiaddrs().map(ma => ma.toString()));
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await node.stop();
  console.log('Node stopped');
}

test().catch(console.error);
