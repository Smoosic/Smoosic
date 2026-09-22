<script setup lang="ts">
import { ref, Ref, computed, nextTick, watch } from 'vue';
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
import annotationDraggerComp from './annotationDragger.vue';

interface Props {
  domId: string,
  label: string,
  view: SuiScoreViewOperations,
  selections: SmoSelection[],
  annotations: SmoLyric[],
  initialIndex: number,
  startInEditingMode: boolean,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const getId = (str: string) => `${props.domId}-${str}`;

type DialogMode = 'editing' | 'dialog' | 'moving';
const mode: Ref<DialogMode> = ref(props.startInEditingMode ? 'editing' : 'dialog');

// The note's full set of annotations (up to 4), sorted by verse -- always
// reloaded fresh from the first selection's note after any mutation rather
// than hand-patched, so a multi-note selection whose notes have diverged
// annotation counts is handled correctly (spec Edge Cases; see
// specs/018-annotation-index-selector/research.md §5).
const annotationList: Ref<SmoLyric[]> = ref(props.annotations);
const currentIndex: Ref<number> = ref(props.initialIndex);
const currentAnnotation = computed(() => annotationList.value[currentIndex.value]);

const canAddMore = computed(() => annotationList.value.length < 4);
const showIndexSelector = computed(() => annotationList.value.length >= 2);
const indexOptions = computed((): SelectOption[] =>
  annotationList.value.map((a, i) => ({ value: i.toString(), label: (i + 1).toString() })));

let originalText = '';
const annotationText = ref('');
const translateX = ref(0);
const translateY = ref(0);
const verticalJustify = ref(SmoLyric.annotationVerticalJustify.TOP);
const fontInfo: Ref<FontInfo> = ref({ family: 'Merriweather', size: 12, weight: 'normal', style: 'normal' });

const justifyOptions: SelectOption[] = [
  { value: SmoLyric.annotationVerticalJustify.TOP.toString(), label: 'Top' },
  { value: SmoLyric.annotationVerticalJustify.BOTTOM.toString(), label: 'Bottom' }
];

// (Re)populate the displayed fields from whichever annotation is currently
// selected (initial load, or after switching the index dropdown).
const loadCurrent = () => {
  const annotation = currentAnnotation.value;
  if (!annotation) {
    originalText = '';
    annotationText.value = '';
    translateX.value = 0;
    translateY.value = 0;
    verticalJustify.value = SmoLyric.annotationVerticalJustify.TOP;
    return;
  }
  originalText = annotation.getText();
  annotationText.value = originalText;
  translateX.value = annotation.translateX;
  translateY.value = annotation.translateY;
  verticalJustify.value = annotation.verticalJustify;
  fontInfo.value = {
    family: annotation.fontInfo.family,
    size: annotation.fontInfo.size,
    weight: annotation.fontInfo.weight ?? 'normal',
    style: annotation.fontInfo.style ?? 'normal'
  };
};
loadCurrent();

// Refresh the display list from the first selection's note -- the source of
// truth for '+'/index-selector availability (spec Assumptions) -- after any
// mutation (add, remove-and-renumber).
const loadAnnotationList = () => {
  const note = props.selections[0]?.note;
  annotationList.value = note ? (note.getAnnotations() as SmoLyric[]) : [];
};

// The annotation object is shared by reference across every selected note's
// textModifiers (see specs/017-text-annotations/research.md §5), so mutating
// a field on it is already visible everywhere it's attached; syncModifiers()
// re-runs the score mutation for every original selection so the
// undo/persistence-side note tree (a separate deserialized clone per note)
// stays in sync too.
const syncModifiers = async () => {
  const annotation = currentAnnotation.value;
  if (!annotation) {
    return;
  }
  for (let i = 0; i < props.selections.length; ++i) {
    const sel = props.selections[i];
    if (sel.note) {
      await props.view.addOrUpdateAnnotation(sel.selector, annotation);
    }
  }
};

const annotationEditorRef = ref<InstanceType<typeof annotationEditorComp> | null>(null);

// --- Move annotation (drag tool) ---
const draggerRef = ref<InstanceType<typeof annotationDraggerComp> | null>(null);
const enterMoving = () => {
  mode.value = 'moving';
};
const onDragEnd = async () => {
  loadCurrent();
  await syncModifiers();
};
const onDragStop = async () => {
  mode.value = 'dialog';
  loadCurrent();
  await syncModifiers();
};
watch(mode, async (m) => {
  if (m === 'moving') {
    await nextTick();
    draggerRef.value?.start();
  }
});

// Removes the annotation at verseIndex from every original selection, then
// shifts every remaining annotation at a higher verse down by one so
// indices stay contiguous (FR-008/FR-009, specs/018-annotation-index-selector/
// research.md §6) -- shared by the explicit delete button and by
// commitIfChanged's empty-text path below.
const removeAndRenumber = async (verseIndex: number) => {
  for (let i = 0; i < props.selections.length; ++i) {
    const sel = props.selections[i];
    if (!sel.note) {
      continue;
    }
    const toRemove = (sel.note.getAnnotations() as SmoLyric[]).find((a) => a.verse === verseIndex);
    if (toRemove) {
      await props.view.removeAnnotation(sel.selector, toRemove);
    }
    const shifted = (sel.note.getAnnotations() as SmoLyric[]).filter((a) => a.verse > verseIndex);
    for (let j = 0; j < shifted.length; ++j) {
      const a = shifted[j];
      a.verse -= 1;
      await props.view.addOrUpdateAnnotation(sel.selector, a);
    }
  }
  loadAnnotationList();
  currentIndex.value = Math.max(0, Math.min(verseIndex, annotationList.value.length - 1));
  if (annotationList.value.length > 0) {
    loadCurrent();
  }
  mode.value = 'dialog';
};

// Only write back if the text actually changed; if cleared to empty, remove
// the annotation (and renumber) instead (FR-003, extended by FR-008).
const commitIfChanged = async () => {
  const annotation = currentAnnotation.value;
  if (!annotation) {
    return;
  }
  const text = annotationEditorRef.value?.getText() ?? annotationText.value;
  annotationText.value = text;
  if (text === originalText) {
    return;
  }
  if (text.trim().length === 0) {
    await removeAndRenumber(annotation.verse);
    return;
  }
  annotation.setText(text);
  await syncModifiers();
  originalText = text;
};

const deleteCurrent = async () => {
  const annotation = currentAnnotation.value;
  if (!annotation) {
    return;
  }
  await removeAndRenumber(annotation.verse);
};

const addAnnotation = async () => {
  if (!canAddMore.value) {
    return;
  }
  const fresh = new SmoLyric({ ...SmoLyric.defaults, parser: SmoLyric.parsers.annotation, text: '' });
  fresh.verse = annotationList.value.length;
  for (let i = 0; i < props.selections.length; ++i) {
    const sel = props.selections[i];
    if (sel.note) {
      await props.view.addOrUpdateAnnotation(sel.selector, fresh);
    }
  }
  loadAnnotationList();
  const newIndex = annotationList.value.findIndex((a) => a.verse === fresh.verse);
  currentIndex.value = newIndex >= 0 ? newIndex : annotationList.value.length - 1;
  loadCurrent();
  mode.value = 'editing';
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

const onIndexChange = (value: string) => {
  currentIndex.value = parseInt(value, 10);
  loadCurrent();
};

const onXChange = async (value: number) => {
  translateX.value = value;
  const annotation = currentAnnotation.value;
  if (!annotation) {
    return;
  }
  annotation.translateX = value;
  await syncModifiers();
};
const onYChange = async (value: number) => {
  translateY.value = value;
  const annotation = currentAnnotation.value;
  if (!annotation) {
    return;
  }
  annotation.translateY = value;
  await syncModifiers();
};
const onJustifyChange = async (value: string) => {
  verticalJustify.value = parseInt(value, 10);
  const annotation = currentAnnotation.value;
  if (!annotation) {
    return;
  }
  annotation.verticalJustify = verticalJustify.value;
  await syncModifiers();
};
// Per-instance, unlike lyric.vue's onFontChange (which commits score-wide
// via view.setLyricFont) -- see specs/017-text-annotations/research.md §6.
const onFontChange = async (font: FontInfo) => {
  fontInfo.value = { ...font };
  const annotation = currentAnnotation.value;
  if (!annotation) {
    return;
  }
  annotation.fontInfo = { ...font };
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
    <template v-else-if="mode === 'moving'">
      <annotationDraggerComp ref="draggerRef" :domId="getId('dragger')" altLabel="Done Dragging Annotation"
        :annotation="currentAnnotation" :pageMap="view.renderer.pageMap" :scroller="view.tracker.scroller"
        :debug="view.debug" @stop="onDragStop" @dragend="onDragEnd" />
    </template>
    <template v-else>
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col-auto">
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('edit-text')"
            @click.prevent="enterEditingMode"><span class="icon-pencil"></span> Edit Text</button>
        </div>
        <div class="col-auto" v-if="currentAnnotation">
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('move-annotation')"
            @click.prevent="enterMoving"><span class="icon icon-move"></span> Move</button>
        </div>
        <div class="col-auto" v-if="canAddMore">
          <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('add-annotation')"
            title="Add Annotation" @click.prevent="addAnnotation"><span class="icon-plus"></span></button>
        </div>
        <div class="col-auto" v-if="showIndexSelector">
          <selectComp :key="annotationList.length" :domId="getId('index')" label="Index" :selections="indexOptions"
            :initialValue="currentIndex.toString()" :changeCb="onIndexChange" />
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
