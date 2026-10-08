# Phase 1 Data Model: Text Editor Autofocus on Open

This feature introduces no new or modified data entities. It does not touch the score data model (`SmoLyric`, `SmoTextGroup`, `SmoScoreText`, etc.) or any persisted state at all — it is a keyboard-focus/UI behavior change scoped entirely to how and when three existing TipTap `Editor` instances receive focus.

## Existing Entities (unaffected)

No entity's fields, relationships, or validation rules change. `SmoLyric` (lyric/chord text), `SmoTextGroup`/`SmoScoreText` (text blocks), and each dialog's transient Vue state (`mode`, `currentSelector`, etc., as documented in `010-vue-lyric-dialog`, `013-vue-chord-dialog`, and `001-text-block-dialog-vue`'s own data models) are all read but not modified by this feature.

## New Transient Behavior (not a data entity)

| Concept | Description |
|---|---|
| Editor focus state | Native browser/DOM keyboard focus, tracked by the browser and ProseMirror's own `EditorView`, not by any Vue ref or score-model field. This feature's only effect is *when* that focus is programmatically moved into a given TipTap editor's DOM element - once, at the moment each editor's underlying `Editor` instance is constructed (which happens on every `v-if` remount, per research.md §1). |

## Operations (behavior, not new entities)

| Component | Operation | Effect |
|---|---|---|
| `lyricEditor.vue` | `useEditor({ autofocus: 'end', ... })` | On construction, places a collapsed cursor at the end of the (single-paragraph) document and moves keyboard focus there |
| `chordEditor.vue` | `useEditor({ autofocus: 'end', ... })` | Same, for the chord symbol's (single-paragraph) document |
| `textGroupEditor.vue` | `useEditor({ onCreate: ({ editor }) => editor.commands.focus(), ... })` | On construction, moves keyboard focus into the editor using the same best-effort `focus()` call `activateBlock()` already uses after switching the active block |

No new props, emits, or exposed methods are added to any of the three components; this is confined to each component's own `useEditor` configuration.
