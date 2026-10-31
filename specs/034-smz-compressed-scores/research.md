# Research: Compressed Score Files (.smz)

No NEEDS CLARIFICATION remained in the Technical Context. Findings below came from reading the code and from one measurement.

## R1. Is the dictionary still worth using?

**Decision**: No. `.smz` holds the full, un-abbreviated score document.

**Evidence**: Measured on `release/library/pennylane2 (6).json`, the only score shipped in the repo (one sample; the measurement should be repeated on larger scores during implementation):

| Form | Bytes |
|------|-------|
| Existing file on disk (abbreviated) | 17,270 |
| Abbreviated text from today's default save | 17,627 |
| Full text (the validation format) | 22,112 |
| Abbreviated, zipped | 3,244 |
| **Full, zipped** | **1,857** |

Full-and-zipped is 43% smaller than abbreviated-and-zipped (the short tokens defeat the compressor's matching of repeated names) and about 90% smaller than today's default file. This is better than the "probably the same" in the request, and it also means the file is readable by any tool after unzipping without needing the token map.

**Alternatives considered**: Zip the abbreviated form (bigger, and keeps the token map as a permanent compatibility burden); gzip instead of zip (no multi-file container and the user asked for zip).

## R2. Container layout and how to recognize it

**Decision**: A standard zip with one entry named `score.json` containing the full score document as UTF-8 text, compressed with DEFLATE (level 9). On read, a file is a zip if its first four bytes are `50 4B 03 04`; the entry is `score.json` if present, otherwise the first non-directory entry whose name ends in `.json`. A file that is not a zip is decoded as UTF-8 text (an initial byte-order mark is removed) and treated as JSON.

**Rationale**: Content detection satisfies the spec edge case "extension and contents disagree" (FR-008) and does not depend on the file name, which is also unavailable for string input from configuration. A fixed entry name keeps the file self-describing and trivial for other tools to read, while the fallback tolerates archives made by hand.

**Alternatives considered**: Detect only by extension (fails the mismatch case); add a manifest or mimetype entry as in EPUB (more moving parts than one document needs).

## R3. JSZip availability

**Finding**: JSZip is not an npm package in this repo. It ships as `src/common/jszip.js`, is loaded in the HTML pages with `<script src="../jszip.js">`, is a webpack external (`jszip: 'JSZip'`), and the existing `.mxl` import reads it as `declare var JSZip: any`. A headless test therefore needs the global.

**Decision**: Use the same `declare var JSZip: any` in the new module (no new import style). The test file sets `global.JSZip = require('../src/common/jszip.js')` before use. The module looks the global up at call time, so import order does not matter.

**Alternatives considered**: Add `jszip` to `package.json` (a new dependency and a second copy of the library); implement DEFLATE by hand (reinventing a shipped library).

## R4. Where the logic lives

**Decision**: New `src/ui/fileio/scoreArchive.ts` exporting a `SmoScoreArchive` class with static `pack`, `unpack`, `load` and `isZip`. It depends only on `SmoScore`, `JSZip`, `TextEncoder` and `TextDecoder`.

**Rationale**: Keeps zip and text-decoding logic out of the dialogs so one place decides what a score file is (local, remote, configuration string) and so it is testable without a browser. It sits in `src/ui/fileio` with the other load utilities, because nothing in the data model refers to it (constitution principle 4: `src/smo` stays free of file handling).

## R5. Reading files from disk and from URLs

**Finding**:
- `SuiFileInput` reads `.mxl`/`.mid` as `ArrayBuffer` and everything else as text. It is also used by the exported legacy `SuiFileDownloadComponent`, whose callers expect text for `.json`.
- `SuiXhrLoader` reads text for everything except `.mxl` and `.mid`. Its `value` for `.json` is used as a string by `application.ts` (initial remote score), `scoreViewOperations.loadRemoteJson`, `generateVexTests.ts` and the library list loader.

**Decision**:
- `SuiFileInput` gets an opt-in constructor flag `scoresAsBytes` (default false). With it, `.smz` and `.json` are read as `ArrayBuffer` so the content can be sniffed. `.smz` is always binary because text mode would corrupt it. The Open dialog passes the flag; the legacy component is unchanged.
- `SuiXhrLoader` gets `loadScoreAsync(): Promise<string>` which reads the response as bytes and returns the JSON text via `SmoScoreArchive.unpack`. Callers that load scores (`loadRemoteJson`, the configured remote score for `.json`/`.smz`, `generateVexTests`) switch to it; the library list loader and `.xml`/`.mxl` paths keep `loadAsync`.

**Alternatives considered**: Make every JSON read binary (breaks the library list and legacy callers); decide only on the URL's extension for remote files (fails mismatches, but is simpler; rejected because the spec says remote files follow the same rule as local ones).

## R6. Save dialog

**Finding**: `save.vue` receives `contents` (a string ref) and builds a `Blob` from it for a download link. `changeExtensionCb` is synchronous and sets `contents`. The options are `.json` (default), `.xml`, `.mid`, `.js`, and `.smojson` ("Validation (large)", which sets the extension to `.json`). `isFullSaveFormat` allows only `.json`.

**Decision**:
- Replace `.json` ("Smoosic") with `.smz`, which is the default. Keep `.smojson` mapped to plain `.json` unchanged.
- `contents` may be a string or a `Uint8Array`; `Blob` accepts both. Packing is asynchronous, so `changeExtensionCb` becomes async and the dialog awaits the latest pending computation before it clicks the download link, so a quick Save after changing the format never saves stale content.
- `isFullSaveFormat` accepts `.smz` as well as `.json` (validation still ends in `.json`).

## R7. The dictionary option defect

**Finding**: In `SmoScore.serialize`, `const useDictionary = options?.skipStaves ?? true;` reads the wrong option. Called with no options (today's default save) the dictionary is used. Called with `{ skipStaves: false, useDictionary: false }` it is not used, only because `skipStaves` is false. Called with `{ skipStaves: true, useDictionary: false }` (the undo and snapshot calls in `scoreView.ts`) it IS used, contradicting the caller's request.

**Decision**: Read `options?.useDictionary ?? true`. The archive writer passes `useDictionary: false` explicitly. `deserialize` already handles both forms, so existing snapshots and files are unaffected. The only behavior change is that `{ skipStaves: true, useDictionary: false }` snapshots stop being abbreviated, which is what those callers asked for; implementation should confirm snapshot sizes stay acceptable.

## R8. Failure behavior (spec US4)

**Finding**: `convertJson` in `fileDialogs.ts` catches any error, logs a warning and returns `null`, so a bad file silently does nothing. The existing `modalMessage.vue` dialog (headline, message, OK) is available, as used by the print dialog.

**Decision**: `SmoScoreArchive.load` throws an `Error` with a short readable message for each failure kind (not a zip and not JSON, zip without a score, corrupt archive, text that is not a score). The Open dialog catches it, leaves `pendingScore` null, and after the open dialog closes shows `modalMessage` with the message. The open score is never touched because replacement already waits for `pendingScore`.

**Alternatives considered**: Show the error inside the open dialog (it closes on commit; showing after close follows the pattern `confirmReplaceScore` already uses).

## R9. Where `.smz` is accepted on open

**Decision**: The file chooser `accept` list in `fileUpload.vue` gains `.smz`; the extension check in `fileDialogs.ts` is case-insensitive and routes `.json` and `.smz` to the same loader. MusicXML and MIDI paths are unchanged (FR-012).

## R10. Tests

**Decision**: `tests/scoreArchive.ts`, with `test:score-archive` in `package.json`, covers: pack/unpack round trip comparing the full serialized document before and after; zip signature and entry name; non-Latin text; legacy abbreviated JSON (from `release/library/pennylane2 (6).json`); validation JSON; a zip renamed (bytes handed to `unpack` regardless of name) and text passed as bytes; corrupt (truncated) zip; zip without a score; text that is not a score; BOM; size comparison on the library score; `serialize` option fix. `tests/scoreChangeState.ts` gains `.smz`.
