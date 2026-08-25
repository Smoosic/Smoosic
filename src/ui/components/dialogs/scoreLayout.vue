<script setup lang="ts">
import { ref, Ref, watch, reactive } from 'vue';
import selectComp from './select.vue';
import numberInputApp from './numberInput.vue';
import { SelectOption } from '../../common';
import { SmoGlobalLayout } from '../../../smo/data/scoreModifiers';
import dialogContainer from './dialogContainer.vue';

interface Props {
  domId: string,
  label: string,
  getLayout: () => SmoGlobalLayout,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, getLayout, commitCb, cancelCb } = { ...props };
const currentLayout: SmoGlobalLayout = getLayout();
type numberTypes = 'pageWidth' | 'pageHeight' | 'zoomScale' | 'svgScale' | 'noteSpacing' | 'maxMeasureSystem';
const updateNumberType = (nt: numberTypes) => {
  const updateNumber = async (val: number) => {
    (currentLayout)[nt] = val;
  }
  return updateNumber;
}
const pageSizes: SelectOption[] = [
  { label: 'Letter', value: 'letter' },
  { label: 'Legal', value: 'legal' },
  { label: 'Tabloid', value: 'tabloid' },
  { label: 'A4', value: 'a4' },
  { label: 'Custom', value: 'custom' }
];
interface dimensions {
  width: number,
  height: number
}
const predefinedDimensions: { [key: string]: dimensions } = {
  'letter': { width: 816, height: 1056 },
  'legal': { width: 816, height: 1344 },
  'tabloid': { width: 1056, height: 1632 },
  'a4': { width: 794, height: 1123 }
};
const pageSize = ref('custom');
const pageChange = (val: string) => {
  pageSize.value = val;
};
;
const lockDimensions = ref(false);

const setPageSize = () => {
  Object.keys(predefinedDimensions).forEach((key) => {
    const dims = predefinedDimensions[key];
    if (dims.width === currentLayout.pageWidth &&
      dims.height === currentLayout.pageHeight) {
      pageSize.value = key;
    }
  });
}
setPageSize();
watch(pageSize, (newVal) => {
  if (predefinedDimensions[newVal]) {
    lockDimensions.value = true;
    const dims = predefinedDimensions[newVal];
    currentLayout.pageWidth = dims.width;
    currentLayout.pageHeight = dims.height;
  } else {
    lockDimensions.value = false;
  }
});
if (predefinedDimensions[pageSize.value]) {
  lockDimensions.value = true
}
const getDomId = () => {
  return `attr-modal-dialog-${domId}`;
}
const getId = (str: string) => {
  return `${domId}-${str}`;
}

</script>
<template>
  <dialogContainer :domId="domId" :commitCb="props.commitCb" :cancelCb="props.cancelCb" :label="props.label">
    <div class="group">
      <div class="group-label">Page Dimensions</div>
      <div class="mb-2">
        <selectComp :domId="getId('page-size-select')" :label="'Paper Size'" :selections="pageSizes" :initialValue="pageSize"
          :changeCb="pageChange" />
        </div>
        <numberInputApp :domId="getId('page-width-input')" :initialValue="currentLayout.pageWidth" :precision="0"
          :changeCb="updateNumberType('pageWidth')" :disabled="lockDimensions" label="Page Width" />
        <numberInputApp :domId="getId('page-height-input')" :initialValue="currentLayout.pageHeight" :precision="0"
          :changeCb="updateNumberType('pageHeight')" :disabled="lockDimensions" label="Page Height"/>
    </div>
    <div class="row mb-2 align-items-center">
      <div class="col col-4">
        <numberInputApp :domId="getId('zoom-scale-input')" :initialValue="currentLayout.zoomScale" :precision="0"
          :percent=true :changeCb="updateNumberType('zoomScale')" :minValue="0.25" :maxValue="8" />
      </div>
      <div class="col col-2 fs-7 ms-n4 ps-0 text-start">
        <span class="form-check-label">Zoom (%)</span>
      </div>
      <div class="col col-4 ms-n4">
        <numberInputApp :domId="getId('svg-scale-input')" :initialValue="currentLayout.svgScale" :precision="0"
          :percent="true" :changeCb="updateNumberType('svgScale')" :minValue="0.25" :maxValue="2" />
      </div>
      <div class="col col-2 fs-7 ms-n4 ps-0 text-start">
        <span class="form-check-label">Note Size (%)</span>
      </div>
    </div>
    <div class="row mb-2 align-items-center">
      <div class="col col-4">
        <numberInputApp :domId="getId('note-spacing-input')" :initialValue="currentLayout.noteSpacing" :precision="2"
          :changeCb="updateNumberType('noteSpacing')" />
      </div>
      <div class="col col-2 fs-7 ms-n4 ps-0 text-start">
        <span class="form-check-label">Note Spacing</span>
      </div>
      <div class="col col-4 ms-n4">
        <numberInputApp :domId="getId('max-measure-system-input')" :initialValue="currentLayout.maxMeasureSystem"
          :precision="0" :changeCb="updateNumberType('maxMeasureSystem')" />
      </div>
      <div class="col col-2 fs-7 ms-n4 ps-0 text-start">
        <span class="form-check-label">Measures/System</span>
      </div>
    </div>
  </dialogContainer>
</template>