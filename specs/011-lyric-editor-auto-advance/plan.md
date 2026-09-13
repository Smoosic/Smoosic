# Implementation Plan: Lyric Editor Auto-Advance

**Branch**: `011-lyric-editor-auto-advance` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-lyric-editor-auto-advance/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Extend `lyricEditor.vue` (the plain-text TipTap panel introduced in `010-vue-lyric-dialog`) so that typing `-` appends the hyphen and requests forward navigation, and typing Space requests forward navigation without inserting a character — mirroring the note-advance semantics already present in the legacy `SuiLyricSession.evKey()` (`src/render/sui/textEdit.ts`), but adapted to this feature's own nuance: when Space is pressed while the current note's text is empty, navigation happens without writing anything to the score, so skipping notes never leaves behind empty lyrics. `lyricEditor.vue` gains a new `advance` emit carrying whether the parent should commit-then-navigate (hyphen, or Space with non-empty text) or navigate-without-committing (Space with empty text); `lyric.vue` handles it by reusing its existing `navigate('next')`/`commitIfChanged()` logic for the first case, and a small new no-write variant for the second. No new files; no changes to `SuiLyricDialog`, the legacy `SuiLyricSession`/`SuiLyricEditor`, or any other Vue dialog.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: `@tiptap/core` (`Extension.create`, keyboard-shortcut binding — already used by `lyricEditor.vue`'s `LyricNoHardBreak` extension for Enter/Shift-Enter), `@tiptap/vue-3`; no new dependencies

**Storage**: N/A — operates on the same in-memory `SmoLyric`/`SmoNote` score model via `SuiScoreViewOperations` established in `010-vue-lyric-dialog`; no persistence changes beyond reusing `view.addOrUpdateLyric`

**Testing**: No automated unit/integration test runner is wired up in this repo (`npm test` is a no-op placeholder). Verification is manual: build with `npm run build`, serve with `npm run server`, and exercise the dialog in a browser against the demo/dev score app, per `quickstart.md`

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`

**Project Type**: Single front-end library project (no frontend/backend split) — all changes are within `src/ui/components/dialogs/`

**Performance Goals**: No new performance targets; keystroke handling must remain imperceptibly fast (a single ProseMirror command plus one Vue event emit per keystroke)

**Constraints**: Must not change how the existing next/previous-note arrow controls, delete control, or mode toggle behave (FR-005); must not reintroduce the legacy `SuiLyricSession`/`SuiLyricEditor` inline-SVG typing surface or its space/hyphen handling (`010-vue-lyric-dialog` research.md §3, §12 — this feature reimplements the *behavior*, not the legacy code path); must not add a backward-navigation keyboard shortcut (spec Assumptions)

**Scale/Scope**: Two existing files modified (`src/ui/components/dialogs/lyricEditor.vue`, `src/ui/components/dialogs/lyric.vue`); no new files, no new score-model fields

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No project constitution has been ratified (`.specify/memory/constitution.md` contains only high-level project principles — serialization, music-editing/transformation logic, rendering performance, logical dependencies — no gates specific to UI dialogs). This feature touches no code under `src/smo` (Principle #1/#2) or the core render pipeline (Principle #3); it is a small, additive change entirely within the Vue dialog layer established by `010-vue-lyric-dialog`. **Gate: PASS (no constitution to violate)**.

## Project Structure

### Documentation (this feature)

```text
specs/011-lyric-editor-auto-advance/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/ui/components/dialogs/
├── lyricEditor.vue     # MODIFIED: extend the existing LyricNoHardBreak-style extension with
│                        #   '-' and 'Space' keyboard shortcuts; add an `advance` emit
└── lyric.vue            # MODIFIED: listen for lyricEditorComp's `advance` emit; reuse
                          #   navigate('next') for the commit case, add a small no-write
                          #   variant for the skip-empty case

src/render/sui/
└── textEdit.ts           # EXISTING SuiLyricSession.evKey — read as the behavioral reference
                           #   (research.md), not modified; this feature does not use this class
```

**Structure Decision**: No new files. Both changes live in the two Vue components `010-vue-lyric-dialog` already introduced, matching that feature's existing file layout and conventions exactly.

## Complexity Tracking

*No entries — Constitution Check has no violations (no ratified constitution to violate; the design is a small, additive change following the existing 010 conventions with no added complexity to justify).*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* Design decisions in [research.md](./research.md) (TipTap keyboard-shortcut interception rather than input rules, a keystroke-time emptiness check rather than an original-vs-current diff, and reusing `navigate()`/`commitIfChanged()` rather than duplicating them) stay within the existing Vue-dialog convention, touch no code under `src/smo` or the core renderer, and modify no shared/legacy call sites. **Gate: PASS.**
