# Quickstart: Preserve Music When Changing Time Signature

Validation guide. The API is in the [contract](contracts/rebar-api.md) and the shapes are in the [data model](data-model.md).

## 1. Automated checks

```text
npx tsc --noEmit -p .
npm run test:rebar-measures
```

Expected: no compiler errors, and every case B1 to B23 in `tests/rebarMeasures.ts` prints `PASS`. Also re-run the suites that share code with this change: `test:paste-special`, `test:voice-copy-paste`, `test:measure-fill`, `test:beam-groups`, `test:score-archive`, `test:time-signature-display`.

## 2. The dialog component compiles

Compile `src/ui/components/dialogs/timeSignature.vue` with `@vue/compiler-sfc` (parse errors 0, compiles).

## 3. Search proves the wiring

- `rebarMeasures` is exported from `src/application/exports.ts` and declared in `types/src/smo/xform/rebar.d.ts`.
- `timeSignature.ts` no longer calls `view.setTimeSignature` from `updateTimeSignatureCb` or `updateApplyTo`; it calls it once, from `commitCb`.

## 4. In the running application (manual)

1. New score, 4/4. Enter eight quarter notes across two measures. Select the first measure.
2. Edit > Time Signature. Change it to 3/4. **The score does not change while the dialog is open.** Preserve music is ticked.
3. Click Cancel. The score is unchanged; Undo has nothing new to undo.
4. Open it again, choose 3/4, click OK. There are three measures of 3/4, the eight quarter notes in order, the last measure two quarters and a quarter rest.
5. Undo once. The two 4/4 measures are back.
6. Repeat with Preserve music unticked. Two measures of 3/4 with three quarters each; the fourth quarter of each is gone.
7. Enter a half note on beat 3 of a 4/4 measure, change to 3/4 with Preserve music ticked. It becomes two tied notes.
8. In a six-measure score, select measures 3 and 4 and change to 3/4 with **Selected Measures**; measures 1, 2, 5 and 6 are untouched (5 and 6 are now later).
9. Add a dynamic and a lyric to a note, a slur across a bar line, and re-bar. They stay on the same notes.
10. Open the dialog on a two-staff score and re-bar. Both staves have the same number of measures.
11. Change only **Display Time Signature**, click OK: nothing moves.
12. Click OK with nothing changed: no undo step is added.
13. Copy some notes, re-bar a time signature, then Paste: the copied notes are still what was copied.
