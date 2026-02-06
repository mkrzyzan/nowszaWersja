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

- Start a node and connect to existing peer(s):

  `bun run src/index.ts --peer localhost:3000`
  
  or with multiple peers:
  
  `PORT=4000 bun run src/index.ts --peer 3000 --peer localhost:5000`

  You can also use the short form `-p`:
  
  `PORT=4000 bun run src/index.ts -p 3000`

### CLI wallet (run & examples)
- Send a transaction using the bundled wallet (creates/uses a local keyfile):

  `bun run cli/wallet.ts <toAddress> <amount>`

- Example (default node):

  `bun run cli/wallet.ts bob 50`

- Example (custom node and keyfile):

  `NODE_ENDPOINT=http://localhost:4000 WALLET_KEY_FILE=~/.grosik_wallet.json bun run cli/wallet.ts bob 50`

- To force key regeneration without prompt:

  `bun run cli/wallet.ts bob 50 --force`

## What the wallet does (short)
- Derives sender address from the public key, signs transaction data (from,to,amount,timestamp) with ECDSA (prime256v1), and POSTs the signed JSON to the node’s /transactions endpoint. The node validates and gossips valid transactions.

## Tips
- Health check: GET /health
- Simulate a network by running multiple nodes on different PORTs and connecting them using the `--peer` flag.
- You can also manually exchange gossip messages via /gossip endpoint.
- Keep WALLET_KEY_FILE to maintain a stable address between runs.
- This project is in-memory and educational — not production-grade.

## License & contact
- MIT — issues and PRs welcome.
