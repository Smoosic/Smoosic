# Data Model: Convert Note-Attached Text Groups to Annotations

No new persisted entity or field. This describes the legacy shape being read, the shape being written, and how one becomes the other.

## Source: attached text group (legacy, read-only after this feature)

`SmoTextGroup` (`src/smo/data/scoreText.ts`) where `attachToSelector === true`. Lives in two places in a saved score:

| Location | Notes |
|---|---|
| `score.textGroups` | Selector staff is the real staff index. |
| `staves[i].partInfo.textGroups` | A copy made by `SmoScore.updateTextGroup` when the part has `preserveTextGroups`; selector staff is part-relative (0). |

Fields the conversion reads:

| Field | Use |
|---|---|
| `attachToSelector` | Selects the group for conversion. |
| `selector.measure`, `selector.voice`, `selector.tick` | Locate the note: measure index, voice index, note index in the voice. |
| `selector.staff` | Used for the score list. Ignored for part groups (research.md §3). |
| `musicXOffset` | Group-level x offset. Copied to every annotation's `translateX`. |
| `musicYOffset` | Group-level y offset (down-positive). Negated into every annotation's `translateY` (up-positive). |
| `textBlocks[n].text.text` | Annotation text. |
| `textBlocks[n].text.fontInfo` | Annotation font. |

Fields not carried over: text block `x`/`y`, `justification`, `relativePosition`, `pagination`, `spacing`, `purpose`.

## Target: annotation

`SmoLyric` (`src/smo/data/noteModifiers.ts`) stored in the target note's `textModifiers`.

| Field | Value |
|---|---|
| `parser` | `SmoLyric.parsers.annotation` (1) |
| `text` | Block text, unchanged |
| `fontInfo` | Copy of the block's font |
| `verse` | Next unused annotation index on the note (0-3) |
| `translateX` | Group's `musicXOffset`, or 0 |
| `translateY` | Negated group's `musicYOffset`, or 0 (never -0) |
| `verticalJustify` | `SmoLyric.annotationVerticalJustify.TOP` (`SmoLyric.defaults`) |
| everything else | `SmoLyric.defaults` |

## Conversion rules

Applied per group, in list order, score list first and then each staff's part list. The score list must be done first.

1. Group not attached: keep it in its list, untouched.
2. Group attached: resolve the note (score: `selector.staff`; part: owner staff index; then `measure`, `voice`, `tick`). If any level is missing, no note is found.
3. Note found, and this is a part's list, and the note already has any annotation: discard the whole group (no annotations created, whatever its text). A part's text is a copy of the score's; annotations belong to the note and show in both, so converting it would show the text twice.
4. Otherwise, for each block in order:
   - text is empty or whitespace only: skip.
   - the note already has four annotations: skip.
   - otherwise add an annotation at the lowest free `verse`.
5. Whether or not a note was found, the group is removed from its list.
6. If the staff list is empty, do nothing (research.md §5).

## State

There is no runtime state. The transformation happens once inside `SmoScore.deserialize`. After it, `score.textGroups` and every `partInfo.textGroups` hold no group with `attachToSelector === true`, so a save writes none and a reload converts nothing (idempotent).
