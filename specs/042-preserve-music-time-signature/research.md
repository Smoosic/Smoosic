# Research: Preserve Music When Changing Time Signature

All unknowns from the Technical Context are resolved below. No `NEEDS CLARIFICATION` items remain.

## R1: Copy and paste, or a dedicated re-bar?

**Finding**: The request describes the re-bar as "copy the music, paste it into the destination". `PasteBuffer` (`src/smo/xform/copypaste.ts`) already lays a list of notes across measures, so it was the first candidate. Four things stop it from being used as is:

1. It uses the user's copy buffer (`scoreView.storePaste`). A time signature change would silently replace what the user had copied.
2. A note that crosses a bar line is split but **not tied** (`copypaste.ts:900`, "TODO: tie the last note to this one"). Spec FR-010 needs ties.
3. It pastes into measures that already exist, and stops at the end of the score (`copypaste.ts:646`, "TODO: add a measure in this case"). Spec FR-007 needs measures added.
4. `_populatePost` keeps the destination's old notes after the end of a paste, so the destination measures would have to be emptied first. It pastes one voice per call, and staff modifiers are placed afterwards by note count, which breaks when notes are split.

**Decision**: A dedicated transform, `rebarMeasures` in `src/smo/xform/rebar.ts`. It works in place on each staff, from the notes themselves, with no clipboard.

**Rationale**: It does what the request means (the same notes in the same order, in the new meter) without the four problems. It does reuse the pieces paste uses: `SmoMusic.gcdMap` for splitting a duration into legal note lengths, `SmoNote.cloneWithDuration`, and `SmoTupletTree` for tuplet indices.

**Alternatives considered**: (a) Use `PasteBuffer.setVoiceSelections('all')` and `pasteAllVoices`. Rejected for the four reasons above; fixing them would change the behavior of ordinary paste for everyone. (b) Fix paste to tie and to add measures, then call it. Rejected as a larger, riskier change to a shared feature than this request needs.

## R2: What "the same notes in the same order" means for each case

Each staff and voice is handled on its own. The music of the chosen measures is read as one list of **units** in time order, then laid out again into measures whose lengths come from the new time signature.

| Unit | Layout rule |
|------|-------------|
| A note or rest that fits in what is left of the measure | Placed as it is. |
| A note that does not fit | Split at the bar line into pieces whose lengths come from `SmoMusic.gcdMap`; continues into the next measure(s) until its whole length is placed. Pitched pieces are tied to each other; rest pieces are not. Only the first piece keeps the note's markings (spec FR-011); later pieces keep the pitches only. |
| A rest that does not fit | Split the same way, without ties. |
| A tuplet (the whole tree, as one unit) that fits | Placed whole, with its indices adjusted to the new position. |
| A tuplet that does not fit in what is left, but would fit in an empty measure | The rest of the measure is filled with rests, and the tuplet starts the next measure. All its notes are kept. |
| A tuplet longer than an empty measure | Turned back into plain notes (the existing `SmoUnmakeTupletActor` logic: each note keeps its written length), then laid out as plain notes. All its notes are kept. |
| The end of the music | The rest of the last measure is filled with rests. |

**Decision**: These rules.

**Rationale**: They keep every note and the order of the notes (the request's wording). The only case that moves music in time is the middle one (a tuplet that would straddle a bar line), which is the standard engraving choice; the alternative, a tuplet broken at the bar line, cannot be written in notation. The last case changes the written length of a tuplet's notes but never drops one, and happens only when the tuplet is longer than a whole measure.

**Alternatives considered**: Dropping a straddling tuplet (violates "nothing lost"); splitting tuplet notes at the bar line (tuplet durations are not whole tick counts, so there are no legal pieces).

## R3: How many measures, and where they go

**Finding**: Different voices and staves can need different numbers of measures after the layout (a staff with many short rests may need fewer, for example).

**Decision**: The layout is run per staff and voice first and only counts measures. Let `needed` be the largest count over all staves and voices, and `existing` the number of measures in the chosen range. The range grows to `max(existing, needed)` measures, so measures are only ever added (spec FR-008). The added measures are inserted directly after the last chosen measure, in every staff (spec FR-013). Measures in the range that the layout does not reach are filled with rests.

**Rationale**: Every staff keeps the same number of measures. Never removing a measure means that nothing can be lost by accident and that measure numbers after the range only move later.

## R4: Measure lengths for alternating (compound) time signatures

**Finding**: A `SmoTimeSignature` with several `times` (3/4+2/4) makes consecutive measures alternate between its parts. `SmoScore.updateCompoundTimeSignature` sets `measure.timeSignature.index` so that each measure has one part, and `actualBeats` and `beatDuration` return that part. The measure length is `SmoMusic.timeSignatureToTicks(actualBeats, beatDuration)` for that part. It is not the sum. (This corrected the first draft of the spec, which said the sum.)

**Decision**: The layout takes the length of the k-th re-barred measure from the part at position `(startIndex + k) mod parts`. `startIndex` is 0 unless the measure just before the range has an equal time signature, in which case the pattern continues from it, the same rule `updateCompoundTimeSignature` uses. After the measures are laid out, `updateCompoundTimeSignature` is called to set the indices for real.

**Rationale**: Uses the application's own definition of a measure's length and keeps the layout and the measures' stored indices in agreement.

## R5: Adding measures with the right settings

**Finding**: `SmoScore.addMeasure(index)` creates the new measure from `getPrototypeMeasure(index, staff)`, which is the measure currently *at* `index`, that is, the first measure after the range, whose key, clef and tempo can differ. The spec (Assumptions) says added measures take the settings of the last re-barred measure.

**Decision**: Give `SmoScore.addMeasure` and `getPrototypeMeasure` an optional `prototypeIndex` argument. When given, that measure is the prototype. Existing callers pass nothing and behave as before. `rebarMeasures` calls `addMeasure(last + 1, last)`.

**Rationale**: Small, additive, and reuses everything `addMeasure` already does (inserting in every staff, shifting staff modifiers and attached text, renumbering).

**Alternatives considered**: Building the measures in `rebar.ts` and splicing them into each staff (would duplicate the shifting and renumbering in `addMeasure`).

## R6: Slurs, ties, hairpins and other staff modifiers

**Finding**: Staff modifiers store their ends as note selectors (staff, measure, voice, tick), so re-barring invalidates them (spec FR-017). `SystemStaff.addMeasure` shifts only the modifiers that start at or after the inserted index; `removeModifiersInMeasure` (used by Fill Measures) removes them.

**Decision**: While laying out each voice, record where each source note went: `{ firstPiece, lastPiece }` as new selectors, keyed by the note's old selector. Afterwards, for every staff modifier with an end inside the range, rewrite the end selectors from this map (an end that starts a modifier uses `firstPiece`; an end that finishes one uses `lastPiece`; for a `SmoTie`, the start uses `lastPiece` and the end uses `firstPiece`). A modifier end after the range is moved later by the number of measures added. New ties are added between the pieces of a split note.

**Rationale**: Nothing is dropped, and each modifier stays on the same notes. The remap runs before the added measures are inserted so that the two shifts cannot be applied twice.

## R7: When to use the old path

**Finding**: Spec FR-018 and FR-019: a display-only change, or a new meter with the same measure length, must not move music, and spec FR-014 keeps the old behavior for the unticked box.

**Decision**: `SuiScoreViewOperations.setTimeSignature` uses the old `SmoOperation.setTimeSignature` when Preserve music is unticked, or when every chosen measure already has the same length as the new signature. It uses `rebarMeasures` otherwise. Before either, it checks `SmoOperation.timeSignatureChanges(score, firstMeasure, lastMeasure, ts)` (any chosen measure with a different signature, display options included); if nothing differs, it returns without touching the score or the undo stack (spec FR-004).

**Rationale**: The old behavior is kept bit for bit for the cases where it is correct, and the new code only runs when it is needed.

## R8: Undo, redraw, and the backing score

**Finding**: `_undoScore(label)` stores a snapshot of the whole backing score, which is what is needed when measures are added (`addMeasures` and `deleteMeasure` do the same). The displayed score (`this.score`) can be a part view of the stored score (`this.storeScore`). The existing `setTimeSignature` already applies to both. Structural changes (transpose score, global layout, add and delete measure) redraw with `renderer.rerenderAll()` or `setRefresh()`.

**Decision**: The view method calls `_undoScore('Set time signature')`, runs the operation on `this.score` and on `this.storeScore` with the same measure range, then redraws with `renderer.rerenderAll()` and waits for `updatePromise()`. One undo step restores everything, including removing the added measures.

**Rationale**: Same wiring as the other whole-score structural edits. The measure range is by index, which is the same in both scores.

## R9: The dialog

**Finding**: `timeSignature.ts` calls `view.setTimeSignature` on every change and on Apply To (which also replaces `tracker.selections`), and `cancelCb` sets the old signature back (leaving an undo step behind). `timeSignature.vue` watches each field and calls `updateTimeSignatureCb`. The `commitCb` is empty.

**Decision**: Rewrite the creation function to hold the choices in local state (`timeSignature`, `applyTo`, `preserveMusic`) and to call `view.setTimeSignature(timeSignature, { applyTo, preserveMusic })` once in `commitCb`. `cancelCb` does nothing. `updateTimeSignatureCb` now only updates the local `timeSignature` ref (no score change). The component adds a `toggle` for Preserve music (ticked at first) and its `updateApplyTo` and the new `updatePreserve` callbacks only store the values. `setTimeSignature(ts)` with no options keeps its old meaning for library callers: apply to the tracker's selections and keep what fits.

**Rationale**: Meets spec FR-001 to FR-005, and gives one undo step. Library callers of the old signature are unaffected.

## R10: Declarations and exports

**Finding**: Declarations in `types/` are hand-edited in this repository, and `src/application/exports.ts` lists what the library exports.

**Decision**: Hand-edit the declaration for `rebar.ts`, `operations.d.ts`, `score.d.ts`, `scoreViewOperations.d.ts` and `exports.d.ts`; export the new module from `exports.ts`.
