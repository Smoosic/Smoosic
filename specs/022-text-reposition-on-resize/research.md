# Phase 0 Research: Reposition Text on Layout Resize

All items below were resolved by reading the existing implementation; no items were left as `NEEDS CLARIFICATION` in the plan's Technical Context.

## 1. Root cause of the svg-scale bug

**Decision**: The bug is object aliasing, not a math error. `src/ui/dialogs/globalLayout.ts` does:

```ts
const currentValue = reactive(parameters.view.score.layoutManager!.globalLayout);
```

`reactive()` wraps the score's *live* `globalLayout` object; it does not copy it. `scoreLayout.vue` binds its inputs directly to that same object (`currentLayout.pageWidth = val`, etc.), so every keystroke mutates `score.layoutManager.globalLayout` in place, synchronously, before Vue's `watch(currentValue, ...)` callback ever runs. By the time `setGlobalLayout` does:

```ts
const original = this.score.layoutManager!.getGlobalLayout().svgScale;
```

`this.score.layoutManager.globalLayout` has already been overwritten with the new value, so `original` is not the "before" value — it's the same as `layout.svgScale`. The ratio `original / layout.svgScale` collapses to (approximately) 1, so `scaleTextGroups` effectively does nothing.

**Rationale**: Confirmed by tracing the exact object reference from `globalLayout.ts` → `scoreLayout.vue`'s `currentLayout` prop → `updateNumberType()`'s direct assignment → Vue's proxy `set` trap → the `watch` callback in `globalLayout.ts` → `scoreViewOperations.ts:1731`.

**Alternatives considered**: Re-deriving the "old" svgScale from `storeScore` inside `setGlobalLayout` instead of threading it through — rejected, because `storeScore.layoutManager` is a *different* object than the one being edited (see item 3, part-mode swap) and is itself mutated later in the same function, so it's an equally unreliable source of "before" state. The only place that reliably knows the pre-change value is the dialog itself, immediately after opening or after the previous successful change.

## 2. Where to snapshot the "previous" value

**Decision**: `globalLayout.ts` keeps a `previousValue` variable, seeded from the same `backup` deep copy it already makes for cancel support, and re-snapshots it (via `JSON.parse(JSON.stringify(...))`) *after* each change is sent, not before:

```ts
let previousValue = JSON.parse(JSON.stringify(currentValue));
watch(currentValue, async (newValue) => {
  const oldValue = previousValue;
  await parameters.view.setGlobalLayout(newValue, oldValue);
  previousValue = JSON.parse(JSON.stringify(newValue));
  changed = true;
});
```

`setGlobalLayout`'s signature becomes `setGlobalLayout(layout: SmoGlobalLayout, previousLayout: SmoGlobalLayout)`, and it computes ratios from the two parameters directly instead of re-reading current in-memory state.

**Rationale**: Matches the user's own diagnosis ("we need to make the deep copy every time it is changed"). Because Vue's reactive mutation already happened synchronously before the watcher fires, the only correct "before" value is one captured and cached from the *previous* run (or dialog-open time, for the first change) — never one re-read from the (already-mutated) live object.

**Alternatives considered**: Make `currentValue` a plain (non-reactive) local copy, and only write it into the score on an explicit "Apply" action — rejected as a larger UX/behavior change to the dialog's live-preview binding than this bug fix calls for, and it would still need the same before/after snapshot to compute the text-scaling ratio.

## 3. Part-mode interaction

**Decision**: Do not change the Global Layout menu's existing visibility gate (`display: (menu) => menu.view.isPartExposed() === false` in `src/ui/menus/score.ts:72`) — adding a part-specific entry point for editing global layout is out of scope for this bug-fix feature. Instead:

- Build the new repositioning helper against `SmoLayoutManager`'s `SmoGlobalLayout` and a `SmoTextGroup[]` generically, so it is already correct wherever a part's own layout changes (today: MusicXML import at `src/smo/mxml/xmlToSmo.ts:229`; potentially a future part-layout dialog).
- Fix the concrete gap in `setGlobalLayout` found while tracing this: it currently calls `this.storeScore.layoutManager!.updateGlobalLayout(layout)` but never rescales `this.storeScore.textGroups`, so even after the aliasing bug is fixed, the persisted (`storeScore`) copy would still end up with stale text positions the next time it's the source of truth (e.g. after `viewAll()`/`setView()` rebuilds `this.score` from `this.storeScore` via a full serialize/deserialize round trip). The fix applies the same repositioning to both `this.score` and `this.storeScore`, mirroring the existing `setPageLayout`/`_mapPartFormatting` pattern that already keeps per-part `layoutManager`/`textGroups` copies on `this.score.staves[i].partInfo` and `this.storeScore.staves[this.staffMap[i]].partInfo` in sync.

**Rationale**: `src/render/sui/scoreView.ts:638` (`_mapPartFormatting`) shows that when a part is exposed, `this.score.layoutManager` and `this.score.textGroups` are swapped to reference that part's own `partInfo.layoutManager`/`partInfo.textGroups` — but `this.score` itself is a deep copy of `storeScore` (see `setView()`'s serialize/deserialize round trip), so the corresponding objects on `storeScore.staves[...].partInfo` are separate instances that also need updating, exactly as `setPageLayout` already does for page margins.

**Alternatives considered**: Enabling the Global Layout dialog while a part is exposed, as part of this feature — rejected as scope creep beyond the spec's two stated stories; the underlying fix already makes part-level layouts behave correctly wherever they're reachable today, so enabling a new menu entry point later is a small, low-risk follow-up if desired.

## 4. Formula for page-dimension repositioning

**Decision**: For each `SmoTextGroup`, when `pageWidth` and/or `pageHeight` differ between old and new layout:

```text
newX = oldX * (newLayout.pageWidth  / oldLayout.pageWidth)
newY = oldY * (newLayout.pageHeight / oldLayout.pageHeight)
```

applied independently per axis (so a width-only change never perturbs Y, and vice versa), to each text block's `text.x`/`text.y` and to the group's `musicXOffset`/`musicYOffset`. When `svgScale` also changes in the same commit, the existing scale-ratio adjustment (`scale = oldLayout.svgScale / newLayout.svgScale`) is applied to the same fields first; because both adjustments are independent multiplicative ratios, applying them in either order yields the same result (`x * scaleRatio * widthRatio` is commutative), so "scale first, then page-dimension" is chosen purely for code clarity — it lets the new page-dimension step be a small, separately testable addition next to the existing `scaleText` step rather than a single combined formula.

**Rationale**: Keeps "same percentage of the page" literal — a block at `x / pageWidth == 0.10` before the change is still at `x / pageWidth == 0.10` after, per the spec's own example and its Assumptions section (margins are explicitly out of scope for this proportional repositioning).

**Alternatives considered**: Repositioning relative to the printable area (`pageWidth - leftMargin - rightMargin`) instead of the raw page — rejected as out of scope; the spec's Assumptions section ties "relative position" to raw page width/height, and margins live on a separate `SmoPageLayout` structure edited through a different dialog (`SuiPageLayoutDialogVue`) not touched by this feature.

## 5. Testing approach

**Decision**: Add `tests/globalLayoutTextReposition.ts`, a headless `ts-node` script following the exact shape of `tests/attachedTextMigration.ts` — build a minimal `SmoScore` via the public `src/smo` API (no DOM, no rendering, no Vue), call the new `repositionTextGroups` helper and the updated `setGlobalLayout`-equivalent logic directly, and assert with the same `check()`-style helper. Register it as `npm run test:global-layout-reposition`. Document its cases in `contracts/reposition-contract.md` (see Phase 1), the same way spec 019's `conversion-contract.md` documents `tests/attachedTextMigration.ts`.

**Rationale**: This is the project's established, constitution-mandated pattern (Principle #2) for regression-testing non-UI transformation logic in `src/smo`; no new test infrastructure is introduced.

**Alternatives considered**: A QUnit/browser-based test — rejected; the constitution explicitly marks rendering/UI regression as lower priority, and QUnit assets in this repo (`build/qunit.js`) are not wired to any current in-repo test runner for this kind of logic (the project's own convention for this class of bug fix is the headless `ts-node` script).
