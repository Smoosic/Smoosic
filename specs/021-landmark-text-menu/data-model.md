# Phase 1 Data Model: Landmark Text Menu

This feature introduces one newly-*activated* persisted field (`SmoTextGroup.purpose`, which already exists but is currently dead — research.md §1), one new static placement table, and no new persisted classes. Everything else is transient menu/dialog wiring.

## Modified Entity: `SmoTextGroup` (`src/smo/data/scoreText.ts`)

| Field | Type | Change | Relevance to this feature |
|---|---|---|---|
| `purpose` | `number` (one of `SmoTextGroup.purposes`) | **Activated**: added to `nonTextAttributes` (and thus `attributes`), so the constructor now copies it from params and `serialize()`/`deserialize()` now persist/restore it. Previously present as a class field but silently dropped by both paths (research.md §1). | Identifies which landmark (if any) a text group represents. `NONE` (the existing default) means "not a landmark" — an ordinary, freely-authored Score Text. Drives: existing-landmark lookup (FR-006), and dialog gating of free-text editing, pagination controls, and initial dialog mode (FR-013/FR-014/FR-017). |
| `edited` | `boolean` | **No schema change** (already a non-persisted, session-only field, `scoreText.ts:509`) | Unchanged by this feature — `createLandmarkText` does **not** set it. The dialog's initial-mode check now reads `purpose` directly (research.md §8) rather than relying on `edited` being pre-set, so this field keeps its original, narrower meaning ("has any text group of any purpose already been opened once in a dialog this session"). |

No change to `SmoTextGroupParams`/`SmoTextGroupParamsSer` shapes — `purpose` is already declared optional on both (`scoreText.ts:297`, `330`); this feature only changes whether the constructor/serializer actually use it.

**Backward compatibility**: A legacy score's saved JSON has no `purpose` on any text group. `smoSerialize.serializedMerge`'s default-filling (used identically for every other attribute already in the list) fills in `SmoTextGroup.purposes.NONE`, exactly matching today's implicit behavior. A newly-created plain "Score Text" (via the existing, unmodified `textBlockDialogMenuOption`) also defaults to `NONE` and is therefore indistinguishable from today's output when saved (`serializedMergeNonDefault` omits default-valued fields).

## New Interface: `SmoLandmarkPlacement` (`src/smo/data/scoreText.ts`)

```ts
interface SmoLandmarkPlacement {
  fontFamily: string;
  fontSize: number;
  xJustify: 'center' | 'right';
  xPlacement?: number; // required only when xJustify === 'center'
  yOffset: number;
}
```

Distinct from the pre-existing, shared `SmoTextPlacement` (still used unmodified by `purposeToFont`/`createTextForLayout`) — added because a landmark can be either centered between the margins or right-justified against the right margin, two genuinely different layout rules, not two points on the same "fraction of printable width" scale (research.md §2d, spec FR-021).

## New Static Table: `SmoTextGroup.landmarkPlacements` (`src/smo/data/scoreText.ts`)

`Record<number, SmoLandmarkPlacement>`, keyed by `SmoTextGroup.purposes`, one entry for each of the seven landmark purposes. See research.md §2/§2d for the full table and per-row rationale. Does not include an entry for `NONE`.

- **`xJustify`**: `'center'` for Title, Subtitle, Copyright, Date (each also sets `xPlacement: 0.5`); `'right'` for Composer, Page number, Part (no `xPlacement` — right-justification needs none).
- **`yOffset`'s meaning for top-anchored entries** (research.md §2c): only its *sign* is read now (positive = top-anchored); `createLandmarkText` computes the actual position from the top margin / the landmark above it, not from this magnitude. TITLE/SUBTITLE/COMPOSER/PAGE/PART all carry the placeholder value `1`. COPYRIGHT (`-12`) and DATE (`-28`) are bottom-anchored and their magnitude is still load-bearing, unchanged.

## New Method: `SmoScoreText.estimateHeight()` (`src/smo/data/scoreText.ts`)

```ts
estimateHeight(): number
```

Mirrors the existing `estimateWidth()` exactly (same `TextFormatter.create(...)`/`setFontSize(...)` setup from the block's own `fontInfo`), but returns `textFont.getYForStringInPx(this.text).height` — the real glyph-metrics height of this specific string in this specific font, not an approximation. Used by `createLandmarkText` (below) to compute a top-anchored landmark's base position (research.md §2c). No existing call site changes; this is a new, additive method.

## Modified Static Factory: `SmoTextGroup.createLandmarkText(purpose, text, layout, above?, measureText?)` (`src/smo/data/scoreText.ts`)

```ts
static createLandmarkText(
  purpose: number, text: string, layout: ScaledPageLayout, above?: SmoTextGroup | null, measureText?: string
): SmoTextGroup
```

- **Input**: `purpose` (one of the seven landmark purposes), `text` (already resolved by the caller — see contracts, `resolveLandmarkText` — this is what gets stored on the returned group), `layout` (the score's current first-page `ScaledPageLayout`, same as `createTextForLayout`'s existing parameter), `above` — the already-existing landmark immediately above this one in its column, if any (resolved by the caller's `findAboveLandmark`, below); `undefined`/`null`/omitted means nothing is above it yet — and **(new)** `measureText` — a representative, already-substituted string to use *only* for width/height estimation in place of `text` (research.md §2e); omitted/falsy means measure `text` itself, correct for every purpose except Page number.
- **Behavior**: reads `landmarkPlacements[purpose]` instead of `purposeToFont[purpose]`. Estimates `width`/`height` from `measureText ?? text` (temporarily swapping `st.text`, then restoring it to the real `text` before continuing), so the stored group still carries the literal `text` (markers and all).
  - **Horizontal** (research.md §2d/§2e, spec FR-021), branching on `xJustify`:
    - `'center'` (Title, Subtitle, Copyright, Date): center is `leftMargin + (pageWidth - leftMargin - rightMargin) * xPlacement`, then `st.x = centerX - (width / 2)` — unchanged from the previous revision.
    - `'right'` (Composer, Page number, Part): `st.x = (pageWidth - rightMargin) - width` — the text's right edge lands exactly at the right margin; no `xPlacement` is used. For Page number, `width` is estimated from `measureText` (a representative `"Page 1 of N"`), not the literal `'Page ### of @@@'` stored text, so its right edge matches Composer's/Part's instead of falling short (research.md §2e).
  - **Vertical, top-anchored** (`yOffset > 0` — Title, Subtitle, Composer, Page number, Part; research.md §2c, spec FR-019/FR-020):
    - If `above` is supplied and has a non-null `logicalBox`: the new landmark's visual top is set flush to `above.logicalBox.y + above.logicalBox.height` (stacked immediately below it).
    - Otherwise: the new landmark's visual top is `Math.max(0, topMargin / 2 - height)`, where `height` is this text's own `estimateHeight()`.
    - Either way, since `st.y` behaves as a bottom/baseline-like coordinate (`textRender.ts` derives visual top as `y - height`), the code sets `st.y = <target visual top> + height` to achieve the intended visual top.
  - **Vertical, bottom-anchored** (`yOffset < 0` — Copyright, Date; unchanged): `st.y = pageHeight + yOffset`, still measured from the true page bottom, not `bottomMargin` (research.md §2b).
  - Builds a single-block `SmoTextGroup` with `pagination: SmoTextGroup.paginations.EVERY` and `purpose` set to the input purpose.
- **Output**: a fully-formed `SmoTextGroup`, not yet added to any score/part — the caller (menu handler) is responsible for calling `view.addTextGroup(...)`, exactly as the existing "Score Text" creation flow already does for a blank group.

## Transient (Non-Persisted) Menu Helpers — `src/ui/menus/text.ts`

Pure functions/constants, no new state:

| Name | Signature | Purpose |
|---|---|---|
| `findLandmark` | `(purpose: number, view: SuiScoreViewOperations) => SmoTextGroup \| undefined` | Looks up an existing landmark of the given purpose, checking the same collection `addTextGroup` would write a new one to (research.md §6). |
| `sourceTextDefined` | `(purpose: number, view: SuiScoreViewOperations) => boolean` | Whether the purpose's underlying source (score info field, or exposed-part state) currently has content (research.md §7). |
| `resolveLandmarkText` | `(purpose: number, view: SuiScoreViewOperations) => string` | Produces the text to populate a newly-created landmark of the given purpose (research.md §5). |
| `resolveLandmarkMeasureText` **(new)** | `(purpose: number, view: SuiScoreViewOperations, resolvedText: string) => string` | Produces a representative, already-substituted string to *estimate width/height from* — for Page number, `` `Page 1 of ${pageCount}` ``; for every other purpose, `resolvedText` unchanged (research.md §2e). Passed as `createLandmarkText`'s new `measureText` parameter. |
| `LANDMARK_COLUMNS` **(new)** | `number[][]` | The two top-anchored columns: `[TITLE, SUBTITLE]` and `[COMPOSER, PAGE, PART]` — an unordered grouping, not a sequence (research.md §2c/§2f). |
| `findAboveLandmark` **(revised)** | `(purpose: number, view: SuiScoreViewOperations) => SmoTextGroup \| undefined` | For a purpose in one of `LANDMARK_COLUMNS`, checks every *other* member of that column and returns whichever already-existing one currently has the lowest (furthest-down) rendered bottom edge, or `undefined` if none exist yet — order-independent, not tied to the column array's index order (research.md §2f, fixing a bug where a fixed index order meant Composer could never be told to stack below an already-existing Page number/Part). Its result is passed as `createLandmarkText`'s `above` parameter. |

## Dialog-Scoped Transient State — addition to `textBlock.vue`

| Name | Type | Purpose |
|---|---|---|
| `isLandmark` | `boolean` (plain `const`, **new**) | `props.modifier.value.purpose !== SmoTextGroup.purposes.NONE`, computed once at dialog setup (purpose never changes for the lifetime of an open dialog). Gates visibility of the "Edit Text" button and the "Page Behavior" row, **and** is folded directly into `mode`'s initial value (research.md §8). No other existing ref (`mode`, `xPosition`, `yPosition`, `fontInfo`, `pagination`) changes shape. |

## State Transitions

No new `DialogMode` values. `textBlock.vue`'s existing `'idle' | 'editing' | 'moving'` machine is unchanged; this feature removes, for a landmark, the UI affordances that transition *into* `'editing'` (the "Edit Text" button) and that mutate `pagination` (the "Page Behavior" select), and additionally changes `mode`'s *initial-value expression itself* from `props.modifier.value.edited ? 'idle' : 'editing'` to `(props.modifier.value.edited || isLandmark) ? 'idle' : 'editing'`. This guarantees `'editing'` is unreachable — on open or thereafter — for **any** group with `purpose !== NONE`, not only ones freshly created by `createLandmarkText`: it also covers a Title/Subtitle/Composer group produced by the pre-existing MusicXML-import path (`xmlToSmo.ts`, via `createTextForLayout`), which sets `purpose` but never touches `edited`. `createLandmarkText` no longer sets `edited: true` itself — that responsibility now lives entirely in the `isLandmark` check, in one place, for every code path that can produce a purpose-tagged group.
