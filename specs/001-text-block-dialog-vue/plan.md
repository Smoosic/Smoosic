# Implementation Plan: Vue-Based Text Properties Dialog

**Branch**: `001-text-block-dialog-vue` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-text-block-dialog-vue/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Re-implement `SuiTextBlockDialog` (`src/ui/dialogs/textBlock.ts`) as a Vue-based dialog, `SuiTextBlockDialogVue`, following the plain creation-function pattern of `SuiTimeSignatureDialogVue` (`src/ui/dialogs/timeSignature.ts`). The new `textBlock.vue` component reimplements every control enumerated in `SuiTextBlockDialog.dialogElements` — text editing, insert-special, move-text, X/Y position, font, page behavior, attach-to-selection, and remove — using existing Vue building blocks (`numberInput.vue`, `select.vue`, `fontPicker.vue`, and a refactored, embeddable `textGroupEditor.vue`), plus a thin Vue shell around the existing mouse-driven `SuiDragText`/`SuiDragSession` drag logic. Mode (idle / editing / moving) is tracked as reactive Vue state that drives which controls are shown, replacing the legacy `hide-when-editing` / `hide-when-moving` CSS-class mechanism. This is an additive, internal migration: `SuiTextBlockDialog` and its call sites are untouched; wiring callers to the new dialog is out of scope.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: Vue 3 (`vue`), TipTap 3.30 (`@tiptap/vue-3`, `@tiptap/starter-kit`, `@tiptap/extension-{text-align,superscript,subscript,text-style}`) already used by `textGroupEditor.vue`; existing in-repo Vue dialog components (`dialogContainer.vue`, `dialogButtons.vue`, `numberInput.vue`, `select.vue`, `fontPicker.vue`); existing legacy drag/edit runtime (`SuiDragSession`, `SuiTextEditor` in `src/render/sui/textEdit.ts`) reused as-is, not rewritten

**Storage**: N/A — operates on in-memory `SmoTextGroup`/`SmoScoreText` score model via `SuiScoreViewOperations` (`updateTextGroup`, `addTextGroup`, `removeTextGroup`, `groupUndo`); no persistence changes

**Testing**: No automated unit/integration test runner is wired up in this repo (`npm test` is a no-op placeholder). Verification is manual: build with `npm run build`, serve with `npm run server`, and exercise the dialog in a browser against the demo/dev score app, per `quickstart.md`

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`

**Project Type**: Single front-end library project (no frontend/backend split) — all changes are within `src/ui`

**Performance Goals**: No new performance targets; must remain responsive to keystroke/drag input at the same interactive latency as the legacy dialog (no perceptible added lag from Vue reactivity or TipTap)

**Constraints**: Must preserve exact current behavior (SC-001) — same undo grouping, same auto-edit-on-first-open, same mutual exclusion of edit/move modes, same attach-to-selection/pagination coupling; must not modify `SuiTextBlockDialog` or its call sites; drag interaction must keep manipulating the SVG canvas directly outside Vue's reactivity (per spec Assumptions)

**Scale/Scope**: One new dialog component (`src/ui/components/dialogs/textBlock.vue`) plus one new creation function (`src/ui/dialogs/textBlockVue.ts` or equivalent), a refactor of `textGroupEditor.vue` to be embeddable, and a small Vue shell for the existing drag control; no changes to the score data model

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No project constitution has been ratified (`.specify/memory/constitution.md` is still the unfilled template — no principles, no gates defined). Per the spec's Assumptions, no additional project-specific principles apply beyond the Vue dialog conventions already established in the codebase (`src/ui/dialogs/*.ts` creation functions paired with `src/ui/components/dialogs/*.vue` components, as seen in `SuiTimeSignatureDialogVue`). This plan follows that existing convention. **Gate: PASS (no constitution to violate)**.

## Project Structure

### Documentation (this feature)

```text
specs/001-text-block-dialog-vue/
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
│   ├── textBlock.ts            # EXISTING legacy SuiTextBlockDialog — untouched
│   ├── timeSignature.ts        # EXISTING reference pattern for the new creation fn
│   ├── textBlockVue.ts         # NEW: SuiTextBlockDialogVue creation function
│   └── components/
│       └── dragText.ts         # EXISTING SuiDragText — drag session logic reused as-is
└── components/dialogs/
    ├── textBlock.vue           # NEW: top-level dialog component (mirrors dialogElements)
    ├── textDragger.vue         # NEW: thin Vue shell over SuiDragSession (start/stop control)
    ├── textGroupEditor.vue     # EXISTING — refactored to be embeddable (no own OK/Cancel)
    ├── textGroupHtml.ts        # EXISTING — SmoTextGroup <-> TipTap JSON conversion, reused
    ├── numberInput.vue         # EXISTING — reused for X/Y position
    ├── select.vue              # EXISTING — reused for Insert Special / Page Behavior
    ├── fontPicker.vue          # EXISTING — reused for font family/size/weight/style
    └── dialogContainer.vue     # EXISTING — reused for the dialog's own OK/Cancel/Remove shell

src/render/sui/
└── textEdit.ts                 # EXISTING SuiDragSession/SuiTextEditor — reused unmodified
```

**Structure Decision**: Single front-end project — no frontend/backend split. All new files live under the existing `src/ui/dialogs/` (creation function) and `src/ui/components/dialogs/` (Vue components) directories, matching the established pairing convention (`src/ui/dialogs/<name>.ts` + `src/ui/components/dialogs/<name>.vue`) already used by `timeSignature.ts` / `timeSignature.vue`. No new top-level directories or build targets are introduced.

## Complexity Tracking

*No entries — Constitution Check has no violations (no ratified constitution to violate; the design follows existing repo conventions with no added complexity to justify).*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* Design decisions in [research.md](./research.md) (refactoring `textGroupEditor.vue` to be embeddable, a single `DialogMode` ref instead of per-control CSS classes, reusing `SuiDragSession` unmodified) stay within the existing Vue-dialog convention and touch no shared/legacy call sites. **Gate: PASS.**
