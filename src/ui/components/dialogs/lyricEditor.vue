<script setup lang="ts">
import { ref, Ref, watch } from 'vue';
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

// A lyric is a single line of plain text -- SmoLyric.text has no
// line-break concept -- so Enter has nothing meaningful to do here.
// Suppress it instead of letting StarterKit's default paragraph-split run.
const LyricNoHardBreak = Extension.create({
  name: 'lyricNoHardBreak',
  addKeyboardShortcuts() {
    return {
      Enter: () => true,
      'Shift-Enter': () => true
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

const editor = useEditor({
  content: toDoc(props.text),
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
</script>
<template>
  <div v-if="editor" class="lyric-editor">
    <EditorContent :editor="editor" :id="domId"
      class="form-control lyric-editor-content tiptap-editor"
      style="overflow-y: auto;" :style="activeFontStyle" />
  </div>
</template>
