/**
 * GROSIK - Gossip-based Reliable On-chain Sortition-enabled Infrastructure for Konsensus
 * 
 * A simple, lightweight mini blockchain node implementation
 */

import { Node } from './node';
import { startServer } from './server';

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ██████╗  ██████╗ ███████╗██╗██╗  ██╗                ║
║  ██╔════╝ ██╔══██╗██╔═══██╗██╔════╝██║██║ ██╔╝                ║
║  ██║  ███╗██████╔╝██║   ██║███████╗██║█████╔╝                 ║
║  ██║   ██║██╔══██╗██║   ██║╚════██║██║██╔═██╗                 ║
║  ╚██████╔╝██║  ██║╚██████╔╝███████║██║██║  ██╗                ║
║   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═╝                ║
║                                                               ║
║  Gossip-based Reliable On-chain Sortition-enabled             ║
║  Infrastructure for Konsensus                                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  // Parse command-line arguments
  const args = process.argv.slice(2);
  const bootstrapPeers: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--peer' || args[i] === '-p') {
      if (i + 1 < args.length) {
        bootstrapPeers.push(args[i + 1]);
        i++; // Skip next argument
      }
    }
  }

  // Create and start the node
  const port = parseInt(process.env.PORT || '3000');
  const node = new Node(port);

  // Start the node
  await node.start();

  // Connect to bootstrap peers if provided
  if (bootstrapPeers.length > 0) {
    console.log(`\n🔗 Connecting to ${bootstrapPeers.length} bootstrap peer(s)...`);
    for (const peer of bootstrapPeers) {
      await node.connectToBootstrapPeer(peer);
    }
  }

  // Start Bun HTTP/WebSocket server
  startServer(node);

  // Log blockchain state every 30 seconds
  setInterval(() => {
    const state = node.getBlockchainState();
    console.log('\n📊 Current State:');
    console.log(`   Chain Length: ${state.chainLength}`);
    console.log(`   Latest Block: #${state.latestBlock.index}`);
    console.log(`   Pending Transactions: ${state.pendingTransactions}`);
    console.log(`   Connected Peers: ${state.peers}`);
    console.log(`   Your Stake: ${state.stake}`);
  }, 30000);

  // Handle shutdown gracefully
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    node.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    node.stop();
    process.exit(0);
  });
}

// Run the node
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
