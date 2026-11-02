# Data Model: Autosave Buffers and Crash Recovery

## Autosave Settings (on `SmoScorePreferences`)

| Field | Type | Default | Valid values | Notes |
|-------|------|---------|--------------|-------|
| `autosaveInterval` | integer (minutes) | 10 | 5 to 60 | Time from the first unsnapshotted change to the snapshot |
| `autosaveCount` | integer | 10 | 1 to 20 | Most snapshots kept in the whole stored set |

**Validation**: The `SmoScorePreferences` constructor rounds each value to a whole number and limits it to the valid range. A missing, non-numeric or out-of-range value becomes the default (if missing or not a number) or the nearest limit (if out of range). The Score Preferences section uses the same limits.

**Serialization**: Both fields are written with the other preferences. A score saved before this feature has neither field and loads with the defaults. The fields are listed in `tools/smoosic-schema.json`.

**Lifecycle**: Changing a value takes effect immediately: the scheduler is retimed and, if the count was lowered, the stored set is trimmed (see Snapshot Set).

## Autosave Snapshot

One stored copy of the whole score at a moment in time.

| Field | Type | Notes |
|-------|------|-------|
| `id` | integer | Increases by one for each snapshot taken; the newest has the largest. Defines the order. |
| `time` | integer (ms since epoch) | When the snapshot was taken; shown to the user, not used for ordering |
| `title` | string | The score's name at that time, or empty (shown as "Untitled") |
| `size` | integer | Length of the stored text; used to detect truncated entries |

The score itself is held under its own storage key as base64 text of a compressed score archive.

## Snapshot Set (the index)

The ordered list of snapshot entries, newest last, held under one storage key.

**Invariants**:
- Never more than `autosaveCount` entries after any add or setting change.
- Ids are unique and strictly increasing in list order.
- An entry whose score text is missing is removed when the index is read.
- Adding a snapshot removes entries from the old end until the count holds.
- If a write fails for lack of room, the oldest entry is removed and the write retried, until it succeeds or the set is empty.

**State transitions**:

```text
(no set) --first snapshot--> [s1]
[s1..sN], N < count --snapshot--> [s1..sN, s(N+1)]
[s1..sN], N = count --snapshot--> [s2..sN, s(N+1)]        # oldest dropped
[s1..sN] --count lowered to M < N--> [s(N-M+1)..sN]        # oldest dropped
[s1..sN] --storage full--> drop s1, retry                  # until written, or empty and skipped
[s1..sN] --recover--> [s1..sN]                             # unchanged
```

## Scheduler State

In memory only; not persisted.

| State | Meaning |
|-------|---------|
| `idle` | No change since the last snapshot (or since the score was loaded). No timer. |
| `armed` | A change has happened; a one-shot timer will take a snapshot at the end of the interval. |

```text
idle --change--> armed
armed --change--> armed            # no effect; one snapshot per interval
armed --timer fires--> (snapshot) --> idle
armed --score replaced--> idle     # new score starts clean
armed --interval changed--> armed  # timer restarted with the new interval, measured from now
```

## Recovery Choice

The id of the snapshot the user selected in the Recovery dialog, held until the dialog closes. On close, the view loads that snapshot (after the unsaved-changes prompt) and marks the score as changed.
