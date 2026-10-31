# Contract: Score archive API

Library surface (exported from `src/application/exports.ts`). All functions are static on `SmoScoreArchive` in `src/ui/fileio/scoreArchive.ts`. Requires the global `JSZip` at call time.

## Methods

| Method | Signature | Behavior |
|--------|-----------|----------|
| `pack` | `(score: SmoScore) => Promise<Uint8Array>` | Serializes with `{ skipStaves: false, useDictionary: false, preserveStaffIds: false }` and returns a zip with one `score.json` entry, DEFLATE level 9. |
| `isZip` | `(data: ArrayBuffer \| Uint8Array \| string) => boolean` | True when the first four bytes are `50 4B 03 04`. A string input is never a zip. |
| `unpack` | `(data: ArrayBuffer \| Uint8Array \| string) => Promise<string>` | Returns the score document text. Zip: finds the score entry as in the data model. Not a zip: UTF-8 decodes bytes (or takes the string) and strips a leading byte-order mark. Throws `Error` with a readable message on failure. |
| `load` | `(data: ArrayBuffer \| Uint8Array \| string) => Promise<SmoScore>` | `unpack` then `SmoScore.deserialize`. Throws `Error` if the result is not a score. |

## Changed behavior elsewhere

| Item | Change |
|------|--------|
| `SmoScore.serialize(options)` | `useDictionary` is read from `options.useDictionary` (default true), not from `skipStaves`. |
| `isFullSaveFormat(ext)` | True for `.json` and `.smz` (case-insensitive, trimmed). |
| `SuiFileInput(evt, scoresAsBytes?)` | When `scoresAsBytes` is true, `.json` and `.smz` are read as `ArrayBuffer`. `.smz` is always read as bytes. Default behavior otherwise unchanged. |
| `SuiXhrLoader.loadScoreAsync()` | New. Returns the score document text for a `.json` or `.smz` URL; throws as `unpack` does. `loadAsync()` is unchanged. |
| Save dialog formats | "Smoosic" is `.smz` (default); "Validation (large)" saves plain full JSON with the `.json` extension; MusicXML, MIDI and Vex unchanged. |
| Open dialog | Accepts `.smz` as well as `.json`, `.mid`, `.midi`, `.xml`, `.mxl`. A failed `.json`/`.smz` load shows a message and leaves the open score untouched. |

## Invariants (asserted by tests)

1. `await SmoScore.deserialize(await unpack(await pack(score)))` serializes (full form) to the same text as `score`.
2. `unpack` of a legacy abbreviated file and `unpack` of the same score's validation file yield scores whose full serialization is identical.
3. `unpack` gives the same result for a zip regardless of what the file was called (the name is not an input).
4. A failed load throws; no function mutates a score it was not asked to create.
