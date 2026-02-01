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

  test('should generate ECDSA key pair', () => {
    const keyPair = CryptoUtils.generateKeyPair();
    
    expect(keyPair.privateKey).toBeDefined();
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).not.toBe(keyPair.publicKey);
    expect(typeof keyPair.privateKey).toBe('string');
    expect(typeof keyPair.publicKey).toBe('string');
  });

  test('should generate different key pairs', () => {
    const keyPair1 = CryptoUtils.generateKeyPair();
    const keyPair2 = CryptoUtils.generateKeyPair();
    
    expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
  });

  test('should derive address from public key', () => {
    const keyPair = CryptoUtils.generateKeyPair();
    const address = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    
    expect(address).toBeDefined();
    expect(address).toHaveLength(40); // 20 bytes = 40 hex characters
    expect(typeof address).toBe('string');
  });

  test('should derive same address from same public key', () => {
    const keyPair = CryptoUtils.generateKeyPair();
    const address1 = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    const address2 = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    
    expect(address1).toBe(address2);
  });

  test('should sign and verify data with ECDSA', () => {
    const data = 'test data';
    const keyPair = CryptoUtils.generateKeyPair();
    
    const signature = CryptoUtils.sign(data, keyPair.privateKey);
    const isValid = CryptoUtils.verify(data, signature, keyPair.publicKey);
    
    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
    expect(isValid).toBe(true);
  });

  test('should reject signature with wrong public key', () => {
    const data = 'test data';
    const keyPair1 = CryptoUtils.generateKeyPair();
    const keyPair2 = CryptoUtils.generateKeyPair();
    
    const signature = CryptoUtils.sign(data, keyPair1.privateKey);
    const isValid = CryptoUtils.verify(data, signature, keyPair2.publicKey);
    
    expect(isValid).toBe(false);
  });

  test('should reject signature for tampered data', () => {
    const data = 'test data';
    const keyPair = CryptoUtils.generateKeyPair();
    
    const signature = CryptoUtils.sign(data, keyPair.privateKey);
    const isValid = CryptoUtils.verify('tampered data', signature, keyPair.publicKey);
    
    expect(isValid).toBe(false);
  });

  test('should reject invalid signature format', () => {
    const data = 'test data';
    const keyPair = CryptoUtils.generateKeyPair();
    
    const isValid = CryptoUtils.verify(data, 'invalid-signature', keyPair.publicKey);
    
    expect(isValid).toBe(false);
  });
});
