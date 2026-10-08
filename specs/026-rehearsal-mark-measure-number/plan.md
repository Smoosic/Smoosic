# Implementation Plan: Measure-Number Rehearsal Marks

**Branch**: `026-rehearsal-mark-measure-number` | **Date**: 2026-10-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/026-rehearsal-mark-measure-number/spec.md`

## Summary

Add `measureNumber` as a fourth value of `SmoRehearsalMark.cardinality`. When a measure's rehearsal mark has that cardinality, every place that turns the mark into text (on-screen stave section, hit-test box width, headless VexFlow script, MusicXML export) uses the measure's displayed number instead of `mark.symbol`. The text is derived from the measure at render time, so it follows insertions, deletions and renumbering with no stored state. The stored `symbol` is untouched, so switching back to another style restores a sensible value. The existing rehearsal mark dialog gets a "Measure number" entry in its Numbering select.

The single shared derivation is a new `SmoMeasure.getRehearsalMarkText()` (smo layer, no rendering dependency), consumed by all four output sites, so they cannot drift apart.

## Technical Context

**Language/Version**: TypeScript (see [tsconfig.json](../../tsconfig.json)), Vue 3 single-file components for dialogs

**Primary Dependencies**: Smoosic's fork of VexFlow (`StaveSection` via `stave.setSection`), Vue 3

**Storage**: Score JSON (SMO serialization); schema in [tools/smoosic-schema.json](../../tools/smoosic-schema.json)

**Testing**: Headless `ts-node` scripts in `tests/` registered as `npm run test:*` (pattern of [tests/textDragPlacement.ts](../../tests/textDragPlacement.ts)); no UI/render tests (constitution)

**Target Platform**: Web browser (SVG), also usable headless as a library

**Project Type**: Web application / library (single project)

**Performance Goals**: No added cost beyond one string derivation per rehearsal mark per render; no new DOM measurement

**Constraints**: smo classes must not depend on rendering/UI; legacy scores must deserialize unchanged

**Scale/Scope**: One enum value, one measure helper, four call-site changes, one dialog option, one schema enum entry, one test script

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| #1 Serialization | PASS. `cardinality` is already serialized (non-default values only). `'measureNumber'` round-trips with no format change; legacy scores have no such value. Schema enum updated. Covered by a test. |
| #2 Editing/transformation logic regression-tested | PASS. Text derivation and the add/remove resequencing exclusion are non-UI logic and get headless tests. |
| #3 Rendering performance | PASS. Derivation is a pure string computation done where the symbol is already read; no extra DOM reads, no new repaint triggers. |
| #4 Logical dependencies | PASS. `getRehearsalMarkText()` lives in `src/smo/data/measure.ts` and depends only on measure data. Renderer/exporter call into it, never the reverse. |

No violations; Complexity Tracking is empty. Post-design re-check: unchanged, still PASS.

## Project Structure

### Documentation (this feature)

```text
specs/026-rehearsal-mark-measure-number/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rehearsal-mark-text.md
├── checklists/requirements.md
└── tasks.md              # created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── smo/
│   ├── data/
│   │   ├── measureModifiers.ts   # add cardinalities.measureNumber; getIncrement guard
│   │   ├── measure.ts            # new getRehearsalMarkText()
│   │   └── systemStaff.ts        # addRehearsalMark: measureNumber marks skip resequencing
│   └── mxml/
│       └── smoToXml.ts           # export uses getRehearsalMarkText()
├── render/vex/
│   ├── vxMeasure.ts              # setSection(text) (the line the request named)
│   ├── toVex.ts                  # same substitution in generated script
│   └── vxSystem.ts               # hit-test box width measured from displayed text
└── ui/components/dialogs/
    └── rehearsalMark.vue         # add "Measure number" select option
tools/smoosic-schema.json         # add enum value
tests/
└── rehearsalMarkMeasureNumber.ts # new headless test
package.json                      # test:rehearsal-measure-number script
```

**Structure Decision**: Single existing project; changes are localized to the files above. No new modules except one test file.

## Complexity Tracking

None.
