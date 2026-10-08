# Data Model: Vue-Based Modifier Property Dialogs

This feature has no persistence/schema changes — every entity below already exists in the score data model (`src/smo/data/*`) and in each dialog's existing adapter (`src/ui/dialogs/adapter.ts` subclasses). This document maps each entity to the dialog fields it drives and the Vue control each field becomes, per `research.md` R2/R3.

## Volta (`SmoVolta`, via `SuiVoltaAdapter`)

| Field (adapter property) | Type | Vue control | Notes |
|---|---|---|---|
| `number` | int | `numberInput.vue` | 2nd-ending display number |
| `xOffsetStart` | int | `numberInput.vue` | |
| `xOffsetEnd` | int | `numberInput.vue` | |
| `yOffset` | int | `numberInput.vue` | |

Actions: `commit` (no-op — adapter already committed live), `cancel` (restore `backup`), `remove` (`view.removeEnding`). Positioned via R4 using `parameters.modifier.logicalBox`.

## Text Bracket (`SmoStaffTextBracket`, via `SuiTextBracketAdapter`)

| Field | Type | Vue control | Notes |
|---|---|---|---|
| `line` | int | `numberInput.vue` | |
| `position` | int enum (`1` Above / `-1` Below) | `select.vue` | options list carried over verbatim |
| `text` | string | plain text `<input>` | |
| `superscript` | string | plain text `<input>` | dialog label "SubText" |

Actions: `commit` (no-op), `cancel` (remove + re-add `backup`), `remove` (`view.removeStaffModifier`). Positioned via R4.

## Slur (`SmoSlur`, via `SuiSlurAdapter`)

| Field | Type | Vue control | Notes |
|---|---|---|---|
| `spacing`, `thickness`, `xOffset`, `yOffset`, `cp1x`, `cp1y`, `cp2x`, `cp2y` | int | `numberInput.vue` | 8 numeric fields |
| `position`, `position_end` | int enum (Auto/Head/Top) | `select.vue` | start/end position |
| `orientation` | int enum (Auto/Up/Down) | `select.vue` | |
| `resetDefaults` | boolean (write-only action) | `toggle.vue` | "Defaults" — resets this slur only |
| `resetAll` | boolean (write-only action) | `toggle.vue` | "Reset All Slurs" — resets every slur in the score; sets `adapter.updating` for the duration |

Additional state surfaced to the `.vue` component: `updating: Ref<boolean>` (read from `adapter.updating`, polled the same way `SuiSlurAttributesDialog.modalPromise()` does today) drives the `dialogContainer`/`DialogButtons` `enable` prop per R6.

Actions: `commit` (no-op), `cancel` (restore `backup`, skipped while `updating`), `remove` (`view.removeStaffModifier`). Positioned via R4.

## Pedal Marking (`SmoPedalMarking`, via `SuiPedalMarkingAdapter`)

| Field | Type | Vue control | Notes |
|---|---|---|---|
| `bracket` | boolean | `toggle.vue` | |
| `startMark` | boolean | `toggle.vue` | |
| `releaseMark` | boolean | `toggle.vue` | |
| `depressText` | string | plain text `<input>` | |
| `releaseText` | string | plain text `<input>` | |

Actions: `commit` (no-op — writes already applied), `cancel` (`addOrReplacePedalMarking(view, backup)`), `remove` (`view.removeStaffModifier`). The dialog's `changed()` equivalent must continue to call `view._renderChangedMeasures(...)` over the marking's measure range after each field write (per `SuiPedalMarkingDialog.changed()`), not just re-render the single modifier. Positioned via R4.

## Hairpin (`SmoStaffHairpin`, via `SuiHairpinAdapter`)

| Field | Type | Vue control | Notes |
|---|---|---|---|
| `height` | int | `numberInput.vue` | |
| `yOffset` | int | `numberInput.vue` | |
| `xOffsetRight` | int | `numberInput.vue` | |
| `xOffsetLeft` | int | `numberInput.vue` | |

Actions: `commit` (no-op), `cancel` (restore `backup`), `remove` (`view.removeStaffModifier`). Positioned via R4.

## Dynamics Marking (`SmoDynamicText`, via `SuiDynamicDialogAdapter`)

| Field | Type | Vue control | Notes |
|---|---|---|---|
| `yOffsetLine` | int | `numberInput.vue` | |
| `yOffsetPixels` | int | `numberInput.vue` | |
| `xOffset` | int | `numberInput.vue` | |
| `text` | string enum (P/PP/MP/MF/F/FF/SFZ) | `select.vue` | dynamic level |

`parameters.modifier` is always a real, already-score-attached `SmoDynamicText` by the time the dialog opens — the caller (`src/ui/menus/text.ts`, `dynamicsDialogMenuOption.handler`) creates and adds a default marking to every selected note *before* invoking the dialog when none exists yet, so the new creation function needs no "is this new" branch (unlike Text Block).

Actions: `commit` (no-op), `cancel` (`view.undo()`), `remove` (`view.removeDynamic` for every covered selection). Every field write fans out to every note in `adapter.selections` via the adapter's existing `syncModifiers()`. Positioned via R4 using the first covered selection/modifier's box.

## Custom Tuplet (transient `MakeTupletOperation`, via `SuiCustomTupletAdapter`)

| Field | Type | Vue control | Notes |
|---|---|---|---|
| `numNotes` | int (min 1) | `numberInput.vue` | |
| `notesOccupied` | int (min 1) | `numberInput.vue` | |
| `ratioed` | boolean | `toggle.vue` | |
| `bracketed` | boolean | `toggle.vue` | |

Not a score modifier — no `backup`/`cancel` restoration needed (`cancel()` is already a no-op) and no live per-field score update; `commit()` applies `view.makeTuplet(makeTuplet)` once, on OK. No `removeCb` is passed to `InstallDialog` (no Remove button, matching today). Uses the default fixed position (no modifier to position from), matching the legacy dialog's lack of a `MODIFIERPOS` display option.
