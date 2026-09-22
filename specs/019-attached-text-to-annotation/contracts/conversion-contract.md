# Contract: Attached-Text Conversion on Score Load

The externally observable interface of this feature is `SmoScore.deserialize(json)` (saved score in, `SmoScore` out) plus the text block dialog. Field-level detail is in [data-model.md](../data-model.md); this file states the behavior each case must have and is the source for the test script and the manual checks.

## 1. Deserialize contract

Input: score JSON whose `textGroups` and/or `staves[i].partInfo.textGroups` contain groups with `attachToSelector: true`.
Output: a `SmoScore` where

- no group in `score.textGroups` or any `staves[i].partInfo.textGroups` has `attachToSelector === true`;
- each attached group's non-empty blocks are annotations on the located note, `parser` = annotation, in block order;
- unattached groups are unchanged.

Public signature and error behavior of `SmoScore.deserialize` do not change. A group that can't be matched to a note never throws.

### Cases

| # | Input | Expected result |
|---|---|---|
| C1 | Score list has one attached group, one block "Fine", target note exists | Note has 1 annotation, text "Fine", verse 0, annotation parser; `score.textGroups` has no attached group |
| C2 | One attached group with 3 blocks "a", "b", "c" | Note has 3 annotations, verses 0, 1, 2, texts in order |
| C3 | One attached group with blocks "a", "  ", "c" | 2 annotations ("a", "c"); the whitespace block makes none |
| C4 | Attached group whose measure index is out of range | No annotation anywhere; group removed; no exception |
| C5 | Attached group whose staff, voice or tick is out of range | Same as C4 |
| C6 | Title (unattached) plus one attached group | Title still in `score.textGroups` with the same content; attached group gone |
| C7 | Part list on staff 1 has one attached group (staff recorded as 0), target measure/voice/tick exists on staff 1 | Annotation added on staff 1's note; that part list has no attached group |
| C8 | Same text attached in `score.textGroups` (staff 1) and as a copy in staff 1's part list | Note has exactly 1 annotation with that text |
| C8b | As C8, but the part's copy has different text (edited in the part) and two blocks | Note has only the score's annotation; the part's group is discarded whole |
| C12c | Part list has an attached group; its target note already has an annotation (not from the score's list) | Existing annotation unchanged, nothing added, part group removed |
| C9 | Part list has both attached and unattached groups | Only the attached ones are converted and removed; the unattached ones stay |
| C10 | Two attached groups pointing at the same note with different text | Both texts appear as annotations, in list order |
| C11 | Target note already has 4 annotations; one attached group | No new annotation; existing 4 unchanged; group removed |
| C12 | Target note already has 2 annotations (verses 0, 1); group with 2 blocks | New annotations at verses 2 and 3 |
| C13 | Score with no attached groups | `serialize()` output equal to what it was before this change |
| C14 | Deserialize, serialize, deserialize again | Second load has the same annotation count on every note and no attached groups |
| C15 | Single-staff score whose text list is replaced by a copy of the part list (`fixTextGroupSinglePart`) with one attached group in both | Exactly 1 annotation on the note |
| C16 | Score JSON with zero staves and an attached group (`skipStaves` copy) | Group list unchanged; no exception |
| C17 | Block fontInfo `{ family: "Arial", size: 18, weight: "bold", style: "italic" }` | Annotation `fontInfo` has those four values |
| C18 | Group `musicXOffset` 25, `musicYOffset` 40, two blocks | Both annotations have `translateX` 25 and `translateY` -40; offsets -12/-30 give -12/30; offsets 0/0 give 0/0 (not -0); values survive save and reload |
| C18b | Same, but the group is in a part's list and is the only source | Annotation offsets carried as in C18 |

## 2. Text block dialog contract

`textBlock.vue`, non-editing view:

- No control labelled "Attach to Selection" is rendered.
- Font, page behavior, X/Y position, edit-text and move-text controls are present and behave as before.
- Changing page behavior sets `pagination` and does not read or write `attachToSelector`, `selector`, `musicXOffset` or `musicYOffset`.
- A text group committed from this dialog has `attachToSelector === false`.
