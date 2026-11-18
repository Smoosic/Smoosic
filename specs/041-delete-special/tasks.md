---

description: "Task list for Delete Special for Note Attachments"
---

# Tasks: Delete Special for Note Attachments

**Input**: Design documents from `/specs/041-delete-special/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/delete-special-api.md](contracts/delete-special-api.md), [quickstart.md](quickstart.md)

**Tests**: Included (spec FR-017 requires them) for the model, in `tests/deleteSpecial.ts`. The view method and the dialog cannot be loaded headless (they import the DOM and a `.vue` file), so they are checked by compilation, by compiling the component with Vue's SFC compiler, by searches, and by [quickstart.md](quickstart.md).

**Organization**: The removal logic is the base for every story, so it is in the Foundational phase. Each story then adds its piece: the command and dialog a user can reach (US1), proof that each kind removes exactly what its name says (US2), and proof that the selection is respected (US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: Which user story the task belongs to (US1 to US3)

## Phase 1: Setup

- [X] T001 Create `tests/deleteSpecial.ts` with the `check()`/failure-count harness and the dynamic-constructor registration used in `tests/pasteSpecial.ts` (`noteModifierDynamicCtorInit`, `measureModifierDynamicCtorInit`, `staffModifierDynamicCtorInit`, `scoreModifierDynamicCtorInit`), plus helpers: `buildScore(measures: number, staves: number)` (default score via `SmoScore.getDefaultScore(SmoScore.defaults, null)`, four quarter notes per measure, extra measures and staves added as in `tests/pasteSpecial.ts`), `pick(score, staff, measure, tick)` returning a `SmoSelection.noteSelection`, and `decorate(note)` that gives a note one of every kind: a `SmoDynamicText`, `SmoLyric` lyrics for verses 0 and 1, a `SmoLyric` annotation, a `SmoLyric` chord (parsers from `SmoLyric.parsers`), an articulation, an ornament, a grace note, an arpeggio (`SmoArpeggio`) and a microtone (`SmoMicrotone`). The file ends with `process.exit(failures ? 1 : 0)` like the other tests. Register `"test:delete-special": "ts-node -P tests/tsconfig.json tests/deleteSpecial.ts"` in `package.json` next to `test:dynamics-font-size`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The removal logic on the model and the view method that applies it. See [research.md](research.md) R1 to R4 and [data-model.md](data-model.md).

- [X] T002 In `src/smo/xform/operations.ts` add and export `type DeleteAttributeKind = 'dynamics' | 'lyrics' | 'annotations' | 'chords' | 'articulations' | 'ornaments' | 'graceNotes' | 'arpeggios' | 'microtones'`. Add a file-private table `deleteAttributeHandlers: Record<DeleteAttributeKind, { count: (note: SmoNote) => number, clear: (note: SmoNote) => void }>` built exactly as the data-model table (lyrics, annotations and chords filter `note.textModifiers` for `attrs.type === 'SmoLyric'` and the matching `SmoLyric.parsers` value; dynamics filter on `attrs.type === 'SmoDynamicText'`; the rest set the array field to `[]` or `arpeggio` to `undefined`). In `class SmoOperation` add `static readonly deleteAttributeKinds: DeleteAttributeKind[]` (all nine in the data-model order), `static countNoteAttributes(selections: SmoSelection[], kinds: DeleteAttributeKind[]): number` (read only; skips selections with no `note`; ignores kinds that are not in the table) and `static deleteNoteAttributes(selections: SmoSelection[], kinds: DeleteAttributeKind[]): void` (clears each known kind on each selection's note). Import `SmoLyric` and `SmoDynamicText` if not already imported
- [X] T003 In `src/render/sui/scoreViewOperations.ts`, next to `pasteAttributes`, add `async deleteNoteAttributes(kinds: DeleteAttributeKind[]): Promise<void>`: return at once if `kinds.length < 1` or `SmoOperation.countNoteAttributes(this.tracker.selections, kinds) < 1`; otherwise `await this.modifyCurrentSelections('delete special', (score, selections) => { SmoOperation.deleteNoteAttributes(selections, kinds); })`. Add a doc comment saying it is one undo step and that it changes nothing else about the notes. Import `DeleteAttributeKind` from `../../smo/xform/operations`
- [X] T004 Run `npx tsc --noEmit -p tsconfig.json` to confirm the foundation compiles

**Checkpoint**: A library caller can delete the nine kinds from selections and from the view.

---

## Phase 3: User Story 1 - Remove only chosen kinds of markings from the selected notes (Priority: P1)

**Goal**: **Edit > Delete Special...** opens a dialog with nine unticked boxes; confirming removes the ticked kinds from the selected notes in one undo step; nothing ticked or Cancel changes nothing.

**Independent Test**: Run the D cases in `tests/deleteSpecial.ts`, then [quickstart.md](quickstart.md) section 4 steps 1 to 3 and 6.

- [X] T005 [P] [US1] In `tests/deleteSpecial.ts` add the D cases: D1 to D9, one per kind. For each, `decorate` four notes, select all four, call `SmoOperation.deleteNoteAttributes(selections, [kind])`, and check that kind's count is 0 on every note, that the other eight kinds' counts and values are unchanged (compare each note's serialized markings before and after, except the one kind), and that `pitches`, `tickCount` and `noteType` are unchanged. Add C1 (`countNoteAttributes` with `[]` is 0 and `deleteNoteAttributes` with `[]` changes nothing), C2 (a list with an unknown string, `['bogus' as any, 'dynamics']`, still removes the dynamics and does not throw) and C3 (before a delete the count equals the number of markings `decorate` added; after, it is 0)
- [X] T006 [P] [US1] Create `src/ui/components/dialogs/deleteSpecial.vue` modelled on `pasteSpecial.vue`: props `domId`, `label`, `kinds: { id: string, label: string }[]`, `selected: Record<string, boolean>`, `commitCb`, `cancelCb`; a `toggle` per kind with `:initialValue="false"` and `:changeCb="(value: boolean) => { selected[kind.id] = value }"`; `dialogContainer` with `:enable="canDelete"` where `canDelete` is `props.kinds.some((kind) => selected[kind.id] === true)`. No replace toggle
- [X] T007 [US1] Create `src/ui/dialogs/deleteSpecial.ts` modelled on `pasteSpecial.ts`: export `SuiDeleteSpecialDialog = async (parameters: SuiDialogParams) => {...}` with a labels record (`dynamics: 'Dynamics'`, `lyrics: 'Lyrics'`, `annotations: 'Annotations'`, `chords: 'Chords'`, `articulations: 'Articulations'`, `ornaments: 'Ornaments'`, `graceNotes: 'Grace Notes'`, `arpeggios: 'Arpeggios'`, `microtones: 'Microtones'`) typed `Record<DeleteAttributeKind, string>`, a reactive `selected` record with every `SmoOperation.deleteAttributeKinds` entry set to false, `commitCb` calling `parameters.view.deleteNoteAttributes(SmoOperation.deleteAttributeKinds.filter((kind) => selected[kind]))`, a no-op `cancelCb`, `label: 'Delete Special'`, and `InstallDialog({ app: deleteSpecialApp, appParams, root: rootId, dialogParams: parameters, commitCb, cancelCb })` (depends on T006)
- [X] T008 [US1] In `src/ui/menus/edit.ts` import `SuiDeleteSpecialDialog`, add `deleteSpecialMenuOption: SuiConfiguredMenuOption` after `pasteSpecialMenuOption` (handler opens the dialog with the same parameters as Paste Special but `ctor: 'SuiDeleteSpecialDialog'` and `id: 'deleteSpecial'`; `display: () => true`; `menuChoice: { icon: '', text: 'Delete Special...', value: 'deleteSpecialAction' }`), and insert it into `SuiEditMenuOptions` right after `pasteSpecialMenuOption` (depends on T007)
- [X] T009 [P] [US1] In `src/application/exports.ts` add `import { SuiDeleteSpecialDialog } from '../ui/dialogs/deleteSpecial';`, `export * from '../ui/dialogs/deleteSpecial';` after the pasteSpecial export, and `SuiDeleteSpecialDialog` to the exported-names object next to `SuiPasteSpecialDialog`. In root `typedoc.ts` add `export * from './src/ui/dialogs/deleteSpecial';` in sorted position (after `./src/ui/dialogs/dialog`)
- [X] T010 [P] [US1] Update the declarations by hand (do not run `npm run types`; it rewrites many unrelated files): create `types/src/ui/dialogs/deleteSpecial.d.ts` in the style of `pasteSpecial.d.ts`; in `types/src/smo/xform/operations.d.ts` add the `DeleteAttributeKind` type, `deleteAttributeKinds`, `countNoteAttributes` and `deleteNoteAttributes`; in `types/src/render/sui/scoreViewOperations.d.ts` add `deleteNoteAttributes(kinds: DeleteAttributeKind[]): Promise<void>` and its import; in `types/src/application/exports.d.ts` add the `export *` line and the `SuiDeleteSpecialDialog` member next to the Paste Special ones; in `types/typedoc.d.ts` add the export
- [X] T011 [US1] Run `npx tsc --noEmit -p tsconfig.json`, `npm run test:delete-special`, and the SFC check from [quickstart.md](quickstart.md) section 2 on `src/ui/components/dialogs/deleteSpecial.vue` (expect parse errors 0 and a successful compile)

**Checkpoint**: User story 1 works end to end; the command is in the Edit menu.

---

## Phase 4: User Story 2 - The right markings are removed, and only those (Priority: P1)

**Goal**: Show that lyrics, annotations and chords never remove each other, and that every kind removes exactly what its name says.

**Independent Test**: Run the L, M and N cases in `tests/deleteSpecial.ts`, then [quickstart.md](quickstart.md) section 4 step 4.

- [X] T012 [US2] In `tests/deleteSpecial.ts` add the L cases on one note with lyrics in verses 0 and 1, an annotation and a chord: L1 deleting `['lyrics']` removes both verses and leaves the annotation and the chord; L2 deleting `['annotations']` leaves both lyrics and the chord; L3 deleting `['chords']` leaves both lyrics and the annotation. Add M1 (all nine kinds in one call leave the note with no markings and the same pitches and duration), M2 (three kinds, `['dynamics', 'ornaments', 'microtones']`, leave the other six untouched), N1 (a note with none of the ticked kinds is deep-equal in its serialized form before and after, no exception) and N2 (a second identical delete counts 0 and changes nothing)

**Checkpoint**: Each checkbox means exactly its name.

---

## Phase 5: User Story 3 - Work on any selection, in any number of staves and voices (Priority: P2)

**Goal**: The delete applies to exactly the selected notes, across measures, staves and voices, rests included, and the result survives a save.

**Independent Test**: Run the S, R and P cases in `tests/deleteSpecial.ts`, then [quickstart.md](quickstart.md) section 4 steps 7 and 8.

- [X] T013 [US3] In `tests/deleteSpecial.ts` add the S cases on a 4-measure, 2-staff score with every note decorated: S1 a single-note selection changes only that note; S2 a run of notes that stops inside a measure changes exactly those notes; S3 measures 2 and 3 of both staves selected, deleting dynamics leaves measures 1 and 4 of both staves with theirs; S4 a second voice in a measure (add a voice as in `tests/voiceCopyPaste.ts`) with only voice 1's notes selected leaves voice 2's markings. Add R1 (rests given a dynamic and an annotation lose them when selected, and stay rests with the same duration). Add P1 (decorate, delete `['graceNotes', 'dynamics']`, serialize the score with `{ skipStaves: false, useDictionary: false, preserveStaffIds: false }`, load it with `SmoScore.deserialize`, and check the reloaded notes have none of those two kinds and still have the other seven, with the same pitches and durations)

**Checkpoint**: All stories are done.

---

## Phase 6: Polish and Cross-Cutting Concerns

- [X] T014 [P] Add a `changes.md` entry at the top (follow the entries there, dated 11-16-2026) describing: the Edit menu has a new **Delete Special...** that removes the chosen kinds of marking (dynamics, lyrics, annotations, chords, articulations, ornaments, grace notes, arpeggios, microtones) from the selected notes; nothing is ticked at first; the notes' pitches and rhythms are not changed; lyrics, annotations and chords are separate choices; it is one undo step; and, for library users, `SmoOperation.deleteNoteAttributes`, `countNoteAttributes` and `deleteAttributeKinds`, `SuiScoreViewOperations.deleteNoteAttributes`, and `SuiDeleteSpecialDialog`
- [X] T015 Run `npx tsc --noEmit -p tsconfig.json`, then `npm run test:delete-special`, `npm run test:paste-special`, `npm run test:voice-copy-paste`, `npm run test:dynamics-font-size`, `npm run test:score-archive`, `npm run test:quick-beam`, `npm run test:measure-fill` and `npm run test:beam-groups`; all must pass. Run `git grep -n "SuiDeleteSpecialDialog" -- src types typedoc.ts` and confirm the dialog is in the menu, exports, typedoc and declarations
- [ ] T016 Walk through [quickstart.md](quickstart.md) section 4 by hand in the running application and note any difference from the expected results

---

## Dependencies and Execution Order

- Phase 1 (T001) first. Phase 2 (T002 to T004) blocks every story: T003 needs T002; T004 after both.
- US1 (T005 to T011): T005 and T006 are independent files; T007 needs T006; T008 needs T007; T009 and T010 are independent files and only need the names from T002, T003 and T007; T011 after all of them.
- US2 (T012) and US3 (T013) are tests only, need only Phase 2, and edit the same test file as T005, so run them after T005 (not in parallel with it).
- Polish (T014 to T016) after the stories; T014 can start any time.

### Parallel opportunities

- T005 and T006 (different files).
- T009 and T010 (different files).
- T014 with anything.

## Implementation Strategy

**MVP**: Phase 1, Phase 2, then US1 (T001 to T011): the Edit menu has Delete Special, the dialog works, and each kind is tested on its own. US2 and US3 add the tests that prove no kind takes another with it and that the selection is respected; they should be done before the feature is considered finished, since a delete that removes too much is data loss.

Run `npm run test:delete-special` after each phase.
