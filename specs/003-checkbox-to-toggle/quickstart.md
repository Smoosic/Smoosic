# Quickstart: Validating the Dialog Checkbox-to-Toggle Migration

No automated UI test suite exists for these dialogs (`npm test` is a no-op in this repo — see `plan.md` Technical Context), so validation is manual, in-browser, against each of the 11 components listed in `data-model.md`.

## Prerequisites

- Node/npm installed, repo dependencies installed (`npm install`, if not already)
- Local build/serve pipeline available (`npm run build` then `npm run server`, or the project's usual dev workflow)

## Setup

1. Build the project: `npm run build`
2. Serve it: `npm run server`
3. Open the score editor in a browser and load or create a score with at least: one part with two staves (for `newPart`/`staffGroups`), a time signature, some text blocks, and guitar tab notation — enough to open every dialog in scope.

## Validation scenarios

Run each of these against the corresponding dialog. For every one, confirm per `spec.md` User Stories 1–3:

- (US1) the control renders as a toggle switch, not a checkbox, and reflects the setting's current value
- (US1) toggling it changes the same underlying setting the checkbox used to (verify the effect — e.g. the score re-renders, a value persists after closing/reopening the dialog)
- (US2) where the spec's label-relocation applies (Case 1/2 in `data-model.md`), the descriptive text appears as the toggle's own label and no separate/orphaned label element remains
- (US3) where a label column was removed (Case 1 only), the toggle's row is visually the same total width as before, aligned with sibling rows in the same dialog

| # | Dialog | Open via | What to check |
|---|--------|----------|----------------|
| 1 | `addMeasures.vue` | Score menu → Add Measures | "Append to Selection" toggle; toggling changes whether new measures append vs. insert |
| 2 | `fontPicker.vue` | Any text/font-picking entry point | "Bold" and "Italic" toggles; toggling changes the previewed font style |
| 3 | `guitarTab.vue` | Tab staff note-entry dialog | "Show Stems" toggle; toggling changes stem visibility on the tab staff |
| 4 | `instrumentProperties.vue` | Part → Instrument Properties (percussion instrument) | "Use Percussion Symbols" toggle only visible/relevant when percussion symbols are applicable; row-hide condition still works |
| 5 | `newPart.vue` | Score → Add Part | "Use Percussion Symbols" and "2-Stave part" toggles; both drive the same effects as before (percussion row visibility, staff count) |
| 6 | `partInfo.vue` | Part → Part Info | "Preserve Text Groups", "Expand Multimeasure Rests", "Include Next Stave" toggles; each independently affects part rendering/inclusion |
| 7 | `scorePreferences.vue` | Score → Preferences | All 7 toggles (auto-advance, auto-play, show piano, transposing score, hide empty staves, show part names, horizontal display); each independently controls its setting |
| 8 | `staffGroups.vue` | Score → Staff Groups | Per-staff group/start/end toggles; toggling still groups/ungroups staves and shows/hides the group-line connector |
| 9 | `textBlock.vue` | Add/edit a text block | "Attach to Selection" toggle; toggling changes whether the text block follows the current selection |
| 10 | `timeSignature.vue` | Measure → Time Signature | "Use Symbol" (disabled when `!supportsSymbol`, e.g. non-common/cut time), "Display Time Signature", "Compound Time Signature" toggles |
| 11 | `viewStaves.vue` | Score → View Staves | "Horizontal Display" toggle and one per-stave "show" toggle per row; each independently controls stave visibility/layout |

## Regression check

- Confirm no `<input type="checkbox">` remains anywhere under `src/ui/components/dialogs` except inside `toggle.vue` itself:
  `grep -rn "type=\"checkbox\"" src/ui/components/dialogs` (excluding `toggle.vue`) should return no matches. This directly verifies SC-001.
- Open each dialog once more side-by-side with a git stash of the pre-migration version (or a screenshot taken before starting) to visually confirm no row's overall width or alignment shifted (SC-004).

## Done when

- All 11 dialogs above render toggles instead of checkboxes, with identical underlying behavior (SC-002).
- Every Case 1/2 label (per `data-model.md`) appears as the toggle's own label with no orphaned label markup (SC-003).
- Every Case 1 row's total width matches its pre-migration width (SC-004).
