# Contract: "All" Landmark Menu Option

This project is a client-side library/application with no network API. The "contract" for this feature is the shape and behavior of the one new `SuiConfiguredMenuOption` value it adds, and the invariant it must preserve relative to the existing per-purpose options it sits beside.

## Shape

`src/ui/menus/text.ts`, appended to the existing `landmarkOptions: SuiConfiguredMenuOption[]` array:

```ts
const allLandmarksOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    // for each (purpose, label, icon) already listed in landmarkOptions' construction, in order:
    //   if findLandmark(purpose, menu.view) exists -> skip
    //   else if sourceTextDefined(purpose, menu.view) ->
    //     build via resolveLandmarkText / resolveLandmarkMeasureText / findAboveLandmark /
    //     SmoTextGroup.createLandmarkText, then `await menu.view.addTextGroup(group)`
    //   else -> skip
    // never calls SuiTextBlockDialogVue
  },
  display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: 'mi title',
    text: 'All',
    value: 'landmark-All'
  }
};
```

## Preconditions

- None beyond an open landmark submenu — "All" is always selectable (FR-007), regardless of how many landmarks already exist.

## Postconditions

- **FR-002/FR-003**: Every purpose that was missing *and* available (`sourceTextDefined`) before the call now has exactly one landmark; every purpose that already existed before the call is byte-for-byte untouched (not re-added, not re-positioned, not reopened).
- **FR-006**: Each newly-created landmark's position matches what `landmarkOption`'s own handler would have produced for that purpose, given the same pre-existing state plus whatever earlier purposes this same "All" invocation already added (research.md §3).
- **FR-004/FR-005**: No dialog is opened, whether zero, some, or all seven purposes were created. The menu closes via the existing, unmodified `selection()`/`selectItem()` leaf-option flow (research.md §1) — this option introduces no new closing logic.

## Invariant with the existing per-purpose options

For every purpose `p`: calling "All" must never produce a different result for `p` than the user manually selecting `landmarkOption(p, ...)` would have, *given the same score state at the moment `p` is reached in the loop*. Concretely:
- Same "does it exist" check (`findLandmark`).
- Same "is it available" check (`sourceTextDefined`, research.md §2).
- Same creation call sequence (`resolveLandmarkText` → `resolveLandmarkMeasureText` → `findAboveLandmark` → `createLandmarkText` → `addTextGroup`).
- The only difference is the trailing step: "All" never calls `SuiTextBlockDialogVue`, where the individual option always does.
