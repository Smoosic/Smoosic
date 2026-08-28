<script setup lang="ts">
import numberInputApp from './numberInput.vue';
import selectComp from './select.vue';
import dialogContainer from './dialogContainer.vue';
import { SelectOption } from '../../common';
import { SmoDynamicText } from '../../../smo/data/noteModifiers';

interface Props {
  domId: string,
  label: string,
  initialPosition?: { top: number, left: number },
  yOffsetLine: number,
  yOffsetPixels: number,
  xOffset: number,
  text: string,
  updateNumberCb: (param: 'yOffsetLine' | 'yOffsetPixels' | 'xOffset', value: number) => void,
  updateTextCb: (value: string) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>,
  removeCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, commitCb, cancelCb, removeCb } = { ...props };
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const dynamicOptions: SelectOption[] = [
  { value: SmoDynamicText.dynamics.P, label: 'Piano' },
  { value: SmoDynamicText.dynamics.PP, label: 'Pianissimo' },
  { value: SmoDynamicText.dynamics.MP, label: 'Mezzo-Piano' },
  { value: SmoDynamicText.dynamics.MF, label: 'Mezzo-Forte' },
  { value: SmoDynamicText.dynamics.F, label: 'Forte' },
  { value: SmoDynamicText.dynamics.FF, label: 'Fortissimo' },
  { value: SmoDynamicText.dynamics.SFZ, label: 'Sforzando' }
];
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb" :removeCb="removeCb"
    :initialPosition="initialPosition" :classes="'text-center mw-40 nw-40'">
    <div class="row mb-2">
      <div class="col col-12">
        <selectComp :domId="getId('text')" :label="'Text'" :selections="dynamicOptions" :initialValue="text"
          :changeCb="updateTextCb" />
      </div>
    </div>
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('y-line')" :initialValue="yOffsetLine" :precision="0" label="Y Line"
          :changeCb="(value: number) => updateNumberCb('yOffsetLine', value)" :inline="true" />
        <numberInputApp :domId="getId('y-offset-px')" :initialValue="yOffsetPixels" :precision="0" label="Y Offset Px"
          :changeCb="(value: number) => updateNumberCb('yOffsetPixels', value)" :inline="true" />
      </div>
    </div>
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('x-offset')" :initialValue="xOffset" :precision="0" label="X Offset"
          :changeCb="(value: number) => updateNumberCb('xOffset', value)" :inline="true" />
      </div>
    </div>
  </dialogContainer>
</template>
