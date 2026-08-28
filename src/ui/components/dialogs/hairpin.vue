<script setup lang="ts">
import numberInputApp from './numberInput.vue';
import dialogContainer from './dialogContainer.vue';
import { SmoHairpinNumberParams } from '../../dialogs/hairpin';

interface Props {
  domId: string,
  label: string,
  initialPosition?: { top: number, left: number },
  height: number,
  yOffset: number,
  xOffsetRight: number,
  xOffsetLeft: number,
  updateFieldCb: (param: SmoHairpinNumberParams, value: number) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>,
  removeCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, commitCb, cancelCb, removeCb } = { ...props };
const getId = (str: string) => {
  return `${domId}-${str}`;
}
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb" :removeCb="removeCb"
    :initialPosition="initialPosition" :classes="'text-center mw-40 nw-40'">
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('height')" :initialValue="height" :precision="0" label="Height"
          :changeCb="(value: number) => updateFieldCb('height', value)" :inline="true" />
        <numberInputApp :domId="getId('y-offset')" :initialValue="yOffset" :precision="0" label="Y Shift"
          :changeCb="(value: number) => updateFieldCb('yOffset', value)" :inline="true" />
      </div>
    </div>
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('x-offset-right')" :initialValue="xOffsetRight" :precision="0" label="Right Shift"
          :changeCb="(value: number) => updateFieldCb('xOffsetRight', value)" :inline="true" />
        <numberInputApp :domId="getId('x-offset-left')" :initialValue="xOffsetLeft" :precision="0" label="Left Shift"
          :changeCb="(value: number) => updateFieldCb('xOffsetLeft', value)" :inline="true" />
      </div>
    </div>
  </dialogContainer>
</template>
