# Data Model: Copy and Paste Voices

All structures are in-memory clipboard state. Nothing is serialized into a score, and no saved format changes (constitution Principle #1).

## VoiceCopy (new, held by `PasteBuffer`)

| Field | Type | Meaning |
|-------|------|---------|
| `voices` | `number[]` | The voice numbers (0 to 3) that were copied, ascending. One entry for a single-voice copy, two or more for All |
| `firstStaff` | `number` | Index of the first copied staff |
| `staffCount` | `number` | Number of consecutive staves copied |
| `firstMeasure` | `number` | Index of the first copied measure (whole measures) |
| `measureCount` | `number` | Number of whole measures copied |
| `notes` | `Record<voice, Record<staff, PasteNote[]>>` | For each copied voice and staff, every note of every copied measure, in order. A measure where the voice does not exist contributes that measure's default rests |
| `modifiers` | `Record<voice, StaffModifierBase[]>` | Staff modifiers (slurs and the like) that start on the copied notes, used only when the voice number is kept |

`PasteNote` is the existing structure (`note`, `selector`, `originalKey`, `tupletStart`). The notes are stored in concert pitch with the original key, exactly like the existing copy.

**Invariants**

- `voices` is non-empty only after a successful voice copy; any new copy (voice copy or normal copy) clears the previous voice copy.
- Each voice's note list covers exactly `measureCount` whole measures on each copied staff (the total ticks of a voice equal the sum of the copied measures' lengths).
- At most 4 voices.

## Choice functions (pure, static on `PasteBuffer`)

```ts
copyVoiceChoices(voicesInSelection: number): Array<number | 'all'>
// 0 -> []; 1 -> [0]; n>1 -> [0 .. n-1, 'all']

pasteVoiceChoices(copiedVoices: number[], destVoiceCount: number): Array<number | 'all' | 'new'>
// no copy, or no destination (count 0) -> []
// one voice copied      -> [0 .. count-1], plus 'new' if count < 4   (existing voices to replace, and a new voice)
// several voices copied -> ['all']
```

## PasteBuffer additions

| Member | Meaning |
|--------|---------|
| `voiceCopy: VoiceCopy \| null` | The current voice copy, or null |
| `setVoiceSelections(score, selections, voice)` | Build a voice copy from selections: whole measures, one voice or `'all'`. Returns false if nothing could be copied |
| `pasteVoice(destination, voice)` | Paste a single-voice copy into destination voice `voice` (0 to 3) at tick 0 of `destination.measure`, on `staffCount` staves from `destination.staff`. Returns the measures affected |
| `pasteAllVoices(destination)` | Paste a multi-voice copy, each voice into the voice of the same number |
| `hasVoiceCopy()`, `copiedVoiceNumbers()`, `getVoiceCopyTickCount()` | Queries used by the menus and the view to compute undo ranges |

## View additions (`SuiScoreViewOperations`)

| Method | Meaning |
|--------|---------|
| `copyVoices(voice: number \| 'all')` | Copy from the tracker selection, mapped to the store score |
| `pasteVoices(voice: number | 'all' | 'new')` | Paste at the tracker selection with one grouped undo; 'new' pastes a single copied voice into voice number `getDestinationVoiceCount()` |
| `getSelectionVoiceCount()` | Highest voice count among the selected measures, for Copy Voices choices |
| `getDestinationVoiceCount()` | The most voices in any destination measure the paste would cover (on the copied number of staves), for Paste Voice choices; the 'new' voice number is this count |

## State transitions

| Event | Effect on `voiceCopy` |
|-------|----------------------|
| Copy Voices | replaced |
| Existing Copy (`setSelections`) | cleared, so Paste Voice is not offered for stale music |
| Paste Voice (any) | unchanged (pasteable repeatedly) |
| Loading a new score | cleared (the buffer is tied to the score it was copied from) |
