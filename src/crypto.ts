/**
 * Cryptographic utilities for GROSIK
 * Now using Web Crypto API (crypto.subtle)
 */

import crypto from 'crypto';

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

/**
 * Convert buffer to hex string
 */
function bufToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Convert hex string to buffer
 */
function hexToBuf(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
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
   * Now using Web Crypto API with P-256 curve
   */
  static async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await globalThis.crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256' // Same as prime256v1
      },
      true, // extractable
      ['sign', 'verify']
    );

    // Export private key as PKCS8 DER format
    const privateKeyDer = await globalThis.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const privateKeyHex = bufToHex(privateKeyDer);

    // Export public key as SPKI DER format
    const publicKeyDer = await globalThis.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyHex = bufToHex(publicKeyDer);

    return {
      privateKey: privateKeyHex,
      publicKey: publicKeyHex
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
   * Now using Web Crypto API
   */
  static async sign(data: string, privateKeyHex: string): Promise<string> {
    // Import private key from hex DER format
    const privateKeyBuffer = hexToBuf(privateKeyHex);
    const privateKey = await globalThis.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false,
      ['sign']
    );

    // Sign the data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const signature = await globalThis.crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      privateKey,
      dataBuffer
    );

    return bufToHex(signature);
  }

  /**
   * Verify a signature using ECDSA with a public key
   * Now using Web Crypto API
   */
  static async verify(data: string, signature: string, publicKeyHex: string): Promise<boolean> {
    try {
      // Import public key from hex DER format
      const publicKeyBuffer = hexToBuf(publicKeyHex);
      const publicKey = await globalThis.crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        false,
        ['verify']
      );

      // Verify the signature
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const signatureBuffer = hexToBuf(signature);

      return await globalThis.crypto.subtle.verify(
        {
          name: 'ECDSA',
          hash: { name: 'SHA-256' }
        },
        publicKey,
        signatureBuffer,
        dataBuffer
      );
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
