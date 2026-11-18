# Research: Delete Special for Note Attachments

All unknowns from the Technical Context are resolved below. No `NEEDS CLARIFICATION` items remain.

## R1: Where each kind lives on a note

**Finding** (`src/smo/data/note.ts`, `src/smo/xform/copypaste.ts`):

| Kind | Stored as | Existing way to clear it |
|------|-----------|--------------------------|
| dynamics | `note.textModifiers` entries whose `attrs.type` is `SmoDynamicText` | none for all at once; Paste Special filters the list |
| lyrics | `textModifiers` entries of type `SmoLyric` with `parser === SmoLyric.parsers.lyric` (one per verse) | Paste Special's `removeLyricsOfParser` (file-private) |
| annotations | `SmoLyric` with `parser === SmoLyric.parsers.annotation` | `note.removeAllAnnotations()` |
| chords | `SmoLyric` with `parser === SmoLyric.parsers.chord` | `removeLyricsOfParser` (file-private) |
| articulations | `note.articulations` | `note.clearArticulations()` |
| ornaments | `note.ornaments` | none; Paste Special assigns `[]` |
| grace notes | `note.graceNotes` | `removeGraceNote(offset)` one at a time |
| arpeggios | `note.arpeggio` (one, or `undefined`) | `addRemoveArpeggio('none')` sets `undefined` |
| microtones | `note.tones` | `note.removeMicrotone()` sets `[]` |

Lyrics, annotations and chords share one list and one class, told apart by `parser`. Each must be filtered by parser, so one never removes another.

**Decision**: A small table in `operations.ts`, one entry per kind, each with a `count(note)` and a `clear(note)`. It writes the same fields the existing methods write.

**Rationale**: The nine rules are in one place, are easy to test, and each is one line. Paste Special has an equivalent table for its six kinds, but it also pastes, and it is file-private; sharing it would couple a delete to the paste code. The three text kinds use the same parser filter either way.

**Alternatives considered**: Adding `clearDynamics()`, `clearLyrics()` and so on to `SmoNote` (more public API and declaration churn for one caller); reusing `pasteAttributeHandlers` (private, has `paste`, covers six kinds only).

## R2: How the edit is applied, undone and redrawn

**Finding**: `SuiScoreViewOperations.modifyCurrentSelections(label, actor)` takes the undo snapshot of the selected measures (`undoTrackerMeasureSelections`), runs the actor on the displayed score and on the backing score (`storeScore`, through the equivalent selections), re-renders the changed measures and waits. `addRemoveArpeggio`, `setNoteHead` and `setBeamGroups` use it. It is one undo step.

**Decision**: `deleteNoteAttributes(kinds)` calls `modifyCurrentSelections('delete special', (score, selections) => SmoOperation.deleteNoteAttributes(selections, kinds))`.

**Rationale**: Same path as the other note edits, so undo, the backing score and redraw behave as users already expect. Selections are the tracker's current selections, which always include the note under the cursor, and rests are selections like notes.

## R3: "No undo step when nothing changes"

**Finding**: `modifyCurrentSelections` takes its snapshot before it runs the actor, so a no-op would still leave an undo step.

**Decision**: Before calling it, the view method checks `SmoOperation.countNoteAttributes(selections, kinds)`. If no kind is ticked or the count is 0, it returns without touching the score, the undo stack or the renderer.

**Rationale**: Meets spec FR-014 and the edge case for notes with none of the ticked kinds, with a read-only pre-pass that costs one loop.

## R4: Grace notes, arpeggios and microtones when removed

**Finding**: Grace notes take no time in the measure, so removing them does not change durations or ticks. Arpeggio and microtone are display and sound properties of the note. The renderer rebuilds the changed measures from the note data.

**Decision**: No special handling beyond clearing the fields. The measure redraw in `modifyCurrentSelections` picks up spacing changes.

**Rationale**: Matches spec FR-015 and the edge case on grace notes.

## R5: Dialog

**Finding**: `pasteSpecial.vue` is a `dialogContainer` with a `toggle` per kind and an `enable` flag that turns confirm on once something is chosen; `SuiPasteSpecialDialog` builds a reactive `selected` record and calls the view on commit. `toggle` takes `domId`, `label`, `initialValue` and `changeCb`.

**Decision**: Copy that shape for `deleteSpecial.vue` and `SuiDeleteSpecialDialog`, with nine toggles, all off, and no replace/add toggle. The kind labels come from one record in the dialog file. Confirm is disabled until a kind is on. Cancel does nothing.

**Rationale**: The same look and keyboard behaviour as Paste Special, and the least new code. Because nothing is changed until confirm, cancel needs no undo.

**Alternatives considered**: Extending `pasteSpecial.vue` with a "delete" mode (mixes two commands, and the replace toggle has no meaning for delete).

## R6: Menu placement

**Decision**: Add `deleteSpecialMenuOption` to `src/ui/menus/edit.ts`, right after `pasteSpecialMenuOption` in the exported option list, with `display` always true. Its dialog parameters follow Paste Special (`ctor: 'SuiDeleteSpecialDialog'`, `id: 'deleteSpecial'`, `modifier: null`).

**Rationale**: The spec says to place it next to Paste Special and that the command is always available (a selection always exists).

## R7: Exports and declarations

**Decision**: Export the new dialog from `src/application/exports.ts` the way `SuiPasteSpecialDialog` is (import, `export *`, list entry) and from the root `typedoc.ts`. Hand-edit the declarations in `types/` for the new and changed members; `npm run types` is not used because it rewrites unrelated files. `SuiDeleteSpecialDialog` is not added to the translation `allDialogs` list: Paste Special is not in it either, and the Vue dialogs use English labels.

## R8: Tests

**Decision**: `tests/deleteSpecial.ts` builds scores with the same helpers as `tests/pasteSpecial.ts` (default score, quarter notes, the dynamic-constructor registration) and checks the cases in [quickstart.md](quickstart.md) against `SmoOperation` directly. A save and reload uses the full-form serializer, as in `tests/dynamicsFontSize.ts`.
