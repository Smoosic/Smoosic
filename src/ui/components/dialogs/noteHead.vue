<script setup lang="ts">
import dialogContainer from './dialogContainer.vue';
import { DialogButtonDefinition } from '../../buttons/button';
import buttonGroup from './buttonGroup.vue';
import collapsableRow from './collapsableRow.vue';
import { ref, Ref } from 'vue';
interface Props {
  domId: string,
  shapes: DialogButtonDefinition[],
  heads: DialogButtonDefinition[],
  stems: DialogButtonDefinition[],
  commitCb: () => Promise<void>,
  cancelCb: () => Promise<void>
}
const props = defineProps<Props>();
const { domId, shapes, heads, stems, commitCb, cancelCb } = { ...props };
const getId = (str: string) => {
  return `${domId}-${str}`;
}


</script>
<template>
  <dialogContainer :domId="domId" :label="'Note Heads and Stems'" :commitCb="commitCb" :cancelCb="cancelCb" :classes="'container'">
      <div class="row">
        <buttonGroup :label="'Head Shapes'" :buttonDefs="shapes" :domId="getId('shape-buttons')"
          :commonClasses="'btn btn-sm btn-outline-dark me-2'" />
      </div>
      <div class="row nw-50">
        <buttonGroup :label="'Heads'" :buttonDefs="heads" :domId="getId('head-buttons')"
          :commonClasses="'btn btn-sm btn-outline-dark me-2'" />
      </div>
      <div class="row ">
        <buttonGroup :label="'Note Stems'" :buttonDefs="stems" :domId="getId('stem-buttons')"
          :commonClasses="'btn btn-sm btn-outline-dark py-0  me-2'" />
      </div>
      <collapsableRow :domId="getId('notehead-help')" label="" hint="Help" :initialState="false">
        <span class="text-muted">Use R to toggle note to rest. Use &lt;Delete&gt; to toggle visibility.</span>
        <span class="text-muted">Use keyboard shortcuts when available - they are much faster!</span>
      </collapsableRow>
   </dialogContainer>
</template>