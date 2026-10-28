# Feature Specification: Key-Distance Enharmonic Spelling for Transposition

**Feature Branch**: `033-key-distance-transposition`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "We need a better way to transpose. There is a table object in music.ts called enharmonicRoles. It is supposed to determine enharmonic equivalents when transposing. For instance, when transposing c# in the key of C major to D major, it should be a D# and not an Eb. It is also used to choose the correct default for a non-key enharmonic. But, it (the enharmonic table) doesn't really work and it is too bulky and error-prone. I think there is a better way using just the key signature and the number of sharps/flats per key signature. A non-key note like c# in C Major will have a 'distance', which is how many sharps/flats you would have to add to get a key with the note. For instance, in the key of c, 1/2 down from a B is either Bb or A#. Bb is 2 flats away from C, A# is 5 sharps. So Bb is a more logical default. Likewise when pasting from one key to another, we would want to preserve the distance. So pasting A# from the key of C into D would give a B# since you have to add the same number of accidentals. If the sharps/flats is a tie with both the same distance, we will go with the flat direction. When transposing the whole score in the scoreTranspose component, we should calculate the destination key, and try to preserve the distance for the enharmonics. So for instance going from Eb up 4 steps to G, E natural would go to G#. So we want to replace the enharmonicRoles table in music.ts with this logic."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pasting notes into a different key keeps their spelling relationship (Priority: P1)

A composer copies a passage from a measure in one key and pastes it into a measure in another key (for example, a transposing instrument's part, or a modulation). Notes that belong to the source key stay diatonic in the destination key. Notes that were chromatic in the source (accidentals outside the key) must stay chromatic in the destination, with the same kind of alteration: a note that was one sharp above a key tone stays one sharp above the corresponding key tone, rather than being respelled as a flat of the next tone up.

**Why this priority**: Pasting between keys is the everyday path where wrong spellings appear (a D# turning into an Eb, a B# turning into a C). Fixing it delivers the core value of the feature, and is independently useful even if whole-score transposition is not changed.

**Independent Test**: Put a C# in a measure in C major, copy it, and paste it into a measure in D major transposed up a whole step. It must appear as D#, not Eb. Put an A# in C major and paste into D major: it must appear as B#.

**Acceptance Scenarios**:

1. **Given** a C# in C major, **When** it is pasted/transposed into D major (up a major second), **Then** the pitch is spelled D#, not Eb.
2. **Given** an A# in C major, **When** it is pasted into D major (up a major second), **Then** the pitch is spelled B# (same number of accidentals added to the key as in the source).
3. **Given** notes that are all in the source key's signature, **When** they are pasted into another key, **Then** every note is spelled as the corresponding note of the destination key signature.
4. **Given** pasting into a measure in the same key with no transposition, **When** the paste completes, **Then** each pitch keeps its original spelling.

---

### User Story 2 - Whole-score transposition preserves chromatic spelling (Priority: P1)

A user opens the score transpose dialog and transposes the entire score (or selected staves) by an interval. The destination key signature is computed from the interval. Chromatic notes in the score keep their relationship to the key: a natural sign against a flat key signature stays an "up a step from the key tone" alteration in the destination, and so on.

**Why this priority**: Whole-score transposition is how users prepare parts for transposing instruments. Wrong enharmonic spellings force the user to hand-correct many notes, which is the main pain behind this request.

**Independent Test**: Create a passage in Eb major containing an E natural, then transpose the score up a major third (4 half steps) to G major. The E natural must become G#. Diatonic notes become the matching G major scale notes.

**Acceptance Scenarios**:

1. **Given** a passage in Eb major with an E natural, **When** the score is transposed up 4 half steps (destination key G major), **Then** the E natural becomes G#, not Ab.
2. **Given** a score transposed by any interval, **When** the transposition completes, **Then** the destination key signature of each measure is the key signature that results from the interval, and diatonic notes are spelled by that signature.
3. **Given** a chromatic note in the source key, **When** the score is transposed, **Then** the distance of the note from the destination key (how many accidentals must be added to the key to include it) equals its distance from the source key.

---

### User Story 3 - Sensible default spelling for notes outside the key (Priority: P2)

When a note not in the current key signature is created or converted to a different enharmonic spelling (for example by toggling between sharp and flat, entering a MIDI note, or other operations that must choose between equivalent spellings), the spelling that is closest to the key is chosen. "Closest" means the spelling that requires adding the fewest sharps or flats to the key signature for the note to belong to it. If two spellings are equally close, the flat spelling is chosen.

**Why this priority**: This is the second use of the existing table. It affects the default spelling of every non-key note, but each wrong default is a one-click correction, so it is less severe than the transposition errors above.

**Independent Test**: In C major, enter the pitch one half step below B. It must default to Bb rather than A#. In a key where a sharp spelling and a flat spelling are equally far from the key, the flat spelling must be chosen.

**Acceptance Scenarios**:

1. **Given** the key of C major, **When** the pitch a half step below B is spelled by default, **Then** the result is Bb (closer to the key than A#).
2. **Given** a pitch whose sharp spelling and flat spelling are equally far from the key, **When** the default spelling is chosen, **Then** the flat spelling is used.
3. **Given** a pitch that is already in the key signature, **When** the default spelling is chosen, **Then** the key's own spelling is used.

---

### User Story 4 - Existing behavior outside spelling is unchanged (Priority: P3)

Maintainers and users should see no change in how notes are laid out, played, or saved. Only the enharmonic spelling chosen during transposition, paste, and default spelling changes. The large per-key spelling table is removed from the product in favor of a rule derived from the key signature.

**Why this priority**: This is a refactor guard. It matters for confidence and maintainability but does not add a user-visible capability by itself.

**Independent Test**: Run the existing test suite and open an existing saved score. Everything that does not involve choosing between enharmonic spellings behaves as before.

**Acceptance Scenarios**:

1. **Given** the existing test suite, **When** it is run after the change, **Then** tests unrelated to enharmonic spelling continue to pass.
2. **Given** a saved score, **When** it is opened without being transposed, **Then** it renders and plays identically to before.

---

### Edge Cases

- A note whose preserved-distance spelling needs a double sharp or double flat (for example, a sharp above a key tone that is already sharped in the destination key): the double accidental is used, since it preserves the relationship.
- The source and destination keys are the same, or the transposition offset is zero: pitches keep their original spelling.
- Octave boundaries: a spelling change that crosses between B and C (for example B# or Cb) must land in the correct octave so the sounding pitch is unchanged.
- Transposing by an interval that gives an extreme destination key (more than 7 sharps or flats): the destination key is mapped to its enharmonic equivalent key with fewer accidentals, and note spelling follows the mapped key.
- Minor keys: a minor key and its relative major share a key signature; spelling is determined from the key signature, so both behave the same way.
- Percussion, unpitched, and rest notes are not affected.
- Grace notes, chord tones, and pitches stored on modifiers (such as pitch-bearing annotations) follow the same rules as regular notes.
- Two pitches in a chord that map to the same sounding pitch after transposition remain distinct chord tones as they do today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST decide the spelling of a transposed or pasted pitch using only the source key signature, the destination key signature, and the number of sharps or flats in each key signature. It MUST NOT rely on a per-key table of spellings.
- **FR-002**: The system MUST define the "distance" of a pitch from a key as the number of sharps or flats that would have to be added to the key signature for the pitch to belong to it, and MUST use distance to rank alternative spellings of the same sounding pitch.
- **FR-003**: When choosing a default spelling for a pitch that is not in the key, the system MUST choose the spelling with the smallest distance from the key. Example: in C major, the pitch a half step below B defaults to Bb rather than A#.
- **FR-004**: When two alternative spellings are equally distant from the key, the system MUST choose the flat spelling.
- **FR-005**: When a pitch is transposed or pasted from one key to another, the system MUST spell the result so that its distance from the destination key equals its distance from the source key, in the same direction (sharp or flat).
- **FR-006**: A pitch that belongs to the source key signature MUST be spelled as the corresponding pitch of the destination key signature.
- **FR-007**: Transposing C# in C major to D major MUST produce D#; pasting A# from C major into D major MUST produce B#.
- **FR-008**: The score transpose action MUST compute the destination key signature from the source key signature and the transposition interval, and MUST apply the distance-preserving rule to every pitch it transposes.
- **FR-009**: Transposing a passage in Eb major up 4 half steps to G major MUST turn an E natural into G#.
- **FR-010**: The sounding pitch (pitch class and octave) of every note MUST be unchanged by respelling; only the letter and accidental may change, and octave numbers MUST be adjusted wherever respelling crosses the B/C boundary.
- **FR-011**: The previous per-key enharmonic spelling table and the lookups built on it (role-of-pitch and pitch-for-role) MUST be removed, and every feature that used them (transposition, paste into another key, default enharmonic spelling, scale-tone lookup) MUST use the new key-signature-based logic instead.
- **FR-012**: Behavior that does not involve choosing between enharmonic spellings (rendering, playback, file load/save) MUST be unchanged.
- **FR-013**: Automated tests MUST cover the worked examples in this specification, the tie-break toward flats, same-key pasting, zero-offset transposition, and octave handling at the B/C boundary.

### Key Entities

- **Key signature**: A key identified by its tonic and its number of sharps or flats. It determines which seven spellings are natural to the key and is the only information needed to rank other spellings.
- **Pitch**: A letter, an accidental, and an octave. Several pitches can share one sounding pitch (enharmonic equivalents).
- **Distance (from a key)**: For a given spelling, the number of sharps or flats that must be added to the key signature for the pitch to belong to it (the number of fifths/fourths from the key to the nearest key containing the pitch), with a direction (sharp-side or flat-side). Zero for pitches in the key. Example: from C, Bb is 1 flat away and A# is 5 sharps away.
- **Transposition interval**: A signed number of half steps (with the matching diatonic step change) that, together with the source key, determines the destination key.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All worked examples in this specification (C# C→D = D#; A# C→D = B#; E natural Eb→G = G#; half step below B in C = Bb) produce the stated spelling.
- **SC-002**: Transposing every chromatic pitch in a 12-note chromatic passage between every pair of the 15 major key signatures produces a spelling whose distance from the destination key equals its distance from the source key, with no exceptions.
- **SC-003**: After transposing a passage and then transposing it back by the opposite interval, 100% of the notes return to their original spelling and octave, except notes whose intermediate spelling would need a triple sharp or flat; those are respelled to the nearest double-accidental spelling.
- **SC-004**: A user transposing a typical melody with chromatic passing notes needs to hand-correct no enharmonic spellings in the result.
- **SC-005**: The sounding pitch of every note is identical before and after respelling, for all tested keys and intervals.
- **SC-006**: The existing automated test suite passes with no regressions in behavior unrelated to enharmonic spelling.

## Assumptions

- Keys are identified by their key signature. A minor key uses the key signature of its relative major, and spelling decisions depend only on the signature.
- "Distance" is the number of steps around the circle of fifths (equivalently, a count of fourths or fifths) from the current key to the nearest key whose signature contains the pitch as spelled. This equals the number of sharps or flats that must be added to the signature. Example: from C major, Bb is 1 flat away (C to F major), while A# is 5 sharps away (C to B major), so Bb is the default.
- Direction is part of distance: a note one half step above a key tone is a sharp-direction alteration and a note one half step below is a flat-direction alteration; preserving distance means preserving both count and direction.
- When transposition would produce a destination key with more than 7 sharps or flats, the enharmonically equivalent key with fewer accidentals is used.
- Double sharps and double flats are allowed when needed to preserve the distance.
- The existing score transpose dialog and the paste-into-different-key flow are the only user entry points for transposition. No new dialogs or settings are introduced.
- The existing scale-tone lookup, which currently reads the table, will be satisfied from the key signature alone.
