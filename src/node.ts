/**
 * Main Node implementation for GROSIK blockchain
 */

import { Blockchain } from './blockchain';
import { ProofOfStake } from './pos';
import { DrandClient } from './drand';
import { GossipProtocol } from './gossip';
import { CryptoUtils } from './crypto';
import type { Transaction, NetworkMessage, Block, DrandBeacon } from './types';

export class Node {
  private blockchain: Blockchain;
  private pos: ProofOfStake;
  private drand: DrandClient;
  private gossip: GossipProtocol;
  private nodeId: string;
  private address: string;
  private isRunning: boolean = false;
  private blockInterval: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  private blockTimer?: Timer;

  constructor(port: number = 3000) {
    this.nodeId = CryptoUtils.generateNodeId();
    this.address = this.nodeId.substring(0, 16); // Use first 16 chars as address
    this.blockchain = new Blockchain();
    this.pos = new ProofOfStake();
    this.drand = new DrandClient();
    this.gossip = new GossipProtocol(this.nodeId, port);

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
      this.blockchain.addTransaction(transaction);
    });

    this.gossip.on('STAKE_UPDATE', (message: NetworkMessage) => {
      const { address, amount } = message.payload;
      this.pos.addStake(address, amount);
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
  stop(): void {
    this.isRunning = false;
    if (this.blockTimer) {
      clearInterval(this.blockTimer);
    }
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
    const transaction: Transaction = {
      from,
      to,
      amount,
      timestamp: Date.now()
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
