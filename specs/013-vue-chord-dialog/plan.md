# Implementation Plan: Vue-Based Chord Change Dialog

**Branch**: `013-vue-chord-dialog` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-vue-chord-dialog/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Re-implement `SuiChordChangeDialog` (`src/ui/dialogs/chordChange.ts`) as a Vue-based dialog, `SuiChordChangeDialogVue`, following the exact creation-function pattern established by `SuiLyricDialogVue` (`010-vue-lyric-dialog`). The new `chord.vue` component reimplements every control in `SuiChordChangeDialog.dialogElements` — Ordinality, Y Adjustment, the chord text editor, Symbols, Text Position, Font, and Adjust Note Width — reusing `select.vue`, `numberInput.vue`, `fontPicker.vue`, and `toggle.vue`, plus a new `chordEditor.vue` TipTap component modeled on `lyricEditor.vue`. The chord editor is the one substantively new piece: `SmoLyric.text` for a chord (parser `SmoLyric.parsers.chord`) is not plain text — it is a small character-level format (`SmoLyric._tokenizeChordString`) mixing ordinary characters, `^`/`%` superscript/subscript toggles, and `@<glyphKey>@`-wrapped music-glyph tokens, consumed independently at real render time by `vxNote.ts`'s `addChordChangeToNote`/`getVexChordBlocks` (unrelated to any editor). Per the feature description, `chordEditor.vue` does not attempt to reproduce the Bravura glyphs pixel-for-pixel inline in TipTap; it edits a plain-text projection of that same format (using the standard `@tiptap/extension-superscript`/`-subscript` marks for accurate super/subscript preview, and a small custom mark carrying the resolved glyph key for music-glyph runs, displayed as a placeholder character), and periodically (debounced, per `012-lyric-live-preview-cursor`'s pattern) re-serializes back to the authoritative `SmoLyric.text` format and commits it via `view.addOrUpdateLyric`, so the real score rendering — already correct and untouched — is what the user sees update in place. This is an additive, internal migration: `SuiChordChangeDialog` and its call sites are untouched; wiring callers over is out of scope.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: Vue 3 (`vue`); TipTap 3.30 (`@tiptap/vue-3`, `@tiptap/starter-kit`, already used by `lyricEditor.vue`/`textGroupEditor.vue`); `@tiptap/extension-superscript` and `@tiptap/extension-subscript` (already in `package.json`, not yet used anywhere in `src/` — first consumer is this feature); existing in-repo Vue dialog components (`dialogContainer.vue`, `numberInput.vue`, `select.vue`, `fontPicker.vue`, `toggle.vue`); existing score-operation methods on `SuiScoreViewOperations` (`addOrUpdateLyric`, `removeLyric`, `setChordFont`) and `score.setChordAdjustWidth`, plus selector-navigation statics on `SmoSelection` (`nextNoteSelectionFromSelector`, `lastNoteSelectionFromSelector`) — all reused as-is; pure, UI-independent chord-text helpers reused as-is: `SmoLyric._tokenizeChordString`/`_chordGlyphFromCode` (`src/smo/data/noteModifiers.ts`), `getChordSymbolGlyphFromCode`/`ChordSymbolGlyphs` (`src/common/vex.ts`), `SuiInlineText.textTypes`/`getTextTypeResult`/`getTextTypeTransition` and `SuiTextEditor.textTypeToChar`/`textTypeFromChar` (`src/render/sui/textRender.ts`, `src/render/sui/textEdit.ts`)

**Storage**: N/A — operates on the in-memory `SmoLyric` (parser `chord`) / `SmoNote` score model via `SuiScoreViewOperations`; no persistence/schema changes

**Testing**: No automated unit/integration test runner is wired up in this repo (`npm test` is a no-op placeholder). Verification is manual: build with `npm run build`, serve with `npm run server`, and exercise the dialog in a browser against the demo/dev score app, per `quickstart.md`. The one piece of genuinely new logic (encode/decode between the plain-text-with-marks TipTap document and the raw `@key@`/`^`/`%` chord-text format) is pure and framework-independent, so it is the one place a small standalone unit test (round-trip encode→decode→encode) would be practical if the project's test setup allows it — flagged as an optional addition in tasks, not required by `npm test` being a no-op.

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`

**Project Type**: Single front-end library project (no frontend/backend split) — all changes are within `src/ui` (plus reads of already-exported pure helpers in `src/common` and `src/render/sui`)

**Performance Goals**: No new performance targets; must remain responsive to keystroke/navigation input at the same interactive latency as the legacy dialog; periodic score updates while typing debounced (~400ms, matching `012`'s `PREVIEW_DEBOUNCE_MS`) so they never run on every keystroke (FR-021)

**Constraints**: Must preserve current functional behavior (SC-001) — same auto-start-editing-on-open, same edit-mode/dialog-mode control split, same navigate-then-advance-on-delete behavior, same score-wide semantics of Font and Adjust Note Width, and — critically — byte-identical `SmoLyric.text` output for a given sequence of keystrokes/dropdown picks, so the untouched `vxNote.ts` rendering pipeline renders identically to today; must not modify `SuiChordChangeDialog` or its call sites, and must not modify `vxNote.ts`/`smoAdapter.ts`/`noteModifiers.ts`'s existing chord-text parsing

**Scale/Scope**: Three new files (`src/ui/dialogs/chordChangeVue.ts`, `src/ui/components/dialogs/chord.vue`, `src/ui/components/dialogs/chordEditor.vue`) plus one new small shared pure-logic module for chord-text encode/decode (see research.md §2–§4); no changes to the score data model or the real chord-rendering pipeline

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No project constitution gate specific to UI dialogs is ratified (`.specify/memory/constitution.md` covers serialization, music-editing/transformation logic, rendering performance, and logical dependencies — no UI-dialog-specific principles). Per the spec's Assumptions, this plan follows the existing Vue-dialog convention already established (`src/ui/dialogs/*.ts` creation functions paired with `src/ui/components/dialogs/*.vue` components), as precedented by `010-vue-lyric-dialog`. It touches no code under `src/smo` (Principle #1/#2) or the core render pipeline (Principle #3) — it only *reads* already-exported pure helpers from those layers, changing none of them, and it keeps rendering/UI concerns separated (Principle #4): the new chord-text encode/decode helper is pure data logic with no SVG/DOM dependency, callable from a Vue component without pulling in any of the legacy SVG-editor classes. **Gate: PASS (no constitution to violate)**.

## Project Structure

### Documentation (this feature)

```text
specs/013-vue-chord-dialog/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/ui/
├── dialogs/
│   ├── chordChange.ts            # EXISTING legacy SuiChordChangeDialog — untouched
│   ├── lyricVue.ts               # EXISTING reference pattern for the new creation fn (010)
│   ├── chordChangeVue.ts         # NEW: SuiChordChangeDialogVue creation function
│   └── components/
│       └── noteText.ts           # EXISTING SuiNoteTextComponent/SuiChordComponent — read for reference, untouched
└── components/dialogs/
    ├── chord.vue                 # NEW: top-level dialog component (mirrors dialogElements)
    ├── chordEditor.vue           # NEW: embeddable TipTap editor for one chord symbol
    ├── chordText.ts              # NEW: pure encode/decode between TipTap doc <-> SmoLyric chord-text string
    ├── lyric.vue                 # EXISTING (010) — read as the closest structural precedent
    ├── lyricEditor.vue           # EXISTING (010/011/012) — read as the closest structural precedent
    ├── numberInput.vue           # EXISTING — reused for Y Adjustment
    ├── select.vue                 # EXISTING — reused for Ordinality, Symbols, Text Position
    ├── toggle.vue                 # EXISTING — reused for Adjust Note Width
    ├── fontPicker.vue             # EXISTING — reused for Font (family/size only consumed)
    └── dialogContainer.vue        # EXISTING — reused for the dialog's own OK/Cancel shell (no Remove button)

src/render/sui/
└── scoreViewOperations.ts         # EXISTING addOrUpdateLyric/removeLyric/setChordFont — reused unmodified

src/smo/data/
└── noteModifiers.ts               # EXISTING SmoLyric._tokenizeChordString/_chordGlyphFromCode, adjustNoteWidthChord — reused unmodified

src/common/
└── vex.ts                         # EXISTING getChordSymbolGlyphFromCode/ChordSymbolGlyphs — reused unmodified

src/render/sui/
├── textRender.ts                  # EXISTING SuiInlineText.textTypes/getTextTypeResult/getTextTypeTransition — reused unmodified
└── textEdit.ts                    # EXISTING SuiTextEditor.textTypeToChar/textTypeFromChar — reused unmodified; SuiChordSession/SuiChordEditor read for reference, untouched

src/smo/xform/
└── selections.ts                  # EXISTING SmoSelection.nextNoteSelectionFromSelector/lastNoteSelectionFromSelector — reused unmodified
```

**Structure Decision**: Single front-end project — no frontend/backend split. All new files live under the existing `src/ui/dialogs/` (creation function) and `src/ui/components/dialogs/` (Vue components + the one pure helper module) directories, matching the established pairing convention already used by `chordChangeVue.ts`'s sibling `lyricVue.ts`. No new top-level directories or build targets are introduced.

## Complexity Tracking

*No entries — Constitution Check has no violations (no ratified constitution to violate; the design follows existing repo conventions, and the one net-new piece of logic — chord-text encode/decode — is a small, pure, isolated module rather than an architectural addition).*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* Design decisions in [research.md](./research.md) (bypassing `SuiChordSession`/`SuiChordEditor`'s SVG editor in favor of the underlying selection/score operations plus a small pure encode/decode module; representing music glyphs as a custom TipTap mark carrying the resolved glyph key rather than attempting true mixed-font rendering; using the stock `@tiptap/extension-superscript`/`-subscript` marks for Text Position; reusing `SmoLyric._tokenizeChordString` and `SuiInlineText`'s text-type-transition statics verbatim instead of re-deriving the toggle-character state machine) stay within the existing Vue-dialog convention, touch no code under `src/smo` or the core renderer (only read from it), and modify no shared/legacy call sites. **Gate: PASS.**
