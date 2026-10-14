<script setup lang="ts">
import { ref, Ref, computed } from 'vue';
import { ButtonDefinition } from '../../buttons/button';
import buttonComp  from './sidebarButtons.vue';
import { formatScoreTitle } from '../../../render/sui/scoreChangeState';
interface Props {
  domId: string,
  buttonProps: ButtonDefinition[],
  scoreName: Ref<string>,
  scoreChanged: Ref<boolean>
}
const props = defineProps < Props > ();
const buttonProps = props.buttonProps;
const domId = props.domId;
// Name of the open score.  The unsaved-changes asterisk is a separate element, so it stays
// visible when a long name is truncated.
const scoreTitle = computed(() => formatScoreTitle(props.scoreName.value, false));
const scoreChanged = computed(() => props.scoreChanged.value);
const getId = (str: string) => `${domId}-${str}`;
const getClasses = (btnProps: ButtonDefinition) => `${btnProps.icon} ${btnProps.classes}`;
const imageLoc = '../../../styles/images/logo.png';
</script>
<template>
   <div class="side-brand">
     <img :src="imageLoc" width="24" height="24">
     <span>Smoosic</span>
     <span class="side-score" :title="scoreTitle">{{ scoreTitle }}</span>
     <span v-if="scoreChanged" class="side-changed" title="Unsaved changes" aria-label="Unsaved changes">*</span>
  </div>
  <div class="side-group" role="group" :id="domId">
    <buttonComp v-for="props in buttonProps" :buttonProps="props" :domId="getId(props.id)" :key="props.id">
    </buttonComp>
  </div>
</template>