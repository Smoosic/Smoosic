# Contracts: Menu, Score-Operation, Component, and Rendering Interfaces

This project is a client-side library with no network API. The "contracts" for this feature are the TypeScript interfaces at each internal boundary the feature crosses: the Text menu handler, the new score-mutation methods, the dialog creation function and its Vue components, and the rendering-layer functions. These mirror the shapes already established by the lyric (`010-vue-lyric-dialog`) and dynamics (menu multi-selection) features.

## 1. Menu entry: `annotationDialogMenuOption`

`src/ui/menus/text.ts`, added to `SuiTextMenuOptions`

```ts
const annotationDialogMenuOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => { /* see research.md §5 */ },
  display: (menu: SuiMenuBase) => true,
  menuChoice: { icon: string, text: 'Annotation', value: 'annotationMenu' }
}
```

- **Input**: `menu.view.tracker.selections: SmoSelection[]` — the current score selection at invocation time (may be one or many notes).
- **Behavior contract** (FR-001–FR-003):
  1. No-ops if `selections` is empty or `selections[0].note` is null (Edge Case: nothing selected).
  2. If `selections[0].note` already has an annotation (`getAnnotations().length > 0`), uses it as-is — no write yet, no propagation to other selections' existing annotations (matches `dynamicsDialogMenuOption`'s existing behavior for an already-annotated first note).
  3. Otherwise, constructs a new `SmoLyric` (`parser: annotation`, `text: ''`, default `verticalJustify`) and calls `view.addOrUpdateAnnotation(selector, annotation)` once per selection, so every selected note starts with the same shared annotation instance.
  4. Opens `SuiAnnotationDialogVue` with `modifier: annotation` and the standard `SuiDialogParams` fields (`completeNotifier`, `view`, `eventSource`, `id: 'annotationDialog'`, `ctor: 'SuiAnnotationDialog'`, `tracker: menu.view.tracker`, `startPromise: menu.closePromise`).

## 2. Score-operation methods: `SuiScoreViewOperations`

`src/render/sui/scoreViewOperations.ts`

```ts
async addOrUpdateAnnotation(selector: SmoSelector, annotation: SmoLyric): Promise<void>
async removeAnnotation(selector: SmoSelector, annotation: SmoLyric): Promise<void>
```

- **Contract**: identical shape to `addOrUpdateLyric`/`removeLyric` (data-model.md). Callers (the menu handler and the dialog's per-field sync) invoke these once per affected selection; each call is independently idempotent (re-adding the same annotation to the same note is a no-op replace, matching `addAnnotation`'s replace-by-`verse`+`parser` semantics).

## 3. Dialog creation function: `SuiAnnotationDialogVue`

`src/ui/dialogs/annotationVue.ts`

```ts
export const SuiAnnotationDialogVue = (parameters: SuiDialogParams) => void
```

- **Input**: `SuiDialogParams`, with `parameters.modifier` set to the shared `SmoLyric` annotation instance (unlike `SuiLyricDialogVue`, which derives its working copy from `tracker.selections[0]` alone — this dialog needs the *already-created-and-possibly-multi-note-attached* instance the menu handler built, plus the full `tracker.selections` array for propagation).
- **Behavior contract** (FR-002–FR-007):
  1. Captures `view.tracker.selections` (all of them, not just `[0]`) at open time.
  2. Initializes `mode` to `'editing'` if the annotation's text is empty (new annotation — FR-002), or `'dialog'` directly if it already has text (FR-007: reopening an existing annotation skips straight to the non-editing view).
  3. `commitCb`/`cancelCb` both call the same `finish()` (commit any in-progress text edit; no separate revert state — matches `lyricVue.ts`'s rationale, since edits already write through incrementally).
  4. Mounts `annotation.vue` via `InstallDialog`.
- **Output**: void (side effect: mounts into `replaceVueRoot(modalContainerId)`).

## 4. Top-level component: `annotation.vue`

`src/ui/components/dialogs/annotation.vue`

```ts
interface Props {
  domId: string;
  label: string;                      // 'Annotation'
  view: SuiScoreViewOperations;
  selections: SmoSelection[];         // all notes this annotation applies to
  annotation: SmoLyric;               // the shared working instance
  startInEditingMode: boolean;        // true for a brand-new annotation, false when reopening an existing one
  commitCb: () => Promise<void>;
  cancelCb: () => Promise<void>;
}
```

- **Visibility contract** (mirrors `lyric.vue`'s `mode`-gated template, data-model.md `DialogMode`):
  - `mode === 'editing'`: renders `annotationEditor.vue` plus a single "Done Editing" control. No previous/next/delete-and-advance controls (spec: no note-to-note navigation), but a "Delete Annotation" control remains (FR-003's empty-text-removes-annotation path also needs an explicit removal affordance for the reopen case, matching lyric's delete button but without the auto-advance side effect).
  - `mode === 'dialog'`: renders X-offset (`numberInputApp`), Y-offset (`numberInputApp`), vertical-justify (`selectComp`, two options), `fontPickerComp`, and an "Edit Text" control.
- **Commit semantics**: every setter (text-editing-session end, X/Y change, vertical-justify change, font change) calls `syncModifiers()` (research.md §5): mutate `props.annotation`'s field, then loop `props.selections` calling `view.addOrUpdateAnnotation(sel.selector, props.annotation)` for each. Empty text at "Done Editing" time calls `view.removeAnnotation` per selection instead (FR-003).

## 5. `annotationEditor.vue` — embeddable plain-text editor for one annotation

`src/ui/components/dialogs/annotationEditor.vue`

```ts
interface Props {
  domId: string;
  text: string;
  fontInfo: FontInfo;
}
interface Expose {
  getText(): string;
}
```

Emits: `preview: []` (debounced, ~400ms — same live-score-update UX as `lyricEditor.vue`'s `preview` emit). **No** `advance` emit (no note-to-note navigation exists to advance to — this is the one behavioral difference from `lyricEditor.vue`, per research.md §6). `Enter`/`Shift-Enter` remain suppressed (single-line text, matching `SmoLyric.text`'s existing convention).

## 6. Rendering: `VxNote.addAnnotationToNote`

`src/render/vex/vxNote.ts`

```ts
addAnnotationToNote(vexNote: Note, annotation: SmoLyric): void
```

- **Contract**: given a note-with-no-text guard (mirrors `addLyricAnnotationToNote`'s `if (!text.length) return;`, minus the hyphen special-case, which doesn't apply to annotations), builds a `VF.Annotation`, sets `id`, `font` (family/size/weight from `annotation.fontInfo`), `verticalJustification` (from `annotation.verticalJustify`, not hardcoded), adds class `'annotation annotation-' + annotation.verse`. Called from `createLyric()` for every entry in `smoNote.getAnnotations()`.

## 7. Rendering: `VxSystem._updateAnnotationOffsets`

`src/render/vex/vxSystem.ts`

```ts
_updateAnnotationOffsets(note: SmoNote): void
```

- **Contract**: for each `note.getAnnotations()` entry, finds `this.context.svg.getElementById('vf-' + annotation.attrs.id)` and sets `transform="translate(<translateX> <-translateY>)"` if found. Called once per note from `updateLyricOffsets()`'s existing per-note loop, alongside `_updateChordOffsets(note)`. No return value; a missing DOM element (not yet rendered) is a silent no-op, matching `_updateChordOffsets`'s existing guard.
