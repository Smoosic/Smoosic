# Data Model: Unsaved Changes Indicator and Save Prompt

All state below is in memory for the running session. Nothing is serialized into a score, so file formats and legacy scores are unchanged (constitution Principle #1).

## ScoreChangeState (on `SuiScoreView`)

| Field | Type | Meaning |
|-------|------|---------|
| `scoreChanged` | `Ref<boolean>` | True when the open score has been edited since it was last saved in the full Smoosic format or loaded |
| `scoreName` | `Ref<string>` | The open score's name (from `score.scoreInfo.name`), as stored; the display placeholder is applied at format time |

**Initial value**: `scoreChanged = false`; `scoreName` = initial score's name.

**Transitions**

| Event | Effect |
|-------|--------|
| `UndoBuffer.addBuffer` called (any edit) | `scoreChanged = true` via `onAddBuffer` |
| `SuiScoreView.undo()` completes | `scoreChanged = true`; `scoreName` refreshed |
| `updateScoreInfo(...)` | `scoreName` refreshed (flag set by the undo record it makes) |
| `changeScore(score)` completes | `scoreChanged = false`; `scoreName` refreshed |
| `recordSave(ext)` with a full-fidelity extension | `scoreChanged = false` |
| `recordSave(ext)` with a lossy extension | no change |
| `quickSave()` | `scoreChanged = false` |
| Selection, scrolling, zoom, playback | no change |

## UndoBuffer (changed)

| Member | Type | Meaning |
|--------|------|---------|
| `onAddBuffer` | `(() => void) \| undefined` | Optional listener called at the end of every `addBuffer`; unset by default so existing users of `UndoBuffer` behave as before |

## Pure policy module `scoreChangeState.ts`

```ts
type SaveOutcome = 'saved' | 'exported' | 'cancelled';
type AfterSaveStep = 'load' | 'prompt' | 'abort';

isFullSaveFormat(extension: string): boolean      // '.json', compared case-insensitively
formatScoreTitle(name: string, changed: boolean): string  // 'Untitled' placeholder; trailing '*' when changed
nextStepAfterSave(outcome: SaveOutcome): AfterSaveStep    // saved -> load, exported -> prompt, cancelled -> abort
```

`formatScoreTitle` returns only the score portion (for example `My Song*`); the sidebar shows the application name separately, before it.

## Save prompt (UI)

| Choice | Result of `confirmReplaceScore` |
|--------|--------------------------------|
| No unsaved changes | resolves `true` immediately, no prompt shown |
| Don't save | resolves `true` |
| Cancel | resolves `false` |
| Save, then outcome `saved` | resolves `true` |
| Save, then outcome `exported` | prompt shown again |
| Save, then outcome `cancelled` | resolves `false` |

## Dialog interface additions

| Interface | Addition |
|-----------|----------|
| `DialogInstallParams` (`dialog.ts`) | `afterCloseCb?: DialogCallback`, awaited after a commit has closed and unmounted the dialog (not run on cancel) |
| `SuiFileSaveDialog` | second, optional argument `onClosed?: (outcome: SaveOutcome) => void` |
| `library.vue` props | a callback that reports the selected URL on commit, replacing the direct `loadRemoteScore` call |
| `sidebar.vue` props | `scoreName: Ref<string>`, `scoreChanged: Ref<boolean>` |
