<script setup lang="ts">
import { ref, toRef, watch } from 'vue';
interface Props {
  domId: string,
  precision: number,
  minValue?: number,
  maxValue?: number,
  width?: number,
  initialValue: number,
  inline?: boolean,
  disabled?: boolean,
  percent?: boolean,
  label?: string,
  changeCb: (value: number) => Promise<void>
}
const props = defineProps<Props>();
const label = props.label ?? '';
const value = ref(props.initialValue);
const inline = props.inline ?? false;
let minValue: number = props.minValue ?? 0;
let maxValue: number = props.maxValue ?? 99999;
// If percent is set,  treat values 0-1 as 0-100.  Adjust for callback when local value is changed.
const percent = props.percent ?? false;
if (percent) {
  value.value = Math.round(value.value * 100);
  if (props.minValue === undefined) {
    minValue = 0;
  }
  if (props.maxValue === undefined) {
    maxValue = 1;
  }
  minValue = minValue * 100;
  maxValue = maxValue * 100;
}
const getId = (str: string) => {
  return `${props.domId}-${str}`;
}
const disabled = toRef(props, 'disabled');
const roundValue = () => {
  value.value = Math.round(value.value * Math.pow(10, props.precision)) / Math.pow(10, props.precision);
  value.value = Math.min(Math.max(value.value, minValue), maxValue);
}
watch(() => props.initialValue, (newVal) => {
  if (percent) {
    value.value = Math.round(newVal * 100);
  } else {
    value.value = newVal;
  }
});
const increment = (sign: number) => {
  if (sign > 0) {
    value.value += Math.pow(10, -props.precision);
  } else {
    value.value -= Math.pow(10, -props.precision);
  }
  roundValue();
  const cbVal = percent ? value.value / 100 : value.value;
  props.changeCb(cbVal);
}
const handleChange = () => {
  roundValue();
  const cbVal = percent ? value.value / 100 : value.value;
  props.changeCb(cbVal);
}
roundValue();
</script>
<template>
  <div :class="{'grow-row': !inline, 'inline-row': inline }">
    <span :class="{ hide: label.length === 0 }" class="axis">{{ label }}</span>
    <div class="num">
      <div class="num-field w-sm">
        <input :disabled="disabled" v-model="value" @change="handleChange" :id="getId('text')" />
      </div>
      <div class="num-spin">
        <div @click.prevent="increment(1)" :id="getId('incButton')" class="num-btn" role="button" :disabled="disabled">
          <span class="caret caret-up"></span>
        </div>
        <div @click.prevent="increment(-1)" :disabled="disabled" class="num-btn" role="button" :id="getId('decButton')">
          <span class="caret caret-down"></span>
        </div>
      </div>
    </div>
  </div>
</template>