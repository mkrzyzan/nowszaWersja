/**
 * Encryption utilities using Web Crypto API
 * Provides AES-256-GCM encryption with PBKDF2 key derivation
 */

export interface EncryptedEnvelope {
  version: number;
  kdf: string;
  iterations: number;
  salt: string; // base64
  iv: string; // base64
  ciphertext: string; // base64
}

const DEFAULT_ITERATIONS = 100000;
const SALT_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Derive an AES-256 key from a password using PBKDF2
 */
export async function deriveAesKeyFromPassword(
  password: string,
  salt?: Uint8Array,
  iterations: number = DEFAULT_ITERATIONS
): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  // Generate salt if not provided
  const saltBytes = salt || crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Convert password to key material
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-256-GCM key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return { key, salt: saltBytes };
}

/**
 * Encrypt a JSON object with a password
 */
export async function encryptJsonWithPassword(
  obj: any,
  password: string,
  iterations: number = DEFAULT_ITERATIONS
): Promise<EncryptedEnvelope> {
  // Derive encryption key
  const { key, salt } = await deriveAesKeyFromPassword(password, undefined, iterations);

  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt the JSON data
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(obj));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  // Convert to base64 for storage
  const saltBase64 = bufferToBase64(salt);
  const ivBase64 = bufferToBase64(iv);
  const ciphertextBase64 = bufferToBase64(new Uint8Array(ciphertext));

  return {
    version: 1,
    kdf: 'PBKDF2',
    iterations,
    salt: saltBase64,
    iv: ivBase64,
    ciphertext: ciphertextBase64
  };
}

/**
 * Decrypt a JSON object from an encrypted envelope
 */
export async function decryptJsonWithPassword(
  envelope: EncryptedEnvelope,
  password: string
): Promise<any> {
  // Validate envelope version
  if (envelope.version !== 1) {
    throw new Error(`Unsupported envelope version: ${envelope.version}`);
  }

  if (envelope.kdf !== 'PBKDF2') {
    throw new Error(`Unsupported KDF: ${envelope.kdf}`);
  }

  // Decode from base64
  const salt = base64ToBuffer(envelope.salt);
  const iv = base64ToBuffer(envelope.iv);
  const ciphertext = base64ToBuffer(envelope.ciphertext);

  // Derive decryption key
  const { key } = await deriveAesKeyFromPassword(password, salt, envelope.iterations);

  // Decrypt
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const json = decoder.decode(plaintext);
    return JSON.parse(json);
  } catch (error) {
    throw new Error('Decryption failed - incorrect password or corrupted data');
  }
}

/**
 * Convert buffer to base64 string
 */
function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to buffer
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}
