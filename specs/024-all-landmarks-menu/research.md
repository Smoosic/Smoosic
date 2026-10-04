# Research: Add All Landmarks Menu Option

## 1. How does a menu option actually "close the menu" today?

**Decision**: Do nothing special — simply don't call `SuiTextBlockDialogVue` (or any other dialog-opening function) at the end of the new option's handler.

**Rationale**: Tracing `src/ui/components/menus/menu.vue`'s `selectItem()`: for any option whose `subMenu` is empty/undefined (a "leaf" option, which "All" is), it does `await option.handler(props.menuStructure); props.menuStructure.complete();` — unconditionally, every time, for every leaf option, regardless of what the handler did. The same pattern exists in `SuiConfiguredMenu.selection()` (`src/ui/menus/menu.ts`) for the non-nested-submenu rendering path. `complete()` triggers the `'menuDismiss'` jQuery event that actually tears down the menu's own UI. The *reason* selecting an existing single landmark today appears to "leave a dialog open" is that `SuiTextBlockDialogVue(...)` opens an entirely separate modal/component (via `InstallDialog`), independent of the menu's own lifecycle — the menu still closes immediately underneath it. So FR-004/FR-005 ("just close the menu, don't open another dialog") require zero new control-flow: they fall out automatically from simply never calling `SuiTextBlockDialogVue`.

**Alternatives considered**:
- *Explicitly call `menu.complete()` at the end of the new handler*: rejected as redundant/dead code — `selectItem()`/`selection()` already call it unconditionally right after the handler returns; calling it a second time from inside the handler would be a harmless no-op at best and a confusing duplicate responsibility at worst.

## 2. What counts as "available" for the bulk path?

**Decision**: Reuse `sourceTextDefined(purpose, view)` directly as the "available" gate for "All" — not the full `display` predicate each individual `landmarkOption` uses.

**Rationale**: Each individual option's `display` is `sourceTextDefined(purpose, view) || (purpose !== PART && findLandmark(purpose, view) !== undefined)`. The second disjunct exists so that an *already-existing* landmark's menu entry stays visible/clickable (to reopen its dialog) even if its underlying source text was later cleared — that concern is about keeping a menu *entry* visible, which doesn't apply here, since "All" isn't rendering a visible list of per-purpose entries at all. For "All", the two concerns ("does it already exist" and "is it available to create") are already handled as two separate, explicit steps (spec FR-002/FR-003: skip if it exists; create only if available). So the bulk handler's gate is simply: `if (findLandmark(purpose, view)) { skip; } else if (sourceTextDefined(purpose, view)) { create; }` — using the exact same `sourceTextDefined` function every individual option already relies on, so "All" can never disagree with what an individual selection would have done for that same purpose.

**Alternatives considered**:
- *Reuse the full `display` predicate as-is*: rejected — its "already exists" disjunct would be vacuously true for exactly the purposes "All" is about to skip anyway (they already exist), so it adds nothing; keeping the bulk-path condition to just `sourceTextDefined` is simpler and more direct about what it's actually deciding ("is there something to create this from").

## 3. Creation order and column-stacking consistency

**Decision**: Iterate the landmark purposes in the exact same order they already appear in the `landmarkOptions` array (Title, Subtitle, Composer, Copyright, Date, Page Number, Part), creating and adding each missing-and-available one via `view.addTextGroup` before moving to the next.

**Rationale**: `findAboveLandmark(purpose, view)` (used by every individual creation today) looks for the *already-added* member of the same stacking column (Title/Subtitle; Composer/Page Number/Part) with the lowest rendered bottom edge, so a new landmark stacks directly below whatever already exists in its column at the moment it's created. Processing purposes in the existing list order, and calling `view.addTextGroup` for each one immediately (rather than batching all seven `createLandmarkText` calls before adding any of them), means a later purpose in the same column (e.g. Subtitle, or Page Number/Part) sees the earlier one already added and correctly stacks beneath it — producing the identical layout to a user manually selecting each option in that same order, one at a time, satisfying spec FR-006.

**Alternatives considered**:
- *Compute all seven `createLandmarkText` results first, then add them all at once*: rejected — `findAboveLandmark` would see none of the sibling landmarks created in the same "All" pass yet (since none would be added to the view until after all are computed), so same-column pairs (e.g. Title+Subtitle) would both compute their position relative to whatever existed *before* "All" was invoked, rather than stacking under each other — producing overlapping text instead of the expected stacked layout.

## 4. Repeated `view.addTextGroup` calls — performance

**Decision**: Accept up to seven sequential `await view.addTextGroup(group)` calls (one per missing, available purpose) as-is, with no batching/combining into a single render pass.

**Rationale**: `addTextGroup` already performs one full `renderer.rerenderTextGroups()` per call — the same cost already paid once per individual landmark selection today. "All" is a deliberate, infrequent, user-initiated bulk setup action (not a hot path), bounded to at most seven calls (the fixed number of landmark purposes), so the aggregate cost is small and well within what the existing single-item path already demonstrates is acceptable.

**Alternatives considered**:
- *Add a new "add multiple text groups, render once" batch method*: rejected as unnecessary scope/risk for a bounded, infrequent, seven-item-max operation — would duplicate `addTextGroup`'s undo-buffer and part-exposure handling for a performance gain that doesn't matter at this scale, and would be new surface area in `SuiScoreViewOperations` that only this one feature exercises.
