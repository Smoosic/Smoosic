# Phase 1 Data Model: Anchor Menus to Triggering Button

This feature introduces no persisted or serialized data. The "entities" involved are existing in-memory UI types, with one signature-level change and one new runtime value flowing between them.

## Entities

### `ButtonDefinition` (`src/ui/buttons/button.ts`)

No new fields. Unchanged: `id` remains the logical/config id used to look up and render a button; it is not itself a resolvable DOM id (see [research.md](./research.md) Decision 1).

### `ButtonCallback` (`src/ui/buttons/button.ts`)

Changed type signature:

| Field | Before | After |
|---|---|---|
| signature | `(button: ButtonDefinition) => Promise<void>` | `(button: ButtonDefinition, elementId?: string) => Promise<void>` |

`elementId`, when present, is the actual rendered DOM id of the element the user clicked (computed by the Vue button component at render time, not stored on `ButtonDefinition`).

### `SvgPoint` (`src/smo/data/common.ts` — existing type, reused as-is)

```ts
{ x: number, y: number }
```

Used as the new optional "anchor" value: a single viewport-relative coordinate computed from a triggering element's `getBoundingClientRect()`, representing either its top-right or bottom-left corner depending on which button-execution path produced it.

### `SuiMenuManager.menuPosition` (`src/ui/menus/manager.ts` — existing field, unchanged type)

Remains typed `SvgBox` (`{x, y, width, height}`) since it's consumed by existing CSS-positioning code that only reads `.x`/`.y`. When an anchor `SvgPoint` is supplied to `createMenu`, `menuPosition.x`/`.y` are set from it; `width`/`.height` stay at their existing placeholder value of `1`. When no anchor is supplied, `menuPosition` keeps its current fixed default (`{x: 250, y: 40, width: 1, height: 1}`).

## Flow

```text
user click (Vue template)
  → resolves real DOM id of clicked element (getId(buttonProps.id))
  → buttonProps.callback(buttonProps, elementId)
      → RibbonButtons.executeButton(elementId, buttonData)          [menuButtons.vue / sidebar path]
        or
      → RibbonButtons.executeQuickButton(buttonData, elementId)     [ribbonButtons.vue / top-ribbon path]
          → resolve elementId via document.getElementById
          → if found: compute SvgPoint (top-right for executeButton, bottom-left for executeQuickButton)
          → if not found / no elementId: anchor is undefined
          → this.menus.createMenu(action, controller, anchor)
              → SuiMenuManager.createMenu sets menuPosition from anchor, or keeps existing default
```

## Validation Rules

- No new validation is introduced. Resolving a missing/stale element id is not an error condition — it silently falls back to the existing default position (FR-005).
- `elementId`, `anchor`, and the `createMenu` anchor parameter are all optional at every layer, so every existing call path that does not (yet) supply one continues to behave exactly as before (backward compatible by construction).

## State Transitions

None — `menuPosition` is recomputed fresh on every `createMenu` call; there is no accumulated or persisted position state across menu opens.
