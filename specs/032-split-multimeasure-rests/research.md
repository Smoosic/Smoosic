# Research: Split Multimeasure Rests at Landmarks

Findings from reading the code. No NEEDS CLARIFICATION items remained after the spec and the user's clarifications.

## 1. Where the lone rest bar comes from

**Finding**: `computeMultipartRest` (operations.ts) walks the measures: if `isMultimeasureRest(i, true, forceRest)` it extends `j` while `isMultimeasureRest(j, false, forceRest)` and no `restBreak`, and records a block only when `j - i >= 2`; otherwise it advances by one and clears `hideMultimeasure`. `SmoScore.isMultimeasureRest` returns false, for both the "start" and "continue" calls, if any staff has a volta on the measure, a repeat symbol (`isRepeatSymbol`), a rehearsal mark, or (staff index above 0) an instrument entry on the measure. Only the key and time signature checks, and the previous-measure repeat check, are skipped for a start. So a rehearsal mark on measure 6 of a run of rests ends the block at measure 5 (6 fails to continue), then 6 fails the *start* test too, so it is stepped over as an ordinary rest bar, and a new block starts at 7: the lone bar between two multimeasure rests.

**Decision**: Separate "can this measure be in a block at all" (volta, forced) from "does this measure break the run before it" (start landmarks) and "does this measure close the run after it" (end landmarks), and rewrite the loop around those.

## 2. Which landmarks are already handled

**Finding**: Key and time signature differences are only tested when continuing (`!start`), so a key or time change already ends one block and starts the next with no lone bar. The reported problem for those two is therefore in the drawing (does the second block show the new signature?) rather than in the grouping, or it is a different path; the manual check in quickstart.md covers it. A tempo change is not tested at all today, so a tempo change inside a run of rests does not split it.

**Decision**: Keep the key/time rule, add tempo (a change from the previous measure's tempo, counted only if the new tempo is displayed, since otherwise there is nothing for the player to see). Verify the signature drawing by hand, and fix it in the drawing code only if it fails.

## 3. Start versus end landmarks

**Finding**: `SmoRepeatSymbol.symbols` are Coda, Segno, ToCoda, DcAlCoda, DcAlFine, DsAlCoda, DsAlFine, Fine. `SmoBarline` start and end barlines are per measure (`getStartBarline`, `getEndBarline`); today `SmoSystemStaff.isRepeat(index)` mixes them: it is true if the *next* measure's start barline is special, or this measure's end barline is special, or this measure has a repeat symbol, and the loop uses it as "measure i-1 closes a run" (`!start && isRepeat(measureIndex - 1)`).

**Decision**:

- Start landmark at measure m (any staff): rehearsal mark; repeat symbol Segno or Coda; tempo change (displayed); key signature change; time signature change; start barline that is not a single bar or no bar; an instrument map entry at m > 0.
- End landmark at measure m (any staff): repeat symbol ToCoda, DC/DS al Coda/Fine, or Fine; end barline that is not a single bar or no bar.
- Blocked (never in a block, as today): a volta ending covering the measure on any staff; and the quirk below.
- A block is a start measure followed by every following rest measure that is not blocked, has no `restBreak`, and has no start landmark, stopping after the first measure that has an end landmark. A start measure that is itself an end measure closes at once (a single bar).
- Key and time comparisons stay against the previous measure on staff 0, as today. Tempo likewise compares staff 0.

## 4. A legacy quirk kept on purpose

**Finding**: The instrument test is `measureInstrumentMap[measureIndex] && i > 0`: for any staff after the first, an instrument entry on the measure counts. Every staff has an entry at measure 0, so in a multi-staff part measure 0 can never start a block today (it is shown as an ordinary bar and a block starts at measure 1). That looks accidental but changes the look of every multi-staff part's first bar.

**Decision**: Do not change it here (SC-004 says scores without landmarks inside rests look as before). Measure 0 of a multi-staff part stays "blocked" from starting a block. An instrument entry at m > 0 on any staff, including the first, becomes a start landmark. Flag the quirk to the maintainer as a separate question.

## 5. Why an end symbol vanishes

**Finding**: `SuiRenderState`/`vxSystem.renderMeasure` returns immediately for any measure with `svg.hideMultimeasure`, and `vxMeasure.createMeasureModifiers` draws the repeat symbol (`VF.Repetition`) from the measure's own `getRepeatSymbol()` only when `firstInColumn`. In a block, every measure after the first is hidden. A D.S. on the last measure of a block is on a hidden measure, so it is never drawn. The start measure's `svg` also carries `multimeasureEndBarline`, copied from the last measure's end barline, which is how an end repeat bar is already shown at the end of a block.

**Decision**: Record the last measure's end-type symbol on the block's first measure as a runtime field `svg.multimeasureEndSymbol`, and draw it in `createMeasureModifiers` over the multimeasure rest (position from the symbol's own x/y offset, as for any symbol). Do the same for the VexFlow export path (`toVex.ts`) only if it draws repeat symbols; check during implementation.

## 6. Stale flags

**Finding**: For a measure that is not a block start, the current code resets only `hideMultimeasure`; `multimeasureLength`, `multimeasureEndBarline` can keep values from an earlier grouping.

**Decision**: For every measure on every staff that is not a block start, set `multimeasureLength = 0`, reset `multimeasureEndBarline` to a single bar, and clear `multimeasureEndSymbol`. For a block start, set all three from the block.

## 7. When the grouping is computed

**Finding**: `computeMultipartRest` is called only from `SuiScoreView.setView` (when a part is exposed) and `updatePartInfo`. Landmark edits in an exposed part therefore do not regroup until the part is re-exposed or its info is updated. The grouping only applies to parts (`expandMultimeasureRests` is set true for new full scores, and the loop is skipped when it is).

**Decision**: Also call `SmoOperation.computeMultipartRest(this.score)` at the start of `SuiLayoutFormatter.layout()` when `score.isPartExposed()`. Every full layout then reflects the current landmarks and rest content. Edits that only re-render single columns without a full layout (an existing limitation, for example typing a note into an already grouped measure) are out of scope; the manual check lists which landmark edits do a full layout.

## 8. The public `isMultimeasureRest`

**Finding**: `SmoScore.isMultimeasureRest(measureIndex, start, forceRest)` is public and exported with the library, though the only caller in `src/` is `computeMultipartRest`.

**Decision**: Leave it unchanged (same behavior for outside callers), mark it as superseded in its doc comment, and implement the new rule with new helpers. The same approach was used for `PromiseHelpers` in spec 029.

## 9. Barline between blocks

**Finding**: A block's end barline comes from the last measure (`multimeasureEndBarline`) and its start barline from its first measure; hidden measures contribute neither, so a barline between two blocks is drawn once at the end of the first and once at the start of the second only if the user set both, exactly as for adjacent ordinary measures.

**Decision**: No special handling beyond the grouping rules. FR-007a is met by construction; confirm by hand.
