# Implementation Plan: Convert Note-Attached Text Groups to Annotations

**Branch**: `019-attached-text-to-annotation` | **Date**: 2026-09-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-attached-text-to-annotation/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Retire note-attached text groups (`SmoTextGroup.attachToSelector`) by converting them, at score load time, into the annotations added in `017`/`018` (`SmoLyric` with `parser = SmoLyric.parsers.annotation`, one per text block, distinguished by `verse`). The conversion is one new static helper in `src/smo/data/score.ts`, called from `SmoScore.deserialize` once the staves and text groups exist. It walks the score's `textGroups`, then each staff's `partInfo.textGroups`. Attached groups are looked up by their selector (`staff`/`measure`/`voice`/`tick`; for part groups the owning staff is used, research.md §3), each non-empty block becomes an annotation on that note, and every attached group is dropped from its list whether or not the note was found. A part's text group is discarded whole if its note already has any annotation, which is what stops a part's copy of an attached text (the application writes one) from doubling up on the score's copy (research.md §4). The second half is removing the "Attach to Selection" toggle and its supporting handlers from `textBlock.vue`. The `attachToSelector` property stays on `SmoTextGroup` because legacy scores must still deserialize it; nothing new can set it.

No rendering changes: annotations already render, offset and serialize (`017`), and multiple per note already work (`018`).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: None new. Uses `SmoLyric` (`src/smo/data/noteModifiers.ts`), `SmoNote.addAnnotation`/`getAnnotations` (`src/smo/data/note.ts`), both unmodified.

**Storage**: Saved score JSON. No schema change: annotations already serialize as note modifiers, and `attachToSelector`/`selector` stay readable for legacy files. Migrated scores simply stop containing attached text groups.

**Testing**: No runner is wired up (`npm test` is `exit 0`), but the `src/smo` layer loads headlessly under `ts-node` (verified in research.md §6), so this feature adds a small assertion script, `tests/attachedTextMigration.ts`, run with `ts-node` (Constitution Principle #1, legacy-score deserialization). It is excluded from the type build by `tsconfig-types.json`. UI removal is verified manually per `quickstart.md`.

**Target Platform**: Browser (SVG score editor) for the dialog change; the conversion itself is UI/DOM-free and also runs in Node.

**Project Type**: Single front-end library/application project (no frontend/backend split)

**Performance Goals**: Conversion is O(text groups + part text groups) with one note lookup each, run once per `SmoScore.deserialize`; negligible next to deserializing the staves.

**Constraints**:
- `src/smo` must stay free of render/UI dependencies (Principle #4): the helper touches only `SmoScore`/`SmoNote`/`SmoLyric`/`SmoTextGroup`.
- Legacy scores must still load (Principle #1): `attachToSelector` and `selector` stay in `SmoTextGroup`'s attribute lists and in the serialization dictionary (`src/common/serializationHelpers.js`).
- `SmoScore.deserialize` is also called by `SuiScoreView.setView` on a copy serialized with `skipStaves: true` (zero staves). The conversion must not run against an empty staff list or it would discard groups (research.md §5).
- Must not touch the attached-text handling in `scoreRender.ts`, `scoreView.ts`, or `score.ts` (`addMeasure`/`deleteMeasure`/`updateTextGroup`); it becomes unreachable for migrated scores and is a follow-up cleanup (spec Assumptions).

**Scale/Scope**: Two source files modified (`src/smo/data/score.ts`, `src/ui/components/dialogs/textBlock.vue`), one new test script, one `package.json` script entry.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: This is a legacy-format migration. Old scores are up-converted on load, new scores never contain attached text, and the migration is idempotent (FR-009). **Gate: PASS**, with a serialization test planned.
- **Principle #2 (Music editing/transformation logic)**: No pitch, rhythm, accidental or clef logic touched. The helper is a data transformation of note modifiers. **Gate: PASS (N/A)**.
- **Principle #3 (Rendering performance)**: No render-path change; the work happens once at load, before any SVG work. **Gate: PASS**.
- **Principle #4 (Logical dependencies)**: Conversion lives in `src/smo/data/score.ts` using only `src/smo` types. The only UI change is deleting controls from `textBlock.vue`. **Gate: PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/019-attached-text-to-annotation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── conversion-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/smo/data/
└── score.ts                       # MODIFIED: new static helper that converts attached text groups to
                                    #   annotations and returns the groups that remain; called from
                                    #   SmoScore.deserialize for the score list (score.textGroups) and for
                                    #   each staff's partInfo.textGroups. Imports SmoLyric.

src/ui/components/dialogs/
└── textBlock.vue                  # MODIFIED: remove the "Attach to Selection" toggle, the attachToSelector
                                    #   ref, resetAttachToSelectorModel / activateAttachToSelectorModel /
                                    #   onAttachToggle, the attach reset in onPaginationSelect, and the
                                    #   now-unused `toggle` import

tests/
└── attachedTextMigration.ts       # NEW: headless ts-node assertions over hand-built legacy score JSON

package.json                       # MODIFIED: add a `test:attached-text` script that runs the test with ts-node

# Unchanged (verified sufficient as-is, research.md §1, §7):
src/smo/data/scoreText.ts          # attachToSelector / selector stay so legacy JSON still deserializes
src/smo/data/note.ts               # addAnnotation / getAnnotations already do what the helper needs
src/smo/data/noteModifiers.ts
src/smo/data/systemStaff.ts
src/smo/data/partInfo.ts
src/common/serializationHelpers.js # legacy token dictionary keeps attachToSelector
src/render/**                      # attached-text render branches become dead for migrated scores; later cleanup
```

**Structure Decision**: Single project, no new source directories. The conversion is one method beside the deserialize code it hooks into; the only new directory is `tests/`, which `build/build.js` and `tsconfig-types.json` already anticipate.

## Complexity Tracking

*No entries — Constitution Check has no violations.*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* The design adds no new persisted field, no render or UI dependency in `src/smo`, and makes no change to how annotations serialize, so Principle #1 and #4 still hold. The two risks found in research — the part copy that would duplicate every annotation (§4) and the `skipStaves` deserialize path that would lose groups (§5) — are both handled inside the helper (part-group discard when the note is already annotated; non-empty-staves guard) and covered by contract cases. **Gate: PASS.**
