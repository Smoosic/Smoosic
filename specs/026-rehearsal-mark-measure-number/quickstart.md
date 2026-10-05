# Quickstart: Validating Measure-Number Rehearsal Marks

Prerequisites: `npm install` done; repo on the feature branch.

## 1. Headless logic test

```text
npm run test:rehearsal-measure-number
```

Expected: all checks print `PASS`, covering (see [data-model.md](data-model.md), [contracts/rehearsal-mark-text.md](contracts/rehearsal-mark-text.md)):

- measure-number text equals `displayMeasure + 1`, including a renumbered score
- other styles still return the stored symbol
- serialize → deserialize keeps `cardinality: 'measureNumber'`
- a legacy mark (no `measureNumber`) loads unchanged
- adding/removing letter-style marks does not alter a `measureNumber` mark's text or stored symbol, and vice versa

## 2. Type check / build

```text
npm run build
```

Expected: no TypeScript errors.

## 3. Manual check in the app

1. Open a score with 20+ measures; add a rehearsal mark on measure 17 (default shows `A`).
2. Select the mark → dialog opens → Numbering → **Measure number**. Mark shows `17`, and the box you click matches the glyph.
3. Cancel the dialog → mark returns to `A`. Re-do and OK → stays `17`.
4. Insert a measure before it → mark shows `18`. (Confirms measures after an insertion are re-rendered; if it stays `17`, see research.md §5.)
5. Add a letter mark on another measure and another before it → measure-number mark unaffected; letter marks still auto-advance.
6. Save and reload the score → style and number preserved.
7. Export MusicXML → rehearsal text is `17`.

Regression: a score with only letter/number marks renders identically to `main`.
