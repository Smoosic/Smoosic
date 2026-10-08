# Data Model: Measure-Number Rehearsal Marks

## SmoRehearsalMark (changed)

Source: [measureModifiers.ts](../../src/smo/data/measureModifiers.ts)

| Field | Type | Default | Change |
|-------|------|---------|--------|
| `cardinality` | string | `'capitals'` | Allowed values extended: `capitals`, `lowerCase`, `numbers`, **`measureNumber`** |
| `symbol` | string | `'A'` | Unchanged. Retained but not displayed when `cardinality === 'measureNumber'` |
| `position` | number | `0` (above) | Unchanged |
| `increment` | boolean | `true` | Unchanged. No effect on text when `measureNumber` |

No new fields. Serialization stays "non-default values only"; a `measureNumber` mark serializes with `cardinality: "measureNumber"` plus any other non-default values.

## SmoMeasure (changed: derived value only)

New method, no new stored state:

`getRehearsalMarkText(): string | undefined`

| Condition | Result |
|-----------|--------|
| No rehearsal mark on measure | `undefined` |
| `cardinality !== 'measureNumber'` | `mark.symbol` |
| `cardinality === 'measureNumber'`, `measureNumber.displayMeasure` finite | `String(displayMeasure + 1)` |
| `measureNumber`, displayMeasure not finite, `measureIndex` finite | `String(measureIndex + 1)` |
| otherwise | `mark.symbol` |

`displayMeasure` is 0-indexed and accounts for renumbering ([common.ts:112](../../src/smo/data/common.ts)), hence `+ 1`.

## Validation rules

- Unknown `cardinality` strings are not rejected at runtime today; unchanged.
- A `measureNumber` mark never participates in rehearsal-mark auto-increment/resequencing (add or remove).
- Legacy scores contain only the three earlier values and deserialize identically.

## State transitions

`capitals | lowerCase | numbers` ⇄ `measureNumber` via the dialog; `symbol` is preserved across the transition in both directions. Cancel restores the pre-dialog serialized state (existing backup mechanism).
