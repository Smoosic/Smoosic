<script setup lang="ts">
import { computed, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { TextStyle, FontFamily, FontSize } from '@tiptap/extension-text-style';
import { SmoTextGroup } from '../../../smo/data/scoreText';
import { textGroupToHtml, htmlToTextGroup } from './textGroupHtml';

interface Props {
  domId: string,
  textGroup: SmoTextGroup
}
const props = defineProps<Props>();
const getId = (str: string) => `${props.domId}-${str}`;

const fontFamilies = ['Arial', 'Merriweather', 'Roboto,sans-serif', 'Times New Roman', 'monospace'];
const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];

const editor = useEditor({
  content: textGroupToHtml(props.textGroup),
  extensions: [
    StarterKit.configure({
      blockquote: false,
      bulletList: false,
      code: false,
      codeBlock: false,
      hardBreak: false,
      heading: false,
      horizontalRule: false,
      link: false,
      listItem: false,
      listKeymap: false,
      orderedList: false,
      strike: false,
      underline: false
    }),
    TextStyle,
    FontFamily,
    FontSize,
    TextAlign.configure({ types: ['paragraph'], defaultAlignment: 'left' }),
    Superscript,
    Subscript
  ]
});

// re-initialize the document if a different text group is passed in
watch(() => props.textGroup, (next) => {
  editor.value?.commands.setContent(textGroupToHtml(next));
});

const currentFontFamily = computed(() => editor.value?.getAttributes('textStyle').fontFamily ?? '');
const currentFontSize = computed(() => {
  const size = editor.value?.getAttributes('textStyle').fontSize as string | undefined;
  return size ? parseInt(size, 10) : '';
});

const toggleBold = () => editor.value?.chain().focus().toggleBold().run();
const toggleItalic = () => editor.value?.chain().focus().toggleItalic().run();
const toggleSuperscript = () => editor.value?.chain().focus().toggleSuperscript().run();
const toggleSubscript = () => editor.value?.chain().focus().toggleSubscript().run();
const setAlign = (align: 'left' | 'center' | 'right') => editor.value?.chain().focus().setTextAlign(align).run();
const setFontFamily = (event: Event) => {
  const family = (event.target as HTMLSelectElement).value;
  editor.value?.chain().focus().setFontFamily(family).run();
};
const setFontSize = (event: Event) => {
  const size = (event.target as HTMLSelectElement).value;
  editor.value?.chain().focus().setFontSize(`${size}px`).run();
};

const getTextGroup = (): SmoTextGroup => {
  if (!editor.value) {
    return props.textGroup;
  }
  return htmlToTextGroup(editor.value.getJSON(), props.textGroup);
};
const insertAtCursor = (token: string) => {
  editor.value?.chain().focus().insertContent(token).run();
};
defineExpose({ getTextGroup, insertAtCursor });
</script>
<template>
  <div v-if="editor" class="text-group-editor">
    <div class="row mb-2 ms-2 align-items-center">
      <div class="col-auto btn-group" role="group">
        <button type="button" class="btn btn-sm" :class="editor.isActive('bold') ? 'btn-primary' : 'btn-outline-secondary'"
          :id="getId('bold-button')" @click.prevent="toggleBold"><b>B</b></button>
        <button type="button" class="btn btn-sm" :class="editor.isActive('italic') ? 'btn-primary' : 'btn-outline-secondary'"
          :id="getId('italic-button')" @click.prevent="toggleItalic"><i>I</i></button>
        <button type="button" class="btn btn-sm"
          :class="editor.isActive('superscript') ? 'btn-primary' : 'btn-outline-secondary'"
          :id="getId('superscript-button')" @click.prevent="toggleSuperscript">x&sup2;</button>
        <button type="button" class="btn btn-sm"
          :class="editor.isActive('subscript') ? 'btn-primary' : 'btn-outline-secondary'"
          :id="getId('subscript-button')" @click.prevent="toggleSubscript">x&#8322;</button>
      </div>
      <div class="col-auto btn-group ms-2" role="group">
        <button type="button" class="btn btn-sm"
          :class="editor.isActive({ textAlign: 'left' }) ? 'btn-primary' : 'btn-outline-secondary'"
          :id="getId('align-left-button')" @click.prevent="setAlign('left')">L</button>
        <button type="button" class="btn btn-sm"
          :class="editor.isActive({ textAlign: 'center' }) ? 'btn-primary' : 'btn-outline-secondary'"
          :id="getId('align-center-button')" @click.prevent="setAlign('center')">C</button>
        <button type="button" class="btn btn-sm"
          :class="editor.isActive({ textAlign: 'right' }) ? 'btn-primary' : 'btn-outline-secondary'"
          :id="getId('align-right-button')" @click.prevent="setAlign('right')">R</button>
      </div>
      <div class="col-auto ms-2">
        <select class="form-select form-select-sm" :id="getId('font-family-select')" :value="currentFontFamily"
          @change="setFontFamily">
          <option value="" disabled>Font</option>
          <option v-for="family in fontFamilies" :key="family" :value="family">{{ family }}</option>
        </select>
      </div>
      <div class="col-auto">
        <select class="form-select form-select-sm" :id="getId('font-size-select')" :value="currentFontSize"
          @change="setFontSize">
          <option value="" disabled>Size</option>
          <option v-for="size in fontSizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
    </div>
    <div class="row mb-2 ms-2">
      <div class="col">
        <EditorContent :editor="editor" :id="getId('editor-content')" class="form-control"
          style="min-height: 150px; overflow-y: auto;" />
      </div>
    </div>
  </div>
</template>
