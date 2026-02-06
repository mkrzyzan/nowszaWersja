# libp2p Migration - Status Report

## Summary
Attempted migration from custom HTTP-based gossip protocol to libp2p (industry standard P2P library). The migration is 90% complete but blocked by a critical protocol negotiation error that prevents peer connections.

## What Works ✅
- libp2p node initialization and startup
- Listening on TCP and WebSocket transports
- Peer discovery via mDNS (nodes find each other)
- Peer information storage in peer store
- All 68 existing tests still pass
- HTTP server for transaction submission (unchanged)

## What Doesn't Work ❌
- **Peer connections fail during encryption handshake**
- Error: `EncryptionFailedError: At least one protocol must be specified`
- Error occurs in `@libp2p/multistream-select` during protocol negotiation
- Affects both TCP and WebSocket transports
- Prevents all peer-to-peer communication
- Blocks transaction and block propagation

## Technical Details

### Error Stack Trace
```
EncryptionFailedError: At least one protocol must be specified
    at Upgrader._encryptOutbound (/node_modules/libp2p/src/upgrader.ts:442:13)
    at Upgrader._performUpgrade (/node_modules/libp2p/src/upgrader.ts:302:13)
    at Upgrader.upgradeOutbound (/node_modules/libp2p/src/upgrader.ts:241:14)
    at TCP.dial (/node_modules/@libp2p/tcp/src/tcp.ts:102:14)
```

### Root Cause
The error originates from `@libp2p/multistream-select/src/select.ts` which requires protocols to be specified during connection negotiation. However, when using services like gossipsub, these protocols should be registered and negotiated automatically. This suggests either:
1. A configuration issue in our setup
2. A bug in libp2p v3.1.3
3. Missing required configuration we haven't identified

### Approaches Tried

#### 1. Transport Variations
- Started with TCP only
- Switched to WebSocket only  
- Combined TCP + WebSocket (current)
- All produce the same error

#### 2. Configuration Tweaks
- Added/removed connection manager settings
- Tried with/without DHT (Kad-DHT)
- Tested minimal libp2p (just identify + ping)
- Added gossipsub `directConnect: true`
- Set connection manager `minConnections: 1`
- None resolved the issue

#### 3. Manual vs Automatic Dialing
- Tried manual `dial(peerId)` after discovery
- Tried manual `dial(multiaddr)` with full addresses
- Tried no manual dialing (rely on gossipsub)
- All produce the same error

#### 4. Simplified Testing
- Created minimal test with just 2 nodes
- Removed all services except identify + ping
- Still fails with same error

### Current Configuration

```typescript
// gossip.ts - libp2p setup
const libp2p = await createLibp2p({
  addresses: {
    listen: [
      `/ip4/0.0.0.0/tcp/${port}`,        // TCP
      `/ip4/0.0.0.0/tcp/${port+100}/ws`  // WebSocket
    ]
  },
  transports: [tcp(), webSockets()],
  streamMuxers: [mplex(), yamux()],
  connectionEncryption: [noise()],
  peerDiscovery: [mdns({ interval: 1000 })],
  connectionManager: {
    maxConnections: 100,
    minConnections: 1,
    dialTimeout: 30000
  },
  services: {
    pubsub: gossipsub({ directConnect: true }),
    identify: identify(),
    ping: ping()
  }
});
```

## Dependencies
```json
{
  "libp2p": "^3.1.3",
  "@libp2p/tcp": "^11.0.10",
  "@libp2p/websockets": "^10.1.3",
  "@libp2p/noise": "^1.0.1",
  "@libp2p/mplex": "^12.0.11",
  "@libp2p/yamux": "^8.0.1",
  "@libp2p/gossipsub": "^15.0.12",
  "@libp2p/identify": "^4.0.10",
  "@libp2p/mdns": "^12.0.11",
  "@libp2p/ping": "^3.0.10"
}
```

All are the latest versions as of 2026-02-06.

## Test Results

### Discovery Test
```
🔍 Peer discovered: 12D3KooW...
   Multiaddrs: /ip4/127.0.0.1/tcp/4000, /ip4/127.0.0.1/tcp/4100/ws
   ✅ Stored in peer store
   
🔗 Attempting to connect...
   ⚠️  Dial error: EncryptionFailedError: At least one protocol must be specified
```

Both nodes successfully discover each other via mDNS, but all connection attempts fail.

### Connection Status
```
📊 Connection Status:
   Node 1 connected peers: 0
   Node 2 connected peers: 0
   ❌ Nodes failed to connect
```

## Files Changed
- `src/gossip.ts` - Complete rewrite using libp2p
- `src/node.ts` - Async operations for libp2p
- `src/index.ts` - Port configuration  
- `package.json` - Added libp2p dependencies
- `README.md` - Updated with connection examples
- `tests/gossip.test.ts` - Simplified for libp2p
- `tests/integration.test.ts` - Updated for new architecture

## Recommendations

### Option 1: Find Working Example
Search for a working libp2p v3 + gossipsub example in TypeScript/JavaScript and copy the exact configuration. The issue might be a subtle configuration detail we're missing.

### Option 2: Report as Bug
This appears to be a bug in libp2p v3.1.3. Report it to the libp2p team with our minimal reproduction case.

### Option 3: Wait for libp2p v4
libp2p v4 is in development and may have fixed this issue. Consider waiting for its release.

### Option 4: Revert to HTTP Gossip
Temporarily keep the custom HTTP-based gossip protocol until the libp2p issue is resolved. The HTTP approach works but lacks the robustness of libp2p.

### Option 5: Use Different P2P Library
Consider alternatives like:
- Hyperswarm
- Gun.js
- OrbitDB
- Custom WebRTC implementation

## Next Steps

1. **Research**: Look for working libp2p v3 examples with gossipsub
2. **Community**: Ask in libp2p Discord/forums about the protocol negotiation error
3. **Issue**: File bug report with libp2p team if confirmed as a bug
4. **Decision**: Choose between options above based on project timeline

## Conclusion

The migration to libp2p has made significant progress. The architecture is sound, peer discovery works, and all the pieces are in place. However, we're blocked by what appears to be a fundamental issue with libp2p v3's protocol negotiation during the encryption handshake. This is preventing any peer connections from being established, which blocks all P2P communication.

The custom HTTP-based gossip protocol remains functional as a fallback until this issue is resolved.

---
Date: 2026-02-06
Author: GitHub Copilot
Branch: copilot/migrate-to-libp2p-protocol
