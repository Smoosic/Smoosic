# Phase 1 Data Model: Multiple Annotations Per Note

This feature introduces no new persisted fields or classes. It reuses `SmoLyric`'s existing `verse` field (already present, already used identically by lyrics and chords) as the "index" the UI exposes, and the existing `017-text-annotations` score-operation methods (`addOrUpdateAnnotation`, `removeAnnotation`).

## Reused Entity: `SmoLyric.verse` (`src/smo/data/noteModifiers.ts:914`)

No change. `verse: number` (default `0`) already distinguishes multiple `SmoLyric` instances with the same `parser` on one note (`SmoNote.getLyricForVerse(verse, parser)`, `note.ts:598`). This feature's "Annotation Index" (spec Key Entities) *is* this field, restricted to annotations (`parser === SmoLyric.parsers.annotation`) and to the range `0`-`3` (UI-labeled `"1"`-`"4"`), matching the pre-existing 4-verse convention already used by the lyric dialog's verse selector (`lyric.vue:39-44`).

## Reused Entity: `SmoNote` methods (unmodified)

| Method | Line | Role in this feature |
|---|---|---|
| `getAnnotations(): SmoLyric[]` | `note.ts:550` | Sorted-by-`verse` source of truth for "how many annotations does this note have, and what are they" — read fresh after every mutation (research.md §5) |
| `addAnnotation(annotation: SmoLyric)` | `note.ts:530` | Replace-by-`(parser, verse)` semantics, relied on directly by the renumbering algorithm (research.md §6) |
| `removeAnnotations(annotation: SmoLyric)` | `note.ts:580` | Removes one `(parser, verse)` slot |

## Reused Entity: `SuiScoreViewOperations` methods (unmodified, from `017-text-annotations`)

| Method | Role in this feature |
|---|---|
| `addOrUpdateAnnotation(selector, annotation)` | Called once per affected selection, both for "+" (persisting a brand-new verse) and for renumbering (persisting each shifted annotation's new `verse` value) |
| `removeAnnotation(selector, annotation)` | Called once per affected selection to delete the annotation at the removed index |

## Dialog-Scoped Transient State (Vue reactive refs, `annotation.vue`, discarded on close)

Replaces the single `annotation: SmoLyric` prop/working-copy from `017` with a list-aware model:

| Name | Type | Purpose |
|---|---|---|
| `annotationList` | `Ref<SmoLyric[]>` | The current note's full set of annotations, sorted by `verse`; reloaded from `props.selections[0].note.getAnnotations()` after every mutation (research.md §5), never hand-patched |
| `currentIndex` | `Ref<number>` | 0-based position within `annotationList` currently shown/edited; UI labels it `currentIndex + 1` |
| `currentAnnotation` | `computed(() => annotationList.value[currentIndex.value])` | The working object for the presently-displayed annotation; all existing per-field setters (`onXChange`, `onYChange`, `onJustifyChange`, `onFontChange`, `commitIfChanged`) now read/mutate this instead of a fixed `props.annotation` |
| `canAddMore` | `computed(() => annotationList.value.length < 4)` | Drives the "+" control's visibility (FR-002, FR-004) |
| `showIndexSelector` | `computed(() => annotationList.value.length >= 2)` | Drives the index dropdown's visibility (FR-005, FR-007) |

All other existing dialog-scoped state (`mode`, `originalText`, `annotationText`, `translateX`, `translateY`, `verticalJustify`, `fontInfo`) is unchanged in type/role from `017`, except that `loadCurrent()` (new, replaces the one-time top-level initialization) now (re)populates them from `currentAnnotation.value` whenever `currentIndex` changes or `annotationList` is reloaded.

## New Props Shape: `annotation.vue` / `SuiAnnotationDialogVue`

| Old (`017`) | New (`018`) |
|---|---|
| `annotation: SmoLyric` | `annotations: SmoLyric[]` (the note's full existing set, possibly length 1), `initialIndex: number` (position of the one the menu handler already resolved/created) |

`startInEditingMode` is unchanged in meaning (`annotations[initialIndex].getText().length === 0`) but is now computed against the resolved initial entry rather than a single fixed prop.

## Operations (new, `annotation.vue`-scoped)

### `addAnnotation()` (the "+" handler)

1. Guard: no-op if `!canAddMore.value`.
2. Build `fresh = new SmoLyric({ ...SmoLyric.defaults, parser: SmoLyric.parsers.annotation, text: '' })`, then `fresh.verse = annotationList.value.length`.
3. For each `sel` of `props.selections` with `sel.note`: `await props.view.addOrUpdateAnnotation(sel.selector, fresh)`.
4. Reload `annotationList` from `props.selections[0].note.getAnnotations()`; set `currentIndex` to `fresh`'s position; call `loadCurrent()`; set `mode.value = 'editing'`.

### `removeAndRenumber(verseIndex: number)` (shared by the existing "Delete Annotation" button and `commitIfChanged`'s empty-text path)

1. For each `sel` of `props.selections` with `sel.note`:
   a. `const toRemove = sel.note.getAnnotations().find(a => a.verse === verseIndex)`; if found, `await props.view.removeAnnotation(sel.selector, toRemove)`.
   b. `const shifted = sel.note.getAnnotations().filter(a => a.verse > verseIndex)` (already ascending, per `getAnnotations()`'s sort); for each `a` in that order: `a.verse -= 1; await props.view.addOrUpdateAnnotation(sel.selector, a)`.
2. Reload `annotationList` from `props.selections[0].note.getAnnotations()`.
3. Set `currentIndex = Math.min(verseIndex, annotationList.value.length - 1)` clamped to `0` (handles removing the last remaining annotation, `annotationList.value.length === 0`).
4. If `annotationList.value.length > 0`, call `loadCurrent()`; otherwise reset the displayed fields to defaults (nothing to load).
5. Set `mode.value = 'dialog'`.

## State Transitions

Unchanged from `017` (`DialogMode`: `'editing' ⇄ 'dialog'`), except entry into `'editing'` mode can now also be triggered by `addAnnotation()` (for the newly-created slot), and `currentIndex` can change independently while in `'dialog'` mode via the index selector (no mode transition).
