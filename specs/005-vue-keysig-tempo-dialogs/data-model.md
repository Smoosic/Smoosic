# Data Model: Vue-Based Key Signature and Tempo Dialogs

This feature has no persistence/schema changes — both entities below already exist in the score data model (`src/smo/data/measureModifiers.ts`) and in each dialog's existing adapter (`src/ui/dialogs/keySignature.ts`, `src/ui/dialogs/tempo.ts`). This document maps each entity to the dialog fields it drives and the Vue control each field becomes, per `research.md` R3.

## Key Signature (`SuiKeySignatureAdapter`)

| Field (adapter property) | Type | Vue control | Notes |
|---|---|---|---|
| `key` | string enum (`c`, `f`, `g`, `bb`, `d`, `eb`, `a`, `ab`, `e`, `db`, `b`, `f#`, `c#`, `gb`) | `select.vue` | 14 options, values/labels copied verbatim from `SuiKeySignatureDialog.dialogElements`; default `'C'`. Legacy label text is `'Tempo Mode'` (a pre-existing copy-paste bug — see `research.md` R7); preserved as-is unless a separate fix is requested. |
| `applyTo` | string enum (`'selections'`, `'remaining'`, `'all'`) | `select.vue` | labels "Current Selections" / "Future Measures" / "Full Score"; default `'selections'` |

No per-field live score update — the adapter's `key`/`applyTo` setters only update local adapter state (`applyTo`'s setter additionally derives `applyToAll`/`applyToRemaining`/`applyToSelections` flags used by `apply()`). The score is only touched by `commit()` → `apply()`, which resolves the measure range (current selections / from the current selection to the end / the whole score, based on `applyTo`) and calls `SmoOperation.addKeySignature` for each measure in range, then `view.updatePromise()`.

Actions: `commit` (`adapter.commit()` → applies the key signature to the resolved range), `cancel` (`adapter.cancel()` — no-op, matches "no residual score changes"), no `remove` (matches current absence of a Remove button — `research.md` R4). No `initialPosition` (matches current fixed-position behavior — `research.md` R5). Adapter is constructed as `new SuiKeySignatureAdapter(parameters.view, measure)`, where `measure` is derived per `research.md` R2, not from `parameters.modifier` (which is always explicitly `null` at every Key Signature call site anyway).

## Tempo (`SuiTempoAdapter`)

| Field (adapter property) | Type | Vue control | Notes |
|---|---|---|---|
| `tempoMode` | string enum (`'duration'`, `'text'`, `'custom'`) | `select.vue` | labels "Duration (Beats/Minute)" / "Tempo Text" / "Specify text and duration"; default `SmoTempo.tempoModes.durationMode` |
| `customText` | string | plain text `<input>` | visible only when `tempoMode === 'custom'`, mirroring legacy `SuiTempoDialog.showHideCustom()` |
| `bpm` | int | `numberInput.vue` | label "Notes/Minute"; default `120` |
| `beatDuration` | int enum (`4096`, `2048`, `6144`, `8192`) | `select.vue` | labels "Quarter Note" / "1/8 note" / "Dotted 1/4 note" / "1/2 note"; numeric value cast to/from string at the component boundary per `research.md` R3; default `4096` |
| `tempoText` | string enum (16 values, `SmoTempo.tempoTexts.*`) | `select.vue` | options copied verbatim from `SuiTempoDialog.dialogElements` (Larghissimo … Prestissimo); default `SmoTempo.tempoTexts.allegro` |
| `applyToAll` | boolean | `toggle.vue` | label "Apply to all future measures?"; its setter triggers `view.updateTempoScore(...)` directly |
| `applyToSelection` | boolean | `toggle.vue` | label "Apply to selection?"; a plain field on the adapter (no getter/setter side effect) — toggling it alone does not immediately re-scope the score, matching current behavior; it is read by the next `writeNumber`/`writeBoolean`/`writeString` call |
| `display` | boolean | `toggle.vue` | label "Display Tempo" |
| `yOffset` | int | `numberInput.vue` | label "Y Offset"; default `0` |

Every field write (except `customText`'s visibility toggling and `applyToSelection`'s own write, per above) goes through the adapter's existing setters (`tempoMode`, `bpm`, `beatDuration`, `tempoText`, `applyToAll`, `display`, `yOffset` — all of which internally call `writeString`/`writeNumber`/`writeBoolean` or, for `applyToAll`, the equivalent inline logic), each of which calls `view.updateTempoScore(this.measure, this.SmoTempo, this.applyToAll, this.applyToSelection)` immediately — i.e. writing straight through to `adapter[param] = value` (per the `004-vue-modifier-dialogs` R3 pattern) reproduces today's live-update behavior exactly, with no new wiring needed.

Actions: `commit` (`adapter.commit()` — no-op, since every field change already applied live), `cancel` (`adapter.cancel()` → `view.updateTempoScore(measure, backup, applyToAll, applyToSelection)`, restoring the tempo captured when the dialog opened), no `remove` (matches current absence of a Remove button — `research.md` R4). No `initialPosition` (matches current fixed-position behavior — `research.md` R5). Adapter is constructed as `new SuiTempoAdapter(parameters.view, measure)`, where `measure` is derived per `research.md` R2, not from `parameters.modifier`.
