# Leader & Committee Election (Hash-Only, PoS-weighted)

This note assumes you already have an entropy seed `R` for the slot/epoch (from RANDAO or any other beacon). It summarizes **hash-only** ways to select a **leader** (block proposer) and/or a **committee** in a **stake-proportional** way.

## Common definitions
- `V` — active validator set
- `stake[v]` — validator stake
- `total_stake = Σ stake[v]` — stake snapshot at boundary
- `stake_unit` — a chosen unit (often `min_stake`) used to discretize stake into weights
- `w[v] = max(1, floor(stake[v] / stake_unit))` — integer weight
- `total_weight = Σ w[v]`
- `H(...)` — cryptographic hash producing 256-bit output interpreted as `uint256`
- `s` — slot number

**Important limitation (hash-only):** Most of these schemes are *publicly computable* from `(R, s, V, stake)` and therefore make the leader/committee predictable in advance of the slot (DoS/censorship risk). (This is exactly what VRFs/signatures normally fix.)

## Scheme A: Ticketization + global ranking ("expand into tickets")
**Core idea:** treat stake weight as multiple conceptual tickets `(v,i)`.

Ticket score:
- `score[v,i] = uint256(H("TICKET" || R || s || v || i))`, for `i = 0..w[v)-1`

### Leader (PoS-weighted)
- Winner is the validator owning the lowest scoring ticket (equivalently: `min_{v,i} score[v,i]`).

### Committee (PoS-weighted)
- Sort all tickets by `score` and take the first `K`.
- If you need exactly `K` *unique* validators, dedupe while scanning tickets in sorted order.

**Pros**
- Very intuitive stake proportionality: probability ≈ `w[v] / total_weight`.
- Produces a fixed-size committee easily.
- Matches the “tickets + sort” method used in `bounded-pow-pos-randao-summary.md` for committee selection.

**Cons**
- Potentially expensive: conceptually `O(total_weight log total_weight)` if implemented literally.
- Dedupe-to-unique can skew representation slightly (usually acceptable, but worth noting).
- Public predictability.

## Scheme B: One-shot hash + stake-weighted threshold (eligibility)
**Core idea:** each validator does one hash and compares to a stake-proportional target.

Eligibility hash:
- `h[v] = uint256(H("TRY" || R || s || v))`

Stake-proportional target:
- `target[v] = floor( 2^256 * λ * stake[v] / total_stake )`

### Leader
- `v` is eligible iff `h[v] < target[v]`.
- If multiple validators are eligible, pick the one with the lowest `h[v]` as the deterministic tie-break.
- If no validators are eligible, the slot has no block (or you define a fallback).

### Committee
- Simplest: committee is the set of eligible validators (variable size).
- If you need size ≈ `K`, tune `λ` so `E[|C|] ≈ K`.

**Pros**
- Extremely simple and parallelizable.
- Matches “bounded hashing per validator per slot” well.
- Natural PoS weighting via `target[v] ∝ stake[v]`.
- Matches the “one-shot hash + threshold” method used in `bounded-pow-pos-randao-summary.md` for proposer eligibility.

**Cons**
- Committee size is random unless you add extra selection rules.
- Can produce 0 or multiple leaders per slot (needs tie-break / fork-choice).
- Public predictability.

## Scheme C: Score-and-rank on validators (argmin / top-K)
**Core idea:** give each validator a single score.

Score:
- `score[v] = uint256(H("SCORE" || R || s || v))`

### Leader (unweighted)
- Leader = `argmin_v score[v]`.

### Committee (unweighted)
- Committee = `K` validators with smallest `score[v]`.

**How to add PoS weighting (hash-only):**
- The standard way is to give higher stake more chances by reducing to Scheme A (tickets), e.g. take `min_i H(...||i)` for `i < w[v]`.

**Pros**
- Always yields exactly one leader (argmin) and a fixed-size committee (top-K).
- No “zero winner” case.

**Cons**
- Not naturally stake-weighted without reintroducing tickets/multiple hashes.
- Public predictability.

## Scheme D: Index sampling / "follow-the-satoshi" (prefix-sum mapping)
**Core idea:** hash to an index in `[0, total_weight)` and map it into stake intervals.

Let validators be in a fixed order and define prefix sums:
- `prefix[k] = Σ_{j<=k} w[v_j]`

### Leader (PoS-weighted, exactly one)
- `r = uint256(H("LEADER" || R || s)) mod total_weight`
- Pick the unique validator `v` whose interval contains `r`.

### Committee (PoS-weighted)
- Do `K` independent draws:
  - `r_i = uint256(H("COMMITTEE" || R || s || i)) mod total_weight`
  - map each `r_i` to a validator by prefix sums
- Optionally dedupe + redraw until `K` unique validators are selected.

**Pros**
- Very clean stake proportionality.
- Always exactly one leader.
- Avoids sorting all tickets.

**Cons**
- Requires an efficient `index -> validator` mapping (prefix sums / tree), typically from an epoch snapshot.
- Uniqueness for committees requires dedupe/redraw logic (or acceptance of duplicates).
- Public predictability.

## Scheme E: Shuffle/permutation then slice (sample without replacement)
**Core idea:** produce a deterministic permutation of validators and take a slice.

- `perm = Shuffle(V, seed = H("SHUFFLE" || R || epoch_or_slot))`

### Leader
- Leader could be `perm[slot_offset]` or a rotating schedule `perm[s mod |V|]` (epoch schedule).

### Committee
- Committee is `perm[offset : offset+K]`.

**PoS weighting:**
- Unweighted shuffle is not stake-proportional by itself.
- To weight by stake in a hash-only way, you typically fall back to tickets (Scheme A) or repeated weighted draws (Scheme D).

**Pros**
- Naturally yields unique committees.
- Great for epoch-based scheduling.

**Cons**
- Not naturally stake-weighted.
- Shuffling cost is `O(|V|)` (usually done per-epoch).
- Public predictability.
