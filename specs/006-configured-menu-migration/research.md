# Research: Configured Menu Migration for Language, Part Selection, Score, and Staff Modifier Menus

## R1: Conversion pattern to follow

**Decision**: For each of the four files, replace `static defaults: MenuDefinition` + `getDefinition() { return X.defaults; }` with a module-level `const <name>MenuOptions: SuiConfiguredMenuOption[] = [...]` array (one constant per option, collected into the array, mirroring `note.ts`'s `SuiNoteMenuOptions` / `beams.ts`'s `SuiBeamMenuOptions`), and change the class to:

```ts
export class Sui<Name>Menu extends SuiConfiguredMenu {
  constructor(params: SuiMenuParams) {
    super(params, '<Label>', <name>MenuOptions);
  }
}
```

Each option's `handler: SuiMenuHandler` is `async (menu: SuiMenuBase) => { /* body copied from the current selection()/exec* branch, using menu.view/menu.tracker/menu.score/... in place of this.view/this.tracker/this.score */ }`. Each option's `menuChoice` is the existing `MenuChoiceDefinition` object (icon/text/value) copied verbatim from the current static list.

**Rationale**: This is exactly the pattern the feature request points to ("Follow the pattern in note.ts menu"), already proven twice in the same directory (`note.ts`, `beams.ts`), and requires no change to `SuiConfiguredMenu` itself.

**Alternatives considered**: Keeping the static `defaults`/`getDefinition()` shape and only changing the `extends` clause was considered (minimal diff), but rejected — `SuiConfiguredMenu`'s constructor requires an `options: SuiConfiguredMenuOption[]` array (each with its own `handler`/`display`) to build `menuOptions`, and its `selection()` dispatches by looking up the clicked value in `this.menuOptions`, not by a `getDefinition()` override; keeping only `getDefinition()` would leave `selection()` unable to find a matching option and silently fall through to `complete()` with no action taken.

## R2: Score Settings' view-state-conditional options

**Decision**: The four options with conditional visibility today (Page Layout, Global Layout, System Groups, View All) get non-trivial `display` functions instead of `() => true`, evaluated against the `menu: SuiMenuBase` argument's `view`/`score` properties (available on every `SuiMenuBase`, so no cast beyond what `beams.ts`'s existing conditional options already do):

```ts
display: (menu: SuiMenuBase) => menu.view.isPartExposed() === false   // pageLayout, globalLayout, staffGroups
display: (menu: SuiMenuBase) => menu.score.staves.length < menu.view.storeScore.staves.length   // viewAll
```

The remaining five options (Smoosic Preferences, Score Fonts, Score Info, Transpose Score, Cancel) get `display: (menu: SuiMenuBase) => true`, and the class's current `preAttach()` override (the shared `menuItems.forEach` filter keyed on `item.value`) is deleted entirely — `SuiConfiguredMenu.preAttach()` (inherited, not overridden) already does the equivalent filtering generically, once each option carries its own condition.

**Rationale**: This directly satisfies spec FR-005 and is exactly the shape `beams.ts`'s `unbeamSelectionsMenuOption`/`beamSelectionsMenuOption`/`toggleBeamDirectionMenuOption` already use for their own state-dependent `display` functions — a real, existing non-`true` precedent in this same directory, not a new pattern being invented for this migration.

**Alternatives considered**: Keeping `SuiScoreMenu.preAttach()`'s shared filter and only overriding it to post-process `this.menuItems` after calling `super.preAttach()` was considered, to minimize the diff. Rejected — it would leave the four conditions living in a second, separate place from the option definitions themselves, working against the spec's stated goal (User Story 2) of localizing each option's visibility rule to that option.

## R3: Part Selection's dynamic option list

**Decision**: `SuiPartSelectionMenu` overrides `preAttach()` to rebuild its dynamic part-derived options each time the menu opens, then delegates to the inherited filtering/customization behavior:

```ts
preAttach() {
  this.partMap = this.view.getPartMap();
  const cancel = this.menuOptions.find((op) => op.menuChoice.value === 'cancel')!;
  const rebuilt: SuiConfiguredMenuOption[] = [];
  if (this.score.staves.length < this.view.storeScore.staves.length) {
    rebuilt.push(viewAllOption); // handler: menu.view.viewAll(); display: () => true
  }
  this.partMap.keys.forEach((key) => {
    rebuilt.push(partOption(key, this.partMap.partMap[key])); // handler: menu.view.exposePart(...); display: () => true
  });
  rebuilt.push(cancel);
  this.menuOptions = rebuilt;
  super.preAttach();
}
```

`viewAllOption` and the per-part option factory are plain functions/constants in partSelection.ts; `partOption(key, info)` returns a fresh `SuiConfiguredMenuOption` each call so its `menuChoice.text`/`value` reflect that part's current name/key, and its `handler` calls `menu.view.exposePart(menu.view.storeScore.staves[info.associatedStaff])` (the current `selectPart(val)` body for `val >= 0`). The pulled-forward `cancel` option is the same object instance `SuiConfiguredMenu`'s constructor auto-appended when the menu was first constructed (an empty/base options array is passed to `super()`), so no second, locally-defined cancel choice is ever created (spec FR-007) — the constructor creates exactly one, and `preAttach()` reuses that same instance on every rebuild.

**Rationale**: The current `SuiPartSelectionMenu.preAttach()` already rebuilds `this.menuItems` directly from `this.view.getPartMap()` on every open (parts can be added/removed between menu opens); `SuiConfiguredMenu.preAttach()` only knows how to filter an already-populated `this.menuOptions` by each option's `display()`, it doesn't itself regenerate options from external state. Rebuilding `this.menuOptions` first and then calling `super.preAttach()` reuses the inherited filter/customization logic (`SuiConfiguredMenu.menuCustomizations`) for free while still supporting a genuinely dynamic list, and keeps every rebuilt option's `display` at the required `() => true` (the per-open conditionality — e.g. whether "View All" appears at all — is expressed by whether an option is included in the rebuild, not by a non-trivial `display`, consistent with spec FR-006's phrasing that the *list* is rebuilt dynamically).

**Alternatives considered**: Giving `viewAllOption` a non-`true` `display` (e.g. `(menu) => menu.score.staves.length < menu.view.storeScore.staves.length`) and including it unconditionally in a static `SuiPartSelectionMenuOptions` array, then rebuilding only the per-part entries in `preAttach()`, was considered. Rejected as more complex for no benefit: the per-part entries still need a full rebuild each open regardless (parts themselves are dynamic, not just their count), so conditionally including "View All" in that same rebuild pass is simpler than mixing a static `display`-gated option with a dynamically-rebuilt list in the same array.

## R4: Preserving async/await structure in Lines-menu handlers

**Decision**: The Pedal Marking handler keeps its exact current body — including `await this.view.removeStaffModifier(overlaps[0])` before `await addOrReplacePedalMarking(...)` — as a single `async (menu: SuiMenuBase) => { ... }` function using `menu.` in place of `this.`. The Reset Slurs handler keeps returning only after `view.refreshViewport()` resolves:

```ts
handler: async (menu: SuiMenuBase) => {
  await menu.view.refreshViewport();
}
```

Because `SuiConfiguredMenu.selection()` already does `await option.handler(this); this.complete();`, this reproduces today's exact ordering (refresh completes, *then* `complete()`/menu-dismiss fires) with no extra code needed at the call site.

**Rationale**: Constitution guidance calls out avoiding race conditions via judicious async/await; Reset Slurs' current implementation deliberately delays `this.complete()` until the viewport refresh finishes (rather than calling `complete()` immediately and letting the refresh run in the background), and Pedal Marking's overlap-resolution must remove the old modifier before adding the merged one. Both orderings must survive the refactor unchanged.

**Alternatives considered**: None seriously — `SuiConfiguredMenu.selection()`'s existing `await option.handler(this)` already provides exactly the sequencing today's code relies on, so no alternative design was needed.

## R5: Dropping now-redundant overrides

**Decision**: Remove each of the four classes' explicit `keydown() {}` override (a no-op identical to `SuiMenuBase`'s own default, so removing it changes nothing) and their `static defaults` / `getDefinition()` pair (superseded by R1). `SuiLanguageMenu`'s `static get ctor()` accessor is also removed — it is unused (nothing in the codebase reads `SuiLanguageMenu.ctor`; the menu's `ctor` string comes from `SuiMenuParams.ctor`, set by `SuiMenuManager.createMenu`) and neither `note.ts` nor `beams.ts` defines an equivalent.

**Rationale**: Matches the reference pattern exactly — neither `SuiNoteMenu` nor `SuiBeamMenu` overrides `keydown()`, defines a `static defaults`, or defines a `static get ctor()`; keeping them would leave dead/redundant code inconsistent with "follow the pattern in note.ts."

**Alternatives considered**: Leaving `keydown() {}` in place for explicitness was considered, since it's harmless. Rejected in favor of matching the established pattern precisely, since the spec's Input explicitly calls for following note.ts.

## R6: No call-site or translation-registration changes needed

**Decision**: No edits to `src/ui/menus/manager.ts` or `src/ui/i18n/language.ts`. `SuiMenuManager.createMenu` already does `new Sui<Name>Menu(params)` for all four menus today, identical regardless of base class (`SuiMenuParams` and the constructor signature `(params: SuiMenuParams)` are unchanged by this migration — `SuiConfiguredMenu`'s two extra constructor parameters, `label` and `options`, are supplied by each subclass's own constructor, not by the caller). No new `MenuTranslations.push(suiConfiguredMenuTranslate(...))` entry is added for any of the four menus, since this is inconsistently done even for the two existing `SuiConfiguredMenu` menus today — `menuTranslationsInit()` (`manager.ts`) registers only `SuiBeamMenuOptions`; `SuiNoteMenu`/`SuiNoteMenuOptions` (the migration's stated reference pattern) registers nothing — and `SmoTranslator.setLanguage` itself is a known-stub (`console.warn('Ouch, need to implement languages')`), confirming this registration is not load-bearing for current menu functionality.

**Rationale**: Directly satisfies spec FR-009 (no call-site changes) and keeps this migration's scope to exactly the four named files, per the feature request.

**Alternatives considered**: Adding `MenuTranslations.push(...)` entries for all four migrated menus, for consistency with `SuiBeamMenu`. Rejected as out of scope — it's an inconsistency that predates this migration (affecting `SuiNoteMenu` too), not something introduced or worsened by it, and the spec's Assumptions/FRs don't ask for it.
