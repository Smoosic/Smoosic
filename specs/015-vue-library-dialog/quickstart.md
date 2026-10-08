# Quickstart: Validating the Vue-Based Music Library Dialog

This project has no wired automated test runner (`npm test` is a no-op). Validation is manual, against the dev/demo score app, following the acceptance scenarios in [spec.md](./spec.md).

## Prerequisites

- Node deps installed (`npm install`, if not already).
- Branch `015-vue-library-dialog` checked out.
- `SuiLibraryDialogVue` (`src/ui/dialogs/libraryVue.ts`) temporarily wired to a call site for manual testing — e.g. in `src/ui/buttons/ribbon.ts`'s `executeButtonModal`, replace `await SuiLibraryDialog.createAndDisplay(params, this.config);` with `await SuiLibraryDialogVue(params, this.config);` for the `'SuiLibraryDialog'` branch, or add a temporary entry point in the demo app. **Do not commit this swap** — per the spec, wiring real callers over to the new dialog is a separate, later change.
- A library JSON reachable at `config.libraryUrl` (default: `https://smoosic.github.io/SmoScores/links/smoLibrary.json`, see `src/application/configuration.ts`) with at least two levels of nesting — one top-level folder containing a song, and at least one folder-within-a-folder — to exercise lazy loading and multi-level navigation. The existing default library already has this shape; a local/mocked copy can be substituted (point `config.libraryUrl` at it) to control the exact structure being tested, e.g. to include a deliberately empty folder for the edge case below.

## Build & Run

```sh
npm run build
npm run server
```

Then open the served app in a browser, open the ribbon button wired to the Music Library dialog above.

## Validation Scenarios

Each maps to a User Story / Acceptance Scenario in [spec.md](./spec.md).

### 1. Select and load a song (User Story 1, P1)

1. Open the Music Library dialog.
2. **Expect**: after the top-level library finishes loading, the tree shows its top-level entries, each with a folder or song icon (FR-004, FR-005).
3. **Expect**: the Load control starts disabled, since nothing is selected yet (Acceptance Scenario 4).
4. Select a song (leaf) entry visible at the top level.
5. **Expect**: the entry is marked selected and the Load control becomes enabled (FR-009, FR-010).
6. Activate Load.
7. **Expect**: that song loads into the score view and the dialog closes (FR-012).

### 2. Drill into a folder to find a song (User Story 2, P2)

1. Reopen the dialog. Select a top-level folder entry whose contents have not yet been loaded.
2. **Expect**: its contents are fetched and appended under it in the tree; the folder automatically expands to show them; the Load control remains disabled throughout (FR-006, FR-008, FR-009).
3. Select that same folder entry again.
4. **Expect**: no additional network fetch occurs (confirm via browser dev tools' network tab), and the folder simply stays/re-expands to show its already-known children (FR-007).
5. If the library has a folder nested inside another folder, drill into the nested one the same way.
6. **Expect**: identical load-if-needed-and-expand behavior, to any depth (FR-006–FR-008, FR-015).
7. Select a song reached this way and activate Load.
8. **Expect**: same result as Scenario 1, steps 6–7, regardless of depth.

### 3. Expand or collapse without changing selection (User Story 3, P3)

1. Reopen the dialog. Select a song entry so the Load control is enabled.
2. Locate a different, already-loaded folder entry (its children currently visible) and activate its own expand/collapse control (not its label).
3. **Expect**: that folder's children are hidden; the song selection and the Load control's enabled state are unaffected (FR-011).
4. Activate the same control again.
5. **Expect**: the children reappear with no network fetch; selection and Load state still unaffected.
6. Repeat using a folder that is an ancestor of the currently-selected song.
7. **Expect**: collapsing it hides the song from view but does not clear the selection or disable Load (Edge Cases); re-expanding it reveals the still-selected song.

### 4. Cancel and edge cases

1. Reopen the dialog, select an entry (song or folder), then activate Cancel.
2. **Expect**: the dialog closes with no score change (FR-014).
3. Reopen the dialog and press Escape.
4. **Expect**: same result as Cancel.
5. If a deliberately empty folder is available in the test library, select it.
6. **Expect**: its (empty) contents load without error; no expand/collapse control is shown for it, since it has no children (Edge Cases).
7. Reopen the dialog a final time.
8. **Expect**: it starts fresh — top-level library reloaded, nothing pre-selected, nothing pre-expanded (Edge Cases).

## Regression check against the legacy dialog

Since `SuiLibraryDialog` remains in the codebase unchanged, the fastest regression check is to run the same library/navigation sequence through both dialogs (the legacy call site vs. the temporarily-wired new one) and confirm: the same songs are reachable via the same sequence of folder selections, the Load control's enabled/disabled state matches at each step, and loading a given song results in the same score being opened.
