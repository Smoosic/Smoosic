# Quickstart: Validating the Configured Menu Migration

No automated test suite covers these menu classes (`npm test` is a no-op in this repo — see `plan.md` Technical Context), so validation is a TypeScript build plus manual, in-browser exercise of each menu.

## Prerequisites

- Node/npm installed, repo dependencies installed (`npm install`, if not already)
- Local build/serve pipeline available

## Setup

1. Type-check / build: `npm run build` (or `npm run types`) — must complete with no new TypeScript errors.
2. Serve it: `npm run server`
3. Open the score editor in a browser and load or create a score with at least two parts/staves, some existing pedal markings, and enough notes to trigger every Lines-menu action.

## Validation scenarios

### Language menu (User Story 1)

1. Open the Language menu, select each of English / Deutsch / اَلْعَرَبِيَّةُ, and confirm `SmoTranslator.setLanguage` runs each time (UI language/direction updates) and the menu closes.

### Lines menu (User Story 1)

1. Exercise every choice — Cresc./Dim. Hairpin, Slur, Tie, nth ending/Repeat Endings, Dim./Cresc. Bracket, Accelerando, Ritard — and confirm each produces the same score change as before the migration.
2. With a selection overlapping an existing pedal marking, choose "Pedal Marking" and confirm the overlapping marking is merged/replaced (not duplicated), matching today's overlap-resolution logic (`data-model.md`).
3. Choose "Reset slurs" and confirm the menu does not dismiss until the viewport refresh finishes (no visible flash/incomplete redraw), matching `research.md` R4.

### Score Settings menu (User Story 2)

1. With the full score in view (no part exposed), open Score Settings — confirm Page Layout, Global Layout, and System Groups all appear, and View All does not.
2. Expose a single part, open Score Settings again — confirm Page Layout, Global Layout, and System Groups are all hidden, and View All appears.
3. In both states, confirm Smoosic Preferences, Score Fonts, Score Info, and Transpose Score all appear, and each opens its corresponding dialog correctly.
4. Select View All while a part is exposed — confirm the full score view returns.

### Parts menu (User Story 3)

1. On a multi-part score with no part exposed, open the Parts menu — confirm one choice per part appears (correct names, in the score's part order) and no View All choice appears.
2. Select a part — confirm that part is exposed and the menu closes.
3. Reopen the Parts menu — confirm View All now appears in addition to the per-part choices; select it and confirm the full score view returns.
4. Open the Parts menu and dismiss it via Cancel — confirm no view change occurs.

## Regression checks

- `grep -rn "extends SuiMenuBase" src/ui/menus/language.ts src/ui/menus/partSelection.ts src/ui/menus/score.ts src/ui/menus/staffModifier.ts` should return no matches — confirms SC-005 (all four now extend `SuiConfiguredMenu`).
- `grep -rn "value: 'cancel'" src/ui/menus/language.ts src/ui/menus/partSelection.ts src/ui/menus/score.ts src/ui/menus/staffModifier.ts` should return no matches — confirms FR-007 (no locally-defined Cancel option; the one Cancel entry each menu shows comes from `SuiConfiguredMenu`'s auto-append).
- `npm run build` (or `npm run types`) exits with no new errors — confirms SC-004.

## Done when

- All four menus above are opened and every choice exercised, matching pre-migration behavior in every case (SC-001).
- The Score Settings view-state checks above all pass in both view states (SC-002).
- The Parts menu checks above all pass, including the View All toggle (SC-003).
- Both regression-check greps above come back clean, and the build/typecheck is clean (SC-004, SC-005).
