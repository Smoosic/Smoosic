# Contracts: Rehearsal Mark Selection, Adapter, and Dialog Interfaces

This is a client-side application with no network API. The contracts below are the internal boundaries this feature adds or touches.

## 1. Tracker modifier list: `SuiMapper._createLocalModifiersList()`

`src/render/sui/mapper.ts`, extended with one block alongside the existing `SmoVolta`/`SmoTempo` blocks:

```ts
sel.measure.getModifiersByType('SmoRehearsalMark').forEach((rm) => {
  this.localModifiers.push({ index, selection: sel, modifier: rm, box: rm.logicalBox ?? SvgBox.default });
  index += 1;
});
```

- **Postcondition**: every selected measure's rehearsal mark (at most one) appears in `localModifiers`, so it can become `getSelectedModifier()`'s result by mouse click or keyboard cycling (FR-001, FR-010).
- **Invariant**: when `rm.logicalBox` is null (e.g., before the first render), `box` falls back to `SvgBox.default`, consistent with the existing Volta/Tempo blocks. Keyboard cycling still reaches the mark; mouse hit-testing only succeeds once `logicalBox` is populated (research.md §1).

## 2. Render: `SmoRehearsalMark.logicalBox` population

`src/render/vex/vxSystem.ts`, a new per-system pass modeled on the existing Volta box pass (lines ~550-591):

- **Precondition**: the measure's `svg.staffX` and `svg.logicalBox.y` are final (set by the time the per-system pass runs, same as Volta's precondition).
- **Postcondition**: for every measure in the system's first row with a rehearsal mark, `rm.logicalBox = { x, y, width, height }` where `x = smoMeasure.svg.staffX`, `width`/`height`/`y` replicate `StaveSection.draw()`'s formula (`node_modules/vexflow_smoosic/src/stavesection.ts` lines 54-83) for `rm.symbol` at `StaveSection.TEXT_FONT`.
- **Invariant**: the box corresponds to where `stave.setSection(rm.symbol, 0)` actually draws the glyph; a mismatch would make clicks miss visibly (research.md §2).
- **Non-goal**: no change to `StaveSection` in the forked library.

## 3. View operations: `SuiScoreViewOperations`

`src/render/sui/scoreViewOperations.ts`, two new methods, modeled on `updateEnding`/`removeEnding` (lines ~1451-1480):

```ts
async updateRehearsalMark(mark: SmoRehearsalMark): Promise<void>;
async removeRehearsalMark(mark: SmoRehearsalMark): Promise<void>;
```

- **Owning-measure resolution**: find the measure whose `getRehearsalMark()?.attrs.id === mark.attrs.id` (data-model.md, research.md §3). If none is found in `score`, both methods return without error (FR: dialog may outlive a removal).
- **`updateRehearsalMark(mark)`**: undo-buffer entry ("Change Rehearsal Mark"), then replace the rehearsal mark with a copy of `mark` on the owning measure index across **every staff** of both `score` and `storeScore` (research.md §4), then `renderer.setRefresh()` and return `renderer.updatePromise()`.
- **`removeRehearsalMark(mark)`**: undo-buffer entry ("Remove Rehearsal Mark"), then `SmoOperation.removeRehearsalMark` on `score` and `storeScore` for the owning measure, then `renderer.setRefresh()` and return `renderer.updatePromise()`.
- **Unchanged**: `toggleRehearsalMark()` (spec FR-009). The two new methods are separate entry points and do not route through it.

## 4. Adapter: `SuiRehearsalMarkAdapter`

`src/ui/dialogs/rehearsalMark.ts`, modeled on `SuiVoltaAdapter` (`src/ui/dialogs/volta.ts`):

```ts
export type SmoRehearsalMarkEditableParam = 'symbol' | 'cardinality' | 'increment';

export class SuiRehearsalMarkAdapter {
  constructor(view: SuiScoreViewOperations, mark: SmoRehearsalMark);
  get symbol(): string;            set symbol(v: string);
  get cardinality(): string;       set cardinality(v: string);
  get increment(): boolean;        set increment(v: boolean);
  commit(): Promise<void>;
  cancel(): Promise<void>;         // reverts via view.updateRehearsalMark(backup) if changed
  remove(): Promise<void>;         // view.removeRehearsalMark(mark)
}
```

- **Excluded**: `position` (spec Assumptions; `measureModifiers.ts` marks it non-functional).
- **Each setter**: writes the field on `mark`, awaits `view.updateRehearsalMark(mark)` for live score update (FR-006), sets `changed = true`.

## 5. Dialog wiring: `SuiRehearsalMarkDialogVue`

`src/ui/dialogs/rehearsalMarkVue.ts`, modeled on `pedalMarkingVue.ts`:

```ts
export const SuiRehearsalMarkDialogVue = (parameters: SuiDialogParams): void;
```

- Constructs `SuiRehearsalMarkAdapter(parameters.view, parameters.modifier)`.
- Passes `symbol`, `cardinality`, `increment` plus an `updateFieldCb` into the Vue component's props.
- Wires `commitCb`/`cancelCb`/`removeCb` to the adapter, and calls `InstallDialog` with the `rehearsalMark.vue` component.

## 6. Dispatch: `SuiModifierDialogFactory.createModifierDialog`

`src/ui/dialogs/factory.ts`:

- `ModifiersWithDialogNames` gains `'SmoRehearsalMark'`, so `isModifierWithDialog()` returns true for it.
- New branch, placed beside the `SmoVolta` branch:

```ts
} else if (ctor === 'SmoRehearsalMark') {
  SuiRehearsalMarkDialogVue(parameters);
  return null;
}
```

## 7. Vue component: `rehearsalMark.vue`

`src/ui/components/dialogs/rehearsalMark.vue`, modeled on `pedalMarking.vue`:

- **Props**: `domId`, `label` (`'Rehearsal Mark Properties'`), `initialPosition`, `symbol`, `cardinality`, `increment`, `updateFieldCb(param, value)`.
- **Controls**: a text field for `symbol`, a select for `cardinality` (capitals / lowercase / numbers), a checkbox for `increment`. Each change calls `updateFieldCb` immediately (live update, FR-006).
- **No position control** (spec Assumptions).
- **Buttons**: the dialog container's standard Commit / Cancel / Remove, provided by `dialogContainer.vue`.
