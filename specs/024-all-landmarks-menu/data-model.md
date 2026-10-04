# Data Model: Add All Landmarks Menu Option

This feature adds no new persisted entities, no new fields, and no new classes. It adds one new menu-option value object in `src/ui/menus/text.ts`, built entirely from functions and data that already exist there.

## New value: the "All" menu option

A `SuiConfiguredMenuOption` (existing interface, `src/ui/menus/menu.ts`), appended to the existing `landmarkOptions` array alongside the seven per-purpose options:

| Field | Value |
|---|---|
| `menuChoice` | `{ icon: 'mi title', text: 'All', value: 'landmark-All' }` — same icon convention as the existing per-purpose entries; `value` follows the existing `landmark-${label}` naming pattern already used by `landmarkOption`. |
| `display` | `() => true` — always shown (spec FR-007; spec Assumption: no hiding even when nothing is left to add). |
| `subMenu` | absent (a leaf option, so selecting it runs `handler` then the menu framework closes the menu — research.md §1). |
| `handler` | Loops over the same seven `(purpose, label, icon)` triples the existing `landmarkOptions` array is built from, in the same order; for each one not already present (`findLandmark`) and available (`sourceTextDefined`), builds and adds it exactly as `landmarkOption`'s own handler does — `resolveLandmarkText` → `resolveLandmarkMeasureText` → `findAboveLandmark` → `SmoTextGroup.createLandmarkText` → `await menu.view.addTextGroup(group)` — and never calls `SuiTextBlockDialogVue`. |

## Reused, unmodified existing pieces

| Name | Where | Role in this feature |
|---|---|---|
| `SmoTextGroup.purposes.*` | `src/smo/data/scoreText.ts` | The seven purpose constants iterated over (TITLE, SUBTITLE, COMPOSER, COPYRIGHT, DATE, PAGE, PART). |
| `findLandmark(purpose, view)` | `src/ui/menus/text.ts` | "Does this purpose already exist" check — skip if so (FR-003). |
| `sourceTextDefined(purpose, view)` | `src/ui/menus/text.ts` | "Is this purpose available to create" check (research.md §2). |
| `resolveLandmarkText` / `resolveLandmarkMeasureText` | `src/ui/menus/text.ts` | Produce the new landmark's initial text / width-estimation text, identical to individual creation. |
| `findAboveLandmark(purpose, view)` | `src/ui/menus/text.ts` | Same-column stacking reference, re-evaluated per purpose as earlier ones in this same "All" pass get added (research.md §3). |
| `SmoTextGroup.createLandmarkText(...)` | `src/smo/data/scoreText.ts` | Builds the new landmark `SmoTextGroup`, unmodified. |
| `SuiScoreViewOperations.addTextGroup(group)` | `src/render/sui/scoreViewOperations.ts` | Persists + renders the new landmark, unmodified; called once per created landmark. |

No new entities, no new relationships, no new validation rules — this feature is a control-flow loop over existing, already-correct building blocks.
