<script setup lang="ts">
import dialogContainer from './dialogContainer.vue';
import selectComp from './select.vue';
import toggleComp from './toggle.vue';
import { ref } from 'vue';
import { SelectOption } from '../../common';

interface Props {
  domId: string,
  label: string,
  initialPosition?: { top: number, left: number },
  symbol: string,
  cardinality: string,
  increment: boolean,
  updateFieldCb: (param: 'symbol' | 'cardinality' | 'increment', value: string | boolean) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>,
  removeCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, commitCb, cancelCb, removeCb } = { ...props };
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const cardinalityOptions: SelectOption[] = [
  { value: 'capitals', label: 'Capitals' },
  { value: 'lowerCase', label: 'Lower case' },
  { value: 'numbers', label: 'Numbers' },
  { value: 'measureNumber', label: 'Measure number' }
];
// The toggle only reads its initial value on creation.  When choosing measure numbers turns
// auto-increment off (the adapter does that in the model), re-key the toggle so it shows 'off'.
const incrementValue = ref(props.increment);
const incrementKey = ref(0);
const onCardinalityChange = (value: string) => {
  props.updateFieldCb('cardinality', value);
  if (value === 'measureNumber' && incrementValue.value) {
    incrementValue.value = false;
    incrementKey.value += 1;
  }
};
const onIncrementChange = (value: boolean) => {
  incrementValue.value = value;
  props.updateFieldCb('increment', value);
};
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb" :removeCb="removeCb"
    :initialPosition="initialPosition" :classes="'text-center mw-40 nw-40'">
    <div class="group">
      <div class="grow-row">
        <label class="form-label" :for="getId('symbol')">Symbol</label>
        <input type="text" class="form-control" :id="getId('symbol')" :value="symbol"
          @input="(ev: Event) => updateFieldCb('symbol', (ev.target as HTMLInputElement).value)" />
      </div>
    </div>
    <div class="group">
      <div class="grow-row">
        <selectComp :domId="getId('cardinality')" label="Numbering" :selections="cardinalityOptions"
          :initialValue="cardinality" :changeCb="onCardinalityChange" />
      </div>
    </div>
    <div class="group">
      <div class="grow-row">
        <toggleComp :key="incrementKey" :domId="getId('increment')" label="Auto increment"
          :initialValue="incrementValue" :changeCb="onIncrementChange" />
      </div>
    </div>
  </dialogContainer>
</template>
