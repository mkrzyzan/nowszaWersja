/**
 * Proof of Stake mechanism for GROSIK
 * Prevents Sybil attacks by requiring validators to stake tokens
 */

import type { Stake } from './types';
import { CryptoUtils } from './crypto';

export class ProofOfStake {
  private stakes: Map<string, number> = new Map();
  private readonly minimumStake = 100; // Minimum stake required to be a validator

  /**
   * Add or update a stake for an address
   */
  addStake(address: string, amount: number): void {
    if (amount < 0) {
      throw new Error('Stake amount must be positive');
    }

    const currentStake = this.stakes.get(address) || 0;
    this.stakes.set(address, currentStake + amount);
  }

  /**
   * Remove stake from an address
   */
  removeStake(address: string, amount: number): void {
    const currentStake = this.stakes.get(address) || 0;
    
    if (amount > currentStake) {
      throw new Error(`Insufficient stake: attempting to remove ${amount} but only ${currentStake} available`);
    }

    const newStake = currentStake - amount;
    if (newStake === 0) {
      this.stakes.delete(address);
    } else {
      this.stakes.set(address, newStake);
    }
  }

  /**
   * Get the stake for an address
   */
  getStake(address: string): number {
    return this.stakes.get(address) || 0;
  }

  /**
   * Get all stakes
   */
  getAllStakes(): Stake[] {
    return Array.from(this.stakes.entries()).map(([address, amount]) => ({
      address,
      amount
    }));
  }

  /**
   * Get total staked amount
   */
  getTotalStake(): number {
    return Array.from(this.stakes.values()).reduce((sum, stake) => sum + stake, 0);
  }

  /**
   * Check if an address is eligible to be a validator
   */
  isValidator(address: string): boolean {
    const stake = this.getStake(address);
    return stake >= this.minimumStake;
  }

  /**
   * Select a validator based on DRAND randomness and stake weights
   * Uses weighted random selection where probability is proportional to stake
   */
  selectValidator(randomness: string): string | null {
    const validators = this.getAllStakes().filter(stake => stake.amount >= this.minimumStake);
    
    if (validators.length === 0) {
      return null;
    }

    const totalStake = validators.reduce((sum, stake) => sum + stake.amount, 0);
    
    // Convert DRAND randomness to a number using the full hex string for better distribution
    // Take first 16 hex characters to get a 64-bit number, then use BigInt for precision
    const hexValue = randomness.substring(0, 16);
    const randomBigInt = BigInt('0x' + hexValue);
    const totalStakeBigInt = BigInt(totalStake);
    
    // Scale the random value proportionally to avoid modulo bias
    const randomValue = Number((randomBigInt * totalStakeBigInt) / BigInt('0xFFFFFFFFFFFFFFFF'));
    
    let cumulativeStake = 0;
    for (const validator of validators) {
      cumulativeStake += validator.amount;
      if (randomValue < cumulativeStake) {
        return validator.address;
      }
    }

    // Fallback to last validator (should not happen)
    return validators[validators.length - 1].address;
  }

  /**
   * Get minimum stake requirement
   */
  getMinimumStake(): number {
    return this.minimumStake;
  }
}
