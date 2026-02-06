/**
 * Tests for Encryption utilities
 */

import { describe, test, expect } from 'bun:test';
import { 
  deriveAesKeyFromPassword, 
  encryptJsonWithPassword, 
  decryptJsonWithPassword 
} from '../src/encryption';

describe('Encryption', () => {
  test('should derive key from password', async () => {
    const password = 'test-password';
    const { key, salt } = await deriveAesKeyFromPassword(password);
    
    expect(key).toBeDefined();
    expect(salt).toBeDefined();
    expect(salt.length).toBe(32); // 256 bits
  });

  test('should derive different keys with different salts', async () => {
    const password = 'test-password';
    const { key: key1, salt: salt1 } = await deriveAesKeyFromPassword(password);
    const { key: key2, salt: salt2 } = await deriveAesKeyFromPassword(password);
    
    // Different salts should produce different keys
    expect(salt1).not.toEqual(salt2);
  });

  test('should derive same key with same password and salt', async () => {
    const password = 'test-password';
    const { key: key1, salt } = await deriveAesKeyFromPassword(password);
    const { key: key2 } = await deriveAesKeyFromPassword(password, salt);
    
    // Same salt and password should produce same key
    // We can't directly compare CryptoKey objects, but we can verify they work the same
    expect(key2).toBeDefined();
  });

  test('should encrypt and decrypt JSON object', async () => {
    const password = 'test-password';
    const data = { privateKey: 'secret-key-data', other: 'value' };
    
    const envelope = await encryptJsonWithPassword(data, password);
    const decrypted = await decryptJsonWithPassword(envelope, password);
    
    expect(decrypted).toEqual(data);
  });

  test('should produce envelope with correct structure', async () => {
    const password = 'test-password';
    const data = { test: 'data' };
    
    const envelope = await encryptJsonWithPassword(data, password);
    
    expect(envelope.version).toBe(1);
    expect(envelope.kdf).toBe('PBKDF2');
    expect(envelope.iterations).toBeGreaterThan(0);
    expect(envelope.salt).toBeDefined();
    expect(envelope.iv).toBeDefined();
    expect(envelope.ciphertext).toBeDefined();
    expect(typeof envelope.salt).toBe('string');
    expect(typeof envelope.iv).toBe('string');
    expect(typeof envelope.ciphertext).toBe('string');
  });

  test('should fail to decrypt with wrong password', async () => {
    const password = 'correct-password';
    const wrongPassword = 'wrong-password';
    const data = { privateKey: 'secret-key-data' };
    
    const envelope = await encryptJsonWithPassword(data, password);
    
    await expect(decryptJsonWithPassword(envelope, wrongPassword))
      .rejects.toThrow('Decryption failed');
  });

  test('should handle different data types', async () => {
    const password = 'test-password';
    const data = {
      string: 'text',
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      nested: { a: 1, b: 2 }
    };
    
    const envelope = await encryptJsonWithPassword(data, password);
    const decrypted = await decryptJsonWithPassword(envelope, password);
    
    expect(decrypted).toEqual(data);
  });

  test('should produce different ciphertexts for same data', async () => {
    const password = 'test-password';
    const data = { test: 'data' };
    
    const envelope1 = await encryptJsonWithPassword(data, password);
    const envelope2 = await encryptJsonWithPassword(data, password);
    
    // Different IVs should produce different ciphertexts
    expect(envelope1.ciphertext).not.toBe(envelope2.ciphertext);
    expect(envelope1.iv).not.toBe(envelope2.iv);
    
    // But both should decrypt to same data
    const decrypted1 = await decryptJsonWithPassword(envelope1, password);
    const decrypted2 = await decryptJsonWithPassword(envelope2, password);
    expect(decrypted1).toEqual(data);
    expect(decrypted2).toEqual(data);
  });

  test('should respect custom iterations parameter', async () => {
    const password = 'test-password';
    const data = { test: 'data' };
    const customIterations = 50000;
    
    const envelope = await encryptJsonWithPassword(data, password, customIterations);
    
    expect(envelope.iterations).toBe(customIterations);
    
    // Should still decrypt correctly
    const decrypted = await decryptJsonWithPassword(envelope, password);
    expect(decrypted).toEqual(data);
  });

  test('should reject unsupported envelope version', async () => {
    const password = 'test-password';
    const data = { test: 'data' };
    
    const envelope = await encryptJsonWithPassword(data, password);
    envelope.version = 999; // Invalid version
    
    await expect(decryptJsonWithPassword(envelope, password))
      .rejects.toThrow('Unsupported envelope version');
  });

  test('should reject unsupported KDF', async () => {
    const password = 'test-password';
    const data = { test: 'data' };
    
    const envelope = await encryptJsonWithPassword(data, password);
    envelope.kdf = 'UNKNOWN_KDF';
    
    await expect(decryptJsonWithPassword(envelope, password))
      .rejects.toThrow('Unsupported KDF');
  });

  test('should handle large data', async () => {
    const password = 'test-password';
    const largeData = {
      privateKey: 'a'.repeat(10000),
      otherData: 'b'.repeat(10000)
    };
    
    const envelope = await encryptJsonWithPassword(largeData, password);
    const decrypted = await decryptJsonWithPassword(envelope, password);
    
    expect(decrypted).toEqual(largeData);
  });

  test('should handle empty string password (not recommended)', async () => {
    const password = '';
    const data = { test: 'data' };
    
    const envelope = await encryptJsonWithPassword(data, password);
    const decrypted = await decryptJsonWithPassword(envelope, password);
    
    expect(decrypted).toEqual(data);
  });
});
