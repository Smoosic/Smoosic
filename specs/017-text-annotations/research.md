# Phase 0 Research: Note Text Annotations

## 1. `SmoLyric.parser === annotation` already exists — this is additive wiring, not a new data field

**Decision**: Reuse `SmoLyric` (`src/smo/data/noteModifiers.ts:856`) with `parser: SmoLyric.parsers.annotation` (already `= 1`, `noteModifiers.ts:857-859`) as the annotation's storage. Reuse `SmoNote.addAnnotation`/`getAnnotations`/`removeAnnotations`/`removeAllAnnotations` (`src/smo/data/note.ts:530-591`) unmodified — they already filter/sort by `parser === SmoLyric.parsers.annotation` exactly like the lyric/chord equivalents.

**Rationale**: The data model for this feature is already fully built and, per spec Assumption ("exactly one annotation per note"), needs no new fields for verse/ordinality (annotations always use `verse: 0`, the `SmoLyric` default). This keeps the feature additive at the data layer, satisfying Constitution Principle #1 (serialization) trivially: a score with no annotations has no `SmoLyric` with `parser === 1` in any note's `textModifiers`, so it serializes/deserializes exactly as before with zero special-casing.

**Alternatives considered**: A dedicated `SmoAnnotation` class — rejected; the user's description explicitly specifies reusing `SmoLyric`, and the data-layer methods already exist, unused by any renderer/dialog/menu today.

## 2. Two pre-existing bugs/gaps must be fixed for annotations to render/select correctly

- **`SmoLyric.getClassSelector()` (`noteModifiers.ts:990-995`)** currently does `const parser = (this.parser === SmoLyric.parsers.lyric ? 'lyric' : 'chord')`, a binary lyric/chord check. For `parser === annotation`, it wrongly returns `'g.chord-<verse>'`, colliding with real chord elements. **Decision**: extend this to a three-way map (`lyric` / `chord` / `annotation`) so annotation elements get their own `g.annotation-<verse>` selector, matching the class strings `vxNote.ts` will assign (research §4).
- No other note-modifier code branches assume lyric-or-chord-only (`getTrueLyrics`/`getChords`/`getAnnotations` are already three separate, correctly-filtered methods).

**Rationale**: Necessary for correctness (FR-008, FR-009) — without this fix, `getClassSelector()` (used for `[NEEDS VERIFY: no current caller found in src/, but is a public API — fix defensively rather than leave a latent bug for a feature that now actually differentiates all three parser values]`) would mislabel annotation elements as chords. It's a two-line, backward-compatible fix (lyric/chord behavior unchanged).

## 3. Score-model write path: new `addOrUpdateAnnotation`/`removeAnnotation` on `SuiScoreViewOperations`, mirroring the lyric pair exactly

**Decision**: Add `addOrUpdateAnnotation(selector: SmoSelector, annotation: SmoLyric): Promise<void>` and `removeAnnotation(selector: SmoSelector, annotation: SmoLyric): Promise<void>` to `src/render/sui/scoreViewOperations.ts`, copied line-for-line from `addOrUpdateLyric`/`removeLyric` (`scoreViewOperations.ts:408-442`) except calling `note.addAnnotation`/`note.removeAnnotations` instead of `note.addLyric`/`note.removeLyric` — including the existing dual-tree write (the live `score` note gets the real `annotation` reference; the `equiv` "store" note gets a `SmoNoteModifierBase.deserialize(annotation.serialize())` clone), which is how this codebase keeps its render-side and undo/persistence-side note trees in sync on every lyric/chord mutation today.

**Rationale**: Matches the existing, working pattern exactly (least risk, consistent with how `010-vue-lyric-dialog` and `013-vue-chord-dialog` did the equivalent for lyrics/chords) rather than inventing a new mutation path.

**Alternatives considered**: Reusing `addOrUpdateLyric`/`removeLyric` directly, since `SmoNote.addLyric`/`addAnnotation` currently have identical bodies (`note.ts:522-537`) — rejected as fragile: it works today only because the two methods happen to be textually identical, and the naming (`addOrUpdateLyric` acting on an annotation) would be confusing to future maintainers and to anything that later special-cases lyrics vs. annotations in that path.

## 4. Vertical justify: a new plain-data field, deliberately not importing VexFlow into `src/smo`

**Decision**: Add a new field `verticalJustify: number` to `SmoLyric` (default `1`, i.e. "Top"), persisted like `translateX`/`translateY` (added to `SmoLyricParams`/`SmoLyricParamsSer`/`defaults`/`persistArray`). Expose the two allowed values as a static constant on `SmoLyric`, following the exact style of the adjacent `static readonly parsers` (`noteModifiers.ts:857-859`):

```ts
static readonly annotationVerticalJustify: Record<string, number> = {
  TOP: 1, BOTTOM: 3
};
```

The numeric values (`1`, `3`) are chosen to match VexFlow's own `VF.Annotation.VerticalJustify.TOP`/`BOTTOM` (`vexflow`'s enum also skips `2`, which is `CENTER`) so that `vxNote.ts` (a rendering-layer file, free to depend on VexFlow) can pass the stored number straight into `vexAnnotation.setVerticalJustification(...)` with no translation step. `src/smo/data/noteModifiers.ts` itself imports nothing from VexFlow to get this — the numbers are just chosen to line up.

**Rationale**: Constitution Principle #4 forbids rendering dependencies in `src/smo`. Mirroring `parsers`' existing style keeps the new constant consistent with the file's own conventions rather than introducing a new top-level TypeScript `enum` construct the file doesn't otherwise use. Field-level serialization for a new optional field with a default is exactly how `translateX`/`translateY` were already added, so legacy scores (no `verticalJustify` in saved JSON) deserialize to the default `1` (Top) automatically via the existing `smoSerialize.serializedMergeNonDefault`/`serializedMerge` default-filling mechanism — no new migration code (Constitution Principle #1).

**Alternatives considered**: A top-level exported `enum AnnotationVerticalJustify { TOP = 1, BOTTOM = 3 }` in `noteModifiers.ts`, matching the user's literal phrasing (`AnnotationVerticalJustify.TOP`) — kept as the *display name* for the concept in this feature's docs/UI, but the actual implementation is the `SmoLyric.annotationVerticalJustify` static map, consistent with the file's existing pattern; call sites read identically either way (`SmoLyric.annotationVerticalJustify.TOP`).

## 5. Menu entry and multi-selection semantics: reuse the existing `dynamicsDialogMenuOption` pattern exactly

**Decision**: Add `annotationDialogMenuOption` to `src/ui/menus/text.ts`'s `SuiTextMenuOptions` array, modeled directly on `dynamicsDialogMenuOption` (`text.ts:118-150`), which already implements precisely the multi-selection behavior the spec calls for:

```ts
const sel = menu.view.tracker.selections;
if (!sel.length || !sel[0].note) return;
const existing = sel[0].note.getAnnotations();
let annotation: SmoLyric;
if (existing.length) {
  annotation = existing[0];               // edit the existing one — do not touch the other selected notes yet
} else {
  annotation = new SmoLyric({ ...SmoLyric.defaults, parser: SmoLyric.parsers.annotation, text: '' });
  for (let i = 0; i < sel.length; ++i) {
    if (sel[i].note) { await menu.view.addOrUpdateAnnotation(sel[i].selector, annotation); }
  }
}
SuiAnnotationDialogVue({ ...menu-standard params..., modifier: annotation });
```

Then, exactly like `SuiDynamicDialogAdapter`'s setters (`src/ui/dialogs/dynamics.ts:46-84`), every field change made in the dialog's non-editing mode (font, X offset, Y offset, vertical justify) re-applies to *every* selection captured at menu-open time by looping `view.addOrUpdateAnnotation(selections[i], annotation)` again — call this `syncModifiers()`, copied from `SuiDynamicDialogAdapter.syncModifiers` (`dynamics.ts:46-50`). Because `annotation` is the same object reference pushed into every selected note's `textModifiers` (live-tree side), mutating one field and re-running `syncModifiers()` keeps every selected note's *live* copy trivially in sync (they're the literal same object); the loop's real job is keeping the *store/undo-tree* clones (`equiv!.note!.addAnnotation(altLyric)` inside `addOrUpdateAnnotation`, research §3) up to date on each change, since those are independent deserialized copies.

**Rationale**: This is not a new interaction pattern invented for this feature — `dynamicsDialogMenuOption` / `SuiDynamicDialogAdapter` already solve "one edited value, applied identically across an arbitrary multi-note selection, no note-to-note navigation" for dynamics markings. Annotations need exactly the same semantics (spec Assumptions: "no per-note next/previous navigation... applied identically to every selected note"), so reusing the pattern is both lower-risk and keeps the codebase's two similar features implemented the same way.

**Alternatives considered**: Looping only at creation time (seed all selections once, then edit only `sel[0]`'s copy) — rejected because it would desync the moment the user changes font/offset/justify on a multi-note selection (spec User Story 2 Scenario 6 requires the change to apply to every selected note, not just the first).

## 6. Dialog structure: `lyric.vue`'s two-mode shape, minus navigation/verse, plus X-offset and vertical-justify controls

**Decision**: New `SuiAnnotationDialogVue` (`src/ui/dialogs/annotationVue.ts`) + `annotation.vue` (`src/ui/components/dialogs/annotation.vue`), structurally modeled on `lyricVue.ts` / `lyric.vue` (`src/ui/dialogs/lyricVue.ts`, `src/ui/components/dialogs/lyric.vue`):

- Same `DialogMode = 'editing' | 'dialog'` ref, same auto-start-in-`'editing'`-mode behavior, same `dialogContainer.vue` shell (no `initialPosition`/drag — a plain modal, like the lyric dialog, not an anchored/draggable one like dynamics).
- **Removed** relative to `lyric.vue`: previous/next-note navigation buttons and their handlers (`goNext`/`goPrevious`/`onEditorAdvance`), the Verse `selectComp`, and the live cursor-position marker machinery (`computeMarkerPosition`/`updateMarker`/`removeMarker`) — that marker logic exists specifically to support note-to-note navigation while editing (`012-lyric-live-preview-cursor`), which this feature explicitly excludes.
- **Added** relative to `lyric.vue`: an X-offset `numberInputApp` alongside the existing Y-offset one (`lyric.vue` only exposes Y; `SmoLyric.translateX` already exists as a field but is unused by any dialog today), and a vertical-justify `selectComp` with two options (`Top` → `SmoLyric.annotationVerticalJustify.TOP`, `Bottom` → `...BOTTOM`).
- **Changed** relative to `lyric.vue`'s `onFontChange`: commits per-instance (`annotation.value.fontInfo = font; syncModifiers()`), not score-wide (`lyric.vue` calls `view.setLyricFont(...)`, which touches every lyric in the score — explicitly out of scope per spec Assumptions, which call for per-annotation font).
- Text editor: a new, simpler `annotationEditor.vue`, cloned from `lyricEditor.vue` (`src/ui/components/dialogs/lyricEditor.vue`) minus the `LyricNoHardBreak` extension's `'-'`/`Space` auto-advance shortcuts (no note-to-note navigation exists to advance to); `Enter`/`Shift-Enter` stay suppressed, matching `SmoLyric.text`'s existing single-line-only convention (same reason lyric text suppresses them). The `preview` emit (debounced live score update) is kept as-is, matching the established `012-lyric-live-preview-cursor` UX for the sibling dialog.

**Rationale**: Directly implements the spec's own framing ("exactly like lyric except: (1) no note-to-note nav, (2) font/offset are per-instance not score-wide, (3) applies to a selection"). Reusing `lyric.vue`'s proven mode/commit/font-picker/number-input scaffolding minimizes new code and keeps the dialog visually/behaviorally consistent with its closest sibling.

**Alternatives considered**: Basing the new dialog on `dynamics.vue`/`SuiDynamicDialogAdapter` instead (since multi-selection sync semantics are copied from there, research §5) — rejected for the *editing* half: dynamics has no free-text-editing session at all (it's a single-line dropdown selection), so it has nothing to model the text-editing mode on. The plan combines both precedents: `lyric.vue`'s two-mode/text-editing shape for the UI, `SuiDynamicDialogAdapter`'s multi-selection sync for the commit semantics.

## 7. Rendering: new `addAnnotationToNote` in `vxNote.ts`, dispatched from `createLyric()`

**Decision**: Add a third branch to `VxNote.createLyric()` (`src/render/vex/vxNote.ts:203-215`):

```ts
const annotations = this.noteData.smoNote.getAnnotations();
annotations.forEach((a) => this.addAnnotationToNote(this.noteData.staveNote, a as SmoLyric));
```

with `addAnnotationToNote` copied from `addLyricAnnotationToNote` (`vxNote.ts:159-183`) but: class string `'annotation annotation-' + lyric.verse'` (matching the `getClassSelector()` fix, research §2) instead of `'lyric lyric-' + ...'`, no hyphen-related logic (annotations have no hyphenation concept — `isHyphenated()`/`isDash()` are lyric-only per their own implementation, `noteModifiers.ts:1007-1024`, unaffected), and `vexL.setVerticalJustification(lyric.verticalJustify)` (the new per-instance field, research §4) instead of the hardcoded `VF.Annotation.VerticalJustify.BOTTOM`.

**Rationale**: Directly matches the user's instruction ("Text annotations are rendered in vxNote.ts, just like chord and lyric") and the existing `createLyric()` dispatch-by-parser structure — adding a third `getX()` → `addXToNote()` pair alongside the existing two, with no change to the lyric/chord branches.

## 8. Offset translation on layout: extend `updateLyricOffsets()`'s per-note pass, mirroring `_updateChordOffsets`

**Decision**: Add `_updateAnnotationOffsets(note: SmoNote)` to `VxSystem` (`src/render/vex/vxSystem.ts`), copied from `_updateChordOffsets` (`vxSystem.ts:105-117`) but iterating `note.getAnnotations()` instead of `note.getLyricForVerse(i, SmoLyric.parsers.chord)` for `i` in `0..2`, applying the identical `transform: translate(translateX, -translateY)` to the SVG element found by `this.context.svg.getElementById('vf-' + annotation.attrs.id)`. Call it from inside `updateLyricOffsets()`'s existing per-note loop (`vxSystem.ts:186-187`), alongside the existing `this._updateChordOffsets(note)` call, so it runs once per note per render pass exactly like the chord offset update does.

**Rationale**: Directly matches the user's instruction ("`updateLyricOffsets` should be enhanced to also translate the annotation SVG element, just like with chords and lyrics") and reuses `_updateChordOffsets`'s exact transform math and element-lookup convention (`vf-<attrs.id>`, same id `vxNote.ts`'s `addAnnotationToNote` sets via `setAttribute('id', lyric.attrs.id)`, research §7) rather than inventing a new positioning mechanism. Annotations don't need the lyric branch's cross-note vertical-alignment logic (`_lowestYLowestVerse`) — each annotation's position is independently authored per instance (spec: "you can specify font and offset on each individual annotation"), exactly matching how chords already behave (chords don't participate in `_lowestYLowestVerse` either — only true lyrics do).

## 9. Click-to-open: no new interaction — resolved with user before planning

**Decision**: Confirmed with the user during `/speckit-specify` (see spec.md Assumptions/FR-012): annotations open via the existing note-selection mechanism + the Text menu's new "Annotation" entry, identical to how lyrics and chords work today. No SVG click/hit-test handler is added for this feature.

**Rationale**: Neither lyrics nor chords have a direct click-to-open handler today (dialogs open exclusively via `SuiTextMenu` reading `tracker.selections`); building new hit-testing infrastructure for annotations alone, inconsistent with its two closest siblings, was explicitly rejected in favor of consistency and lower scope.

## 10. Testing approach

**Decision**: Same as `013-vue-chord-dialog` and `010-vue-lyric-dialog` — no automated test runner is wired up (`npm test` is a no-op placeholder). Verification is manual: `npm run build` + `npm run server`, exercised against the acceptance scenarios in `quickstart.md`. Per Constitution Principle #1/#2, if this project's test setup is later extended, the two purely-mechanical pieces worth a regression test first are: (a) `SmoLyric` serialize/deserialize round-trip with `verticalJustify` set/unset (legacy-score default-filling), and (b) `getClassSelector()`'s three-way branch. Neither is required by this plan.
