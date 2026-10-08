# Quickstart: Validating the Vue-Based Modifier Property Dialogs

No automated UI test suite exists for these dialogs (`npm test` is a no-op in this repo — see `plan.md` Technical Context), so validation is manual, in-browser, per dialog.

## Prerequisites

- Node/npm installed, repo dependencies installed (`npm install`, if not already)
- Local build/serve pipeline available

## Setup

1. Build the project: `npm run build`
2. Serve it: `npm run server`
3. Open the score editor in a browser and load or create a score containing at least: a volta/2nd ending, a text bracket, a slur, a pedal marking, a hairpin (crescendo/decrescendo), a dynamics marking, and a run of notes suitable for a custom tuplet — enough to open all seven dialogs.

## Validation scenarios

For each of the six modifier dialogs (all rows except Custom Tuplet), open by clicking the rendered modifier directly on the score canvas (this invokes `SuiEventHandler.createModifierDialog` → `SuiModifierDialogFactory.createModifierDialog`, per `research.md` R5). For each, confirm per the matching User Story in `spec.md`:

- The dialog opens positioned at/near the clicked modifier, not at a fixed unrelated location (R4).
- Every field shows the modifier's current value.
- Changing a field updates the modifier on the score immediately (before clicking OK).
- Cancel reverts every change made since the dialog opened.
- Remove deletes the modifier from the score.
- Escape and dragging the dialog by its handle both still work (unchanged, provided by `InstallDialog`/`draggableComp.vue`).

| # | Dialog | Fields to exercise | Dialog-specific check |
|---|--------|---------------------|------------------------|
| 1 | Volta | number, X1/X2/Y offset | — |
| 2 | Text Bracket | line, position (Above/Below), text, subtext | position dropdown flips the bracket's rendered side |
| 3 | Slur | spacing, thickness, offsets, control points, start/end position, orientation, Defaults, Reset All Slurs | with 2+ slurs in the score, trigger "Reset All Slurs" and confirm OK/Cancel/Remove are disabled until every slur is reset, then re-enabled (US3, SC-005) |
| 4 | Pedal Marking | bracket, start mark, release mark, depress text, release text | toggling a mark re-renders across the marking's full measure range, not just one measure |
| 5 | Hairpin | height, Y shift, left/right shift | — |
| 6 | Dynamics | dynamic-level dropdown, position, size | select 2+ notes with no existing marking, open the dialog, confirm a marking is created and applied to every selected note; changing a field updates all of them |

For Custom Tuplet (Priority P7), open via the tuplets menu's "Custom Tuplet" option after selecting a run of notes:

| # | Dialog | Fields to exercise | Check |
|---|--------|---------------------|-------|
| 7 | Custom Tuplet | note count, notes occupied, ratioed, bracketed | dialog has no Remove button; no score change happens until OK is clicked; OK groups the selection into a tuplet matching the settings; Cancel applies nothing |

## Regression check

- `grep -rn "createAndDisplayDialog(SuiVoltaAttributeDialog\|createAndDisplayDialog(SuiTextBracketDialog\|createAndDisplayDialog(SuiSlurAttributesDialog\|createAndDisplayDialog(SuiPedalMarkingDialog\|createAndDisplayDialog(SuiHairpinAttributesDialog\|createAndDisplayDialog(SuiDynamicModifierDialog\|createAndDisplayDialog(SuiCustomTupletDialog" src/ui` should return no matches — confirms SC-004 (no live code path still constructs a legacy dialog class directly).
- `grep -rn "SuiRockerComponent\|SuiDropdownComponent\|SuiToggleComponent\|SuiTextInputComponent" src/ui/dialogs/volta.ts src/ui/dialogs/textBracket.ts src/ui/dialogs/slur.ts src/ui/dialogs/pedalMarking.ts src/ui/dialogs/hairpin.ts src/ui/dialogs/dynamics.ts src/ui/dialogs/customTuplets.ts` is expected to still match the `dialogElements` static definitions (kept for i18n, per `research.md` R5) — this is expected, not a regression; SC-003 is about the seven dialogs' *rendered* controls, not the retained static metadata.

## Done when

- All 7 dialogs above are opened, exercised, and pass their checks (SC-001).
- Cancel fully reverts all six modifier-editing dialogs in every case tried (SC-002).
- No `.vue` component created for this feature renders a legacy custom dialog-component base class (SC-003).
- The regression-check greps above come back clean (SC-004).
- The Slur "Reset All Slurs" check above passes (SC-005).
