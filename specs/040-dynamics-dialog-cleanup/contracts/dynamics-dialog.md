# Contract: Dynamics Dialog

This lists the behaviour that `tests/dynamicsFontSize.ts` checks, the interfaces the dialog depends on, and the checks for the cleanup. Case ids are used in the test names.

## Model: `SmoDynamicText` font size (tests)

| Id | Case | Expected |
|----|------|----------|
| M1 | a new marking from `SmoDynamicText.defaults` | `fontSize === 30` |
| M2 | `isValidFontSize` with 1, 30, 99 | true |
| M3 | `isValidFontSize` with 0, -5, 100, 1000 | false |
| M4 | `isValidFontSize` with 12.5, `NaN`, `Infinity`, `-Infinity` | false |
| M5 | `isValidFontSize` with a string or `undefined` (cast) | false |
| M6 | `minFontSize` and `maxFontSize` | 1 and 99 |

## Serialization (tests)

| Id | Case | Expected |
|----|------|----------|
| S1 | a marking with the default size, serialized | the output has no `fontSize` |
| S2 | a marking with size 48, serialized | `fontSize` is 48 |
| S3 | a score with a size-48 marking on one note and a default marking on another, saved and loaded | the first loads with 48, the second with 30 |
| S4 | a marking written without `fontSize` (as an older version wrote it) loaded through `SmoDynamicText.deserialize` or the note | `fontSize === 30` |
| S5 | a size set to 48, then back to 30, then saved | the saved marking has no `fontSize` |

## Applying to selected notes (tests)

| Id | Case | Expected |
|----|------|----------|
| A1 | three notes; the same marking is added to each with `SmoOperation.addDynamic`; its size is changed to 40 and added to each again | all three notes carry a marking of size 40 and there is exactly one marking on each note |
| A2 | `SmoOperation.removeDynamic` on each selected note | no note has a marking |
| A3 | a marking on one note of a measure of two | the other note is unchanged |

## Dialog (checked by compilation, a search, and the manual steps)

- The dialog is created by `SuiDynamicModifierDialogVue(parameters)`, exported from `src/ui/dialogs/dynamicsVue.ts`, with the same parameters as now.
- It passes the component: `domId`, `label` ('Dynamics Properties'), `initialPosition`, `yOffsetLine`, `yOffsetPixels`, `xOffset`, `fontSize`, `text`, `updateNumberCb`, `updateTextCb`, and the commit, cancel and remove callbacks.
- `updateNumberCb(param, value)` accepts `'yOffsetLine' | 'yOffsetPixels' | 'xOffset' | 'fontSize'`, sets the field on the marking, and applies it to every selected note. A `fontSize` that fails `isValidFontSize` is ignored.
- The Font Size field shows the marking's current size, steps by 1, and is limited to 1 to 99.

## Cleanup (checked by search and build)

| Id | Check | Expected |
|----|-------|----------|
| C1 | `src/ui/dialogs/dynamics.ts` | does not exist |
| C2 | search `src` and `tests` for `SuiDynamicDialogAdapter` | no results |
| C3 | search `src` and `tests` for `dialogs/dynamics'` | no results |
| C4 | search `src` and `tests` for `SuiDynamicModifierDialog\b` | only the `ctor` strings in `menus/text.ts` and `dialogs/dynamicsVue.ts`'s function name `SuiDynamicModifierDialogVue` (not matched by `\b` after `Dialog`); no class reference |
| C5 | `npx tsc --noEmit -p tsconfig.json` | no errors |
| C6 | compile `dynamics.vue` with `@vue/compiler-sfc` | no errors |
| C7 | the dialog factory with a `SmoDynamicText` modifier | still calls `SuiDynamicModifierDialogVue` |
| C8 | the declarations in `types/` | no file or export refers to `dialogs/dynamics` |
