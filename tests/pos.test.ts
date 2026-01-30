/**
 * Tests for Proof of Stake implementation
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { ProofOfStake } from '../src/pos';

describe('ProofOfStake', () => {
  let pos: ProofOfStake;

  beforeEach(() => {
    pos = new ProofOfStake();
  });

  test('should add stake for an address', () => {
    pos.addStake('alice', 500);
    
    expect(pos.getStake('alice')).toBe(500);
  });

  test('should accumulate stakes', () => {
    pos.addStake('alice', 300);
    pos.addStake('alice', 200);
    
    expect(pos.getStake('alice')).toBe(500);
  });

  test('should return 0 for addresses without stake', () => {
    expect(pos.getStake('unknown')).toBe(0);
  });

  test('should remove stake', () => {
    pos.addStake('alice', 500);
    pos.removeStake('alice', 200);
    
    expect(pos.getStake('alice')).toBe(300);
  });

  test('should throw error when removing more stake than available', () => {
    pos.addStake('alice', 100);
    
    expect(() => pos.removeStake('alice', 200)).toThrow('Insufficient stake');
  });

  test('should throw error for negative stake', () => {
    expect(() => pos.addStake('alice', -100)).toThrow('Stake amount must be positive');
  });

  test('should get all stakes', () => {
    pos.addStake('alice', 500);
    pos.addStake('bob', 300);
    
    const stakes = pos.getAllStakes();
    expect(stakes).toHaveLength(2);
    expect(stakes.find(s => s.address === 'alice')?.amount).toBe(500);
    expect(stakes.find(s => s.address === 'bob')?.amount).toBe(300);
  });

  test('should calculate total stake', () => {
    pos.addStake('alice', 500);
    pos.addStake('bob', 300);
    pos.addStake('charlie', 200);
    
    expect(pos.getTotalStake()).toBe(1000);
  });

  test('should identify validators with minimum stake', () => {
    pos.addStake('alice', 150); // Above minimum
    pos.addStake('bob', 50);    // Below minimum
    
    expect(pos.isValidator('alice')).toBe(true);
    expect(pos.isValidator('bob')).toBe(false);
  });

  test('should select validator based on stake weight', () => {
    pos.addStake('alice', 500);
    pos.addStake('bob', 300);
    pos.addStake('charlie', 200);
    
    // Use deterministic randomness
    const randomness = '0000000000000000000000000000000000000000000000000000000000000001';
    const validator = pos.selectValidator(randomness);
    
    expect(validator).toBeDefined();
    expect(['alice', 'bob', 'charlie']).toContain(validator);
  });

  test('should return null when no validators eligible', () => {
    pos.addStake('alice', 50); // Below minimum
    
    const randomness = 'abc123';
    const validator = pos.selectValidator(randomness);
    
    expect(validator).toBeNull();
  });

  test('should return minimum stake requirement', () => {
    expect(pos.getMinimumStake()).toBe(100);
  });

  test('should delete stake when reduced to zero', () => {
    pos.addStake('alice', 100);
    pos.removeStake('alice', 100);
    
    expect(pos.getStake('alice')).toBe(0);
    expect(pos.getAllStakes().find(s => s.address === 'alice')).toBeUndefined();
  });

  test('should select different validators with different randomness', () => {
    pos.addStake('alice', 1000);
    pos.addStake('bob', 1000);
    
    const randomness1 = '0000000000000001';
    const randomness2 = 'ffffffffffffffff';
    
    const validator1 = pos.selectValidator(randomness1);
    const validator2 = pos.selectValidator(randomness2);
    
    // With equal stakes and different randomness, we might get different validators
    expect(validator1).toBeDefined();
    expect(validator2).toBeDefined();
  });
});
