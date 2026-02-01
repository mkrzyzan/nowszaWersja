/**
 * Cryptographic utilities for GROSIK
 */

import crypto from 'crypto';

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

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
   * Generate an ECDSA key pair for signing and verification
   */
  static generateKeyPair(): KeyPair {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1', // NIST P-256 curve, widely supported
      publicKeyEncoding: {
        type: 'spki',
        format: 'der'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der'
      }
    });

    return {
      privateKey: privateKey.toString('hex'),
      publicKey: publicKey.toString('hex')
    };
  }

  /**
   * Derive an address from a public key
   */
  static getAddressFromPublicKey(publicKey: string): string {
    // Hash the public key and take first 40 characters (20 bytes)
    const hash = this.hash(publicKey);
    return hash.substring(0, 40);
  }

  /**
   * Sign data using ECDSA with a private key
   */
  static sign(data: string, privateKeyHex: string): string {
    const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
    const privateKeyObject = crypto.createPrivateKey({
      key: privateKeyBuffer,
      format: 'der',
      type: 'pkcs8'
    });

    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();

    const signature = sign.sign(privateKeyObject);
    return signature.toString('hex');
  }

  /**
   * Verify a signature using ECDSA with a public key
   */
  static verify(data: string, signature: string, publicKeyHex: string): boolean {
    try {
      const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
      const publicKeyObject = crypto.createPublicKey({
        key: publicKeyBuffer,
        format: 'der',
        type: 'spki'
      });

      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      verify.end();

      const signatureBuffer = Buffer.from(signature, 'hex');
      return verify.verify(publicKeyObject, signatureBuffer);
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Generate transaction data string for signing
   */
  static getTransactionData(from: string, to: string, amount: number, timestamp: number): string {
    return JSON.stringify({ from, to, amount, timestamp });
  }
}
