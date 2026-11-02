# Contract: Autosave Module and UI Entry Points

The interfaces below are the testable surface. Names are the intended public API; the cases at the end are the headless test list for `tests/autosave.ts`.

## Preferences (`src/smo/data/scoreModifiers.ts`)

```ts
interface SmoScorePreferencesParams {
  // ...existing fields
  autosaveInterval?: number;   // minutes, 5-60
  autosaveCount?: number;      // 1-20
}
const autosaveLimits = { minInterval: 5, maxInterval: 60, defaultInterval: 10,
                         minCount: 1, maxCount: 20, defaultCount: 10 };
function clampAutosaveInterval(value: unknown): number;   // integer in 5..60, default 10 if not a number
function clampAutosaveCount(value: unknown): number;      // integer in 1..20, default 10 if not a number
```

`new SmoScorePreferences(params)` applies both clamps. `SmoScorePreferences.defaults` includes both fields at their defaults. `serialize()` includes them.

## Store (`src/render/sui/autosave.ts`)

```ts
/** the part of the browser's storage that is used, so a test can supply a fake */
interface AutosaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;   // may throw when full
  removeItem(key: string): void;
}
interface AutosaveEntry { id: number; time: number; title: string; size: number; }

class AutosaveStore {
  constructor(storage: AutosaveStorage);
  /** entries oldest first; entries with no stored text are dropped from the index first */
  list(): AutosaveEntry[];
  /** add a snapshot and keep at most `maxCount` (oldest dropped); returns the entry, or null if it could not be stored */
  add(text: string, title: string, time: number, maxCount: number): AutosaveEntry | null;
  /** the stored text of a snapshot, or null if missing or its length does not match the entry */
  read(id: number): string | null;
  /** drop the oldest snapshots so at most `maxCount` remain */
  trim(maxCount: number): void;
}
```

Quick Save's key is never read or written by the store.

## Scheduler (`src/render/sui/autosave.ts`)

```ts
interface AutosaveTimer {
  set(cb: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}
class AutosaveScheduler {
  /** takeSnapshot is called when the timer fires; it may be asynchronous */
  constructor(timer: AutosaveTimer, takeSnapshot: () => void | Promise<void>);
  /** the score changed: arm the timer if idle, otherwise do nothing */
  noteChange(intervalMinutes: number): void;
  /** forget any pending snapshot (a different score was loaded) */
  reset(): void;
  /** the interval setting changed: restart a pending timer from now using the new interval */
  retime(intervalMinutes: number): void;
  readonly armed: boolean;
}
```

## View (`SuiScoreView` / `SuiScoreViewOperations`)

| Member | Behavior |
|--------|----------|
| `markScoreChanged()` | As today, plus `scheduler.noteChange(score.preferences.autosaveInterval)` |
| `changeScore(score)` | As today, plus `scheduler.reset()` |
| `updateScorePreferences(pref)` | As today, plus `store.trim(count)` and `scheduler.retime(interval)` if either changed |
| `listSnapshots(): AutosaveEntry[]` | Newest first, each with an `available` flag from `read(id) !== null` |
| `recoverSnapshot(id): Promise<void>` | Decode the stored text, `changeScore`, then `markScoreChanged`. Throws an Error with a user-readable message if the snapshot cannot be read; the open score is left unchanged. |

## Dialog and menu

- **File menu**: new entry `Recovery` (value `recovery`) after Quick Save. Handler opens `SuiRecoveryDialog` with the usual dialog parameters.
- **`SuiRecoveryDialog(parameters)`**: lists `view.listSnapshots()`; selecting an entry enables OK; entries not `available` cannot be selected; with no entries, shows "No autosaved scores are available" and no OK. On close with a choice, in `afterCloseCb`: `confirmReplaceScore(parameters)`, then `view.recoverSnapshot(id)`; a thrown error is shown with `showLoadError`.
- **Score Preferences**: new "Autosave" section. Two `numberInput` fields, precision 0: "Minutes between autosaves" (5 to 60) and "Autosaves to keep" (1 to 20). Edits write `preferences.autosaveInterval` / `preferences.autosaveCount`, which the existing watcher sends to `updateScorePreferences`.

## Test cases (`tests/autosave.ts`)

| # | Case | Expected |
|---|------|----------|
| A1 | `new SmoScorePreferences({})`-style legacy params with no autosave fields | interval 10, count 10 |
| A2 | Interval 0, 4, 61, 7.6, NaN, a string | 5, 5, 60, 8, 10, 10 (clamped or defaulted, whole numbers) |
| A3 | Count 0, 21, 3.2, undefined | 1, 20, 3, 10 |
| A4 | Serialize then construct from the result | Both values unchanged |
| A5 | `defaults` | Both fields at their defaults |
| S1 | Empty store, `list()` | `[]` |
| S2 | Add three, `list()` | Three entries, ids increasing, oldest first |
| S3 | `add` with `maxCount` 3 when three exist | Oldest removed; its storage key is gone; three remain |
| S4 | `trim(2)` with four stored | Two newest remain; removed keys are gone |
| S5 | Storage that throws on the first write | Oldest dropped and write retried; new snapshot stored |
| S6 | Storage that always throws | `add` returns `null`; the index lists only snapshots whose text is still stored (the retry may have removed older ones to make room) |
| S7 | An entry key removed behind the store's back | `list()` omits it |
| S8 | Entry text truncated | `read(id)` returns `null` |
| S9 | Next id after the newest snapshot is removed | Largest remaining id plus one; ids in the list stay strictly increasing |
| S10 | The Quick Save key present in storage | Never read, changed or removed by any store call |
| S11 | Two stores over the same storage | Each `add` sees the other's entries; the count limit holds across both |
| T1 | `noteChange` when idle | Timer set for interval minutes in ms; `armed` true |
| T2 | `noteChange` ten times while armed | One timer only; one snapshot when it fires |
| T3 | Timer fires | `takeSnapshot` called once; `armed` false; no timer remains |
| T4 | Fires with no change since | Not possible: no timer is set without a change |
| T5 | Change after a fire | Re-armed; second snapshot at a second interval |
| T6 | `reset()` while armed | Timer cleared; `armed` false |
| T7 | `retime(20)` while armed | Old timer cleared; new timer for 20 minutes; `armed` true |
| T8 | `retime` while idle | No timer is set |
| T9 | `takeSnapshot` rejects | Scheduler goes idle and a later change re-arms it |
