<script setup lang="ts">
import { ref, toRef, Ref, watch, reactive, computed, toDisplayString } from 'vue';
import numberInputApp from './numberInput.vue';
import { default as tsComponent } from './tsComponent.vue';
import {
  TimeSignatureTime, SmoTimeSignature
} from '../../../smo/data/measureModifiers';
import dialogContainer from './dialogContainer.vue';
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
    :classes="'text-center mw-40 nw-40'">
    <div class="row justify-content-start">
      <div class="checkbox-input-column-div">
        <input class="form-check-input" type="checkbox" 
        :disabled="!supportsSymbol"
          v-model="useSymbol" :id="getId('use-symbol')">
        </input>
      </div>
      <div class="checkbox-input-label-div">
        <span class="form-check-label" :for="getId('use-symbol')">Use Symbol</span>
      </div>
      <div class="checkbox-input-column-div">
        <input class="form-check-input" type="checkbox" v-model="display" :id="getId('display-ts')">
        </input>
      </div>
      <div class="checkbox-input-label-div">
        <span class="form-check-label" :for="getId('display-cs')">Display Time Signature</span>
      </div>
    </div>
    <div class="row justify-content-start mb-2">
      <div class="checkbox-input-column-div">
        <input class="form-check-input" type="checkbox" :id="getId('display-compound')" v-model="isCompound">
      </div>
      <div class="checkbox-input-label-div">
        <span class="form-check-label" :for="getId('display-compound')">Compound Time Signature</span>
      </div>
    </div>
    <div class="row justify-content-center">
      <div class="col col-4" v-for="(time, index) in timeSignature.times">
        <tsComponent :domId="getId(`tscomp-${index}`)" :index="index" :label="getTsLabel(index)"
          :timeSignature="time" :updateTimeSignatureCb="updateTime"></tsComponent>
      </div>
    </div>
    <div class="row justify-content-center">
      <div class="col col-4">
        <input type="text" class="form-control form-control-sm" v-model="displayString" :id="getId('display-string')" />
      </div>
      <div class="number-input-label-div col col-8">
        <span class="form-check-lable">Alternate Display String (for pickups)</span>
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-3 text-end">Apply To</div>
      <div class="col col-6">
        <selectComp :domId="getId('page-size-select')" :label="''" :selections="applyToOptions" :initialValue="applyTo"
          :changeCb="props.updateApplyTo" />
      </div>
    </div>
  </dialogContainer>
</template>