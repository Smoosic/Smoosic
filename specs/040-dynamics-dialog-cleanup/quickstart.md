# Quickstart: Validating the Dynamics Dialog Cleanup

## 1. Headless checks

```text
npm run test:dynamics-font-size
```

Expected: every case in [contracts/dynamics-dialog.md](contracts/dynamics-dialog.md) (M, S and A cases) prints `PASS` and the script exits 0.

Also run suites that touch notes and serialization, to check nothing regressed:

```text
npm run test:score-archive
npm run test:paste-special
npm run test:voice-copy-paste
npm run test:quick-beam
```

## 2. Compile and search

```text
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors.

Then check the legacy dialog is gone (contract cases C1 to C4 and C8):

```text
git ls-files src/ui/dialogs/dynamics.ts
git grep -n "SuiDynamicDialogAdapter\|dialogs/dynamics'" -- src tests types
```

Expected: both print nothing.

Compile the component with Vue's own compiler (it is not covered by `tsc`):

```text
node -e "const s=require('@vue/compiler-sfc'),f=require('fs');const {descriptor,errors}=s.parse(f.readFileSync('src/ui/components/dialogs/dynamics.vue','utf8'));console.log('parse errors',errors.length);s.compileScript(descriptor,{id:'x',inlineTemplate:true});console.log('ok')"
```

Expected: `parse errors 0` and `ok`.

## 3. Manual: font size (spec user story 1)

1. Open a score, select a note, and choose Text, then **Dynamics**. If the note had no marking, a default one is added.
2. In the dialog, Font Size shows 30. Press the up arrow a few times, or type 48.
3. Expected: the marking on the score gets bigger as you change it, and the dialog stays open.
4. Press OK. Expected: the marking stays at the new size.
5. Save the score, reload it. Expected: the marking is still the larger size.
6. Reopen the dialog and type 0, then 150. Expected: the field stays between 1 and 99 and the marking never gets an out-of-range size.
7. Select three notes, open the dialog, set Font Size to 20. Expected: all three markings change.
8. Change the size, then press Cancel. Expected: the markings return to their old size.
9. Open a score saved before this feature. Expected: the markings look the same as before.

## 4. Manual: everything else still works (user story 2)

1. Open the dialog on one note. Change the dynamic (for example to *ff*), Y Line, Y Offset Px and X Offset. Expected: each shows on the score at once.
2. Select several notes and repeat. Expected: all the selected markings change together.
3. Make several changes, press Cancel. Expected: every change is undone, on every selected note.
4. Make several changes, press OK, then choose Undo once. Expected: all the changes from that dialog are undone together.
5. Press Remove. Expected: the marking is gone from every selected note.
6. Click a dynamic marking on the score so the marking itself is selected, then open its properties. Expected: the dialog edits that marking.
7. Open the dialog. Expected: it appears next to the marking.

## 5. Manual: the application starts and the dialog opens by name

Build the application and open it. Expected: no console errors on load, and the Dynamics dialog opens from the Text menu and by selecting a marking (which goes through the dialog factory).
