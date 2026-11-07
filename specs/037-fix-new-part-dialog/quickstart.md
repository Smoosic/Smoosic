# Quickstart: Validating the Create Part Fixes

## 1. Headless checks

```text
npm run test:create-part
```

Expected: every case in [contracts/create-part-api.md](contracts/create-part-api.md) prints `PASS` and the script exits 0.

Also run the suites that touch staves and parts, to check nothing regressed:

```text
npm run test:select-voice
npm run test:paste-special
npm run test:score-archive
```

## 2. Compile

```text
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

## 3. Manual: location

Start from a score with three staves, A, B and C.

1. Open the part menu > **Create New Part/Stave**. The title is **Create Part**.
2. Staff Location shows 4. Press OK. The new part is below C.
3. Undo (one step). Open the dialog, set Staff Location to 1, press OK. The new part is above A.
4. Undo. Set Staff Location to 2. The new part is between A and B, and A, B and C kept their music and any slurs or hairpins.
5. Try 0 and 9 in Staff Location: they become 1 and 4.

## 4. Manual: two-stave parts

1. Create a 2-stave part (use the **2-stave part** toggle) at location 2, so you have A, P1, P2, B, C.
2. Open the dialog again and set Staff Location to 3 (between P1 and P2). Press OK. The new part is below P2, and P1 and P2 are still together, with their brace.
3. Set Staff Location to 2 (before P1). The new part is above P1.
4. With the 2-stave toggle on in the new dialog and a location inside the existing 2-stave part, both new staves land together, after the existing part.

## 5. Manual: name and abbreviation

1. Open the dialog, choose **Cello**. Name shows "Cello" as placeholder text. Press OK. Open Part Properties: the part is named Cello, abbreviation empty.
2. Create another, type Name "Cello I" and Abbreviation "Vc. I", press OK. Part Properties shows both.
3. Create a third and change the instrument after leaving Name empty. The placeholder follows the instrument.

## 6. Manual: Preserve Text Groups

1. Create a part with the dialog. Part Properties shows **Preserve Text Groups** on. Switch it off, press OK, reopen: it stays off.
2. Add a staff another way (or open an older score). Its **Preserve Text Groups** is off, as before.

## 7. Manual: undo and cancel

1. Create a 2-stave part and press Undo once. Both staves are gone.
2. Open the dialog, change things, press Cancel. The score is unchanged.
