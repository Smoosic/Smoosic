# Quickstart: Validating Multimeasure Rest Splitting

Contract cases are in [contracts/grouping-contract.md](./contracts/grouping-contract.md); structures and the algorithm are in [data-model.md](./data-model.md).

## 1. Headless regression test

```bash
npm run test:multimeasure-rest
```

Expected: every case G1 to G24 prints `PASS`, the run ends with `all checks passed`, and the exit code is 0.

## 2. Type check, build, existing tests

```bash
npx tsc --noEmit -p tsconfig.json
npm run build
npm run test:select-voice
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

Prerequisite: build and open the app. Make a score with a single staff and 12 empty measures, then create a part for the staff (Parts menu) and show the part, so multimeasure rests are on (the part's "Expand Multimeasure Rests" is off).

1. With no markings, the part shows one multimeasure rest numbered 12.
2. Put a rehearsal mark on measure 6: the part now shows a rest of 5, then a rest of 7 with the mark above it. There is no single bar between them.
3. Move the mark to measure 1, then to measure 12: the rest is one block of 12, then a block of 11 plus a single ordinary bar with the mark.
4. Remove the mark: back to one rest of 12, with nothing left over.
5. Change the key signature at measure 5: a rest of 4, then a rest of 8 that begins with the new key signature. Repeat with the time signature, and with a displayed tempo change (the tempo shows over the second rest).
6. Put a D.S. al Coda on measure 4 and a Coda sign on measure 9: the first rest is measures 1 to 4 with the D.S. al Coda shown over it; measures 5 to 8 are a rest of 4; measures 9 to 12 are a rest of 4 with the Coda sign at its start, after the barline.
7. Set an end-repeat barline at the end of measure 4: the first rest ends with the repeat barline. Set a start-repeat on measure 5 instead: the second rest begins with it. Neither barline is drawn twice.
8. Put a rehearsal mark and a D.S. on the same measure: that measure is a single ordinary bar with both, between two rests.
9. Add a second staff to the part (include the next stave): both staves show the same grouping.
10. Turn on "Expand Multimeasure Rests" in Part Properties: every measure appears individually.
11. Print preview: same grouping as on screen.
12. Check which of the edits above regroup immediately (a full layout) and which only after the part is shown again; note any that do not.
