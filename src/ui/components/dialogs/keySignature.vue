<script setup lang="ts">
import selectComp from './select.vue';
import dialogContainer from './dialogContainer.vue';
import { SelectOption } from '../../common';

interface Props {
  domId: string,
  label: string,
  smoKey: string,
  applyTo: string,
  updateFieldCb: (param: 'key' | 'applyTo', value: string) => void,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, label, commitCb, cancelCb } = { ...props };
const getId = (str: string) => {
  return `${domId}-${str}`;
}
const keyOptions: SelectOption[] = [
  { value: 'c', label: 'C Major' },
  { value: 'f', label: 'F Major' },
  { value: 'g', label: 'G Major' },
  { value: 'bb', label: 'Bb Major' },
  { value: 'd', label: 'D Major' },
  { value: 'eb', label: 'Eb Major' },
  { value: 'a', label: 'A Major' },
  { value: 'ab', label: 'Ab Major' },
  { value: 'e', label: 'E Major' },
  { value: 'db', label: 'Db Major' },
  { value: 'b', label: 'B Major' },
  { value: 'f#', label: 'F# Major' },
  { value: 'c#', label: 'C# Major' },
  { value: 'gb', label: 'Gb Major' }
];
const applyToOptions: SelectOption[] = [
  { value: 'selections', label: 'Current Selections' },
  { value: 'remaining', label: 'Future Measures' },
  { value: 'all', label: 'Full Score' }
];
</script>
<template>
  <dialogContainer :domId="domId" :label="label" :commitCb="commitCb" :cancelCb="cancelCb"
    :classes="'text-center mw-40 nw-40'">
    <div class="row mb-2">
      <div class="col col-12">
        <selectComp :domId="getId('key')" :label="'Tempo Mode'" :selections="keyOptions"
          :initialValue="smoKey" :changeCb="(value: string) => updateFieldCb('key', value)" />
      </div>
    </div>
    <div class="row mb-2">
      <div class="col col-12">
        <selectComp :domId="getId('apply-to')" :label="'Apply to:'" :selections="applyToOptions"
          :initialValue="applyTo" :changeCb="(value: string) => updateFieldCb('applyTo', value)" />
      </div>
    </div>
  </dialogContainer>
</template>
