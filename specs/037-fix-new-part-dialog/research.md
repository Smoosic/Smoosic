# Research: Fix the Create Part Dialog

No NEEDS CLARIFICATION items remained after the specification. The decisions below come from reading the current code.

## R1. Why Staff Location cannot reach the ends today

**Finding**: In `newPart.vue` the Staff Location input starts at `staffLength - 1` with limits 1 and `staffLength`. In `SuiCreatePartVue` (`instrument.ts`) the value is a zero-based staff id, initialized to `staves.length - 1`, and `setStaffId` ignores any value `>= staves.length`. So the input mixes one-based limits with a zero-based id, the largest accepted value is the last existing staff rather than the end, the user's value 1 means staff 1 (second), and "after the last staff" is unreachable.

**Decision**: The dialog holds a one-based location from 1 to N+1, starting at N+1. The model converts it to a staff index with `index = location - 1` before placement.

## R2. Where the placement and insertion logic lives

**Decision**: A new `SmoOperation.addPart(score, params)` in `src/smo/xform/operations.ts`. It resolves the index, builds the part information, inserts one or two staves, and returns the index of the first new staff. The view method wraps it with the undo step and the follow-up calls that `addStaff` already makes (`updateInstrumentOffsets`, `setNoteInstrumentProperties`, `viewAll`).

**Rationale**: The constitution wants editing logic in `src/smo` and regression-tested. Today the logic is split between the dialog (index and the 2-stave link) and the view (`addStaff`, which also creates system groups), and neither can be tested without a DOM.

**Alternatives considered**: Keep the logic in the dialog (untestable). Add the logic to `SmoScore.addStaff` only (it also serves library callers who add one staff at a time and would change their behavior).

## R3. Not splitting a two-stave part

**Decision**: `SmoScore.resolveNewPartIndex(location)` clamps the one-based location into 1..N+1, converts it to an index, and then, if the staff currently at that index has `partInfo.stavesBefore > 0` (it is not the first staff of its part), moves the index past the end of that part: `index + staff.partInfo.stavesAfter + 1`. The new part therefore goes **after** the existing part, as the spec assumes.

**Rationale**: The part links are the data the rest of the program already uses to know a part's extent (`stavesBefore` and `stavesAfter`, see `isPartExposed`, `exposePart`, the part menu). Testing `stavesBefore > 0` on the staff at the insertion index covers a part of any length, not only two staves, at no extra cost. It also leaves insertion at a part's first staff, or just after its last, unchanged.

**Alternatives considered**: Moving the new part before the part (equally valid; the spec chose after). Refusing the location with a message (the spec says the user is not shown an error).

## R4. Inserting above existing staves: references that must be shifted

**Finding**: `SmoScore.addStaff` appends the staff and then bubbles it down to `parameters.staffId`, and calls `numberStaves()`, which renumbers `staffId` on each staff and its measures. Nothing else is updated. Things that refer to a staff by number are therefore left pointing at the wrong staff after an insertion above them:

- Staff modifiers (slurs, hairpins, ties, text brackets) on later staves: `startSelector.staff`, `endSelector.staff` and `associatedStaff`.
- System groups (brackets and braces): `startSelector.staff` and `endSelector.staff`.
- Each staff's instrument map: `startSelector.staff` and `endSelector.staff`.
- Score text groups attached to a note by selector.

The existing code rarely hit this because the dialog could only add at or near the end. Adding anywhere makes it a real risk, and the same fault would produce slurs drawn on the wrong staff and brackets around the wrong staves.

**Decision**: Add `SmoScore.shiftStaffReferences(fromIndex, delta)` which adds `delta` to every staff number that is `>= fromIndex` in the four places above, and call it from `addStaff` after the insertion with `(newPos, 1)`; for an append it changes nothing. Each staff does its own part through a new `SmoSystemStaff.shiftStaffReferences`.

**Rationale**: `swapStaves` already uses a per-staff remapping (`mapStaffFromTo`) for the same reason, so there is precedent. A shift is not a swap, so a new routine is needed, but it is a few lines per place.

**Alternatives considered**: Re-deriving every selector from the staff's `staffId` at render time (a much larger change). Doing the shift in the view (it would be skipped by library callers of `SmoScore.addStaff`).

## R5. System groups for the new staff

**Finding**: `SuiScoreViewOperations.addStaff` joins a new staff, when its id is above 0, to the system group of the staff above it, or creates a two-staff group. That sets `grp.endSelector.staff = staffId`, which assumes the group ends at the staff above.

**Decision**: Keep the existing behavior (the new part is grouped with the staff above it), but do it after the references are shifted, and widen the group instead of assigning: `end = max(end, newIndex)`. A group that spans the insertion point has already grown by the shift; a group that ended just above is extended to include the new staff, as today. A part at index 0 has no staff above and gets no group, as today.

**Rationale**: The spec does not ask to change grouping, so appending behaves exactly as it does now, and the change only keeps a group from shrinking when the insertion is in the middle of one.

**Alternatives considered**: Never grouping a new part (changes today's behavior for appends and was not requested). Dropping the join in the middle of a score (surprising, since the same dialog then behaves differently by position).

## R6. The part information for the new staves

**Decision**: Build a `SmoPartInfo` from `SmoPartInfo.defaults` and set `partName`, `partAbbreviation` and `preserveTextGroups = true`, and pass it in the staff parameters. A one-staff part leaves `stavesBefore` and `stavesAfter` at 0. A two-stave part gives the first staff `stavesAfter = 1, stavesBefore = 0` and the second `stavesAfter = 0, stavesBefore = 1`, with the same name, abbreviation and settings on both (`updatePartInfo` keeps the two staves' information in step the same way).

**Finding**: The existing dialog sets only `stavesAfter = 1` on the first staff, through `view.score` (the displayed score, not the stored one), and never sets `stavesBefore` on the second. That cannot be relied on, and the second staff would not be recognized as part of the part, which is also what makes R3 work for parts made by the dialog.

**Rationale**: This matches how parts are made when a MusicXML file is read (`xmlToSmo.ts` sets exactly these four values) and what `exposePart` and `isPartExposed` expect.

**Alternatives considered**: Setting the values after insertion on the stored score (an extra step that could be skipped). Leaving the second staff unlinked (the bug above).

## R7. One undo step

**Decision**: `createPart` calls `_undoScore` once before the operation. The old dialog called `view.addStaff` twice for a two-stave part, which recorded two undo steps.

**Rationale**: The spec requires creation to undo in one step (FR-014). The score undo buffer stores the whole score, so one snapshot before the change restores everything.

## R8. Name and abbreviation

**Decision**: The Name placeholder is the label of the instrument chosen in the dialog (for example "Cello"), kept up to date as the choice changes. On confirm, the part name is the typed name if it has non-space text, otherwise that label. The abbreviation is the typed text (trimmed), or empty. A pure helper `resolvePartName(typed, instrumentLabel)` does this and is tested. The instrument list now lives in `createPartHelpers.ts` and is shared by the component and the helper, so the placeholder can never disagree with the list. The list had "Grand Piano" twice; the duplicate is dropped.

**Rationale**: One source for the labels avoids the name and the dropdown drifting apart. A helper without Vue imports can be tested headless.

**Alternatives considered**: Reading the label back from the select component (couples the model to the UI). Naming the part "Staff N" as the default does (the spec asks for the instrument name).

## R9. Preserve Text Groups default

**Decision**: `SmoPartInfo.defaults` stays `false`. `addPart` sets `preserveTextGroups = true` on the part information it creates. Loading a score and every other way of creating a staff is unaffected.

**Rationale**: The spec requires the global default not to change, only the Create Part dialog's result.

## R10. The dialog title and menu text

**Decision**: The dialog's label becomes "Create Part". The menu entry text ("Create New Part/Stave") is unchanged.
