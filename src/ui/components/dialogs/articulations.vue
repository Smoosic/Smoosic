<script setup lang="ts">
import { DialogButtonDefinition } from '../../buttons/button';
import buttonGroup from './buttonGroup.vue';
import { SelectOption } from '../../common';
import selectComp from './select.vue';
import { ref } from 'vue';
import dialogContainer from './dialogContainer.vue';

interface Props {
  domId: string,
  articulations: DialogButtonDefinition[],
  positionChangeCb: (value: string) => void,
  initialValue: string,
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, articulations, commitCb, cancelCb } = { ...props };
const positions: SelectOption[] = [
  { label: 'Above Note', value: 'above' },
  { label: 'Below Note', value: 'below' },
  { label: 'Auto', value: 'auto' }
];
const getId = (str: string) => {
  return `${domId}-${str}`;
}
</script>
<template>
  <dialogContainer :domId="domId" label="Articulations" :commitCb="commitCb" :cancelCb="cancelCb"
    :classes="'text-center nw-30'">
    <div class="row w-40">
      <buttonGroup :label="'Glyph'" :buttonDefs="articulations" :domId="getId('shape-buttons')"
        :commonClasses="'btn btn-sm btn-outline-dark me-2'" />
    </div>
    <div class="row align-items-center">
      <div class="col col-2 float-end pe-0">
        <span class="float-end" :for="getId('clef-select')">Position</span>
      </div>
      <div class="col col-4 text-start">
        <selectComp :domId="getId('art-select')" label="" :initialValue="initialValue" :selections="positions"
          :changeCb="positionChangeCb" />
      </div>
    </div>
  </dialogContainer>
</template>