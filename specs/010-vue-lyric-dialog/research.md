# Phase 0 Research: Vue-Based Lyric Dialog

All unknowns below were resolved by reading the existing codebase (no external research was needed — this is an internal migration reusing established in-repo patterns). No `NEEDS CLARIFICATION` markers remain in the Technical Context.

## 1. Creation-function pattern

- **Decision**: `SuiLyricDialogVue` is a plain exported function `(parameters: SuiDialogParams) => void`, mirroring `SuiTextBlockDialogVue` in `src/ui/dialogs/textBlockVue.ts`. It: calls `replaceVueRoot(modalContainerId)`, captures the initial selection (`view.tracker.selections[0]`) and a deep-copied `SmoSelector`, sets up reactive dialog-scoped state (current selector, verse, working `SmoLyric`, mode), and calls `InstallDialog({ root, app: lyricComp, appParams, dialogParams: parameters, commitCb, cancelCb })` (no `removeCb` — see §7).
- **Rationale**: This is the pattern named in the feature description and already proven for `SuiTextBlockDialogVue`, the most structurally similar prior migration (selection-driven dialog with an embedded rich-text session).
- **Alternatives considered**: Building a class-based adapter via `SuiDialogAdapterBase` (`src/ui/dialogs/adapter.ts`) — rejected for the same reason as the text-block migration: that pattern targets the legacy `SuiComponentBase`-based dialog-element rendering (`_constructDialog` in `dialog.ts`), which is exactly the legacy machinery this feature replaces.

## 2. Mapping `dialogElements` to Vue controls

- **Decision**: Each entry in `SuiLyricDialog.dialogElements.elements` (`src/ui/dialogs/lyric.ts`) maps to a Vue control:

  | `smoName` | Legacy control | New Vue control |
  |---|---|---|
  | `verse` | `SuiDropdownComponent` | `select.vue`, four options (verse 1–4, values `0`–`3`) |
  | `translateY` | `SuiRockerComponent` | `numberInput.vue`, `precision: 0`, explicit `minValue`/`maxValue` (see §5) |
  | `font` | `SuiFontComponent` | `fontPicker.vue`, only `family`/`size` consumed on change (weight forced to `'normal'`, style ignored — see §6) |
  | `lyricEditor` | `SuiLyricComponent` (extends `SuiNoteTextComponent`) | new `lyricEditor.vue` (plain-text TipTap) plus dialog-level next/previous/delete controls and the mode-toggle controls |

- **Rationale**: Directly requested by the feature description; every substitute component already exists and is proven in other dialogs (`textBlock.vue` already composes `numberInput.vue`, `select.vue`, and `fontPicker.vue` this same way).
- **Alternatives considered**: None — the mapping was fully specified by the user description and confirmed against each component's existing prop contract.

## 3. Replacing the inline-SVG lyric editor with a TipTap panel

- **Finding**: `SuiLyricComponent.startEditSession()` (`src/ui/dialogs/components/noteText.ts`) constructs a `SuiLyricSession` (`src/render/sui/textEdit.ts`), which in turn constructs a `SuiLyricEditor` that draws an editable text run directly on the SVG canvas at the note's position, with its own blinking-cursor promise loop (`startCursorPromise`). This is the same category of legacy "inline SVG typing editor" that the text-block migration (`specs/001-text-block-dialog-vue`) replaced with `TextGroupEditor`.
- **Decision**: Do not construct `SuiLyricSession`/`SuiLyricEditor` at all. Instead, `lyricVue.ts`/`lyric.vue` reimplement the *data* side of that session directly against the score:
  - **Load**: given a selector and verse, `SmoSelection.noteFromSelector(score, selector)` → `note.getLyricForVerse(verse, SmoLyric.parsers.lyric)`, falling back to a fresh `SmoLyric` (using the score's `'lyrics'` font entry) if none exists for that verse — mirroring `SuiLyricSession._setLyricForNote()`.
  - **Edit**: the loaded lyric's text populates `lyricEditor.vue`'s TipTap document; the user types directly into the panel (normal browser text input), not onto the SVG canvas.
  - **Commit-on-leave**: when the user navigates, deletes, or ends editing, the current TipTap text is read back and, if changed from what was loaded, written via `view.addOrUpdateLyric(selector, lyric)` — mirroring `SuiLyricSession._updateLyricFromEditor()`'s "only write if changed" guard.
- **Rationale**: FR-006 requires a plain-text TipTap-based editing surface (matching `textGroupEditor.vue`'s architecture) rather than the inline SVG cursor; the SVG-drawing and cursor-promise machinery in `SuiLyricEditor` has no role once editing happens in a Vue-rendered panel.
- **Alternatives considered**: Keep `SuiLyricSession` running underneath purely for its navigation/removal logic while displaying TipTap as a visual overlay — rejected as needless complexity: `SuiLyricSession` couples note-loading, SVG-cursor rendering, and navigation together, and only the note-loading/navigation half is needed once the SVG cursor is gone (see §4).

## 4. Navigation (next/previous) and delete

- **Finding**: `SuiNoteTextComponent.moveSelectionRight/Left()` (`src/ui/dialogs/components/noteText.ts`) delegate to `SuiLyricSession.advanceSelection(isShift)`, which internally (a) commits the current note via `_updateLyricFromEditor()`, then (b) resolves the next/previous note via `SmoSelection.nextNoteSelectionFromSelector`/`lastNoteSelectionFromSelector` and reloads that note's lyric. `removeText()`/`SuiLyricSession.removeLyric()` calls `view.removeLyric(selector, lyric)` (which sets `lyric.deleted = true`) and then advances forward without re-committing the just-deleted lyric.
- **Decision**: Reimplement this exact sequence directly in `lyricVue.ts` using the same statics/methods, without the intervening `SuiLyricSession` object:
  - `navigate(direction)`: commit current note (§3) → resolve `nextSelection` via the matching `SmoSelection` static → if non-null, update the current-selector ref and reload that note's lyric for the active verse; if null, no-op (selector/state unchanged), satisfying the spec's "stay on current note at score boundaries" edge case.
  - `deleteCurrent()`: `await view.removeLyric(currentSelector, currentLyric)` → `navigate('next')`-style advance *without* re-committing the (now-deleted) lyric, mirroring `removeLyric()`'s ordering.
- **Rationale**: Directly satisfies FR-010/FR-011 and preserves the exact score-mutation sequence and boundary behavior of the legacy component, while working entirely against plain data (no SVG/editor coupling).
- **Alternatives considered**: None — this is a direct, faithful port of existing logic to a data-only form.

## 5. Y Adjustment bounds

- **Finding**: `SuiRockerComponent` for `translateY` in `SuiLyricDialog.dialogElements` sets no `min`/`max`, so the legacy control accepts any integer (including negative, to move the lyric up). `numberInput.vue`, however, defaults `minValue` to `0` when the prop is omitted, which would silently forbid negative offsets.
- **Decision**: `lyric.vue` passes explicit `minValue`/`maxValue` (e.g. `-9999`/`9999`) to the `numberInput.vue` instance for Y Adjustment, so the effectively-unbounded legacy range (including negative values) is preserved.
- **Rationale**: A silent behavior change (no negative Y adjustment) would regress SC-001 for any score that currently uses a negative `translateY`.

## 6. Font control semantics (score-wide, not per-lyric)

- **Finding**: Despite being seeded from the current note's lyric (`SuiLyricDialog.display()`: `fontCtrl.setValue({ family: lyric.fontInfo.family, size: lyric.fontInfo.size, weight: 'normal' })`), the legacy Font control commits via `view.setLyricFont({ family, size, weight: 'normal' })` (`SuiLyricDialog.changed()`), which sets the **score's** lyric font (`SuiScoreViewOperations.setLyricFont` → `score.setLyricFont(fontInfo)`), not a per-`SmoLyric` field. Style (italic) is not read by `changed()` at all, and weight is hardcoded to `'normal'` regardless of the Bold toggle.
- **Decision**: Preserve this exactly. The new Font control (`fontPicker.vue`, family+size fields used) is seeded from the current note's lyric font, but on change calls `view.setLyricFont({ family, size, weight: 'normal' })` — i.e. it still edits the score-wide default lyric font, not `currentLyric.fontInfo` directly. `fontPicker.vue`'s Bold/Italic toggles are not wired to anything (or omitted from this instance) since the legacy control ignores them for this dialog.
- **Rationale**: FR-005 asks for parity with legacy `SuiFontComponent`/`setLyricFont` behavior; changing this to a true per-lyric font would be a scope-expanding behavior change beyond what the spec or feature description requested.
- **Alternatives considered**: Making Font truly per-lyric (write to `currentLyric.fontInfo` and `addOrUpdateLyric`) — rejected as an unrequested behavior change; flagged here for visibility in case a future feature wants to revisit it.

## 7. No Remove control

- **Finding**: `SuiLyricDialog.bindElements()` explicitly removes the remove-button (`$(dgDom.element).find('.remove-button').remove();`) — deletion of a lyric happens only via the in-editor delete (cross) control, not a dialog-level Remove.
- **Decision**: `lyric.vue` uses `dialogContainer.vue` without a `removeCb` prop (per `dialogButtons.vue`, the Remove button only renders `v-if="removeCb"`), and `lyricVue.ts` does not pass `removeCb` to `InstallDialog`.
- **Rationale**: Matches current behavior; avoids introducing a second, redundant deletion path.

## 8. OK / Cancel semantics

- **Finding**: Unlike `SuiTextBlockDialog` (which opens a `groupUndo` and has Cancel call `view.undo()`), `SuiLyricDialog.bindElements()` wires both `.ok-button` and `.cancel-button` to the exact same handler (`_complete()`), and there is no `groupUndo`/`undo()` call anywhere in `lyric.ts`. This is consistent with the fact that lyric text and deletions are already committed to the score incrementally as the user types, navigates, and deletes (§3, §4) — there is nothing left to roll back at the dialog level.
- **Decision**: `commitCb` and `cancelCb` passed to `InstallDialog` perform the identical action: if a lyric editing session is active (`mode === 'editing'`), commit the current note (§3) one last time, then close. No undo-group open/close, no revert-on-cancel.
- **Rationale**: Directly matches FR-014 and the spec's Edge Cases ("Closing the dialog via OK or Cancel behaves identically").

## 9. Auto-start-editing on open

- **Finding**: `SuiLyricDialog.bindElements()` calls `this.lyricEditorCtrl.startEditSession()` unconditionally every time the dialog is displayed — unlike the text-block dialog's `edited`-flag-gated auto-start, this always begins in an editing session regardless of prior state.
- **Decision**: `lyricVue.ts` initializes `mode` to `'editing'` unconditionally on every dialog open, and loads the initially-selected note's lyric for verse `0` (the `dialogElements` default) into `lyricEditor.vue` immediately.
- **Rationale**: Directly satisfies FR-009 and the spec's edge case ("Reopening the dialog on a different note always restarts edit mode automatically").

## 10. Mode state machine (editing / dialog)

- **Decision**: Represent dialog mode as a single reactive `Ref<'editing' | 'dialog'>` in `lyric.vue`, replacing the legacy `hide-when-editing` / `show-when-editing` CSS classes on `dialogElements` entries (`verse`, `translateY`, `font` all carry `hide-when-editing`; the lyric editor control carries `show-always` with its next/previous/delete sub-controls under a `show-when-editing` wrapper). Each control section is gated with `v-if` against this ref: Verse/Y Adjustment/Font render only when `mode === 'dialog'`; the TipTap panel and its next/previous/delete controls render only when `mode === 'editing'`.
- **Rationale**: A single source of truth directly encodes the spec's FR-007 (exactly two mutually exclusive modes) structurally — the ref can only hold one value at a time, so there is no way for both control groups to be visible/interactive simultaneously.
- **Alternatives considered**: Independent `isEditing` boolean plus per-control `hide-when-editing`-style class toggling (a literal port of the legacy mechanism) — rejected as strictly more error-prone than a single mode ref, with no benefit given there are only two modes here (unlike the three-mode text-block dialog, which still collapsed to a single ref — see `specs/001-text-block-dialog-vue/research.md` §5).

## 11. Mode-toggle control shape

- **Finding**: Legacy `SuiLyricComponent.html` renders one button (`toggleTextEdit`) whose icon is swapped between `icon-pencil` and `icon-checkmark` (and whose label swaps between the control's label and `staticText.doneEditing`) via direct DOM manipulation in `startEditSession()`/`endSession()`.
- **Decision**: Rather than one button with an imperatively swapped icon/label, follow the same convention `textBlock.vue` already established for its own mode buttons: two mode-specific buttons, each rendered only in the mode it applies to — a "done editing" (checkmark) button visible only when `mode === 'editing'`, and an "edit lyrics" (pencil) button visible only when `mode === 'dialog'`. Net effect is identical to the spec's FR-008 (exactly one toggle control visible/active at a time to switch modes); the two-button shape is simply more idiomatic for a Vue template driven by a mode ref than imperative class-swapping on a single persistent button.
- **Rationale**: Consistency with the established Vue-dialog convention in this codebase; avoids re-introducing imperative DOM manipulation into a `<script setup>` component.

## 12. Dropped: legacy space/hyphen keyboard-advance shortcut

- **Finding**: `SuiLyricSession.evKey()` treats a bare Space key as "advance to next note" (Shift+Space as "advance to previous note") without inserting a space character, and treats `-` as "insert a hyphen, then advance to next note" — a keyboard shortcut tailored to the old single-line inline SVG editor, letting a user type a run of hyphenated syllables across notes without touching the mouse.
- **Decision**: Do not replicate this in `lyricEditor.vue`. Space and `-` insert their literal characters like any other plain-text input; navigation happens only via the explicit next/previous controls (FR-010), matching the feature description's list of controls (arrows, delete, mode toggle) with no mention of a keyboard-driven advance.
- **Rationale**: The feature description and spec define navigation exclusively in terms of the arrow controls; hijacking Space/`-` in a "plain text" field the spec explicitly frames as ordinary text entry would be a surprising, unrequested behavior and was tightly coupled to the removed single-glyph inline editor. This can be revisited as a follow-up if fast keyboard-driven lyric entry is explicitly requested later.
- **Alternatives considered**: Preserving the shortcut for muscle-memory parity with the legacy dialog — rejected as out of the explicit scope of this feature.

## 13. Dropped: `idleRedrawTime` override

- **Finding**: `SuiLyricDialog` temporarily raises `this.config.idleRedrawTime` to `SuiLyricDialog.idleLyricTime` (5000ms) for the duration of the dialog, restoring the original value on `_complete()` — plausibly to avoid the renderer's periodic idle redraw disrupting the inline SVG cursor/editor while it's active.
- **Decision**: Do not port this override. Since editing now happens in a Vue-rendered TipTap panel rather than inline on the SVG canvas, there is no inline cursor for an idle redraw to disrupt.
- **Rationale**: No user-visible editing surface exists on the canvas anymore for a redraw to interfere with; carrying the timer override forward would be cargo-culting a workaround for a problem this design no longer has.
- **Alternatives considered**: Port it anyway for maximal parity — rejected as unnecessary complexity with no remaining failure mode to guard against.
