<script setup lang="ts">
import numberInputApp from './numberInput.vue';
import selectComp from './select.vue';
import toggle from './toggle.vue';
import dialogContainer from './dialogContainer.vue';
import { SelectOption } from '../../common';

interface Props {
  domId: string,
  label: string,
  tempoMode: string,
  customText: string,
  bpm: number,
  beatDuration: number,
  tempoText: string,
  applyToAll: boolean,
  applyToSelection: boolean,
  display: boolean,
  yOffset: number,
  updateSelectCb: (param: 'tempoMode' | 'tempoText', value: string) => void,
  updateNumberCb: (param: 'bpm' | 'yOffset', value: number) => void,
  updateBeatDurationCb: (value: number) => void,
  updateTextCb: (value: string) => void,
  updateBooleanCb: (param: 'applyToAll' | 'applyToSelection' | 'display', value: boolean) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, commitCb, cancelCb } = { ...props };
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const tempoModeOptions: SelectOption[] = [
  { value: 'duration', label: 'Duration (Beats/Minute)' },
  { value: 'text', label: 'Tempo Text' },
  { value: 'custom', label: 'Specify text and duration' }
];
const beatDurationOptions: SelectOption[] = [
  { value: '4096', label: 'Quarter Note' },
  { value: '2048', label: '1/8 note' },
  { value: '6144', label: 'Dotted 1/4 note' },
  { value: '8192', label: '1/2 note' }
];
const tempoTextOptions: SelectOption[] = [
  { value: 'Larghissimo', label: 'Larghissimo' },
  { value: 'Grave', label: 'Grave' },
  { value: 'Lento', label: 'Lento' },
  { value: 'Largo', label: 'Largo' },
  { value: 'Larghetto', label: 'Larghetto' },
  { value: 'Adagio', label: 'Adagio' },
  { value: 'Adagietto', label: 'Adagietto' },
  { value: 'Andante moderato', label: 'Andante moderato' },
  { value: 'Andante', label: 'Andante' },
  { value: 'Andantino', label: 'Andantino' },
  { value: 'Moderato', label: 'Moderato' },
  { value: 'Allegretto', label: 'Allegretto' },
  { value: 'Allegro', label: 'Allegro' },
  { value: 'Vivace', label: 'Vivace' },
  { value: 'Presto', label: 'Presto' },
  { value: 'Prestissimo', label: 'Prestissimo' }
];
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb"
    :classes="'text-center mw-40 nw-40'">
    <div class="row mb-2">
      <div class="col col-12">
        <selectComp :domId="getId('tempo-mode')" :label="'Tempo Mode'" :selections="tempoModeOptions"
          :initialValue="tempoMode" :changeCb="(value: string) => updateSelectCb('tempoMode', value)" />
      </div>
    </div>
    <div v-if="tempoMode === 'custom'" class="row mb-2">
      <div class="col col-9">
        <input type="text" class="form-control" :id="getId('custom-text')" :value="customText"
          @change="($event) => updateTextCb(($event.target as HTMLInputElement).value)">
      </div>
      <div class="col col-3 text-start">
        <span :id="getId('custom-text-label')">Custom Text</span>
      </div>
    </div>
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('bpm')" :initialValue="bpm" :precision="0" label="Notes/Minute"
          :changeCb="(value: number) => updateNumberCb('bpm', value)" :inline="true" />
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-12">
        <selectComp :domId="getId('beat-duration')" :label="'Unit for Beat'" :selections="beatDurationOptions"
          :initialValue="String(beatDuration)" :changeCb="(value: string) => updateBeatDurationCb(parseInt(value, 10))" />
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-12">
        <selectComp :domId="getId('tempo-text')" :label="'Tempo Text'" :selections="tempoTextOptions"
          :initialValue="tempoText" :changeCb="(value: string) => updateSelectCb('tempoText', value)" />
      </div>
    </div>
    <div class="row justify-content-start mb-2">
      <div class="checkbox-input-toggle-div">
        <toggle :domId="getId('apply-to-all')" :label="'Apply to all future measures?'" :initialValue="applyToAll"
          :changeCb="(value: boolean) => updateBooleanCb('applyToAll', value)" />
      </div>
      <div class="checkbox-input-toggle-div">
        <toggle :domId="getId('apply-to-selection')" :label="'Apply to selection?'" :initialValue="applyToSelection"
          :changeCb="(value: boolean) => updateBooleanCb('applyToSelection', value)" />
      </div>
      <div class="checkbox-input-toggle-div">
        <toggle :domId="getId('display')" :label="'Display Tempo'" :initialValue="display"
          :changeCb="(value: boolean) => updateBooleanCb('display', value)" />
      </div>
    </div>
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('y-offset')" :initialValue="yOffset" :precision="0" label="Y Offset"
          :changeCb="(value: number) => updateNumberCb('yOffset', value)" :inline="true" />
      </div>
    </div>
  </dialogContainer>
</template>
