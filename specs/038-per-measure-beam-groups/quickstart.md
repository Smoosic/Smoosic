# Quickstart: Validating Per-Measure Beam Groups

## 1. Headless checks

```text
npm run test:beam-groups
```

Expected: every case in [contracts/beam-groups-api.md](contracts/beam-groups-api.md) prints `PASS` and the script exits 0.

Also run the suites that touch beaming and measure data, to check nothing regressed:

```text
npm run test:beam-dotted
npm run test:paste-special
npm run test:score-archive
npm run test:create-part
```

## 2. Compile

```text
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

## 3. Manual: 3 + 2 in 5/8 (spec user story 1)

1. Start a score, change the time signature to 5/8, and enter ten eighth notes (two measures).
2. Select the first measure, open the Beams menu, choose **Beam Groups**.
3. Press **Add group** twice, set Group 1 to 3 and Group 2 to 2, leave Apply To as **Selected measures**, press OK.
4. Expected: the first measure beams 3 then 2. The second measure beams as it did before.
5. Undo. Expected: the first measure returns to its old beaming in one step.

## 4. Manual: compound meter and the whole score (user stories 2 and 3)

1. Change to 12/8, enter twelve eighth notes in a measure, open **Beam Groups**, press **Add group** once, set Group 1 to 3, choose **Whole score**.
2. Expected: four groups of three, in every measure of the score.
3. Open the dialog again, press **Clear**, choose **Whole score**, OK. Expected: every measure returns to the standard grouping for its meter.
4. In a 10/8 measure add two groups, 3 and 2. Expected: 3 + 2 + 3 + 2.

## 5. Manual: adding and removing groups

Open the dialog on a measure with no grouping. Expected: no groups are shown, with the note "Default for the meter". Press **Add group** three times: the first group is 3 and the next two copy the last. Remove the middle group: the labels renumber and the other two keep their numbers. Try to type 0 or 9 in a group: it is brought back into 1 to 4. Press **Clear**: no groups remain.

## 6. Manual: saving

Set a grouping, save the score as JSON, reload it. Expected: the grouping shows in the dialog and the beams are unchanged. Open a score saved before this feature. Expected: the beams are identical to the previous version.

## 7. Manual: hand beams

In a grouped measure, select notes 2 to 4 and use **Beam Selections**. Expected: those notes stay beamed together across the boundary. Note: applying a grouping to a measure replaces any hand-placed beams in it.
