# Bounded PoW + PoS Registry + Hash-Only Randomness Beacon (Summary)

This document summarizes the leader-election approach discussed: **bounded Proof-of-Work** (bounded hashing per validator per slot) combined with a **Proof-of-Stake validator registry** (Sybil resistance + weighting) and a **hash-only randomness beacon** (RANDAO-style commit–reveal).

## 1) Validator registry (PoS / Sybil resistance)
- Anyone can become a validator by **locking stake** on-chain (meeting `min_stake`).
- The chain maintains the active validator set `V` and each validator’s `stake[v]`.
- Define `total_stake = Σ_{v∈V} stake[v]` from a snapshot at the slot boundary.

## 2) Time slots (10 minutes)
- Time is divided into slots `s` of **600 seconds**.

## 3) Hash-only randomness beacon (RANDAO commit–reveal)
For each slot `s`:
- Validator `v` chooses random `x[v][s]`.
- **Commit:** publish `c[v][s] = H("RAND_COMMIT" || s || v || x[v][s])` before the reveal window.
- **Reveal:** during slot `s`, publish `x[v][s]`; the chain checks it matches `c[v][s]`.
- **Aggregate:**
  - `X[s] = XOR(all revealed x[v][s] in slot s)`
  - `R[s] = H("RAND" || s || prev_block_hash || X[s])`
- If a validator committed (`c[v][s]` exists) but does not reveal `x[v][s]` by the deadline, apply a **penalty**.

## 4) Bounded PoW attempt (1 hash per validator per slot)
Each validator gets exactly **one attempt** per slot:
- `h[v] = uint256(H("TRY" || s || R[s] || v))`

## 5) Stake-weighted eligibility threshold
Compute a per-validator target:
- `target[v] = floor( 2^256 * λ * stake[v] / total_stake )`

Validator `v` is eligible to propose in slot `s` iff:
- `h[v] < target[v]`

Choose `λ ≈ 1` so the expected number of winners per slot is about 1.

## 6) Block proposal
Any eligible validator gossips a block for slot `s` containing:
- `slot = s`, `prev_hash`, and transactions
- enough beacon data to recompute `R[s]` (reveals or references)
- `proposer_id = v`

## 7) Block verification (every node)
Nodes validate a received block by:
- recomputing/verifying `R[s]` from the commit–reveal rules
- recomputing `h[v]` and `target[v]` from the validator snapshot
- checking proposer is active and `h[v] < target[v]`
- validating transactions/state transitions

## 8) Fork-choice / collisions
- **No winner:** no block for that slot; move to the next slot.
- **Multiple winners:** temporary fork; resolve via fork-choice (e.g., highest height; tie-break by lowest `h[v]` or lowest block hash).

## 9) Main parameters ("knobs")
- `min_stake`
- `λ`
- commit/reveal timing windows
- non-reveal penalty size
