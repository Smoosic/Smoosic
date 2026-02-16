<script setup lang="ts">
import { ref, Ref, watch, reactive } from 'vue';
import selectComp from './select.vue';
import numberInputApp from './numberInput.vue';
import { SelectOption } from '../../common';
import { SmoPartInfo, SmoPartInfoStringType, SmoPartInfoNumType, SmoPartInfoBooleanType } from '../../../smo/data/partInfo';
import { GlobalLayoutAttributes, 
  GlobalLayoutNumberAttributes, displayMode, GlobalLayoutAttributesArray, GlobalLayoutNumberAttributesArray } from '../../../smo/data/scoreModifiers';
import dialogContainer from './dialogContainer.vue';

interface Props {
  domId: string,
  label: string,
  partInfo: SmoPartInfo,
  updatePartInfoCb: (pi: SmoPartInfo) => Promise<void>,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, commitCb, cancelCb, updatePartInfoCb } = { ...props };
const partInfo = reactive(new SmoPartInfo(props.partInfo));

const writeBooleanValue = async (attr: SmoPartInfoBooleanType, value: boolean) => {
  partInfo[attr] = value;
  await updatePartInfoCb(partInfo);
}
const writeLayoutValue = async (attr: GlobalLayoutAttributes, value: number | displayMode) => {
    // no change?
    if (partInfo.layoutManager.globalLayout[attr] === value) {
      return;
    }
    if (GlobalLayoutNumberAttributesArray.indexOf(attr as GlobalLayoutNumberAttributes) >= 0 && typeof value === 'number') {
      partInfo.layoutManager.globalLayout[attr as GlobalLayoutNumberAttributes] = value;
      await updatePartInfoCb(partInfo);
    } else if (attr === 'displayMode' && typeof value === 'string') {
      partInfo.layoutManager.globalLayout.displayMode = value as displayMode;
      await updatePartInfoCb(partInfo);
    }
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
// Page size is in pixels, but if it matches a preset we just show that.
// User chooses 'custom' to unlock width/height editing.
const pageSize = ref('custom');

const pageChange = () => {
 Object.keys(predefinedDimensions).forEach((key) => {
    const dims = predefinedDimensions[key];
    if (dims.width === partInfo.layoutManager.globalLayout.pageWidth &&
      dims.height === partInfo.layoutManager.globalLayout.pageHeight) {
      pageSize.value = key;
    }
  });
};
const pageSizeCb = async (val: string) => {
  const dims = predefinedDimensions[val];
  if (dims) {
    partInfo.layoutManager.globalLayout.pageWidth = dims.width;
    partInfo.layoutManager.globalLayout.pageHeight = dims.height;
  }
  pageSize.value = val;
  // The watch will trigger the callback
}
const lockDimensions = ref(false);
pageChange();
watch (pageSize, async (newVal) => {
  if (predefinedDimensions[newVal]) {
    lockDimensions.value = true;
    const dims = predefinedDimensions[newVal];
    partInfo.layoutManager.globalLayout.pageWidth = dims.width;
    partInfo.layoutManager.globalLayout.pageHeight = dims.height;
  } else {
    lockDimensions.value = false;
  }
  await updatePartInfoCb(partInfo);
});
if (predefinedDimensions[pageSize.value]) {
  lockDimensions.value = true
}
const update =async () => {
  await updatePartInfoCb(partInfo);
}
const includeNext = ref(false);
if (partInfo.stavesAfter > 0) {
  includeNext.value = true;
}
watch (includeNext, async (newVal, oldVal) => {
  if (newVal !== oldVal) {
    partInfo.stavesAfter = newVal ? 1 : 0;
    await updatePartInfoCb(partInfo);
  }
});

type numberWriterType = (value: number) => Promise<void>;

const updateLayoutFunc = (param: GlobalLayoutAttributes): numberWriterType => {  
  const cb = async (value: number | displayMode) => {
    await writeLayoutValue(param, value);
  }
  return cb;
}

const getId = (str: string) => {
  return `${domId}-${str}`;
}

</script>
<template>
  <dialogContainer :domId="domId" :commitCb="commitCb" :cancelCb="cancelCb" :label="label">
    <div class="row mb-2 align-items-center">
      <div class="col col-8">
        <input type="text" class="form-control" :placeholder="partInfo.partName" aria-label="Part Name"
          :id="getId('part-name-input')" v-model="partInfo.partName" @change="update">
      </div>
      <div class="col col-4 text-start">
        <span class="" :id="getId('part-name-label')">Part Name</span>
      </div>
    </div>
    <div class="row mb-2 align-items-center">
      <div class="col col-8">
        <input type="text" class="form-control" :placeholder="partInfo.partAbbreviation" aria-label="Part Abbreviation"
          :id="getId('part-abbreviation-input')" v-model="partInfo.partAbbreviation" @change="update">
      </div>
      <div class="col col-4 text-start">
        <span class="" :id="getId('part-abbreviation-label')">Part Abbreviation</span>
      </div>
    </div>
    <div class="row mb-2 align-items-center">
      <div class="col col-1">
        <input class="form-check-input" type="checkbox" v-model="partInfo.preserveTextGroups" :id="getId('preserveText')"
          @change="writeBooleanValue('preserveTextGroups', partInfo.preserveTextGroups)"></input>
      </div>
      <div class="col col-5">
        <label class="form-check-label" :for="getId('preserveText')">Preserve Text Groups</label>
      </div>
      <div class="col col-1">
        <input class="form-check-input" type="checkbox" v-model="partInfo.expandMultimeasureRests" :id="getId('expandMultimeasureRests')"
          @change="writeBooleanValue('expandMultimeasureRests', partInfo.expandMultimeasureRests)"></input>
      </div>
      <div class="col col-5">
        <label class="form-check-label" :for="getId('expandMultimeasureRests')">Expand Multimeasure Rests</label>
      </div>
    </div>
    <div class="row mb-2 align-items-center">
      <div class="col col-1">
        <input class="form-check-input" type="checkbox" v-model="includeNext" :id="getId('includeNext')"></input>
      </div>
      <div class="col col-5">
        <label class="form-check-label" :for="getId('includeNext')">Include Next Stave</label>
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-3 text-end">Page Size</div>
      <div class="col col-6">
        <selectComp :domId="getId('page-size-select')" :label="''" :selections="pageSizes" :initialValue="pageSize"
          :changeCb="pageSizeCb" />
      </div>
    </div>
    <div class="row mb-2 align-items-center">
      <div class="col col-4">
        <numberInputApp :domId="getId('page-width-input')" :initialValue="partInfo.layoutManager.globalLayout.pageWidth" :precision="0"
          :changeCb="updateLayoutFunc('pageWidth')" :disabled="lockDimensions" />
      </div>
      <div class="col col-2 fs-7 ms-n4 ps-0 text-start">
        <span class="form-check-label">Page Width</span>
      </div>
      <div class="col col-4 ms-n4">
        <numberInputApp :domId="getId('page-height-input')" :initialValue="partInfo.layoutManager.globalLayout.pageHeight" :precision="0"
          :changeCb="updateLayoutFunc('pageHeight')" :disabled="lockDimensions" />
      </div>
      <div class="col col-2 fs-7 ms-n4 ps-0 text-start">
        <span class="form-check-label">Page Height</span>
      </div>
    </div>
    <div class="row mb-2 align-items-center">
      <div class="col col-4">
        <numberInputApp :domId="getId('zoom-scale-input')" :initialValue="partInfo.layoutManager.globalLayout.zoomScale" :precision="0"
          :percent=true :changeCb="updateLayoutFunc('zoomScale')" :minValue="0.25" :maxValue="8" />
      </div>
      <div class="col col-2 fs-7 ms-n4 ps-0 text-start">
        <span class="form-check-label">Zoom Scale (%)</span>
      </div>
      <div class="col col-4 ms-n4">
        <numberInputApp :domId="getId('svg-scale-input')" :initialValue="partInfo.layoutManager.globalLayout.svgScale" :precision="0"
          :percent="true" :changeCb="updateLayoutFunc('svgScale')" :minValue="0.25" :maxValue="2" />
      </div>
      <div class="col col-2 fs-7 ms-n4 ps-0 text-start">
        <span class="form-check-label">Note Size (%)</span>
      </div>
    </div>
    <div class="row mb-2 align-items-center">
      <div class="col col-4">
        <numberInputApp :domId="getId('note-spacing-input')" :initialValue="partInfo.layoutManager.globalLayout.noteSpacing" :precision="2"
          :changeCb="updateLayoutFunc('noteSpacing')" />
      </div>
      <div class="col col-2 fs-7 ms-n4 ps-0 text-start">
        <span class="form-check-label">Note Spacing</span>
      </div>
      <div class="col col-4 ms-n4">
        <numberInputApp :domId="getId('max-measure-system-input')" :initialValue="partInfo.layoutManager.globalLayout.maxMeasureSystem"
          :precision="0" :changeCb="updateLayoutFunc('maxMeasureSystem')" />
      </div>
      <div class="col col-2 fs-7 ms-n4 ps-0 text-start">
        <span class="form-check-label">Measures/System</span>
      </div>
    </div>
  </dialogContainer>
</template>