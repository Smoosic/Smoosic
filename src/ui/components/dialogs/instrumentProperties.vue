<script setup lang="ts">
import { SelectOption } from '../../common';
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
  getInstrument: () => SmoInstrument,
  applyToInitial: string,
  updateApplyToCb: (value: string) => Promise<void>,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
};
const props = defineProps<Props>();

const { domId, getInstrument } = { ...props };
const applyToOptions: SelectOption[] = [{
  value: "Score",
  label: 'Score'
}, {
  value: "Selected",
  label: 'Selected Measures'
}, {
  value: "Remaining",
  label: 'Remaining Measures'
}]
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

const applyTo = ref(props.applyToInitial);
type numberParams = 'lines' | 'keyOffset';

const updateNumberCb = (param: numberParams) => {
  const cb = async (value: number) => {
    (instrument as any)[param] = value;
  }
  return cb;
}
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
      <div class="row mb-2 ms-2 align-items-center">
        <div class="col col-12 mb-2">
          <selectComp :domId="getId('instrument-select')" :label="'Sound'" :selections="instrumentChoices"
            :initialValue="instrument.instrument" :changeCb="updateInstrumentCb" />
        </div>
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
      <div class="group">
        <div class="grow-row">
          <numberInputApp :domId="getId('stafflines')" :initialValue="instrument.lines" :precision="0"
            :changeCb="updateNumberCb('lines')" label="Staff Lines" :inline="true" />
          <numberInputApp :domId="getId('keyOffset')" :initialValue="instrument.keyOffset" :precision="0"
            :changeCb="updateNumberCb('keyOffset')" label="Transpose 1/2 Steps" :inline="true"/>
        </div>
      </div>
      <div class="row mb-2 align-items-center">
        <div class="col col-12">
          <selectComp :domId="getId('page-size-select')" :selections="applyToOptions"
            :initialValue="applyTo" :changeCb="updateApplyToCb" label="Apply To"/>
        </div>
      </div>
    </dialogContainer>
  </template>