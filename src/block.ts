/**
 * Block implementation for GROSIK blockchain
 */

import type { Block, Transaction } from './types';
import { CryptoUtils } from './crypto';

export class BlockImpl implements Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  validator: string;
  drandRound: number;
  drandSignature: string;

  constructor(
    index: number,
    timestamp: number,
    transactions: Transaction[],
    previousHash: string,
    validator: string,
    drandRound: number,
    drandSignature: string
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.validator = validator;
    this.drandRound = drandRound;
    this.drandSignature = drandSignature;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  /**
   * Calculate the hash of the block
   */
  calculateHash(): string {
    const data = JSON.stringify({
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions,
      previousHash: this.previousHash,
      validator: this.validator,
      drandRound: this.drandRound,
      drandSignature: this.drandSignature,
      nonce: this.nonce
    });
    return CryptoUtils.hash(data);
  }

  /**
   * Create genesis block (first block in the chain)
   */
  static createGenesisBlock(): BlockImpl {
    return new BlockImpl(
      0,
      Date.now(),
      [],
      '0',
      'genesis',
      0,
      'genesis-signature'
    );
  }

  /**
   * Validate block structure
   */
  static isValidStructure(block: Block): boolean {
    return (
      typeof block.index === 'number' &&
      typeof block.timestamp === 'number' &&
      Array.isArray(block.transactions) &&
      typeof block.previousHash === 'string' &&
      typeof block.hash === 'string' &&
      typeof block.validator === 'string' &&
      typeof block.drandRound === 'number' &&
      typeof block.drandSignature === 'string'
    );
  }

  /**
   * Convert to plain object
   */
  toObject(): Block {
    return {
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions,
      previousHash: this.previousHash,
      hash: this.hash,
      nonce: this.nonce,
      validator: this.validator,
      drandRound: this.drandRound,
      drandSignature: this.drandSignature
    };
  }
}
