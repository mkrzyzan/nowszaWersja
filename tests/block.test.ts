/**
 * Tests for Block implementation
 */

import { describe, test, expect } from 'bun:test';
import { BlockImpl } from '../src/block';
import type { Transaction } from '../src/types';

describe('Block', () => {
  test('should create a block with correct properties', () => {
    const transactions: Transaction[] = [
      { from: 'alice', to: 'bob', amount: 100, timestamp: Date.now() }
    ];
    
    const block = new BlockImpl(1, Date.now(), transactions, 'prev-hash', 'validator1', 123, 'sig123');
    
    expect(block.index).toBe(1);
    expect(block.transactions).toEqual(transactions);
    expect(block.previousHash).toBe('prev-hash');
    expect(block.validator).toBe('validator1');
    expect(block.drandRound).toBe(123);
    expect(block.drandSignature).toBe('sig123');
    expect(block.hash).toBeDefined();
  });

  test('should create genesis block', () => {
    const genesis = BlockImpl.createGenesisBlock();
    
    expect(genesis.index).toBe(0);
    expect(genesis.previousHash).toBe('0');
    expect(genesis.validator).toBe('genesis');
    expect(genesis.transactions).toHaveLength(0);
  });

  test('should calculate hash consistently', () => {
    const block = new BlockImpl(1, 12345, [], 'prev', 'validator1', 1, 'sig1');
    const hash1 = block.calculateHash();
    const hash2 = block.calculateHash();
    
    expect(hash1).toBe(hash2);
    expect(hash1).toBe(block.hash);
  });

  test('should validate block structure', () => {
    const validBlock = new BlockImpl(1, Date.now(), [], 'prev', 'validator1', 1, 'sig1');
    
    expect(BlockImpl.isValidStructure(validBlock.toObject())).toBe(true);
  });

  test('should reject invalid block structure', () => {
    const invalidBlock: any = {
      index: '1', // Should be number
      timestamp: Date.now(),
      transactions: [],
      previousHash: 'prev',
      hash: 'hash',
      validator: 'validator1',
      drandRound: 1,
      drandSignature: 'sig1'
    };
    
    expect(BlockImpl.isValidStructure(invalidBlock)).toBe(false);
  });

  test('should convert to plain object', () => {
    const block = new BlockImpl(1, 12345, [], 'prev', 'validator1', 1, 'sig1');
    const obj = block.toObject();
    
    expect(obj).toHaveProperty('index');
    expect(obj).toHaveProperty('timestamp');
    expect(obj).toHaveProperty('transactions');
    expect(obj).toHaveProperty('hash');
    expect(obj.index).toBe(1);
  });

  test('should have different hashes for different blocks', () => {
    const block1 = new BlockImpl(1, Date.now(), [], 'prev', 'validator1', 1, 'sig1');
    const block2 = new BlockImpl(2, Date.now(), [], 'prev', 'validator2', 2, 'sig2');
    
    expect(block1.hash).not.toBe(block2.hash);
  });
});
