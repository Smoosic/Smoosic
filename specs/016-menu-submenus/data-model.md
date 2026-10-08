# Phase 1 Data Model: Sidebar Menu Submenus

This feature has no persisted or serialized data model changes — `SmoArpeggio` (`src/smo/data/noteModifiers.ts`) and its 8 `SmoArpeggioType` values are unchanged. The "entities" below are in-memory UI/view-model shapes used while a menu is open.

## MenuChoiceDefinition (existing, unchanged)

Display-only data for a single menu row. Defined at `src/ui/menus/menu.ts:18-24`.

| Field | Type | Notes |
|---|---|---|
| `icon` | `string` | CSS class(es) for the row's icon |
| `text` | `string` | Label shown to the user |
| `value` | `string` | Identifies the choice; matched against `data-value` on selection |
| `hotkey` | `string?` | Assigned by `menu.vue` at render time |
| `miIcon` | `string?` | Optional material-icon variant |

## SuiConfiguredMenuOption (extended)

The reusable unit every configured menu (Notes, Measure, Part, Beam, …) is built from. Defined at `src/ui/menus/menu.ts:137-141`.

| Field | Type | Notes |
|---|---|---|
| `menuChoice` | `MenuChoiceDefinition` | Unchanged |
| `handler` | `SuiMenuHandler` | Unchanged. Ignored when `subMenu` is present. |
| `display` | `SuiMenuShowOption` | Unchanged — still governs whether the option (parent or leaf) is shown |
| `subMenu` | `SuiConfiguredMenuOption[]?` | **New.** When present, selecting this option displays these options as the menu's new item list in place of performing `handler`. Absent ⇒ existing direct-action/dialog behavior, unchanged. |

**Validation rule**: an option MUST NOT define both a meaningful `handler` side effect and a non-empty `subMenu` — if `subMenu` is present and non-empty, it takes precedence and `handler` is not invoked. This mirrors "a menu choice either does a thing or leads to a further set of choices," per User Story 2.

**State transitions**: A menu instance's currently-displayed item list moves from a parent's `menuOptions` to a chosen option's `subMenu` array on selection of a submenu-bearing option; it does not move back (no "parent" pointer is kept) — dismissing a submenu ends the whole menu session, per the spec's Assumptions.

## Arpeggio Style Choice (new usage of an existing type)

Each of the 8 leaf options in the Arpeggio submenu wraps one existing `SmoArpeggioType` (`src/smo/data/noteModifiers.ts:252-255`) as a `SuiConfiguredMenuOption`:

| `value` (`SmoArpeggioType`) | Label shown |
|---|---|
| `directionless` | Plain |
| `rasquedo_up` | Rasquedo Up |
| `rasquedo_down` | Rasquedo Down |
| `roll_up` | Roll Up |
| `roll_down` | Roll Down |
| `brush_up` | Brush Up |
| `brush_down` | Brush Down |
| `none` | None |

Labels match the existing `arpValues` list in `src/ui/components/dialogs/arpeggio.vue:26-50` so the user-facing vocabulary doesn't change. Each leaf's `handler` calls `menu.view.addRemoveArpeggio(value)` (see [research.md](./research.md) Decision 3) and has no independent state of its own — it reads/writes through the existing note selection + `SmoArpeggio` modifier, unchanged.
