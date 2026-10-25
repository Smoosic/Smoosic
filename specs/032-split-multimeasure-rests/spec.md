# Feature Specification: Split Multimeasure Rests at Landmarks

**Feature Branch**: `032-split-multimeasure-rests`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "operations.ts computeMultipartRest and the logic in vxSystem, vxMeasure is not handling the case where a multimeasure rest is broken up because of a key signature, rehearsal mark, or other landmark. The score should display the landmark but it should not render a measure of rest between 2 multimeasure rests."

## Clarifications

### Session 2026-10-22

- Q: Where do landmarks that mark the end of a section (D.S., D.C., To Coda, Fine, an end-repeat or double barline) break the rest, and where are they shown? → A: The rest is broken after the measure that carries them, and they are shown on the first block (the symbol over that block's rest, the barline at its end).
- Q: Where do landmarks that mark the start of a section (Segno, Coda, a start-repeat or double barline, rehearsal mark) break the rest, and where are they shown? → A: The rest is broken before the measure that carries them, and they are shown at the beginning of the next block, after the separating barline.
- Q: Are tempo, key signature and time signature changes landmarks? → A: Yes, all three. Each is a start landmark: the rest is broken before the measure with the change and the change is shown at the start of the next block. (This replaces the earlier assumption that a tempo change does not split a rest.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A rehearsal mark inside a long rest starts the next multimeasure rest (Priority: P1)

A composer or arranger has a part with many empty measures in a row. Normally these are shown as one multimeasure rest (a thick bar with a count, such as "10"). They put a rehearsal mark (for example "B") on measure 6, in the middle of the rest. The part should now show a multimeasure rest for measures 1 to 5, then a second multimeasure rest for measures 6 to 10 that carries the rehearsal mark "B". Today the rest is broken in the wrong way: the measure with the rehearsal mark is drawn as a separate, ordinary measure of rest in between, so the player sees a rest of 5, a single rest bar, and then a rest of 4.

**Why this priority**: Rehearsal marks are the most common reason to break a long rest, and every part with a rest of more than a few bars and rehearsal letters is affected. The extra single bar is a visible engraving error and misleads the player about the count.

**Independent Test**: Make 10 empty measures, put a rehearsal mark on measure 6, and view the score. You should see exactly two multimeasure rests: one for measures 1 to 5 and one for measures 6 to 10, with the rehearsal mark shown above the second. No ordinary rest measure appears between them.

**Acceptance Scenarios**:

1. **Given** a run of empty measures with a rehearsal mark on a measure in the middle, **When** the score is displayed, **Then** the measures before the mark form one multimeasure rest and the mark's measure and the measures after it (up to the next break) form the next one, with the mark displayed.
2. **Given** a rehearsal mark on the very first measure of a run of rests, **When** the score is displayed, **Then** the whole run is one multimeasure rest that starts with the mark.
3. **Given** a rehearsal mark on a measure that is followed by music (not rests), **When** the score is displayed, **Then** that measure is shown as an ordinary measure of rest with its mark, because a single bar is not a multimeasure rest.
4. **Given** two rehearsal marks in a run of rests, **When** the score is displayed, **Then** each mark begins its own multimeasure rest and no single-bar rest appears between them.

---

### User Story 2 - Key, time signature and tempo changes inside a long rest (Priority: P1)

The same rule applies when the key signature, time signature or tempo changes during a run of empty measures. The measures before the change form one multimeasure rest; the measure with the change starts the next multimeasure rest, and the new signature or tempo is shown at its start. There is never a lone ordinary rest measure between them.

**Why this priority**: Key and time changes during a rest are normal in orchestral parts (a movement may change key while a part is tacet), and the player must see the new signature before they play again.

**Independent Test**: Make 8 empty measures, change the key signature at measure 5, and view the score. Expect a multimeasure rest for measures 1 to 4, then a multimeasure rest for measures 5 to 8 that begins with the new key signature, with no single rest bar between them. Repeat for a time signature change.

**Acceptance Scenarios**:

1. **Given** a run of empty measures with a key signature change at one measure, **When** the score is displayed, **Then** the rest is split into two multimeasure rests at that measure, and the new key signature is displayed at the start of the second.
2. **Given** a time signature change inside a run of empty measures, **When** the score is displayed, **Then** the same split occurs and the new time signature is displayed at the start of the second.
3. **Given** a run of empty measures with a tempo change at one measure, **When** the score is displayed, **Then** the same split occurs and the new tempo is displayed at the start of the second.
4. **Given** a run of empty measures with both a key signature change and a rehearsal mark on the same measure, **When** the score is displayed, **Then** one split is made there, and both are displayed.

---

### User Story 3 - Landmarks that end a section break the rest after their measure (Priority: P1)

Some markings belong to the end of a measure, not its start: D.S. and D.C. (al Coda, al Fine), To Coda, Fine, and an end-repeat or double barline. When one of these is on an empty measure inside a run of rests, the rest is broken after that measure: the measure with the marking is the last bar of its block, the marking is shown over that block's rest (or, for a barline, at the end of the block), and the next block begins on the following measure. Markings that belong to the start of a measure (Segno, Coda, a start-repeat or double barline) are handled as in User Story 1: the rest is broken before that measure, and the marking is shown at the beginning of the next block, after the separating barline.

**Why this priority**: Without this rule, a "D.S. al Coda" in the middle of a long rest would either be lost or would force a lone rest bar. Players rely on seeing the instruction where the music ends, and on a Segno or Coda sign where the music resumes.

**Independent Test**: Make 12 empty measures. Put a D.S. al Coda on measure 4 and a Coda sign on measure 9. View the score. Expect a multimeasure rest for measures 1 to 4 with the D.S. al Coda shown over it, a multimeasure rest for measures 5 to 8, and a multimeasure rest for measures 9 to 12 with the Coda sign shown at its start, after the barline. No ordinary rest bar appears between them.

**Acceptance Scenarios**:

1. **Given** a D.S., D.C., To Coda or Fine marking on an empty measure inside a run of rests, **When** the score is displayed, **Then** the rest is broken after that measure and the marking is displayed over the multimeasure rest that ends with it.
2. **Given** a Segno or Coda sign on an empty measure inside a run of rests, **When** the score is displayed, **Then** the rest is broken before that measure and the sign is displayed at the beginning of the multimeasure rest that starts with it, after the barline that separates the blocks.
3. **Given** an end-repeat barline or a double barline at the end of an empty measure inside a run of rests, **When** the score is displayed, **Then** the rest is broken after that measure and the barline is drawn at the end of the block that ends with it.
4. **Given** a start-repeat barline or a double barline at the start of an empty measure inside a run of rests, **When** the score is displayed, **Then** the rest is broken before that measure and the barline is drawn at the start of the block that begins with it.
5. **Given** a rest that is broken at a barline, **When** the score is displayed, **Then** the barline appears once, between the two blocks, and not both at the end of the first block and again at the start of the second.

---

### Edge Cases

- What happens when a start landmark sits on the last measure of the run of rests, so only one measure would follow it? That measure is a single bar and is shown as an ordinary measure of rest, as today, because there is nothing to merge it with.
- What happens when an end landmark (such as D.S.) is on the first measure of a run of rests? That measure is a single bar, shown as an ordinary measure of rest with the marking, and the rest continues after it.
- What happens when one measure carries both a start landmark and an end landmark (for example a rehearsal mark and a D.S.)? That measure is a block of its own, shown as an ordinary measure of rest with both markings, between the blocks before and after it. This is unavoidable, and is the only case where a single rest bar appears between multimeasure rests.
- What happens when the measure after a split is followed by notes? The measure carrying the landmark is an ordinary rest bar, and the music follows.
- What happens when the run of rests has start landmarks on consecutive measures (for example marks on 5 and 6)? Measure 5 is a single bar with its mark; measure 6 starts the next multimeasure rest, if the rest continues.
- What happens when a part with more than one staff is displayed (for example a piano part)? A landmark on any staff splits the rest on all staves, since all staves must have the same measure groupings, and each staff shows the landmark it has.
- What happens when a part is displayed with "expand multimeasure rests" turned on? Every rest measure is shown individually, as today, and nothing changes.
- What happens when the user adds or removes a landmark? The grouping updates at the next display, with no leftover single-bar rest.
- What happens when a measure that is part of a repeat ending (volta bracket) is empty? These keep the behavior they have today: measures under an ending bracket are shown individually. This feature does not change how endings are shown.
- What happens when the score is printed or exported to an image? The same grouping is used.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A run of consecutive empty measures MUST be shown as a multimeasure rest, unless multimeasure rests are turned off for the score or part.
- **FR-002**: A landmark that belongs to the start of a measure (a start landmark) MUST end the multimeasure rest that precedes that measure: the measures before it are one multimeasure rest and the landmark's measure is not part of that rest.
- **FR-003**: The measure carrying a start landmark MUST start a new multimeasure rest that includes it and the empty measures that follow it, up to the next break. The landmark MUST be displayed at the beginning of that rest, after the barline that separates the blocks.
- **FR-004**: The start landmarks are: a rehearsal mark, a key signature change, a time signature change, a tempo change, a Segno or Coda sign, a start-repeat barline or a double barline at the start of a measure, and a change of instrument.
- **FR-005**: A landmark that belongs to the end of a measure (an end landmark) MUST end the multimeasure rest at that measure: the measure carrying it is the last bar of its block, and the next block begins on the following measure. The landmark MUST be displayed on the block that ends with it: a D.S., D.C., To Coda or Fine marking over the rest, and an end-repeat or double barline at the end of the block.
- **FR-005a**: The end landmarks are: a D.S. or D.C. marking (al Coda or al Fine), To Coda, Fine, and an end-repeat barline or a double barline at the end of a measure.
- **FR-006**: The system MUST NOT draw an ordinary measure of rest between two multimeasure rests merely because the second begins at a start landmark or the first ends at an end landmark.
- **FR-007**: A measure that is the only empty measure in its block (for example, a start landmark followed by music, an end landmark right after another break, or a measure carrying both kinds) MUST be shown as an ordinary measure of rest with its landmarks.
- **FR-007a**: A barline that falls between two blocks MUST be drawn once, between them, as the end of the first block or the start of the second as appropriate, and MUST NOT be repeated at both.
- **FR-008**: The grouping MUST be the same on every staff of the displayed score, and a landmark on any staff MUST split the rest on all of them.
- **FR-009**: The count shown on each multimeasure rest MUST be the number of measures it spans, and the sum of the counts of adjacent rests plus any single bars between them MUST equal the number of empty measures.
- **FR-010**: Turning on "expand multimeasure rests" for a part MUST continue to show every measure individually, and measures under a repeat ending MUST keep their current behavior.
- **FR-011**: The grouping MUST be recomputed whenever the displayed measures change (editing, adding or removing a landmark, changing the part), so that no stale single-bar rest or hidden measure remains.

### Key Entities

- **Multimeasure rest**: A group of two or more consecutive empty measures drawn as one measure with a count.
- **Start landmark**: A marking that belongs to the beginning of a measure: rehearsal mark, key, time or tempo change, Segno, Coda, start-repeat or double barline, instrument change.
- **End landmark**: A marking that belongs to the end of a measure: D.S., D.C., To Coda, Fine, end-repeat or double barline.
- **Break**: The point between two measures at which one multimeasure rest ends and the next begins: just before a measure with a start landmark, or just after a measure with an end landmark.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a run of N empty measures with B breaks (each start landmark not on the first measure and each end landmark not on the last measure adds one), the score shows B + 1 blocks, a block of two or more measures is one multimeasure rest, no block of two or more measures is drawn as separate rests, and the measures shown add up to N.
- **SC-002**: Each start landmark is visible at the beginning of the block it starts, and each end landmark on the block it ends, in 100% of cases.
- **SC-003**: With "expand multimeasure rests" on, the score shows N separate measures, as before, in 100% of cases.
- **SC-004**: Scores with no landmarks inside their runs of empty measures display exactly as they did before this change.
- **SC-005**: After adding or removing a landmark, the displayed grouping matches a fresh display of the same score in 100% of cases.

## Assumptions

- "Empty measure" means a measure that contains only rests, as the application already defines it for multimeasure rests.
- Which measures count as a landmark is the set in FR-004 and FR-005a. Text annotations are not landmarks and do not split a rest. Measures covered by a repeat ending bracket keep today's behavior and are out of scope.
- Multi-staff scores always keep the same grouping on all staves, since the staves share their measures' positions.
- The rule applies equally when a part is displayed, since a part is just a score showing selected staves.
- The count shown on a multimeasure rest and its end barline follow the existing rules; only where a rest starts and ends changes.
