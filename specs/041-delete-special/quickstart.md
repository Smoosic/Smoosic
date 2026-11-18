# Quickstart: Delete Special

Validation guide. Details of the types are in the [contract](contracts/delete-special-api.md) and the [data model](data-model.md).

## 1. Automated checks

```text
npx tsc --noEmit -p .
npm run test:delete-special
```

Expected: no compiler errors, and every check in `tests/deleteSpecial.ts` prints `PASS`. The checks cover:

- D1-D9: each kind on its own removes that kind's markings and leaves the other eight (and the pitches and durations) alone.
- L1-L3: lyrics (two verses), annotations and chords on one note; deleting each one alone leaves the other two.
- M1: several kinds ticked at once.
- N1-N2: a note with none of the ticked kinds is unchanged; deleting a second time counts 0.
- S1-S4: a selection of one note, of a run, across measures and staves, and one that stops inside a measure; unselected notes keep their markings.
- R1: rests with a dynamic and an annotation.
- C1-C3: `countNoteAttributes` for no kinds, for unknown kinds, and equal to what was added.
- P1: serialize (full form) and reload after a delete; the markings are gone and the notes are the same.

## 2. The dialog component compiles

Compile `src/ui/components/dialogs/deleteSpecial.vue` with `@vue/compiler-sfc` (parse errors 0, compiles).

## 3. Search proves the wiring

- `SuiDeleteSpecialDialog` is imported in `src/ui/menus/edit.ts` and exported from `src/application/exports.ts` and `typedoc.ts`.
- `deleteNoteAttributes` is declared in `types/src/render/sui/scoreViewOperations.d.ts` and `types/src/smo/xform/operations.d.ts`.

## 4. Manual walkthrough (in the running app)

1. Open a score. Give four notes in a measure a dynamic, a lyric, an annotation, a chord symbol, an articulation and an ornament. Add a grace note, an arpeggio and a microtone to some of them.
2. Select the whole measure. Choose **Edit > Delete Special...**. The nine boxes are unticked and the confirm button is disabled.
3. Tick **Dynamics** only and confirm. The dynamics disappear; everything else is still there. Press Undo: the dynamics return.
4. Open the dialog again, tick **Lyrics** and confirm. The lyrics go; the annotation and chord symbol stay. Repeat for **Annotations** and for **Chords**, undoing each time.
5. Tick **Grace Notes**, **Arpeggios** and **Microtones** together and confirm. All three are gone, the measure is redrawn with correct spacing, and the notes' pitches and rhythm are unchanged. One Undo restores all three.
6. Open the dialog, tick a kind and Cancel. Nothing changes. Open it, tick a kind the selection does not have, and confirm: nothing changes and Undo still undoes your previous edit, not a no-op.
7. Select two measures in two staves and delete **Dynamics**. Both staves lose them in the selected measures only.
8. Save the score and reopen it. The deleted markings are still gone.
