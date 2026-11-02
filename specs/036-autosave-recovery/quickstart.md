# Quickstart: Validating Autosave and Recovery

## Prerequisites

- Dependencies installed (`npm install`).
- The application built and served the way you normally run it for manual testing.

## 1. Headless checks

```text
npm run test:autosave
```

Expected: every case in [contracts/autosave-api.md](contracts/autosave-api.md) prints `PASS` and the script exits 0. These cover the settings (defaults, limits, legacy scores), the snapshot set (add, trim, full storage, damaged entries, ordering, two tabs) and the timing rules (one snapshot per interval, none without a change).

Also run the existing suites that touch preferences and score changes, to check nothing regressed:

```text
npm run test:score-change-state
npm run test:score-archive
```

## 2. Compile

```text
npx tsc --noEmit -p tsconfig.json
```

Expected: no errors. The dialog and menu wiring are checked this way and by the manual steps below.

## 3. Manual: snapshots appear on their own

To avoid waiting 10 minutes, first set the interval to the minimum.

1. Open **Score Settings > Smoosic Preferences**. In **Autosave** set *Minutes between autosaves* to 5 and *Autosaves to keep* to 3. Press OK.
2. Enter a few notes. Wait 5 minutes. In the browser's developer tools, open Application > Local Storage and see `_smoosicAutosaveIndex` with one entry and one `_smoosicAutosave.<id>` key.
3. Do not edit for another 5 minutes. No new entry appears.
4. Edit, wait, edit, wait. After the fourth snapshot, only three entries remain and the oldest is gone.

## 4. Manual: recover after a crash

1. With at least two snapshots stored (from step 3), edit the score further, then close the tab without saving (or kill the browser process).
2. Reopen the application. The Quick Save score or a new score opens.
3. Open **File > Recovery**. Expect the snapshots listed newest first, each with a date, time and score title.
4. Select the second newest and press OK. If the open score has unsaved changes, the unsaved-changes prompt appears first. Choose discard.
5. The chosen snapshot's music is on screen and the title shows the unsaved-changes asterisk.
6. Reopen **File > Recovery**: all snapshots are still listed.

## 5. Manual: empty and damaged cases

1. Clear the `_smoosicAutosave*` keys in developer tools. Open **File > Recovery**: the dialog says nothing is available and has no OK.
2. With two snapshots stored, delete one `_smoosicAutosave.<id>` key only. Reopen the dialog: that entry is not listed.
3. Shorten the text of another snapshot's key. Reopen the dialog: it is shown as unavailable and cannot be selected.

## 6. Manual: settings

1. Open Score Preferences. For a score that has never had these set, expect 10 minutes and 10 autosaves.
2. Try 4 and 61 minutes, 0 and 21 autosaves: each is held to the nearest allowed value.
3. Set 15 minutes and 7 autosaves. Save the score to a file, reload it, and reopen Score Preferences: the values are 15 and 7.
4. With 6 snapshots stored, lower *Autosaves to keep* to 2 and press OK: only the 2 newest remain.
5. Load an older `.smz` or `.json` score that has no autosave settings: it opens, and the defaults are shown.

## 7. Manual: storage unavailable

In a private window with site data blocked (or after disabling storage in developer tools), edit a score and wait an interval. Expect no error or message during editing, and the Recovery dialog to say nothing is available.
