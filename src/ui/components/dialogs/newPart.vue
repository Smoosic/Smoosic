<script setup lang="ts">
import { instrumentChoices, instrumentLabelFor } from '../../dialogs/createPartHelpers';
import { IsClef } from '../../../smo/data/common';
import { SmoInstrument, SmoInstrumentNumParamType, SmoInstrumentStringParamType } from '../../../smo/data/staffModifiers';
import selectComp from './select.vue';
import dialogContainer from './dialogContainer.vue';
import numberInputApp from './numberInput.vue';
import toggle from './toggle.vue';
import { computed, ref, Ref, reactive, watch } from 'vue';
interface Props {
  domId: string,
  label: string,
  staffLength: number,
  getInstrument: () => SmoInstrument,
  addStaveCb: () => Promise<void>,
  setStaffId: (staffId: number) => void,
  setName: (value: string) => void,
  setAbbreviation: (value: string) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
};
const props = defineProps<Props>();

const { domId, getInstrument } = { ...props };

const updateInsertLocation = async (loc: number) => {
  props.setStaffId(loc);
}
const clefOptions = [{
  value: 'treble',
  label: 'Treble'
}, {
  value: 'bass',
  label: 'Bass'
}, {
  value: 'tenor',
  label: 'Tenor'
}, {
  value: 'alto',
  label: 'Alto'
}, {
  label: 'Percussion',
  value: 'percussion'
}]
const instrument: SmoInstrument = getInstrument();
type numberParams = 'lines' | 'keyOffset';
const updateNumberCb = (param: numberParams) => {
  const cb = async (value: number) => {
    (instrument as any)[param] = value;
  }
  return cb;
}
const addStave: Ref<boolean> = ref(false);
const usePercussionSymbols = ref(instrument.usePercussionNoteheads ?? false);
watch(usePercussionSymbols, (newVal) => {
  instrument.usePercussionNoteheads = newVal;
});
// The instrument is not reactive, so keep the chosen one here for the Name placeholder.
const currentInstrument: Ref<string> = ref(instrument.instrument);
const namePlaceholder = computed(() => instrumentLabelFor(currentInstrument.value));
const partName: Ref<string> = ref('');
const partAbbreviation: Ref<string> = ref('');
watch(partName, (newVal) => {
  props.setName(newVal);
});
watch(partAbbreviation, (newVal) => {
  props.setAbbreviation(newVal);
});
const updateInstrumentCb = async (value: string) => {
  instrument.instrument = value;
  currentInstrument.value = value;
  if (typeof (SmoInstrument.instrumentKeyOffset[value]) === 'number') {
    instrument.keyOffset = SmoInstrument.instrumentKeyOffset[value];
  }
}
const showPercussionSymbols = computed(() => {
  return instrument.instrument === 'percussion';
});
const updateClefCb = async (value: string) => {
  if (IsClef(value)) {
    instrument.clef = value;
  }
}
const getId = (str: string) => {
  return `${domId}-${str}`;
}

</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="props.commitCb" :cancelCb="props.cancelCb">
    <div class="row mb-2">
      <div class="col col-12 fs-5 text-center">
        <div class="text-center">Initial Instrument </div>
        <div class="text-center fs-6">(can be changed later)</div>
      </div>
    </div>
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col col-12 mb-2">
          <selectComp :domId="getId('instrument-select')" :label="'Sound'" :selections="instrumentChoices"
            :initialValue="instrument.instrument" :changeCb="updateInstrumentCb" />
        </div>
        </div>
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col col-12 mb-2">
          <selectComp :domId="getId('clef-select')" :label="'Clef'" :selections="clefOptions"
            :initialValue="instrument.clef" :changeCb="updateClefCb" />
        </div>
        </div>
      <div class="row mb-2" :class="{ hide: !showPercussionSymbols }">
        <div class="col col-12">
          <toggle :domId="getId('font-weight')" :label="'Use Percussion Symbols'" :initialValue="usePercussionSymbols"
            :changeCb="(value: boolean) => { usePercussionSymbols = value }" />
        </div>
      </div>
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col col-3 text-start"><label :for="getId('part-name')">Name</label></div>
        <div class="col col-9">
          <input type="text" class="form-control" :id="getId('part-name')" v-model="partName"
            :placeholder="namePlaceholder" />
        </div>
      </div>
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col col-3 text-start"><label :for="getId('part-abbreviation')">Abbreviation</label></div>
        <div class="col col-9">
          <input type="text" class="form-control" :id="getId('part-abbreviation')" v-model="partAbbreviation" />
        </div>
      </div>
      <!-- counted from 1; one more than the number of staves is after the last staff -->
      <div class="group">
          <numberInputApp :domId="getId('staffId')" :initialValue="props.staffLength + 1" :precision="0"
             :maxValue="props.staffLength + 1" :minValue="1" label="Staff Location"
            :changeCb="updateInsertLocation"></numberInputApp>
      </div>
      <div class="group">
          <numberInputApp :domId="getId('stafflines')" :initialValue="instrument.lines" :precision="0"
            :changeCb="updateNumberCb('lines')" label="Staff Lines"></numberInputApp>
      </div>
      <div class="group">
          <numberInputApp :domId="getId('keyOffset')" :initialValue="instrument.keyOffset" :precision="0"
            :changeCb="updateNumberCb('keyOffset')" label="Transpose 1/2 Steps"></numberInputApp>
      </div>
      <div class="row mb-2 mt-2">
        <div class="col col-4">
        <toggle :domId="getId('toggleStems')" :label="'2-Stave part'" :initialValue="addStave"
          :changeCb="(value: boolean) => { addStave = value; addStaveCb(); }" />
        </div>
      </div>
    </dialogContainer>
  </template>