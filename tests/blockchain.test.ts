/**
 * Tests for Blockchain implementation
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { Blockchain } from '../src/blockchain';
import { CryptoUtils } from '../src/crypto';
import type { Transaction } from '../src/types';

describe('Blockchain', () => {
  let blockchain: Blockchain;

  beforeEach(() => {
    blockchain = new Blockchain();
  });

  test('should initialize with genesis block', () => {
    expect(blockchain.getLength()).toBe(1);
    const genesisBlock = blockchain.getLatestBlock();
    expect(genesisBlock.index).toBe(0);
    expect(genesisBlock.previousHash).toBe('0');
  });

  test('should add a new block', async () => {
    const keyPair = await CryptoUtils.generateKeyPair();
    const from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData(from, 'bob', 100, timestamp);
    const signature = await CryptoUtils.sign(transactionData, keyPair.privateKey);
    
    const transactions: Transaction[] = [
      { from, to: 'bob', amount: 100, timestamp, signature, publicKey: keyPair.publicKey }
    ];
    
    const block = blockchain.addBlock(transactions, 'validator1', 123, 'sig123');
    
    expect(blockchain.getLength()).toBe(2);
    expect(block.index).toBe(1);
    expect(block.transactions).toEqual(transactions);
    expect(block.validator).toBe('validator1');
    expect(block.drandRound).toBe(123);
  });

  test('should add pending transactions', async () => {
    const keyPair = await CryptoUtils.generateKeyPair();
    const from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData(from, 'bob', 50, timestamp);
    const signature = await CryptoUtils.sign(transactionData, keyPair.privateKey);
    
    const tx: Transaction = {
      from,
      to: 'bob',
      amount: 50,
      timestamp,
      signature,
      publicKey: keyPair.publicKey
    };

    await blockchain.addTransaction(tx);
    
    const pending = blockchain.getPendingTransactions();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toEqual(tx);
  });

  test('should clear pending transactions', async () => {
    const keyPair = await CryptoUtils.generateKeyPair();
    const from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData(from, 'bob', 50, timestamp);
    const signature = await CryptoUtils.sign(transactionData, keyPair.privateKey);
    
    const tx: Transaction = {
      from,
      to: 'bob',
      amount: 50,
      timestamp,
      signature,
      publicKey: keyPair.publicKey
    };

    await blockchain.addTransaction(tx);
    expect(blockchain.getPendingTransactions()).toHaveLength(1);
    
    blockchain.clearPendingTransactions();
    expect(blockchain.getPendingTransactions()).toHaveLength(0);
  });

  test('should validate a valid chain', () => {
    blockchain.addBlock([], 'validator1', 1, 'sig1');
    blockchain.addBlock([], 'validator2', 2, 'sig2');
    
    expect(blockchain.isValidChain()).toBe(true);
  });

  test('should get block by index', () => {
    blockchain.addBlock([], 'validator1', 1, 'sig1');
    
    const block = blockchain.getBlockByIndex(1);
    expect(block).not.toBeNull();
    expect(block?.index).toBe(1);
    expect(block?.validator).toBe('validator1');
  });

  test('should return null for invalid block index', () => {
    const block = blockchain.getBlockByIndex(999);
    expect(block).toBeNull();
  });

  test('should validate block with correct previous hash', () => {
    const block1 = blockchain.addBlock([], 'validator1', 1, 'sig1');
    const block2 = blockchain.addBlock([], 'validator2', 2, 'sig2');
    
    expect(blockchain.isValidBlock(block2.toObject(), block1.toObject())).toBe(true);
  });

  test('should get entire chain', () => {
    blockchain.addBlock([], 'validator1', 1, 'sig1');
    blockchain.addBlock([], 'validator2', 2, 'sig2');
    
    const chain = blockchain.getChain();
    expect(chain).toHaveLength(3); // Genesis + 2 blocks
    expect(chain[0].index).toBe(0);
    expect(chain[1].index).toBe(1);
    expect(chain[2].index).toBe(2);
  });
});
