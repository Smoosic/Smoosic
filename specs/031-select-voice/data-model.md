# Data Model: Select Voice

No persisted data, score structure or undo structure changes (constitution Principle #1). All state is the tracker's current selection.

## Selected measure pair

A `(staff, measure)` pair taken from the current selections. The set of pairs is the set of measures that currently have at least one selected note, on each staff. Order: by staff, then measure.

## Pure functions (static on `SmoSelection`)

```ts
SmoSelection.voiceChoices(score: SmoScore, selections: SmoSelection[]): number[]
// maxVoices = most voices (capped at 4) in any selected (staff, measure) pair
// maxVoices < 2          -> []
// otherwise              -> [0 .. maxVoices - 1]

SmoSelection.getVoiceSelectors(score: SmoScore, selections: SmoSelection[], voice: number): SmoSelector[]
// for each selected (staff, measure) pair, in staff then measure order:
//   if voice < measure.voices.length: one selector per note of that voice, ticks 0..n-1 in order
//   else: nothing (and the voice is never created)
// pitches is [] on every selector (the whole note is selected)
```

Rests are notes of the voice and are included. If `voice` is outside 0 to 3, or the selections list is empty, the result is empty.

## Tracker

| Member | Meaning |
|--------|---------|
| `SuiTracker.selectVoice(voice: number): boolean` | Replace the selection with the rendered notes of the chosen voice in the selected measures. Returns false, changing nothing, if no such notes are found |

Steps on success: `this.selections = mapped`; `pitchIndex = -1`; `measure.setActiveVoice(voice)` for each measure that has the voice; `score.setActiveStaff(first selected staff)`; `_createLocalModifiersList()`; `deferHighlight()`.

## View (`SuiScoreViewOperations`)

| Method | Meaning |
|--------|---------|
| `getSelectVoiceChoices(): number[]` | `SmoSelection.voiceChoices(this.score, this.tracker.selections)`, for the menu |
| `selectVoice(voice: number): Promise<void>` | Calls `tracker.selectVoice(voice)`; no undo, no score change |

## State transitions

| Event | Effect |
|-------|--------|
| Select Voice > Voice N, notes found | selection replaced; active voice of the affected measures set to N |
| Select Voice > Voice N, no notes found | nothing changes |
| Any later selection action | replaces the selection as usual |
