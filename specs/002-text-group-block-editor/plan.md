# Implementation Plan: Block-Aligned Text Group Editor

**Branch**: `002-text-group-block-editor` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-text-group-block-editor/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Rework `textGroupEditor.vue` (and its `textGroupHtml.ts` conversion helpers) so the TipTap-based editing surface matches how `SmoTextGroup` actually works: exactly one `SmoScoreText` block is editable at a time (the "active" block), it inherits that block's existing font/weight/style automatically, and every other block in the group renders alongside it as a read-only atom, arranged per the group's single `relativePosition` (new line per block for ABOVE/BELOW, joined on one line for LEFT/RIGHT). The manual TipTap formatting toolbar (bold/italic/superscript/subscript/align/font-family/font-size) is removed entirely. A new control strip replaces it: add block (+), remove active block (X), previous/next block (◄ ►, disabled at the ends), and a relative-position dropdown that edits the whole group. `textBlock.vue` (the parent dialog, from feature 001) is updated only to the extent needed to keep its existing font picker in sync with the now-changeable active block while the editor stays open.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: Vue 3 (`vue`); TipTap 3.30 (`@tiptap/vue-3`, `@tiptap/core`, `@tiptap/pm`) — `@tiptap/starter-kit` retained for baseline paragraph/text/history handling, but `@tiptap/extension-text-align`, `@tiptap/extension-superscript`, `@tiptap/extension-subscript`, and `@tiptap/extension-text-style` (`TextStyle`/`FontFamily`/`FontSize`) are dropped since the marks/attrs they provide are exactly the per-run formatting being removed; a small custom TipTap Node extension is added in-repo to render non-active blocks as atomic, non-editable, styled leaves (TipTap has no built-in "read-only styled text atom" node, so this is authored locally, following the existing pattern of small custom extensions already in `@tiptap/core`'s public `Node.create()` API); existing in-repo Vue dialog components (`select.vue` for the relative-position dropdown, `fontPicker.vue` unchanged) reused as-is

**Storage**: N/A — operates on in-memory `SmoTextGroup`/`SmoScoreText`/`SmoTextBlock` score model (`src/smo/data/scoreText.ts`); no persistence or serialization format changes (block-level font/weight/style, `relativePosition`, and `activeText` already exist on the model exactly as this feature needs them — see `getActiveBlock`/`setActiveBlock`/`setRelativePosition`/`addScoreText`/`removeBlock`/`indexOf` on `SmoTextGroup`)

**Testing**: No automated unit/integration test runner is wired up in this repo (`npm test` is a no-op placeholder, consistent with feature 001). Verification is manual: build with `npm run build`, serve with `npm run server`, and exercise the editor in a browser against the demo/dev score app, per `quickstart.md`

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`

**Project Type**: Single front-end library project (no frontend/backend split) — all changes are within `src/ui`

**Performance Goals**: No new performance targets; switching the active block (add/remove/prev/next/relative-position change) must feel instantaneous (single synchronous Vue re-render + TipTap `setContent`, no perceptible lag), matching SC-003/SC-004 in the spec

**Constraints**: Must preserve the existing `textGroupEditor.vue` public contract used by `textBlock.vue` (`getTextGroup(): SmoTextGroup`, `insertAtCursor(token: string)` via `defineExpose`) since feature 001's dialog depends on it; must not change `SmoTextGroup`/`SmoScoreText` serialization format; per spec Assumptions, justification/alignment editing stays out of scope and its stored value is left untouched; a group with zero blocks must still present exactly one editable (empty) block per spec edge cases

**Scale/Scope**: Two existing files rewritten (`src/ui/components/dialogs/textGroupEditor.vue`, `src/ui/components/dialogs/textGroupHtml.ts`), one new small TipTap Node extension file, and a small integration touch-up in `src/ui/components/dialogs/textBlock.vue` (feature 001) to resync its font picker when the active block changes inside an open editing session; no new top-level components, no data-model changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No project constitution has been ratified (`.specify/memory/constitution.md` is still the unfilled template — no principles, no gates defined). As with feature 001, this plan follows the existing established conventions in the codebase (Vue SFCs under `src/ui/components/dialogs/`, TipTap for rich-text editing surfaces, `SelectOption`-based dropdowns via `select.vue`) rather than any codified constitution. **Gate: PASS (no constitution to violate)**.

## Project Structure

### Documentation (this feature)

```text
specs/002-text-group-block-editor/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/ui/components/dialogs/
├── textGroupEditor.vue     # REWRITTEN: drop formatting toolbar; add block-management
│                            # control strip (+, X, ◄, ►, relative-position dropdown);
│                            # render single active editable block + read-only atom
│                            # blocks arranged per relativePosition
├── textGroupHtml.ts        # REWRITTEN: textGroupToHtml/htmlToTextGroup replaced by
│                            # conversions that (a) emit only the active block as plain
│                            # editable paragraph content, (b) emit non-active blocks as
│                            # the new atom node with their own font/weight/style baked
│                            # into its rendering, (c) arrange blocks per relativePosition
├── textBlockAtomNode.ts     # NEW: small TipTap Node extension — atomic, non-editable,
│                            # styled leaf node used to render a non-active SmoScoreText
│                            # block inline in the TipTap document
├── textBlock.vue            # TOUCHED (feature 001 file): subscribe to the editor's
│                            # active-block-changed signal while mode === 'editing' so the
│                            # existing fontPickerComp (which already watches props.font)
│                            # stays in sync with the now-navigable active block
├── select.vue               # EXISTING — reused unmodified for the relative-position dropdown
└── fontPicker.vue           # EXISTING — reused unmodified (already resyncs from props.font)
```

**Structure Decision**: Single front-end project — no frontend/backend split. All changes live under the existing `src/ui/components/dialogs/` directory established by feature 001; no new top-level directories, no new build targets, and no changes to the score data model in `src/smo/data/`.

## Complexity Tracking

*No constitution violations — table intentionally omitted.*
