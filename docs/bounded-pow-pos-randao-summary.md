# Bounded PoW + PoS Registry + Hash-Only Randomness Beacon (Summary)

This document summarizes the leader-election approach discussed: **bounded Proof-of-Work** (bounded hashing per validator per slot) combined with a **Proof-of-Stake validator registry** (Sybil resistance) and a **hash-only commit–reveal randomness beacon**.

## 1) Validator registry (PoS / Sybil resistance)
- Anyone can become a validator by **locking stake** on-chain (meeting `min_stake`).
- The chain maintains the active validator set `V` and each validator’s `stake[v]`.
- Define `total_stake = Σ_{v∈V} stake[v]` from a snapshot at the slot boundary.

## 2) Time slots (10 minutes)
- Time is divided into slots `s` of **600 seconds**.

## 3) Hash-only randomness beacon committee (K=64)
To bound on-chain beacon traffic, only a fixed-size committee participates in commit–reveal.

Parameters:
- `K = 64` (committee size)
- `stake_unit` (e.g., `stake_unit = min_stake`)

Definitions:
- Stake weight in tickets: `w[v] = max(1, floor(stake[v] / stake_unit))`
- `R_prev` is the previous slot’s randomness, i.e. `R_prev = R[s-1]`.

**Committee selection (Design A: “sort by hash, take first K”)**
- For each validator `v ∈ V`, create `w[v]` conceptual tickets `(v, i)` for `i = 0..w[v)-1`.
- Score each ticket:
  - `score[v,i] = uint256(H("COMMITTEE" || s || R_prev || v || i))`
- Sort all tickets by `score` ascending.
- Take the first `K` tickets, and define `C[s]` as the corresponding validator IDs.
  - If you require exactly `K` *unique* validators, keep scanning tickets in sorted order until `K` unique validator IDs have been collected.

Only validators in `C[s]` are required to publish `RAND_COMMIT` / `RAND_REVEAL` for slot `s` (and are penalized if selected but fail to reveal).

## 4) Hash-only randomness beacon (RANDAO commit–reveal)
For each slot `s`:
- Each committee validator `v ∈ C[s]` chooses random `x[v][s]`.
- **Commit:** publish `c[v][s] = H("RAND_COMMIT" || s || v || x[v][s])` before the reveal window.
- **Reveal:** during slot `s`, publish `x[v][s]`; the chain checks it matches `c[v][s]`.
- **Aggregate:**
  - `X[s] = XOR(all revealed x[v][s] in slot s)`
  - `R[s] = H("RAND" || s || prev_block_hash || X[s])`
- If a committee validator committed (`c[v][s]` exists) but does not reveal `x[v][s]` by the deadline, apply a **penalty**.

## 5) Bounded PoW attempt (1 hash per validator per slot)
Each validator gets exactly **one attempt** per slot:
- `h[v] = uint256(H("TRY" || s || R[s] || v))`

## 6) Stake-weighted eligibility threshold
Compute a per-validator target:
- `target[v] = floor( 2^256 * λ * stake[v] / total_stake )`

Validator `v` is eligible to propose in slot `s` iff:
- `h[v] < target[v]`

Choose `λ ≈ 1` so the expected number of winners per slot is about 1.

## 7) Block proposal
Any eligible validator gossips a block for slot `s` containing:
- `slot = s`, `prev_hash`, and transactions
- enough beacon data to recompute `R[s]` (reveals or references)
- `proposer_id = v`

## 8) Block verification (every node)
Nodes validate a received block by:
- recomputing/verifying `R[s]` from the commit–reveal rules
- recomputing `h[v]` and `target[v]` from the validator snapshot
- checking proposer is active and `h[v] < target[v]`
- validating transactions/state transitions

## 9) Fork-choice / collisions
- **No winner:** no block for that slot; move to the next slot.
- **Multiple winners:** temporary fork; resolve via fork-choice (e.g., highest height; tie-break by lowest `h[v]` or lowest block hash).

## 10) Main parameters ("knobs")
- `min_stake`
- `K` (committee size; e.g., 64)
- `stake_unit` (ticket unit; e.g., `min_stake`)
- `λ`
- commit/reveal timing windows
- non-reveal penalty size
