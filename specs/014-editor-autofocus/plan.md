# Implementation Plan: Text Editor Autofocus on Open

**Branch**: `014-editor-autofocus` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-editor-autofocus/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Make keyboard focus land automatically in the TipTap-based text editor of each of the three dialog components that embed one — `chordEditor.vue`, `lyricEditor.vue`, and `textGroupEditor.vue` — every time that editor becomes the visible view, not only the dialog's very first paint. All three host dialogs (`chord.vue`, `lyric.vue`, `textBlock.vue`) already gate their editor behind `v-if="mode === 'editing'"` (or equivalent), so Vue destroys and recreates the embedded editor component — and with it, the underlying TipTap `Editor` instance via `useEditor()` — every time the dialog re-enters editing mode. This means a single per-component fix at editor-construction time naturally covers both the initial-open case (User Story 1) and the resume-editing-later case (User Story 2), with no new dialog-level wiring needed. `lyricEditor.vue` and `chordEditor.vue` (always a single, simple one-paragraph document) get TipTap's built-in `autofocus: 'end'` `useEditor` option, which places a collapsed cursor at the end of the document with no separate imperative code needed. `textGroupEditor.vue` (a document that can contain multiple text blocks, only one of which — the "active" block — is editable, the rest rendered as read-only atom nodes) instead calls the same `editor.commands.focus()` primitive its existing `activateBlock()` handler already uses for the identical "land focus back in the editor after the document changed" problem, invoked once via TipTap's `onCreate` editor-lifecycle callback, so the very first appearance of the editor is handled the same, already-accepted, best-effort way as every subsequent block switch.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: TipTap 3.30 (`@tiptap/vue-3`, `@tiptap/core`'s `useEditor` `autofocus` option and `onCreate` lifecycle callback, both already available in the installed version) — no new dependency

**Storage**: N/A — this is a keyboard-focus/UI behavior change only; no score/data model is read or written

**Testing**: No automated unit/integration test runner is wired up in this repo (`npm test` is a no-op placeholder). Verification is manual: build with `npm run build`, serve with `npm run server`, and confirm focus lands in each editor per `quickstart.md`

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`

**Project Type**: Single front-end library project (no frontend/backend split) — all changes are within three existing files under `src/ui/components/dialogs/`

**Performance Goals**: No new performance targets; this is a one-time focus call per editor mount, not a per-keystroke or per-render cost

**Constraints**: Must not change any dialog's mode-transition logic, control visibility, or data flow (spec FR-005) — this is additive-only within the three editor components' own `useEditor` construction; must not select/highlight any existing text as a side effect (spec FR-004)

**Scale/Scope**: Three existing files modified (`src/ui/components/dialogs/chordEditor.vue`, `src/ui/components/dialogs/lyricEditor.vue`, `src/ui/components/dialogs/textGroupEditor.vue`); no new files, no changes to any host dialog (`chord.vue`, `lyric.vue`, `textBlock.vue`) or to any non-UI code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No project constitution gate applies specifically to UI focus/interaction behavior (`.specify/memory/constitution.md` covers serialization, music-editing/transformation logic, rendering performance, and logical dependencies). This feature touches no code under `src/smo` (Principle #1/#2) or the core render pipeline (Principle #3), and adds no new UI-to-rendering coupling (Principle #4) — it is a small, additive change entirely within three existing Vue components' own TipTap editor construction. **Gate: PASS (no constitution to violate)**.

## Project Structure

### Documentation (this feature)

```text
specs/014-editor-autofocus/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is produced for this feature — see Phase 1 note below.

### Source Code (repository root)

```text
src/ui/components/dialogs/
├── chordEditor.vue         # MODIFIED: add `autofocus: 'end'` to useEditor()
├── lyricEditor.vue         # MODIFIED: add `autofocus: 'end'` to useEditor()
├── textGroupEditor.vue     # MODIFIED: add an `onCreate` callback to useEditor() that calls editor.commands.focus(), mirroring activateBlock()'s existing focus-after-content-change pattern
├── chord.vue               # EXISTING — untouched; already gates chordEditorComp behind v-if="mode === 'editing'"
├── lyric.vue                # EXISTING — untouched; already gates lyricEditorComp behind v-if="mode === 'editing'"
└── textBlock.vue            # EXISTING — untouched; already gates textGroupEditorComp behind v-if="mode === 'editing'"
```

**Structure Decision**: Single front-end project — no frontend/backend split. Every change lives inside the three existing embeddable editor components under `src/ui/components/dialogs/`; no new files, no host-dialog changes, no new top-level directories.

## Complexity Tracking

*No entries — Constitution Check has no violations, and the change is a small, additive use of an existing TipTap lifecycle option/callback with no added architecture.*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, quickstart.md).* Design decisions in [research.md](./research.md) (using `autofocus: 'end'` for the two single-paragraph editors, and an `onCreate`-driven `editor.commands.focus()` call — reusing the exact primitive `activateBlock()` already relies on — for the multi-block text-group editor) stay within each component's existing TipTap usage, touch no host dialog, no `src/smo`, and no renderer code. **Gate: PASS.**
