```txt
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗ ██████╗  ██████╗ ███████╗██╗██╗  ██╗                ║
║  ██╔════╝ ██╔══██╗██╔═══██╗██╔════╝██║██║ ██╔╝                ║
║  ██║  ███╗██████╔╝██║   ██║███████╗██║█████╔╝                 ║
║  ██║   ██║██╔══██╗██║   ██║╚════██║██║██╔═██╗                 ║
║  ╚██████╔╝██║  ██║╚██████╔╝███████║██║██║  ██╗                ║
║   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═╝                ║
║                                                               ║
║  Gossip-based Reliable On-chain Sortition-enabled             ║
║  Infrastructure for Konsensus                                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

# GROSIK

Tiny, opinionated PoS node (TypeScript + Bun) demonstrating DRAND-powered sortition, gossip propagation and signed transactions — built for learning and fast prototyping.

## Why GROSIK?
- Readable, minimal node that shows how randomness (DRAND) + stake can drive validator selection.
- Signed transactions, simple gossip and an easy-to-run CLI wallet make experiments straightforward.

## Use cases
- Learn PoS, cryptographic sortition and gossip networking.
- Prototype validator selection and testnet ideas.
- Build demos or classroom exercises.

## Quickstart (Bun required)
- Clone and install: git clone <repo> && cd grosik && bun install

### Run a node (examples)
- Start default node (port 3000):

  `bun run src/index.ts`

- Start on custom port:

  `PORT=4000 bun run src/index.ts`

### CLI wallet (run & examples)
- Send a transaction using the bundled wallet (creates/uses a local keyfile):

  `bun run cli/wallet.ts <toAddress> <amount>`

- Example (default node):

  `bun run cli/wallet.ts bob 50`

- Example (custom node and keyfile):

  `NODE_ENDPOINT=http://localhost:4000 WALLET_KEY_FILE=~/.grosik_wallet.json bun run cli/wallet.ts bob 50`

- To force key regeneration without prompt (requires WALLET_PASSPHRASE env var):

  `WALLET_PASSPHRASE="my-secret-passphrase" bun run cli/wallet.ts bob 50 --force`

### Wallet Security
- **Encrypted Private Keys**: Wallet files now use AES-256-GCM encryption with PBKDF2 key derivation (100,000 iterations) to protect private keys.
- **Passphrase Protection**: The wallet will prompt you for a passphrase when creating or loading a wallet. You can also set the `WALLET_PASSPHRASE` environment variable to avoid prompts.
- **Legacy Wallet Migration**: Existing unencrypted wallet files will be detected and you'll be offered an option to upgrade them to the new encrypted format.
- **Wallet File Format**: The new encrypted wallet format (v1) stores the public key in plaintext and the private key in an encrypted envelope containing salt, IV, and ciphertext.

Example wallet file structure:
```json
{
  "version": 1,
  "publicKey": "3059301306...",
  "encryptedPrivateKey": {
    "version": 1,
    "kdf": "PBKDF2",
    "iterations": 100000,
    "salt": "base64-encoded-salt",
    "iv": "base64-encoded-iv",
    "ciphertext": "base64-encoded-encrypted-data"
  }
}
```

## What the wallet does (short)
- Derives sender address from the public key, signs transaction data (from,to,amount,timestamp) with ECDSA (P-256 curve using Web Crypto API), and POSTs the signed JSON to the node's /transactions endpoint. The node validates and gossips valid transactions.

## Cryptography
- **Key Generation**: ECDSA P-256 (prime256v1) curve using Web Crypto API
- **Signing**: ECDSA with SHA-256
- **Encryption**: AES-256-GCM with PBKDF2-derived keys
- **Key Format**: PKCS#8 (private) and SPKI (public) in DER format, hex-encoded

## Tips
- Health check: GET /health
- Simulate a network by running multiple nodes on different PORTs and exchanging gossip messages via /gossip.
- Keep WALLET_KEY_FILE to maintain a stable address between runs.
- This project is in-memory and educational — not production-grade.

## License & contact
- MIT — issues and PRs welcome.
