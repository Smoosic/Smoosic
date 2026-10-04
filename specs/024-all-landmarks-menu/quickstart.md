# Quickstart: Add All Landmarks Menu Option

Manual validation for the new "All" option in the landmark submenu. See [contracts/menu-option-contract.md](./contracts/menu-option-contract.md) and [data-model.md](./data-model.md) for the exact behavior expected.

## Prerequisites

- `npm install` (once)
- `npm run build` — builds the app bundle
- `npm run server` — serves the built app; open it in a browser
- A score with Title/Subtitle/Composer/Copyright text already entered in its score info (so those purposes are "available"), opened via the Notes menu's "Landmark Text" submenu

## Manual check 1: Create everything available, from empty (User Story 1, AC1)

1. Start from a score with no landmarks yet, but with Title/Subtitle/Composer/Copyright score-info text populated (Date and Page Number are always available; leave no part exposed, so Part is not available).
2. Open the Notes menu → "Landmark Text" submenu.
3. Select "All".
4. **Expect**: Title, Subtitle, Composer, Copyright, Date, and Page Number landmarks all now appear on the score, each positioned the same way it would be if created individually (Title/Subtitle centered and stacked at the top; Composer/Page Number stacked in the upper-right column; Copyright/Date at the bottom). Part is NOT created (not available — no part exposed). No dialog opens; the menu is closed.

## Manual check 2: Skip existing, create only what's missing (AC2)

1. Starting from the result of Check 1 (or any score with some but not all landmarks already present), reopen the "Landmark Text" submenu and select "All" again.
2. **Expect**: nothing changes — every available purpose already has a landmark, so "All" creates nothing. The menu still closes with no dialog.
3. Now remove one existing landmark (e.g., delete the Copyright landmark via its own dialog) and select "All" once more.
4. **Expect**: only Copyright is (re-)created; Title/Subtitle/Composer/Date/Page Number are left exactly as they were (same text, same position — not reset, not duplicated).

## Manual check 3: Nothing available, nothing to do (AC3 / Edge Case)

1. Start from a score with empty Title/Subtitle/Composer/Copyright score-info fields and no part exposed (only Date and Page Number are available).
2. Remove any existing Date/Page Number landmarks if present, then select "All".
3. **Expect**: Date and Page Number are created; Title/Subtitle/Composer/Copyright/Part are skipped (not available). Select "All" again immediately afterward.
4. **Expect**: nothing is created the second time (Date and Page Number already exist, nothing else is available); the menu still closes normally with no error and no dialog.

## Manual check 4: No dialog ever opens (AC4 / FR-004)

1. Repeat Checks 1-3, and after each "All" selection, confirm no landmark editing dialog appears on screen — the user lands back on the plain score view with the menu closed.
2. Contrast with selecting an individual purpose (e.g., "Title") directly from the same submenu: confirm that still opens its editing dialog as before (unchanged, pre-existing behavior) — this is to confirm the "All" option's no-dialog behavior is a deliberate difference from the single-purpose options, not a regression of them.
