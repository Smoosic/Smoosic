# Research: Per-Measure Beam Groups

All unknowns from the Technical Context are resolved below. No `NEEDS CLARIFICATION` items remain.

## R1: Where does beam length come from today?

**Finding**: `SmoBeamer.beamNote` (in `src/smo/xform/beamers.ts`) ends a group when `duration === note.beamBeats`. `beamBeats` is stored on each note. It is set from the score-wide preferences (`defaultDupleDuration` 4096, `defaultTripleDuration` 6144) by `SmoOperation.clearAllBeamGroups`/`clearBeamGroups`, and to 6144 for 8th-note meters in `SmoMeasure.timeSignatureNotes`. Hand-beaming (`SmoOperation.beamSelections`) writes the selected span's ticks into `beamBeats` and sets `beamState` (auto, continue, end).

**Decision**: Do not touch `beamBeats` or the preferences. A measure with a grouping bypasses the `beamBeats` logic inside the beamer and uses tick positions instead. A measure without one runs the existing code path unchanged.

**Rationale**: Writing the grouping into every note's `beamBeats` would be lost whenever notes are replaced or edited, and would break FR-007 (applied whenever the measure is beamed). Reading it at beam time cannot go stale.

**Alternatives considered**: Store the grouping on the notes (stale after edits, much more data); store it in the score preferences (not per measure).

## R2: Position-based boundaries, not group counts

**Decision**: The grouping becomes a list of boundary tick positions, the list repeated from its first number until the measure's length: `[3, 2]` in 10/8 gives eighth-note positions 3, 5, 8, 10. A beam group never crosses a boundary. A note that starts before a boundary and ends after it stays in the group it started in, and the group closes after it.

**Rationale**: "The second number is used for the second beam group" is exactly this when the measure is all eighth notes. Counting positions also gives the right answer when a quarter note or a rest sits inside the measure (5/8 as quarter, eighth, eighth, eighth with "3, 2": the first eighth is alone before the boundary at 3, the last two beam). Counting groups would beam three eighths together there.

**Alternatives considered**: Counting completed groups (wrong beams when a non-beamable note falls inside a group).

## R3: Unit

**Decision**: One number counts 2048 ticks (an eighth note), or 1024 ticks (a sixteenth) when the time signature's lower number is 16 or more. This is the spec's rule (FR-003). Meters with a lower number of 4 or 2 count eighths. The unit comes from the time signature of the measure at beam time, so a time signature change is picked up automatically.

## R4: Repeat rule (from the 2026-11-08 clarification)

**Decision**: When the list is shorter than the measure, it starts over from its first number. A final repeat that does not fit is cut at the end of the measure, so "3, 2" in 7/8 gives 3 + 2 + 2.

## R5: Interaction with hand-placed beam states

**Finding**: Notes carry `beamState`: auto, continue (joins the previous note), end (closes the group), secondary. `SmoMeasure.timeSignatureNotes` also writes `end` on every third rest of a new 8th-note measure, so `end` in old data is sometimes not hand-placed.

**Decision**:
1. Applying or clearing a grouping on a measure resets that measure's notes to `beamState` auto, so stale or generated `end` marks cannot fight the new grouping. The dialog tells the user this.
2. After that, hand edits win: an `end` state still closes a group (existing check, unchanged), and a `continue` note does not close a group at a boundary.
3. `SmoOperation.beamSelections` marks every note of a hand-beamed span except the last `continue` when the measure has a grouping (the last note is `end`, as now). A `continue` note is never the end of a group at a boundary, which is how the beamer already treats `continue` at a beat. In ungrouped measures `beamSelections` behaves as before.

**Rationale**: Keeps FR-008 meaningful without guessing which `end` marks were hand-placed.

**Point to confirm with the user**: rule 1 replaces hand-placed beam states in the measures a grouping is applied to.

## R6: Serialization and the .smz dictionary

**Finding**: Measure modifiers are saved as `{ ctor, ...fields }` and revived through `SmoDynamicCtor[ctor]` (`measureModifierDynamicCtorInit`). The `.smz` compression (`serializationHelpers.js`) builds its key dictionary from the data it is given and passes unknown keys through.

**Decision**: Register `SmoBeamPreferences` in `measureModifierDynamicCtorInit`. Use the field name `groups`. Do not call it `beamGroups`, which the measure already uses for rendered beam groups. Write the modifier only when the list is non-empty. No compression table change. A test loads a measure written before the feature (no such modifier) and one written with it.

**Alternatives considered**: A field on the measure itself (new top-level serialized key, more migration code than one more modifier).

## R7: Copy and paste

**Finding**: Measure modifiers travel with `SmoMeasure.serialize`/`deserialize`. Whether paste and "add measure" copy modifiers is existing behaviour that differs by operation.

**Decision**: Rely on the existing measure copy mechanism (FR-018 says "in the same way as other measure-level formatting"). Add one test that serializes and deserializes a measure and checks the grouping is kept. No new copy code.

## R8: Scope of the dialog

**Finding**: The key signature dialog offers selected measures, future measures, and the whole score, using `getMeasuresBetween` on staff 0 and `modifyColumnsSelectionsNoWait`, which affects whole columns. The spec limits the selection scope to the selected staves.

**Decision**: Two scopes: "Selected measures" (the measures in the selected staves, via `SmoSelection.getMeasureList`) and "Whole score" (every measure of every staff). One undo step each: `undoTrackerMeasureSelections` for the selection, `_undoScore` for the score. Changes go to both the displayed score and the stored score so partial-score (part) views stay consistent, as `clearSelectedBeams` does. A "Clear" action sets the empty list over the same scope.

## R9: Dialog input

**Decision**: The dialog shows one number field (1 to 4, the existing number spinner) for each group, labeled "Group 1", "Group 2", and so on. An **Add group** (+) button adds a group, copying the last group's number (3 for the first), and each row has a remove button. **Clear** removes every group, which means the default for the meter. At most 16 groups can be added. Because the fields cannot hold anything but 1 to 4, there is no invalid state to report (FR-012 holds by construction).

**Alternatives considered**: A single text field of comma-separated numbers (first version; it gave no visible way to add a second group, and needs a parser and error messages); a fixed number of dropdowns (needs a cap on groups, clumsy for 12/8).

## R10: Menu placement

**Decision**: Add "Beam Groups" to the existing Beams menu (`SuiBeamMenuOptions`). The handler opens the Vue dialog directly, as `tabStaveMenuOption` does.
