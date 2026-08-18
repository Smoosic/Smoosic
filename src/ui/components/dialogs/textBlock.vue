<script setup lang="ts">
import { ref, Ref, nextTick, watch, computed } from 'vue';
import { SmoTextGroup } from '../../../smo/data/scoreText';
import { FontInfo } from '../../../common/vex';
import { SelectOption } from '../../common';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import dialogContainer from './dialogContainer.vue';
import numberInputApp from './numberInput.vue';
import selectComp from './select.vue';
import fontPickerComp from './fontPicker.vue';
import textGroupEditorComp from './textGroupEditor.vue';
import textDraggerComp from './textDragger.vue';

interface Props {
  domId: string,
  label: string,
  modifier: Ref<SmoTextGroup>,
  view: SuiScoreViewOperations,
  markEdited: () => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>,
  removeCb: () => Promise<void>
}
const props = defineProps<Props>();
const getId = (str: string) => `${props.domId}-${str}`;

type DialogMode = 'idle' | 'editing' | 'moving';
const mode: Ref<DialogMode> = ref(props.modifier.value.edited ? 'idle' : 'editing');
if (mode.value === 'editing') {
  props.modifier.value.edited = true;
}
const isEditing = computed(() => mode.value === 'editing')

const xPosition = ref(0);
const yPosition = ref(0);
const fontInfo: Ref<FontInfo> = ref({ family: 'Arial', size: 12, weight: 'normal', style: 'normal' });
const pagination = ref<number>(props.modifier.value.pagination);
const attachToSelector = ref<boolean>(props.modifier.value.attachToSelector);

const refreshFromModel = () => {
  const ul = props.modifier.value.ul();
  xPosition.value = ul.x;
  yPosition.value = ul.y;
  fontInfo.value = { ...props.modifier.value.getActiveBlock().fontInfo };
  pagination.value = props.modifier.value.pagination;
  attachToSelector.value = props.modifier.value.attachToSelector;
};
refreshFromModel();

const rerender = async () => {
  props.markEdited();
  await props.view.updateTextGroup(props.modifier.value);
};

// --- Text editing (User Story 1) ---
const editorRef = ref<InstanceType<typeof textGroupEditorComp> | null>(null);
const insertOptions: SelectOption[] = [
  { value: '@@@', label: 'Pages' },
  { value: '###', label: 'Page Number' }
];
const syncEditorIfActive = () => {
  if (mode.value === 'editing' && editorRef.value) {
    // getTextGroup() already carries the correct activeText flags (whichever
    // block the user last navigated to inside the editor) -- unlike the old
    // per-run editor, there is no need to re-pick an active block here.
    const updated = editorRef.value.getTextGroup();
    props.modifier.value.textBlocks = updated.textBlocks;
    props.modifier.value.justification = updated.justification;
    props.modifier.value.relativePosition = updated.relativePosition;
  }
};
const enterEditing = () => {
  mode.value = 'editing';
};
const exitEditing = async () => {
  syncEditorIfActive();
  mode.value = 'idle';
  refreshFromModel();
  await rerender();
};
const insertSpecial = (value: string) => {
  editorRef.value?.insertAtCursor(value);
};

// --- Move text (User Story 2) ---
const draggerRef = ref<InstanceType<typeof textDraggerComp> | null>(null);
const enterMoving = () => {
  mode.value = 'moving';
};
const onDragStop = async () => {
  mode.value = 'idle';
  refreshFromModel();
  await rerender();
};
watch(mode, async (m) => {
  if (m === 'moving') {
    await nextTick();
    draggerRef.value?.start();
  }
});

// --- Precise position & font (User Story 3) ---
const onXChange = async (value: number) => {
  const pos = props.modifier.value.ul();
  props.modifier.value.offsetX(value - pos.x);
  xPosition.value = value;
  await rerender();
};
const onYChange = async (value: number) => {
  const pos = props.modifier.value.ul();
  props.modifier.value.offsetY(value - pos.y);
  yPosition.value = value;
  await rerender();
};
const onFontChange = async (font: FontInfo) => {
  const activeText = props.modifier.value.getActiveBlock();
  activeText.fontInfo.family = font.family;
  activeText.fontInfo.size = font.size;
  activeText.fontInfo.weight = font.weight;
  activeText.fontInfo.style = font.style;
  if (mode.value === 'editing') {
    editorRef.value?.refreshActiveFont();
  }
  await rerender();
};
// The active block can change while the text editor is open (add/remove/
// previous/next controls inside textGroupEditorComp); keep this dialog's
// font picker in sync with whichever block just became active.
const onActiveBlockChanged = (font: FontInfo) => {
  fontInfo.value = { ...font };
};

// --- Page behavior & attach-to-selection (User Story 4) ---
const paginationOptions: SelectOption[] = [
  { value: SmoTextGroup.paginations.ONCE.toString(), label: 'Once' },
  { value: SmoTextGroup.paginations.EVERY.toString(), label: 'Every' },
  { value: SmoTextGroup.paginations.ODD.toString(), label: 'Odd' },
  { value: SmoTextGroup.paginations.SUBSEQUENT.toString(), label: 'Subsequent' }
];
const resetAttachToSelectorModel = () => {
  props.modifier.value.attachToSelector = false;
  props.modifier.value.selector = SmoTextGroup.defaults.selector;
  props.modifier.value.musicXOffset = SmoTextGroup.defaults.musicXOffset;
  props.modifier.value.musicYOffset = SmoTextGroup.defaults.musicYOffset;
};
const activateAttachToSelectorModel = () => {
  props.modifier.value.attachToSelector = true;
  const sel = props.view.tracker.selections[0];
  if (sel) {
    props.modifier.value.selector = JSON.parse(JSON.stringify(sel.selector));
    if (props.modifier.value.logicalBox && sel.measure.svg.logicalBox) {
      props.modifier.value.musicXOffset = props.modifier.value.logicalBox.x - sel.measure.svg.logicalBox.x;
      props.modifier.value.musicYOffset = props.modifier.value.logicalBox.y - sel.measure.svg.logicalBox.y;
    }
  }
};
// These two controls are mutually exclusive (legacy _activateAttachToSelector /
// _resetAttachToSelector). Handled as direct synchronous handlers, not watch()
// pairs, since watch() callbacks are batched/async and a flag-based suppression
// between two watchers of each other's refs cannot reliably prevent re-entrancy.
const onPaginationSelect = async (value: string) => {
  const num = parseInt(value, 10);
  pagination.value = num;
  props.modifier.value.pagination = num;
  if (attachToSelector.value) {
    attachToSelector.value = false;
    resetAttachToSelectorModel();
  }
  await rerender();
};
const onAttachToggle = async (checked: boolean) => {
  attachToSelector.value = checked;
  if (checked) {
    activateAttachToSelectorModel();
    if (pagination.value !== SmoTextGroup.paginations.ONCE) {
      pagination.value = SmoTextGroup.paginations.ONCE;
      props.modifier.value.pagination = SmoTextGroup.paginations.ONCE;
    }
  } else {
    resetAttachToSelectorModel();
  }
  await rerender();
};

// --- OK / Cancel / Remove ---
const handleCommit = async () => {
  syncEditorIfActive();
  await props.commitCb();
};
</script>

<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="handleCommit" :cancelCb="cancelCb" :removeCb="removeCb">
    <div v-if="mode === 'moving'">
      <textDraggerComp ref="draggerRef" :domId="getId('dragger')" altLabel="Done Dragging Text"
        :textGroup="modifier.value" :pageMap="view.renderer.pageMap" :scroller="view.tracker.scroller" :debug="view.debug"
        @stop="onDragStop" />
    </div>
    <template v-else>
      <div v-if="mode === 'editing'">
        <textGroupEditorComp ref="editorRef" :domId="getId('editor')" :textGroup="modifier.value"
          @active-block-changed="onActiveBlockChanged" />
        <div class="row mb-2 ms-2 align-items-center">
          <div class="col col-4">
            <selectComp :domId="getId('insert-special')" label="Insert Special" :selections="insertOptions"
              :initialValue="''" :changeCb="insertSpecial" />
          </div>
          <div class="col col-4">
            <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('done-editing')"
              @click.prevent="exitEditing">Done Editing Text</button>
          </div>
        </div>
      </div>
      <template v-else>
        <div class="row mb-2 ms-2">
          <div class="col col-4">
            <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('edit-text')"
              @click.prevent="enterEditing"><span class="icon icon-pencil"></span></button>
          </div>
          <div class="col col-4">
            <button type="button" class="btn btn-sm btn-outline-dark" :id="getId('move-text')"
              @click.prevent="enterMoving"><span class="icon icon-move"></span></button>
          </div>
        </div>
        <div class="row mb-2 ms-2 align-items-center">
          <div class="col col-4">
            <numberInputApp :domId="getId('x-position')" :precision="0" :initialValue="xPosition" :changeCb="onXChange" />
          </div>
          <div class="col col-4">X Position (Px)</div>
          <div class="col col-4">
            <numberInputApp :domId="getId('y-position')" :precision="0" :initialValue="yPosition" :changeCb="onYChange" />
          </div>
          <div class="col col-4">Y Position (Px)</div>
        </div>
      </template>
      <template v-if="mode !== 'editing'">
        <fontPickerComp :domId="getId('font')" label="Font Information" :font="fontInfo" :changeCb="onFontChange" />
        <div class="row mb-2 ms-2 align-items-center">
          <div class="col col-3">Page Behavior</div>
          <div class="col col-5">
            <selectComp :key="pagination" :domId="getId('pagination')" label="Page Behavior" :selections="paginationOptions"
              :initialValue="pagination.toString()" :changeCb="onPaginationSelect" />
          </div>
        </div>
        <div class="row mb-2 ms-2 align-items-center">
          <div class="checkbox-input-column-div">
            <input class="form-check-input" type="checkbox" :checked="attachToSelector"
              @change="onAttachToggle(($event.target as HTMLInputElement).checked)" :id="getId('attach-to-selector')" />
          </div>
          <div class="checkbox-input-label-div">
            <span class="form-check-label" :for="getId('attach-to-selector')">Attach to Selection</span>
          </div>
        </div>
      </template>
    </template>
  </dialogContainer>
</template>
