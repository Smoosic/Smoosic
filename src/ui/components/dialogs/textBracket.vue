<script setup lang="ts">
import numberInputApp from './numberInput.vue';
import selectComp from './select.vue';
import dialogContainer from './dialogContainer.vue';
import { SelectOption } from '../../common';

interface Props {
  domId: string,
  label: string,
  initialPosition?: { top: number, left: number },
  line: number,
  position: number,
  text: string,
  superscript: string,
  updateNumberCb: (param: 'line' | 'position', value: number) => void,
  updateTextCb: (param: 'text' | 'superscript', value: string) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>,
  removeCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, commitCb, cancelCb, removeCb } = { ...props };
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const positionOptions: SelectOption[] = [
  { value: '1', label: 'Above' },
  { value: '-1', label: 'Below' }
];
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb" :removeCb="removeCb"
    :initialPosition="initialPosition" :classes="'text-center mw-40 nw-40'">
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('line')" :initialValue="line" :precision="0" label="Line"
          :changeCb="(value: number) => updateNumberCb('line', value)" :inline="true" />
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-12">
        <selectComp :domId="getId('position')" :label="'Position'" :selections="positionOptions"
          :initialValue="String(position)" :changeCb="(value: string) => updateNumberCb('position', parseInt(value, 10))" />
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-9">
        <input type="text" class="form-control" :id="getId('text')" :value="text"
          @change="($event) => updateTextCb('text', ($event.target as HTMLInputElement).value)">
      </div>
      <div class="col col-3 text-start">
        <span :id="getId('text-label')">Text</span>
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-9">
        <input type="text" class="form-control" :id="getId('superscript')" :value="superscript"
          @change="($event) => updateTextCb('superscript', ($event.target as HTMLInputElement).value)">
      </div>
      <div class="col col-3 text-start">
        <span :id="getId('superscript-label')">SubText</span>
      </div>
    </div>
  </dialogContainer>
</template>
