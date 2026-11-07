# Contract: Create Part

The testable surface, followed by the headless test list for `tests/createPart.ts`.

## Model (`src/smo`)

```ts
interface AddPartParams {
  location: number;            // one-based, 1..N+1
  instrument: SmoInstrument;
  twoStaves: boolean;
  name: string;                // blank = use instrumentLabel
  instrumentLabel: string;
  abbreviation: string;
}

class SmoScore {
  /** one-based location -> zero-based insertion index (0..N), never inside a multi-staff part */
  resolveNewPartIndex(location: number): number;
  /** add `delta` to every staff number >= fromIndex held by modifiers, system groups, instrument maps, text groups */
  shiftStaffReferences(fromIndex: number, delta: number): void;
  /** existing; after inserting below the end it now calls shiftStaffReferences(newPos, 1) */
  addStaff(parameters: SmoSystemStaffParams): SmoSystemStaff;
}

class SmoSystemStaff {
  shiftStaffReferences(fromIndex: number, delta: number): void;
}

class SmoOperation {
  /** returns the index of the first new staff */
  static addPart(score: SmoScore, params: AddPartParams): number;
}
```

## View (`SuiScoreViewOperations`)

| Member | Behavior |
|--------|----------|
| `createPart(params: AddPartParams): Promise<void>` | `_undoScore('Create part')` once; `SmoOperation.addPart(storeScore, params)`; `updateInstrumentOffsets` on the new staves; `setNoteInstrumentProperties`; `viewAll`; wait for render |
| `addStaff(params)` | Unchanged for callers |

## Dialog helpers (`src/ui/dialogs/createPartHelpers.ts`, no Vue imports)

```ts
const instrumentChoices: SelectOption[];                       // value + label, no duplicates
function clampPartLocation(value: unknown, staffCount: number): number;   // integer 1..staffCount+1; staffCount+1 if not a number
function resolvePartName(typed: string, instrumentLabel: string): string; // typed.trim() or instrumentLabel
function instrumentLabelFor(value: string): string;           // label for a value, or the value
```

## Dialog (`SuiCreatePartVue`, `newPart.vue`)

- Title "Create Part".
- Name field, placeholder = `instrumentLabelFor(instrument)`; Abbreviation field.
- Staff Location: number input, min 1, max N+1, initial N+1.
- OK calls `view.createPart` with the values above. Cancel does nothing.

## Test cases (`tests/createPart.ts`)

| # | Case | Expected |
|---|------|----------|
| C1 | `clampPartLocation` with 0, 1, N+1, N+2, 2.6, NaN, a string | 1, 1, N+1, N+1, 3, N+1, N+1 |
| C2 | `resolvePartName` with '', '  ', 'Cello I', ' Vc ' and label 'Cello' | Cello, Cello, Cello I, Vc |
| C3 | `instrumentChoices` | No two entries share a value; `instrumentLabelFor('cello')` is 'Cello' |
| P1 | `resolveNewPartIndex` on 3 plain staves, locations 1..4, 9 | 0, 1, 2, 3, 3 |
| P2 | Staves A, P1+P2, C: location 3 (inside the part) | 3 |
| P3 | Same score: location 2 (part's first staff), location 4 (after C), location 1 | 1, 3, 0 |
| P4 | Staves A, P1+P2 only: location 3 and 4 | 3, 3 (3 = after the part; nothing is split) |
| P5 | Two adjacent two-stave parts: location pointing into each | after that part only |
| A1 | `addPart` at each of 1..N+1 on 3 plain staves | New staff at the resolved index; the others keep their order |
| A2 | Name blank, label 'Cello' | `partName` 'Cello' |
| A3 | Typed name and abbreviation | Exactly those on the new staff |
| A4 | `preserveTextGroups` on the new part; `SmoPartInfo.defaults.preserveTextGroups` after the call | true; false |
| A5 | Parts created without `addPart` (`SmoSystemStaff.defaults`) | `preserveTextGroups` false |
| A6 | `twoStaves` | Two adjacent staves; first has stavesAfter 1 and stavesBefore 0, second the reverse; same name, abbreviation, setting; clefs opposite |
| A7 | `twoStaves` with a location inside an existing two-stave part | Part intact; new part after it |
| R1 | A slur on the third staff, then insert at location 1 | The slur's staff selectors, `associatedStaff` and its position are now 3 |
| R2 | A system group over staves 1-2, insert at location 1 | Group now over staves 2-3 |
| R3 | A system group over staves 0-2, insert at location 2 | Group now over staves 0-3 |
| R4 | Insert at N+1 | Nothing shifted; existing groups and modifiers unchanged |
| R5 | A staff instrument map entry's selectors after an insertion above it | Staff number is one higher |
| S1 | Serialize and deserialize after creating a one- and a two-stave part | Names, abbreviations, setting, before/after links all kept |
| S2 | Staff numbers after any insertion | `staves[i].staffId === i` for all i |
