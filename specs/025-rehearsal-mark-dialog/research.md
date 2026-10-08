# Research: Rehearsal Mark Properties Dialog

## 1. Why is a rehearsal mark unselectable today, exactly?

**Decision**: Confirmed by reading the current code (not assumed) that three independent gaps exist, all of which must be closed:

1. **No hit-testable box**: `src/render/vex/vxMeasure.ts` (~line 484-490) draws a rehearsal mark via `this.stave.setSection(rm.symbol, 0)` — a raw VexFlow stave-modifier registration. Unlike `SmoVolta`, which is drawn via a hand-built SVG group and gets `ending.logicalBox = { x, y, width, height }` explicitly assigned right after drawing (`src/render/vex/vxSystem.ts` lines 569-570), nothing ever assigns `SmoRehearsalMark.logicalBox` (inherited, always-null field from `SmoMeasureModifierBase`). `SvgPageMap.findModifierTabs` hit-tests mouse clicks against exactly this field, so with it permanently null there's nothing to click.
2. **Not in the tracker's modifier list**: `SuiMapper._createLocalModifiersList()` (`src/render/sui/mapper.ts` lines 146-177) has explicit blocks that push `SmoVolta` and `SmoTempo` instances (found via `sel.measure.getModifiersByType(...)`) into `this.localModifiers` on every selection change. There is no equivalent block for `SmoRehearsalMark` — it can never become `getSelectedModifier()`'s result, by mouse or by keyboard cycling.
3. **No dialog registered**: `src/ui/dialogs/factory.ts`'s `ModifiersWithDialogNames` array and `SuiModifierDialogFactory.createModifierDialog()`'s if/else chain have no entry for `'SmoRehearsalMark'` — even if (1) and (2) were fixed, selecting one today would fall through to the factory's "unhandled modifier type" exception path.

**Rationale**: Each gap is independently necessary and already demonstrated solvable by an existing precedent (`SmoVolta` for 1 and 3; `SmoVolta`/`SmoTempo` for 2) — this plan closes all three the same way, rather than inventing a new mechanism.

## 2. Computing `SmoRehearsalMark.logicalBox` without modifying the forked VexFlow library

**Decision**: Replicate `StaveSection.draw()`'s own geometry formula (`node_modules/vexflow_smoosic/src/stavesection.ts` lines 54-83) directly in Smoosic's render layer, in the same per-system, post-layout pass where `SmoVolta.logicalBox` is already computed (`src/render/vex/vxSystem.ts`), rather than modifying `StaveSection` itself to expose/store its own bounding box.

**Rationale**: `StaveSection.draw(stave, shift_x)` computes `x = this.x + shift_x`, `y = stave.getYForTopText(1.5) + this.shift_y`, `width = textWidth + 2*padding`, `height = textHeight + 2*padding` (via `TextFormatter.create(StaveSection.TEXT_FONT).getWidthForTextInPx/getYForStringInPx`) entirely locally, and never stores them on the instance or exposes a getter — so there is no existing API to read the drawn box back from VexFlow after the fact. `vexflow_smoosic` is a separate repository (per the project constitution: "We have our own fork of this library... a sister-project of Smoosic") — modifying it to add a `getBoundingBox()` would require a cross-repository change and release cycle for a single-feature need. Computing the identical formula in `vxSystem.ts` (same inputs: known font, known symbol/text, known `stave`/`smoMeasure.svg.staffX`/`logicalBox.y`) keeps the entire feature inside this repository, exactly as `SmoVolta`'s own box is already computed independently of asking VexFlow's `Volta` class for one.

**Alternatives considered**:
- *Modify `StaveSection` (the forked library) to expose its computed box*: rejected — cross-repository change for a benefit (marginal accuracy/DRY) that doesn't outweigh the cost and release coordination, when replicating a ~10-line formula achieves the same result within this repository.
- *Use a generic/approximate fixed-size box (e.g., a constant width/height) instead of replicating the real formula*: rejected — the box must correspond to where the glyph is actually drawn or clicks will visibly miss; `SmoVolta`'s precedent already establishes that computing the real geometry (not a placeholder) is the expected standard here.

## 3. Resolving "which measure owns this mark" for update/remove, without widening shared dialog infrastructure

**Decision**: `SuiRehearsalMarkAdapter`'s commit/remove logic resolves the owning measure (in both `score` and `storeScore`) by searching for the measure whose current `getRehearsalMark()` has the same `attrs.id` as the adapter's `SmoRehearsalMark` instance — not by threading an originating `SmoSelection` through `SuiDialogParams`.

**Rationale**: Unlike `SmoVolta` (which carries its own `startBar`/`endBar` measure range directly on the model, letting `updateEnding(ending: SmoVolta)` self-describe which measures it touches) or `SmoLyric` (which carries a `selector`), `SmoRehearsalMark` is a plain `SmoMeasureModifierBase` with no back-reference to its owning measure. `SuiDialogParams` (`src/ui/dialogs/dialog.ts` lines 199-210) has no `selection`/`selector` field — only `modifier?: any` — and `eventHandler.ts`'s `createModifierDialog` is shared launch infrastructure every other modifier dialog also depends on. Searching by `attrs.id` (every `SmoModifier` already has one) across `score.staves[*].measures[*]` is a self-contained lookup, fully inside the new adapter, with an existing precedent for "find by identity" already in the codebase (`findLandmark` in `src/ui/menus/text.ts`, which searches by purpose rather than id but is the same style of lookup).

**Alternatives considered**:
- *Add a `selection`/`selector` field to `SuiDialogParams`, populated by `eventHandler.ts` from the `ModifierTab` that was selected*: rejected — widens shared infrastructure every other modifier dialog's launch path also flows through, for a need that's local to this one modifier type; a self-contained id search avoids that shared-surface risk entirely.
- *Give `SmoRehearsalMark` a new `measureIndex`/selector-like field so it can self-describe its measure, matching `SmoVolta`'s pattern*: rejected — a model/schema change (Constitution Principle #1 territory) for a lookup that a simple id search already solves without touching `SmoRehearsalMark` at all.

## 4. `updateRehearsalMark`/`removeRehearsalMark` must touch every staff's copy, matching `addRehearsalMark`'s existing per-staff loop

**Decision**: The new `SuiScoreViewOperations.updateRehearsalMark`/`removeRehearsalMark` methods replace/remove the mark on the same measure index across **every staff** in the score (and its `storeScore` shadow), exactly as `SmoOperation.addRehearsalMark`/`removeRehearsalMark` (`src/smo/xform/operations.ts` lines 739-750) already do — not just the one staff whose rendered glyph happened to be clicked.

**Rationale**: `SmoOperation.addRehearsalMark(score, selection, rehearsalMark)` already loops `score.staves.forEach(staff => staff.addRehearsalMark(...))` — a rehearsal mark is a column-wide, system-level marking (the same letter appears above every instrument's staff at that measure), not a per-staff one. The existing `toggleRehearsalMark()` already relies on this same per-staff loop for creation; an edit/remove path that didn't match it would leave staves showing different/stale symbols at the same measure column — an inconsistency the existing creation path never allows to occur.

**Alternatives considered**:
- *Only update the one staff's modifier instance that was actually clicked*: rejected — would desync the other staves' copies at the same measure, a state `addRehearsalMark`/`removeRehearsalMark` never produce today, and would look like a rendering bug (different rehearsal letters on different staves at the same measure).

## 5. Which dialog pattern to follow: legacy `SuiDialogBase` or Vue

**Decision**: Build a new Vue dialog (adapter class + `...Vue.ts` wiring function + `.vue` component), following the `pedalMarkingVue.ts`/`volta.ts`+`voltaVue.ts` pattern — not the older `SuiDialogBase`/`dialogElements` pattern.

**Rationale**: Every recently-added modifier dialog in this codebase (`hairpinVue.ts`, `slurVue.ts`, `pedalMarkingVue.ts`, `dynamicsVue.ts`, `textBracketVue.ts`, `voltaVue.ts`) is Vue-based, wrapping a reused-or-new adapter class; the older `SuiDialogBase`-style dialogs (e.g. `SuiTieAttributesDialog`, still referenced once in `factory.ts` for `SmoTie`) are legacy, not the pattern new features follow. Since `SmoRehearsalMark` has no prior dialog at all (old or new), there is no existing adapter to "reuse unchanged" the way `voltaVue.ts`/`pedalMarkingVue.ts` do — `SuiRehearsalMarkAdapter` is new, but is modeled directly on `SuiVoltaAdapter`'s shape (per-field getter/setter pairs, `commit`/`cancel`/`remove`, a `backup` copy for cancel-reverts).

**Alternatives considered**:
- *Use the legacy `SuiDialogBase`/`dialogElements` pattern (like `SuiTieAttributesDialog`)*: rejected — would introduce a new instance of an already-superseded pattern instead of following the codebase's established current direction.
