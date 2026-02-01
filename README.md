# GROSIK

**G**ossip-based **R**eliable **O**n-chain **S**ortition-enabled **I**nfrastructure for **K**onsensus

A simple, lightweight mini blockchain node implementation written in TypeScript and running on Bun.

## Overview

GROSIK is a functional blockchain node that demonstrates core blockchain concepts while maintaining extreme simplicity. It delegates cryptographic sortition to the DRAND network, making it lightweight and secure.

## Features

- **TypeScript Implementation**: Modern, type-safe code running on Bun runtime
- **Transaction Signatures**: Mandatory cryptographic signatures on all transactions
- **DRAND Integration**: Uses DRAND public randomness beacon for validator selection
- **Proof of Stake**: Prevents Sybil attacks by requiring validators to stake tokens
- **Gossip Protocol**: Simple peer-to-peer communication for block and transaction propagation
- **5-Minute Block Time**: Aligned with DRAND beacon timestamps for efficient consensus
- **Cryptographic Sortition**: Fair and verifiable validator selection using DRAND randomness
- **Free Transaction Rules**: No restrictions on transaction amounts, only signature validation required

## Architecture

### Core Components

1. **Blockchain** (`src/blockchain.ts`)
   - Manages the chain of blocks
   - Validates blocks and chain integrity
   - Handles pending transactions

2. **Block** (`src/block.ts`)
   - Block structure and validation
   - Hash calculation
   - Genesis block creation

3. **Proof of Stake** (`src/pos.ts`)
   - Stake management
   - Validator eligibility checking
   - Weighted random validator selection

4. **DRAND Client** (`src/drand.ts`)
   - Fetches randomness beacons from DRAND network
   - Provides verifiable randomness for validator selection

5. **Gossip Protocol** (`src/gossip.ts`)
   - Peer discovery and management
   - Message broadcasting
   - Network communication

6. **Node** (`src/node.ts`)
   - Main node orchestration
   - Block production
   - Transaction handling

## How It Works

### Validator Selection

1. Every 5 minutes, the node fetches the latest DRAND beacon
2. The beacon's randomness is used as input to the Proof of Stake algorithm
3. A validator is selected with probability proportional to their stake
4. The selected validator creates the next block

### Block Creation

1. The selected validator collects pending transactions
2. Creates a new block with DRAND round number and signature
3. Broadcasts the block to all peers via gossip protocol
4. Other nodes validate and add the block to their chain

### Consensus

- **Cryptographic Sortition**: DRAND provides unpredictable, verifiable randomness
- **Proof of Stake**: Ensures validators have skin in the game
- **Longest Chain Rule**: Nodes accept the longest valid chain

## Installation

### Prerequisites

- [Bun](https://bun.sh/) runtime installed

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd nowszaWersja

# Install dependencies
bun install

# Run the node
bun start
```

## Usage

### Starting a Node

```bash
bun start
```

The node will:
- Initialize the blockchain with a genesis block
- Connect to the DRAND network
- Start attempting to create blocks every 5 minutes
- Display current state every 30 seconds

### Environment Variables

- `PORT`: Port for peer communication (default: 3000)

### Development

```bash
# Run in watch mode (auto-restart on changes)
bun run dev

# Run tests
bun test
```

## Project Structure

```
nowszaWersja/
├── src/
│   ├── index.ts        # Main entry point
│   ├── node.ts         # Node implementation
│   ├── blockchain.ts   # Blockchain logic
│   ├── block.ts        # Block implementation
│   ├── pos.ts          # Proof of Stake
│   ├── drand.ts        # DRAND client
│   ├── gossip.ts       # Gossip protocol
│   ├── crypto.ts       # Cryptographic utilities
│   └── types.ts        # Type definitions
├── tests/              # Unit tests
├── package.json
├── tsconfig.json
└── README.md
```

## Technical Details

### Block Structure

```typescript
{
  index: number;           // Block number
  timestamp: number;       // Creation time
  transactions: [{         // List of transactions
    from: string;          // Sender address
    to: string;            // Recipient address
    amount: number;        // Amount to transfer
    timestamp: number;     // Transaction timestamp
    signature: string;     // Cryptographic signature (required)
  }];
  previousHash: string;    // Hash of previous block
  hash: string;            // This block's hash
  nonce: number;           // Nonce value
  validator: string;       // Validator address
  drandRound: number;      // DRAND round number
  drandSignature: string;  // DRAND signature
}
```

### Transaction Validation

All transactions in GROSIK must be signed. The validation process:

1. **Signature Required**: Every transaction must include a valid cryptographic signature
2. **Data Integrity**: The signature is verified against transaction data (from, to, amount, timestamp)
3. **Tamper Detection**: Any modification to the transaction after signing causes validation to fail
4. **Free Rules**: No restrictions on transaction amounts - zero, negative, or any value is accepted if properly signed

Example of creating a signed transaction:

```typescript
import { CryptoUtils } from './src/crypto';

const timestamp = Date.now();
const transactionData = CryptoUtils.getTransactionData('alice', 'bob', 100, timestamp);
const signature = CryptoUtils.sign(transactionData, 'alice'); // Sign with private key

const transaction = {
  from: 'alice',
  to: 'bob',
  amount: 100,
  timestamp,
  signature
};
```

### Security Features

- **Transaction Signatures**: All transactions must be cryptographically signed
- **Signature Verification**: Transactions are validated before being added to the blockchain
- **Proof of Stake**: Minimum stake requirement prevents spam
- **DRAND Randomness**: Unpredictable, verifiable validator selection
- **Chain Validation**: Each block is validated against the previous
- **Hash Verification**: Blocks are identified by cryptographic hashes

## Limitations & Future Improvements

This is a simplified implementation for educational purposes. For production use, consider:

- Persistent storage (currently in-memory)
- Actual network sockets (currently simulated)
- ✅ ~~Transaction signatures and verification~~ (Now implemented!)
- Public/private key infrastructure with proper key management
- Advanced consensus mechanisms
- Byzantine fault tolerance
- Network partition handling
- Enhanced security measures

## Testing

Unit tests are provided for core components:

```bash
bun test
```

Tests cover:
- Blockchain operations
- Block validation
- Proof of Stake mechanisms
- Validator selection
- DRAND integration
- Gossip protocol
- **Transaction signature validation**
- **Signature verification and tamper detection**

## Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript best practices
- All tests pass
- New features include tests
- Documentation is updated

## License

MIT

## Acknowledgments

- [DRAND](https://drand.love/) - Distributed randomness beacon
- [Bun](https://bun.sh/) - Fast JavaScript runtime
- The blockchain community for inspiration and research

## Contact

For questions or issues, please open an issue on GitHub.

---

**GROSIK** - Simple, lightweight, and functional blockchain for learning and experimentation.
