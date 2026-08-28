<script setup lang="ts">
import numberInputApp from './numberInput.vue';
import toggle from './toggle.vue';
import dialogContainer from './dialogContainer.vue';

interface Props {
  domId: string,
  label: string,
  numNotes: number,
  notesOccupied: number,
  ratioed: boolean,
  bracketed: boolean,
  updateFieldCb: (param: 'numNotes' | 'notesOccupied' | 'ratioed' | 'bracketed', value: number | boolean) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, commitCb, cancelCb } = { ...props };
const getId = (str: string) => {
  return `${domId}-${str}`;
}
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb"
    :classes="'text-center mw-40 nw-40'">
    <div class="group">
      <div class="grow-row">
        <numberInputApp :domId="getId('num-notes')" :initialValue="numNotes" :precision="0" :minValue="1"
          label="Num of notes" :changeCb="(value: number) => updateFieldCb('numNotes', value)" :inline="true" />
        <numberInputApp :domId="getId('notes-occupied')" :initialValue="notesOccupied" :precision="0" :minValue="1"
          label="Notes occupied" :changeCb="(value: number) => updateFieldCb('notesOccupied', value)" :inline="true" />
      </div>
    </div>
    <div class="row justify-content-start mb-2">
      <div class="checkbox-input-toggle-div">
        <toggle :domId="getId('ratioed')" :label="'Ratioed'" :initialValue="ratioed"
          :changeCb="(value: boolean) => updateFieldCb('ratioed', value)" />
      </div>
      <div class="checkbox-input-toggle-div">
        <toggle :domId="getId('bracketed')" :label="'Bracketed'" :initialValue="bracketed"
          :changeCb="(value: boolean) => updateFieldCb('bracketed', value)" />
      </div>
    </div>
  </dialogContainer>
</template>
