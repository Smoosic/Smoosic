<script setup lang="ts">
import { ref, Ref, watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { createStyleTag, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SmoScoreText } from '../../../smo/data/scoreText';
import { FontInfo } from '../../../common/vex';

// No css-loader is wired into this project's webpack build, so inject the
// small amount of CSS this editor needs via TipTap's own createStyleTag
// utility, matching lyricEditor.vue/textGroupEditor.vue.
const BASE_EDITOR_CSS = '.annotation-editor-content .ProseMirror p { margin: 0; }';
const editorStyleTag = createStyleTag(BASE_EDITOR_CSS, undefined, 'annotation-editor');

interface Props {
  domId: string,
  text: string,
  fontInfo: FontInfo
}
const props = defineProps<Props>();
const emit = defineEmits<{ preview: [] }>();

// An annotation is a single line of plain text -- SmoLyric.text has no
// line-break concept -- so Enter has nothing meaningful to do here.
// Suppress it instead of letting StarterKit's default paragraph-split run.
// Unlike lyricEditor.vue, there is no note-to-note navigation for
// annotations, so '-'/Space are not given any special auto-advance meaning.
const AnnotationNoHardBreak = Extension.create({
  name: 'annotationNoHardBreak',
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

// Debounced live preview, mirroring lyricEditor.vue's schedulePreview/pushPreview.
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
  // dialog's v-if returns to editing mode.
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
    AnnotationNoHardBreak
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
    + `.annotation-editor-content .ProseMirror p { font-family: ${f.fontFamily}; font-size: ${f.fontSize}; `
    + `font-weight: ${f.fontWeight}; font-style: ${f.fontStyle}; }`;
}, { immediate: true });

watch(() => props.fontInfo, () => {
  activeFontStyle.value = computeFontStyle();
});

// Re-initialize the document whenever the parent loads different text
// (e.g. reopening an existing annotation).
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
  <div v-if="editor" class="annotation-editor">
    <EditorContent :editor="editor" :id="domId"
      class="form-control annotation-editor-content tiptap-editor"
      style="overflow-y: auto;" :style="activeFontStyle" />
  </div>
</template>
