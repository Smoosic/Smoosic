# Contracts: Menu, Data-Layer, and Dialog Interfaces

This project is a client-side library with no network API. The "contracts" for this feature are the TypeScript interfaces at the internal boundaries it adds or changes: the new `SmoTextGroup` static members, the new menu options in `src/ui/menus/text.ts`, and the modified `textBlock.vue` gating. All reuse existing shapes (`SuiConfiguredMenuOption`, `SmoTextPlacement`) established elsewhere in the codebase.

## 1. Data layer: `src/smo/data/scoreText.ts` additions

```ts
// SmoTextGroup.nonTextAttributes (MODIFIED — add 'purpose')
static get nonTextAttributes() {
  return ['justification', 'relativePosition', 'spacing', 'pagination',
    'attachToSelector', 'selector', 'musicXOffset', 'musicYOffset', 'purpose'];
}
// SmoTextGroup.attributes gets the same addition.

// New interface, distinct from the shared SmoTextPlacement
interface SmoLandmarkPlacement {
  fontFamily: string;
  fontSize: number;
  xJustify: 'center' | 'right';
  xPlacement?: number; // required only when xJustify === 'center'
  yOffset: number;
}

// New static table
static get landmarkPlacements(): Record<number, SmoLandmarkPlacement>;

// New instance method on SmoScoreText, mirroring estimateWidth()
estimateHeight(): number;

// New static factory (MODIFIED — added the optional `above`/`measureText` parameters)
static createLandmarkText(
  purpose: number, text: string, layout: ScaledPageLayout, above?: SmoTextGroup | null, measureText?: string
): SmoTextGroup;
```

- **Precondition** on `createLandmarkText`: `purpose` is one of `TITLE | SUBTITLE | COMPOSER | COPYRIGHT | PAGE | PART | DATE` (i.e. a key present in `landmarkPlacements`); `NONE` is not a valid input. `above`, if supplied, must be the caller's already-resolved "landmark currently at the bottom of this purpose's column" (via `findAboveLandmark`, §2) — `createLandmarkText` does no column lookup itself. `measureText`, if supplied, is used only for width/height estimation, never stored.
- **Postcondition**: returned `SmoTextGroup` has exactly one text block containing `text` (not `measureText ?? text`, which is used only to compute `width`/`height` — research.md §2e):
  - Horizontally (research.md §2d/§2e, spec FR-021), branching on `landmarkPlacements[purpose].xJustify`:
    - `'center'` (Title, Subtitle, Copyright, Date): centered on `leftMargin + (pageWidth - leftMargin - rightMargin) * xPlacement` (the printable area between the margins, not the raw page width — research.md §2).
    - `'right'` (Composer, Page number, Part): right-justified so the text's right edge equals `pageWidth - rightMargin` exactly (`st.x = (pageWidth - rightMargin) - width`) — not centered around any point. For Page number, `width` comes from `measureText` (a representative substituted string), not the literal stored `'Page ### of @@@'`, so its right edge matches Composer's/Part's exactly (research.md §2e).
  - Vertically, for a **top-anchored** purpose (`yOffset > 0` — Title, Subtitle, Composer, Page number, Part; research.md §2c, spec FR-019/FR-020):
    - If `above?.logicalBox` is present: visual top = `above.logicalBox.y + above.logicalBox.height` (flush stack below it).
    - Otherwise: visual top = `Math.max(0, topMargin / 2 - height)`, where `height` is `text`'s own `estimateHeight()`.
  - Vertically, for a **bottom-anchored** purpose (`yOffset < 0` — Copyright, Date; unchanged): `st.y = pageHeight + yOffset`, measured from the true page bottom, never from `bottomMargin` (research.md §2b, spec FR-018/SC-007: a landmark must never render inside the margin area used by the music).
  - `pagination === SmoTextGroup.paginations.EVERY`, `purpose` equal to the input, and is **not** yet added to any score or part — the caller must call `view.addTextGroup(...)`. Does **not** set `edited` (see §3 — the dialog gates its initial mode off `purpose` directly, not off `edited`, so no data-layer side effect is needed here).
- **`nonTextAttributes` change effect**: `new SmoTextGroup({ ...SmoTextGroup.defaults, purpose: X })` now yields an instance with `.purpose === X` (today it silently yields `NONE`). `existingGroup.serialize()` now includes `purpose` whenever it's not `NONE`; `SmoTextGroup.deserialize()`/`deserializePreserveId()` now restore it. A group with no `purpose` in its saved JSON (any score saved before this feature) deserializes to `NONE`, identical to today.

## 2. Menu layer: `src/ui/menus/text.ts` additions

```ts
// Helpers (pure functions, no new exported state)
function findLandmark(purpose: number, view: SuiScoreViewOperations): SmoTextGroup | undefined;
function sourceTextDefined(purpose: number, view: SuiScoreViewOperations): boolean;
function resolveLandmarkText(purpose: number, view: SuiScoreViewOperations): string;
function resolveLandmarkMeasureText(purpose: number, view: SuiScoreViewOperations, resolvedText: string): string;

// New: top-anchored columns (unordered groupings), and a lookup for "what's above this purpose"
const LANDMARK_COLUMNS: number[][]; // [TITLE, SUBTITLE], [COMPOSER, PAGE, PART]
function findAboveLandmark(purpose: number, view: SuiScoreViewOperations): SmoTextGroup | undefined;

// One SuiConfiguredMenuOption per landmark purpose
const landmarkOption = (
  purpose: number, label: string, icon: string
): SuiConfiguredMenuOption => ({
  handler: async (menu: SuiMenuBase) => { /* see behavior below */ },
  display: (menu: SuiMenuBase) => sourceTextDefined(purpose, menu.view)
    || (purpose !== SmoTextGroup.purposes.PART && !!findLandmark(purpose, menu.view)),
  menuChoice: { icon, text: label, value: `landmark-${label}` }
});

const landmarkOptions: SuiConfiguredMenuOption[] = [
  landmarkOption(SmoTextGroup.purposes.TITLE, 'Title', 'mi title'),
  landmarkOption(SmoTextGroup.purposes.SUBTITLE, 'Subtitle', 'mi title'),
  landmarkOption(SmoTextGroup.purposes.COMPOSER, 'Composer', 'mi title'),
  landmarkOption(SmoTextGroup.purposes.COPYRIGHT, 'Copyright', 'mi title'),
  landmarkOption(SmoTextGroup.purposes.DATE, 'Date', 'mi title'),
  landmarkOption(SmoTextGroup.purposes.PAGE, 'Page Number', 'mi title'),
  landmarkOption(SmoTextGroup.purposes.PART, 'Part', 'mi title')
];

// New parent option, added to SuiTextMenuOptions
const landmarkTextMenuOption: SuiConfiguredMenuOption = {
  handler: async () => {},               // never invoked — subMenu takes precedence (menu.ts:56)
  display: () => true,
  subMenu: landmarkOptions,
  menuChoice: { icon: 'mi title', text: 'Landmark Text', value: 'landmarkTextMenu' }
};
```

- **`landmarkOption(purpose, ...).handler` behavior** (FR-005, FR-006, FR-017, FR-019, FR-020, FR-021):
  1. `let group = findLandmark(purpose, menu.view);`
  2. If `!group`: resolve `text = resolveLandmarkText(purpose, menu.view)`, `measureText = resolveLandmarkMeasureText(purpose, menu.view, text)`, `above = findAboveLandmark(purpose, menu.view)`; `group = SmoTextGroup.createLandmarkText(purpose, text, menu.view.score.layoutManager!.getScaledPageLayout(0), above, measureText); await menu.view.addTextGroup(group);`
  3. Always: open `SuiTextBlockDialogVue({ completeNotifier: menu.completeNotifier!, view: menu.view, eventSource: menu.eventSource, id: 'textDialog', ctor: 'SuiTextBlockDialog', tracker: menu.view.tracker, startPromise: menu.closePromise, modifier: group })` — no change to `SuiTextBlockDialogVue` itself; passing a non-null `modifier` (whether just-created or pre-existing) already takes its "existing group" branch (research.md §9).
- **`findAboveLandmark(purpose, view)` contract** (FR-020, revised per research.md §2f): if `purpose` is in one of `LANDMARK_COLUMNS`, checks every *other* purpose in that column via `findLandmark`, and returns whichever already-existing one has the lowest (furthest-down) `logicalBox.y + logicalBox.height`; returns `undefined` if `purpose` isn't in a column or no other member of its column exists yet. Order-independent — does not depend on the column array's index order.
- **`resolveLandmarkMeasureText(purpose, view, resolvedText)` contract** (research.md §2e): for `PAGE`, returns `` `Page 1 of ${view.score.layoutManager!.pageLayouts.length}` ``; for every other purpose, returns `resolvedText` unchanged.
- **`display` contract** (FR-002, FR-003, FR-004, and the "stays visible after source cleared" edge case): see research.md §7. Note the Part exception — its visibility is `sourceTextDefined` (`view.isPartExposed()`) alone, never OR'd with `findLandmark`.
- **Parent option contract**: identical shape to `arpeggioMenuOption` (`src/ui/menus/note.ts:66-75`) — `subMenu` present and non-empty means `menu.vue`'s existing recursive-level logic (`menu.ts:56`, `menu.vue:36`) navigates into `landmarkOptions` on selection instead of invoking `handler`, so `handler` here is a required-but-unreachable no-op, matching the existing convention for every other `subMenu`-bearing option in the codebase.

## 3. Dialog layer: `src/ui/components/dialogs/textBlock.vue` changes

```ts
// New plain const, computed once before `mode` (purpose never changes while the dialog is open)
const isLandmark = props.modifier.value.purpose !== SmoTextGroup.purposes.NONE;

// MODIFIED: mode's initial-value expression now also checks isLandmark
const mode: Ref<DialogMode> = ref((props.modifier.value.edited || isLandmark) ? 'idle' : 'editing');
```

- **Template change 1** (FR-013): the "Edit Text" button is wrapped in `v-if="!isLandmark"`. The "Move" button is unconditional, unchanged (FR-016).
- **Template change 2** (FR-014): the "Page Behavior" row is wrapped in `v-if="!isLandmark"`. The font picker above it stays unconditional (FR-015).
- **Mode-initialization change** (FR-013, FR-017): `mode`'s initial value changes from `props.modifier.value.edited ? 'idle' : 'editing'` to `(props.modifier.value.edited || isLandmark) ? 'idle' : 'editing'`. This is load-bearing, not cosmetic: hiding the "Edit Text" button alone only removes the *manual* path into `'editing'` — it does not stop the dialog from *starting* in `'editing'` on its own for a group whose `edited` field happens to be `false`. Since `edited` is set only by this dialog itself (never by `createLandmarkText`, see contracts §1), any purpose-tagged group opened for the very first time — including a pre-existing MusicXML-imported Title/Subtitle/Composer group, not only ones created by this feature's own menu handler — would otherwise still boot into the free-text tiptap session, violating FR-013. Folding `isLandmark` into the initial-value expression itself closes that gap unconditionally.
- **No change** to `enterEditing`/`exitEditing`/`syncEditorIfActive`/the pagination `ref`/`onPaginationSelect` functions themselves — they simply become unreachable for a landmark once their only template trigger is hidden and `mode` can never resolve to `'editing'` in the first place.
