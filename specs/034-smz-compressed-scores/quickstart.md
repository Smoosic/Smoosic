# Quickstart: Validating .smz Support

## Prerequisites

- `npm install` done at the repository root.
- For the manual checks, a built application (`npm run build`) or the development page you normally use.

## Automated check

```bash
npm run test:score-archive
npm run test:score-change-state
```

Expected: every line prints `PASS`, exit code 0. See [contracts/archive-api.md](contracts/archive-api.md) for the invariants and [data-model.md](data-model.md) for the file shapes.

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Pack a score, check the first bytes and the entry name | Starts `50 4B 03 04`; one entry `score.json` |
| 2 | Pack then load a score with accented and non-Latin text in title and lyrics | Identical full serialization, text intact |
| 3 | Load `release/library/pennylane2 (6).json` (legacy abbreviated) | Loads; full serialization equals the validation file for the same score |
| 4 | Load a validation file | Loads |
| 5 | Hand the bytes of a zip to `unpack` as if it were named `.json`; hand text to `unpack` as if named `.smz` | Both load (content, not name, decides) |
| 6 | Truncated zip | Throws "damaged archive" |
| 7 | Zip with only `readme.txt` | Throws "no score in archive" |
| 8 | Text `{"hello":1}` | Throws "not a score" |
| 9 | Text with a leading byte-order mark | Loads |
| 10 | Sizes for the library score | Zipped full document smaller than the abbreviated text; at least 50% smaller than the full text |
| 11 | `serialize({ skipStaves: true, useDictionary: false })` | No `dictionary` key |
| 12 | `isFullSaveFormat('.smz')` | True |

## Manual check in the application

1. Start the app and open the Save dialog. The format shown is Smoosic and the suggested file ends in `.smz`.
2. Save. The unsaved-changes indicator clears. Open the file with any zip tool: one `score.json`.
3. Open the Load dialog; the file chooser lists `.smz`. Load the file you just saved; the score is identical.
4. Load an older `.json` score (for example one downloaded from the library) and a validation file; both open.
5. Rename a `.smz` to `.json` and load it; it still opens.
6. Load a text file renamed to `.smz`; a message says the file could not be read and the open score is unchanged.
7. Switch the save format to MusicXML, then back to Smoosic, and save quickly. The saved file is a valid `.smz`.

## Regression

Run the other `test:*` scripts in `package.json` to confirm nothing else changed.
