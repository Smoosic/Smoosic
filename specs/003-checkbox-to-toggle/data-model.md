# Phase 1 Data Model: Dialog Checkbox-to-Toggle Migration

This feature has no persisted/domain data model changes — every checkbox already reads and writes an existing score/preferences property (`SmoScorePreferences`, `SmoPartInfo`, etc.), and that continues unchanged. What follows instead is the **UI control inventory**: every checkbox instance in scope, its layout shape, and what the migration does to it. `/speckit-tasks` should turn each row below into one task.

## Layout shape classification

| Case | Shape | Migration action |
|------|-------|-------------------|
| **1 — Separate label column** | Checkbox alone in one grid column, immediately followed by a sibling column whose only content is the label text | Move label text into `toggle`'s `label` prop; delete the label column; widen the toggle's column to the combined width |
| **2 — Shared column** | Checkbox and its `<label>` are both children of the same single column div | Move label text into `toggle`'s `label` prop; no column to delete, no width change (one column in, one column out) |
| **3 — No adjacent label** | Checkbox has no label div immediately following it (meaning is conveyed by column headers, or a preceding data column, or context) | Swap to `toggle` with an empty (or context-derived) `label`; no column deletion or width change |

## Component inventory

### addMeasures.vue

| Checkbox | Bound value | Case | Original columns | Target column | Notes |
|---|---|---|---|---|---|
| `append-checkbox` | `append` (`v-model`) | 1 | `col-2` (checkbox) + `col-6` (label "Append to Selection") | `col-8` | No disabled condition |

### fontPicker.vue

| Checkbox | Bound value | Case | Original columns | Target column | Notes |
|---|---|---|---|---|---|
| `font-weight` | `isBold` (`v-model`) | 2 | `col-3` (checkbox + label "Bold" together) | `col-3` (unchanged) | — |
| `font-style` | `isItalic` (`v-model`) | 2 | `col-3` (checkbox + label "Italic" together) | `col-3` (unchanged) | — |

### guitarTab.vue

| Checkbox | Bound value | Case | Original columns | Target column | Notes |
|---|---|---|---|---|---|
| `toggleStems` | `showStems` (`v-model`) + `@change="toggleStemsCb"` | 2 | `col-4` (checkbox + label "Show Stems" together) | `col-4` (unchanged) | `changeCb` must still invoke `toggleStemsCb` after updating `showStems` |

### instrumentProperties.vue

| Checkbox | Bound value | Case | Original columns | Target column | Notes |
|---|---|---|---|---|---|
| `font-weight` (id reused — pre-existing) | `usePercussionSymbols` (`v-model`) | 2 | `col-12` (checkbox + label "Use Percussion Symbols" together) | `col-12` (unchanged) | Row itself is conditionally hidden via `:class="{ hide: !showPercussionSymbols }"` — must be preserved on the row |

### newPart.vue

| Checkbox | Bound value | Case | Original columns | Target column | Notes |
|---|---|---|---|---|---|
| `font-weight` (id reused — pre-existing) | `usePercussionSymbols` (`v-model`) | 2 | `col-12` (checkbox + label together) | `col-12` (unchanged) | Same conditional-row pattern as `instrumentProperties.vue` |
| `toggleStems` (id reused — pre-existing) | `addStave` (`v-model`) + `@change="addStaveCb"` | 2 | `col-4` (checkbox + label "2-Stave part" together) | `col-4` (unchanged) | `changeCb` must still invoke `addStaveCb` |

### partInfo.vue

| Checkbox | Bound value | Case | Original columns | Target column | Notes |
|---|---|---|---|---|---|
| `preserveText` | `partInfo.preserveTextGroups` (`v-model`) + `@change` writes back via `writeBooleanValue` | 1 | `col-1` (checkbox) + `col-5` (label "Preserve Text Groups") | `col-6` | `changeCb` must call `writeBooleanValue('preserveTextGroups', value)` |
| `expandMultimeasureRests` | `partInfo.expandMultimeasureRests` (`v-model`) + `@change` writes back | 1 | `col-1` + `col-5` (label "Expand Multimeasure Rests") | `col-6` | `changeCb` must call `writeBooleanValue('expandMultimeasureRests', value)` |
| `includeNext` | `includeNext` (`v-model`) | 1 | `col-1` + `col-5` (label "Include Next Stave") | `col-6` | No disabled condition |

### scorePreferences.vue

All 7 follow the same `col-1` + `col-5` → `col-6` shape, `v-model="preferences.<prop>"` plus `@change="updateBool('<prop>')"`:

| Checkbox | Bound value | Case | Original columns | Target column |
|---|---|---|---|---|
| `autoAdvance` | `preferences.autoAdvance` | 1 | `col-1` + `col-5` ("Auto-advance on pitch change") | `col-6` |
| `autoPlay` | `preferences.autoPlay` | 1 | `col-1` + `col-5` ("Auto-play sounds for pitch change") | `col-6` |
| `showPiano` | `preferences.showPiano` | 1 | `col-1` + `col-5` ("Show piano widget") | `col-6` |
| `transposeScore` | `preferences.transposingScore` | 1 | `col-1` + `col-5` ("Transposing score") | `col-6` |
| `hideEmptyLines` | `preferences.hideEmptyLines` | 1 | `col-1` + `col-5` ("Hide empty staves") | `col-6` |
| `partNames` | `preferences.showPartNames` | 1 | `col-1` + `col-5` ("Show part names in Score") | `col-6` |
| `horizontalDisplay` | `preferences.horizontalDisplay` | 1 | `col-1` + `col-5` ("Horizontal Display") | `col-6` |

Each `changeCb` must call `updateBool('<prop>')` after updating the bound value (matching existing `@change` behavior).

### staffGroups.vue

| Checkbox | Bound value | Case | Original columns | Target column | Notes |
|---|---|---|---|---|---|
| addToGroup (in `col-2`) | `choice.inGroup` (`v-model`) + `@change="choice.addCb"` | 3 | `col-2`, no following label div (meaning conveyed by table header above the grid) | `col-2` (unchanged) | Wrapped in `<span :class="{ hide: !choice.addToGroup }">` — visibility condition must move to the toggle's row/wrapper |
| createGroup (in `col-2`) | `choice.inGroup` (`v-model`) + `@change="choice.createCb"` | 3 | `col-2`, no following label | `col-2` (unchanged) | Wrapped in `<span :class="{ hide: !choice.createGroup }">` |
| endsGroup (in `col-2`) | `choice.inGroup` (`v-model`) + `@change="choice.removeCb"` | 3 | `col-2`, no following label | `col-2` (unchanged) | Wrapped in `<span :class="{ hide: !choice.endsGroup }">` |

### textBlock.vue

| Checkbox | Bound value | Case | Original columns | Target column | Notes |
|---|---|---|---|---|---|
| `attach-to-selector` | `attachToSelector` via `:checked` + `@change` handler `onAttachToggle` | 1 | `checkbox-input-column-div` (25% width) + `checkbox-input-label-div` (25% width, label "Attach to Selection") | Combined ~50%-width column | Not on the `col`/`col-N` grid — uses dedicated fixed-percentage classes (see Research: these need a merged-width class or equivalent, not a `col-N` bump) |

### timeSignature.vue

| Checkbox | Bound value | Case | Original columns | Target column | Notes |
|---|---|---|---|---|---|
| `use-symbol` | `useSymbol` (`v-model`), `:disabled="!supportsSymbol"` | 1 | `checkbox-input-column-div` + `checkbox-input-label-div` ("Use Symbol") | Combined ~50%-width column | Toggle's `:disabled` must be bound to `!supportsSymbol` |
| `display-ts` | `display` (`v-model`) | 1 | `checkbox-input-column-div` + `checkbox-input-label-div` ("Display Time Signature") | Combined ~50%-width column | Pre-existing label `for` mismatch (`display-cs` vs `display-ts`) — out of scope to fix beyond ensuring the toggle's own label/id are internally consistent |
| `display-compound` | `isCompound` (`v-model`) | 1 | `checkbox-input-column-div` + `checkbox-input-label-div` ("Compound Time Signature") | Combined ~50%-width column | — |

### viewStaves.vue

| Checkbox | Bound value | Case | Original columns | Target column | Notes |
|---|---|---|---|---|---|
| `horizontalDisplay` | `preferences.horizontalDisplay` (`v-model`) | 1 | `col-7` (checkbox) + `col-5` (label "Horizontal Display") | `col-12` | Pre-existing label `for` mismatch (`hideEmptyLines`) — not this feature's concern beyond giving the toggle a correct, self-contained label |
| `group-checkbox` (per stave, `v-for`) | `viewMap[ix].show` (`v-model`) + `@change="toggleStave(ix)"` | 3 (preceding data column, not a following label) | `col-6` (preceding: stave name — data, not a label for this control) + `col-6` (checkbox alone) | `col-12` (toggle occupies the row's remaining/full column; the stave-name column is retained as-is, it is not a label div to remove) | `changeCb` must still invoke `toggleStave(ix)` |

## Summary counts

- **11** components migrated
- **26** checkbox instances replaced with `toggle`
- **Case 1** (separate label column, full width-merge + label move): 16 instances (`addMeasures` ×1, `partInfo` ×3, `scorePreferences` ×7, `textBlock` ×1, `timeSignature` ×3, `viewStaves` ×1)
- **Case 2** (shared column, label move only): 6 instances (`fontPicker` ×2, `guitarTab` ×1, `instrumentProperties` ×1, `newPart` ×2)
- **Case 3** (no relocatable label): 4 instances (`staffGroups` ×3, `viewStaves` ×1)
