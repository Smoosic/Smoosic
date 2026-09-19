# Phase 0 Research: Multiple Annotations Per Note

## 1. Rendering already supports multiple annotations per note — no changes needed there

**Decision**: No changes to `src/smo/data/noteModifiers.ts`, `src/render/sui/scoreViewOperations.ts`, `src/render/vex/vxNote.ts`, or `src/render/vex/vxSystem.ts`.

**Rationale**: When `017-text-annotations` was implemented, `VxNote.createLyric()` was written to dispatch over **every** entry in `smoNote.getAnnotations()` (not just verse `0`), and `VxSystem._updateAnnotationOffsets()` likewise iterates `note.getAnnotations()` in full. `SmoNote.addAnnotation`/`getAnnotations`/`removeAnnotations` (`src/smo/data/note.ts:530-591`) already key off `(parser, verse)` pairs exactly like the lyric-verse mechanism they were modeled on. So a note with annotations at verse `0`, `1`, `2` already renders and offset-translates all three correctly today — this feature is purely about the dialog/menu layer that creates, selects among, and removes them; the data model and renderer need no changes at all.

## 2. Correction: lyrics do **not** currently renumber verses on removal — this is new logic, not reused logic

**Decision**: Build fresh "remove and renumber" logic scoped to annotations only; do not attempt to find or reuse an equivalent for lyrics (there isn't one), and do not add one for lyrics (out of scope, would risk regressing the existing lyric dialog).

**Rationale**: The feature description says to behave "like with lyric" when removing and renumbering, but inspection of `SmoNote.removeLyric` (`note.ts:570-575`) and `SuiScoreViewOperations.removeLyric` (`scoreViewOperations.ts:408-423`) shows removal only deletes the one verse's lyric — nothing shifts higher verses down. `lyric.vue`'s own delete button (`deleteCurrent`, `lyric.vue:191-202`) calls this same non-renumbering `removeLyric` and then just navigates to the next *note*, not the next *verse*. So "verse 2 of 3 becomes verse 2" is **new behavior being requested for annotations**, described by analogy to lyrics rather than as literally-existing lyric behavior. This plan implements it only for annotations, per the spec's actual scope.

## 3. Where the multi-selection loop lives: stay in the dialog component, not `SuiScoreViewOperations`

**Decision**: Implement "add" and "remove-and-renumber" as functions inside `annotation.vue` that loop `props.selections` and call the existing single-selector `addOrUpdateAnnotation`/`removeAnnotation` (`scoreViewOperations.ts`, added in `017-text-annotations`, unchanged) once per selection — the same pattern `syncModifiers()` already established for font/offset/justify edits.

**Rationale**: `017-text-annotations` already put all multi-selection looping in the Vue dialog layer (`annotation.vue`'s `syncModifiers`), keeping `SuiScoreViewOperations` methods single-selector, matching `addOrUpdateLyric`/`removeLyric`'s existing shape. Adding a new multi-selector method there would be an inconsistent, unnecessary abstraction for logic that's only ever called from one place.

## 4. Menu handler (`src/ui/menus/text.ts`) needs no changes

**Decision**: `annotationDialogMenuOption` (added in `017-text-annotations`) is left exactly as-is.

**Rationale**: It already guarantees at least one annotation exists on `selections[0].note` before opening the dialog (reusing the existing one if present, else creating and persisting an empty one to every selection). The dialog component itself can independently read `selections[0].note.getAnnotations()` to discover *every* existing annotation (not just the one the menu handler happened to pass through `parameters.modifier`) and build the index list from that. No information the menu handler has is unavailable to the dialog through `selections` alone.

## 5. Display list is always re-read from the first selected note, never hand-maintained

**Decision**: `annotation.vue` keeps a local `annotationList: Ref<SmoLyric[]>` that is *reloaded* (not incrementally patched) from `props.selections[0].note.getAnnotations()` after every mutation (initial mount, "+", and remove-and-renumber) — matching the pattern of the pre-existing `startInEditingMode`/`getAnnotations()` seeding already used in `017`.

**Rationale**: Spec Edge Cases explicitly allow the notes within one multi-note selection to have diverged annotation counts (e.g., one was edited individually since the group edit); the UI's "+"/index-selector availability is explicitly defined as driven by the *first* selected note only (spec Assumptions). Re-reading fresh from that one note after every mutation is simpler and more robust than trying to keep a separately-mutated array in sync with what may or may not be the same object references across notes — especially once annotation objects are no longer guaranteed to be one shared instance per index across an entire selection after individual edits diverge them.

## 6. Renumbering algorithm

**Decision**: Given the verse `v` being removed, for each `sel` in `props.selections` with `sel.note`:
1. Find and remove `sel.note.getAnnotations().find(a => a.verse === v)` via the existing `removeAnnotation(sel.selector, that)`.
2. Re-fetch `sel.note.getAnnotations()` (now missing `v`), and for every remaining annotation `a` with `a.verse > v`, **in ascending verse order**, do `a.verse -= 1` then `addOrUpdateAnnotation(sel.selector, a)`.

**Rationale**: `SmoNote.addAnnotation` (`note.ts:530-537`) replaces-by-`(parser, verse)`: filtering out any existing entry whose `(parser, verse)` matches the incoming object's *current* `(parser, verse)`, then appending the (same) object. Processing shifts in ascending order guarantees each target slot (`v`, then `v+1`, …) is already vacated by the previous step (or by the initial removal) before the next object claims it, so no annotation is ever transiquiring an occupied slot or briefly duplicated. This needs no new score-operation method — it's expressed entirely in terms of the two methods `017` already added.

## 7. Index display and dropdown re-render

**Decision**: Labels are 1-based (`"1"`–`"4"`) over the 0-based `verse` field, matching `lyric.vue`'s existing verse-selector convention (`verseOptions`, `lyric.vue:39-44`) exactly. Because `select.vue` copies its `selections` prop into local reactive state once at setup with no watcher for later prop changes (confirmed by reading `select.vue`), the index-selector `selectComp` instance must be given a `:key` bound to something that changes whenever the annotation count changes (e.g. `annotationList.length`), forcing Vue to remount it with fresh options — the same `:key="verse"` idiom `lyric.vue` already uses on its own verse selector (`lyric.vue:302`).

## 8. "+" control behavior

**Decision**: Activating "+" creates `new SmoLyric({ ...SmoLyric.defaults, parser: SmoLyric.parsers.annotation, text: '' })` with `verse` set to the current `annotationList.length` (the next contiguous slot), persists it immediately to every selection (mirroring how the very first annotation is already pre-persisted empty by the menu handler before editing begins, per `017`), reloads `annotationList` (research §5), sets `currentIndex` to its position, and switches `mode` to `'editing'`.

**Rationale**: Persisting immediately (rather than only on commit) means the existing empty-text-removes-annotation path (`FR-003` from `017`, reused via this feature's shared remove-and-renumber logic, research §6) already handles the case where the user opens the "+"-created slot and leaves it blank — no new abandonment-handling logic is needed.
