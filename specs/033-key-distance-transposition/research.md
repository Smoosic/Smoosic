# Research: Key-Distance Enharmonic Spelling

All Technical Context items were resolvable from the code; no NEEDS CLARIFICATION remained.

## R1. Representing spellings and keys as one integer each

**Decision**: Use the "line of fifths". A spelling's position is `base(letter) + 7 * accidentalCount`, where `base` is F=-1, C=0, G=1, D=2, A=3, E=4, B=5, and `accidentalCount` is +1 per sharp, -1 per flat (double accidentals ±2). A major key's index `k` is its sharps (positive) or flats (negative): C=0, G=1, F=-1, Bb=-2.

**Rationale**: Adjacent positions are a fifth apart, so "number of fifths/fourths" from the user's definition is plain subtraction. The seven tones of key `k` are positions `k-1 .. k+5` (check: C gives F..B; G gives C..F#; Eb gives Ab..D). Everything in the spec reduces to comparisons against that window.

**Alternatives considered**: Keep a table but generate it (still bulky, still needs lookups); keep `circleOfFifths` array search (`circleOfFifthsIndex` already exists but only covers 12 entries and handles enharmonics by search, which is what we are trying to avoid).

## R2. Distance

**Decision**: Signed distance of position `f` from key `k` is `0` if `k-1 <= f <= k+5`, `f - (k+5)` (positive, sharps) if above, `f - (k-1)` (negative, flats) if below. Magnitude is the rank used to choose spellings.

**Rationale**: This is the user's definition: the number of sharps/flats added to the signature until a key contains the note. Verified against the stated examples: A# (f=10) in C: 10-5 = 5 sharps; Bb (f=-2) in C: -2-(-1) = -1, one flat. Note that `f` can lie outside the 15 real keys; the distance is computed against a theoretical key, which is fine because only the magnitude matters.

**Alternatives considered**: Counting accidentals in the spelling itself (Bb has 1, A# has 1, so no preference); rejected since it ignores the key.

## R3. Default spelling of a pitch class (replaces the bias block in `getEnharmonicInKey`)

**Decision**: For a sounding pitch class, enumerate its spellings that use at most a double accidental (positions `f0 + 12m`, in the range -15..19). Choose the one with the smallest absolute distance from the key. On equal absolute distance, choose the lower position (the flat side).

**Rationale**: Directly implements FR-003/FR-004. In-key pitches have distance 0 and always win, so a key's own spelling is used (FR-006-style behavior for defaults, US3 scenario 3).

**Behavior change to be aware of**: the old code hard-coded a flat bias (`a#`->`bb`, `g#`->`ab`, `c#`->`db`, `d#`->`eb`) for non-sharp keys. The new rule gives, in C major: Bb, Eb, Ab (tie, flat wins), but **C# and F#** (C# is 2 sharps from C vs 4 flats for Db; F# is 1 sharp vs 5 flats). In C major, C# was previously defaulted to Db. This follows from the requested rule and agrees with the requested example (C# in C stays C# when transposed to D as D#).

**Alternatives considered**: Keep the old bias block as an override; rejected because it contradicts the stated rule.

## R4. Transposing between keys while preserving distance

**Decision**: Compute `s = kd - ks` and set the new position to `f + s`. The sounding pitch is checked: `7 * s` must be congruent to the half-step offset modulo 12. If the caller's destination key and offset disagree, pick the `s` congruent to `7 * offset` (mod 12) that is closest to `kd - ks`, so the sounding pitch is always right. Then fix the octave by solving against `smoPitchToInt`.

**Rationale**: Shifting every position by the same amount keeps each note's offset from the key window unchanged, so scale degree, direction and distance are all preserved, and the operation is exactly invertible. Verified by hand against the spec examples:

| Case | ks → kd | s | Source f | Result f | Spelling |
|------|---------|---|----------|----------|----------|
| C# in C → D | 0 → 2 | 2 | 7 | 9 | D# |
| A# in C → D | 0 → 2 | 2 | 10 | 12 | B# |
| E natural in Eb → G | -3 → 1 | 4 | 4 | 8 | G# |

**Edge handling**: If `f + s` needs more than a double accidental (positions outside -15..19), respell by ±12 toward the nearest in-range position (the default-spelling rule in R3 picks it). Round trips are therefore exact except for these extremes; the spec's success criterion for round trips is qualified accordingly.

**Alternatives considered**: Map to a "role" per scale degree (what the table did; the source of the bulk). Compute from the transposition interval's letter distance (needs interval spelling, not available from half-step offsets alone).

## R5. Destination key for whole-score transposition

**Decision**: `kd` is the unique residue of `ks + 7 * offset (mod 12)` in -7..+7, preferring fewer accidentals. The one tie (6 vs -6) goes to flats (Gb), matching R3's tie rule. A zero offset keeps the existing key unchanged, so scores written in C# or Cb are not rewritten. Minor-key signatures are not special-cased; the app's key list is major keys only (the old table has only major keys).

**Rationale**: Only a residue modulo 12 is determined by the sounding pitch; choosing the representative with the fewest accidentals is what spec edge case "extreme destination key" requires. The existing `vexKeySigWithOffset` does the same job by pitch lookup with a patch table (`a#`->`bb` etc.); the new helper replaces that table-driven patching for this feature's callers but leaves the function in place for other callers.

**Alternatives considered**: Reuse `vexKeySigWithOffset`; it can produce `c#` or `cb` and relies on hard-coded patches, which would make the round-trip property harder to guarantee.

## R6. Current whole-score behavior

**Finding**: `SmoOperation.transposeScore` calls `transpose` for each note using the *measure's existing* key signature and never changes any key signature. The dialog ([transposeScore.ts](../../src/ui/dialogs/transposeScore.ts)) calls it in steps of the entered semitone count, and cancel undoes by transposing the negated total.

**Decision**: `transposeScore` computes `kd` per measure from that measure's current key and the offset, updates `measure.keySignature` to `kd`, and transposes pitches with `s = kd - ks`. Because the dialog applies each increment separately and cancel applies the negated total, both stay consistent: the inverse offset yields `s' = -s` and returns the original key and spelling. This matches spec US2 scenario 2 (destination key of each measure follows the interval). `storeScore` is transposed with the same function, so it stays in sync.

**Risk**: Users who relied on transposing notes while keeping the key signature will see the signature change. This is the behavior described in the request ("calculate the destination key"). Note in the changelog.

## R7. Callers that also use the table

| Caller | Use | Replacement |
|--------|-----|-------------|
| `getScaleTonesForKey` (also used by `tickMap.ts`, `getKeySignatureKey`, `isPitchInKeySignature`, `getKeyFriendlyEnharmonic`) | Per-letter accidental in the key | Computed from `k`: for letter base `b`, accidental count is `floor((k + 5 - b) / 7)`; return the same `letter + accidental` strings (`'f#'`, `'bb'`, `'cn'`) as before |
| `getEnharmonicInKey` (also `operations.ts` x2, `midiToSmo.ts`, `getIntervalInKey`) | Default spelling | R3 |
| `transposePitchForKey` (`note.ts`, chord symbols in `noteModifiers.ts`) | Cross-key spelling | R4 |
| `findRoleOfPitch`, `findPitchForRole`, `KeySignatureRole` | Table roles | Deleted. Grep shows no callers outside `music.ts` |

## R8. Pre-existing defect found

`keySignatureLength` contains the key `'Gg'` (should be `'Gb'`), so `getFlatsInKeySignature('gb')` returns `undefined`. Fixed as part of the new key-index helper since the helper depends on correct sharp/flat counts.

## R9. Existing tests

`package.json` has `"test": "exit 0"` and per-feature scripts. Adopt the same pattern (`ts-node -P tests/tsconfig.json`, `check()` helper, exit non-zero on failure).

## R10. Octave rule for B#, B##, Cb, Cbb

`smoPitchToInt` only special-cases `cb` (octave minus one). `b#3` evaluates to `3*12+0 = 36` although it sounds as C4 (48), and `b##`/`cbb` have the same problem. The new code therefore computes the sounding value with a letter-based rule that needs no special cases: `octave * 12 + naturalValue(letter) + accidentalCount`, where `naturalValue` is C=0, D=2, E=4, F=5, G=7, A=9, B=11 (so `cb4` = 47, `b#3` = 48). Respelling solves for the octave that makes this value equal the target. `smoPitchToInt` is left unchanged because other code depends on it.
