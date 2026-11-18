# Research: Dynamics Dialog Cleanup and Font Size

All unknowns from the Technical Context are resolved below. No `NEEDS CLARIFICATION` items remain.

## R1: What does the legacy adapter do that the dialog must keep?

**Finding** (`src/ui/dialogs/dynamics.ts`, used by `dynamicsVue.ts`):

1. `dynamicsVue.ts` calls `view.groupUndo(true)` and then builds the adapter.
2. The adapter constructor takes an undo snapshot of the selected measures: `view.undoTrackerMeasureSelections('Dynamics')`.
3. It picks which notes to edit: the selections of the selected modifiers (`tracker.modifierSelections`, when a marking itself is selected on the score), otherwise `tracker.selections`.
4. Each field setter sets the field on the modifier, then calls `view.addDynamic(selection, modifier)` for every one of those selections (the `syncModifiers` method; the `xOffset` setter repeats the same loop inline).
5. `cancel()` is `view.undo()`. `commit()` does nothing. `remove()` calls `view.removeDynamic(modifier)` once per selection.
6. `InstallDialog` calls `view.groupUndo(false)` after OK, and after Remove.

**Decision**: Copy these steps into `SuiDynamicModifierDialogVue` as local variables (`modifier`, `selections`) and local arrow functions (`syncModifiers`, the callbacks passed to the component). Same order: `groupUndo(true)`, then the snapshot, then pick the selections.

**Rationale**: The request is a restructuring plus one new field, and the spec's User Story 2 says nothing may change for the user. Copying the steps keeps the undo behaviour (one step for the whole dialog session, Cancel restores everything) exactly as it is.

**One simplification**: the adapter's `remove()` loops over the selections and calls `view.removeDynamic` each time, but `view.removeDynamic` already removes the marking from every selected note, so the second and later calls do nothing. The new Remove calls it once. The result on the score is the same.

**Alternatives considered**: A small shared helper for the "edit the marking on all the selected notes" loop (the annotation dialog has a similar loop). Rejected: the annotation dialog works on lyrics, not dynamics, and sharing would couple the two for no gain.

## R2: Where does the font size come from, and does the renderer honour it?

**Finding**: `SmoDynamicText` has `fontSize` (default `defaultNoteScale`, 30). It is in `defaults`, so it is in `persistArray` and is serialized when it differs from 30. The constructor merges the defaults first, so a note saved without it loads with 30. `renderDynamicsForNote` in `src/render/vex/vxMeasure.ts` passes `textObj.fontSize` to the glyph renderer, so a different size is drawn.

**Decision**: No model or renderer change to make the size work. The dialog only needs to set `modifier.fontSize` and call the same sync as the other fields.

**Rationale**: Confirms the spec's FR-003 and FR-004 need no migration: old scores keep 30.

## R3: The allowed range

**Finding**: `numberInput.vue` clamps typed and stepped values to `minValue`/`maxValue` props, but a callback could still be called with something else if the component is bypassed, and the spec requires that a bad size is never applied (FR-007).

**Decision**: Add `static minFontSize = 1`, `static maxFontSize = 99` and `static isValidFontSize(value: number): boolean` (a whole number from 1 to 99) to `SmoDynamicText`. The dialog uses the constants for the number field's `minValue`/`maxValue` and calls `isValidFontSize` in its callback before it changes the marking.

**Rationale**: One definition of the range, testable headless, used by both the field and the guard. 1 to 99 is the assumption recorded in the spec; the default of 30 is well inside it.

**Alternatives considered**: Putting the range in the Vue component only (not testable without the UI; two places to change); a wider range such as 6 to 200 (no evidence for it; can be changed in one place later).

## R4: What references the legacy dialog?

**Finding** (search of `src`, `types`, `tests`):

- `src/ui/dialogs/dynamics.ts` defines `SuiDynamicDialogAdapter` and `SuiDynamicModifierDialog`.
- `src/application/exports.ts` imports `SuiDynamicModifierDialog`, re-exports the whole module (`export * from '../ui/dialogs/dynamics'`), and lists it in the exported-names object.
- `src/ui/i18n/language.ts` lists `'SuiDynamicModifierDialog'` in `allDialogs` (the dialogs the translation editor shows).
- `src/ui/dialogs/annotationVue.ts` has a comment that mentions `SuiDynamicDialogAdapter` and `src/ui/dialogs/dynamics.ts`.
- `src/ui/menus/text.ts` passes the string `'SuiDynamicModifierDialog'` as the `ctor` field of the dialog parameters, and `src/ui/dialogs/factory.ts` opens the Vue dialog for a `SmoDynamicText` modifier. Both use the Vue dialog already.
- `typedoc.ts` at the repository root re-exports the module (found by the compiler after the file was deleted).
- The generated declarations in `types/` mirror these (`dynamics.d.ts`, `exports.d.ts`, `typedoc.d.ts`).
- `src/ui/i18n/language_*.json` and `.js` have saved translations under the ctor name `SuiDynamicModifierDialog`.

**Decision**:
- Delete `dynamics.ts` and `types/src/ui/dialogs/dynamics.d.ts`.
- Remove the three references in `exports.ts` and the matching ones in `types/src/application/exports.d.ts` and `types/typedoc.d.ts`.
- Remove `'SuiDynamicModifierDialog'` from `allDialogs` in `language.ts`.
- Reword the `annotationVue.ts` comment so it no longer names a file that does not exist.
- Keep the `ctor: 'SuiDynamicModifierDialog'` strings in `text.ts` and the factory (they are labels for the dialog parameters, not references to the class), and leave the saved translation files alone.

**Rationale on the translation list**: the translation editor looks each name up as a class (`eval`), and when the class is missing it logs a warning and skips it. The earlier conversion of the time signature dialog left such a stale entry. Removing the entry avoids a new warning. The translation files are data, they are generated by the editor, and the Vue dialogs use English labels, so they are not touched.

**Rationale on the library export**: `SuiDynamicModifierDialog` is a public export of the library build. Removing it is what the request asks for, and nothing in the application uses it. Only outside code that imports it by name is affected (the spec's Assumptions say this).

**Older spec folders**: `specs/004-vue-modifier-dialogs` and `specs/017-text-annotations` describe the old dialog. They are a record of earlier work and are not changed.

## R5: How is the dialog tested without a browser?

**Finding**: `tests/` scripts run under `ts-node` with no DOM and cannot import a `.vue` file. `dynamicsVue.ts` imports `dialog.ts` (which imports Vue and the DOM) and the `.vue` component, so it cannot be loaded either.

**Decision**: Test what can be tested headless: the model rule and the model behaviour the dialog depends on (a size applied through `SmoOperation.addDynamic` reaches every selected note, serializes, and loads). Check the dialog by `tsc`, by compiling `dynamics.vue` with `@vue/compiler-sfc` (as was done for the beam groups dialog), by a repository search that proves the legacy names are gone, and by the manual steps in the quickstart.

**Alternatives considered**: Moving the dialog logic into a plain TypeScript module so it can be tested (adds a layer, which is the opposite of the request); a headless browser test (the constitution says UI rendering need not be tested here, and those belong in the Demos repository).

## R6: Number field for the size

**Decision**: Use the existing `numberInputApp` in `dynamics.vue` with `:precision="0"`, `:minValue` and `:maxValue` from the new constants, in the same style as the other fields, placed with X Offset. The component's callback type for numbers gains `'fontSize'`. The user's uncommitted change to `dynamics.vue` (the callback returning `Promise<void>`) is kept.

**Rationale**: It matches the other three number fields and the font size fields in other dialogs, and needs no new component.
