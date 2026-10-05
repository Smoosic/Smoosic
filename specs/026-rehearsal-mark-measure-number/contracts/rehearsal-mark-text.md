# Contract: Rehearsal Mark Text and Serialized Form

## 1. Text derivation (internal API)

`SmoMeasure.getRehearsalMarkText(): string | undefined` — the single source of rehearsal mark display text. All consumers MUST use it rather than reading `mark.symbol`:

| Consumer | File |
|----------|------|
| On-screen stave section | `src/render/vex/vxMeasure.ts` (`stave.setSection`) |
| Headless VexFlow script | `src/render/vex/toVex.ts` (`setSection('…', 0)`) |
| Hit-test box width | `src/render/vex/vxSystem.ts` (`renderRehearsalMarks`) |
| MusicXML export | `src/smo/mxml/smoToXml.ts` (`rehearsal` element `mark`) |

Output examples (measure with `displayMeasure = 16`):

| `cardinality` | `symbol` | Text |
|---------------|----------|------|
| `capitals` | `C` | `C` |
| `numbers` | `3` | `3` |
| `measureNumber` | `C` | `17` |

The text in the generated script (`toVex.ts`) is embedded in a single-quoted string literal; since measure-number text is digits only this adds no escaping concern, and symbol text is handled exactly as before.

## 2. Serialized form

```json
{ "ctor": "SmoRehearsalMark", "cardinality": "measureNumber", "symbol": "A" }
```

- `symbol`, `position`, `increment` appear only when they differ from defaults (existing behavior).
- Schema ([tools/smoosic-schema.json](../../tools/smoosic-schema.json)): `SmoRehearsalMarkCardinalityEnum` gains `"measureNumber"`; `cardinality` must accept it.
- Backward compatible: files without the value load unchanged. Older application versions encountering the value will treat it as an unknown style and display the stored symbol.

## 3. UI contract

Rehearsal mark dialog, "Numbering" select options (value → label):

`capitals` → Capitals, `lowerCase` → Lower case, `numbers` → Numbers, `measureNumber` → Measure number.

Selecting an option updates the score immediately; cancel restores the previous state (unchanged mechanism).
