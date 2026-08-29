# Quickstart: Validating the Vue-Based Key Signature and Tempo Dialogs

No automated UI test suite exists for these dialogs (`npm test` is a no-op in this repo — see `plan.md` Technical Context), so validation is manual, in-browser.

## Prerequisites

- Node/npm installed, repo dependencies installed (`npm install`, if not already)
- Local build/serve pipeline available

## Setup

1. Build the project: `npm run build`
2. Serve it: `npm run server`
3. Open the score editor in a browser and load or create a score with at least a few measures.

## Validation scenarios

### 1. Key Signature (User Story 1)

Open the dialog from each entry point in turn and confirm each opens the new Vue dialog:
- Ribbon "Key Signature" button
- Display menu's Key Signature command
- The "k" slash-command hotkey

For each:
- Confirm the dialog shows a key dropdown (default C Major) and an "Apply to" dropdown (default Current Selections).
- Pick a different key and a different "Apply to" scope (Current Selections / Future Measures / Full Score), click OK, and confirm the chosen key signature is applied to the expected range of measures.
- Confirm the score is **not** updated while the dialog is still open (only on OK) — this dialog has no live per-field update, matching current behavior.
- Reopen, make a selection, click Cancel, and confirm no key signature change is applied.
- Confirm there is no Remove button (matches current behavior — `research.md` R4).

### 2. Tempo (User Story 2)

Open the dialog from each entry point in turn:
- Ribbon "Tempo" button
- Display menu's Tempo command
- The application-level tempo hotkey (`keyCommands.ts`)
- Any modal-button configuration whose `ctor` is `SuiTempoDialog` (e.g. tablet ribbon), via `ribbon.ts`'s `executeButtonModal`

For each:
- Confirm the dialog shows the current tempo mode, custom text, beats-per-minute, beat unit, tempo text, display toggle, "apply to all future measures" toggle, "apply to selection" toggle, and Y offset.
- Switch Tempo Mode to "Specify text and duration" and confirm the Custom Text field becomes visible; switch to the other two modes and confirm it hides again.
- Change beats-per-minute, beat unit, tempo text, display, and Y offset one at a time, confirming the score's tempo marking updates immediately after each change (before OK is clicked).
- Toggle "Apply to all future measures" / "Apply to selection" and confirm a subsequent field change is scoped accordingly.
- Click OK and confirm the change persists.
- Reopen, make changes, click Cancel, and confirm the tempo marking fully reverts to its state when the dialog was opened.
- Confirm there is no Remove button (matches current behavior — `research.md` R4).

## Regression check

- `grep -rn "createAndDisplayDialog(SuiKeySignatureDialog\|createAndDisplayDialog(SuiTempoDialog" src/ui src/application` should return no matches — confirms SC-004 (no live code path still constructs either legacy dialog class directly).
- `grep -rn "SuiRockerComponent\|SuiDropdownComponent\|SuiToggleComponent\|SuiTextInputComponent" src/ui/dialogs/keySignature.ts src/ui/dialogs/tempo.ts` is expected to still match the `dialogElements` static definitions (kept for i18n/legacy retention, per `research.md` R6) — this is expected, not a regression; SC-003 is about the two dialogs' *rendered* controls, not the retained static metadata.

## Done when

- Both dialogs are opened from every entry point listed above, exercised, and pass their checks (SC-001).
- Cancel fully reverts the Tempo marking in every case tried, and Key Signature's Cancel applies no change (SC-002).
- No `.vue` component created for this feature renders a legacy custom dialog-component base class (SC-003).
- The regression-check greps above come back clean (SC-004).
