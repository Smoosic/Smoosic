# Quickstart: Validating the Unsaved Changes Indicator

Contract cases are in [contracts/score-change-contract.md](./contracts/score-change-contract.md); state and transitions are in [data-model.md](./data-model.md).

## 1. Headless regression test

```bash
npm run test:score-change-state
```

Expected: every case S1 to S14 prints `PASS`, the run ends with `all checks passed`, and the exit code is 0.

## 2. Type check and build

```bash
npx tsc --noEmit -p tsconfig.json
npm run build
```

Expected: no errors; the webpack build completes.

## 3. Existing tests still pass

```bash
npm run test:page-divisions
npm run test:global-layout-reposition
npm run test:text-drag-placement
npm run test:attached-text
npm run test:rehearsal-measure-number
```

## 4. Manual check in the app

Prerequisite: build and open the app.

**Header**
1. Open the app. The sidebar header reads `Smoosic <score name>` with no asterisk.
2. Add a note. An asterisk appears after the name.
3. Add or edit a text block (title, annotation). The asterisk appears (text edits record undo through a different code path than note edits, so check them separately).
4. Select notes, scroll and zoom. No asterisk appears on an unchanged score.
5. Open the score information dialog and change the name. The header shows the new name.

**Saving**
6. With an asterisk showing, File > Save, choose Smoosic format, Save. The asterisk clears.
7. Make an edit, then File > Save, choose MusicXML, Save. The asterisk stays.
8. Make an edit, then Quick Save. The asterisk clears.

**Prompt**
9. Make an edit. File > New. The prompt appears. Choose Cancel: nothing changes. Repeat and choose Don't save: a new default score loads with no asterisk.
10. Make an edit. File > Open, pick a file. After the Open dialog closes the prompt appears. Choose Save, save in Smoosic format: the file then loads.
11. Make an edit. File > Open, pick a file, prompt, Save, export MusicXML: the prompt appears again and the file is not loaded. Then choose Cancel to stay.
12. Make an edit. Open the Music Library and load a score: the same prompt appears after the library closes.
13. Open the Open dialog and cancel it. No prompt appears.
14. With no edits since loading, File > Open and load a file. No prompt appears.
