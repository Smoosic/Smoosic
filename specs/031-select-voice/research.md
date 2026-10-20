# Research: Select Voice

No NEEDS CLARIFICATION items remained after the spec. Findings from reading the code:

## 1. `selectActiveVoice` cannot be reused

**Finding**: `SuiTracker.selectActiveVoice()` takes `this.selections[0]`, changes its voice to the measure's active voice and replaces the whole selection with that one note (`_getClosestTick`). It is for the single-note case after the Voices menu or a click. It cannot build a range, ignores the other selected measures, and `_getClosestTick` falls back to the first note of the measure (or the first note anywhere) when the exact note is not mapped, which would select the wrong notes.

**Decision**: Add a new tracker method, `selectVoice(voice)`, and do not touch `selectActiveVoice`.

## 2. How rendered selections are found

**Finding**: Highlighting (`highlightSelection`) draws the union of each selection's `box` and returns early if the first selection has no box. Rendered `SmoSelection` objects, with boxes, are held in `measureNoteMap`, keyed by `SmoSelector.getNoteKey` (`staff-measure-voice-tick`). `SmoSelection.noteSelection(score, ...)` builds a selection without boxes.

**Decision**: The pure function returns selectors. The tracker turns each into a rendered selection with a direct `measureNoteMap[SmoSelector.getNoteKey(selector)]` lookup (O(1) per note), skipping any note that is not currently mapped (for example a measure that has not been rendered). It does not use `_getClosestTick`, so a missing note is skipped, not replaced by a nearby one.

## 3. What counts as "the selected measures"

**Finding**: `tracker.getSelectedMeasures()` collapses selections to one entry per measure *index* regardless of staff; the Select Voice rule needs staff-aware pairs because a multi-staff selection can cover measure 3 on staff 0 and staff 1 independently, and a voice may exist on one and not the other.

**Decision**: The pure functions work on unique `(staff, measure)` pairs taken from the current selections. Every note of the chosen voice in each pair's measure is selected (FR-004, FR-005); a measure that lacks the voice contributes nothing and is never given the voice (FR-007).

## 4. The choice rule

**Finding**: Voices in a measure are contiguous (a measure with voice index 2 also has 0 and 1; `populateVoice` only appends).

**Decision**: Let `maxVoices` be the largest `voices.length` among the selected `(staff, measure)` pairs, capped at 4. `voiceChoices` returns `[]` when `maxVoices < 2` (FR-003) and `[0 .. maxVoices - 1]` otherwise. Every listed voice therefore exists in at least one selected measure (FR-002), and a "no notes" result is only possible if the voice's notes list is empty, handled by FR-008.

## 5. No-op rule

**Decision**: If `getVoiceSelectors` returns no selectors, or none of them is currently mapped to a rendered note, `selectVoice` returns false and leaves `this.selections`, the pitch index, the modifier selection and the highlight untouched (FR-008).

## 6. Active voice

**Finding**: Selecting a single note with `selectSuggestion` calls `selection.measure.setActiveVoice(selection.selector.voice)`, so the keyboard-entry voice follows the selection. `setActiveVoice` is a measure property that is serialized with the measure, but it is not recorded in undo and `selectSuggestion` already changes it on every click.

**Decision**: After a successful selection, call `measure.setActiveVoice(voice)` on each selected measure that has the voice, so the voice highlight and the keyboard entry agree with the selection. This is not an undoable edit (FR-009) and uses the same mechanism as clicking a note.

## 7. Highlighting

**Finding**: With more than one selection the highlighter sorts `selections` (staff, measure, voice, tick), unions boxes that are on the same staff and line, and draws the union rectangles. A single voice's notes in a measure are non-contiguous in screen position only when interleaved with the other voice's notes, which is already how a multi-voice selection is drawn.

**Decision**: Reuse the existing highlight path (`deferHighlight`). Also refresh the local modifier list the way `selectSuggestion` does (`_createLocalModifiersList`) and reset the pitch index.

## 8. Menu

**Finding**: Submenu items and the parent are filtered with `display` (`menu.vue`); the Copy Voices option already uses this pattern.

**Decision**: A Select Voice option whose `display` is `voiceChoices(...).length > 0` and a `subMenu` of four voice choices each displayed only when its index is in the list. It is placed after the Paste Voice option in the Edit menu. No keyboard shortcut (spec assumption).

## 9. Existing Voices menu

**Finding**: The Voices menu's `selectVoiceMenuOption` calls `populateVoice`, which creates a missing voice, sets the active voice for the selected measures and (through `selectActiveVoice`) selects that voice's note.

**Decision**: Leave it unchanged (FR-011). Select Voice never calls `populateVoice` and never adds voices.
