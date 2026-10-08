# Quickstart: Validating Multiple Annotations Per Note

This project has no wired automated test runner (`npm test` is a no-op). Validation is manual, against the dev/demo score app, following the acceptance scenarios in [spec.md](./spec.md). Prerequisite: `017-text-annotations` (the base Annotation feature) is already in place.

## Prerequisites

- Node deps installed (`npm install`, if not already).
- Branch checked out with this feature's changes.
- A score with at least one note, and a multi-note selection available for the multi-select scenarios.

## Build & Run

```sh
npm run build
npm run server
```

## Validation Scenarios

### 1. Add a second annotation via "+" (User Story 1)

1. Add an annotation to a note (Text menu → Annotation), type text, end editing.
2. Reopen "Annotation" on the same note; confirm the dialog opens in non-editing mode and a "+" control is visible.
3. Click "+"; confirm an empty text-editing session opens without altering the first annotation's text.
4. Type different text, end editing.
5. **Expect**: the score now shows two independent annotations on the note, each with its own text.
6. Repeat twice more (third, fourth annotation); after the fourth, reopen the dialog and confirm "+" is no longer shown.

### 2. Switch between annotations via the index dropdown (User Story 2)

1. On the note from Scenario 1 (now with 2+ annotations), reach the non-editing dialog view.
2. **Expect**: an index dropdown is visible, listing each annotation's index.
3. Select a different index; confirm the dialog's font/offset/justify fields update to that annotation's own saved settings, distinct from the previously-shown one.
4. On a note with only one annotation, confirm no index dropdown is shown.

### 3. Remove an annotation and confirm renumbering (User Story 3)

1. On a note with three annotations (indices 1, 2, 3), select index 2 in the dropdown, enter editing mode, and delete it.
2. **Expect**: only two annotations remain; what was index 3 is now index 2 (its text/settings are unchanged, just its index shifted).
3. Reopen the index dropdown; confirm it lists exactly "1" and "2" with no gap.
4. Remove the sole remaining annotation from a note that has only one; confirm the note has no annotations left, and no index dropdown appears next time the dialog opens (it starts a fresh empty annotation instead, per the base Annotation feature's existing behavior).

### 4. Multi-note selection (Edge Cases)

1. Select a range of notes with no existing annotations; add one via the Text menu, type text, end editing.
2. Reopen the dialog on the same selection, click "+", type different text for a second annotation, end editing.
3. **Expect**: every note in the selection now has both annotations, at the same two indices.
4. Remove index 1 from that selection; confirm every note in the selection loses its index-1 annotation and its former index-2 annotation renumbers to index 1.

### 5. Save/reload round-trip (SC-005)

1. Create a note with 3 annotations, each with distinct text/font/offset/justify.
2. Save and reload the score.
3. **Expect**: all 3 annotations reload with their exact text, settings, and relative index order intact.
