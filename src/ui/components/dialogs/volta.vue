<script setup lang="ts">
import numberInputApp from './numberInput.vue';
import dialogContainer from './dialogContainer.vue';
import { SmoVoltaNumberParam } from '../../dialogs/volta';

interface Props {
  domId: string,
  label: string,
  initialPosition?: { top: number, left: number },
  number: number,
  xOffsetStart: number,
  xOffsetEnd: number,
  yOffset: number,
  updateFieldCb: (param: SmoVoltaNumberParam, value: number) => void,
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
        <numberInputApp :domId="getId('number')" :initialValue="number" :precision="0" label="number"
          :changeCb="(value: number) => updateFieldCb('number', value)" :inline="true" />
        <numberInputApp :domId="getId('x1-offset')" :initialValue="xOffsetStart" :precision="0" label="X1 Offset"
          :changeCb="(value: number) => updateFieldCb('xOffsetStart', value)" :inline="true" />
      </div>
    </div>
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('x2-offset')" :initialValue="xOffsetEnd" :precision="0" label="X2 Offset"
          :changeCb="(value: number) => updateFieldCb('xOffsetEnd', value)" :inline="true" />
        <numberInputApp :domId="getId('y-offset')" :initialValue="yOffset" :precision="0" label="Y Offset"
          :changeCb="(value: number) => updateFieldCb('yOffset', value)" :inline="true" />
      </div>
    </div>
  </dialogContainer>
</template>
