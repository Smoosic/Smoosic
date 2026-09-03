<script setup lang="ts">
import { ref } from 'vue';
import { ButtonDefinition } from '../../buttons/button';
import buttonComp  from './menuButtons.vue';
interface Props {
  domId: string,
  buttonProps: ButtonDefinition[]
}
const props = defineProps < Props > ();
const buttonProps = props.buttonProps;
const domId = props.domId;
const getId = (str: string) => `${domId}-${str}`;
const getClasses = (btnProps: ButtonDefinition) => `${btnProps.icon} ${btnProps.classes}`;

</script>
<template>
  <div class="side">
  <div class="side-group" role="group" :id="domId">
    <buttonComp v-for="props in buttonProps" :buttonProps="props" :domId="getId(props.id)" :key="props.id">
    </buttonComp>
  </div>
  </div>
</template>