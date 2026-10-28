# Quickstart: Validating Key-Distance Spelling

## Prerequisites

- `npm install` done at the repository root.
- Types regenerated if you changed `music.ts` public signatures: `npm run types`.

## Automated check

```bash
npm run test:key-distance-transposition
```

Expected: every line prints `PASS`, exit code 0. The script covers the cases below (see [contracts/spelling-api.md](contracts/spelling-api.md) for the invariants and [data-model.md](data-model.md) for the arithmetic).

| # | Scenario | Expected |
|---|----------|----------|
| 1 | C# in C → D, +2 | D# |
| 2 | A# in C → D, +2 | B# |
| 3 | E natural in Eb → G, +4 | G# |
| 4 | Default spelling, pitch class 10 in C | Bb |
| 5 | Default spelling with sharp/flat tie (pitch class 8 in C) | Ab |
| 6 | In-key note in destination key (F in C → G, +7) | C (4th degree maps to 4th degree) |
| 7 | Same key, offset 0 | Spelling unchanged |
| 8 | Octave handling across B/C (Cb4 in Gb → G, +1) | C4; sounding pitch rises exactly one half step |
| 9 | Round trip for all 12 chromatic notes, all 15 major keys, offsets -12..12 | Original spelling restored |
| 10 | Extreme destination (offset giving more than 7 accidentals) | Equivalent key with fewer accidentals |
| 11 | Chord symbol `C#` in C → D | `D#` |
| 12 | `SmoOperation.transposeScore` on a 2-measure Eb score with E natural, +4 | Measures in `g`, E natural is G# |

## Manual check in the application

1. Start the app, enter a measure in C major containing C#.
2. Select **Transpose Score** and enter +2. The key signature becomes D major (2 sharps) and the C# shows as D#, not Eb.
3. Press Cancel in the dialog. The score returns to C major with C#.
4. Copy an A# from C major, paste into a D major measure: B#.

## Regression

Run the other test scripts in `package.json` (`test:voice-copy-paste`, `test:multimeasure-rest`, ...) to confirm nothing else changed.
