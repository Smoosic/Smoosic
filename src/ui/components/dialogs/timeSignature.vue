<script setup lang="ts">
import { ref, toRef, Ref, watch, reactive, computed, toDisplayString } from 'vue';
import { default as tsComponent } from './tsComponent.vue';
import {
  TimeSignatureTime, SmoTimeSignature
} from '../../../smo/data/measureModifiers';
import dialogContainer from './dialogContainer.vue';
import toggle from './toggle.vue';
import { SelectOption } from '../../common';
import selectComp from './select.vue';

interface Props {
  domId: string,
  label: string,
  timeSignature: Ref<SmoTimeSignature>,
  updateTimeSignatureCb: (mf: SmoTimeSignature) => Promise<void>,
  updateApplyTo: (value: string) => Promise<void>,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, commitCb, cancelCb, } = { ...props };

const timeSignature = props.timeSignature;
watch(timeSignature, () => {
  console.log('changed!');
})
const isCompound: Ref<boolean> = ref(false);
isCompound.value = timeSignature.value.times.length > 1;
watch(isCompound, async (newValue, oldValue) => {
  if (newValue === oldValue) {
    return;
  }
  if (newValue) {
    const ts = new SmoTimeSignature(timeSignature.value);
    ts.times.push({ actualBeats: 4, beatDuration: 4})
    await props.updateTimeSignatureCb(ts);
  } else {
    const ts = new SmoTimeSignature(timeSignature.value);
    ts.times = [ts.times[0]];
    await props.updateTimeSignatureCb(ts);
  }
});
const updateTime = async (time: TimeSignatureTime, index: number): Promise<void> => {
  const ts = new SmoTimeSignature(timeSignature.value);
  ts.times[index] = time;
  await props.updateTimeSignatureCb(ts);
}


const applyToOptions: SelectOption[] = [{
  value: "Score",
  label: 'Score'
}, {
  value: "Selected",
  label: 'Selected Measures'
}, {
  value: "Remaining",
  label: 'Remaining Measures'
}];
const applyTo: Ref<string> = ref('Selected');


const display: Ref<boolean> = ref(false);
display.value = timeSignature.value.display;
watch(display, async (newValue: boolean  , oldValue: boolean) => {
  if (newValue === oldValue) {
    return;
  }
  const ts = new SmoTimeSignature(timeSignature.value);
  ts.display = newValue;
  await props.updateTimeSignatureCb(ts);
});

const displayString: Ref<string> = ref('');
displayString.value = timeSignature.value.displayString;
watch(displayString, async (newValue: string, oldValue: string) => {
  if (newValue === oldValue) {
    return;
  }
  const ts = new SmoTimeSignature(timeSignature.value);
  ts.displayString = newValue;
  await props.updateTimeSignatureCb(ts);
});

const getTsLabel = (ix: number) => {
  return ix === 0 ? 'Time' : 'Compound';
}
const useSymbol: Ref<boolean> = ref(false);
useSymbol.value = timeSignature.value.useSymbol;
watch(useSymbol, async (newValue: boolean, oldValue: boolean) => {
  if (newValue === oldValue) {
    return;
  }
  const ts = new SmoTimeSignature(timeSignature.value);
  ts.useSymbol = newValue;
  await props.updateTimeSignatureCb(ts);
});

const supportsSymbol = computed(() => {
  if (timeSignature.value.times.length > 1) {
    return false;
  }
  if (timeSignature.value.actualBeats === 4 && timeSignature.value.beatDuration === 4) {
    return true;
  }
  if (timeSignature.value.actualBeats === 2 && timeSignature.value.beatDuration === 2) {
    return true;
  }
  return false;
})
const getId = (str: string) => {
  return `${props.domId}-${str}`;
}
</script>

<template>
  <dialogContainer :domId="domId" :label="label" :cancelCb="cancelCb" :commitCb="commitCb"
    class="mw-40 nw-40">
    <div class="toggles">
      <div class="tgl-row">
        <toggle :domId="getId('use-symbol')" :label="'Use Symbol'" :disabled="!supportsSymbol" :initialValue="useSymbol"
          :changeCb="(value: boolean) => { useSymbol = value }" />
      </div>
      <div class="tgl-row">
        <toggle :domId="getId('display-ts')" :label="'Display Time Signature'" :initialValue="display"
          :changeCb="(value: boolean) => { display = value }" />
      </div>
      <div class="tgl-row">
        <toggle :domId="getId('display-compound')" :label="'Compound Time Signature'" :initialValue="isCompound"
          :changeCb="(value: boolean) => { isCompound = value }" />
      </div>
    </div>
    <div class="row justify-content-center">
      <div class="col col-2" v-for="(time, index) in timeSignature.times">
        <tsComponent :domId="getId(`tscomp-${index}`)" :index="index" :label="getTsLabel(index)"
          :timeSignature="time" :updateTimeSignatureCb="updateTime"></tsComponent>
      </div>
    </div>
    <div class="sect">
      <div class="sect-body">
        <div>
          <span class="spec-name">Alternate display string (for pickups)</span>
        <input type="text" class="form-control form-control-sm" v-model="displayString" :id="getId('display-string')" />
        </div>
        <selectComp :domId="getId('page-size-select')" :label="'Apply To:'" :selections="applyToOptions" :initialValue="applyTo"
          :changeCb="props.updateApplyTo" />
      </div>
    </div>
  </dialogContainer>
</template>