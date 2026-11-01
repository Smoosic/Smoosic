# Quickstart: Validating Paste Special

## Prerequisites

- `npm install` done at the repository root.
- For the manual checks, a built application or the development page you normally use.

## Automated check

```bash
npm run test:paste-special
```

Expected: every line prints `PASS`, exit code 0. See [contracts/paste-special-api.md](contracts/paste-special-api.md) for the invariants and [data-model.md](data-model.md) for the shapes.

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Each kind alone (six runs), same rhythm | Only that kind arrives on the destination; others untouched |
| 2 | All six ticked | All arrive |
| 3 | Pitches, durations, note types before and after | Identical |
| 4 | Replace over existing articulations; copied note has none | Destination left with none |
| 5 | Add over existing articulations | Destination keeps its own and gains the copied ones |
| 6 | Add: dynamic over existing dynamic; same-verse lyric over same-verse lyric | Pasted one wins, never two |
| 7 | 4 quarters (lyrics 1-4) onto 8 eighths | Lyrics land on eighths 1, 3, 5, 7; 2, 4, 6, 8 unchanged |
| 8 | 2 quarters onto whole notes in two measures | First to measure 1's note, second to measure 2's note |
| 9 | 4 copied quarters onto half, quarter, quarter | Pairing is destination notes 1, 2, 2, 3 (by position); the 2nd quarter gets copied notes 2 and 3 together; later dynamic and same-verse lyric win |
| 10 | Copy longer than the destination part | Stops at the end, no error, no notes added |
| 11 | Rests in the copy and in the destination | Aligned by length like notes |
| 12 | 2-measure copy onto 2 following measures | Aligned across the barline |
| 13 | 2-staff copy | Staves pair in order; a missing second staff ends the paste |
| 14 | Chords C, F, G, Am onto a staff transposed up a whole step; and onto a concert-pitch staff in another key | D, G, A, Bm; and unchanged. Lyrics, annotations and the rest identical on both |
| 15 | Dry-run extent vs the measures actually edited | Equal, including case 8 |
| 16 | Edit a pasted marking afterwards | The copied marking is unchanged |
| 17 | Serialize and deserialize the pasted score | Markings survive |
| 18 | `removeAllAnnotations` on a note with lyrics, chords and annotations | Only annotations removed |

## Manual check in the application

1. Put a dynamic, a lyric and an articulation on the notes of staff 1; give staff 2 different pitches.
2. Select staff 1's measures and Copy. Select staff 2's first note.
3. Open the Edit menu: **Paste Special...** is listed and **Paste Chords** is not. With nothing copied (fresh page), Paste Special is not listed.
4. Choose Paste Special. Confirm is disabled. Turn on **Dynamics** only; confirm is enabled. Confirm. Staff 2 shows staff 1's dynamics and nothing else changed.
5. Undo once: staff 2 is as before.
6. Repeat with **Replace existing** off and staff 2 already holding its own dynamics: it keeps and gains.
7. Paste lyrics from a quarter-note line onto an eighth-note line: they land on every other note.
8. Paste chords onto a transposing instrument's part (for example a B-flat clarinet): names are spelled for it. Onto a concert-pitch part in another key they are unchanged.
9. Cancel the dialog: nothing changes.

## Regression

Run the other `test:*` scripts in `package.json` to confirm nothing else changed.
