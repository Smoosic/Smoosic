# Phase 0 Research: Lyric Editor Auto-Advance

All unknowns below were resolved by reading the existing codebase (no external research was needed — this is a small, additive enhancement to the components `010-vue-lyric-dialog` just introduced). No `NEEDS CLARIFICATION` markers remain in the Technical Context.

## 1. Where to intercept `-` and Space

- **Finding**: `lyricEditor.vue` already defines a small inline TipTap `Extension` (`LyricNoHardBreak`) via `addKeyboardShortcuts()` to intercept `Enter`/`Shift-Enter` and suppress the default paragraph-split, since a lyric is a single line of plain text. This is the established, idiomatic place in this file to intercept specific keystrokes before ProseMirror's default handling runs.
- **Decision**: Extend that same extension (or a sibling one defined the same way) with two more shortcut entries, `'-'` and `'Space'` (ProseMirror/`w3c-keyname`'s name for the space bar; a bare, unmodified key — Shift-Space is a distinct, unbound combination and is left to fall through to default handling, which is fine since backward navigation is explicitly out of scope). Both handlers `return true` (mark the keystroke fully handled, suppressing ProseMirror's default text insertion), and reach the live TipTap editor instance via `this.editor` inside the extension body (the same access pattern `LyricNoHardBreak` doesn't currently need but is standard for any `Extension.create({...})` body).
- **Rationale**: Directly reuses the file's existing interception mechanism instead of introducing a second one (e.g. a raw DOM `keydown` listener on the wrapping `<div>`, which would race with ProseMirror's own event handling and risk double-handling or inconsistent cursor state). FR-001/FR-002/FR-003 are keystroke-level behaviors within the editor's own document model, which is exactly what TipTap keyboard shortcuts are for.
- **Alternatives considered**: A TipTap **InputRule** (matches text just inserted into the document and reacts to it) — rejected for the Space case specifically, since an input rule only fires *after* the character is already in the document, requiring an extra step to delete the just-inserted space; a keyboard shortcut can simply never insert it in the first place, which is a cleaner fit for FR-002/FR-003 ("MUST advance ... without inserting a space character"). Using an input rule for `-` alone (and a keyboard shortcut only for Space) was also considered and rejected for consistency — one mechanism for both keeps the extension simple to read.

## 2. Communicating "advance" from the editor to the dialog

- **Finding**: `lyricEditor.vue` currently has no `emit`s — it is a pure "pull" component (`defineExpose({ getText })`), read on-demand by `lyric.vue`'s own navigate/commit/delete handlers (`specs/010-vue-lyric-dialog/contracts/component-interfaces.md` §3).
- **Decision**: Add one `emit`, `advance`, carrying a single payload distinguishing the two outcomes the parent must implement differently:
  ```ts
  type AdvanceMode = 'commit' | 'skip';
  const emit = defineEmits<{ advance: [mode: AdvanceMode] }>();
  ```
  - `'commit'`: emitted when `-` is pressed (hyphen already inserted into the document via `this.editor.commands.insertContent('-')` before emitting), and when Space is pressed while `this.editor.getText().trim().length > 0`. The parent's response is exactly its existing `navigate('next')` (commit current note's text, then move) — no new logic needed for this branch.
  - `'skip'`: emitted only when Space is pressed while `this.editor.getText().trim().length === 0`. The parent moves to the next note *without* calling `commitIfChanged()`/`addOrUpdateLyric` at all, so an empty lyric is never written for the note being left, even though `lyricText`/`originalText` might technically differ (e.g. after typing something and deleting it back to whitespace-only).
- **Rationale**: A two-value emit keeps the *decision* of "is there text right now" inside `lyricEditor.vue` (which already owns `getText()`), while keeping the *score-mutation logic* inside `lyric.vue` (which already owns `currentLyric`/`currentSelector`/`view`), matching the existing separation of concerns between the two components (`010-vue-lyric-dialog` contracts §2/§3). It also lets `lyric.vue` reuse its existing `navigate()` verbatim for the `'commit'` case instead of duplicating commit-then-move logic a second time.
- **Alternatives considered**: Emitting a boolean (`hasText`) and letting the parent re-derive what to do — rejected as marginally less self-documenting than naming the two outcomes directly; emitting nothing and having `lyric.vue` poll/diff text on every keystroke — rejected, unnecessary and not how the rest of this dialog is wired (everything else is either an explicit user action or a pull via `getText()`).

## 3. "No text yet" semantics (FR-003 / spec Edge Case)

- **Finding**: The feature description says "if there is no text in the lyric yet, go to the next note but don't create an empty lyric." The spec's Edge Cases section generalizes this to: text that was typed and then fully deleted back to empty, immediately before Space is pressed, is treated the same as text that was never typed.
- **Decision**: The emptiness check is a **keystroke-time** check of the editor's *current* text (`this.editor.getText().trim().length === 0`), not a comparison against `originalText` (the text the note had when it was loaded, from `010-vue-lyric-dialog`'s `loadNote`). This means: if the current text is empty for any reason at the moment Space is pressed, the `'skip'` path runs and nothing is written — regardless of what the note's lyric looked like before this editing pass started.
- **Rationale**: Matches the literal, keystroke-time reading of "if there is no text in the lyric yet" and the spec's explicit edge case in one uniform rule, with no special-casing needed for "was it always empty vs. cleared just now."
- **Scope note**: This `'skip'`-when-empty rule is specific to the Space-triggered auto-advance path. It does **not** change the existing next-note arrow control's behavior (`navigate('next')`, unchanged, still writes via `commitIfChanged()`'s existing `text !== originalText` guard) — clicking the arrow control after clearing an existing lyric's text still persists the clearing, exactly as it does today. Only the new Space shortcut gets the stronger "never write when currently empty" rule, per FR-002/FR-003's explicit scoping to Space.

## 4. Boundary behavior (last note in the score)

- **Finding**: `lyric.vue`'s existing `navigate(direction)` already no-ops when `SmoSelection.nextNoteSelectionFromSelector`/`lastNoteSelectionFromSelector` returns `null` (`010-vue-lyric-dialog` data-model.md/research.md §4) — the editor simply stays on the current note.
- **Decision**: No new code is needed for FR-004. The `'commit'` emit path reuses `navigate('next')` verbatim, inheriting the existing no-op-at-boundary behavior automatically. The new `'skip'` path (Space-when-empty) is implemented with the same `SmoSelection.nextNoteSelectionFromSelector` null-check inline, mirroring `navigate()`'s existing guard.
- **Rationale**: Directly satisfies FR-004 ("typing a hyphen or space MUST leave the editor on the current note with no error... a typed hyphen is still appended to the text in this case") for free — the hyphen was already inserted into the document before the emit fires, independent of whether navigation subsequently succeeds.

## 5. Not adding backward navigation

- **Finding**: The legacy `SuiLyricSession.evKey()` (`src/render/sui/textEdit.ts`) treats Shift+Space as "advance backward," alongside plain Space for forward. The feature description and spec only ask for forward auto-advance via `-` and Space.
- **Decision**: Bind only the unmodified `'Space'` key name (and `'-'`). Shift-Space is left unbound by this feature's extension, so it falls through to ProseMirror's default handling (ordinary space insertion) rather than triggering any navigation.
- **Rationale**: Matches the spec's explicit Assumption ("does not add a keyboard shortcut for backward navigation, since none was requested"); avoids surprising, unrequested behavior.

## 6. Re-entrant `setContent` while inside a keymap command

- **Finding**: Handling `'commit'`/`'skip'` triggers a call into `lyric.vue`'s `loadNote()`, which sets `lyricText.value` (a prop passed back down into `lyricEditor.vue`), which in turn is watched (`watch(() => props.text, ...)`) and calls `editor.value?.commands.setContent(...)` — a second document mutation on the same editor instance, occurring as a consequence of a keyboard-shortcut command handler still resolving on the call stack.
- **Decision**: Vue's prop update from the `emit` handler back down into `lyricEditor.vue`'s `watch` is not synchronous within the same microtask as the originating ProseMirror command dispatch (Vue reactivity effects flush on the next tick), so in practice the two transactions do not collide. No special deferral (`nextTick`/`queueMicrotask`) is added preemptively.
- **Rationale**: Keeps the implementation as simple as the existing `LyricNoHardBreak` pattern. Flagged here explicitly so that if manual testing (quickstart.md) surfaces any ProseMirror "stale transaction" warning or visual glitch when rapidly typing `-`/Space, the fix is to wrap the `emit('advance', ...)` call in a `nextTick()` (Vue) — a small, local, one-line change — rather than a redesign.
