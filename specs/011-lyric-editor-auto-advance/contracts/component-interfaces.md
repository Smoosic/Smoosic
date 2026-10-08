# Contracts: Component Interface Changes

This project is a client-side library with no network API. The "contract" for this feature is the small addition to the Vue component boundary between `lyricEditor.vue` and `lyric.vue` established by `010-vue-lyric-dialog` (see `specs/010-vue-lyric-dialog/contracts/component-interfaces.md` §3 for the unchanged parts).

## 1. `lyricEditor.vue` — updated contract

`src/ui/components/dialogs/lyricEditor.vue`

```ts
interface Props {
  domId: string;
  text: string;
  fontInfo: FontInfo;
}
interface Emits {
  advance: [mode: 'commit' | 'skip'];   // NEW
}
interface Expose {
  getText(): string;                    // unchanged
}
```

- **Props/Expose**: unchanged from `010-vue-lyric-dialog`.
- **New `advance` emit**: fired from inside the component's existing keyboard-shortcut extension (the one that already intercepts `Enter`/`Shift-Enter`), now also intercepting `-` and `Space`:
  - `-`: insert the hyphen into the document (`this.editor.commands.insertContent('-')`), then `emit('advance', 'commit')`. Handled (`return true`) — no duplicate insertion via ProseMirror's default path.
  - `Space`, current text (`this.editor.getText().trim()`) non-empty: `emit('advance', 'commit')`, no insertion. Handled (`return true`).
  - `Space`, current text empty/whitespace-only: `emit('advance', 'skip')`, no insertion. Handled (`return true`).
  - `Shift-Space` and every other key: unaffected, falls through to existing default/StarterKit handling.

## 2. `lyric.vue` — new listener

`src/ui/components/dialogs/lyric.vue`

- Adds `@advance="onEditorAdvance"` to the existing `<lyricEditorComp>` usage in the editing-mode template section.
- `onEditorAdvance(mode: 'commit' | 'skip')`:
  - `mode === 'commit'`: `await navigate('next')` — the existing function, unchanged.
  - `mode === 'skip'`: resolve `SmoSelection.nextNoteSelectionFromSelector(score, currentSelector.value)`; if found, set `currentSelector.value` and call `loadNote(currentSelector.value, verse.value)`; if not found, no-op. Deliberately does **not** call `commitIfChanged()` — this is the one place in the dialog that advances without writing.

No other exports, props, or emits of `lyric.vue` change. `lyricVue.ts` (the creation function) is untouched — this feature is entirely internal to the two Vue components.

## Compatibility note

`lyricEditor.vue` and `lyric.vue` have no external consumers beyond each other and `lyricVue.ts` (per `010-vue-lyric-dialog`'s Compatibility note — `SuiLyricDialogVue` still has no call sites). This addition is therefore free to shape the `advance` emit for this dialog's exact needs with no deprecation concerns.
