# Research: Paste Special

No NEEDS CLARIFICATION remained in the Technical Context. Findings come from reading the code.

## R1. The existing alignment, exactly

**Finding**: `PasteBuffer.pasteChordNotes` ([copypaste.ts](../../src/smo/xform/copypaste.ts)) walks the copied notes and the destination notes with two running totals of *elapsed time* (it calls them `srcTick` and `destTick`; they are sums of `note.tickCount`, which is a duration):

```text
destNote = note at the cursor
for each copied note n (in order):
    apply n's chords to destNote
    srcElapsed += n.tickCount
    while destElapsed < srcElapsed and destNote exists:
        destElapsed += destNote.tickCount
        destNote = next note in the same voice (crossing measures)
```

Stated as a rule, which is what the spec adopts: copied note *k* starts at `T_k` (the total length of the copied notes before it) and goes to the first destination note, counting from the cursor, whose start time is at or after `T_k`. Because the destination only moves forward, a destination note that starts after several copied notes can receive all of them, and destination notes in between receive nothing. Hand-traced cases (each is a test):

| Copy | Destination | Result |
|------|-------------|--------|
| 4 quarters | 8 eighths | copied notes go to eighths 1, 3, 5, 7 |
| 2 quarters | 1 whole + 1 whole | the first goes to the first whole; the second starts 1 quarter in and the first destination note starting at or after that is the second whole (next measure) |
| 4 quarters | half, quarter, quarter | pairing is destination notes 0, 1, 1, 2: the second and third copied notes both go to the first quarter, because it starts at or after both of their start times |
| same rhythm | same rhythm | one to one |

The second row shows a consequence the old code shares: a paste can reach a measure beyond the span of the copied duration.

**Decision**: Keep this algorithm for every kind (the user confirmed, 2026-10-31). Extract it into one routine, `alignAttributeNotes`, that returns `{ copied, destination }` pairs and touches nothing.

**Terminology note** (raised by the user): `SmoSelector.tick` is the *index* of a note within its voice, while `tickCount` and these running totals are *durations*. The new code names the totals `copiedElapsed` and `destinationElapsed`, and the index is always called `noteIndex` or "the selector's tick" in comments.

## R2. Where each kind of marking is stored

| Kind | Stored in | Add (replaces on key match) | Clear all of the kind |
|------|-----------|----------------------------|----------------------|
| Dynamics | `note.textModifiers`, type `SmoDynamicText` | `addDynamic` (replaces any dynamic) | filter out type `SmoDynamicText` |
| Lyrics | `note.textModifiers`, `SmoLyric` with parser `lyric` | `addLyric` (replaces same parser and verse) | filter out `SmoLyric` with parser `lyric` |
| Annotations | `textModifiers`, `SmoLyric` with parser `annotation` | `addAnnotation` (same parser and verse) | filter out parser `annotation` |
| Chords | `textModifiers`, `SmoLyric` with parser `chord` | `addLyric` (same parser and verse) | filter out parser `chord` |
| Articulations | `note.articulations` | `setArticulation(a, true)` (replaces the same articulation) | `clearArticulations()` |
| Ornaments | `note.ornaments` | `setOrnament(o, true)` (replaces the same ornament) | assign `[]` |

**Decision**: Add mode is "call the add method for each copied item". Replace mode is "clear the ticked kind on the destination note first, then do the same". The add methods already give the spec's rule that a single-valued marking (dynamic, same-verse lyric) is superseded rather than doubled, so no extra logic is needed.

**Alternatives considered**: Compare and merge items by value (more code, and the add methods already define identity); copy `textModifiers` arrays wholesale (would paste kinds the user did not tick).

## R3. Copies must be independent

**Finding**: A modifier's constructor gives it a fresh `attrs.id`, and `SmoNoteModifierBase.deserialize(modifier.serialize())` produces a new object with its own state. This is how `SmoNote.clone` works.

**Decision**: Clone each pasted item with `SmoNoteModifierBase.deserialize(item.serialize())` so later edits to the pasted marking never affect the source (FR-014).

## R4. Chords

**Decision**: Chords go through `SmoLyric.transposeChordToKey(chord, destMeasure.transposeIndex, copiedNote.originalKey, destMeasure.keySignature)`, as the old Paste Chords did. That function already returns a new `SmoLyric`, so it needs no extra clone. (It was reworked for key-distance spelling in feature 033; the behavior needed here is unchanged.)

## R5. Which measures a paste touches (undo and refresh)

**Finding**: `pasteChords` and `paste` compute the measure range to undo and re-render from `getPasteMeasureList()`, which is based on the copied duration. By R1, a paste can reach past that span (a short copy onto long destination notes), so the old range can miss a changed measure.

**Decision**: Before changing anything, run the alignment for each staff as a dry run and take the lowest and highest destination measure over all pairs. The view undoes and re-renders exactly that range. Both runs use the same routine, so they cannot disagree. Undo is the existing grouped `_undoColumn('paste', i)` over the range, giving one undo step (FR-012).

## R6. Multi-staff copies

**Finding**: `pasteIntoScore` already walks the copied staves, keeps them in a rectangle, and calls a function once per staff with the destination selector advanced by one staff.

**Decision**: Reuse it for both the dry run and the apply, passing a function that does the work for one staff and returns the notes unchanged.

## R7. Removing Paste Chords

**Finding**: `SuiViewOperations.pasteChords`, `PasteBuffer.pasteChords` and `PasteBuffer.pasteChordNotes` are used only by the Edit menu entry. `PasteBuffer` is part of the exported library surface.

**Decision**: Remove all three and the menu entry (FR-001). Library users who called `pasteChords` need the new `pasteAttributes` with `kinds: ['chords']`; note this in the changelog. Behavior differs slightly in Replace mode: the old command left a destination note's chords alone when the copied note had none.

## R8. The dialog

**Finding**: Recent dialogs follow one pattern: a TypeScript function installs a Vue component with `InstallDialog`, the component wraps its content in `dialogContainer.vue` (which takes an `enable` prop for the confirm button), and boolean options use `toggle.vue`. `addMeasure.ts` is the closest example, and menus open dialogs by passing the menu's `view`, `tracker`, `eventSource`, `completeNotifier` and `startPromise` (see `file.ts`).

**Decision**: New `SuiPasteSpecialDialog` in `src/ui/dialogs/pasteSpecial.ts` and `pasteSpecial.vue`: six toggles, one "Replace existing" toggle (on by default, off means add), and confirm disabled until a kind is ticked. The dialog collects `{ kinds, mode }` and calls `view.pasteAttributes`.

**Alternatives considered**: Checkboxes (the code base has just moved away from checkboxes to toggles, spec 003); a separate menu entry per kind (the request asks for one dialog).

## R9. Menu availability

**Decision**: The Edit menu entry shows only when something has been copied. `PasteBuffer.hasNotes()` and `SuiViewOperations.hasCopiedNotes()` answer that, using the same `display` hook the voice entries use (FR-013).

## R10. A latent defect found on the way

**Finding**: `SmoNote.removeAllAnnotations` keeps a modifier only if `type !== 'SmoLyric' && parser !== annotation`, which drops every lyric, chord and annotation, not just annotations. It has no callers today.

**Decision**: Fix it (keep everything except `SmoLyric` annotations) as a small task, so a future caller, or this feature's Replace code if it reuses it, does not erase lyrics and chords. The new code uses its own per-kind filters (R2) and does not depend on it.

## R11. Tests

**Decision**: `tests/pasteSpecial.ts` builds a small score with two staves, puts distinctive markings of all six kinds on the first staff and different ones on the second, copies with `PasteBuffer.setSelections`, and calls `pasteAttributes`. It checks each kind alone, replace vs add, same and different rhythms (including the 4-quarters-onto-8-eighths case and the long-destination-note case), running off the end of the part, rests, a two-measure copy, a two-staff copy, chords transposed between keys, unticked kinds untouched, pitches and durations unchanged, independence of the copies, the dry-run range, and a serialization round trip.
