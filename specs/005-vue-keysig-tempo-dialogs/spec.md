# Feature Specification: Vue-Based Key Signature and Tempo Dialogs

**Feature Branch**: `005-vue-keysig-tempo-dialogs`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "for src/ui/keySignature.ts and /src/ui/tempo.ts, replace the legacy dialog with a vue component version. Use numberInput.vue for the rocker component, toggle.vue for the input checkbox, and select.vue for the dropdown.ts component."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set the Key Signature using the modern dialog (Priority: P1)

As a score editor user, when I open the Key Signature dialog, I can choose a key from a list and choose whether it applies to my current selection, future measures, or the whole score, using the same modern controls used elsewhere in the app, with the score updating exactly as it does today.

**Why this priority**: Key Signature is the simpler of the two dialogs (two dropdowns, no live per-field score update while open, no Remove action) and proves out the conversion pattern for a dialog invoked from multiple entry points (ribbon button, menu, slash-command hotkey) rather than from clicking a modifier on the score.

**Independent Test**: Open the Key Signature dialog from the ribbon, choose a key and an "apply to" scope, click OK, and confirm the chosen key signature is applied to the chosen scope of measures. Separately, reopen and click Cancel, and confirm no change is applied.

**Acceptance Scenarios**:

1. **Given** the Key Signature dialog is opened from any of its entry points (ribbon button, display menu, or the "k" slash-command hotkey), **When** it opens, **Then** it shows a key dropdown (defaulting to C Major) and an "Apply to" dropdown (defaulting to Current Selections).
2. **Given** the dialog is open, **When** the user picks a different key and a different "Apply to" scope and clicks OK, **Then** the score's measures in that scope are updated to the chosen key signature.
3. **Given** the user clicks Cancel instead, **Then** no key signature change is applied to the score.

---

### User Story 2 - Edit the Tempo using the modern dialog (Priority: P2)

As a score editor user, when I open the Tempo dialog, I can pick how tempo is expressed (a beats-per-minute duration, descriptive tempo text, or both), adjust the beats-per-minute value, the beat unit, and the vertical offset of the marking, toggle whether it displays on the score and whether it applies to future measures and/or the current selection, using the same modern controls used elsewhere in the app, with the change visible on the score as I make it — matching current behavior.

**Why this priority**: Tempo is the more complex of the two dialogs, combining dropdown, numeric-stepper, toggle, and free-text controls, live per-field score updates, and mode-dependent field visibility, so it builds on the pattern established by User Story 1.

**Independent Test**: Open the Tempo dialog on a measure, change the Tempo Mode dropdown and confirm the relevant fields (Custom Text / Notes-per-Minute + Unit for Beat / Tempo Text) show or hide accordingly, change each remaining field and confirm the score's tempo marking updates live, toggle "Apply to all future measures" and "Apply to selection" and confirm the scope of the update changes accordingly, click OK, and confirm the change persists. Separately, reopen, make changes, click Cancel, and confirm the tempo marking reverts.

**Acceptance Scenarios**:

1. **Given** the Tempo dialog is opened from any of its entry points (ribbon button, display menu, tablet ribbon, or hotkey), **When** it opens, **Then** it shows the measure's current tempo mode, custom text, beats-per-minute, beat unit, tempo text, display toggle, apply-to-all toggle, apply-to-selection toggle, and Y offset.
2. **Given** the dialog is open, **When** the user changes the Tempo Mode to "Specify text and duration", **Then** the Custom Text field becomes visible (and is hidden for the other two modes).
3. **Given** the dialog is open, **When** the user changes any field (tempo mode, beats-per-minute, beat unit, tempo text, display, apply-to-all, apply-to-selection, Y offset), **Then** the tempo marking on the score updates immediately to reflect the new value, scoped by the current apply-to-all/apply-to-selection settings.
4. **Given** the user clicks Cancel after making changes, **Then** the tempo marking reverts to the values it had when the dialog was opened.

---

### Edge Cases

- The Tempo dialog's Custom Text field is visible only when Tempo Mode is "Specify text and duration"; Notes/Minute and Unit for Beat are relevant to duration-based modes and Tempo Text to text-based modes, matching the current dialog's mode-dependent field visibility.
- Key Signature has no live per-field score update and no Remove action — the score is changed only when OK is clicked, matching its current one-shot apply-on-commit behavior; Cancel applies nothing.
- Tempo's Cancel must fully restore the tempo marking (mode, text, bpm, beat unit, display, offsets) to its state at the moment the dialog was opened, discarding every live update made while it was open.
- Key Signature's "Apply to" scope (Current Selections / Future Measures / Full Score) must be resolved at the moment OK is clicked, based on the current selection at that time, matching current behavior.
- Both dialogs are opened from several different call sites (ribbon buttons, display-menu commands, the slash-command hotkey for Key Signature, and additionally the tablet ribbon and application hotkey for Tempo); all of them must open the new dialog instead of the legacy one.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Both dialogs (Key Signature, Tempo) MUST be reimplemented as Vue components with a creation function, following the established pattern already used elsewhere in the app for a Vue-based dialog creation function (a plain function accepting the standard dialog parameters, wiring reactive state and commit/cancel/remove callbacks, and installing the dialog through the existing dialog-installation mechanism), reusing each dialog's existing adapter class unchanged for reading from and writing to the score.
- **FR-002**: Each new dialog's set of fields MUST match the fields currently declared for that dialog (its `dialogElements` list) — Key Signature: key, apply-to scope; Tempo: tempo mode, custom text, beats-per-minute, beat unit, tempo text, apply-to-all-future-measures, apply-to-selection, display, Y offset.
- **FR-003**: The numeric stepper field(s) (currently the rocker-style number control — Tempo's beats-per-minute and Y offset) MUST be reimplemented using the `numberInput.vue` component.
- **FR-004**: Dropdown/selection fields (currently the dropdown control — Key Signature's key and apply-to scope; Tempo's tempo mode, beat unit, and tempo text) MUST be reimplemented using the `select.vue` component.
- **FR-005**: On/off toggle fields (currently the toggle-style checkbox control — Tempo's display, apply-to-all-future-measures, and apply-to-selection) MUST be reimplemented using the `toggle.vue` component.
- **FR-006**: Tempo's free-text field (Custom Text) MUST be reimplemented with a text input consistent with other Vue dialogs in the app, and MUST remain visible only when Tempo Mode is set to "Specify text and duration".
- **FR-007**: For the Tempo dialog, changing any field value MUST update the score's tempo marking immediately, matching current live-update behavior, using the existing `SuiTempoAdapter` for the actual score changes.
- **FR-008**: For the Tempo dialog, clicking Cancel MUST fully revert the tempo marking to its state at the moment the dialog was opened.
- **FR-009**: The Tempo dialog MUST NOT display a Remove control, matching the current dialog's behavior (it does not override the framework's default hide-remove display option, so no Remove button is shown today even though its adapter has an unused `remove()` method).
- **FR-010**: For the Key Signature dialog, the score MUST be updated only when OK is clicked (no live per-field update), applying the chosen key to the chosen scope (current selections, future measures, or full score) exactly as the current dialog does; Key Signature MUST NOT display a Remove control, matching its current lack of one.
- **FR-011**: Every call site currently constructing `SuiKeySignatureDialog` or `SuiTempoDialog` directly (ribbon buttons, display-menu commands, the slash-command hotkey, the tablet ribbon, and the application-level hotkey handler) MUST be updated to invoke the corresponding new Vue dialog creation function instead, so the legacy dialog classes are no longer reachable from the running application.
- **FR-012**: Each new dialog MUST retain the same on-screen label/title, keyboard capture, and draggability that the corresponding legacy dialog currently provides.

### Key Entities

- **Key Signature**: The key (e.g. C Major, F Major) in effect for a range of measures on the score.
- **Tempo Marking**: A measure's tempo specification — its mode (duration, text, or both), beats-per-minute, beat unit, descriptive text, custom text, display flag, and vertical offset — together with whether a change to it applies to future measures and/or the current selection.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For each of the two dialogs, a user can complete a full open-configure-apply cycle with no user-visible functional regression compared to today's dialog.
- **SC-002**: For the Tempo dialog, Cancel always fully reverts the tempo marking to its pre-dialog state, with no residual score changes, in 100% of tested cases; neither dialog displays a Remove control, matching current behavior.
- **SC-003**: Neither dialog's controls are built on the legacy custom dialog-component base classes after this change; every field renders and behaves consistently with the rest of the application's modern dialogs.
- **SC-004**: No application code path constructs `SuiKeySignatureDialog` or `SuiTempoDialog` directly any longer; every entry point that used to open one of them now opens the corresponding new Vue dialog.

## Assumptions

- Each dialog's existing adapter class (`SuiKeySignatureAdapter`, `SuiTempoAdapter`) already fully encapsulates the score-reading and score-writing logic needed by its dialog and is reused as-is; this feature only replaces each dialog's UI layer and creation function, not its underlying score-editing logic.
- "Modern components used elsewhere in the app" refers to the Vue dialog components already established in the codebase (`numberInput.vue`, `select.vue`, `toggle.vue`, and the plain text input pattern used for free text), consistent with how other legacy dialogs in this codebase (including the seven modifier dialogs converted in the prior `004-vue-modifier-dialogs` feature) have already been migrated to Vue.
- This is an internal architectural migration rather than a change to end-user-visible capability: every field and behavior available in each legacy dialog remains available in its Vue replacement, with no fields added or removed.
- The legacy `SuiKeySignatureDialog` and `SuiTempoDialog` classes (and their static `dialogElements`) may be left in place as dead code or removed entirely, as long as no live code path still constructs them directly; `SuiTempoDialog` and `SuiKeySignatureAdapter` remain part of the public API surface re-exported from `src/application/exports.ts` and are not removed by this change.
- No project constitution principle bears on this UI-layer migration beyond the existing Vue dialog conventions already established in the codebase.
