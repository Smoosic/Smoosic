# Data Model: Key-Distance Enharmonic Spelling

No persisted data changes. These are the in-memory concepts the logic computes with; none is serialized.

## Pitch (existing)

`{ letter: 'a'..'g', accidental: 'n' | '#' | 'b' | '##' | 'bb' (empty string tolerated), octave: number }`

## Fifths position (derived, integer)

| Field | Meaning |
|-------|---------|
| `f` | `base(letter) + 7 * acc`, with base F=-1, C=0, G=1, D=2, A=3, E=4, B=5 and `acc` = +1 per sharp / -1 per flat |

Rules:
- Valid range with at most double accidentals: -15 (Fbb) .. 19 (B##).
- Pitch class is `(7 * f) mod 12`. Two positions are enharmonic iff they differ by a multiple of 12.
- Converting back: `letter` from `((f + 1) mod 7)` indexed over F,C,G,D,A,E,B; `acc` is `floor((f + 1) / 7)`.

## Key index (derived, integer)

| Field | Meaning |
|-------|---------|
| `k` | Sharps (positive) or flats (negative) in the major key signature, -7 .. +7 |

Rules:
- Source of truth is the key signature string on the measure (`'c'`, `'g'`, `'db'`, ...). `k` is read from it via the existing sharp/flat counts.
- Scale tones of key `k` are positions `k-1 .. k+5`.
- Accidental for letter with base `b` in key `k` is `floor((k + 5 - b) / 7)`.

## Distance (derived, signed integer)

`distance(f, k) = 0` if `k-1 <= f <= k+5`; `f - (k+5)` if above (sharp side, positive); `f - (k-1)` if below (flat side, negative).

| Example | f | k | Distance |
|---------|---|---|----------|
| A# in C | 10 | 0 | +5 |
| Bb in C | -2 | 0 | -1 |
| C# in C | 7 | 0 | +2 |
| E natural in Eb | 4 | -3 | +2 |
| G# in G | 8 | 1 | +2 |

Note on the Eb row: the window for Eb is positions -4..2 (Ab, Eb, Bb, F, C, G, D); E natural (4) is 2 above the top, so +2; G# in G (window 0..6) is 8, also +2. Equal distance, same direction, which is the preservation the spec requires.

## Key shift (derived, integer)

`s = kd - ks`, adjusted by a multiple of 12 only if needed so that `7 * s ≡ offset (mod 12)`.

State transitions: none. All values are recomputed per operation; transposing by `+n` then `-n` returns each original `f` and `k` exactly, except for pitches that needed a ±12 respell to stay within double accidentals.
