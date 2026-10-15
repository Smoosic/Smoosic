# Quickstart: Validating Copy and Paste Voices

Contract cases are in [contracts/voice-copy-paste-contract.md](./contracts/voice-copy-paste-contract.md); structures are in [data-model.md](./data-model.md).

## 1. Headless regression test

```bash
npm run test:voice-copy-paste
```

Expected: every case V1 to V20 prints `PASS`, the run ends with `all checks passed`, and the exit code is 0.

## 2. Type check, build, and existing tests

```bash
npx tsc --noEmit -p tsconfig.json
npm run build
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

Prerequisite: build and open the app. Make a score of about 12 measures: voice 1 on every measure, voice 2 on measures 1 to 4 (use the Voices menu to add voice 2 and enter notes), and one measure with a triplet.

**Menus**
1. Edit menu: Copy, Paste, Paste Chords, Copy Voices, Paste Voice and Undo are present (Paste Voice only after a Copy Voices).
2. Select notes in a one-voice measure: Edit > Copy Voices offers Voice 1 only. Select in measures 1 to 4: it offers Voice 1, Voice 2 and All.

**Copy all, paste all**
3. Select two notes in the middle of measure 2 and one in measure 3. Edit > Copy Voices > All. Click a note in the middle of measure 8. Edit > Paste Voice > All. Measures 8 and 9 show both voices from measures 2 and 3; the paste started at the beginning of measure 8.
4. Edit > Undo once: measures 8 and 9 are back as they were, including the removal of any voice the paste created.

**Single voice**
5. Select measure 1, Copy Voices > Voice 1. Click measure 10 (one voice). Paste Voice offers Voice 1 and New Voice. Choose New Voice: measure 10 gets a second voice with the copied notes, voice 1 unchanged. On a measure with four voices, New Voice is not offered.
6. Copy Voices > Voice 2 on measure 1, then Paste Voice > Voice 1 on measure 11: voice 1 of measure 11 now holds the copied notes.
7. Paste again at another measure with the same copy: it works (the copy stays).

**Edges**
8. Copy 4 measures, paste with the destination at the second-to-last measure: only the measures that exist are filled; no error.
9. Copy the measure with the triplet and paste it: the triplet is intact.
10. Use plain Copy and Paste on a selection: the same behavior as before.
11. Expose a part (part view) and repeat step 3.
