# Implementation Plan: Compressed Score Files (.smz)

**Branch**: `034-smz-compressed-scores` (work is on `main`; no feature branch was created) | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/034-smz-compressed-scores/spec.md`

## Summary

Add a small, DOM-free module that turns a score into a `.smz` archive (a zip holding one full, un-abbreviated score document) and turns bytes or text from any supported score file (`.smz`, legacy abbreviated `.json`, validation `.json`) back into the JSON text that `SmoScore.deserialize` already understands. Wire it into the save dialog (default format becomes `.smz`, validation stays plain `.json`), the Open dialog, and the remote/library loaders. Detection is by content (zip signature), so a mis-named file still works. Failures leave the open score alone and show a message.

Measured on the one library score in the repo: the full document zipped is 1,857 bytes, against 17,627 for today's default save and 22,112 for the validation text, so the dictionary is not needed (see [research.md](research.md) R1).

## Technical Context

**Language/Version**: TypeScript, tests run with `ts-node` (see `tests/tsconfig.json`).

**Primary Dependencies**: JSZip v3.6.0, already shipped (`src/common/jszip.js`, `release/jszip.js`, loaded by a script tag, declared as `JSZip: 'JSZip'` in webpack externals and used as `declare var JSZip: any` in `src/ui/fileio`). No new dependency. Vue 3 for the dialogs.

**Storage**: User-chosen files on disk (download link on save, file input on open); remote files over XHR. The browser's automatic local-storage copy is untouched.

**Testing**: Headless `ts-node` script `tests/scoreArchive.ts` (npm script `test:score-archive`). In Node the global `JSZip` is provided by `require('../src/common/jszip.js')`.

**Target Platform**: Browser application and library; the archive module is also usable headless.

**Project Type**: Single project.

**Performance Goals**: Save and open within 1 second of the previous format on a typical score (SC-004). Compression and decompression are asynchronous and do not block rendering.

**Constraints**: Must open every existing `.json` score unchanged. The data model in `src/smo` stays free of file and UI concerns (constitution principle 4); `TextDecoder`/`TextEncoder` and the `JSZip` global are the only platform pieces.

**Scale/Scope**: One new module, edits to about six existing files, one new test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| #1 Serialization (scores must serialize and deserialize, including legacy) | Pass. This feature is about serialization. The score document is unchanged; only the container changes. Legacy abbreviated and validation JSON stay readable, and tests cover each. |
| #2 Editing/transformation logic regression tested | Pass. Round-trip, legacy, validation and failure cases are all headless tests. |
| #3 Rendering performance | Pass. No render-path change; compression is async and off the render path. |
| #4 Logical dependencies | Pass. The archive module sits in `src/ui/fileio` with the other load utilities, and nothing in `src/smo` refers to it. It depends on `SmoScore`; the dependency does not run the other way. |

Re-check after Phase 1 design: still passes. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/034-smz-compressed-scores/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── archive-api.md   # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/ui/fileio/scoreArchive.ts       # NEW: pack / unpack / load / isZip, no DOM dependency; with the other load utilities
src/smo/data/score.ts               # fix useDictionary option (reads skipStaves today)
src/ui/fileio/fileInput.ts          # read .smz (and, opt-in, .json) as bytes
src/ui/fileio/xhrLoader.ts          # loadScoreAsync(): read a score URL as bytes, return JSON text
src/ui/dialogs/fileDialogs.ts       # open: accept .smz, content detection, error message; save: .smz
src/ui/components/dialogs/fileUpload.vue   # accept list gains .smz
src/ui/components/dialogs/save.vue  # Smoosic = .smz, binary contents, wait for async content
src/render/sui/scoreChangeState.ts  # isFullSaveFormat accepts .smz
src/render/sui/scoreViewOperations.ts   # loadRemoteJson uses loadScoreAsync
src/application/application.ts      # remote initial score uses loadScoreAsync for .json/.smz
src/application/generateVexTests.ts # remote scores use loadScoreAsync
src/application/exports.ts          # export the new module
types/src/ui/fileio/scoreArchive.d.ts, fileInput.d.ts, xhrLoader.d.ts, exports.d.ts   # regenerated (only these)
tests/scoreArchive.ts               # NEW
tests/scoreChangeState.ts           # .smz is a full save
package.json                        # test:score-archive script
changes.md                          # changelog entry
```

**Structure Decision**: Single-project layout as it exists. A separate module in `src/ui/fileio` rather than methods on `SmoScore` or a file in `src/smo/data`, because it deals with bytes and the zip library like the other file loaders, while `SmoScore` and the data model deal with the document and know nothing about files.

## Complexity Tracking

No constitution violations to justify.
