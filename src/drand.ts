/**
 * DRAND client for cryptographic sortition
 * Uses the DRAND public randomness beacon for validator selection
 */

import type { DrandBeacon } from './types';

export class DrandClient {
  private readonly chainHash = '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce'; // quicknet mainnet
  private readonly baseUrl = 'https://api.drand.sh';
  
  /**
   * Fetch the latest DRAND beacon
   */
  async getLatestBeacon(): Promise<DrandBeacon> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.chainHash}/public/latest`);
      if (!response.ok) {
        throw new Error(`DRAND API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch DRAND beacon:', error);
      throw error;
    }
  }

  /**
   * Fetch a specific DRAND round
   */
  async getBeaconByRound(round: number): Promise<DrandBeacon> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.chainHash}/public/${round}`);
      if (!response.ok) {
        throw new Error(`DRAND API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch DRAND beacon for round ${round}:`, error);
      throw error;
    }
  }

  /**
   * Get chain information
   */
  async getChainInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.chainHash}/info`);
      if (!response.ok) {
        throw new Error(`DRAND API error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch DRAND chain info:', error);
      throw error;
    }
  }
}
