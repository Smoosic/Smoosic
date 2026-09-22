# Research: Convert Note-Attached Text Groups to Annotations

Phase 0 findings from reading the code. Each section gives Decision / Rationale / Alternatives.

## 1. Where the conversion hooks in

**Decision**: A new static helper on `SmoScore` in `src/smo/data/score.ts`, called from `SmoScore.deserialize` right after the score text groups are built (the `textGroups` loop that ends at `score.ts:744`) and after the staves exist (`score.ts:732-737`). It is called for the score list and once per staff for `staff.partInfo.textGroups`.

**Rationale**: Text groups are deserialized after the staves, so at that point both the notes and the groups are in memory and the note can be found without a `SmoScore` instance (the helper indexes `staves[staff].measures[m].voices[v].notes[tick]` directly instead of using `SmoSelection.noteSelection`, which needs a constructed score). `SmoSystemStaff.deserialize` has already built each `partInfo.textGroups`, so parts need no separate deserialization pass.

**Alternatives considered**:
- Convert inside `SmoTextGroup.deserialize`: it has no access to the staves.
- Convert lazily on first render: `src/smo` would depend on render timing, and saving before render would write the old form.
- Convert after `new SmoScore(params)` and use `SmoSelection.noteFromSelector`: works but adds a dependency on the selections module for a three-level array lookup.

## 2. Mapping a text group to annotations

**Decision**: One annotation per text block whose text has non-whitespace content, in block order.

- text: the block's `SmoScoreText.text`
- fontInfo: a copy of the block's `SmoScoreText.fontInfo` (both are the same `FontInfo` shape)
- parser: `SmoLyric.parsers.annotation`
- verse: next free annotation index on the target note, starting at 0
- translateX: the group's `musicXOffset`; translateY: the negated `musicYOffset` (see below)
- verticalJustify: `SmoLyric.defaults` (TOP)

**Rationale**: `SmoNote.addAnnotation` already treats `(parser, verse)` as the key and replaces on a collision, and `018` caps a note at four annotations (verse 0-3, `annotation.vue:40`). Carrying the font keeps the look. The offsets are group-level, so every block's annotation gets the same pair.

**Offset direction**: the group's `musicYOffset` is down-positive (`scoreRender.ts:135-136` adds it to the staff's y), but an annotation's `translateY` is applied as `translate(x, -translateY)` (`vxSystem.ts:125`), i.e. up-positive. Copying it straight would push the text the opposite way, so it is negated; `musicXOffset` has the same direction as `translateX` and is copied. The result is the same shift in the same direction, not the same spot: the group's offset is measured from the measure's staff origin and the annotation's from its note, and the annotation is also justified above the note by default. `tg.musicXOffset || 0` and `-tg.musicYOffset || 0` also keep a missing value or zero from becoming `NaN` or `-0`.

**Alternatives considered**: Concatenating all blocks into one annotation (rejected: the request says one per block, and a single annotation can't carry mixed fonts). Overwriting existing verses (rejected: it would destroy annotations the user already made). Copying `musicYOffset` unchanged (rejected: opposite vertical direction). Resetting offsets to 0 (the first version of this plan; rejected because the offsets are the only positioning the user had applied).

## 3. Locating the note for part text groups

**Decision**: For a group in the score list, use the selector as recorded. For a group in a staff's `partInfo.textGroups`, use the index of the staff that owns that `partInfo`, plus the selector's `measure`, `voice`, `tick`. The recorded `selector.staff` on part groups is ignored.

**Rationale**: `SmoScore.updateTextGroup` copies an attached score group into `stave.partInfo` of the note's own staff and sets the copy's `selector.staff = 0` (`score.ts:1338-1345`, with a TODO for multi-staff parts). `SuiScoreView._mapPartFormatting` later rewrites that staff number to the view's staff id at display time (`scoreView.ts:646-648`). So the value on a saved part group is part-relative and unreliable, while the owning staff is the note's staff.

**Alternatives considered**: Use the recorded staff (wrong for every part after the first staff). Owner index plus recorded staff (would misplace groups whose staff was rewritten to a view id above 0).

**Risk**: A hand-edited or otherwise unusual part group that points to a different staff than the one holding it would be attached to the owner's staff, or dropped if that note doesn't exist. Accepted; the generated data doesn't do this.

## 4. Score copy vs part copy of the same text

**Decision**: For a part's text group, if the target note already has any annotation, discard the whole group. Process the score list first, then parts. The rule does not apply to the score's own list.

**Rationale**: When a part has `preserveTextGroups`, every attached group added to the score is also copied into that staff's `partInfo` (`score.ts:1337-1347`). Converting both would put two identical annotations on the note. Also, `SmoScore.fixTextGroupSinglePart` (`score.ts:622-633`) replaces the score's text group list with a copy of the sole staff's part list for one-staff scores, so the duplication is the normal case there, not an oddity. The check is at the group level and on the note having any annotation, not on matching text: the score's and the part's text groups are never shown together, but the annotations live on the note and show in both, and a part's copy can be edited on its own so its text need not match. It is also what makes the helper safe to run twice. It is limited to parts because two distinct groups in the score's list that point at the same note are legitimate (both convert, in list order).

**Alternatives considered**: Skip a block whose text equals an existing annotation (the first version; rejected: misses a part copy whose text differs, which then adds a second set to the note). Apply the discard rule to the score's list as well (rejected: it would drop a second attached group on the same note, and the annotations added by the first group would count as pre-existing). Match on text group `attrs.id` (rejected: the ids can differ because part copies are re-deserialized, and it wouldn't cover the single-part replacement). Convert only the score's list and drop part groups unconverted (rejected: loses part-only attached text, violating FR-006).

## 5. `skipStaves` deserialize path

**Decision**: The helper does nothing (leaves the group list unchanged) when the staff list is empty.

**Rationale**: `SuiScoreView.setView` builds a view score with `SmoScore.deserialize(JSON.stringify(storeScore.serialize({ skipStaves: true, ... })))` (`scoreView.ts:664`), then attaches staves afterwards. With zero staves no note can be found, and the "unmatched groups are removed" rule would delete groups. The store score is migrated before this runs, so the copy has no attached groups anyway; the guard is defence in depth.

**Alternatives considered**: No guard (relies on ordering; one future caller could lose data silently). Passing a flag through `deserialize` (more surface for a one-line condition).

## 6. Headless test feasibility

**Decision**: Add `tests/attachedTextMigration.ts` and run it with `ts-node`.

**Rationale**: I ran `ts-node -T -O '{"module":"commonjs","moduleResolution":"node"}'` against `src/smo/data/score.ts`, built an empty score and serialized it; it loaded without a DOM. `ts-node` and `tsc` are already in `node_modules`. `tests` is excluded by `tsconfig-types.json` and already listed in `build/build.js`'s loader include. Constitution Principle #1 asks for serialization coverage of new features; this gives it without introducing a test framework.

**Alternatives considered**: Manual-only verification (as `017`/`018` did; weaker for a data migration that silently drops data on a bug). Adding jest/vitest (new dependency for one script).

## 7. What stays and what goes for `attachToSelector`

**Decision**: Only the toggle and its handlers leave `textBlock.vue`. The `attachToSelector` and `selector` properties stay in `SmoTextGroup` (`scoreText.ts` attribute lists and defaults), in the serialization dictionary (`src/common/serializationHelpers.js`), and in the legacy i18n tables. Render and layout branches keyed on `attachToSelector` (`scoreRender.ts:121`, `scoreView.ts:646,679`, `score.ts:977,1041,1337`, `scoreText.ts:664,722,730`) are left alone.

**Rationale**: The conversion reads those fields from legacy JSON. Deleting the model fields is a separate cleanup once scores have had a release to migrate. The dialog's other handlers only need `attachToSelector` for the mutually-exclusive toggle logic in `onPaginationSelect`, which becomes a plain assignment.

**Alternatives considered**: Removing the property and all render branches now (bigger diff, and it breaks legacy deserialization the migration depends on).

## 8. Where migrated output shows up

**Decision**: No render work. An annotation is a note modifier, so it appears wherever the note appears: main score and part views alike.

**Rationale**: `SuiScoreView.setView` copies each staff by serializing it, notes and their annotations included (`scoreView.ts:671-675`); `017` already renders annotations. A group that used to appear only in a part now also appears in the main score, which the spec lists as an accepted edge case.

## Open items

None. All Technical Context fields resolved; no `NEEDS CLARIFICATION` markers.
