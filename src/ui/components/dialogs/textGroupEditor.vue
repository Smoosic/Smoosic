<script setup lang="ts">
import { computed, ref, Ref, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import { createStyleTag } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { SmoTextGroup, SmoScoreText } from '../../../smo/data/scoreText';
import { FontInfo } from '../../../common/vex';
import { SelectOption } from '../../common';
import { textGroupToHtml, htmlToTextGroup } from './textGroupHtml';
import { TextBlockAtomNode } from './textBlockAtomNode';
import selectComp from './select.vue';

// No css-loader is wired into this project's webpack build (no other .vue
// component here has a <style> block), so inject the small amount of CSS
// this editor needs via TipTap's own createStyleTag utility instead.
createStyleTag(
  '.text-group-editor-content .ProseMirror p { margin: 0 0 0.25rem 0; }'
  + '.text-group-editor-content .text-block-atom { cursor: default; margin: 0 0.15em; }',
  undefined,
  'text-group-editor'
);

interface Props {
  domId: string,
  textGroup: SmoTextGroup
}
const props = defineProps<Props>();
const emit = defineEmits<{ 'active-block-changed': [font: FontInfo] }>();
const getId = (str: string) => `${props.domId}-${str}`;

// SmoTextGroup.getActiveBlock() assumes at least one block exists; a
// brand-new text item can start with zero, so materialize one empty block
// on the live model up front (spec edge case: "brand-new text item").
const ensureActiveBlock = (group: SmoTextGroup) => {
  if (group.textBlocks.length === 0) {
    const defaultBlock = new SmoScoreText(SmoScoreText.defaults);
    group.addScoreText(defaultBlock, group.relativePosition);
    group.setActiveBlock(defaultBlock);
  }
};
ensureActiveBlock(props.textGroup);

// Which block is editable right now -- everything else in the document is
// rendered as a read-only textBlockAtom node (see textGroupHtml.ts).
const activeBlockId: Ref<string> = ref(props.textGroup.getActiveBlock().attrs.id);

const editor = useEditor({
  content: textGroupToHtml(props.textGroup, activeBlockId.value),
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
    TextBlockAtomNode
  ]
});

const rebuildContent = () => {
  editor.value?.commands.setContent(textGroupToHtml(props.textGroup, activeBlockId.value));
};

const computeFontStyle = () => {
  const fontInfo = props.textGroup.getActiveBlock().fontInfo;
  return {
    fontFamily: SmoScoreText.familyString(fontInfo.family),
    fontSize: `${SmoScoreText.fontPointSize(fontInfo.size)}pt`,
    fontWeight: SmoScoreText.weightString(fontInfo.weight),
    fontStyle: fontInfo.style ?? 'normal'
  };
};
// Local (not computed-from-props) so it stays correct even when the active
// block's fontInfo is mutated in place by a sibling control (the dialog's
// font picker) outside this component's own reactivity graph.
const activeFontStyle: Ref<Record<string, string>> = ref(computeFontStyle());
const refreshActiveFont = () => {
  activeFontStyle.value = computeFontStyle();
};

// re-initialize the document if a different text group is passed in
watch(() => props.textGroup, (next) => {
  ensureActiveBlock(next);
  activeBlockId.value = next.getActiveBlock().attrs.id;
  rebuildContent();
  refreshActiveFont();
});

const activeIndex = computed(() => {
  const id = activeBlockId.value;
  return props.textGroup.textBlocks.findIndex((block) => block.text.attrs.id === id);
});
const canGoPrevious = computed(() => activeIndex.value > 0);
const canGoNext = computed(() => activeIndex.value >= 0 && activeIndex.value < props.textGroup.textBlocks.length - 1);
const canRemove = computed(() => activeBlockId.value.length > 0 && props.textGroup.textBlocks.length > 1);

const relativePositionOptions: SelectOption[] = [
  { value: SmoTextGroup.relativePositions.ABOVE.toString(), label: 'Above' },
  { value: SmoTextGroup.relativePositions.BELOW.toString(), label: 'Below' },
  { value: SmoTextGroup.relativePositions.LEFT.toString(), label: 'Left' },
  { value: SmoTextGroup.relativePositions.RIGHT.toString(), label: 'Right' }
];
const onRelativePositionSelect = (value: string) => {
  props.textGroup.setRelativePosition(parseInt(value, 10));
  rebuildContent();
};

const activateBlock = (scoreText: SmoScoreText) => {
  props.textGroup.setActiveBlock(scoreText);
  activeBlockId.value = scoreText.attrs.id;
  rebuildContent();
  refreshActiveFont();
  // Best-effort: land keyboard focus back in the editor after the document
  // was rebuilt (setContent resets ProseMirror's selection). Exact caret
  // placement within the new active block isn't guaranteed, but this avoids
  // forcing an extra click before the user can type.
  editor.value?.commands.focus();
  emit('active-block-changed', { ...scoreText.fontInfo });
};

const addBlock = () => {
  const currentFont = props.textGroup.getActiveBlock().fontInfo;
  const newBlock = new SmoScoreText({
    ...SmoScoreText.defaults,
    text: '',
    fontInfo: { ...currentFont }
  });
  props.textGroup.addScoreText(newBlock, props.textGroup.relativePosition);
  activateBlock(newBlock);
};

const removeBlock = () => {
  if (!canRemove.value) {
    return;
  }
  const blocks = props.textGroup.textBlocks;
  const ix = activeIndex.value;
  const toRemove = props.textGroup.getActiveBlock();
  const neighborIx = ix < blocks.length - 1 ? ix + 1 : ix - 1;
  const neighbor = blocks[neighborIx].text;
  props.textGroup.removeBlock(toRemove);
  activateBlock(neighbor);
};

const goPrevious = () => {
  if (!canGoPrevious.value) {
    return;
  }
  activateBlock(props.textGroup.textBlocks[activeIndex.value - 1].text);
};
const goNext = () => {
  if (!canGoNext.value) {
    return;
  }
  activateBlock(props.textGroup.textBlocks[activeIndex.value + 1].text);
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
defineExpose({ getTextGroup, insertAtCursor, refreshActiveFont });
</script>
<template>
  <div v-if="editor" class="text-group-editor">
    <div class="row mb-2 ms-2 align-items-center">
      <div class="col-auto btn-group" role="group">
        <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('add-block-button')"
          title="Add Block" @click.prevent="addBlock"><span class="icon-plus"></span></button>
        <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('remove-block-button')"
          title="Remove Block" :disabled="!canRemove" @click.prevent="removeBlock"><span class="icon-cancel-circle"></span></button>
        <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('previous-block-button')"
          title="Previous Block" :disabled="!canGoPrevious" @click.prevent="goPrevious"><span class="icon-arrow-left"></span></button>
        <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('next-block-button')"
          title="Next Block" :disabled="!canGoNext" @click.prevent="goNext"><span class="icon-arrow-right"></span></button>
      </div>
      <div class="col-auto ms-2">
        <selectComp :domId="getId('relative-position')" label="Layout" :selections="relativePositionOptions"
          :initialValue="props.textGroup.relativePosition.toString()" :changeCb="onRelativePositionSelect" />
      </div>
    </div>
    <div class="row mb-2 ms-2">
      <div class="col">
        <EditorContent :editor="editor" :id="getId('editor-content')" class="form-control text-group-editor-content"
          style="overflow-y: auto;" :style="activeFontStyle" />
      </div>
    </div>
  </div>
</template>
