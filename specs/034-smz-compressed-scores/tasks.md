---

description: "Task list for compressed score files (.smz)"
---

# Tasks: Compressed Score Files (.smz)

**Input**: Design documents from `/specs/034-smz-compressed-scores/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/archive-api.md, quickstart.md

**Tests**: Requested (FR-014). One headless file, `tests/scoreArchive.ts`, grown story by story.

**Organization**: Grouped by user story. The archive module (Foundational) serves every story. US1 is saving, US2 opening, US3 the validation format, US4 failure handling.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup

- [X] T001 Create `tests/scoreArchive.ts` with the `check()`/failure-count harness and the `registerDynamicCtors` calls used in `tests/voiceCopyPaste.ts`, set `(global as any).JSZip = require('../src/common/jszip.js')` before any archive call, add a `buildScore()` helper (default score plus about 20 measures with notes, a title containing accented and non-Latin characters, and a lyric), and register `"test:score-archive": "ts-node -P tests/tsconfig.json tests/scoreArchive.ts"` in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The archive module and the serialization option fix. Every story uses these.

- [X] T002 Fix the dictionary option in `SmoScore.serialize` in `src/smo/data/score.ts` (line ~493): read `options?.useDictionary ?? true` instead of `options?.skipStaves ?? true`
- [X] T003 Create `src/ui/fileio/scoreArchive.ts` with `declare var JSZip: any;` and a `SmoScoreArchive` class with `static isZip(data)` (first four bytes `50 4B 03 04`; false for strings) per [contracts/archive-api.md](contracts/archive-api.md)
- [X] T004 Add `SmoScoreArchive.pack(score)` in `src/ui/fileio/scoreArchive.ts`: serialize with `{ skipStaves: false, useDictionary: false, preserveStaffIds: false }`, `JSON.stringify`, store as one `score.json` entry, DEFLATE level 9, return `Uint8Array` via `generateAsync({ type: 'uint8array' })`
- [X] T005 Add `SmoScoreArchive.unpack(data)` in `src/ui/fileio/scoreArchive.ts` per [data-model.md](data-model.md): zip input uses `score.json`, else the first non-directory `.json` entry; non-zip bytes are UTF-8 decoded with a leading BOM removed; strings are used as-is (BOM removed); throw `Error` with the messages "damaged archive", "no score in archive", "not a score file" as listed in the data model
- [X] T006 Add `SmoScoreArchive.load(data)` in `src/ui/fileio/scoreArchive.ts`: `unpack`, parse, require a `staves` array (else throw "not a score"), then `SmoScore.deserialize`
- [X] T007 Export the module from `src/application/exports.ts` (follow the existing `export *` and class-list pattern)
- [X] T008 Tests in `tests/scoreArchive.ts` for the foundation: `serialize({ skipStaves: true, useDictionary: false })` has no `dictionary`, and `serialize()` still does; `isZip` for a packed score, a string and plain bytes; `pack` result starts `50 4B 03 04` and the archive has exactly one entry `score.json` holding text with no `dictionary` key

**Checkpoint**: Archive module exists and is tested in isolation.

---

## Phase 3: User Story 1 - Save a score as .smz (Priority: P1) 🎯 MVP

**Goal**: The default Smoosic save writes a `.smz`, counts as a full save, and is smaller than before.

**Independent Test**: Save with the default format; the file ends in `.smz`, is a valid zip holding the score, and is no larger than the previous abbreviated file; the unsaved-changes indicator clears.

### Tests for User Story 1

- [X] T009 [P] [US1] In `tests/scoreArchive.ts` add: pack then `load` returns a score whose full serialization equals the original's, including the non-Latin title and lyric text (FR-009); size check on `release/library/pennylane2 (6).json`: packed size is less than the size of `score.serialize()` text and at most half the size of the full text (SC-001), printing the three sizes
- [X] T010 [P] [US1] In `tests/scoreChangeState.ts` add: `isFullSaveFormat('.smz')`, `' .SMZ '` and `'.json'` are true; `.xml`, `.mid`, `.js` stay false

### Implementation for User Story 1

- [X] T011 [US1] Update `isFullSaveFormat` in `src/render/sui/scoreChangeState.ts` to accept `.smz` as well as `.json` (trimmed, case-insensitive)
- [X] T012 [US1] In `src/ui/dialogs/fileDialogs.ts` (`SuiFileSaveDialog`): make `getSmoContent` async using `SmoScoreArchive.pack`, default `extension` to `'.smz'`, make `changeExtensionCb` async (set `contents.value` before returning), keep `.smojson` mapping to plain full JSON with extension `.json`, and remove the old `'.json'` branch
- [X] T013 [US1] In `src/ui/components/dialogs/save.vue`: change the format list so "Smoosic" is `.smz` (default) and "Validation (large)" stays `.smojson`; accept `contents` as `string | Uint8Array`; store the pending promise returned by `changeExtensionCb` and `await` it in `saveFileCb` before clicking the download link, so saving right after changing format never uses stale content; keep `.smz` from being appended twice to the file name
- [X] T014 [US1] Run `npm run test:score-archive` and `npm run test:score-change-state`

**Checkpoint**: Saving works end to end and the save dialog defaults to `.smz`.

---

## Phase 4: User Story 2 - Open .smz or .json (Priority: P1)

**Goal**: The Open dialog accepts `.smz` and both kinds of `.json`, detecting by content, and so do remote loaders.

**Independent Test**: Save a score as `.smz`, reopen it, same score. Open a legacy abbreviated `.json`; it opens as before. Rename a `.smz` to `.json`; it still opens.

### Tests for User Story 2

- [X] T015 [P] [US2] In `tests/scoreArchive.ts` add: `load` of the legacy abbreviated `release/library/pennylane2 (6).json` text yields a score whose full serialization equals that of a `pack`/`load` round trip of the same score (FR-013, SC-003); `unpack` gives identical results for the same packed bytes passed as `ArrayBuffer` and `Uint8Array`; zip bytes with any imagined name load, and plain JSON bytes load (FR-008); text with a leading BOM loads; a second pack of a loaded `.smz` yields the same full document (FR-009)

### Implementation for User Story 2

- [X] T016 [US2] In `src/ui/fileio/fileInput.ts`: treat `.smz` as binary (`ArrayBuffer`); add an optional constructor argument `scoresAsBytes` (default false) that also reads `.json` as `ArrayBuffer`; leave `.mxl` and `.mid` handling and the default behavior for existing callers (`SuiFileDownloadComponent`) unchanged
- [X] T017 [US2] In `src/ui/dialogs/fileDialogs.ts` (`SuiFileUploadDialog`): create the input with `scoresAsBytes` true; route filenames ending `.json` or `.smz` (lower-cased) to the score loader; make `convertJson` async using `SmoScoreArchive.load(uploadedFile)`; `await` it in `commitCb`
- [X] T018 [P] [US2] Add `.smz` to the `accept` list on both file inputs in `src/ui/components/dialogs/fileUpload.vue`
- [X] T019 [US2] Add `loadScoreAsync()` to `SuiXhrLoader` in `src/ui/fileio/xhrLoader.ts`: request as a blob, read as `ArrayBuffer`, return `SmoScoreArchive.unpack`'s text; leave `loadAsync()` unchanged
- [X] T020 [US2] Switch score loads to it: `loadRemoteJson` in `src/render/sui/scoreViewOperations.ts` (`SmoScoreArchive.load` of the loader result), the configured `remoteScore` path in `createScore` in `src/application/application.ts` (use `loadScoreAsync` unless the URL ends in `xml`/`mxl`), and `renderVexTests` in `src/application/generateVexTests.ts`; keep the library list loader in `src/ui/fileio/library.ts` on `loadAsync`
- [X] T021 [US2] Run `npm run test:score-archive`; run the other `test:*` scripts

**Checkpoint**: Round trip works from the UI and from URLs; legacy scores still open.

---

## Phase 5: User Story 3 - Validation format (Priority: P2)

**Goal**: The validation save still produces plain full JSON and still opens.

**Independent Test**: Save with "Validation (large)": a plain-text `.json`, no `dictionary` key, no zip signature; open it back; same score as the `.smz`.

### Tests for User Story 3

- [X] T022 [P] [US3] In `tests/scoreArchive.ts` add: the validation text (`JSON.stringify(score.serialize({ useDictionary: false, skipStaves: false, preserveStaffIds: false }))`) is valid text with no `dictionary` key and not a zip; `load` of it equals the score loaded from its `.smz`; it is byte-for-byte the document inside the `.smz` entry (FR-005)

### Implementation for User Story 3

- [X] T023 [US3] In `src/ui/dialogs/fileDialogs.ts`, confirm `getSmoValidationContent` still writes the full document with the same options as before and returns a string; confirm `recordSave('.json')` still clears the changed flag; keep the file name suggestion `.json` for that option (adjust only if T012/T013 broke it)

**Checkpoint**: Validation output unchanged and readable.

---

## Phase 6: User Story 4 - Clear errors (Priority: P3)

**Goal**: An unreadable file shows a message and the open score is untouched.

**Independent Test**: Try a truncated `.smz`, a zip with no score, and text renamed `.smz`: each shows a message, and the open score is unchanged.

### Tests for User Story 4

- [X] T024 [P] [US4] In `tests/scoreArchive.ts` add: truncated packed bytes (cut to half) make `load` throw an error whose message mentions the archive; a zip made with only `readme.txt` throws a "no score" error; `{"hello":1}` throws "not a score"; empty input throws; none of these touch a score object the test holds (FR-010, SC-005)

### Implementation for User Story 4

- [X] T025 [US4] In `src/ui/dialogs/fileDialogs.ts` (`SuiFileUploadDialog`): catch the error from `convertJson`, keep `pendingScore` null, remember the message, and in `afterCloseCb` show it with the `modalMessage.vue` dialog (headline "Could not open file", the message, OK button), using `replaceVueRoot(modalContainerId)` and `InstallDialog` as the print dialog does; make sure no score replacement or unsaved-changes prompt happens on failure
- [X] T026 [US4] Check the remote path: a failure in `loadRemoteJson` or `createScore` must not leave the application without a score (`createScore` already falls back through `tryParse`; make `tryParse` also accept the new loader's text and keep its default-score fallback)

**Checkpoint**: Failure paths are safe and visible.

---

## Phase 7: Polish & Cross-Cutting

- [X] T027 [P] Regenerate declarations with `npm run types`, keep only `types/src/ui/fileio/scoreArchive.d.ts` (plus the small `fileInput.d.ts`, `xhrLoader.d.ts` and `exports.d.ts` changes), and restore every other changed or untracked file under `types/` (the generated output is otherwise stale)
- [X] T028 [P] Add a changelog entry to `changes.md`: scores save as compressed `.smz`, `.smz` and `.json` both open, validation format unchanged, the dictionary is no longer used for new files
- [X] T029 Run `tsc --noEmit -p tsconfig.json` and every `test:*` script in `package.json`; fix regressions
- [ ] T030 Walk through the manual checks in [quickstart.md](quickstart.md) in the running application

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → stories. Phase 2 blocks everything.
- US1 (Phase 3) and US2 (Phase 4) both depend on Phase 2 and are independent of each other, but US2's round-trip test needs `pack` from Phase 2; they touch `fileDialogs.ts` in different functions, so serialize those edits (T012, T017, T023, T025).
- US3 depends on T012/T013 (the save dialog changes). US4 depends on T017.
- Polish last.

## Parallel Opportunities

T009 and T010 (different test files), T018 (a Vue file) alongside T016/T017, T022 and T024 alongside implementation of earlier phases, and T027/T028.

## Implementation Strategy

1. Phases 1–2 (archive module), then US1 for a working `.smz` writer, then US2 so it can be read back (the pair is the usable MVP).
2. US3 and US4 harden the edges, then Polish.
