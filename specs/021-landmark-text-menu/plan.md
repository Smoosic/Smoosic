# Implementation Plan: Landmark Text Menu

**Branch**: `021-landmark-text-menu` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/021-landmark-text-menu/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a "Landmark Text" submenu to the existing Text menu (`src/ui/menus/text.ts`), with one entry per `SmoTextGroup.purposes` value (Title, Subtitle, Composer, Copyright, Date, Page number, Part). Choosing an entry either opens the dialog for that purpose's already-existing `SmoTextGroup` or, if none exists yet, automatically creates one — pre-populated from `SmoScoreInfo`, the current date, the `###`/`@@@` page-marker template, or the exposed part's name — at a purpose-specific default position/font/pagination, then opens its dialog. Research uncovered that `SmoTextGroup.purpose` (`src/smo/data/scoreText.ts`), while already declared and already set by the existing `createTextForLayout`/MusicXML-import path, is never actually copied by the constructor or serialized, because it's missing from `nonTextAttributes` — this plan activates it, since it's the one field that already means exactly "which landmark is this" and is needed to detect an existing landmark (avoiding duplicates) and to gate the post-edit dialog (`textBlock.vue`) so a landmark can never enter the free-text/tiptap editing session or have its pagination type changed, while its font, position (via the existing Move/drag tool), and other attributes remain editable exactly like any other text block.

**2026-09-24 amendment (spec Clarifications session, FR-018/SC-007)**: A user-reported visual bug plus a follow-up spec clarification corrected `createLandmarkText`'s vertical placement: a landmark's top/bottom position was originally measured from the score's `topMargin`/`bottomMargin` (the region reserved for music), which the user identified as wrong — margin-anchored placement can land landmark text inside the same area the music renders into, causing a visual collision. The corrected, clarified rule (FR-018): top/bottom-anchored landmarks are measured from the physical page edge (`y = 0` for top, `y = pageHeight` for bottom) plus a small buffer, never from the margins. See research.md §2b for this fix.

**2026-09-24 follow-up amendment (FR-019/FR-020)**: The user refined the top-anchored base buffer further, from a flat "one em" to a margin-proportional formula (`Math.max(0, topMargin/2 - height)`), and asked that landmarks sharing a column (Subtitle under Title; Page number/Part under Composer) stack directly below whichever is already above them instead of each computing its own fixed offset independently. `createLandmarkText` gained a fourth, optional `above?: SmoTextGroup | null` parameter for this; a new `SmoScoreText.estimateHeight()` method supplies the real height needed for the margin-proportional formula; two new small helpers in `src/ui/menus/text.ts` (`LANDMARK_COLUMNS`, `findAboveLandmark`) resolve which landmark (if any) is "above" a given purpose before calling `createLandmarkText`. Bottom-anchored purposes (Copyright, Date) are unaffected — this refinement was scoped by the user to top-anchored purposes only. See research.md §2c.

**2026-09-24 second follow-up amendment (FR-021)**: The user further clarified that the upper-right group (Composer, Page number, Part) should be right-justified against the right margin, not centered near it — the previous `xPlacement: 0.8` was only ever an approximation. A new `SmoLandmarkPlacement` interface (distinct from the shared `SmoTextPlacement`) adds an explicit `xJustify: 'center' | 'right'` field; `createLandmarkText`'s horizontal calculation now branches on it, computing `st.x = (pageWidth - rightMargin) - width` for `'right'` entries instead of reusing the centering formula. See research.md §2d.

**2026-09-25 amendment (two more user-reported bugs from exercising FR-021/FR-020)**: (1) Composer's and Page number's right edges didn't actually match, because Page number's stored text is the literal `'###'/'@@@'` marker template, and estimating width from that (18 characters) rather than the much shorter real per-page substituted text overstated its width and made its computed right edge fall short of the margin. Fixed with a new `measureText?` parameter on `createLandmarkText`, fed by a new `resolveLandmarkMeasureText` helper that supplies a representative substituted string (`"Page 1 of N"`) for width/height estimation only, while the group still stores the literal marker text for `getPagedTextGroups` to substitute per page. (2) The upper-right column's stacking (FR-020) only ever looked "before" Composer's fixed index, so Composer could never be told to stack below an already-existing Page number/Part if they were created first — landing on the exact same Y. Fixed by making `findAboveLandmark` order-independent: it now checks every other member of a purpose's column and stacks below whichever one currently sits lowest, regardless of creation order. See research.md §2e/§2f.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: Vue 3 (`vue`); existing in-repo menu infrastructure (`SuiConfiguredMenu`, `SuiConfiguredMenuOption.subMenu` — `src/ui/menus/menu.ts`, already used by `arpeggioMenuOption`/`arpeggioStyleOptions` in `src/ui/menus/note.ts`); existing text-group data/render pipeline (`SmoTextGroup`, `SmoTextGroup.createTextForLayout`/`purposeToFont`/`getPagedTextGroups` in `src/smo/data/scoreText.ts`; `scoreRender.ts`'s `renderTextGroup`); existing dialog bootstrap (`SuiTextBlockDialogVue` in `src/ui/dialogs/textBlockVue.ts`, `textBlock.vue`); existing score-operation infrastructure (`SuiScoreViewOperations.addTextGroup`/`isPartExposed`, `src/render/sui/scoreViewOperations.ts`).

**Storage**: N/A — operates on the in-memory score's existing `textGroups` array (`SmoScore`) and, when a part is exposed with `preserveTextGroups` enabled, the exposed part's `partInfo.textGroups` array (`src/smo/data/partInfo.ts`) — both pre-existing collections, written via the pre-existing `SuiScoreViewOperations.addTextGroup`/`updateTextGroup`. The only schema-relevant change is activating serialization of the already-declared `SmoTextGroup.purpose` field (data-model.md).

**Testing**: No automated unit/integration test runner is wired up in this repo (`npm test` is a no-op placeholder). Verification is manual: build with `npm run build`, serve with `npm run server`, and exercise the menu/dialogs in a browser against the demo/dev score app, per `quickstart.md`.

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`/`src/render`

**Project Type**: Single front-end library project (no frontend/backend split) — changes span `src/smo/data` (one file: new static table/method, one attribute-list edit), `src/ui/menus` (one file: new submenu + helpers), and `src/ui/components/dialogs` (one file: two `v-if` gates keyed off a new computed)

**Performance Goals**: No new performance targets. Creating a landmark performs exactly one `view.addTextGroup(...)` call — the same cost as the existing "Score Text" creation flow — followed by the existing `renderer.rerenderTextGroups()`. The per-page "Page x of y" substitution reuses `getPagedTextGroups`'s existing per-render-pass logic (research.md §4); no new render pass or DOM-measurement step is added.

**Constraints**: Must not change the MusicXML-import path's existing Title/Subtitle/Composer creation (`xmlToSmo.ts`, which uses `createTextForLayout`/`purposeToFont` unmodified — research.md §2); must not change saved-JSON output for any pre-existing score or for a plain "Score Text" block (both continue to omit `purpose` since it stays at its default `NONE` — data-model.md); must not add a new `DialogMode` or a new commit/persistence path to `textBlock.vue` — gating is purely two additional `v-if` conditions keyed off a `purpose !== NONE` computed (contracts/component-interfaces.md §3); per FR-018, a landmark's top/bottom position must never be measured from `topMargin`/`bottomMargin` (the music's region) — only from the physical page edge plus a small (one-em) buffer.

**Scale/Scope**: One new static table + one new static method on `SmoTextGroup` (`src/smo/data/scoreText.ts`); a one-line addition to its existing `nonTextAttributes`/`attributes` lists; three small helper functions, seven `landmarkOption(...)` calls, and one parent `subMenu`-bearing option added to `src/ui/menus/text.ts`'s existing `SuiTextMenuOptions`; one new computed and two `v-if` edits in `textBlock.vue`. No changes to `textBlockVue.ts`, `textGroupEditor.vue`, `scoreRender.ts`, or any rendering file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: `SmoTextGroup.purpose` goes from silently-dropped to persisted, but only by adding it to the existing attribute lists that already drive default-filling for every other field — a legacy score (no `purpose` in its JSON) deserializes to `NONE`, identical to today; a plain, non-landmark "Score Text" also stays at `NONE` and produces byte-identical saved JSON (data-model.md). **Gate: PASS.**
- **Principle #2 (Music editing/transformation logic)**: No pitch/rhythm/accidental/clef logic touched; this is a text-block/menu/dialog feature. Not applicable. **Gate: PASS (N/A).**
- **Principle #3 (Rendering performance)**: No new render pass, no new per-frame or per-mousemove work. Landmark creation is one `addTextGroup` call (identical cost to the existing "Score Text" flow); "Page x of y" substitution reuses the existing `getPagedTextGroups` per-render-pass logic unmodified (research.md §4). **Gate: PASS.**
- **Principle #4 (Logical dependencies)**: New data (`landmarkPlacements` table, `createLandmarkText` method) lives in `src/smo/data/scoreText.ts`, alongside its precedent `purposeToFont`/`createTextForLayout`, and depends on nothing UI/rendering-specific. Menu wiring lives in `src/ui/menus/text.ts` (UI layer, already depends on `src/smo/data` and `view`). Dialog gating lives in `textBlock.vue` (UI layer). No `src/smo` file gains a UI/rendering dependency. **Gate: PASS.**

No project-constitution gate specific to menus or text dialogs exists; per spec Assumptions, this plan follows the established `subMenu` precedent (`arpeggioMenuOption`, `016-menu-submenus`) rather than inventing a new menu-nesting mechanism.

## Project Structure

### Documentation (this feature)

```text
specs/021-landmark-text-menu/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/smo/data/
└── scoreText.ts                    # MODIFIED: add 'purpose' to nonTextAttributes/attributes (activates
                                     #   existing-but-dormant field, research.md §1); add new static
                                     #   landmarkPlacements table (research.md §2) and static
                                     #   createLandmarkText(purpose, text, layout) factory, modeled on the
                                     #   existing createTextForLayout — left unmodified, still used by
                                     #   xmlToSmo.ts's MusicXML import unchanged

src/ui/menus/
└── text.ts                         # MODIFIED: add findLandmark/sourceTextDefined/resolveLandmarkText
                                     #   helpers, a landmarkOption(purpose, label, icon) factory (modeled on
                                     #   note.ts's arpeggioStyleOption), landmarkOptions (7 entries), and one
                                     #   new landmarkTextMenuOption (subMenu-bearing, modeled on
                                     #   arpeggioMenuOption) added to SuiTextMenuOptions

src/ui/components/dialogs/
└── textBlock.vue                   # MODIFIED: add `isLandmark` computed (purpose !== NONE); wrap the
                                     #   existing "Edit Text" button and "Page Behavior" row each in a new
                                     #   v-if="!isLandmark" — no other change to this file's logic
```

**Structure Decision**: Single front-end project — no frontend/backend split. All three touched files already exist and already house the closest precedent for what this feature adds (`scoreText.ts` already has `purposeToFont`/`createTextForLayout`; `text.ts` already is the Text menu's option list; `textBlock.vue` already is the one dialog every text group — landmark or not — opens through). No new files, no new top-level directories, and no changes to `textBlockVue.ts`, `textGroupEditor.vue`, or any file under `src/render` — this feature reuses the text-group creation, storage-routing, and per-page rendering machinery already in place unmodified.

## Complexity Tracking

*No entries — Constitution Check has no violations.*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* The one design decision with the most Constitution surface — activating `SmoTextGroup.purpose` in `nonTextAttributes` (research.md §1, data-model.md) — was re-checked specifically against Principle #1: `serializedMergeNonDefault` (used by `serialize()`) only emits a field when it differs from `SmoTextGroup.defaults` (`purpose: NONE`), and `serializedMerge` (used by the constructor and `deserialize()`) already fills in that same default for any field missing from a legacy JSON object, which is exactly how every other `nonTextAttributes` field already behaves — so this is a mechanical activation of existing, generic default-filling infrastructure, not new migration logic. The second-most-notable decision — keeping `landmarkPlacements` separate from `purposeToFont` rather than editing the latter in place (research.md §2) — was re-checked against Principle #4 (no unintended cross-feature coupling): confirmed `purposeToFont` has exactly one consumer (`createTextForLayout`, itself consumed only by `xmlToSmo.ts`), so leaving it untouched fully isolates this feature's font-size defaults (24/18) from MusicXML import's existing sizing (18/16). Both hold; no new violations introduced by Phase 1 design. **Gate: PASS.**

**2026-09-24 re-check (FR-018 amendment)**: The page-edge-vs-margin anchor correction touches only the arithmetic inside `createLandmarkText` (research.md §2) — no new fields, no new attribute-list entries, no change to `landmarkPlacements`' shape (`SmoTextPlacement`'s `yOffset` keeps the same sign convention, just measured from a different reference point). Principle #1: unaffected — this is positioning math, not persisted schema. Principle #3: unaffected — same single `addTextGroup` call, no new render pass. Principle #4: unaffected — the fix stays entirely within `src/smo/data/scoreText.ts`, the same file/layer as the rest of this feature's data-layer additions. **Gate: PASS.**

**2026-09-24 re-check (FR-019/FR-020 amendment)**: The margin-proportional/stacking refinement adds one new method (`SmoScoreText.estimateHeight()`) and one new optional parameter (`createLandmarkText`'s `above`), plus two small helpers in the menu layer (`LANDMARK_COLUMNS`, `findAboveLandmark`) — still no new persisted fields. Principle #1: unaffected. Principle #3: `estimateHeight()` uses the same synchronous, cache-backed `TextFormatter` metrics `estimateWidth()` already uses (no DOM measurement, no new render pass); reading `above.logicalBox` is a plain property read on an already-rendered object, not a new computation. Principle #4: `findAboveLandmark`'s column-lookup logic — which needs score-wide knowledge of other text groups — correctly lives in `src/ui/menus/text.ts` (UI layer, already depends on `view`/`SmoScore`), not in `SmoTextGroup.createLandmarkText` (`src/smo/data`), which only accepts an already-resolved `SmoTextGroup | null` and does no lookup of its own — preserving the same layering `createLandmarkText` already had. **Gate: PASS.**

**2026-09-24 re-check (FR-021 amendment)**: The right-justification fix adds one new interface (`SmoLandmarkPlacement`) and changes `landmarkPlacements`' declared return type — still no new persisted fields (`landmarkPlacements` was never persisted; it's a static, in-memory default table). Principle #1: unaffected. Principle #3: unaffected — same synchronous `estimateWidth()` call already made, just used in a different formula. Principle #4: unaffected — the new interface and branching logic both stay inside `src/smo/data/scoreText.ts`, the same file/layer as the rest of this feature's data-layer additions; `purposeToFont`/`createTextForLayout` (the MusicXML-import path) are untouched, since `SmoLandmarkPlacement` is a distinct type from the shared `SmoTextPlacement` they use. **Gate: PASS.**

**2026-09-25 re-check (measureText/findAboveLandmark fixes)**: Neither fix touches persisted schema — `measureText` is a call-time-only parameter (never stored; the group's actual `text` field is unchanged), and `findAboveLandmark`'s rewrite only changes which existing `SmoTextGroup` a lookup returns, not any stored shape. Principle #1: unaffected. Principle #3: unaffected — `resolveLandmarkMeasureText` and the revised `findAboveLandmark` are the same cost class of work (a few property reads/comparisons) as what they replaced, no new render pass. Principle #4: unaffected — both fixes stay within their existing layers (`measureText` handling in `src/smo/data/scoreText.ts`; `resolveLandmarkMeasureText`/`findAboveLandmark` in `src/ui/menus/text.ts`, which already needed score-wide text-group lookups for `findLandmark`). **Gate: PASS.**
