/**
 * Main Node implementation for GROSIK blockchain
 */

import { Blockchain } from './blockchain';
import { ProofOfStake } from './pos';
import { DrandClient } from './drand';
import { GossipProtocol } from './gossip';
import { CryptoUtils, type KeyPair } from './crypto';
import type { Transaction, NetworkMessage, Block, DrandBeacon } from './types';

export class Node {
  private blockchain: Blockchain;
  private pos: ProofOfStake;
  private drand: DrandClient;
  private gossip: GossipProtocol;
  private nodeId: string;
  private address: string;
  private keyPair: KeyPair;
  private isRunning: boolean = false;
  private blockInterval: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  private blockTimer?: Timer;
  private nodeAddress: string = 'localhost'; // Network address where this node is reachable

  constructor(httpPort: number = 3000, libp2pPort: number = 4000, nodeAddress?: string) {
    this.nodeId = CryptoUtils.generateNodeId();
    this.keyPair = CryptoUtils.generateKeyPair();
    this.address = CryptoUtils.getAddressFromPublicKey(this.keyPair.publicKey);
    this.blockchain = new Blockchain();
    this.pos = new ProofOfStake();
    this.drand = new DrandClient();
    this.gossip = new GossipProtocol(this.nodeId, libp2pPort);
    if (nodeAddress) {
      this.nodeAddress = nodeAddress;
    }

    // Initialize with some stake for this node
    this.pos.addStake(this.address, 1000);

    this.setupMessageHandlers();
  }

  /**
   * Setup handlers for network messages
   */
  private setupMessageHandlers(): void {
    this.gossip.on('BLOCK', (message: NetworkMessage) => {
      const block = message.payload as Block;
      this.handleReceivedBlock(block);
    });

    this.gossip.on('TRANSACTION', (message: NetworkMessage) => {
      const transaction = message.payload as Transaction;
      try {
        this.blockchain.addTransaction(transaction);
      } catch (error) {
        console.error('Rejected invalid transaction:', error);
      }
    });

    this.gossip.on('STAKE_UPDATE', (message: NetworkMessage) => {
      const { address, amount } = message.payload;
      this.pos.addStake(address, amount);
    });

    this.gossip.on('PEER_DISCOVERY', (message: NetworkMessage) => {
      const { id, address, port } = message.payload;
      // Only add peer if it's not ourselves
      if (id !== this.nodeId) {
        // Add peer asynchronously - errors are logged inside addPeer
        this.gossip.addPeer({
          id,
          address: address || 'localhost',
          port,
          lastSeen: Date.now()
        }).catch(err => {
          console.log(`Error adding peer ${id}: ${err}`);
        });
        
        // Broadcast our own PEER_DISCOVERY so all peers learn about us
        // This enables transitive peer discovery (A->B, C->B, then A<->C)
        const responseMessage: NetworkMessage = {
          type: 'PEER_DISCOVERY',
          payload: {
            id: this.nodeId,
            address: this.nodeAddress,
            port: this.gossip.getPort()
          },
          sender: this.nodeId,
          timestamp: Date.now()
        };
        
        // Broadcast to all peers (including the sender who will see we're already known)
        this.gossip.broadcast(responseMessage);
      }
    });
  }

  /**
   * Handle a received block from the network
   */
  private handleReceivedBlock(block: Block): void {
    const latestBlock = this.blockchain.getLatestBlock();
    
    if (block.index === latestBlock.index + 1) {
      // Next block in sequence
      if (this.blockchain.isValidBlock(block, latestBlock.toObject())) {
        console.log(`Received and validated new block #${block.index}`);
        // Block is valid, but we need to add it through our blockchain
        // In a real implementation, we'd need to handle this more carefully
      }
    } else if (block.index > latestBlock.index + 1) {
      // We're behind, might need to request the chain
      console.log('Received block indicates we are behind. Chain sync needed.');
    }
  }

  /**
   * Connect to a bootstrap peer using libp2p
   * @param peerAddress - The HTTP port or host:port of the peer (e.g., "localhost:3000" or "3000")
   *                      The libp2p port will be calculated as HTTP port + 1000
   */
  async connectToBootstrapPeer(peerAddress: string): Promise<void> {
    try {
      console.log(`Attempting to connect to bootstrap peer: ${peerAddress}`);
      
      // Parse peer address (format: host:port or just port)
      let host = 'localhost';
      let httpPort = 3000;
      
      if (peerAddress.includes(':')) {
        const parts = peerAddress.split(':');
        host = parts[0];
        httpPort = parseInt(parts[1]);
        
        if (isNaN(httpPort)) {
          throw new Error(`Invalid port in peer address: ${peerAddress}. Expected format: host:port (e.g., localhost:3000)`);
        }
      } else {
        httpPort = parseInt(peerAddress);
        
        if (isNaN(httpPort)) {
          throw new Error(`Invalid port: ${peerAddress}. Expected a number (e.g., 3000) or host:port format (e.g., localhost:3000)`);
        }
      }

      // Calculate libp2p port (httpPort + 1000 by convention)
      const libp2pPort = httpPort + 1000;

      // Connect to peer using libp2p
      await this.gossip.addBootstrapPeer(host, libp2pPort);

      // Also track in our peer list for compatibility
      await this.gossip.addPeer({
        id: `bootstrap-${host}:${httpPort}`,
        address: host,
        port: libp2pPort,
        lastSeen: Date.now()
      });

      console.log(`✅ Successfully connected to bootstrap peer at ${host}:${httpPort} (libp2p: ${libp2pPort})`);
    } catch (error) {
      console.error(`Error connecting to bootstrap peer:`, error);
    }
  }

  /**
   * Start the node
   */
  async start(): Promise<void> {
    console.log('='.repeat(60));
    console.log('GROSIK Node Starting');
    console.log('='.repeat(60));
    console.log(`Node ID: ${this.nodeId}`);
    console.log(`Address: ${this.address}`);
    console.log(`Stake: ${this.pos.getStake(this.address)}`);
    console.log('='.repeat(60));

    this.isRunning = true;

    // Start libp2p gossip protocol
    try {
      await this.gossip.start();
      console.log('libp2p gossip protocol started');
    } catch (error) {
      console.error('Failed to start gossip protocol:', error);
      throw error;
    }

    // Get DRAND chain info
    try {
      const chainInfo = await this.drand.getChainInfo();
      console.log('Connected to DRAND network');
      console.log(`Chain: ${chainInfo.public_key ? 'Connected' : 'Error'}`);
    } catch (error) {
      console.error('Failed to connect to DRAND:', error);
    }

    // Start block production
    this.startBlockProduction();

    console.log('Node started successfully');
    console.log(`Block creation interval: ${this.blockInterval / 1000} seconds`);
  }

  /**
   * Stop the node
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.blockTimer) {
      clearInterval(this.blockTimer);
    }
    await this.gossip.stop();
    console.log('Node stopped');
  }

  /**
   * Start block production cycle
   */
  private startBlockProduction(): void {
    this.blockTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.tryCreateBlock();
      }
    }, this.blockInterval);

    // Try to create first block immediately
    this.tryCreateBlock();
  }

  /**
   * Try to create a new block if selected as validator
   */
  private async tryCreateBlock(): Promise<void> {
    try {
      console.log('\n' + '-'.repeat(60));
      console.log('Attempting to create new block...');

      // Get latest DRAND beacon
      const beacon = await this.drand.getLatestBeacon();
      console.log(`DRAND Round: ${beacon.round}`);

      // Select validator based on DRAND randomness
      const selectedValidator = this.pos.selectValidator(beacon.randomness);
      
      if (!selectedValidator) {
        console.log('No eligible validators in the network');
        return;
      }

      console.log(`Selected validator: ${selectedValidator.substring(0, 16)}...`);

      // Check if we are the selected validator
      if (selectedValidator === this.address) {
        console.log('🎉 WE ARE THE SELECTED VALIDATOR!');
        
        // Create new block
        const pendingTxs = this.blockchain.getPendingTransactions();
        const newBlock = this.blockchain.addBlock(
          pendingTxs,
          this.address,
          beacon.round,
          beacon.signature
        );

        // Clear pending transactions
        this.blockchain.clearPendingTransactions();

        console.log(`✅ Created block #${newBlock.index}`);
        console.log(`   Hash: ${newBlock.hash.substring(0, 16)}...`);
        console.log(`   Transactions: ${newBlock.transactions.length}`);

        // Broadcast the new block
        this.gossip.broadcastBlock(newBlock.toObject());
      } else {
        console.log('Not selected as validator this round');
      }

      console.log('-'.repeat(60));
    } catch (error) {
      console.error('Error creating block:', error);
    }
  }

  /**
   * Add a transaction
   */
  addTransaction(from: string, to: string, amount: number): void {
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData(from, to, amount, timestamp);
    
    // Sign the transaction using the node's private key
    const signature = CryptoUtils.sign(transactionData, this.keyPair.privateKey);
    
    const transaction: Transaction = {
      from,
      to,
      amount,
      timestamp,
      signature,
      publicKey: this.keyPair.publicKey
    };
    
    this.blockchain.addTransaction(transaction);
    
    // Broadcast transaction
    const message: NetworkMessage = {
      type: 'TRANSACTION',
      payload: transaction,
      sender: this.nodeId,
      timestamp: Date.now()
    };
    this.gossip.broadcast(message);
  }

  /**
   * Receive a signed transaction from an external client (wallet).
   * Validates and broadcasts to peers.
   */
  receiveTransactionFromClient(transaction: Transaction): void {
    try {
      this.blockchain.addTransaction(transaction);
      const message: NetworkMessage = {
        type: 'TRANSACTION',
        payload: transaction,
        sender: this.nodeId,
        timestamp: Date.now()
      };
      this.gossip.broadcast(message);
    } catch (error) {
      // rethrow so the HTTP server can return an error
      throw error;
    }
  }

  /**
   * Get blockchain state
   */
  getBlockchainState(): {
    chainLength: number;
    latestBlock: Block;
    pendingTransactions: number;
    peers: number;
    stake: number;
  } {
    return {
      chainLength: this.blockchain.getLength(),
      latestBlock: this.blockchain.getLatestBlock().toObject(),
      pendingTransactions: this.blockchain.getPendingTransactions().length,
      peers: this.gossip.getPeerCount(),
      stake: this.pos.getStake(this.address)
    };
  }

  /**
   * Get node info
   */
  getNodeInfo(): {
    nodeId: string;
    address: string;
    isRunning: boolean;
  } {
    return {
      nodeId: this.nodeId,
      address: this.address,
      isRunning: this.isRunning
    };
  }

  /**
   * Get the blockchain
   */
  getBlockchain(): Blockchain {
    return this.blockchain;
  }

  /**
   * Get proof of stake
   */
  getProofOfStake(): ProofOfStake {
    return this.pos;
  }
}
