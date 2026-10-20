# Quickstart: Validating Select Voice

Contract cases are in [contracts/select-voice-contract.md](./contracts/select-voice-contract.md); structures are in [data-model.md](./data-model.md).

## 1. Headless regression test

```bash
npm run test:select-voice
```

Expected: every case S1 to S16 prints `PASS`, the run ends with `all checks passed`, and the exit code is 0.

## 2. Type check, build, existing tests

```bash
npx tsc --noEmit -p tsconfig.json
npm run build
npm run test:voice-copy-paste
npm run test:promise-helpers
npm run test:score-change-state
npm run test:page-divisions
npm run test:global-layout-reposition
npm run test:text-drag-placement
npm run test:attached-text
npm run test:rehearsal-measure-number
```

Expected: no errors; all scripts pass.

## 3. Manual check in the app

Prerequisite: build and open the app. Make a score with at least four measures. Give measures 1 to 3 two voices (use the Voices menu), with different numbers of notes in the two voices in one of them (for example a whole note in voice 2 under four quarters in voice 1). Leave measure 4 with one voice.

1. Select a note in measure 4 (one voice) and open the Edit menu: there is no Select Voice entry.
2. Select a single note in measure 1 and open Edit > Select Voice: Voice 1 and Voice 2 are offered, no others.
3. Choose Voice 2: all the notes of voice 2 in measure 1 are highlighted (including a long note that does not line up with the original selection), and no voice 1 note is.
4. Select measures 1 to 3 (drag or Shift+arrow), choose Select Voice > Voice 2, then press the up arrow: only voice 2 notes change pitch.
5. Select measures 1 to 4, choose Select Voice > Voice 2: the voice 2 notes of measures 1 to 3 are selected; measure 4 contributes nothing.
6. Select Voice 1, then Voice 2, then Voice 1 again several times, then choose Edit > Undo: the undo applies to your last edit, not to the selections.
7. With two staves selected over the same measure, choose Select Voice > Voice 1: voice 1 is selected on both staves.
8. Open the Voices menu and use its Voice N entries: it behaves as before (it can create a voice).
9. After Select Voice, use the arrow keys to move: navigation continues from the selection.
10. Expose a part (part view) and repeat step 3.
