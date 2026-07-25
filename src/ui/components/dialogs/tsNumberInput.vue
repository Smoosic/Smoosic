<script setup lang="ts">
import { ref, toRef, watch, onMounted, reactive } from 'vue';
interface Props {
domId: string,
minValue?: number,
maxValue?: number,
denominator: boolean,
initialValue: number,
disabled?: boolean,
inputClasses?: string,
buttonClasses?: string,
changeCb: (value: number) => Promise<void>
blurCb?: () => Promise<void>
}
const props = defineProps<Props>();
const digits: string[] = reactive([]);
const numToTsNum: string[] = ['icon-timeSig0', 'icon-timeSig1', 'icon-timeSig2', 'icon-timeSig3', 'icon-timeSig4', 'icon-timeSig5',
  'icon-timeSig6', 'icon-timeSig7', 'icon-timeSig8', 'icon-timeSig9'];

const numToTsNumOnes = ((value: number) => {
  return numToTsNum[value % 10];
});

const numInput = ref(props.initialValue);

const populateDigits = () => {
  if (isNaN(numInput.value)) {
    return;
  }
  let done = false;
  let curVal = numInput.value;
  digits.splice(0);
  while (!done) {
    const digit = curVal % 10;
    digits.push(digit.toString());
    if (curVal < 10) {
      break;
    }
    curVal = Math.round(curVal / 10);
  }
}
const buttonClasses = props.buttonClasses ?? 'btn btn-sm btn-outline-dark btn-square px-1 mb-1 number-click';
const initialValue = ref(props.initialValue);
const inputClasses = props.inputClasses ?? 
  `form-control d-inline-block text-center px-0 py-1 text-align-center number-click`;
let minValue: number = props.minValue ?? 1;
let maxValue: number = props.maxValue ?? 24;
// If percent is set,  treat values 0-1 as 0-100.  Adjust for callback when local value is changed.
const getId = (str: string) => {
  return `${props.domId}-${str}`;
}
const disabled = toRef(props, 'disabled');

watch(initialValue, (newVal) => {
  numInput.value = newVal;
});
const increment = () => {
  if (props.denominator) {
    if (numInput.value * 2 <= maxValue) {
      numInput.value *= 2;
    }
  } else {
    if (numInput.value < maxValue) {
      numInput.value += 1;
    }
  }
}
const decrement = () => {
  if (props.denominator && numInput.value >= 2) {
    numInput.value = Math.round(numInput.value / 2);
  } else {
    if (numInput.value > minValue) {
      numInput.value -= 1;
    }
  }
}
watch (numInput, async (newValue: number, oldValue: number) => {
  if (newValue === oldValue) {
    return;
  }
  populateDigits();
  await props.changeCb(numInput.value);
});
populateDigits();
</script>
<template>
  <div>
  <button @click.prevent="increment()" 
    :id="getId('incButton')"
    :class="buttonClasses"
    :disabled="disabled">
    <span class="smo-icon icon-circle-up fs-6"></span>
    </button>
  <button @click.prevent="decrement()" :disabled="disabled"
    :class="buttonClasses + ' me-2'"
    :id="getId('decButton')">
    <span class="smo-icon icon-circle-down fs-6"></span>
  </button>
  <span class="tsNumber font-bravura">
    <span v-for="digit in digits" :class="numToTsNumOnes(parseInt(digit))" class="icon-bravura"></span>
  </span>
  </div>
</template>