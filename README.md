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
- Clone and install: `git clone <repo> && cd grosik && bun install`

### Run a node (examples)

**Single node (standalone):**
```bash
bun run src/index.ts
```
This starts a node on HTTP port 3000 and libp2p port 4000 (default).

**Two nodes connected to each other:**

Terminal 1 (first node):
```bash
PORT=3000 bun run src/index.ts
```

Terminal 2 (second node connecting to first):
```bash
PORT=3001 bun run src/index.ts --peer localhost:3000
```

**Three nodes forming a network:**

Terminal 1:
```bash
PORT=3000 bun run src/index.ts
```

Terminal 2:
```bash
PORT=3001 bun run src/index.ts --peer localhost:3000
```

Terminal 3:
```bash
PORT=3002 bun run src/index.ts --peer localhost:3000
```

**Custom ports:**
- Use `PORT=<number>` to set the HTTP port (for transaction submissions)
- libp2p port is automatically set to `PORT + 1000` by default
- Override libp2p port with `LIBP2P_PORT=<number>` if needed

Examples:
```bash
# Custom HTTP port (libp2p will use 5500)
PORT=4500 bun run src/index.ts

# Custom both HTTP and libp2p ports
PORT=4500 LIBP2P_PORT=9000 bun run src/index.ts

# Connect to peer with custom port
PORT=3001 bun run src/index.ts --peer localhost:3000
```

**Short form for peer flag:**
```bash
PORT=3001 bun run src/index.ts -p localhost:3000
```

**Multiple bootstrap peers:**
```bash
PORT=3002 bun run src/index.ts --peer localhost:3000 --peer localhost:3001
```

**Multi-machine deployments:**
```bash
# On machine 1 (192.168.1.100)
PORT=3000 NODE_ADDRESS=192.168.1.100 bun run src/index.ts

# On machine 2 (192.168.1.101) connecting to machine 1
PORT=3000 NODE_ADDRESS=192.168.1.101 bun run src/index.ts --peer 192.168.1.100:3000
```

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

## How it works (libp2p gossip)

**Port architecture:**
- **HTTP port** (default 3000): Accepts transaction submissions from wallet CLI
- **libp2p port** (default 4000): Handles peer-to-peer gossip protocol

**Peer discovery:**
- Nodes use **libp2p gossipsub** for message propagation
- **mDNS** discovers peers on local network automatically
- **Kad-DHT** enables distributed peer discovery
- Provide `--peer` flag to explicitly connect to bootstrap peers

**Connection flow:**
1. Node A starts on port 3000 (HTTP) and 4000 (libp2p)
2. Node B starts on port 3001 and connects to `localhost:3000`
3. Node B calculates Node A's libp2p port: 3000 + 1000 = 4000
4. Node B's libp2p connects to Node A's libp2p on port 4000
5. Both nodes subscribe to gossipsub topics: `/grosik/block`, `/grosik/transaction`, etc.
6. Messages published to topics are automatically propagated to all connected peers

**Message propagation:**
- Blocks, transactions, and peer discovery messages are broadcast via gossipsub
- Built-in deduplication prevents processing the same message twice
- Encryption and authentication handled by libp2p Noise protocol

## Tips
- Health check: `curl http://localhost:3000/health`
- Check peer connections: Look for "Peer connected" messages in the logs
- Simulate a network: Run multiple nodes on different PORTs with the `--peer` flag
- Keep WALLET_KEY_FILE to maintain a stable address between runs
- This project is in-memory and educational — not production-grade

## License & contact
- MIT — issues and PRs welcome.
