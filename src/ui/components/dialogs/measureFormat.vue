<script setup lang="ts">
import { ref, Ref, watch, reactive } from 'vue';
import numberInputApp from './numberInput.vue';
import collapsableRow from './collapsableRow.vue';
import toggle from './toggle.vue';
import {
  SmoMeasureFormat, SmoMeasureFormatNumberAttributes, SmoMeasureFormatNumberKeys
} from '../../../smo/data/measureModifiers';
import dialogContainer from './dialogContainer.vue';

interface Props {
  domId: string,
  label: string,
  measureFormat: SmoMeasureFormat,
  isPart: boolean,
  initialDisplayMeasure: number,
  measureCount: number,
  updateMeasureFormatCb: (mf: SmoMeasureFormat) => Promise<void>,
  measureNumberCb: (newIndex: number) => Promise<void>,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, commitCb, cancelCb, measureCount } = { ...props };
const measureFormat = reactive(new SmoMeasureFormat(props.measureFormat));
const measureIndex = ref(props.initialDisplayMeasure + 1);
const renumberMeasureCb = async (newIndex: number) => {
  measureIndex.value = newIndex;
  await props.measureNumberCb(newIndex - 1);
}
const writeNumberValue = async (attr: SmoMeasureFormatNumberAttributes, value: Number) => {
  measureFormat[attr] = value.valueOf();
}
const numberAttributeMap: Record<string, (value: number) => Promise<void>> = {};
SmoMeasureFormatNumberKeys.forEach((key) => {
  numberAttributeMap[key] = async (value: number) => {
    await writeNumberValue(key, value);
  };
});
watch(measureFormat, async () => {
  if (measureFormat.pageBreak) {
    measureFormat.systemBreak = true;
  }
  await props.updateMeasureFormatCb(measureFormat);
}, { deep: true });
const updatePadAll = (value: boolean) => {
  measureFormat.padAllInSystem = value;
}
const updateSkipMeasureCount = (value: boolean) => {
  measureFormat.skipMeasureCount = value;
}
const updateAutoJustify = (value: boolean) => {
  measureFormat.autoJustify = value;
}
const updateRestBreak = (value: boolean) => {
  measureFormat.restBreak = value;
}
const updateSystemBreak = (value: boolean) => {
  measureFormat.systemBreak = value;
}
const updatePageBreak = (value: boolean) => {
  measureFormat.pageBreak = value;
}
const getId = (str: string) => {
  return `${domId}-${str}`;
}
</script>

<template>
  <dialogContainer :domId="domId" :label="label" :cancelCb="cancelCb" :commitCb="commitCb"
    :classes="'mw-40'">
    <div class="toggles">
      <toggle :changeCb="updateSystemBreak" :disabled="measureFormat.pageBreak" :domId="getId('system-break')"
        :initialValue="measureFormat.systemBreak" :label="'Break system before measure'" />
      <toggle :changeCb="updatePageBreak" :domId="getId('system-break')" :initialValue="measureFormat.pageBreak"
        :label="'Break page before measure'" />
    </div>
    <div class="group">
      <div class="group-label">Measure Numbering</div>
      <numberInputApp :domId="getId('measureIndex')" :initialValue="measureIndex" :changeCb="renumberMeasureCb"
        :precision="0" :width="25" :label="'Measure Number'" />
    </div>
    <div class="group">
      <div class="group-label">Padding</div>
      <div class="group-body">
      <numberInputApp :domId="getId('pad-left')" :initialValue="measureFormat.padLeft" :minValue="0" label="Pad Left"
        :changeCb="numberAttributeMap['padLeft']" :precision="0" :width="25" />
      <toggle :disabled="measureFormat.padLeft < 1" :changeCb="updatePadAll" :label="'Pad All In System'"
        :initialValue="measureFormat.padAllInSystem" :domId="getId('pad-all-in-system')" />
      </div>
    </div>
    <div class="group" :class="{ hide: !isPart }">
      <div class="group-label">Part Format</div>
      <toggle :changeCb="updateRestBreak" :domId="getId('rest-break')" :label="'Break Multi-Measure Rest'"
        :initialValue="measureFormat.restBreak" />
    </div>
    <collapsableRow :domId="getId('advanced-options')" :initialState="true" :label="'Spacing'" hint="4 settings">
      <numberInputApp :domId="getId('stretch-contents')" :initialValue="measureFormat.customStretch"
        :changeCb="numberAttributeMap['customStretch']" :precision="0" :width="25" :label="'Stretch Contents'" />
      <numberInputApp :domId="getId('proportionality')" :initialValue="measureFormat.proportionality"
        :changeCb="numberAttributeMap['proportionality']" :precision="0" :width="25" :label="'Proportionality'" />
      <toggle :changeCb="updateAutoJustify" :domId="getId('auto-justify')" :label="'Auto-Justify'"
        :initialValue="measureFormat.autoJustify" />
      <toggle :changeCb="updateSkipMeasureCount"
        :label="'Skip in max measure count'" :domId="getId('skip-measure-count')"
        :initialValue="measureFormat.skipMeasureCount" />
    </collapsableRow>
  </dialogContainer>
</template>