# Quickstart: Validating the Promise Helper Removal

Contract cases are in [contracts/public-api-contract.md](./contracts/public-api-contract.md); the list of changed sites is in [data-model.md](./data-model.md).

## 1. Headless guard and retained-class test

```bash
npm run test:promise-helpers
```

Expected: every case prints `PASS` and the run ends with `all checks passed`. Before the edits are made, cases P1 and P2 fail and name the files that still use the helper, which is how to confirm the guard works.

## 2. Type check and build

```bash
npx tsc --noEmit -p tsconfig.json
npm run build
```

Expected: no errors and no new warnings.

## 3. Existing tests still pass

```bash
npm run test:score-change-state
npm run test:page-divisions
npm run test:global-layout-reposition
npm run test:text-drag-placement
npm run test:attached-text
npm run test:rehearsal-measure-number
```

## 4. Manual pass in the app

Prerequisite: build and open the app. Keep the browser console open and watch for errors throughout.

**Rendering waits**
1. Open the app: the score appears with no console errors.
2. Add notes, delete a measure (Measure menu), remove an instrument when more than one exists, and undo: each completes and the score redraws correctly.
3. Change the layout in the Score Layout dialog and apply: pages re-render and nothing flickers.
4. File > New, File > Open a score file, and load a score from the Music Library: each loads and displays.

**Dialogs that changed (commit and remove paths)**
5. Open and OK each of: tempo, slur, hairpin, dynamics, tie, volta (ending), text bracket, and audio settings. Each applies and closes.
6. Cancel and Remove from those dialogs that offer them (hairpin, text bracket, slur): each behaves as before.

**Edits that exit early**
7. With nothing selected, trigger beam direction toggle: no error and no change.
8. With a single-measure score, use Delete Measure; with a single instrument, use Remove Instrument: nothing is deleted and nothing throws.
9. Use Remove Lyric and Remove Annotation on a note that has none: no error.

**Startup**
10. Reload the page: the score from the previous session (or the default score) loads as before.
