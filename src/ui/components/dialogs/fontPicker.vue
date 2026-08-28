<script setup lang="ts">
import { FontInfo } from '../../../common/vex';
import { SelectOption } from '../../common';
import { SourceSerifProFont } from '../../../styles/font_metrics/ssp-serif-metrics';
import { SourceSansProFont } from '../../../styles/font_metrics/ssp-sans-metrics';
import selectComp from './select.vue';

import numberInputApp from './numberInput.vue';
import toggle from './toggle.vue';
import { ref, Ref, reactive, watch } from 'vue';
interface Props {
  domId: string,
  label: string,
  font: FontInfo,
  changeCb?: (font: FontInfo) => void
};
const props = defineProps<Props>();
const fontFamilies: SelectOption[] = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Serif', value: SourceSerifProFont.fontFamily },
  { label: 'Sans', value: SourceSansProFont.fontFamily },
  { label: 'Roboto Slab', value: 'Roboto Slab' },
  { label: 'Petaluma', value: 'Petaluma Script' },
  { label: 'Commissioner', value: 'Commissioner' },
  { label: 'Concert One', value: 'ConcertOne' },
  { label: 'Merriweather', value: 'Merriweather' }
]
const { domId, font } = { ...props };
const getDomId = () => {
  return `fontpick-${domId}`;
}
const getId = (str: string) => {
  return `${getDomId()}-${str}`;
}
const fontSize = ref(12);

const fontCopy = reactive({
  family: font.family ?? 'Arial',
  size: font.size ?? 12,
  weight: font.weight ?? 'normal',
  style: font.style ?? 'normal'
});
if (!isNaN(fontCopy.size as number)) {
  fontSize.value = fontCopy.size as number;
}
const isBold = ref(fontCopy.weight === 'bold');
const isItalic = ref(fontCopy.style === 'italic');
let suppressNotify = false;
watch(isBold, (newVal) => {
  fontCopy.weight = newVal ? 'bold' : 'normal';
  if (!suppressNotify) {
    props.changeCb?.({ ...fontCopy });
  }
});
watch(isItalic, (newVal) => {
  fontCopy.style = newVal ? 'italic' : 'normal';
  if (!suppressNotify) {
    props.changeCb?.({ ...fontCopy });
  }
});
const changeSizeCb = async (size: number) => {
  fontCopy.size = size;
  props.changeCb?.({ ...fontCopy });
};
const changeFamilyCb = async (family: string) => {
  fontCopy.family = family;
  props.changeCb?.({ ...fontCopy });
};
// Resync from the parent when the underlying font changes externally
// (e.g. the active text block changes after a rich-text edit session).
watch(() => props.font, (next) => {
  suppressNotify = true;
  fontCopy.family = next.family ?? 'Arial';
  fontCopy.size = next.size ?? 12;
  fontCopy.weight = next.weight ?? 'normal';
  fontCopy.style = next.style ?? 'normal';
  if (!isNaN(fontCopy.size as number)) {
    fontSize.value = fontCopy.size as number;
  }
  isBold.value = fontCopy.weight === 'bold';
  isItalic.value = fontCopy.style === 'italic';
  suppressNotify = false;
});
</script>
<template>
  <div class="group">
    <div class="group-label">{{ label }}</div>    
    <div class="grow-row mb-2">
      <selectComp :domId="getId('font-family-select')" :label="'Family'" :selections="fontFamilies"
        :initialValue="fontCopy.family" :changeCb="changeFamilyCb" :inline="true" />
      <numberInputApp :domId="getId('page-width-input')" :initialValue="fontSize" :precision="1"
        :changeCb="changeSizeCb" :disabled="false" label="Size" :inline="true" />
    </div>
  <div class="row mb-2 ms-2">
    <div class="col col-6 ps-0">
      <toggle :domId="getId('font-weight')" :label="'Bold'" :initialValue="isBold"
        :changeCb="(value: boolean) => { isBold = value }" />
    </div>
    <div class="col col-6 ps-0">
      <toggle :domId="getId('font-style')" :label="'Italic'" :initialValue="isItalic"
        :changeCb="(value: boolean) => { isItalic = value }" />
    </div>
  </div>
  </div>
</template>