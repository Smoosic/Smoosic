# Data Model: Rehearsal Mark Properties Dialog

No persisted fields are added or changed. This feature populates one already-existing, currently-never-assigned render-layer field, and adds one transient adapter object used only while the dialog is open.

## `SmoRehearsalMark` (existing — `src/smo/data/measureModifiers.ts`)

No change to the class. Existing fields the dialog edits:

| Field | Type | Editable in dialog | Notes |
|---|---|---|---|
| `symbol` | `string` | Yes (FR-003) | The displayed letter/number. |
| `cardinality` | `string` (`capitals` \| `lowerCase` \| `numbers`) | Yes (FR-004) | Numbering style. |
| `increment` | `boolean` | Yes (FR-005) | Auto-advance flag. |
| `position` | `number` | **No** (spec Assumptions) | Codebase marks it non-functional (`// TODO: positions don't work`). |
| `logicalBox` | `SvgBox \| null` (inherited from `SmoMeasureModifierBase`) | No (render-only) | Populated by this feature for the first time (research.md §1-2). Not serialized. |

## `SmoMeasure` (existing — `src/smo/data/measure.ts`)

No change. Relevant existing API: `getRehearsalMark()` (line ~1525), `addRehearsalMark(params)` (line ~1518, replaces any existing mark on the measure), `removeRehearsalMark()` (line ~1522). Constraint: at most one rehearsal mark per measure (FR-011).

## `SuiRehearsalMarkAdapter` (new, transient — `src/ui/dialogs/rehearsalMark.ts`)

Lives only while its dialog is open. Modeled on `SuiVoltaAdapter` (`src/ui/dialogs/volta.ts`).

| Member | Kind | Behavior |
|---|---|---|
| `mark` | `SmoRehearsalMark` | The live instance being edited (the dialog's `modifier`). |
| `backup` | `SmoRehearsalMark` | Serialized-deserialized copy taken at construction; used by `cancel()`. |
| `changed` | `boolean` | Set true on the first field write. |
| `symbol` / `cardinality` / `increment` | getter + setter pair | Setter writes the field on `mark`, then calls `view.updateRehearsalMark(mark)` for live score update (FR-006), sets `changed`. |
| `commit()` | async method | No-op on the score (already live); finalizes the session. |
| `cancel()` | async method | If `changed`, calls `view.updateRehearsalMark(backup)` to restore pre-dialog state (FR-007). |
| `remove()` | async method | Calls `view.removeRehearsalMark(mark)` (FR-008). |

Dialog-level invariant: the adapter's `mark.attrs.id` is what `updateRehearsalMark`/`removeRehearsalMark` use to locate the owning measure in `score`/`storeScore` (research.md §3). `backup` carries the same `attrs.id` so `cancel()` finds the same measure.

## Tracker modifier list (existing structure — `src/render/sui/mapper.ts` `ModifierTab`)

`ModifierTab { modifier, selection, box, index }` (`src/smo/xform/selections.ts`). For a rehearsal mark, `modifier` is the `SmoRehearsalMark`, `selection` is the measure selection it was found under, `box` is `logicalBox ?? SvgBox.default` (research.md §1: keyboard cycling works even with the default box; mouse clicking needs the real one).

## Owning-measure lookup (new helper inside the adapter/view-operations layer)

Given a `SmoRehearsalMark` instance, find the `{ staffIndex, measureIndex }` whose `getRehearsalMark()?.attrs.id === mark.attrs.id`, in `score` and `storeScore` respectively. Returns nothing if the mark has been removed since the dialog opened — `updateRehearsalMark`/`removeRehearsalMark` must then no-op safely rather than throw.

No new persisted entities, no new relationships, no new validation rules beyond the existing `SmoRehearsalMark` cardinality/symbol conventions.
