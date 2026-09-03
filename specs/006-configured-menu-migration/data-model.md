# Data Model: Configured Menu Migration

This feature has no persistence/schema changes. The "entities" below are each menu's set of `SuiConfiguredMenuOption` definitions (per `research.md` R1) — this table is the option-by-option map from today's static `MenuChoiceDefinition` + `selection()`/`exec*` branch to the new `{ menuChoice, handler, display }` shape, so the migration can be checked field-by-field against current behavior.

## Language Menu (`SuiLanguageMenu`, language.ts)

| `value` | `text` | `handler` | `display` |
|---|---|---|---|
| `en` | English | `SmoTranslator.setLanguage('en')` | `() => true` |
| `de` | Deutsch | `SmoTranslator.setLanguage('de')` | `() => true` |
| `ar` | اَلْعَرَبِيَّةُ | `SmoTranslator.setLanguage('ar')` | `() => true` |
| `cancel` | Cancel | *(auto-appended by `SuiConfiguredMenu` constructor)* | — |

## Lines Menu (`SuiStaffModifierMenu`, staffModifier.ts)

| `value` | `text` | `handler` (current `selection()` branch, reproduced verbatim) | `display` |
|---|---|---|---|
| `crescendo` | Cresc. Hairpin | `view.crescendo()` | `() => true` |
| `decrescendo` | Dim. Hairpin | `view.decrescendo()` | `() => true` |
| `slur` | Slur | `view.addSlur()` | `() => true` |
| `tie` | Tie | `view.tie()` | `() => true` |
| `pedalMarking` | Pedal Marking | build `SmoPedalMarking` from `tracker`'s extreme selections; if it overlaps an existing marking, merge selectors and `await view.removeStaffModifier(overlaps[0])`; then `await addOrReplacePedalMarking(view, pedalMarking)` | `() => true` |
| `ending` | nth ending | `view.addEnding()` | `() => true` |
| `dimenuendo` | Dim. Bracket | `view.dimenuendo()` | `() => true` |
| `crescendoBracket` | Cresc. Bracket | `view.crescendoBracket()` | `() => true` |
| `accel` | Accelerando | `view.accelerando()` | `() => true` |
| `ritard` | Ritard | `view.ritard()` | `() => true` |
| `resetSlurs` | Reset slurs | `await view.refreshViewport()` (menu completion is deferred until this resolves — `research.md` R4) | `() => true` |
| `endings` | Repeate Endings | `view.addEnding()` (identical to `ending`, matching current duplicated behavior) | `() => true` |
| `cancel` | Cancel | *(auto-appended)* | — |

## Score Settings Menu (`SuiScoreMenu`, score.ts)

| `value` | `text` | `handler` | `display` |
|---|---|---|---|
| `preferences` | Smoosic Preferences | `execPreferences()` → `SuiScorePreferencesDialogVue(...)` | `() => true` |
| `fonts` | Score Fonts | `execFonts()` → `SuiScoreFontDialogVue(...)` | `() => true` |
| `identification` | Score Info | `execScoreId()` → `SuiScoreIdentificationDialogVue(...)` | `() => true` |
| `transposeScore` | Transpose Score | `execTransposeScore()` → `SuiTransposeScoreDialogVue(...)` | `() => true` |
| `pageLayout` | Page Layout | `execPageLayout()` → `SuiPageLayoutDialogVue(...)` | `(menu) => menu.view.isPartExposed() === false` |
| `globalLayout` | Global Layout | `execGlobalLayout()` → `SuiGlobalLayoutDialogVue(...)` | `(menu) => menu.view.isPartExposed() === false` |
| `staffGroups` | System Groups | `execStaffGroups()` → `SuiStaffGroupDialogVue(...)` | `(menu) => menu.view.isPartExposed() === false` |
| `viewAll` | View All | `view.viewAll()` | `(menu) => menu.score.staves.length < menu.view.storeScore.staves.length` |
| `cancel` | Cancel | *(auto-appended)* | — |

The four dialog-opening helper methods (`execPreferences`, `execFonts`, `execScoreId`, `execTransposeScore`, `execPageLayout`, `execGlobalLayout`, `execStaffGroups`) may remain as class methods called from each option's handler (`(menu) => (menu as SuiScoreMenu).execFonts()`) or be inlined into each handler directly — either preserves identical behavior; inlining is preferred since it removes the need for an `as SuiScoreMenu` cast on the generic `menu: SuiMenuBase` handler parameter (`research.md` R1).

## Parts Menu (`SuiPartSelectionMenu`, partSelection.ts)

Not a fixed set — rebuilt from `view.getPartMap()` on every `preAttach()` (`research.md` R3):

| Option | Included when | `handler` | `display` |
|---|---|---|---|
| View All (`value: '-1'`) | `score.staves.length < view.storeScore.staves.length` (a part is currently exposed) | `view.viewAll()` | `() => true` |
| One per part, `value: key.toString()`, `text: partMap.partMap[key].partName` | Always, once per key in `view.getPartMap().keys` | `view.exposePart(view.storeScore.staves[partMap.partMap[key].associatedStaff])` | `() => true` |
| `cancel` | Always (the same instance auto-appended at construction, carried forward on each rebuild) | *(auto-appended)* | — |

Unparseable/`cancel` selections close the menu with no view change, matching the current `isNaN` guard in `selection()` — this behavior comes from `SuiConfiguredMenu.selection()`'s existing "no matching option found → just `complete()`" fallthrough once `cancel`'s value doesn't match any handler-bearing option, so no extra guard code is needed in `SuiPartSelectionMenu` itself.
