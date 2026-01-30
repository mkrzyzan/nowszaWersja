/**
 * Tests for Crypto utilities
 */

import { describe, test, expect } from 'bun:test';
import { CryptoUtils } from '../src/crypto';

describe('CryptoUtils', () => {
  test('should generate consistent hash', () => {
    const data = 'test data';
    const hash1 = CryptoUtils.hash(data);
    const hash2 = CryptoUtils.hash(data);
    
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
  });

  test('should generate different hashes for different data', () => {
    const hash1 = CryptoUtils.hash('data1');
    const hash2 = CryptoUtils.hash('data2');
    
    expect(hash1).not.toBe(hash2);
  });

  test('should generate unique node IDs', () => {
    const id1 = CryptoUtils.generateNodeId();
    const id2 = CryptoUtils.generateNodeId();
    
    expect(id1).not.toBe(id2);
    expect(id1).toHaveLength(64);
    expect(id2).toHaveLength(64);
  });

  test('should verify hash difficulty correctly', () => {
    const easyHash = '000abc123'; // Starts with 3 zeros
    const hardHash = 'abc123456'; // Starts with no zeros
    
    expect(CryptoUtils.verifyHashDifficulty(easyHash, 3)).toBe(true);
    expect(CryptoUtils.verifyHashDifficulty(easyHash, 4)).toBe(false);
    expect(CryptoUtils.verifyHashDifficulty(hardHash, 1)).toBe(false);
  });

  test('should generate signature', () => {
    const data = 'test data';
    const privateKey = 'private-key';
    
    const sig1 = CryptoUtils.sign(data, privateKey);
    const sig2 = CryptoUtils.sign(data, privateKey);
    
    expect(sig1).toBe(sig2); // Same data and key should produce same signature
    expect(sig1).toHaveLength(64);
  });

  test('should generate different signatures for different private keys', () => {
    const data = 'test data';
    const sig1 = CryptoUtils.sign(data, 'key1');
    const sig2 = CryptoUtils.sign(data, 'key2');
    
    expect(sig1).not.toBe(sig2);
  });
});
