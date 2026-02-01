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

  test('should accept transaction with valid signature', () => {
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData('alice', 'bob', 100, timestamp);
    const signature = CryptoUtils.sign(transactionData, 'alice');

    const tx: Transaction = {
      from: 'alice',
      to: 'bob',
      amount: 100,
      timestamp,
      signature
    };

    blockchain.addTransaction(tx);
    const pending = blockchain.getPendingTransactions();
    
    expect(pending).toHaveLength(1);
    expect(pending[0]).toEqual(tx);
  });

  test('should reject transaction with missing signature', () => {
    const tx: Transaction = {
      from: 'alice',
      to: 'bob',
      amount: 100,
      timestamp: Date.now(),
      signature: ''
    };

    expect(() => blockchain.addTransaction(tx)).toThrow('Invalid transaction: signature verification failed');
  });

  test('should reject transaction with invalid signature', () => {
    const timestamp = Date.now();
    const tx: Transaction = {
      from: 'alice',
      to: 'bob',
      amount: 100,
      timestamp,
      signature: 'invalid-signature-123'
    };

    expect(() => blockchain.addTransaction(tx)).toThrow('Invalid transaction: signature verification failed');
  });

  test('should reject transaction with signature from wrong key', () => {
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData('alice', 'bob', 100, timestamp);
    const signature = CryptoUtils.sign(transactionData, 'eve'); // Signed by 'eve' not 'alice'

    const tx: Transaction = {
      from: 'alice',
      to: 'bob',
      amount: 100,
      timestamp,
      signature
    };

    expect(() => blockchain.addTransaction(tx)).toThrow('Invalid transaction: signature verification failed');
  });

  test('should reject transaction if amount is tampered after signing', () => {
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData('alice', 'bob', 100, timestamp);
    const signature = CryptoUtils.sign(transactionData, 'alice');

    const tx: Transaction = {
      from: 'alice',
      to: 'bob',
      amount: 1000, // Amount changed after signing!
      timestamp,
      signature
    };

    expect(() => blockchain.addTransaction(tx)).toThrow('Invalid transaction: signature verification failed');
  });

  test('should reject transaction if recipient is changed after signing', () => {
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData('alice', 'bob', 100, timestamp);
    const signature = CryptoUtils.sign(transactionData, 'alice');

    const tx: Transaction = {
      from: 'alice',
      to: 'eve', // Recipient changed after signing!
      amount: 100,
      timestamp,
      signature
    };

    expect(() => blockchain.addTransaction(tx)).toThrow('Invalid transaction: signature verification failed');
  });

  test('should accept multiple valid transactions', () => {
    const timestamp1 = Date.now();
    const transactionData1 = CryptoUtils.getTransactionData('alice', 'bob', 100, timestamp1);
    const signature1 = CryptoUtils.sign(transactionData1, 'alice');

    const tx1: Transaction = {
      from: 'alice',
      to: 'bob',
      amount: 100,
      timestamp: timestamp1,
      signature: signature1
    };

    const timestamp2 = Date.now() + 1000;
    const transactionData2 = CryptoUtils.getTransactionData('bob', 'charlie', 50, timestamp2);
    const signature2 = CryptoUtils.sign(transactionData2, 'bob');

    const tx2: Transaction = {
      from: 'bob',
      to: 'charlie',
      amount: 50,
      timestamp: timestamp2,
      signature: signature2
    };

    blockchain.addTransaction(tx1);
    blockchain.addTransaction(tx2);
    
    const pending = blockchain.getPendingTransactions();
    expect(pending).toHaveLength(2);
    expect(pending[0]).toEqual(tx1);
    expect(pending[1]).toEqual(tx2);
  });

  test('should validate transaction with isValidTransaction method', () => {
    const timestamp = Date.now();
    const transactionData = CryptoUtils.getTransactionData('alice', 'bob', 100, timestamp);
    const signature = CryptoUtils.sign(transactionData, 'alice');

    const validTx: Transaction = {
      from: 'alice',
      to: 'bob',
      amount: 100,
      timestamp,
      signature
    };

    const invalidTx: Transaction = {
      from: 'alice',
      to: 'bob',
      amount: 100,
      timestamp,
      signature: 'wrong-signature'
    };

    expect(blockchain.isValidTransaction(validTx)).toBe(true);
    expect(blockchain.isValidTransaction(invalidTx)).toBe(false);
  });

  test('should accept transactions with any amount (free transaction rules)', () => {
    // Test zero amount
    let timestamp = Date.now();
    let transactionData = CryptoUtils.getTransactionData('alice', 'bob', 0, timestamp);
    let signature = CryptoUtils.sign(transactionData, 'alice');
    let tx: Transaction = {
      from: 'alice',
      to: 'bob',
      amount: 0,
      timestamp,
      signature
    };
    blockchain.addTransaction(tx);
    expect(blockchain.getPendingTransactions()).toHaveLength(1);

    // Test large amount
    timestamp = Date.now() + 1;
    transactionData = CryptoUtils.getTransactionData('alice', 'bob', 1000000, timestamp);
    signature = CryptoUtils.sign(transactionData, 'alice');
    tx = {
      from: 'alice',
      to: 'bob',
      amount: 1000000,
      timestamp,
      signature
    };
    blockchain.addTransaction(tx);
    expect(blockchain.getPendingTransactions()).toHaveLength(2);

    // Test negative amount (still accepted if signed)
    timestamp = Date.now() + 2;
    transactionData = CryptoUtils.getTransactionData('alice', 'bob', -50, timestamp);
    signature = CryptoUtils.sign(transactionData, 'alice');
    tx = {
      from: 'alice',
      to: 'bob',
      amount: -50,
      timestamp,
      signature
    };
    blockchain.addTransaction(tx);
    expect(blockchain.getPendingTransactions()).toHaveLength(3);
  });
});

describe('CryptoUtils Signature Methods', () => {
  test('should verify correct signature', () => {
    const data = 'test data';
    const privateKey = 'my-private-key';
    const signature = CryptoUtils.sign(data, privateKey);

    expect(CryptoUtils.verify(data, signature, privateKey)).toBe(true);
  });

  test('should reject incorrect signature', () => {
    const data = 'test data';
    const privateKey = 'my-private-key';
    const wrongSignature = 'wrong-signature';

    expect(CryptoUtils.verify(data, wrongSignature, privateKey)).toBe(false);
  });

  test('should reject signature with wrong key', () => {
    const data = 'test data';
    const signature = CryptoUtils.sign(data, 'key1');

    expect(CryptoUtils.verify(data, signature, 'key2')).toBe(false);
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
