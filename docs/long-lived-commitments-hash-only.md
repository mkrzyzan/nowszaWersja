# Long-Lived Commitments (Hash-Only)

This note summarizes **hash-only long-lived commitment** schemes that can replace per-slot `commit` transactions in a commit–reveal / RANDAO-style randomness beacon.

Goal:
- Reduce on-chain traffic by committing once for a whole window (epoch) and then revealing one value per slot.

Non-goals / caveats:
- These schemes mostly reduce *commitment overhead*.
- They **do not** automatically remove the incentive/ability to **withhold** a reveal (the classic “last revealer” / selective reveal problem). Penalties, timing rules, and/or mixing additional entropy sources are still needed.

## 1) Hash chain / hash onion (sequential preimage reveals)
**Idea:** commit to the end of a hash chain once; reveal preimages over time.

- Choose secret `seed_v` and chain length `L`.
- Compute:
  - `y_0 = H(seed_v)`
  - `y_{i+1} = H(y_i)` for `i = 0..L-1`
- Publish a single long-lived commitment `root_v = y_L`.
- For slot `s` (within the window), reveal `reveal_v[s] = y_{L-s}`.
- Verification is hash-only: check that hashing forward `s` times yields the root:
  - `H^s(reveal_v[s]) == root_v`

Notes:
- Reveals are tiny (just one 32-byte value).
- Without extra structure, verification can be expensive if you must hash forward many steps.
- Natural fit if the protocol stores a moving pointer (the “next expected” preimage) on-chain, so each new reveal is just one hash check.

## 2) Merkle root of per-slot secrets (commit-many, reveal-any-order)
**Idea:** commit once to a batch of per-slot secrets using a Merkle tree.

- For a window/epoch with slots `s = 0..L-1`, prepare per-slot secrets `x_v[s]`.
- Create leaves (domain separated):
  - `leaf[s] = H("LEAF" || s || x_v[s])`
- Build a Merkle tree and publish one commitment:
  - `root_v = MerkleRoot(leaf[0..L-1])`
- For slot `s`, reveal `x_v[s]` plus a Merkle inclusion proof `path[s]`.
- Verification is hash-only: verify inclusion of `leaf[s]` under `root_v`.

Notes:
- Supports out-of-order reveals naturally.
- Each reveal carries an `O(log L)` proof (a handful of hashes).

## 3) Append-only Merkle / Merkle Mountain Range (MMR)
**Idea:** like Merkle batching, but allow extending the commitment over time without fixing `L` up front.

- Maintain an append-only sequence of leaves representing future reveals.
- Publish a commitment root that updates as new leaves are appended.
- For slot `s`, reveal the value plus an inclusion proof against the committed root.

Notes:
- Useful if you don’t want strict epoch boundaries or fixed-length windows.
- More complex to implement than a per-epoch Merkle tree.

## 4) Checkpointed / skip-list hash chains (faster verification)
**Idea:** keep the small-reveal property of hash chains but reduce worst-case verification cost by publishing anchors.

Examples:
- Publish anchors every `2^k` steps (checkpoints).
- Use a skip-list style structure where some nodes also commit to “long jumps”.

Then a reveal is verified against the nearest anchor rather than hashing forward from the reveal to the very end.

Notes:
- Still hash-only and compact per-slot reveals.
- Requires publishing more commitment metadata than a single `root_v`.

## How this plugs into a RANDAO-style beacon
Any of the above can replace per-slot `RAND_COMMIT` state with a per-window commitment.

Typical flow per slot `s`:
- Selected participant reveals `r_v[s]` (chain preimage, Merkle leaf secret, etc.).
- Aggregate revealed values, e.g.:
  - `X[s] = XOR(all revealed r_v[s])`
  - `R[s] = H("RAND" || s || prev_block_hash || X[s])`

The protocol then uses `R[s]` as the seed for committee selection / leader eligibility.
