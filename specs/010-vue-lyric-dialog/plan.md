# Implementation Plan: Vue-Based Lyric Dialog

**Branch**: `010-vue-lyric-dialog` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-vue-lyric-dialog/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Re-implement `SuiLyricDialog` (`src/ui/dialogs/lyric.ts`) as a Vue-based dialog, `SuiLyricDialogVue`, following the same plain creation-function pattern used by `SuiTextBlockDialogVue` (`src/ui/dialogs/textBlockVue.ts`). The new `lyric.vue` component reimplements every control enumerated in `SuiLyricDialog.dialogElements` — Verse, Y Adjustment, Font, and the lyric text editor — using existing Vue building blocks (`select.vue`, `numberInput.vue`, `fontPicker.vue`), plus a new embeddable, plain-text-only TipTap component (`lyricEditor.vue`) modeled on `textGroupEditor.vue` but stripped of every formatting affordance. A single `mode` ref (`'editing' | 'dialog'`) replaces the legacy `hide-when-editing` / `show-when-editing` CSS-class mechanism, matching the spec's edit-mode/dialog-mode split. Note-to-note navigation and delete reuse the underlying score operations behind `SuiNoteTextComponent`/`SuiLyricSession` (`SmoSelection.nextNoteSelectionFromSelector`/`lastNoteSelectionFromSelector`, `view.addOrUpdateLyric`, `view.removeLyric`) directly, rather than instantiating the legacy session/editor classes, because those classes exist to drive the inline-SVG typing cursor this feature replaces with the TipTap panel. This is an additive, internal migration: `SuiLyricDialog` and its call sites are untouched; wiring callers to the new dialog is out of scope.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: Vue 3 (`vue`), TipTap 3.30 (`@tiptap/vue-3`, `@tiptap/starter-kit`) already used by `textGroupEditor.vue`; existing in-repo Vue dialog components (`dialogContainer.vue`, `dialogButtons.vue`, `numberInput.vue`, `select.vue`, `fontPicker.vue`); existing score-operation methods on `SuiScoreViewOperations` (`addOrUpdateLyric`, `removeLyric`, `setLyricFont`) and selector-navigation statics on `SmoSelection` (`nextNoteSelectionFromSelector`, `lastNoteSelectionFromSelector`), all reused as-is

**Storage**: N/A — operates on the in-memory `SmoLyric` / `SmoNote` score model via `SuiScoreViewOperations`; no persistence changes

**Testing**: No automated unit/integration test runner is wired up in this repo (`npm test` is a no-op placeholder). Verification is manual: build with `npm run build`, serve with `npm run server`, and exercise the dialog in a browser against the demo/dev score app, per `quickstart.md`

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`

**Project Type**: Single front-end library project (no frontend/backend split) — all changes are within `src/ui`

**Performance Goals**: No new performance targets; must remain responsive to keystroke/navigation input at the same interactive latency as the legacy dialog

**Constraints**: Must preserve current functional behavior (SC-001) — same auto-start-editing-on-open, same hide-in-edit-mode/hide-in-dialog-mode split for the respective control groups, same navigate-then-advance-on-delete behavior, same score-wide semantics of the Font control (`view.setLyricFont` applies to all lyrics, seeded from the current note); must not modify `SuiLyricDialog` or its call sites

**Scale/Scope**: Two new files (`src/ui/dialogs/lyricVue.ts`, `src/ui/components/dialogs/lyric.vue`) plus one new embeddable TipTap component (`src/ui/components/dialogs/lyricEditor.vue`); no changes to the score data model

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No project constitution has been ratified (`.specify/memory/constitution.md` contains only high-level project principles around serialization, music-editing/transformation logic, rendering performance, and logical dependencies — no gates specific to UI dialogs). Per the spec's Assumptions, no additional project-specific principles apply beyond the existing Vue dialog conventions already established in the codebase (`src/ui/dialogs/*.ts` creation functions paired with `src/ui/components/dialogs/*.vue` components, as seen in `SuiTextBlockDialogVue` / `textBlock.vue`). This plan follows that existing convention and touches no code under `src/smo` (Principle #1/#2) or the core render pipeline (Principle #3); it stays entirely within the UI dialog layer. **Gate: PASS (no constitution to violate)**.

## Project Structure

### Documentation (this feature)

```text
specs/010-vue-lyric-dialog/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/ui/
├── dialogs/
│   ├── lyric.ts                 # EXISTING legacy SuiLyricDialog — untouched
│   ├── textBlockVue.ts          # EXISTING reference pattern for the new creation fn
│   ├── lyricVue.ts              # NEW: SuiLyricDialogVue creation function
│   └── components/
│       ├── noteText.ts          # EXISTING SuiNoteTextComponent/SuiLyricComponent — read for reference, untouched
│       └── rocker.ts            # EXISTING SuiRockerComponent — read for reference, untouched
└── components/dialogs/
    ├── lyric.vue                # NEW: top-level dialog component (mirrors dialogElements)
    ├── lyricEditor.vue          # NEW: embeddable plain-text TipTap editor for one lyric
    ├── numberInput.vue          # EXISTING — reused for Y Adjustment
    ├── select.vue                # EXISTING — reused for Verse
    ├── fontPicker.vue            # EXISTING — reused for Font (family/size only consumed)
    └── dialogContainer.vue       # EXISTING — reused for the dialog's own OK/Cancel shell (no Remove button)

src/render/sui/
└── scoreViewOperations.ts        # EXISTING addOrUpdateLyric/removeLyric/setLyricFont — reused unmodified

src/smo/xform/
└── selections.ts                 # EXISTING SmoSelection.nextNoteSelectionFromSelector/lastNoteSelectionFromSelector — reused unmodified
```

**Structure Decision**: Single front-end project — no frontend/backend split. All new files live under the existing `src/ui/dialogs/` (creation function) and `src/ui/components/dialogs/` (Vue components) directories, matching the established pairing convention (`src/ui/dialogs/<name>.ts` + `src/ui/components/dialogs/<name>.vue`) already used by `textBlockVue.ts` / `textBlock.vue`. No new top-level directories or build targets are introduced.

## Complexity Tracking

*No entries — Constitution Check has no violations (no ratified constitution to violate; the design follows existing repo conventions with no added complexity to justify).*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* Design decisions in [research.md](./research.md) (bypassing `SuiLyricSession`/`SuiLyricEditor` in favor of the underlying selection/score operations, a single `DialogMode` ref instead of per-control CSS classes, dropping the legacy space/hyphen keyboard-advance shortcut, and treating the Font control's score-wide `setLyricFont` semantics as an intentional carry-over) stay within the existing Vue-dialog convention, touch no code under `src/smo` or the core renderer, and modify no shared/legacy call sites. **Gate: PASS.**
