# Contract: `SuiConfiguredMenuOption.subMenu`

This is the internal extension-point contract other menus (Measure, Part, Beam, Voice, etc.) use to add their own submenus, the same way the Notes menu's Arpeggio choice does. It is not a network/API contract — Smoosic's "interfaces" for this feature are the TypeScript shapes menu authors code against.

## Shape

```ts
// src/ui/menus/menu.ts
export interface SuiConfiguredMenuOption {
  menuChoice: MenuChoiceDefinition;
  handler: SuiMenuHandler;
  display: SuiMenuShowOption;
  subMenu?: SuiConfiguredMenuOption[]; // NEW
}
```

## Behavioral contract

1. **Absent or empty `subMenu`** ⇒ unchanged existing behavior: selecting the option calls `handler(menu)` and then the menu session completes (`menuStructure.complete()`), exactly as today.
2. **Non-empty `subMenu`** ⇒ selecting the option MUST NOT call `handler`. Instead the menu display swaps to render `subMenu` as its current item list, using the same mounted menu instance — same screen position, same keyboard capture, same dismiss/Cancel affordance the parent had.
3. Each entry in `subMenu` is itself a full `SuiConfiguredMenuOption` and is subject to the same two rules — a submenu entry MAY itself declare a further `subMenu` (nesting is not prohibited by the contract, though this feature only uses one level for Arpeggio).
4. `display(menu)` on a submenu-bearing option controls whether the *parent* row is shown, exactly like any other option; `display` on each leaf inside `subMenu` independently controls whether that leaf row is shown once the submenu is rendered.
5. Dismissing (Cancel/Escape) while a `subMenu` is displayed ends the whole menu session (same `complete()` path as a top-level menu's Cancel) — there is no implicit "go back to parent" choice. A submenu that wants a way back can include its own `cancel`-valued option, same as any top-level menu does today.
6. A `subMenu` array does not need its own `ctor` string or registration with `SuiMenuManager` — it is never looked up by name; it only exists as data reachable through the option that declares it.

## Consumers of this contract (this feature)

- `src/ui/menus/note.ts`: `arpeggioMenuOption` gains `subMenu: arpeggioStyleOptions` (8 entries, see [data-model.md](../data-model.md)); its existing `handler` (which opened `SuiArpeggioDialog`) is removed.
- `src/ui/components/menus/menu.vue`: `selectItem` gains the branch described in rule 2 above.

## Non-goals

- No new public/exported API surface — `subMenu` is a field on an already-internal type used by menu authors within `src/ui/menus/*`, not something exposed via `src/application/exports.ts`.
- No change to `MenuChoiceDefinition`, `SuiMenuParams`, or `SuiMenuManager`'s public methods.
