<script setup lang="ts">
import { ref, Ref } from 'vue';
import { SmoSelection } from '../../../smo/xform/selections';
import { SmoLyric } from '../../../smo/data/noteModifiers';
import { FontInfo } from '../../../common/vex';
import { SelectOption } from '../../common';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import dialogContainer from './dialogContainer.vue';
import numberInputApp from './numberInput.vue';
import selectComp from './select.vue';
import fontPickerComp from './fontPicker.vue';
import annotationEditorComp from './annotationEditor.vue';

interface Props {
  domId: string,
  label: string,
  view: SuiScoreViewOperations,
  selections: SmoSelection[],
  annotation: SmoLyric,
  startInEditingMode: boolean,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const getId = (str: string) => `${props.domId}-${str}`;

type DialogMode = 'editing' | 'dialog';
const mode: Ref<DialogMode> = ref(props.startInEditingMode ? 'editing' : 'dialog');

let originalText = props.annotation.getText();
const annotationText = ref(originalText);
const translateX = ref(props.annotation.translateX);
const translateY = ref(props.annotation.translateY);
const verticalJustify = ref(props.annotation.verticalJustify);
const fontInfo: Ref<FontInfo> = ref({
  family: props.annotation.fontInfo.family,
  size: props.annotation.fontInfo.size,
  weight: props.annotation.fontInfo.weight ?? 'normal',
  style: props.annotation.fontInfo.style ?? 'normal'
});

const justifyOptions: SelectOption[] = [
  { value: SmoLyric.annotationVerticalJustify.TOP.toString(), label: 'Top' },
  { value: SmoLyric.annotationVerticalJustify.BOTTOM.toString(), label: 'Bottom' }
];

// The annotation object is shared by reference across every selected note's
// textModifiers (see research.md §5), so mutating a field on it is already
// visible everywhere it's attached; syncModifiers() re-runs the score
// mutation for every original selection so the undo/persistence-side note
// tree (a separate deserialized clone per note) stays in sync too.
const syncModifiers = async () => {
  for (let i = 0; i < props.selections.length; ++i) {
    const sel = props.selections[i];
    if (sel.note) {
      await props.view.addOrUpdateAnnotation(sel.selector, props.annotation);
    }
  }
};

const annotationEditorRef = ref<InstanceType<typeof annotationEditorComp> | null>(null);

// Only write back if the text actually changed; if cleared to empty, remove
// the annotation from every originally-selected note instead (FR-003).
const commitIfChanged = async () => {
  const text = annotationEditorRef.value?.getText() ?? annotationText.value;
  annotationText.value = text;
  if (text === originalText) {
    return;
  }
  if (text.trim().length === 0) {
    for (let i = 0; i < props.selections.length; ++i) {
      const sel = props.selections[i];
      if (sel.note) {
        await props.view.removeAnnotation(sel.selector, props.annotation);
      }
    }
    originalText = '';
    return;
  }
  props.annotation.setText(text);
  await syncModifiers();
  originalText = text;
};

const deleteCurrent = async () => {
  for (let i = 0; i < props.selections.length; ++i) {
    const sel = props.selections[i];
    if (sel.note) {
      await props.view.removeAnnotation(sel.selector, props.annotation);
    }
  }
  originalText = '';
  annotationText.value = '';
  mode.value = 'dialog';
};

const onEditorPreview = async () => {
  await commitIfChanged();
};

const enterDialogMode = async () => {
  await commitIfChanged();
  mode.value = 'dialog';
};
const enterEditingMode = () => {
  mode.value = 'editing';
};

const onXChange = async (value: number) => {
  translateX.value = value;
  props.annotation.translateX = value;
  await syncModifiers();
};
const onYChange = async (value: number) => {
  translateY.value = value;
  props.annotation.translateY = value;
  await syncModifiers();
};
const onJustifyChange = async (value: string) => {
  verticalJustify.value = parseInt(value, 10);
  props.annotation.verticalJustify = verticalJustify.value;
  await syncModifiers();
};
// Per-instance, unlike lyric.vue's onFontChange (which commits score-wide
// via view.setLyricFont) -- see research.md §6.
const onFontChange = async (font: FontInfo) => {
  fontInfo.value = { ...font };
  props.annotation.fontInfo = { ...font };
  await syncModifiers();
};

const finish = async () => {
  if (mode.value === 'editing') {
    await commitIfChanged();
  }
};
const handleCommit = async () => {
  await finish();
  await props.commitCb();
};
const handleCancel = async () => {
  await finish();
  await props.cancelCb();
};
</script>

<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="handleCommit" :cancelCb="handleCancel" classes="text-left">
    <template v-if="mode === 'editing'">
      <div class="row mb-2 ms-2">
        <div class="col">
          <annotationEditorComp ref="annotationEditorRef" :domId="getId('editor')" :text="annotationText"
            :fontInfo="fontInfo" @preview="onEditorPreview" />
        </div>
      </div>
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col-auto btn-group" role="group">
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('delete-annotation')"
            title="Delete Annotation" @click.prevent="deleteCurrent"><span class="icon-cross"></span></button>
        </div>
        <div class="col-auto ms-2">
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('done-editing')"
            @click.prevent="enterDialogMode"><span class="icon-checkmark"></span> Done Editing</button>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="row mb-2 ms-2">
        <div class="col-auto">
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('edit-text')"
            @click.prevent="enterEditingMode"><span class="icon-pencil"></span> Edit Text</button>
        </div>
      </div>
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col col-6">
          <numberInputApp :domId="getId('translate-x')" :precision="0" :minValue="-9999" :maxValue="9999"
            :initialValue="translateX" :changeCb="onXChange" label="X Offset (Px)" />
        </div>
        <div class="col col-6">
          <numberInputApp :domId="getId('translate-y')" :precision="0" :minValue="-9999" :maxValue="9999"
            :initialValue="translateY" :changeCb="onYChange" label="Y Adjustment (Px)" />
        </div>
      </div>
      <div class="row mb-2 ms-2">
        <div class="col col-6">
          <selectComp :domId="getId('vertical-justify')" label="Vertical Justify" :selections="justifyOptions"
            :initialValue="verticalJustify.toString()" :changeCb="onJustifyChange" />
        </div>
      </div>
      <fontPickerComp :domId="getId('font')" label="Font" :font="fontInfo" :changeCb="onFontChange" />
    </template>
  </dialogContainer>
</template>
