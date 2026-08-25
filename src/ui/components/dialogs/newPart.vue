<script setup lang="ts">
import { SelectOption } from '../../common';
import { IsClef } from '../../../smo/data/common';
import { SmoInstrument, SmoInstrumentNumParamType, SmoInstrumentStringParamType } from '../../../smo/data/staffModifiers';
import selectComp from './select.vue';
import dialogContainer from './dialogContainer.vue';
import numberInputApp from './numberInput.vue';
import { computed, ref, Ref, reactive, watch } from 'vue';
interface Props {
  domId: string,
  label: string,
  staffLength: number,
  getInstrument: () => SmoInstrument,
  addStaveCb: () => Promise<void>,
  setStaffId: (staffId: number) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
};
const props = defineProps<Props>();

const { domId, getInstrument } = { ...props };

const updateInsertLocation = async (loc: number) => {
  props.setStaffId(loc);
}
const instrumentChoices: SelectOption[] = [{
  value: 'piano',
  label: 'Grand Piano'
}, {
  value: 'electricPiano',
  label: 'Electric Piano'
}, {
  value: 'accordion',
  label: 'Accordion'
}, {
  value: 'piano',
  label: 'Grand Piano'
}, {
  value: 'bass',
  label: 'Bass (bowed)'
}, {
  value: 'jazzBass',
  label: 'Bass (plucked)'
}, {
  value: 'eGuitar',
  label: 'Electric Guitar'
}, {
  value: 'cello',
  label: 'Cello'
}, {
  value: 'violin',
  label: 'Violin'
}, {
  value: 'trumpet',
  label: 'Bb Trumpet'
}, {
  value: 'horn',
  label: 'F Horn'
}, {
  value: 'trombone',
  label: 'Trombone'
}, {
  value: 'tuba',
  label: 'Tuba'
}, {
  value: 'clarinet',
  label: 'Bb Clarinet'
}, {
  value: 'flute',
  label: 'Flute'
}, {
  value: 'altoSax',
  label: 'Eb Alto Sax'
}, {
  value: 'tenorSax',
  label: 'Bb Tenor Sax'
}, {
  value: 'bariSax',
  label: 'Eb Bari Sax'
}, {
  value: 'pad',
  label: 'Synth Pad'
}, {
  value: 'percussion',
  label: 'Percussion'
}, {
  value: 'none',
  label: 'None'
}];
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
const updateInstrumentCb = async (value: string) => {
  instrument.instrument = value;
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
          <input class="form-check-input me-2" type="checkbox" v-model="usePercussionSymbols"
            :id="getId('font-weight')"></input>
          <label class="form-check-label" :for="getId('font-weight')">Use Percussion Symbols</label>
        </div>
      </div>
      <div class="group">
          <numberInputApp :domId="getId('staffId')" :initialValue="props.staffLength - 1" :precision="0"
             :maxValue="props.staffLength" :minValue="1" label="Staff Location"
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
        <input class="form-check-input" type="checkbox" v-model="addStave" :id="getId('toggleStems')"
          @change="addStaveCb"></input>
        <label class="form-check-label ps-2" :for="getId('toggleStems')"> 2-Stave part </label>
        </div>
      </div>
    </dialogContainer>
  </template>