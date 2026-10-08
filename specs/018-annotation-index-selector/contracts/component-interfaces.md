# Contracts: Updated Dialog Interfaces

This project is a client-side library with no network API. The only interface boundary this feature changes is the `SuiAnnotationDialogVue` creation function and its `annotation.vue` component (both added in `017-text-annotations`). `src/ui/menus/text.ts`, `src/render/sui/scoreViewOperations.ts`, `src/render/vex/vxNote.ts`, and `src/render/vex/vxSystem.ts` are unchanged (research.md §1, §4).

## 1. Creation function: `SuiAnnotationDialogVue` (`src/ui/dialogs/annotationVue.ts`)

```ts
export const SuiAnnotationDialogVue = (parameters: SuiDialogParams) => void
```

- **Input**: unchanged `SuiDialogParams`; `parameters.modifier` is still the single `SmoLyric` the Text-menu handler already resolved or created (unchanged, research.md §4).
- **Behavior contract (new)**:
  1. Reads `const firstNote = view.tracker.selections[0]?.note`.
  2. `const annotations: SmoLyric[] = firstNote ? (firstNote.getAnnotations() as SmoLyric[]) : [parameters.modifier as SmoLyric]` — the full existing set, not just `parameters.modifier`.
  3. `const initialIndex = Math.max(0, annotations.findIndex((a) => a.verse === (parameters.modifier as SmoLyric).verse))`.
  4. `const startInEditingMode = annotations[initialIndex].getText().length === 0` (same rule as `017`, now evaluated against the resolved entry).
  5. `appParams` gains `annotations`/`initialIndex` in place of the old single `annotation` field; everything else (`domId`, `label`, `view`, `selections`) is unchanged.

## 2. Top-level component: `annotation.vue` (`src/ui/components/dialogs/annotation.vue`)

```ts
interface Props {
  domId: string;
  label: string;
  view: SuiScoreViewOperations;
  selections: SmoSelection[];
  annotations: SmoLyric[];     // CHANGED from `annotation: SmoLyric`
  initialIndex: number;        // NEW
  startInEditingMode: boolean;
  commitCb: () => Promise<void>;
  cancelCb: () => Promise<void>;
}
```

- **Visibility contract (extends `017`'s `mode`-gated template, data-model.md)**:
  - `mode === 'dialog'` additionally shows:
    - A "+" control, visible iff `canAddMore` (`annotationList.length < 4`) — FR-002/FR-004.
    - An index `selectComp`, visible iff `showIndexSelector` (`annotationList.length >= 2`), listing `"1"`..`"N"` labels over each entry's `verse` — FR-005/FR-007. Given `select.vue`'s no-prop-watcher behavior (research.md §7), this `selectComp` instance carries `:key="annotationList.length"` so it remounts with fresh options whenever the count changes.
  - `mode === 'editing'`'s existing "Delete Annotation" control now triggers the shared `removeAndRenumber(currentAnnotation.verse)` (data-model.md Operations) instead of a plain remove-with-no-renumber.
- **New operations** (data-model.md Operations): `addAnnotation()` (the "+" handler), `removeAndRenumber(verseIndex: number)` (replaces `017`'s `deleteCurrent` body and is also called from `commitIfChanged`'s empty-text branch instead of that branch's old plain per-selection `removeAnnotation` loop), `loadCurrent()` (replaces `017`'s one-time top-level field initialization; called on mount and whenever `currentIndex`/`annotationList` changes).
- **Unchanged**: `syncModifiers()`'s shape (loop `props.selections`, call `addOrUpdateAnnotation`) — it now reads `currentAnnotation.value` (the computed) instead of the old fixed `props.annotation`, but its body and call sites (`onXChange`/`onYChange`/`onJustifyChange`/`onFontChange`/the non-empty branch of `commitIfChanged`) are otherwise identical to `017`.

## 3. `src/ui/menus/text.ts` — unchanged

No changes. `annotationDialogMenuOption` still creates-or-reuses a single annotation and passes it as `parameters.modifier`; the dialog now independently discovers the full set (§1 above).

## 4. `src/render/vex/vxNote.ts`, `src/render/vex/vxSystem.ts`, `src/render/sui/scoreViewOperations.ts`, `src/smo/data/noteModifiers.ts` — unchanged

Already correct for an arbitrary number of annotations per note (research.md §1).
