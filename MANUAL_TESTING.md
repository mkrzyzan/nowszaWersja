# Manual Testing Guide for Peer Bootstrap Feature

## Overview
This guide explains how to manually test the new peer bootstrap feature that allows nodes to connect to each other on startup.

## Prerequisites
- Bun runtime installed (`curl -fsSL https://bun.sh/install | bash`)
- Two or more terminal windows

## Test Scenario 1: Two Nodes with Bootstrap Connection

### Step 1: Start the first node (Bootstrap Node)
```bash
# Terminal 1
bun run src/index.ts
```

Expected output:
- Node should start on port 3000 (default)
- Should display node ID, address, and stake
- Connected Peers should show: 0

### Step 2: Start the second node with bootstrap peer
```bash
# Terminal 2
PORT=4000 bun run src/index.ts --peer localhost:3000
```

Expected output:
- Node should start on port 4000
- Should display "Attempting to connect to bootstrap peer: localhost:3000"
- Should display "✅ Successfully connected to bootstrap peer at localhost:3000"
- Should display "Added peer: ..." for the first node

### Step 3: Verify peer connections
In Terminal 1 (first node):
- After 30 seconds, check the "Connected Peers" count
- Should show: 1 peer (the second node should have been added via PEER_DISCOVERY handler)

In Terminal 2 (second node):
- After 30 seconds, check the "Connected Peers" count
- Should show: 1 peer (the bootstrap peer)

## Test Scenario 2: Three Nodes in a Chain

### Step 1: Start first node
```bash
# Terminal 1
bun run src/index.ts
```

### Step 2: Start second node connecting to first
```bash
# Terminal 2
PORT=4000 bun run src/index.ts --peer 3000
```

### Step 3: Start third node connecting to second
```bash
# Terminal 3
PORT=5000 bun run src/index.ts --peer 4000
```

Expected result:
- Node 1 should have 1 peer (Node 2)
- Node 2 should have 2 peers (Node 1 and Node 3)
- Node 3 should have 1 peer (Node 2)
- Eventually, gossip protocol should propagate peer information, and all nodes should know about each other

## Test Scenario 3: Multiple Bootstrap Peers

### Step 1: Start two bootstrap nodes
```bash
# Terminal 1
bun run src/index.ts

# Terminal 2
PORT=4000 bun run src/index.ts
```

### Step 2: Start a node connecting to both
```bash
# Terminal 3
PORT=5000 bun run src/index.ts --peer 3000 --peer 4000
```

Expected output:
- Third node should connect to both peers
- Should display two "✅ Successfully connected" messages
- Connected Peers should show: 2

## Test Scenario 4: Short-form Argument

Test using the `-p` short form:
```bash
PORT=4000 bun run src/index.ts -p 3000
```

Should work identically to `--peer 3000`

## Test Scenario 5: Port-only Format

Test using just the port number:
```bash
PORT=4000 bun run src/index.ts --peer 3000
```

Should connect to `localhost:3000` by default

## Test Scenario 6: Invalid Peer Connection

Test error handling:
```bash
PORT=4000 bun run src/index.ts --peer localhost:9999
```

Expected output:
- Should display error message about failed connection
- Node should still start successfully
- Connected Peers should show: 0

## Verification Checklist

After running tests, verify:
- [ ] Nodes can start without `--peer` argument
- [ ] Nodes can connect to a single bootstrap peer
- [ ] Nodes can connect to multiple bootstrap peers
- [ ] Short form `-p` works correctly
- [ ] Port-only format works (defaults to localhost)
- [ ] Host:port format works
- [ ] PEER_DISCOVERY messages are properly handled
- [ ] Peer counts are accurately displayed
- [ ] Failed connections don't crash the node
- [ ] Nodes continue to function normally after connection

## Testing PEER_DISCOVERY Handler

To test the PEER_DISCOVERY handler directly:
```bash
# Start node 1
bun run src/index.ts

# In another terminal, send a manual PEER_DISCOVERY message
curl -X POST http://localhost:3000/gossip \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PEER_DISCOVERY",
    "payload": {
      "id": "manual-test-node",
      "address": "localhost",
      "port": 9999
    },
    "sender": "manual-test-node",
    "timestamp": '$(date +%s000)'
  }'
```

Expected result:
- First node should display "Added peer: manual-test-node at localhost:9999"
- Connected Peers count should increase by 1

## Automated Testing

Run the test suite:
```bash
bun test
```

The gossip.test.ts file includes a test for the peer discovery message format.
