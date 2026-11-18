# Data Model: Dynamics Dialog Cleanup and Font Size

No new persisted data, and no change to the file format.

## SmoDynamicText (existing, one addition)

| Field | Type | Default | Saved | Notes |
|-------|------|---------|-------|-------|
| `text` | string | `'mp'` | when not default | `pp p mp mf f ff sfz` |
| `yOffsetLine` | number | 11 | when not default | vertical position, in staff lines |
| `yOffsetPixels` | number | 0 | when not default | fine vertical offset |
| `xOffset` | number | 0 | when not default | horizontal offset |
| `fontSize` | number | 30 (`defaultNoteScale`) | when not default | **now editable in the dialog**; used by the renderer |

New static members (not persisted):

| Member | Value / behaviour |
|--------|-------------------|
| `SmoDynamicText.minFontSize` | 1 |
| `SmoDynamicText.maxFontSize` | 99 |
| `SmoDynamicText.isValidFontSize(value: number): boolean` | true if `value` is a whole number from `minFontSize` to `maxFontSize` inclusive; false for non-integers, `NaN`, infinities, and anything outside the range |

Saving and loading are unchanged: `serialize()` omits `fontSize` when it is 30, and the constructor starts from the defaults, so a note saved by an older version (no `fontSize`) loads with 30.

## Dialog state (local variables in `SuiDynamicModifierDialogVue`, not stored)

| Variable | Meaning |
|----------|---------|
| `modifier` | the `SmoDynamicText` being edited: `parameters.modifier`, already attached to the first selected note |
| `selections` | the notes the edits apply to: the selections of `tracker.modifierSelections` if a marking itself is selected on the score, otherwise `tracker.selections` |

## Edit flow (each change)

```text
number field or dropdown changes
  -> (fontSize only) ignore the value if SmoDynamicText.isValidFontSize(value) is false
  -> set the field on `modifier`
  -> for each selection: view.addDynamic(selection, modifier)   // replaces the marking on that note, queues a redraw
```

Session flow:

```text
open:    view.groupUndo(true); view.undoTrackerMeasureSelections('Dynamics'); choose `selections`
OK:      nothing to do (InstallDialog ends the undo group)
Cancel:  view.undo()
Remove:  view.removeDynamic(modifier)   // removes it from every selected note
```
