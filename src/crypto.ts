/**
 * Cryptographic utilities for GROSIK
 */

import crypto from 'crypto';

export class CryptoUtils {
  /**
   * Calculate SHA-256 hash of input data
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate a unique node ID based on timestamp and random data
   */
  static generateNodeId(): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    return this.hash(timestamp + random);
  }

  /**
   * Verify if a hash meets the required difficulty (for basic validation)
   */
  static verifyHashDifficulty(hash: string, difficulty: number): boolean {
    const prefix = '0'.repeat(difficulty);
    return hash.startsWith(prefix);
  }

  /**
   * Generate a simple signature (in production, use proper key pairs)
   */
  static sign(data: string, privateKey: string): string {
    return this.hash(data + privateKey);
  }

  /**
   * Verify a signature
   */
  static verify(data: string, signature: string, privateKey: string): boolean {
    const expectedSignature = this.sign(data, privateKey);
    return expectedSignature === signature;
  }

  /**
   * Generate transaction data string for signing
   */
  static getTransactionData(from: string, to: string, amount: number, timestamp: number): string {
    return JSON.stringify({ from, to, amount, timestamp });
  }
}
