---

description: "Task list for key-distance enharmonic spelling"
---

# Tasks: Key-Distance Enharmonic Spelling for Transposition

**Input**: Design documents from `/specs/033-key-distance-transposition/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/spelling-api.md, quickstart.md

**Tests**: Requested (FR-013). One headless test file, `tests/keyDistanceTransposition.ts`, grown story by story.

**Organization**: Grouped by user story. US1 and US2 (both P1) share the foundational spelling arithmetic; US1 additionally rewrites cross-key transposition, US2 the whole-score operation, US3 the default spelling, US4 removes the table.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup

- [X] T001 Create `tests/keyDistanceTransposition.ts` with the `check()`/failure-count harness and score-less imports used by `tests/voiceCopyPaste.ts` (exit code 1 on any failure), and register `"test:key-distance-transposition": "ts-node -P tests/tsconfig.json tests/keyDistanceTransposition.ts"` in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The line-of-fifths arithmetic every story uses. See [data-model.md](data-model.md).

- [X] T002 Fix the `'Gg'` typo to `'Gb'` in `SmoMusic.keySignatureLength` in `src/smo/data/music.ts` (research R8)
- [X] T003 Add `SmoMusic.keyFifths(keySignature)` in `src/smo/data/music.ts` returning sharps (+) / flats (-) for a lowercase VexFlow key, using the existing sharp/flat counts; unknown key returns 0
- [X] T004 Add `SmoMusic.pitchFifths(pitch)` and `SmoMusic.fifthsToPitch(f, octave)` in `src/smo/data/music.ts` per the data model (base F=-1, C=0, G=1, D=2, A=3, E=4, B=5; +7 per sharp; valid range -15..19; accidental strings `'n'`, `'#'`, `'##'`, `'b'`, `'bb'`)
- [X] T005 Add a sounding-pitch helper in `src/smo/data/music.ts` using the letter-based rule in research R10 (`octave*12 + naturalValue + accidentalCount`), and a helper that returns the pitch for position `f` whose sounding value equals a given target (solves the octave); do not change `smoPitchToInt`
- [X] T006 Add `SmoMusic.distanceFromKey(pitch, keySignature)` in `src/smo/data/music.ts`: 0 inside `k-1..k+5`, `f-(k+5)` above, `f-(k-1)` below
- [X] T007 Add `SmoMusic.spellPitchClass(soundingValue, keySignature)` (internal helper used by US1, US3): enumerates positions `f0+12m` within -15..19 for the pitch class, returns the smallest absolute distance, ties to the lower (flat-side) position, with octave solved via T005
- [X] T008 Tests in `tests/keyDistanceTransposition.ts`: `keyFifths` for all 15 major keys, `pitchFifths`/`fifthsToPitch` round trip over -15..19, `distanceFromKey` for A# in C (+5), Bb in C (-1), C# in C (+2), E in Eb (+2), G# in G (+2), in-key notes (0), and sounding-value checks `cb4`=47, `b#3`=48

**Checkpoint**: arithmetic verified; stories can proceed.

---

## Phase 3: User Story 1 - Pasting into a different key keeps spelling (Priority: P1) 🎯 MVP

**Goal**: `transposePitchForKey` preserves distance from source key to destination key, for paste, chord symbols and instrument transposition.

**Independent Test**: C# in C → D (+2) gives D#; A# in C → D gives B#.

### Tests for User Story 1

- [X] T009 [US1] In `tests/keyDistanceTransposition.ts` add cases: C#→D#, A#→B#, E natural Eb→G (+4)→G#, F in C → G (+7)→C, in-key scale (all 7 notes of C into every other major key map to the destination scale), same key with offset 0 keeps spelling, Cb4 in Gb → G (+1)→C4 with sounding value +1, sounding value invariant `value(result) == value(input)+offset` over all 12 chromatic notes × 15 key pairs × offsets consistent with the keys, mismatched key/offset still yields correct sounding pitch (research R4), chord symbol `C#` in C→D gives `D#` via `SmoNoteModifiers` chord transposition path (`src/smo/data/noteModifiers.ts`)

### Implementation for User Story 1

- [X] T010 [US1] Rewrite `SmoMusic.transposePitchForKey` in `src/smo/data/music.ts`: `s = kd - ks`, adjusted by a multiple of 12 only when `7*s mod 12` disagrees with `7*offset mod 12`; new position `f + s`; if outside -15..19 respell via `spellPitchClass`; solve octave via T005; return a new `Pitch` (no `findRoleOfPitch`/`findPitchForRole`)
- [X] T011 [US1] Verify callers need no change: `SmoNote.transpose` in `src/smo/data/note.ts` and chord-symbol transposition in `src/smo/data/noteModifiers.ts`; run `npm run test:key-distance-transposition` and `npm run test:voice-copy-paste`

**Checkpoint**: Cross-key paste and chord symbols spell correctly. MVP complete.

---

## Phase 4: User Story 2 - Whole-score transposition (Priority: P1)

**Goal**: Transpose Score computes each measure's destination key and preserves distance, including grace notes.

**Independent Test**: Two Eb-major measures containing E natural, transposed +4, become G major with G#.

### Tests for User Story 2

- [X] T012 [US2] In `tests/keyDistanceTransposition.ts` add `keyForOffset` cases (offset 0 returns the input key including `c#`/`cb`; Eb+4=g; 6 vs -6 tie gives `gb`; results always within -7..+7) and a score-level case: build a small `SmoScore` (see setup in `tests/voiceCopyPaste.ts`), call `SmoOperation.transposeScore(score, 4)`, assert each measure's `keySignature` is `g` and E natural became G#; then `transposeScore(score, -4)` restores spelling, octave and key; include a grace note and a chord

### Implementation for User Story 2

- [X] T013 [US2] Add `SmoMusic.keyForOffset(keySignature, offset)` in `src/smo/data/music.ts`: residue of `ks + 7*offset` mod 12 in -7..+7, fewest accidentals, tie to flats, offset 0 returns the input key unchanged (research R5); return lowercase VexFlow string
- [X] T014 [US2] Rewrite `SmoOperation.transposeScore` in `src/smo/xform/operations.ts` (line ~416): for each measure compute `kd = keyForOffset(measure.keySignature, offset)`, transpose every note pitch and grace-note pitch with `transposePitchForKey(pitch, ks, kd, offset)` (preserving the tab-note fret adjustment already done in `SmoOperation.transpose`), then set `measure.keySignature = kd`; zero offset is a no-op. Keep `SuiScoreViewOperations.transposeScore` in `src/render/sui/scoreViewOperations.ts` calling it for both `score` and `storeScore`
- [X] T015 [US2] Confirm the dialog in `src/ui/dialogs/transposeScore.ts` still works with incremental offsets and cancel (`-delta`) by reasoning through the inverse-shift property; adjust only if the inverse does not restore the key

**Checkpoint**: Transpose Score yields correct key and spelling and is reversible.

---

## Phase 5: User Story 3 - Default spelling outside the key (Priority: P2)

**Goal**: `getEnharmonicInKey` (and callers) pick the closest spelling to the key, ties to flats.

**Independent Test**: In C, the pitch a half step below B defaults to Bb; a tie such as pitch class 8 in C defaults to Ab.

### Tests for User Story 3

- [X] T016 [US3] In `tests/keyDistanceTransposition.ts` add default-spelling cases for key C: pc 10 → Bb, pc 3 → Eb, pc 8 → Ab (tie to flat), pc 1 → C#, pc 6 → F#; for key G: pc 6 → F# (in key); for key F: pc 10 → Bb (in key); octave preserved including B/C boundary cases; document in a comment that C# in C (previously Db) is an intended behavior change (research R3)

### Implementation for User Story 3

- [X] T017 [US3] Rewrite `SmoMusic.getEnharmonicInKey` in `src/smo/data/music.ts` to call `spellPitchClass` (T007), removing the hard-coded `a#/g#/c#/d#/f#` bias block; keep the `octave === undefined` default of 1 and the signature
- [X] T018 [US3] Reimplement `SmoMusic.getScaleTonesForKey` in `src/smo/data/music.ts` from `keyFifths` (accidental count for base `b` is `floor((k + 5 - b) / 7)`), returning the same `letter → 'f#' / 'bb' / 'cn'` shape; add tests that it matches the old table's output for all 15 major keys (capture expected values before deleting the table, see T020)
- [X] T019 [US3] Run `npm run test:key-distance-transposition`, then re-run the existing scripts in `package.json` (`test:voice-copy-paste`, `test:multimeasure-rest`, `test:select-voice`, ...) and compare callers `tickMap.ts`, `operations.ts` (lines ~469 and ~1000), `midiToSmo.ts`, `getIntervalInKey` for unintended changes

**Checkpoint**: Defaults and scale lookups no longer use the table.

---

## Phase 6: User Story 4 - Table removed, no other change (Priority: P3)

**Goal**: The old table and its lookups are gone; nothing unrelated changes.

**Independent Test**: Build succeeds with no references to the removed symbols; existing scripts pass.

- [X] T020 [US4] Before deleting, record `getScaleTonesForKey` output for every key from the old table into a fixture in `tests/keyDistanceTransposition.ts` (if not already done in T018)
- [X] T021 [US4] Delete `SmoMusic.enharmonicRoles`, `findRoleOfPitch`, `findPitchForRole` and the `KeySignatureRole` interface from `src/smo/data/music.ts`; confirm with a grep that no references remain in `src/`, `tests/`, `types/`
- [X] T022 [US4] Regenerate type declarations with `npm run types` so `types/src/smo/data/music.d.ts` drops `enharmonicRoles` and gains the new methods
- [X] T023 [US4] Run `npm run build` and every `test:*` script in `package.json`; fix regressions

---

## Phase 7: Polish & Cross-Cutting

- [X] T024 [P] Add a changelog entry to `changes.md` describing the new spelling rules, the changed default for C# in C, and that Transpose Score now updates key signatures
- [X] T025 [P] Update the doc comment above `getEnharmonicInKey`/`transposePitchForKey` in `src/smo/data/music.ts` to describe the distance rule
- [ ] T026 Walk through the manual checks in [quickstart.md](quickstart.md) in the running application

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → stories. Phase 2 blocks everything.
- US1 (Phase 3) and US2 (Phase 4): US2 needs T010 (the rewritten `transposePitchForKey`) but not the rest of US1's tests; sequence US1 → US2.
- US3 (Phase 5) depends only on Phase 2 and can run in parallel with US1/US2 by a second contributor, but all edits are in `music.ts`, so serialize the edits.
- US4 (Phase 6) last: it removes the table, after T018 has replaced the last reader (`getScaleTonesForKey`) and T010/T017 replaced the others.
- Polish after all stories.

## Parallel Opportunities

Most tasks edit `music.ts` or the single test file, so parallelism is limited. T024 and T025 (changelog, doc comment) can be done together after T023.

## Implementation Strategy

1. Phases 1–2 (arithmetic), then US1 → validate with the C#→D# and A#→B# cases (MVP).
2. US2 for whole-score transposition, validate with the Eb→G example.
3. US3 for defaults, then US4 to remove the table and clean up.
