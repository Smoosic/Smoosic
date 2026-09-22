# Quickstart: Validating Attached-Text Conversion

Behavior to check is defined in [contracts/conversion-contract.md](./contracts/conversion-contract.md); the field mapping is in [data-model.md](./data-model.md).

## Prerequisites

- Node deps installed (`npm install`).
- This feature's branch checked out.
- A legacy score containing note-attached text: either a saved `.json` score from before this change, or one made on `main` with a text block whose "Attach to Selection" toggle is on (repeat with multiple blocks, and with a part that has "Preserve Text Groups" on).

## 1. Headless conversion test (contract cases C1-C18)

```sh
npm run test:attached-text
```

`package.json` runs `tests/attachedTextMigration.ts` with `ts-node` (`-T`, CommonJS module override, because `tsconfig.json` uses `esnext`). **Expect**: every case prints a pass line and the process exits 0; any failure prints the case number and a non-zero exit.

## 2. Build

```sh
npm run build
```

**Expect**: build completes with no TypeScript errors; `textBlock.vue` no longer references `toggle`.

## 3. Open a legacy score in the app

```sh
npm run server
```

1. Open the legacy score with attached text (Scenario prerequisite above).
2. **Expect**: the text shows next to the same note as an annotation. With multiple blocks, one annotation per block. If the original text had been nudged (for example, moved down and right), the annotation is nudged by the same amount in the same direction; open its dialog and the X/Y offset fields show the carried-over values (Y is up-positive there, so a downward nudge shows as negative).
3. Select that note and open Text -> Annotation. **Expect**: the Annotation dialog opens and lists the converted annotation(s) by index.
4. Save the score, reload it. **Expect**: same annotations, none duplicated.
5. Open the part that preserved the attached text (if the score has one). **Expect**: the annotation appears once on the note.
6. Confirm titles, composer and other free text are unchanged.

## 4. Text block dialog

1. Open the text block dialog on any text (add a new text block, or click an existing one) and leave editing mode.
2. **Expect**: no "Attach to Selection" toggle; font, page behavior, X/Y, edit and move controls all work.
3. Change page behavior, commit, reopen. **Expect**: the change stuck and the text isn't attached to any note.

## 5. Regression

Open a score with no attached text (any current demo score). **Expect**: loads and renders as before with no console errors.
