<script setup lang="ts">
import { ref, Ref, watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { createStyleTag, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SmoScoreText } from '../../../smo/data/scoreText';
import { FontInfo } from '../../../common/vex';

// No css-loader is wired into this project's webpack build (no other .vue
// component here has a <style> block), so inject the small amount of CSS
// this editor needs via TipTap's own createStyleTag utility, matching
// textGroupEditor.vue.
const BASE_EDITOR_CSS = '.lyric-editor-content .ProseMirror p { margin: 0; }';
const editorStyleTag = createStyleTag(BASE_EDITOR_CSS, undefined, 'lyric-editor');

interface Props {
  domId: string,
  text: string,
  fontInfo: FontInfo
}
const props = defineProps<Props>();
const emit = defineEmits<{ advance: [mode: 'commit' | 'skip'], preview: [] }>();

// A lyric is a single line of plain text -- SmoLyric.text has no
// line-break concept -- so Enter has nothing meaningful to do here.
// Suppress it instead of letting StarterKit's default paragraph-split run.
//
// '-' and Space additionally auto-advance to the next note (011-lyric-editor-auto-advance):
// '-' inserts itself then requests a commit-and-advance, matching the existing
// next-note control; Space never inserts a character, and requests a commit-and-advance
// only if there is text already, otherwise a skip-and-advance that writes nothing, so
// skipping notes with the space bar never leaves behind an empty lyric.
const LyricNoHardBreak = Extension.create({
  name: 'lyricNoHardBreak',
  addKeyboardShortcuts() {
    return {
      Enter: () => true,
      'Shift-Enter': () => true,
      '-': () => {
        this.editor.commands.insertContent('-');
        emit('advance', 'commit');
        return true;
      },
      Space: () => {
        const hasText = this.editor.getText().trim().length > 0;
        emit('advance', hasText ? 'commit' : 'skip');
        return true;
      }
    };
  }
});

const toDoc = (text: string) => ({
  type: 'doc',
  content: [{
    type: 'paragraph',
    content: text.length > 0 ? [{ type: 'text', text }] : []
  }]
});

// Debounced live preview (012-lyric-live-preview-cursor), mirroring
// textGroupEditor.vue's schedulePreview/pushPreview (009-text-editor-live-preview).
// Only real keystrokes should trigger this; programmatic content swaps
// (loadNote() reassigning props.text) call setContent with emitUpdate: false
// below, so they don't re-trigger it redundantly.
const PREVIEW_DEBOUNCE_MS = 400;
let previewTimer: ReturnType<typeof setTimeout> | null = null;
const pushPreview = () => {
  previewTimer = null;
  emit('preview');
};
const schedulePreview = () => {
  if (previewTimer !== null) {
    clearTimeout(previewTimer);
  }
  previewTimer = setTimeout(pushPreview, PREVIEW_DEBOUNCE_MS);
};

const editor = useEditor({
  content: toDoc(props.text),
  onUpdate: schedulePreview,
  // Move keyboard focus into the editor as soon as it's constructed -- both
  // on the dialog's initial open and on every later remount when the
  // dialog's v-if returns to editing mode (014-editor-autofocus). 'end'
  // places a collapsed cursor after any existing text, never selecting it.
  autofocus: 'end',
  extensions: [
    StarterKit.configure({
      blockquote: false,
      bold: false,
      bulletList: false,
      code: false,
      codeBlock: false,
      hardBreak: false,
      heading: false,
      horizontalRule: false,
      italic: false,
      link: false,
      listItem: false,
      listKeymap: false,
      orderedList: false,
      strike: false,
      underline: false
    }),
    LyricNoHardBreak
  ]
});

const computeFontStyle = () => {
  const fontInfo = props.fontInfo;
  return {
    fontFamily: SmoScoreText.familyString(fontInfo.family),
    fontSize: `${SmoScoreText.fontPointSize(fontInfo.size)}pt`,
    fontWeight: SmoScoreText.weightString(fontInfo.weight),
    fontStyle: fontInfo.style ?? 'normal'
  };
};
const activeFontStyle: Ref<Record<string, string>> = ref(computeFontStyle());
watch(activeFontStyle, (f) => {
  editorStyleTag.textContent = BASE_EDITOR_CSS
    + `.lyric-editor-content .ProseMirror p { font-family: ${f.fontFamily}; font-size: ${f.fontSize}; `
    + `font-weight: ${f.fontWeight}; font-style: ${f.fontStyle}; }`;
}, { immediate: true });

watch(() => props.fontInfo, () => {
  activeFontStyle.value = computeFontStyle();
});

// Re-initialize the document whenever the parent loads a different
// note/verse's lyric text into this editor (navigate/delete/verse change).
watch(() => props.text, (next) => {
  editor.value?.commands.setContent(toDoc(next), { emitUpdate: false });
});

const getText = (): string => {
  return editor.value?.getText() ?? props.text;
};
defineExpose({ getText });

onBeforeUnmount(() => {
  if (previewTimer !== null) {
    clearTimeout(previewTimer);
    previewTimer = null;
  }
});
</script>
<template>
  <div v-if="editor" class="lyric-editor">
    <EditorContent :editor="editor" :id="domId"
      class="form-control lyric-editor-content tiptap-editor"
      style="overflow-y: auto;" :style="activeFontStyle" />
  </div>
</template>
