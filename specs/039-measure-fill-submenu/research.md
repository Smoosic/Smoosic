# Research: Measure Fill Submenu

All unknowns from the Technical Context are resolved below. No `NEEDS CLARIFICATION` items remain.

## R1: Which rests can the application show?

**Finding**: `SmoMusic.validDurations` lists every duration a note or rest can have, with up to three dots. For example 32768 (breve), 24576 (dotted whole), 16384 (whole), 14336 (double-dotted half), 12288 (dotted half), 8192, 6144, 4096, 3072, 2048, and so on. Some lengths are not available as one rest: 10240 (5/8) and 18432 (9/8) are not in the list.

**Decision**: The "largest rest that fits" is the largest value in `validDurations` that is not longer than what is left. Repeating that until nothing is left gives the spec's results: 5/8 is 8192 + 2048 (half and eighth), 9/8 is 16384 + 2048 (whole and eighth), 7/8 is 14336 (one double-dotted half), 12/8 is 24576 (one dotted whole), 5/16 is 4096 + 1024.

**Rationale**: Uses the application's own table, so a fill can never produce a rest that cannot be drawn or saved.

**Alternatives considered**: Preferring a dotted half plus dotted quarter for 9/8 (a better musical grouping in compound meters). The request says "the largest rest possible", so the plain rule is used; the spec's Assumptions record this and the rule is isolated in one function if it is ever changed.

## R2: How is a measure's length decided?

**Finding**: `SmoMusic.timeSignatureToTicks(actualBeats, beatDuration)` gives the length of a full measure. `SmoMeasure.isPickup()` is true when voice 0 holds fewer ticks than that, and `getTicksFromVoice(0)` gives what it holds.

**Decision**: The target length is the full-measure length, except for a pickup measure, where it is the ticks voice 0 holds now. The beat rules still use the measure's time signature.

**Rationale**: Matches the spec (a pickup keeps its length) and means the fill never changes how long a measure is.

## R3: The three rules

**Decision** (all work on a target length `T` in ticks):

- **Whole Rest**: greedy fill of `T` with the largest valid durations (R1).
- **Beats**: the beat length `B` comes from the time signature. `floor(T / B)` beats, then the remainder filled greedily (R1). `B` is:
  - lower number 1, 2 or 4: the note value of the lower number (16384, 8192, 4096);
  - lower number 8 or more, with `unit = 16384 / lower` (2048 for 8, 1024 for 16, 512 for 32): compound when the top number is a multiple of 3, `B = 3 * unit` (dotted quarter in x/8, dotted eighth in x/16); otherwise `B = 2 * unit` (quarter in x/8, eighth in x/16).
  This gives 4 quarters for 4/4, 3 quarters for 3/4, 2 dotted quarters for 6/8, 4 for 12/8, 2 quarters and an eighth for 5/8, 3 quarters and an eighth for 7/8, 1 dotted quarter for 3/8, and 2 eighths and a sixteenth for 5/16.
- **Eighth Rests**: `floor(T / 2048)` eighth rests, then the remainder filled greedily (R1). 5/16 gives two eighths and a sixteenth, so the measure is never short.

**Rationale**: These are the spec's rules; the lower-number-8-or-more formula is one rule instead of one per meter.

## R4: Replacing the content of a measure

**Finding**: A measure holds `voices` (each `{ notes }`), `tupletTrees`, `beamGroups`, `activeVoice` and its own `modifiers` (barlines, rehearsal marks, tempo, beam groups, and so on). `SmoMeasure.timeSignatureNotes` already shows how to build a rest note for a clef: a default note with `noteType 'r'`, the clef's default pitch (`SmoMeasure.defaultPitchForClef`), `ticks.numerator` and `stemTicks` set to the duration.

**Decision**: A new `SmoMeasure.fillWithRests(durations, beamBeats)` builds the rests that way, sets `voices` to one voice of them, empties `tupletTrees` and `beamGroups`, sets `activeVoice` to 0, and copies the measure's key signature onto the new notes. Rests are given the beam length for the meter so later notes entered over them beam as they would in a new measure. Measure modifiers, time signature, clef, key and format are not touched.

**Alternatives considered**: Deleting notes one at a time with the existing editing operations (slow, leaves tuplets and voices to clean up); recreating the measure with `getDefaultMeasureWithNotes` (would lose the measure's settings).

## R5: What else points at the removed notes?

**Finding**: Staff modifiers (slurs, ties, hairpins, pedal markings, text brackets) hold `startSelector` and `endSelector` with staff, measure, voice and tick. `SmoSystemStaff.deleteMeasure` already removes modifiers whose start or end is in the deleted measure. Text attached to notes is a `SmoTextGroup` with `attachToSelector` and a `selector`, stored on the score (`score.textGroups`) and, for parts that keep their own text, in the staff's part information.

**Decision**: For each filled measure of a staff, remove every staff modifier of that staff whose start or end selector is in that measure (the same test `deleteMeasure` uses), and remove every text group attached to a note (`attachToSelector`) whose selector is in that staff and measure, from the score and from the staff's part information. Modifiers that only pass over the measure, with both ends elsewhere, are kept.

**Rationale**: Matches FR-010 and the spec's edge case, and cannot leave a marking pointing at a note that no longer exists. Notes' own attachments (lyrics, chords, dynamics, articulations, ornaments, grace notes) go with the notes.

## R6: Undo

**Finding**: Undo has buffers for measures, staff modifiers, text groups, and the whole score; `groupUndo` can combine buffers. `clearAllBeams` uses the whole-score buffer.

**Decision**: Use the whole-score buffer (`_undoScore`) for one undo step.

**Rationale**: The operation changes measures, staff modifiers and text groups, and one buffer that restores all three is simpler and cannot miss one. The cost is serializing the score once per command, which is the same cost `clearAllBeams` has.

**Alternatives considered**: A measure buffer per measure plus a buffer per removed modifier and text group (more code, more places to get wrong).

## R7: Selections and parts

**Decision**: Apply to the measures of the selections in each selected staff, on both the displayed score and the stored score (`_getEquivalentSelections`), as the other note and measure commands do. Distinct measures are found by staff and measure index. The operation is idempotent, so applying it twice to the same measure (in case the two scores are the same object) is harmless.

## R8: Menu

**Decision**: A "Fill Measures" entry in `SuiMeasureMenuOptions` with `subMenu` of three choices ("Whole Rest", "Beats", "Eighth Rests"), following `copyVoicesMenuOption` in `src/ui/menus/edit.ts`. The parent and the choices are displayed when the tracker has selected measures (`menu.tracker.getSelectedMeasures().length > 0`). Handlers call `menu.view.fillMeasures(fill)`.
