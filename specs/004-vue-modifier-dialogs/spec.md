# Feature Specification: Vue-Based Modifier Property Dialogs

**Feature Branch**: `004-vue-modifier-dialogs`

**Created**: 2026-08-28

**Status**: Draft

**Input**: User description: "Define vue-style dialogs for some of the legacy dialogs based on adapters. For the dialogs defined in src/ui/dialogs/volta.ts, and also textBracket.ts, slur.ts, pedalMarking.ts, hairpin.ts, dynamics.ts, customTuplet.ts, create vue dialogs for the UI and change the typescript code to create the vue components using InstallDialog"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit a Volta (2nd ending) using the modern dialog (Priority: P1)

As a score editor user, when I select a volta (2nd ending) and open its properties, I can adjust its number and position offsets in a dialog built from the same modern components used elsewhere in the app, and my changes are reflected on the score exactly as they are today.

**Why this priority**: Volta is the simplest of the seven dialogs (four numeric fields, no dropdowns or text fields) and proves out the end-to-end conversion pattern — adapter reuse, live-updating numeric fields, commit/cancel/remove — before tackling dialogs with more control types.

**Independent Test**: Select a volta on the score, open its properties dialog, change the number and each offset field, confirm the volta updates on the score live as each field changes, click OK, and confirm the change persists. Separately, reopen, make a change, click Cancel, and confirm the volta reverts to its prior state.

**Acceptance Scenarios**:

1. **Given** a score with a volta selected, **When** the user opens Volta Properties, **Then** the dialog shows the volta's current number and X1/X2/Y offsets pre-filled.
2. **Given** the dialog is open, **When** the user changes any numeric field, **Then** the volta on the score updates immediately to reflect the new value.
3. **Given** the user has changed values and clicks Cancel, **Then** the volta reverts to the values it had when the dialog was opened.
4. **Given** the dialog is open, **When** the user clicks Remove, **Then** the volta is deleted from the score.

---

### User Story 2 - Edit a Text Bracket using the modern dialog (Priority: P2)

As a score editor user, when I open properties for a text bracket (staff bracket with label text), I can set its line, position (above/below), main text, and subtext using modern controls, with the same live-updating behavior as today.

**Why this priority**: Introduces dropdown and free-text controls on top of the numeric pattern proven in User Story 1, extending the conversion to the next level of control variety.

**Independent Test**: Open Text Bracket Properties on an existing bracket, change the line number, switch position between Above and Below, edit the text and subtext, confirm the bracket updates on the score as each field changes, click OK, and confirm the change persists; separately confirm Cancel reverts all fields.

**Acceptance Scenarios**:

1. **Given** a text bracket is selected, **When** the user opens its properties, **Then** the dialog shows the current line, position, text, and subtext.
2. **Given** the dialog is open, **When** the user changes the position dropdown between Above and Below, **Then** the bracket's rendered position updates accordingly.
3. **Given** the dialog is open, **When** the user edits the text or subtext fields, **Then** the bracket's displayed label updates to match.
4. **Given** the user clicks Cancel after making changes, **Then** the bracket reverts to its prior line, position, and text.
5. **Given** the dialog is open, **When** the user clicks Remove, **Then** the text bracket is deleted from the score.

---

### User Story 3 - Edit a Slur using the modern dialog, including the reset-all-slurs action (Priority: P3)

As a score editor user, when I open properties for a slur, I can adjust its shape (spacing, thickness, offsets, control points), its start/end position and orientation, and either reset just this slur to its computed default shape or reset every slur in the score to its computed default shape — while the dialog stays responsive and prevents me from closing it mid-reset.

**Why this priority**: The most complex of the seven dialogs — it mixes numeric, dropdown, and two distinct toggle-triggered actions, one of which (reset-all) is a longer-running batch operation across the whole score that must keep the dialog's close controls disabled until it finishes.

**Independent Test**: Open Slur Properties on an existing slur, adjust spacing/thickness/offsets/control points and confirm the slur updates live, change start/end position and orientation dropdowns and confirm the rendered slur shape updates, trigger "Defaults" and confirm just this slur resets, trigger "Reset All Slurs" on a score with multiple slurs and confirm the OK/Cancel/Remove controls are disabled until every slur has been reset and then re-enabled.

**Acceptance Scenarios**:

1. **Given** a slur is selected, **When** the user opens its properties, **Then** the dialog shows its current spacing, thickness, offsets, control points, start/end position, and orientation.
2. **Given** the dialog is open, **When** the user changes any shape or offset field, **Then** the slur redraws immediately with the new value.
3. **Given** the dialog is open, **When** the user activates "Defaults", **Then** this slur's position and orientation reset to their computed defaults and the fields update to match.
4. **Given** a score with multiple slurs, **When** the user activates "Reset All Slurs", **Then** the OK, Cancel, and Remove controls are disabled, every slur in the score is reset to its computed default shape one at a time, and the controls are re-enabled once the last slur is done.
5. **Given** the user clicks Cancel after making changes (and no reset-all is in progress), **Then** the slur reverts to its prior shape and position.
6. **Given** the dialog is open, **When** the user clicks Remove, **Then** the slur is deleted from the score.

---

### User Story 4 - Edit a Pedal Marking using the modern dialog (Priority: P4)

As a score editor user, when I open properties for a piano pedal marking, I can toggle its bracket, start-mark, and release-mark display options and edit its depress/release text, with the change visible on the score as I make it.

**Why this priority**: Combines toggle and text controls in a dialog whose visible effect also depends on redrawing a range of measures, distinct from the single-modifier redraw used by other dialogs.

**Independent Test**: Open Pedal Marking Properties on an existing pedal marking, toggle each of Bracket/Start Mark/Release Mark and confirm the rendered marking updates, edit the depress and release text and confirm the labels update, click OK and confirm the change persists, then separately confirm Cancel reverts all changes.

**Acceptance Scenarios**:

1. **Given** a pedal marking is selected, **When** the user opens its properties, **Then** the dialog shows its current bracket/start-mark/release-mark toggles and depress/release text.
2. **Given** the dialog is open, **When** the user toggles Bracket, Start Mark, or Release Mark, **Then** the pedal marking's rendered appearance updates to match, across all measures the marking spans.
3. **Given** the dialog is open, **When** the user edits the depress or release text, **Then** the corresponding label on the score updates.
4. **Given** the user clicks Cancel after making changes, **Then** the pedal marking reverts to its prior appearance and text.
5. **Given** the dialog is open, **When** the user clicks Remove, **Then** the pedal marking is deleted from the score.

---

### User Story 5 - Edit a Hairpin (crescendo/decrescendo) using the modern dialog (Priority: P5)

As a score editor user, when I open properties for a hairpin, I can adjust its height and its left/right/vertical offsets, with the hairpin updating on the score as I make each change.

**Why this priority**: A purely numeric-field dialog like Volta, included for completeness of the migration but lower priority since it introduces no new control type.

**Independent Test**: Open Hairpin Properties on an existing hairpin, change height and each offset field, confirm the hairpin redraws live with each change, click OK, and confirm the change persists; separately confirm Cancel reverts all fields.

**Acceptance Scenarios**:

1. **Given** a hairpin is selected, **When** the user opens its properties, **Then** the dialog shows its current height and offsets.
2. **Given** the dialog is open, **When** the user changes any numeric field, **Then** the hairpin redraws immediately with the new value.
3. **Given** the user clicks Cancel after making changes, **Then** the hairpin reverts to its prior shape.
4. **Given** the dialog is open, **When** the user clicks Remove, **Then** the hairpin is deleted from the score.

---

### User Story 6 - Edit a Dynamics marking using the modern dialog (Priority: P6)

As a score editor user, when I open properties for a dynamics marking (or a marking newly added to one or more selected notes), I can choose its dynamic level from a list, adjust its position, and set its size, with the change applied to every note the marking currently covers.

**Why this priority**: Similar control mix to Volta/Hairpin (numeric plus one dropdown) but distinguished by applying its change across a set of note selections rather than a single modifier, and by needing to support the newly-added, not-yet-existing case.

**Independent Test**: Open Dynamics Properties for a marking applied to one or more selected notes, change the dynamic-level dropdown, position, and size fields, confirm every covered note reflects the new marking as each field changes, click OK, and confirm the change persists; separately confirm Cancel reverts all covered notes.

**Acceptance Scenarios**:

1. **Given** one or more notes are selected and the user opens Dynamics Properties (new or existing marking), **Then** the dialog shows the marking's current or default dynamic level, position, and size.
2. **Given** the dialog is open, **When** the user changes the dynamic-level dropdown, position, or size, **Then** every note the marking covers updates to reflect the new value.
3. **Given** the user clicks Cancel after making changes, **Then** all covered notes revert to their state before the dialog was opened.
4. **Given** the dialog is open, **When** the user clicks Remove, **Then** the dynamics marking is removed from every note it covers.

---

### User Story 7 - Create a custom tuplet using the modern dialog (Priority: P7)

As a score editor user, with a run of notes selected, I can open a dialog to specify a custom tuplet ratio (e.g., 5 notes in the space of 4) and whether it is ratioed and/or bracketed, and apply it to the selection.

**Why this priority**: Lowest priority because it is a one-shot creation dialog (no existing modifier to load, no live score update while the dialog is open, no Remove action), making it the simplest remaining conversion and a natural last step.

**Independent Test**: Select a run of notes, open the Custom Tuplet dialog, set the note count and notes-occupied values and the ratioed/bracketed toggles, click OK, and confirm the selected notes are grouped into a tuplet matching the specified settings; separately confirm Cancel applies no tuplet.

**Acceptance Scenarios**:

1. **Given** a run of notes is selected, **When** the user opens the Custom Tuplet dialog, **Then** it shows default values for note count, notes occupied, ratioed, and bracketed.
2. **Given** the dialog is open, **When** the user changes the note count, notes-occupied, ratioed, or bracketed values and clicks OK, **Then** the selected notes are grouped into a tuplet matching those settings.
3. **Given** the user clicks Cancel instead, **Then** no tuplet is applied to the selection.

---

### Edge Cases

- Each of the six modifier dialogs (Volta, Text Bracket, Slur, Pedal Marking, Hairpin, Dynamics) reflects field changes on the score immediately, before OK is clicked; only Custom Tuplet defers its effect until OK, since it creates a new tuplet rather than editing a live modifier.
- While "Reset All Slurs" is running, the Slur dialog's OK, Cancel, and Remove controls must stay disabled; the dialog must not allow closing (or starting another reset) until the batch finishes.
- Cancel on any of the six modifier dialogs must fully restore the modifier to its state when the dialog was opened, discarding every live update made while the dialog was open — including, for Slur, any change made via "Defaults" or a completed "Reset All Slurs" pass on that slur.
- Custom Tuplet has no Remove control, since it has no pre-existing modifier to delete; the other six dialogs all retain their Remove control with unchanged behavior.
- Dynamics markings can apply to more than one note selection at once; changing a field must update every covered note, and Cancel or Remove must undo/remove the marking consistently across all of them.
- Pedal Marking's toggles can affect the visual rendering of a range of measures, not just the measure containing the modifier; the dialog must trigger re-rendering of that whole range on each change, matching current behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each of the seven dialogs (Volta, Text Bracket, Slur, Pedal Marking, Hairpin, Dynamics, Custom Tuplet) MUST be reimplemented as a Vue component with a creation function, following the established pattern already used elsewhere in the app for a Vue-based dialog creation function (a plain function accepting the standard dialog parameters, wiring reactive state and commit/cancel/remove callbacks, and installing the dialog through the existing dialog-installation mechanism), reusing each dialog's existing adapter class unchanged for reading from and writing to the score.
- **FR-002**: Each new dialog's set of fields MUST match the fields currently declared for that dialog (its `dialogElements` list) — Volta: number, X1/X2/Y offsets; Text Bracket: line, position, text, subtext; Slur: spacing, thickness, X/Y offset, start/end position, orientation, defaults, reset-all, and four control-point fields; Pedal Marking: bracket, start mark, release mark, depress text, release text; Hairpin: height, Y shift, left/right shift; Dynamics: Y line, Y offset, X offset, dynamic-level text; Custom Tuplet: note count, notes occupied, ratioed, bracketed.
- **FR-003**: Numeric stepper fields (currently the rocker-style number control) MUST be reimplemented with the existing modern numeric-input component used by other Vue dialogs in the app.
- **FR-004**: Dropdown/selection fields (currently the dropdown control, e.g. Text Bracket position, Slur start/end position and orientation, Dynamics level) MUST be reimplemented with the existing modern dropdown component used by other Vue dialogs in the app.
- **FR-005**: On/off toggle fields (currently the toggle-style control, e.g. Pedal Marking's bracket/start-mark/release-mark, Custom Tuplet's ratioed/bracketed, Slur's defaults/reset-all actions) MUST be reimplemented with the existing modern toggle component used by other Vue dialogs in the app.
- **FR-006**: Free-text fields (currently the text-input control, e.g. Text Bracket's text/subtext, Pedal Marking's depress/release text) MUST be reimplemented with a modern text-input component consistent with other Vue dialogs in the app.
- **FR-007**: For each of the six dialogs that edit an existing score modifier (all except Custom Tuplet), changing any field value MUST update the score immediately, matching current live-update behavior, using each dialog's existing adapter for the actual score changes.
- **FR-008**: For each of the six modifier-editing dialogs, clicking Cancel MUST fully revert the modifier (and, for Pedal Marking, the measures it affects; for Dynamics, every note it covers) to its state at the moment the dialog was opened.
- **FR-009**: For each of the six modifier-editing dialogs, a Remove control MUST remain available and MUST delete the modifier (or, for Dynamics, remove the marking from every note it covers) from the score, matching current behavior.
- **FR-010**: The Slur dialog MUST preserve its "Defaults" (reset this slur) and "Reset All Slurs" (reset every slur in the score) actions, including disabling the OK, Cancel, and Remove controls for the duration of a "Reset All Slurs" run and re-enabling them only once every slur has been processed.
- **FR-011**: The Custom Tuplet dialog MUST NOT display a Remove control, and MUST NOT modify the score until OK is clicked, matching its current one-shot creation behavior (no live per-field score update while the dialog is open).
- **FR-012**: Every call site currently constructing one of the seven legacy dialog classes directly (menu commands, hotkey-triggered dialog factory, or any other invocation) MUST be updated to invoke the corresponding new Vue dialog creation function instead, so the legacy dialog classes are no longer reachable from the running application.
- **FR-013**: Each new dialog MUST retain the same on-screen label/title, the same positioning-near-the-modifier behavior, keyboard capture, and draggability that the corresponding legacy dialog currently provides.

### Key Entities

- **Volta (2nd ending)**: A repeat-ending bracket on the score with a display number and position offsets.
- **Text Bracket**: A staff-attached bracket with a line number, above/below position, and label text with an optional subtext.
- **Slur**: A curved connector between notes with shape (spacing, thickness, offsets, two control points), start/end position, and orientation, computable to a score-derived default shape.
- **Pedal Marking**: A piano pedal indication spanning a range of measures, with optional bracket/start-mark/release-mark decorations and depress/release label text.
- **Hairpin**: A crescendo/decrescendo wedge with a height and left/right/vertical offsets.
- **Dynamics Marking**: A dynamic-level indication (e.g. piano, forte) attached to one or more notes, with a position and size.
- **Custom Tuplet**: A specification (note count, notes occupied, ratioed, bracketed) applied to a run of selected notes to group them into a tuplet, not a persistent modifier on its own.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For each of the seven dialogs, a user can complete a full open-edit-save (or open-configure-apply, for Custom Tuplet) cycle with no user-visible functional regression compared to today's dialog.
- **SC-002**: For each of the six modifier-editing dialogs, Cancel always fully reverts the modifier to its pre-dialog state, with no residual score changes, in 100% of tested cases.
- **SC-003**: None of the seven dialogs' controls are built on the legacy custom dialog-component base classes after this change; every field renders and behaves consistently with the rest of the application's modern dialogs.
- **SC-004**: No application code path constructs any of the seven legacy dialog classes directly any longer; every entry point that used to open one of them now opens the corresponding new Vue dialog.
- **SC-005**: The Slur dialog's "Reset All Slurs" action completes for a score with multiple slurs with the dialog's close controls disabled throughout and re-enabled immediately afterward, in 100% of tested cases.

## Assumptions

- Each dialog's existing adapter class (`SuiVoltaAdapter`, `SuiTextBracketAdapter`, `SuiSlurAdapter`, `SuiPedalMarkingAdapter`, `SuiHairpinAdapter`, `SuiDynamicDialogAdapter`, `SuiCustomTupletAdapter`) already fully encapsulates the score-reading and score-writing logic needed by its dialog and is reused as-is; this feature only replaces each dialog's UI layer and creation function, not its underlying score-editing logic.
- "Modern components used elsewhere in the app" refers to the Vue dialog components already established in the codebase for numeric input, dropdown selection, toggles, and text input, consistent with how other legacy dialogs in this codebase have already been migrated to Vue.
- This is an internal architectural migration rather than a change to end-user-visible capability: every field, action, and behavior available in each legacy dialog remains available in its Vue replacement, with no fields added or removed.
- Because each legacy dialog's call sites are being switched over as part of this change (per FR-012), the legacy dialog classes themselves may be left in place as dead code or removed entirely; either is acceptable as long as no live code path still constructs them.
- No project constitution has been ratified yet, so no additional project-specific principles apply beyond the existing Vue dialog conventions already established in the codebase.
