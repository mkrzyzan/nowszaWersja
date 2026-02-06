/**
 * Tests for Transaction signature validation
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { Blockchain } from '../src/blockchain';
import { CryptoUtils } from '../src/crypto';
import type { Transaction } from '../src/types';

describe('Transaction Signature Validation', () => {
  let blockchain: Blockchain;

  beforeEach(() => {
    blockchain = new Blockchain();
  });

  test('should accept transaction with valid signature', async () => {
    const keyPair = await CryptoUtils.generateKeyPair();
    const from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData(from, 'bob', 100, timestamp);
    const signature = await CryptoUtils.sign(transactionData, keyPair.privateKey);

    const tx: Transaction = {
      from,
      to: 'bob',
      amount: 100,
      timestamp,
      signature,
      publicKey: keyPair.publicKey
    };

    await blockchain.addTransaction(tx);
    const pending = blockchain.getPendingTransactions();
    
    expect(pending).toHaveLength(1);
    expect(pending[0]).toEqual(tx);
  });

  test('should reject transaction with missing signature', async () => {
    const keyPair = await CryptoUtils.generateKeyPair();
    const from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    
    const tx: Transaction = {
      from,
      to: 'bob',
      amount: 100,
      timestamp: Date.now(),
      signature: '',
      publicKey: keyPair.publicKey
    };

    await expect(blockchain.addTransaction(tx)).rejects.toThrow('Invalid transaction: signature verification failed');
  });

  test('should reject transaction with invalid signature', async () => {
    const keyPair = await CryptoUtils.generateKeyPair();
    const from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    const timestamp = Date.now();
    
    const tx: Transaction = {
      from,
      to: 'bob',
      amount: 100,
      timestamp,
      signature: 'invalid-signature-123',
      publicKey: keyPair.publicKey
    };

    await expect(blockchain.addTransaction(tx)).rejects.toThrow('Invalid transaction: signature verification failed');
  });

  test('should reject transaction with signature from wrong key', async () => {
    const keyPair1 = await CryptoUtils.generateKeyPair();
    const keyPair2 = await CryptoUtils.generateKeyPair();
    const from = CryptoUtils.getAddressFromPublicKey(keyPair1.publicKey);
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData(from, 'bob', 100, timestamp);
    const signature = await CryptoUtils.sign(transactionData, keyPair2.privateKey); // Wrong key!

    const tx: Transaction = {
      from,
      to: 'bob',
      amount: 100,
      timestamp,
      signature,
      publicKey: keyPair1.publicKey
    };

    await expect(blockchain.addTransaction(tx)).rejects.toThrow('Invalid transaction: signature verification failed');
  });

  test('should reject transaction if amount is tampered after signing', async () => {
    const keyPair = await CryptoUtils.generateKeyPair();
    const from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData(from, 'bob', 100, timestamp);
    const signature = await CryptoUtils.sign(transactionData, keyPair.privateKey);

    const tx: Transaction = {
      from,
      to: 'bob',
      amount: 1000, // Amount changed after signing!
      timestamp,
      signature,
      publicKey: keyPair.publicKey
    };

    await expect(blockchain.addTransaction(tx)).rejects.toThrow('Invalid transaction: signature verification failed');
  });

  test('should reject transaction if recipient is changed after signing', async () => {
    const keyPair = await CryptoUtils.generateKeyPair();
    const from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData(from, 'bob', 100, timestamp);
    const signature = await CryptoUtils.sign(transactionData, keyPair.privateKey);

    const tx: Transaction = {
      from,
      to: 'eve', // Recipient changed after signing!
      amount: 100,
      timestamp,
      signature,
      publicKey: keyPair.publicKey
    };

    await expect(blockchain.addTransaction(tx)).rejects.toThrow('Invalid transaction: signature verification failed');
  });

  test('should accept multiple valid transactions', async () => {
    const keyPair1 = await CryptoUtils.generateKeyPair();
    const from1 = CryptoUtils.getAddressFromPublicKey(keyPair1.publicKey);
    const timestamp1 = Date.now();
    const transactionData1 = CryptoUtils.getTransactionData(from1, 'bob', 100, timestamp1);
    const signature1 = await CryptoUtils.sign(transactionData1, keyPair1.privateKey);

    const tx1: Transaction = {
      from: from1,
      to: 'bob',
      amount: 100,
      timestamp: timestamp1,
      signature: signature1,
      publicKey: keyPair1.publicKey
    };

    const keyPair2 = await CryptoUtils.generateKeyPair();
    const from2 = CryptoUtils.getAddressFromPublicKey(keyPair2.publicKey);
    const timestamp2 = Date.now() + 1000;
    const transactionData2 = CryptoUtils.getTransactionData(from2, 'charlie', 50, timestamp2);
    const signature2 = await CryptoUtils.sign(transactionData2, keyPair2.privateKey);

    const tx2: Transaction = {
      from: from2,
      to: 'charlie',
      amount: 50,
      timestamp: timestamp2,
      signature: signature2,
      publicKey: keyPair2.publicKey
    };

    await blockchain.addTransaction(tx1);
    await blockchain.addTransaction(tx2);
    
    const pending = blockchain.getPendingTransactions();
    expect(pending).toHaveLength(2);
    expect(pending[0]).toEqual(tx1);
    expect(pending[1]).toEqual(tx2);
  });

  test('should validate transaction with isValidTransaction method', async () => {
    const keyPair = await CryptoUtils.generateKeyPair();
    const from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData(from, 'bob', 100, timestamp);
    const signature = await CryptoUtils.sign(transactionData, keyPair.privateKey);

    const validTx: Transaction = {
      from,
      to: 'bob',
      amount: 100,
      timestamp,
      signature,
      publicKey: keyPair.publicKey
    };

    const invalidTx: Transaction = {
      from,
      to: 'bob',
      amount: 100,
      timestamp,
      signature: 'wrong-signature',
      publicKey: keyPair.publicKey
    };

    expect(await blockchain.isValidTransaction(validTx)).toBe(true);
    expect(await blockchain.isValidTransaction(invalidTx)).toBe(false);
  });

  test('should accept transactions with any amount (free transaction rules)', async () => {
    // Test zero amount
    let keyPair = await CryptoUtils.generateKeyPair();
    let from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    let timestamp = Date.now();
    let transactionData = CryptoUtils.getTransactionData(from, 'bob', 0, timestamp);
    let signature = await CryptoUtils.sign(transactionData, keyPair.privateKey);
    let tx: Transaction = {
      from,
      to: 'bob',
      amount: 0,
      timestamp,
      signature,
      publicKey: keyPair.publicKey
    };
    await blockchain.addTransaction(tx);
    expect(blockchain.getPendingTransactions()).toHaveLength(1);

    // Test large amount
    keyPair = await CryptoUtils.generateKeyPair();
    from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    timestamp = Date.now() + 1;
    transactionData = CryptoUtils.getTransactionData(from, 'bob', 1000000, timestamp);
    signature = await CryptoUtils.sign(transactionData, keyPair.privateKey);
    tx = {
      from,
      to: 'bob',
      amount: 1000000,
      timestamp,
      signature,
      publicKey: keyPair.publicKey
    };
    await blockchain.addTransaction(tx);
    expect(blockchain.getPendingTransactions()).toHaveLength(2);

    // Test negative amount (still accepted if signed)
    keyPair = await CryptoUtils.generateKeyPair();
    from = CryptoUtils.getAddressFromPublicKey(keyPair.publicKey);
    timestamp = Date.now() + 2;
    transactionData = CryptoUtils.getTransactionData(from, 'bob', -50, timestamp);
    signature = await CryptoUtils.sign(transactionData, keyPair.privateKey);
    tx = {
      from,
      to: 'bob',
      amount: -50,
      timestamp,
      signature,
      publicKey: keyPair.publicKey
    };
    await blockchain.addTransaction(tx);
    expect(blockchain.getPendingTransactions()).toHaveLength(3);
  });

  test('should reject transaction with mismatched from address and public key', async () => {
    const keyPair = await CryptoUtils.generateKeyPair();
    const wrongAddress = 'wrong-address-that-doesnt-match';
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData(wrongAddress, 'bob', 100, timestamp);
    const signature = await CryptoUtils.sign(transactionData, keyPair.privateKey);

    const tx: Transaction = {
      from: wrongAddress,
      to: 'bob',
      amount: 100,
      timestamp,
      signature,
      publicKey: keyPair.publicKey
    };

    await expect(blockchain.addTransaction(tx)).rejects.toThrow('Invalid transaction: signature verification failed');
  });

  test('should reject transaction with missing public key', async () => {
    const tx: Transaction = {
      from: 'alice',
      to: 'bob',
      amount: 100,
      timestamp: Date.now(),
      signature: 'some-signature',
      publicKey: ''
    };

    await expect(blockchain.addTransaction(tx)).rejects.toThrow('Invalid transaction: signature verification failed');
  });
});

describe('CryptoUtils Signature Methods', () => {
  test('should verify correct signature', async () => {
    const data = 'test data';
    const keyPair = await CryptoUtils.generateKeyPair();
    const signature = await CryptoUtils.sign(data, keyPair.privateKey);

    expect(await CryptoUtils.verify(data, signature, keyPair.publicKey)).toBe(true);
  });

  test('should reject incorrect signature', async () => {
    const data = 'test data';
    const keyPair = await CryptoUtils.generateKeyPair();
    const wrongSignature = 'wrong-signature';

    expect(await CryptoUtils.verify(data, wrongSignature, keyPair.publicKey)).toBe(false);
  });

  test('should reject signature with wrong key', async () => {
    const data = 'test data';
    const keyPair1 = await CryptoUtils.generateKeyPair();
    const keyPair2 = await CryptoUtils.generateKeyPair();
    const signature = await CryptoUtils.sign(data, keyPair1.privateKey);

    expect(await CryptoUtils.verify(data, signature, keyPair2.publicKey)).toBe(false);
  });

  test('should generate consistent transaction data', () => {
    const data1 = CryptoUtils.getTransactionData('alice', 'bob', 100, 12345);
    const data2 = CryptoUtils.getTransactionData('alice', 'bob', 100, 12345);

    expect(data1).toBe(data2);
  });

  test('should generate different transaction data for different inputs', () => {
    const data1 = CryptoUtils.getTransactionData('alice', 'bob', 100, 12345);
    const data2 = CryptoUtils.getTransactionData('alice', 'bob', 200, 12345);
    const data3 = CryptoUtils.getTransactionData('alice', 'charlie', 100, 12345);
    const data4 = CryptoUtils.getTransactionData('bob', 'alice', 100, 12345);

    expect(data1).not.toBe(data2);
    expect(data1).not.toBe(data3);
    expect(data1).not.toBe(data4);
  });
});
