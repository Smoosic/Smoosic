<script setup lang="ts">
import { ref, Ref, watch, reactive } from 'vue';
import numberInputApp from './numberInput.vue';
import {
  TimeSignatureTime, SmoTimeSignature
} from '../../../smo/data/measureModifiers';
import dialogContainer from './dialogContainer.vue';
import { SelectOption } from '../../common';
import selectComp from './select.vue';

interface Props {
  domId: string,
  label: string,
  timeSignature: SmoTimeSignature,
  updateTimeSignatureCb: (mf: SmoTimeSignature) => Promise<void>,
  updateApplyTo: (value: string) => Promise<void>,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const durationSelection: SelectOption[] = [{
  value: '2',
  label: '2'
}, {
  value: '4',
  label: '4'
}, {
  value: '8',
  label: '8'
}];

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
const mainBeat = ref(4);
const mainDuration = ref(4);
const altDuration = ref(4);
const altDurationString = ref('4');
const mainDurationString = ref('4');
const altBeat = ref(0);
const isCompound = ref(false);
const durationFromString = (str: string): number => {
  const val = parseInt(str);
  if (str === '2' || str === '4' || str === '8') {
    return val;
  }
  return 4;
}
watch(mainDuration, async (newVal) => {
  if (mainDuration.value === storedTimeSignature.times[0].beatDuration) {
    return;
  }
  storedTimeSignature.times[0].beatDuration = newVal;
  await props.updateTimeSignatureCb(storedTimeSignature);
});
watch(altDuration, async (newVal) => {
  if (storedTimeSignature.times.length === 1) {
    storedTimeSignature.times.push({ actualBeats: altBeat.value, beatDuration: altDuration.value });
  }
  else if (newVal === storedTimeSignature.times[1].beatDuration) {
    return;
  }
  storedTimeSignature.times[1].beatDuration = newVal;
  await props.updateTimeSignatureCb(storedTimeSignature);
});
watch(altBeat, async (newVal) => {
  if (storedTimeSignature.times.length === 1 && newVal > 0) {
    storedTimeSignature.times.push({ actualBeats: newVal, beatDuration: storedTimeSignature.times[0].beatDuration });
  }
  else if (newVal < 1) {
    if (storedTimeSignature.times.length > 1) {
      storedTimeSignature.times.pop();
    }
  }
  else if (storedTimeSignature.times.length > 1 && newVal === storedTimeSignature.times[1].actualBeats) {
    return;
  }
  storedTimeSignature.times[1].actualBeats = newVal;
  await props.updateTimeSignatureCb(storedTimeSignature);
});
watch(mainDurationString, (newVal) => {
  mainDuration.value = durationFromString(newVal);
});
watch(altDurationString, (newVal) => {
  altDuration.value = durationFromString(newVal);
});

const { domId, label, commitCb, cancelCb, } = { ...props };
const useSymbol: Ref<boolean> = ref(props.timeSignature.useSymbol);
const display: Ref<boolean> = ref(props.timeSignature.display);
const displayString: Ref<string> = ref(props.timeSignature.displayString);
const storedTimeSignature = new SmoTimeSignature(props.timeSignature);
if (storedTimeSignature.times.length > 1) {
  isCompound.value = true;
}
const updateMainBeat = async (newVal: number) => {
  mainBeat.value = newVal;
}
const updateMainDurationString = async (newVal: string) => {
  mainDurationString.value = newVal;
}
const updateAltDurationString = async (newVal: string) => {
  altDurationString.value = newVal;
}
const updateAltBeat = async (newVal: number) => {
  if (storedTimeSignature.times.length > 1 && storedTimeSignature.times[1].actualBeats === newVal) {
    return;
  }
  if (newVal <= 1) {
    return;
  }
  if (storedTimeSignature.times.length === 1) {
    storedTimeSignature.times.push({ actualBeats: newVal, beatDuration: storedTimeSignature.times[0].beatDuration });
  } else {
    storedTimeSignature.times[1].actualBeats = newVal;
  }
  props.updateTimeSignatureCb(storedTimeSignature);
}
watch(isCompound, async (newVal: boolean, oldVal: boolean) => {
  if (newVal === oldVal) {
    return;
  }
  if (newVal) {
    altBeat.value = 4;
  } else {
    altBeat.value = 0;
  }
  await props.updateTimeSignatureCb(storedTimeSignature);
});
const getId = (str: string) => {
  return `${props.domId}-${str}`;
}
</script>

<template>
  <dialogContainer :domId="domId" :label="label" :cancelCb="cancelCb" :commitCb="commitCb"
    :classes="'text-center mw-40 nw-40'">
    <div class="row align-items-center">
      <div class="checkbox-input-column-div">
        <input class="form-check-input" type="checkbox" v-model="useSymbol" :id="getId('use-symbol')">
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
    <div class="row align-items-center"> 
      <div class="checkbox-input-column-div">
        <input class="form-check-input" type="checkbox" v-model="isCompound" :id="getId('is-compound')">
        </input>
      </div>
      <div class="checkbox-input-label-div">
        <span class="form-check-label" :for="getId('system-break')">Compound Time</span>
      </div>
    </div>
    <div class="row align-items-center">
      <div class="col col-4">
        <numberInputApp :domId="getId('num-main')" :initialValue="mainBeat" :changeCb="updateMainBeat" :precision="0"
          :width="25" :minValue="1" :maxValue="16" />
      </div>
      <div class="number-input-label-div col col-4">
        <span class="form-check-label">Beats/Measure</span>
      </div>
      <div class="col col-6">
        <selectComp :domId="getId('main-duration')" :label="'Beat Duration'" :selections="durationSelection"
          :initialValue="mainDurationString" :changeCb="updateMainDurationString" />
      </div>
    </div>
    <div class="row align-items-center" :class="{ hide: !isCompound }">
      <div class="col col-4">
        <numberInputApp :domId="getId('num-alt')" :initialValue="altBeat" :changeCb="updateAltBeat" :precision="0"
          :width="25" :minValue="0" :maxValue="16" />
      </div>
      <div class="number-input-label-div col col-4">
        <span class="form-check-label">Compound Beats/Measure</span>
      </div>
      <div class="col col-6">
        <selectComp :domId="getId('alt-duration')" :label="'Beat Duration'" :selections="durationSelection"
          :initialValue="altDurationString" :changeCb="updateAltDurationString" />
      </div>
    </div>
    <div class="row align-items-center">
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