<script setup lang="ts">
import { ref, toRef, watch, onMounted, reactive } from 'vue';
import { default as tsNumberInput } from './tsNumberInput.vue';
import { TimeSignatureTime } from  '../../../smo/data/measureModifiers';
interface Props {
  domId: string,
  index: number,
  label: string,
  timeSignature: TimeSignatureTime,
  updateTimeSignatureCb: (mf: TimeSignatureTime, index: number) => Promise<void>,
}
const props = defineProps<Props>();
const id = (str: string) => `${props.domId}-${str}`;
const index = props.index;
const numerator = ref(props.timeSignature.actualBeats);
const denominator = ref(props.timeSignature.beatDuration);
const numCb =  (async  (newValue: number) => {
  const time = {   actualBeats: newValue,
      beatDuration: denominator.value };
  await props.updateTimeSignatureCb(time, index);
  numerator.value = newValue;
});
const denCb =  (async  (newValue: number) => {
  const time = {   actualBeats: numerator.value,
      beatDuration: newValue };
  await props.updateTimeSignatureCb(time, index);
  denominator.value = newValue;
});
</script>
<template>
  <div class="row justify-content-center my-1">
    <div class="btn border-0 m-0 p-0 flex-column ts-num">
      <tsNumberInput :domId="id('num')" :minValue="1" :maxValue="24" :initialValue="numerator" :denominator="false"
        :changeCb="numCb" />
      <tsNumberInput :domId="id('den')" :minValue="1" :maxValue="16" :initialValue="denominator" :denominator="true"
          :changeCb="denCb" />
    </div>
  </div>
</template>