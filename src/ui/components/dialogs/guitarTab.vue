<script setup lang="ts">
import numberInput from './numberInput.vue';
import { Pitch } from '../../../smo/data/common';
import { SmoMusic } from '../../../smo/data/music';
import { SmoTabStave } from '../../../smo/data/staffModifiers';
import { ref, reactive } from 'vue';
import dialogContainer from './dialogContainer.vue';
import toggle from './toggle.vue';
type cbtype = () => Promise<void>;
interface Props {
  domId: string,
  label: string,
  tabStave: SmoTabStave,
  removeCb?: cbtype | undefined,
  updatePitchesCb: (pitch: Pitch[]) => Promise<void>,
  changeLineDistanceCb: (lines: number) => Promise<void>,
  toggleStemsCb: () => Promise<void>,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, tabStave, updatePitchesCb, changeLineDistanceCb, toggleStemsCb, commitCb, cancelCb } = props;
const pitches = reactive(JSON.parse(JSON.stringify(tabStave.stringPitches)));
const changePitch = async (xix: string | number, direction: number) => {
  const ix = parseInt(xix.toString(), 10);
  const pit = SmoMusic.smoPitchToInt(pitches[ix]);
  const newPit = SmoMusic.smoIntToPitch(pit + direction);
  pitches[ix].letter = newPit.letter;
  pitches[ix].octave = newPit.octave;
  pitches[ix].accidental = newPit.accidental;
  await updatePitchesCb(pitches);
}
const deletePitch = async (xix: string | number) => {
  const ix = parseInt(xix.toString(), 10);
  pitches.splice(ix, 1);
  await updatePitchesCb(pitches);
}
const showStems = ref(tabStave.showStems);
const reset = async () => {
  pitches.splice(0);
  const np: Pitch[] = SmoTabStave.defaultStringPitches.sort((a, b) => SmoMusic.smoPitchToInt(b) - SmoMusic.smoPitchToInt(a));
  np.forEach((p) => {
    pitches.push(JSON.parse(JSON.stringify(p)));
  });
  await updatePitchesCb(pitches);
}
const getId = (str: string) => {
  return `${domId}-${str}`;
}
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb" :removeCb="removeCb"
    :classes="'text-center mw-30'">
    <div class="row mb-2">
      <div class="col col-7">
        <numberInput :maxValue="20" :minValue="5" :initialValue="tabStave.spacing" :precision="0"
          :domId="getId('linesInput')" :changeCb="changeLineDistanceCb" :width="25" />
        <span> Line Height </span>
      </div>
      <div class="col col-5 ms-n2 px-0">
        <button class="btn btn-sm btn-outline-dark" @click.prevent="reset">
          <span class="icon-smo icon-refresh"></span> Reset </button>
      </div>
    </div>
    <div class="row ms-2 me-2 align-items-center">
      <div class="col col-2">
        <span class="fs-6 pe-1"> String </span>
      </div>
      <div class="col col-2">
        <span class="fs-6 pe-1"> Remove </span>
      </div>
      <div class="col col-8 justify-content-center d-flex ps-5">
        <span class="fs-6"> Pitches </span>
      </div>
    </div>
    <div class="row ms-2 me-2 align-items-center border-bottom mb-2" v-for="(pitch, ix) in pitches">
      <div class="col col-2">
        <span class="fs-5 pe-1"> {{ (parseInt(ix as string) + 1) }}</span>
      </div>
      <div class="col col-2">
        <button class="btn btn-sm number-click px-1 btn-square" :class="{ hide: pitches.length < 2 }"
          @click.prevent="deletePitch(ix)">
          <span class="icon-smo icon-cross"></span>
        </button>
      </div>
      <div class="col col-3 me-n4">
        <button @click.prevent="changePitch(ix, 1)" :id="getId('incButton')"
          class="btn btn-sm btn-outline-dark btn-square px-1 mb-1 number-click">
          <span class="smo-icon icon-circle-up fs-6"></span>
        </button>
        <button @click.prevent="changePitch(ix, -1)"
          class="btn btn-sm btn-outline-dark btn-square px-1 mb-1 number-click" :id="getId('decButton')">
          <span class="smo-icon icon-circle-down fs-6"></span>
        </button>
      </div>
      <div class="col col-5 d-flex justify-content-around ms-n4">
        <span class="fs-5">{{ pitch.letter }}
        </span>
        <span class="fs-5" :class="{ hide: pitch.accidental === 'n' }"> {{ pitch.accidental }}
        </span>
        <span class="fs-5"> {{ pitch.octave }}</span>
      </div>
    </div>
    <div class="row ms-2 me-2 align-items-center">
      <div class="col col-4">
        <toggle :domId="getId('toggleStems')" :label="'Show Stems'" :initialValue="showStems"
          :changeCb="(value: boolean) => { showStems = value; toggleStemsCb(); }" />
      </div>
      <div class="col col-8"></div>
    </div>
  </dialogContainer>
</template>