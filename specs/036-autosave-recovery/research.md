# Research: Autosave Buffers and Crash Recovery

All Technical Context items were resolvable from the code and the clarified spec; there were no open NEEDS CLARIFICATION items.

## R1. What to store, and how big it gets

**Decision**: Store each snapshot as the base64 text of a compressed `.smz` archive, produced by `SmoScoreArchive.pack`, and read back with `SmoScoreArchive.unpack` and `SmoScore.deserialize`.

**Rationale**: Browser storage is about 5 MB per origin and holds Quick Save as well. Quick Save writes the score as plain JSON; twenty copies of that would exhaust the space for a moderately large score. The archive format already exists (feature 034), is deflate-compressed, and is the same format a user's saved file uses, so a snapshot is a complete score by construction. Base64 is required because storage holds only text; it costs about a third more than the raw bytes, still far smaller than the JSON.

**Alternatives considered**: Plain JSON like Quick Save (too large for 20 snapshots of a big score). Storing the abbreviated dictionary form (smaller than JSON, still much larger than deflate, and the project moved away from it). IndexedDB (much more room, but asynchronous throughout, a second storage technology, and the request specified local storage).

## R2. Where the snapshot comes from

**Decision**: Serialize from `view.storeScore`, the full score, not `view.score`, which may be a single exposed part.

**Rationale**: Quick Save, the Save dialog, and the unsaved-changes tracking all use `storeScore`. A snapshot of an exposed part would lose the rest of the score on recovery.

**Alternatives considered**: `view.score` (loses staves when a part is exposed).

## R3. Layout of the stored data

**Decision**: One index key, `_smoosicAutosaveIndex`, holding a JSON array of entries `{ id, time, title, size }`, and one key per snapshot, `_smoosicAutosave.<id>`, holding the encoded text. `id` is a number that only increases: one more than the largest id in the index.

**Rationale**: The dialog can list the snapshots by reading only the small index, without reading or decoding twenty large entries. Ordering by `id` rather than by `time` keeps the order right if the system clock is changed (spec edge case). Separate keys let one snapshot be removed or fail without rewriting the others.

**Alternatives considered**: A single key holding an array of all snapshots (rewrites everything on every snapshot, and one failed write could lose the whole set). Time as the identifier (breaks with clock changes, and two tabs could collide).

## R4. Writing, trimming and running out of space

**Decision**: To add a snapshot, the store re-reads the index from storage, writes the new entry key, then writes the updated index, then removes the entries trimmed off the old end. If the entry write throws (quota), it removes the oldest snapshot and retries, until the write succeeds or no snapshots remain; if it still fails the snapshot is dropped silently and the existing snapshots are left as they were. Index entries whose snapshot key is missing are removed whenever the index is read.

**Rationale**: Re-reading the index immediately before every write is the cheap way to share the set between two tabs on the same origin, since each read-modify-write is synchronous. Writing the entry before the index means a failure in between leaves an unreferenced entry key rather than an index entry pointing at nothing. Giving up the oldest snapshots first on a full store follows the spec edge case, and never touching the Quick Save key protects the one save the application loads on startup.

**Alternatives considered**: Locking across tabs (no good primitive for plain local storage, and the race window is a few synchronous statements). Refusing to write when full (the user would silently lose protection).

## R5. When the timer runs

**Decision**: The scheduler is armed by the first change after a snapshot (or after the score is loaded). It fires once, `interval` minutes later, and takes the snapshot. A change while it is armed does nothing, so many quick edits yield one snapshot. After it fires it is idle until the next change. A load of a new score, or the preferences changing, cancels it and rearms if a change is pending.

**Rationale**: This is exactly "every 10 minutes after a change" and makes the two rules in the spec hold by construction: no snapshot for an unchanged score, and no two snapshots closer than the interval. A free-running periodic timer would need a separate "changed since last snapshot" check and could snapshot a few seconds after a change.

**Alternatives considered**: A fixed-rate interval timer (more wakeups, needs a dirty flag anyway). Debounce after the last edit (a user editing continuously would never get a snapshot).

## R6. What counts as a change

**Decision**: The scheduler is armed from `SuiScoreView.markScoreChanged`, which the undo buffer already calls whenever an edit is recorded (feature 028).

**Rationale**: It is the project's single definition of "the score has been edited," and it is already called for every edit path. Reusing it means autosave and the unsaved-changes asterisk can't disagree.

**Alternatives considered**: A separate hash of the serialized score on each tick (expensive for large scores). Hooking each edit operation (many paths, easy to miss one).

## R7. Settings and their limits

**Decision**: Add `autosaveInterval` (minutes, default 10, valid 5 to 60) and `autosaveCount` (default 10, valid 1 to 20) to `SmoScorePreferences`. The constructor rounds to an integer and clamps into range, and uses the default when the value is absent. The same clamp function is used by the preferences section.

**Rationale**: Clamping at the one place values enter the object means a hand-edited or damaged file can't produce a zero or negative interval, which would make the timer fire constantly. Missing values give the defaults, which is the legacy-score requirement. The scores' preference object is already serialized with the score, so no other serialization code changes.

**Alternatives considered**: Validating only in the dialog (a loaded file could still contain bad values). Throwing on bad values (a score that loads today would stop loading).

## R8. Which score's settings apply

**Decision**: The settings of the open score decide the interval and the count. The stored set is shared by all scores in the browser, so the count limits the whole set, not each score.

**Rationale**: There are no global settings (clarification), the set is what the user sees in the Recovery dialog, and a limit on the whole set is what keeps storage bounded. Each entry carries the title of its score, so the list is still readable when several scores have been open.

**Alternatives considered**: A set per score (unbounded storage in total, and the dialog would need a score picker before the snapshot picker).

## R9. Recovering a snapshot

**Decision**: The Recovery dialog only records the user's choice. After it has closed, `confirmReplaceScore` asks about unsaved changes (the same call Library uses), and then the view decodes the snapshot and calls `changeScore`. Afterward it calls `markScoreChanged`, because `changeScore` always marks a new score as saved but a recovered score has not been saved to a file. No snapshot is removed.

**Rationale**: This reuses the proven open/replace path and its prompt (spec FR-009) and satisfies FR-008 by marking the score as changed, so the user is prompted before leaving it. Decode errors are reported with the same "could not open" message the file loader uses, and the current score is left alone.

**Alternatives considered**: Replacing the score inside the dialog (skips the unsaved-changes prompt, and the dialog would still be mounted during the load).

## R10. Unreadable snapshots

**Decision**: The dialog lists the entries from the index. An entry is shown as unavailable if its stored text is missing, or does not match the recorded size. A snapshot that passes that check but fails to decode when chosen shows the load error and the dialog's other entries stay usable.

**Rationale**: The full decode of up to twenty snapshots on opening the dialog would be slow and would hold the scores in memory just to draw a list. Missing or truncated text is the realistic damage (a partial write, or storage cleared by the browser), and it is detected from the key and its length.

**Alternatives considered**: Decoding every entry when the dialog opens (slow). No check at all (a user could pick an entry that is obviously gone).

## R11. When storage is not available

**Decision**: The store is created only if `localStorage` can be read and written in a test call; otherwise the scheduler is inert (no timer is armed) and the Recovery dialog shows its empty state with a note that storage is unavailable.

**Rationale**: Private browsing modes and library embeddings can throw on any storage access. The spec requires the application to keep working normally.

**Alternatives considered**: Keeping snapshots in memory when storage is unavailable (does not survive a crash, so it is not recovery).

## R12. Time and the page closing

**Decision**: No snapshot is taken on page close. A tab closed cleanly keeps its existing snapshots, but changes made in the last interval before a clean close are not snapshotted.

**Rationale**: Compression is asynchronous and cannot be completed reliably while a page is unloading. Quick Save and the file Save remain the way to keep a clean exit.

**Alternatives considered**: A synchronous uncompressed snapshot on `pagehide` (can overflow the space the compressed set is sized for, and could evict good snapshots right before the user leaves).

## R13. The schema file

**Decision**: Add the two properties to `SmoScorePreferences` in `tools/smoosic-schema.json` with their defaults. The separate SmoSchema repository is outside this change and is noted in the changelog.

**Rationale**: The in-repo schema file lists the preference fields next to their defaults and should stay in step with the code.
