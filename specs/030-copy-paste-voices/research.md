# Research: Copy and Paste Voices

No NEEDS CLARIFICATION items remained after the spec. Findings from reading the code:

## 1. How the current copy and paste work

**Finding**: `PasteBuffer.setSelections` records the selected notes as `PasteNote`s (a cloned note in concert pitch, its source selector, its original key and, for a tuplet start, a cloned tuplet tree) in `notes[staff]`, plus staff modifiers that start on the selection. `pasteSelections` → `pasteIntoScore` loops the copied staves, then `pasteNoteSelections(selector, notes)`:

1. `_populateMeasureArray` clones the destination measure(s) the notes will cover, extending to following measures as the notes overrun, and aligns voices (`_alignVoices`).
2. `_populateVoice` builds the new note lists per measure, creating any missing voice with default rests (`SmoMeasure.getDefaultNotes`) before filling it, and `_populatePost` keeps the existing notes after the end of the paste.
3. Each rebuilt measure is serialized, the destination voice replaced (`_pasteVoiceSer`, which also appends a missing voice), and swapped into the score.

**Consequence for this feature**: Replacing a voice, creating a missing voice for every measure it covers, splitting music that overruns a measure, and stopping at the end of the score (the loop only continues while `SmoSelection.measureSelection` finds a next measure) are all already handled. A voice paste can reuse `pasteNoteSelections` unchanged, called once per voice and staff, with the destination voice number placed in the selector and the notes placed from tick 0.

## 2. Flaw: the destination voice is overridden

**Finding**: In `pasteNoteSelections`:

```ts
const maxCutVoice = notes.map(n => n.selector.voice).reduce((a, b) => a > b ? a : b);
const minCutVoice = notes.map(n => n.selector.voice).reduce((a, b) => a > b ? a : b);   // same as max
if (minCutVoice === maxCutVoice && minCutVoice > selector.voice) { selector.voice = minCutVoice; }
```

`minCutVoice` is computed with the same comparison as the max, so the two are always equal, and the destination voice is always raised to the copied notes' voice number. (`pasteIntoScore` also builds its working selector with voice 0, so today a paste always goes into the copied voice.) That rule would make "copy voice 2, paste into voice 1" impossible.

**Decision**: Do not change this code. For a voice paste, hand `pasteNoteSelections` copies of the notes whose selector voice already equals the chosen destination voice (and whose tuplet tree voice is set to match), so the rule is a no-op. The existing Copy and Paste keep their current behavior exactly.

## 3. Flaw: middle-measure tuplets of every voice are cleared

**Finding**: In `_populateMeasureArray`, for a paste covering more than two measures:

```ts
for (let i = 1; i < this.measures.length - 2; i++) { this.measures[i].tupletTrees = []; }
```

`tupletTrees` holds the trees of all voices in the measure, so a paste into one voice wipes the tuplet definitions of the other voices in the middle measures, leaving their notes marked as tuplets with no tree. The loop bound also skips the second-to-last measure (`length - 2`), leaving stale trees of the destination voice there.

**Decision**: Change the loop to run to the second-to-last measure inclusive (`i < length - 1`) and remove only the trees of the destination voice (`tree.voice === this.destination.voice`). For the existing Copy and Paste this keeps other voices' tuplets in middle measures (previously lost) and removes stale destination-voice trees in the second-to-last measure; it never changes the pasted notes. This is a narrow bug fix, covered by test cases.

## 4. Tuplet trees carry a voice number

**Finding**: `SmoTupletTree.voice` identifies the voice a tree belongs to; `adjustTupletIndexes` and `getTupletTreeForNoteIndex` match on it.

**Decision**: When remapping a copied voice to a different destination voice, set the cloned tree's `voice` to the destination voice at paste time, together with the note selector's voice, so the pasted tuplet is registered for the right voice.

## 5. Staff modifiers (slurs, hairpins) when the voice number changes

**Finding**: Modifiers are located by selectors that include the voice (`_findPlacedModifier` compares the end selector to the note's selector), and their span is measured with `SmoSelection.countTickIndices` using the source coordinates.

**Decision**: Carry staff modifiers only when the voice is pasted into the same voice number it was copied from (including every voice of "All"). When the voice number changes, notes and everything attached to the notes themselves (lyrics, chords, dynamics, articulations, tuplets) come along, but staff-spanning modifiers are left behind. This is stated in the spec's assumptions.

## 6. Whole measures

**Finding**: `PasteNote.selector` carries the voice, measure and tick, and the paste starts at `selector.tick` within the first measure.

**Decision**: Copy records, for every selected staff, every note of the chosen voice(s) in every measure from the first to the last selected measure, in order. Paste always calls `pasteNoteSelections` with `tick: 0`. A voice that has no notes in a copied measure contributes that measure's default rests (`SmoMeasure.getDefaultNotes` for its time signature and clef) so later measures stay aligned.

## 7. Menu choices

**Finding**: `SuiConfiguredMenuOption.subMenu` lets an option open a nested list; `menu.vue` filters both levels with `display`, so an option disappears when its `display` returns false (used for the arpeggio and landmark submenus).

**Decision**: Copy Voices and Paste Voice are options with `subMenu` lists of choices (Voice 1 to 4, All). Their `display` functions call pure functions on `PasteBuffer`:

- `copyVoiceChoices(voicesInSelection: number): Array<number | 'all'>`: voices 0 to n-1, plus `'all'` when n > 1.
- `pasteVoiceChoices(copiedVoices: number[], destVoiceCount: number): Array<number | 'all' | 'new'>`: nothing if no voice copy exists or there is no destination; for one copied voice, each existing destination voice (to replace it) and `'new'` (a new voice after the existing ones) unless the destination already has four voices; for several copied voices, `'all'` only (FR-006). `'new'` is a separate, always-visible choice instead of an extra numbered entry, so adding a voice never depends on counting.

This is how the two kinds of copy map to the two kinds of paste: Copy Voices > Voice N makes a single-voice copy, which is pasted into a chosen voice; Copy Voices > All makes a multi-voice copy, which is pasted with All (each voice into the voice of the same number). A per-voice paste of a multi-voice copy has no clear meaning, so it is not offered. The spec's FR-006 and assumptions were updated to say so.

## 8. Undo and redraw

**Finding**: The existing `paste` records `_undoColumn('paste', i)` for each affected measure inside one grouped undo, unrenders those columns, pastes, then calls `replaceMeasureView(range)`. The affected measure range is computed from the tick length of the buffer.

**Decision**: `pasteVoices` follows the same pattern. The affected range is the destination measure through the last measure needed to hold the copied ticks, found by adding up destination measure lengths (as `getPasteMeasureList` does), never past the last measure. Created voices are part of the measure state, so one undo removes them.

## 9. Part view

**Finding**: In part view, `copy` maps tracker selections to store-score selections (`_getEquivalentSelection`) and pastes into the store score, then refreshes the displayed measures.

**Decision**: Voice copy and paste use the same mapping.
