# Research: Measure-Number Rehearsal Marks

All unknowns from the spec are resolved below; nothing remains marked NEEDS CLARIFICATION.

## 1. Where does "measureNumber" live on the model?

- **Decision**: Add `measureNumber: 'measureNumber'` to `SmoRehearsalMark.cardinalities` and use it as a `cardinality` value. No new field.
- **Rationale**: `cardinality` is already the "numbering style" the dialog exposes (capitals / lowerCase / numbers), already serialized, and already used by `systemStaff` to decide which marks belong to the same auto-increment series. A new field would duplicate it and complicate serialization.
- **Alternatives considered**: a separate boolean (`useMeasureNumber`) — rejected, creates invalid combinations with `cardinality`; a new `position`-like attribute — rejected, unrelated.

## 2. What number is shown? (0-indexed vs. displayed)

- **Decision**: Text = `String(measure.measureNumber.displayMeasure + 1)`.
- **Rationale**: [common.ts:112](../../src/smo/data/common.ts) documents `displayMeasure` as "the index as shown to the user, considers renumbering, but is **0-indexed**". The score's own on-screen measure numbers add one ([scoreRender.ts:656](../../src/render/sui/scoreRender.ts)). Passing `displayMeasure` unmodified, as the request literally reads, would label the 17th bar "16" and disagree with the number printed on the measure. The request's intent ("set the measure number") is the number the user sees, hence `+ 1`.
- **Alternatives considered**: raw `displayMeasure` — rejected for the off-by-one above; `measureIndex + 1` — rejected because it ignores renumbering (custom start/ renumbering map).
- **Note for the requester**: this is the one place the implementation deliberately deviates from the literal wording.

## 3. Where should the derivation live?

- **Decision**: `SmoMeasure.getRehearsalMarkText(): string | undefined` in `src/smo/data/measure.ts`. Returns `undefined` if no mark; the displayed number string for `measureNumber` marks; otherwise `mark.symbol`.
- **Rationale**: Four sites currently read `rm.symbol` (vxMeasure, toVex, vxSystem width, smoToXml). One helper keeps them identical (FR-008) and respects Principle #4 (smo has no render dependency). `SmoRehearsalMark` itself can't do it because it has no reference to its measure and importing `SmoMeasure` into `measureModifiers.ts` would be circular.
- **Alternatives considered**: a method on `SmoRehearsalMark` taking a measure argument — rejected (circular import or loose typing); inline ternaries at each site — rejected (drift risk).

## 4. Fallback when the displayed number is unavailable

- **Decision**: If `displayMeasure` is not a finite number, use `measureIndex + 1`; if that is also not finite, use `mark.symbol`.
- **Rationale**: Matches the spec edge case; a mark is never blank. In practice `displayMeasure` defaults to 0 ([measure.ts:261](../../src/smo/data/measure.ts)) so the fallback is defensive.

## 5. Renumbering and render freshness

- **Decision**: Rely on render-time derivation; no stored text, no invalidation hook.
- **Rationale**: Inserting/removing measures reflows and re-renders affected systems, and the score already redraws per-measure numbers from the same `displayMeasure`. The quickstart includes an insert-measure scenario to confirm that measures after the insertion point are re-rendered.
- **Verified during implementation (code reading, not a browser run)**: `addMeasure`/`addMeasures`/`deleteMeasure` in `scoreViewOperations.ts` call `renderer.setRefresh()`, which restarts the render passes. `scoreRender.ts` draws each system's printed measure numbers (`displayMeasure + 1`) in the same pass that draws the stave section, so a system whose numbers shift is redrawn with both. No invalidation hook was added. The headless test confirms the derived text follows renumbering and insertion; the on-screen redraw remains a manual check (quickstart §3 step 4).

## 6. Auto-increment interaction

- **Decision**: In `SmoSystemStaff.addRehearsalMark`, treat `measureNumber` like `increment === false` (add and return). `removeRehearsalMark` already only touches marks with `increment` true; guard it so it does not renumber `measureNumber` marks either. `getIncrement()` is left as is (never called for these marks).
- **Rationale**: Without this, other `measureNumber` marks (same cardinality) would be treated as one series and have their stored `symbol` rewritten via `charCode + 1`, which is meaningless and would destroy the retained symbol (spec edge case, FR-007).
- **Alternatives considered**: leaving it and relying on text derivation hiding the symbol — rejected because the retained symbol would be silently corrupted.
- **Observation (out of scope)**: `getIncrement()` compares `cardinality !== 'number'` but the enum value is `'numbers'`, so numbers-style marks take the character-code path. Existing behavior; not touched here.

## 7. Hit-test box (feature 025)

- **Decision**: `vxSystem.renderRehearsalMarks()` measures the displayed text instead of `rm.symbol`.
- **Rationale**: Multi-digit numbers are wider than a letter; a box sized from the stored symbol would mis-hit-test.

## 8. Export and schema

- **Decision**: MusicXML export writes the displayed text. Add `"measureNumber"` to `SmoRehearsalMarkCardinalityEnum` in the schema.
- **Rationale**: FR-008. On re-import a MusicXML rehearsal mark becomes a capitals-style mark with that text (e.g. "17"), since MusicXML carries only text, not our style — acceptable and noted in the spec's export edge case.
- **Observation**: the schema currently types `cardinality` as `number` (default 0) although values are strings, and does not reference the enum. Fixing the type to reference the enum is a small adjacent correction; included as a task so the schema accepts `"measureNumber"` at all.

## 9. Dialog

- **Decision**: Add `{ value: 'measureNumber', label: 'Measure number' }` to `cardinalityOptions` in `rehearsalMark.vue`. Leave the Symbol input and Auto-increment toggle visible and unchanged.
- **Rationale**: Spec assumption says the toggle may remain visible with no effect. Adapter and cancel/restore already work generically (backup via `serialize()`), so no adapter change is needed.

## 10. Testing approach

- **Decision**: One headless script `tests/rehearsalMarkMeasureNumber.ts` run via `npm run test:rehearsal-measure-number`, covering: text derivation (mark styles, renumbered display, fallback), serialization round trip, legacy mark without the new value, and add/remove not disturbing `measureNumber` marks or other series.
- **Rationale**: Constitution Principles #1/#2; rendering is deliberately not tested.
