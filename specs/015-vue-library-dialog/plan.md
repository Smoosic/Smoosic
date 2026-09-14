# Implementation Plan: Vue-Based Music Library Dialog

**Branch**: `015-vue-library-dialog` | **Date**: 2026-09-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-vue-library-dialog/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Re-implement `SuiLibraryDialog`/`SuiLibraryAdapter` (`src/ui/dialogs/library.ts`) as a Vue-based dialog, `SuiLibraryDialogVue`, following the established creation-function + `InstallDialog` pattern (`010-vue-lyric-dialog`, `013-vue-chord-dialog`), paired with a new general-purpose recursive Vue component, `treeNode.vue`, that replaces `SuiTreeComponent` (`src/ui/dialogs/components/tree.ts`) — the codebase's first self-referencing/recursive Vue component. Because opening this dialog requires an async top-level library fetch *before* the dialog can be displayed at all (`SuiLibraryAdapter.initialize`/`topLib.load`), `SuiLibraryDialogVue` is `async` and awaits that fetch before calling `InstallDialog`, unlike every prior `*Vue.ts` creation function (which mount synchronously) — this mirrors `SuiLibraryDialog.createAndDisplay`'s existing `await adapter.initialize()` step exactly. The new `library.vue` root component receives the already-loaded root `SmoLibrary` wrapped in Vue's `reactive()`; since `SmoLibrary.load()`/`initialize()` (`src/ui/fileio/library.ts`, unmodified) already mutate `this.children`/`this.loaded` in place when a folder is lazily loaded, Vue's deep-reactive proxy picks up those mutations automatically with no changes to `SmoLibrary` itself. Selection and expansion state live centrally in `library.vue` and are drilled down through every level of `treeNode.vue` via callback props (`selectCb`/`toggleCb`), matching this codebase's established `changeCb`-prop convention (`select.vue`) rather than Vue event-bubbling through recursive levels. `dialogContainer.vue`'s existing `enable` prop (already wired to `DialogButtons.vue`'s OK-button `disabled` state) is reused as-is to gate the Load control on "a song is currently selected" — no changes to the dialog shell are needed. This is an additive, internal migration: `SuiLibraryDialog`, `SuiLibraryAdapter`, `SuiTreeComponent`, and their call sites are untouched; wiring callers over is out of scope.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: Vue 3 (`vue` — `reactive`, `ref`, `computed`); existing in-repo Vue dialog shell (`dialogContainer.vue` and its existing `enable` prop → `dialogButtons.vue`'s OK-button `disabled` state, both reused unmodified); existing `SmoLibrary` model and its `load()`/`children`/`format`/`metadata.name`/`loaded` members (`src/ui/fileio/library.ts`) reused as-is; existing `SuiScoreViewOperations.loadRemoteScore` (`src/render/sui/scoreViewOperations.ts`) reused as-is; `SmoUiConfiguration.libraryUrl` (`src/ui/configuration.ts`) reused as-is; existing `src/styles/tree.css` classes (`tree`, `tree-root`, `tree-branch`, `selected`, `collapsed`, `button.expander(.expanded|.collapsed)`, `span.file-type`) reused for visual parity with the current dialog, plus the existing `icon-book`/`icon-file-music`/`icon-plus`/`icon-minus` icon classes (`src/styles/fonts.css`)

**Storage**: N/A — operates on the in-memory `SmoLibrary` tree fetched over HTTP via the existing `SmoLibrary.load()`/`SuiXhrLoader`; no persistence or schema changes

**Testing**: No automated unit/integration test runner is wired up in this repo (`npm test` is a no-op placeholder). Verification is manual: build with `npm run build`, serve with `npm run server`, and exercise the dialog in a browser against a demo library JSON with at least two levels of nesting, per `quickstart.md`. The one piece of net-new logic with no UI dependency — finding a node by URL in the reactive tree (`findNodeByUrl`) — is pure and could be a small standalone check if the project's test setup allows it, but is not required.

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`

**Project Type**: Single front-end library project (no frontend/backend split) — all changes are within `src/ui`

**Performance Goals**: No new performance targets. Tree rendering and folder expansion must stay responsive for library sizes consistent with the existing demo libraries (tens of entries per level); unlike the chord/lyric editors, this dialog has no continuous-typing input, so no debouncing is needed anywhere in this design.

**Constraints**: Must preserve current functional behavior (SC-001–SC-005) — same lazy-load-on-select-then-auto-expand behavior for folders, same independent expand/collapse-without-reload behavior, same Load-enabled-only-for-a-song rule; must not modify `SuiLibraryDialog`, `SuiLibraryAdapter`, `SuiTreeComponent`, `SmoLibrary`, or any of their call sites (`src/ui/buttons/ribbon.ts`, `src/ui/ribbonLayout/default/defaultRibbon.ts`, `src/ui/ribbonLayout/default/tabletRibbon.ts`)

**Scale/Scope**: Two new Vue components (`src/ui/components/dialogs/library.vue`, `src/ui/components/dialogs/treeNode.vue`) plus one new creation function (`src/ui/dialogs/libraryVue.ts`); no changes to the score or library data model

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No project constitution gate specific to UI dialogs is ratified (`.specify/memory/constitution.md` covers serialization, music-editing/transformation logic, rendering performance, and logical dependencies — no UI-dialog-specific principles). Per the spec's Assumptions, this plan follows the existing Vue-dialog convention already established (`src/ui/dialogs/*.ts` creation functions paired with `src/ui/components/dialogs/*.vue` components), as precedented by `010-vue-lyric-dialog` and `013-vue-chord-dialog`. It touches no code under `src/smo` (Principle #1/#2) or the core render pipeline (Principle #3) — it only *reads* already-exported members of `SmoLibrary` (`src/ui/fileio/library.ts`) and `SuiScoreViewOperations.loadRemoteScore`, changing neither, and it keeps rendering/UI concerns separated (Principle #4): the tree UI is pure Vue/DOM logic with no dependency on the legacy SVG-editor classes. **Gate: PASS (no constitution to violate)**.

## Project Structure

### Documentation (this feature)

```text
specs/015-vue-library-dialog/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/ui/
├── dialogs/
│   ├── library.ts                # EXISTING legacy SuiLibraryDialog/SuiLibraryAdapter — untouched
│   ├── lyricVue.ts               # EXISTING reference pattern for the new creation fn (010)
│   ├── libraryVue.ts             # NEW: SuiLibraryDialogVue creation function (async — see research.md §1)
│   └── components/
│       └── tree.ts               # EXISTING SuiTreeComponent — read for reference, untouched
└── components/dialogs/
    ├── library.vue                # NEW: top-level dialog component (mirrors dialogElements' single tree control)
    ├── treeNode.vue                # NEW: general-purpose recursive tree-entry component (first of its kind in this codebase)
    ├── select.vue                  # EXISTING — read as the closest precedent for the callback-prop convention
    └── dialogContainer.vue         # EXISTING — reused as-is, including its `enable` prop for gating Load

src/ui/fileio/
└── library.ts                     # EXISTING SmoLibrary (url/format/metadata/children/loaded, load()) — reused unmodified

src/render/sui/
└── scoreViewOperations.ts         # EXISTING loadRemoteScore — reused unmodified

src/ui/
└── configuration.ts                # EXISTING SmoUiConfiguration.libraryUrl — reused unmodified

src/styles/
└── tree.css                        # EXISTING tree/icon classes — reused unmodified for visual parity
```

**Structure Decision**: Single front-end project — no frontend/backend split. All new files live under the existing `src/ui/dialogs/` (creation function) and `src/ui/components/dialogs/` (Vue components) directories, matching the established pairing convention already used by `libraryVue.ts`'s siblings `lyricVue.ts`/`chordChangeVue.ts`. No new top-level directories or build targets are introduced.

## Complexity Tracking

*No entries — Constitution Check has no violations (no ratified constitution to violate; the design follows existing repo conventions, and the one genuinely new piece — a recursive tree component — is a small, self-contained addition rather than an architectural change).*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* Design decisions in [research.md](./research.md) (recursing directly over `SmoLibrary.children` instead of porting the legacy flat parent-pointer options array; wrapping the fetched root in `reactive()` rather than modifying `SmoLibrary`; centralizing selection/expansion state in `library.vue` and drilling it down via callback props; reusing `dialogContainer.vue`'s existing `enable` prop instead of adding new dialog-shell plumbing) stay within the existing Vue-dialog convention, touch no code under `src/smo` or the core renderer (only read from `SmoLibrary`/`SuiScoreViewOperations`), and modify no shared/legacy call sites. **Gate: PASS.**
