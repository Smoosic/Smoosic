# Phase 1 Data Model: Note Text Annotations

This feature reuses the existing `SmoLyric`/`SmoNote` data model, adding one new field to `SmoLyric` (`verticalJustify`). It introduces no new persisted classes.

## Modified Entity: `SmoLyric` (`src/smo/data/noteModifiers.ts:856`)

An annotation *is* a `SmoLyric` with `parser === SmoLyric.parsers.annotation` (`= 1`, already defined). All fields below are shared with lyrics/chords except `verticalJustify`, which is new.

| Field | Type | Notes |
|---|---|---|
| `text` | `string` | The annotation's free text; `getText()`/`setText()` are the read/write accessors, reused unchanged. `isHyphenated()`/`isDash()` always return `false` for `parser !== lyric` already, so hyphen logic never applies to annotations. |
| `verse` | `number` | Always `0` for annotations per this feature's scope (spec Assumption: exactly one annotation per note) — reuses the existing field rather than adding a new one. |
| `parser` | `number` | `SmoLyric.parsers.annotation` (`1`, already defined at `noteModifiers.ts:857-859`) |
| `fontInfo` | `FontInfo` (`family`, `size`, `weight`, `style`) | Per-annotation-instance font, committed directly (no score-wide "set annotation font" operation exists or is added — contrast `setLyricFont`/`setChordFont`, which are score-wide and out of scope here) |
| `translateX` | `number` | Horizontal pixel offset. Field already exists on `SmoLyric` but is not surfaced by any existing dialog; this feature is its first UI consumer. |
| `translateY` | `number` | Vertical pixel offset; same rendering convention as lyrics/chords (`transform: translate(translateX, -translateY)`, `vxSystem.ts`) |
| `verticalJustify` | `number` **(NEW)** | `SmoLyric.annotationVerticalJustify.TOP` (`1`, default) or `...BOTTOM` (`3`). Added to `SmoLyricParams`/`SmoLyricParamsSer`/`SmoLyric.defaults`/`SmoLyric.persistArray` so it serializes/deserializes like `translateX`/`translateY`; a legacy score with no `verticalJustify` on a saved lyric/chord/annotation deserializes to the default `1` via the existing `smoSerialize` default-fill mechanism — no migration code needed. Meaningful only when `parser === annotation` (lyrics/chords keep rendering with their own existing hardcoded justification, unaffected). |
| `attrs.id` | `string` | Unique id; used as the rendered SVG element's id (`'vf-' + attrs.id`) for offset-translation lookup, same convention as lyrics/chords |
| `deleted` | `boolean` | Set by the remove path, guards against re-adding a just-removed annotation, same as lyrics/chords |

**New static constant** on `SmoLyric`, alongside the existing `parsers`/`symbolPosition`:

```ts
static readonly annotationVerticalJustify: Record<string, number> = {
  TOP: 1, BOTTOM: 3
};
```

## Reused Entity: `SmoNote` methods (`src/smo/data/note.ts`, unmodified)

| Method | Line | Behavior |
|---|---|---|
| `addAnnotation(annotation: SmoLyric)` | 530 | Replaces any existing annotation with the same `parser`+`verse`, else appends |
| `getAnnotations(): SmoLyric[]` | 550 | Returns all `textModifiers` with `parser === annotation`, sorted by `verse` |
| `removeAnnotations(annotation: SmoLyric)` | 580 | Removes the annotation matching `verse`+`parser` |
| `removeAllAnnotations()` | 586 | Removes every annotation on the note |
| `getLyricForVerse(verse, parser)` | 598 | Generic; works for `parser = annotation` unmodified |

## Fixed Entity: `SmoLyric.getClassSelector()` (`noteModifiers.ts:990-995`)

Extended from a binary `lyric`/`chord` map to a three-way map including `annotation`, so it returns `'g.annotation-<verse>'` for annotation instances instead of incorrectly returning `'g.chord-<verse>'`.

## New Score-Operation Methods: `SuiScoreViewOperations` (`src/render/sui/scoreViewOperations.ts`)

| Method | Modeled on | Behavior |
|---|---|---|
| `addOrUpdateAnnotation(selector: SmoSelector, annotation: SmoLyric): Promise<void>` | `addOrUpdateLyric` (line 430) | Resolves `selector` to a live `SmoSelection`, calls `note.addAnnotation(annotation)` on the live tree and `note.addAnnotation(clone)` (via `SmoNoteModifierBase.deserialize(annotation.serialize())`) on the store/undo tree, queues a re-render |
| `removeAnnotation(selector: SmoSelector, annotation: SmoLyric): Promise<void>` | `removeLyric` (line 408) | Same dual-tree pattern, removing instead of adding; sets `annotation.deleted = true` |

## New Rendering Method: `VxNote.addAnnotationToNote` (`src/render/vex/vxNote.ts`)

Modeled on `addLyricAnnotationToNote` (line 159). Builds a `VF.Annotation`, sets id/font/`verticalJustification` from the `SmoLyric` instance's own `verticalJustify` field (not hardcoded), adds class `'annotation annotation-<verse>'`. Dispatched from `createLyric()` (line 203) via a new `note.getAnnotations().forEach(...)` branch alongside the existing lyric/chord branches.

## New Rendering Method: `VxSystem._updateAnnotationOffsets` (`src/render/vex/vxSystem.ts`)

Modeled on `_updateChordOffsets` (line 105). For each of the note's annotations, finds the rendered SVG element by `'vf-' + attrs.id` and applies `transform: translate(translateX, -translateY)`. Called once per note from `updateLyricOffsets()`'s existing per-note loop, alongside `_updateChordOffsets(note)`.

## Dialog-Scoped Transient State (Vue reactive refs, discarded on close)

Owned by `annotationVue.ts`/`annotation.vue`, not persisted:

| Name | Type | Purpose |
|---|---|---|
| `mode` | `Ref<'editing' \| 'dialog'>` | Single source of truth for control visibility; starts `'editing'` unconditionally |
| `selections` | `SmoSelection[]` | The full multi-note selection captured at menu-open time (`menu.view.tracker.selections`); every field change re-applies across all of these (research.md §5) |
| `currentAnnotation` | `Ref<SmoLyric>` | The one shared working copy — either `sel[0].note.getAnnotations()[0]` if present, or a freshly constructed default (`parser: annotation`, `text: ''`, `verticalJustify: TOP`) already pushed to every selection |
| `originalText` | closure-scoped `string` | Text at load time, to detect no-op edits (mirrors `lyric.vue`) |
| `annotationText` | `Ref<string>` | Bound to `annotationEditor.vue` |
| `translateX`, `translateY` | `Ref<number>` | Bound to the X/Y `numberInputApp` controls |
| `verticalJustify` | `Ref<number>` | Bound to the vertical-justify `selectComp` (two options: Top/Bottom) |
| `fontInfo` | `Ref<FontInfo>` | Bound to `fontPickerComp`, committed per-instance (not score-wide) |

## State Transitions

`DialogMode`: `'editing'` (initial) → `'dialog'` (user activates "Done Editing", committing text if changed) → `'editing'` (user activates "Edit Text", reopening the text editor pre-loaded with current text) → ... No other transitions (matches `lyric.vue`'s existing two-mode contract, minus per-note navigation).
