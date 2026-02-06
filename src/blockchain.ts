/**
 * Blockchain implementation for GROSIK
 */

import type { Block, Transaction } from './types';
import { BlockImpl } from './block';
import { CryptoUtils } from './crypto';

export class Blockchain {
  private chain: BlockImpl[] = [];
  private pendingTransactions: Transaction[] = [];

  constructor() {
    // Create genesis block
    this.chain.push(BlockImpl.createGenesisBlock());
  }

  /**
   * Get the latest block in the chain
   */
  getLatestBlock(): BlockImpl {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Get the entire chain
   */
  getChain(): Block[] {
    return this.chain.map(block => block.toObject());
  }

  /**
   * Get chain length
   */
  getLength(): number {
    return this.chain.length;
  }

  /**
   * Add a new block to the chain
   */
  addBlock(
    transactions: Transaction[],
    validator: string,
    drandRound: number,
    drandSignature: string
  ): BlockImpl {
    const latestBlock = this.getLatestBlock();
    const newBlock = new BlockImpl(
      latestBlock.index + 1,
      Date.now(),
      transactions,
      latestBlock.hash,
      validator,
      drandRound,
      drandSignature
    );

    this.chain.push(newBlock);
    return newBlock;
  }

  /**
   * Add a transaction to pending transactions
   */
  async addTransaction(transaction: Transaction): Promise<void> {
    // Validate transaction signature
    if (!(await this.isValidTransaction(transaction))) {
      throw new Error('Invalid transaction: signature verification failed');
    }
    this.pendingTransactions.push(transaction);
  }

  /**
   * Validate a transaction
   */
  async isValidTransaction(transaction: Transaction): Promise<boolean> {
    // Check if transaction has a signature
    if (!transaction.signature || transaction.signature.length === 0) {
      console.error('Transaction missing signature');
      return false;
    }

    // Check if transaction has a public key
    if (!transaction.publicKey || transaction.publicKey.length === 0) {
      console.error('Transaction missing public key');
      return false;
    }

    // Verify that the 'from' address matches the public key
    const derivedAddress = CryptoUtils.getAddressFromPublicKey(transaction.publicKey);
    if (derivedAddress !== transaction.from) {
      console.error('Transaction from address does not match public key');
      return false;
    }

    // Verify the signature using the public key
    const transactionData = CryptoUtils.getTransactionData(
      transaction.from,
      transaction.to,
      transaction.amount,
      transaction.timestamp
    );
    
    const isValid = await CryptoUtils.verify(transactionData, transaction.signature, transaction.publicKey);
    
    if (!isValid) {
      console.error('Invalid transaction signature');
    }
    
    return isValid;
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions(): Transaction[] {
    return [...this.pendingTransactions];
  }

  /**
   * Clear pending transactions (after they're added to a block)
   */
  clearPendingTransactions(): void {
    this.pendingTransactions = [];
  }

  /**
   * Validate a block
   */
  isValidBlock(block: Block, previousBlock: Block): boolean {
    // Check block structure
    if (!BlockImpl.isValidStructure(block)) {
      console.error('Invalid block structure');
      return false;
    }

    // Check index
    if (block.index !== previousBlock.index + 1) {
      console.error('Invalid block index');
      return false;
    }

    // Check previous hash
    if (block.previousHash !== previousBlock.hash) {
      console.error('Invalid previous hash');
      return false;
    }

    // Check hash calculation
    const blockImpl = new BlockImpl(
      block.index,
      block.timestamp,
      block.transactions,
      block.previousHash,
      block.validator,
      block.drandRound,
      block.drandSignature
    );
    blockImpl.nonce = block.nonce;
    
    if (blockImpl.calculateHash() !== block.hash) {
      console.error('Invalid block hash');
      return false;
    }

    return true;
  }

  /**
   * Validate the entire chain
   */
  isValidChain(): boolean {
    // Check genesis block
    const genesisBlock = this.chain[0];
    if (genesisBlock.index !== 0 || genesisBlock.previousHash !== '0') {
      return false;
    }

    // Validate each block against the previous one
    for (let i = 1; i < this.chain.length; i++) {
      if (!this.isValidBlock(this.chain[i].toObject(), this.chain[i - 1].toObject())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Replace chain with a longer valid chain
   */
  replaceChain(newChain: Block[]): boolean {
    if (newChain.length <= this.chain.length) {
      console.log('Received chain is not longer than current chain');
      return false;
    }

    // Validate the new chain
    const tempChain: BlockImpl[] = [];
    for (const blockData of newChain) {
      const block = new BlockImpl(
        blockData.index,
        blockData.timestamp,
        blockData.transactions,
        blockData.previousHash,
        blockData.validator,
        blockData.drandRound,
        blockData.drandSignature
      );
      block.nonce = blockData.nonce;
      block.hash = blockData.hash;
      tempChain.push(block);
    }

    // Validate genesis
    if (tempChain[0].index !== 0 || tempChain[0].previousHash !== '0') {
      console.error('Invalid genesis block in new chain');
      return false;
    }

    // Validate each block
    for (let i = 1; i < tempChain.length; i++) {
      if (!this.isValidBlock(tempChain[i].toObject(), tempChain[i - 1].toObject())) {
        console.error(`Invalid block at index ${i} in new chain`);
        return false;
      }
    }

    console.log('Replacing current chain with new chain');
    this.chain = tempChain;
    return true;
  }

  /**
   * Get block by index
   */
  getBlockByIndex(index: number): Block | null {
    if (index < 0 || index >= this.chain.length) {
      return null;
    }
    return this.chain[index].toObject();
  }
}
