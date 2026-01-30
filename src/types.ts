/**
 * Core type definitions for GROSIK blockchain
 */

export interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  validator: string;
  drandRound: number;
  drandSignature: string;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  signature?: string;
}

export interface Stake {
  address: string;
  amount: number;
}

export interface Peer {
  id: string;
  address: string;
  port: number;
  lastSeen: number;
}

export interface NetworkMessage {
  type: 'BLOCK' | 'TRANSACTION' | 'PEER_DISCOVERY' | 'STAKE_UPDATE';
  payload: any;
  sender: string;
  timestamp: number;
}

export interface DrandBeacon {
  round: number;
  randomness: string;
  signature: string;
  previous_signature: string;
}
