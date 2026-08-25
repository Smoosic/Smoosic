<script setup lang="ts">
import { ref, Ref, watch } from 'vue';
import selectComp from './select.vue';
import { SelectOption } from '../../common';
import dialogContainer from './dialogContainer.vue';

interface Props {
  domId: string,
  enable: any,
  initialValue: string,
  clefChangeCb: (value: string) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, clefChangeCb, enable, initialValue, commitCb, cancelCb } = { ...props };
const clefChange:Ref<string> = ref(initialValue);
const clefChanges:SelectOption[] = [{
  label: 'Treble Clef Staff',
  value: 'treble',
  icon: 'icon-bravura icon-gClef btn end-0'
}, {
  label: 'Bass Clef Staff',
  value: 'bass',
  icon: 'icon-bravura icon-fClef btn end-0'
}, {
  label: 'Alto Clef Staff',
  value: 'alto',
  icon: 'icon-bravura icon-cClef btn end-0'
}, {
  label: 'Tenor',
  value: 'tenor',
  icon: 'icon-bravura icon-gClef btn end-0'
}, {
  label: 'Percussion',
  value: 'percussion',
  icon: 'icon-bravura icon-unpitchedPercussionClef1 btn end-0'
}];
const top = ref(100);
const left = ref(100);

const getId = (str: string) => {
  return `${domId}-${str}`;
}
const handleSelect = (option: string) => {  
  clefChange.value = option;
}
watch(clefChange, (newVal) => {
  clefChangeCb(newVal);
});
</script>
<template>
  <dialogContainer :domId="domId" :label="'Clef Change'" :commitCb="commitCb" :cancelCb="cancelCb" :enable="enable" :classes="'container text-center'">
      <div class="row align-items-baseline" :id="getId('clef-row')">
        <div class="col-12 text-start">
          <selectComp :domId="getId('clef-select')" label="Clef" :initialValue="initialValue"
            :selections="clefChanges" :changeCb="handleSelect" />
        </div>
      </div>
  </dialogContainer>
</template>