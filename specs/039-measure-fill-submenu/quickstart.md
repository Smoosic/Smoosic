# Quickstart: Validating the Measure Fill Submenu

## 1. Headless checks

```text
npm run test:measure-fill
```

Expected: every case in [contracts/measure-fill-api.md](contracts/measure-fill-api.md) prints `PASS` and the script exits 0.

Also run the suites that touch measures and serialization, to check nothing regressed:

```text
npm run test:beam-groups
npm run test:quick-beam
npm run test:score-archive
npm run test:paste-special
npm run test:multimeasure-rest
```

## 2. Compile

```text
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

## 3. Manual: Whole Rest (spec user story 1)

1. Open a score in 4/4 with notes in measure 1. Select measure 1, open the Measure menu, choose **Fill Measures**, then **Whole Rest**.
2. Expected: measure 1 holds one whole rest and no notes. The key, clef and barlines are unchanged.
3. Change measure 2 to 5/8, enter notes, and choose **Whole Rest**. Expected: a half rest and an eighth rest.
4. Use Undo. Expected: the notes in measure 2 come back in one step.

## 4. Manual: Beats (user story 2)

Choose **Beats** on measures in 4/4, 3/4, 6/8 and 12/8.

Expected: four quarter rests, three quarter rests, two dotted quarter rests, and four dotted quarter rests. In 5/8, two quarter rests and an eighth rest.

## 5. Manual: Eighth Rests (user story 3)

Choose **Eighth Rests** on measures in 4/4, 6/8 and 5/8.

Expected: eight, six and five eighth rests. In 5/16, two eighth rests and a sixteenth rest (a full measure).

## 6. Manual: several measures, voices, markings (user story 4)

1. In a two-staff score, select measures 2 to 5 of the lower staff only and choose **Beats**. Expected: only those four measures change; the upper staff is untouched.
2. Put two voices in a measure (the Voice commands), add a slur from that measure to the next, and add a lyric. Choose **Whole Rest**. Expected: one voice of rests; the slur and lyric are gone.
3. Draw a hairpin from measure 1 to measure 4, and fill measure 2. Expected: the hairpin is still there.
4. Select measures in 4/4 and 6/8 together and choose **Beats**. Expected: each measure uses its own meter.
5. Undo once after each. Expected: everything comes back, including the second voice, the slur and the lyric.

## 7. Manual: saving

Fill some measures, save the score as JSON, reload it. Expected: the rests are the same. Open a score saved before this feature. Expected: no change.

## 8. Manual: nothing selected

Clear the selection if the editor allows it. Expected: **Fill Measures** is not offered.
